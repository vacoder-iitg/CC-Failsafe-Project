from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import pandas as pd
import numpy as np
import io
import base64
import shap
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

import models
from dependencies import get_db, get_current_user_id
from ml_utils import (
    model_reg, model_clf, model_features, explainer,
    preprocess_features, get_risk_tier, FEATURE_LABELS
)

router = APIRouter()

@router.get("/class/insights")
def get_class_insights(db: Session = Depends(get_db), teacher_id: str = Depends(get_current_user_id)):
    students = db.query(models.Student).filter(models.Student.teacher_id == teacher_id).all()
    if not students:
        return {"avg_g1": 0, "avg_g2": 0, "avg_pred_g3": 0, "avg_absences": 0, "shap_graph_base64": None, "metric_plots": {}}
    
    avg_g1 = round(sum(s.G1 for s in students) / len(students), 1)
    avg_g2 = round(sum(s.G2 for s in students) / len(students), 1)
    avg_absences = round(sum(s.absences for s in students) / len(students), 1)
    
    avg_pred_g3 = 0
    shap_graph_base64 = None
    decision_plot_base64 = None
    metric_plots = {}
    engineered_metrics = {}
    
    if model_reg and model_clf and model_features is not None and explainer is not None:
        try:
            student_list = []
            for s in students:
                student_list.append({c.name: getattr(s, c.name) for c in s.__table__.columns})
                
            df = pd.DataFrame(student_list)
            df_final = preprocess_features(df, model_features)
            preds = np.clip(model_reg.predict(df_final), 0, 20)
            avg_pred_g3 = round(float(np.mean(preds)), 1)
            
            features_to_extract = ['Risk_Index', 'Fail_Burden', 'Total_Alcohol', 'Social_Life', 'Study_Support', 'Parent_Edu_Sum', 'G2_G1_delta']
            for f in features_to_extract:
                if f in df_final.columns:
                    engineered_metrics[f] = round(float(df_final[f].mean()), 2)

            shap_results = explainer.shap_values(df_final)
            if isinstance(shap_results, list) and len(shap_results) > 1:
                shap_vals_matrix = shap_results[1]
            elif isinstance(shap_results, list):
                shap_vals_matrix = shap_results[0]
            else:
                shap_vals_matrix = shap_results
            avg_shap_vals = np.mean(shap_vals_matrix, axis=0)

            feature_names_friendly = [FEATURE_LABELS.get(f, f) for f in model_features]
            shap_pairs = list(zip(feature_names_friendly, avg_shap_vals))
            shap_pairs.sort(key=lambda x: abs(x[1]), reverse=True)
            top_shap_pairs = shap_pairs[:10]
            top_shap_pairs.reverse()

            labels, values, colors = [], [], []
            for feature, val in top_shap_pairs:
                if val > 0:
                    cat = "High Risk Factor" if val > 0.05 else "Moderate Risk Factor"
                    color = "#e74c3c" if val > 0.05 else "#f39c12"
                else:
                    cat = "High Protective Factor" if val < -0.05 else "Moderate Protective Factor"
                    color = "#27ae60" if val < -0.05 else "#2ecc71"
                labels.append(f"{feature}\n({cat})")
                values.append(val)
                colors.append(color)

            plt.figure(figsize=(10, 7))
            bars = plt.barh(labels, values, color=colors, edgecolor='none')
            plt.axvline(0, color='gray', linewidth=1, linestyle='--')
            plt.title("Class-Wide Average Risk Drivers", fontsize=14, pad=20)
            plt.xlabel("Average Impact on Risk Probability", fontsize=12)
            for spine in plt.gca().spines.values():
                spine.set_visible(False)
            plt.grid(axis='x', linestyle='--', alpha=0.5)
            for bar, val in zip(bars, values):
                x_offset = 0.005 if val > 0 else -0.005
                ha = 'left' if val > 0 else 'right'
                plt.text(val + x_offset, bar.get_y() + bar.get_height()/2,
                         f"{val:+.3f}", va='center', ha=ha, fontsize=10, fontweight='bold', color='#333333')
            plt.tight_layout()
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight', transparent=True)
            buf.seek(0)
            shap_graph_base64 = base64.b64encode(buf.read()).decode('utf-8')
            plt.close()

            # --- SHAP Decision Plot ---
            decision_plot_base64 = None
            try:
                # Use the expected_value from the classifier explainer
                expected_value = explainer.expected_value
                if isinstance(expected_value, (list, np.ndarray)):
                    expected_value = float(expected_value[1]) if len(expected_value) > 1 else float(expected_value[0])
                else:
                    expected_value = float(expected_value)

                # Cap at 50 students for readability
                max_students = min(len(df_final), 50)
                shap_subset = shap_vals_matrix[:max_students]

                plt.figure(figsize=(11, 8))
                shap.decision_plot(
                    expected_value,
                    shap_subset,
                    feature_names=feature_names_friendly,
                    show=False,
                    highlight=None,
                    plot_color='RdBu',
                    auto_size_plot=False,
                )
                plt.title(
                    f"SHAP Decision Plot — {max_students} Students",
                    fontsize=13, fontweight='bold', color='#1f2937', pad=14
                )
                plt.tight_layout()
                buf = io.BytesIO()
                plt.savefig(buf, format='png', bbox_inches='tight', dpi=110)
                buf.seek(0)
                decision_plot_base64 = base64.b64encode(buf.read()).decode('utf-8')
                plt.close()
            except Exception as e:
                print(f"Decision plot error: {e}")

        except Exception as e:
            print(f"Error in class insights: {e}")

    return {
        "avg_g1": avg_g1, "avg_g2": avg_g2, "avg_pred_g3": avg_pred_g3, "avg_absences": avg_absences,
        "engineered_metrics": engineered_metrics, "shap_graph_base64": shap_graph_base64,
        "decision_plot_base64": decision_plot_base64
    }

@router.get("/class/decision-plot")
def get_filtered_decision_plot(
    mode: str = "all",          # all | high | moderate | low | student
    student_num: Optional[int] = None,
    db: Session = Depends(get_db),
    teacher_id: str = Depends(get_current_user_id)
):
    if not model_clf or model_features is None or explainer is None:
        return {"plot": None, "title": "", "count": 0}

    all_students = db.query(models.Student).filter(models.Student.teacher_id == teacher_id).all()
    if not all_students:
        return {"plot": None, "title": "No students", "count": 0}

    # --- Filter / sort students by mode ---
    if mode == "student":
        if student_num is None:
            return {"plot": None, "title": "No student number provided", "count": 0}
        target_name = f"Student {student_num}"
        filtered = [s for s in all_students if s.student_name == target_name]
        if not filtered:
            return {"plot": None, "title": f"Student {student_num} not found", "count": 0}
        title = f"SHAP Decision Plot — {target_name}"
    elif mode == "high":
        sorted_s = sorted(all_students, key=lambda s: s.risk_score or 0, reverse=True)
        filtered = [s for s in sorted_s if get_risk_tier(s.risk_score or 0) == 'HIGH'][:50]
        title = f"SHAP Decision Plot — Top {len(filtered)} High Risk Students"
    elif mode == "moderate":
        sorted_s = sorted(all_students, key=lambda s: s.risk_score or 0, reverse=True)
        filtered = [s for s in sorted_s if get_risk_tier(s.risk_score or 0) == 'MODERATE'][:50]
        title = f"SHAP Decision Plot — Top {len(filtered)} Moderate Risk Students"
    elif mode == "low":
        sorted_s = sorted(all_students, key=lambda s: s.risk_score or 0)
        filtered = [s for s in sorted_s if get_risk_tier(s.risk_score or 0) == 'LOW'][:50]
        title = f"SHAP Decision Plot — Top {len(filtered)} Low Risk Students"
    else:  # all
        sorted_s = sorted(all_students, key=lambda s: s.risk_score or 0, reverse=True)
        filtered = sorted_s[:50]
        title = f"SHAP Decision Plot — All Students (Top {len(filtered)} by Risk)"

    if not filtered:
        return {"plot": None, "title": f"No students in '{mode}' category", "count": 0}

    try:
        student_list = [{c.name: getattr(s, c.name) for c in s.__table__.columns} for s in filtered]
        df = pd.DataFrame(student_list)
        df_final = preprocess_features(df, model_features)

        shap_results = explainer.shap_values(df_final)
        if isinstance(shap_results, list) and len(shap_results) > 1:
            shap_matrix = shap_results[1]
        elif isinstance(shap_results, list):
            shap_matrix = shap_results[0]
        else:
            shap_matrix = shap_results

        expected_value = explainer.expected_value
        if isinstance(expected_value, (list, np.ndarray)):
            expected_value = float(expected_value[1]) if len(expected_value) > 1 else float(expected_value[0])
        else:
            expected_value = float(expected_value)

        feature_names_friendly = [FEATURE_LABELS.get(f, f) for f in model_features]

        # Colour-code lines by risk tier
        risk_scores = [s.risk_score or 0 for s in filtered]
        line_colors = ['#ef4444' if get_risk_tier(r) == 'HIGH'
                       else '#f59e0b' if get_risk_tier(r) == 'MODERATE'
                       else '#10b981' for r in risk_scores]

        is_single = (mode == 'student' and len(filtered) == 1)

        plt.figure(figsize=(11, max(7, len(filtered) * 0.18 + 3)))
        shap.decision_plot(
            expected_value,
            shap_matrix,
            feature_names=feature_names_friendly,
            show=False,
            highlight=None,
            plot_color='RdBu',
            auto_size_plot=False,
            color_bar=not is_single,  # hide colorbar for single student; we show our own badge
        )

        # ── Post-process: recolour every SHAP polyline by risk tier ──────────
        # shap.decision_plot uses RdBu; near-zero values render almost white.
        # We grab all drawn Line2D objects and recolour them ourselves.
        ax = plt.gca()
        data_lines = [l for l in ax.get_lines() if len(l.get_xdata()) > 3]
        for idx, line in enumerate(data_lines):
            if idx < len(line_colors):
                line.set_color(line_colors[idx])
                line.set_linewidth(3.5 if is_single else 1.6)
                line.set_alpha(1.0 if is_single else 0.75)

        # ── Single-student: annotation card + plain-English legend ───────────
        if is_single:
            risk_prob  = risk_scores[0]
            risk_tier  = get_risk_tier(risk_prob)
            tier_color = {'HIGH': '#ef4444', 'MODERATE': '#f59e0b', 'LOW': '#10b981'}[risk_tier]
            tier_label = {'HIGH': '⚠  HIGH RISK', 'MODERATE': '~  MODERATE RISK', 'LOW': '✓  LOW RISK'}[risk_tier]
            interp     = {
                'HIGH':     'Several features are pushing risk upward.\nImmediate academic support is recommended.',
                'MODERATE': 'Some risk factors detected. Monitor closely\nand consider early intervention.',
                'LOW':      'Mostly protective factors present.\nContinue current support strategies.',
            }[risk_tier]
            card = f"  {tier_label}  \n  Risk Probability: {risk_prob * 100:.1f}%  \n\n  {interp}  "
            ax.text(
                0.985, 0.015, card,
                transform=ax.transAxes,
                fontsize=9.5, verticalalignment='bottom', horizontalalignment='right',
                multialignment='left',
                bbox=dict(boxstyle='round,pad=0.6', facecolor=tier_color,
                          alpha=0.13, edgecolor=tier_color, linewidth=1.8),
                color='#1f2937',
            )
            from matplotlib.lines import Line2D
            ax.legend(
                handles=[
                    Line2D([0], [0], color=tier_color, linewidth=3,
                           label=f"Student path — {risk_tier} risk"),
                    Line2D([0], [0], color='gray', linewidth=1, linestyle='--',
                           label='Base rate (model average)'),
                ],
                loc='upper left', fontsize=9, framealpha=0.88, edgecolor='#d1d5db'
            )
        else:
            from matplotlib.lines import Line2D
            ax.legend(
                handles=[
                    Line2D([0], [0], color='#ef4444', linewidth=2.5, label='High Risk'),
                    Line2D([0], [0], color='#f59e0b', linewidth=2.5, label='Moderate Risk'),
                    Line2D([0], [0], color='#10b981', linewidth=2.5, label='Low Risk'),
                ],
                loc='upper left', fontsize=9, framealpha=0.88, edgecolor='#d1d5db'
            )

        plt.title(title, fontsize=12, fontweight='bold', color='#1f2937', pad=12)
        plt.tight_layout()

        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', dpi=110)
        buf.seek(0)
        plot_b64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close()
        return {"plot": plot_b64, "title": title, "count": len(filtered)}

    except Exception as e:
        print(f"Filtered decision plot error ({mode}): {e}")
        return {"plot": None, "title": str(e), "count": 0}

METRIC_PLOT_CONFIG = {
    'Risk_Index':     {'label': 'Risk Index',         'color': '#ef4444'},
    'Fail_Burden':    {'label': 'Failure Burden',      'color': '#f59e0b'},
    'Total_Alcohol':  {'label': 'Total Alcohol',       'color': '#8b5cf6'},
    'Social_Life':    {'label': 'Social Activity',     'color': '#10b981'},
    'Study_Support':  {'label': 'Study Support',       'color': '#3b82f6'},
    'Parent_Edu_Sum': {'label': 'Parental Education',  'color': '#ec4899'},
    'G2_G1_delta':    {'label': 'Grade Delta (G2-G1)', 'color': '#14b8a6'},
}

@router.get("/class/metric-plot/{feature_key}")
def get_metric_plot(feature_key: str, db: Session = Depends(get_db), teacher_id: str = Depends(get_current_user_id)):
    if feature_key not in METRIC_PLOT_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid feature key")
    if not model_reg or model_features is None:
        return {"plot": None}

    students = db.query(models.Student).filter(models.Student.teacher_id == teacher_id).all()
    if not students:
        return {"plot": None}

    try:
        student_list = [{c.name: getattr(s, c.name) for c in s.__table__.columns} for s in students]
        df = pd.DataFrame(student_list)
        df_final = preprocess_features(df, model_features)
        preds = np.clip(model_reg.predict(df_final), 0, 20)

        if feature_key not in df_final.columns:
            return {"plot": None}

        cfg = METRIC_PLOT_CONFIG[feature_key]
        x_vals = df_final[feature_key].values

        fig, ax = plt.subplots(figsize=(7, 4))
        ax.scatter(x_vals, preds, color=cfg['color'], alpha=0.65,
                   edgecolors='white', linewidths=0.4, s=60, zorder=3)
        if len(x_vals) > 2:
            try:
                z = np.polyfit(x_vals, preds, 1)
                p_fn = np.poly1d(z)
                x_sorted = np.sort(x_vals)
                ax.plot(x_sorted, p_fn(x_sorted), '--', color=cfg['color'],
                        linewidth=2, alpha=0.85, zorder=4)
            except Exception:
                pass

        ax.set_title(f"{cfg['label']} vs Predicted Final Grade",
                     fontsize=12, fontweight='bold', color='#1f2937', pad=10)
        ax.set_xlabel(cfg['label'], fontsize=10, color='#4b5563')
        ax.set_ylabel('Predicted G3 Score', fontsize=10, color='#4b5563')
        ax.set_ylim(0, 20)
        ax.tick_params(colors='#6b7280', labelsize=9)
        ax.grid(True, linestyle='--', alpha=0.35, color='#d1d5db')
        for spine in ax.spines.values():
            spine.set_edgecolor('#e5e7eb')
        fig.patch.set_facecolor('white')
        ax.set_facecolor('#fafafa')
        plt.tight_layout(pad=1.2)

        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', dpi=110)
        buf.seek(0)
        plot_b64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
        return {"plot": plot_b64}
    except Exception as e:
        print(f"Error generating metric plot for {feature_key}: {e}")
        return {"plot": None}
