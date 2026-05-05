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
import threading
#This is final push

plt_lock = threading.Lock()

import models
from dependencies import get_db, get_current_user_id
from ml_utils import (
    model_reg, model_clf, model_features, explainer,
    preprocess_features, get_risk_tier, FEATURE_LABELS
)

from cache_utils import (
    INSIGHTS_CACHE, 
    get_db_cache, set_db_cache
)

router = APIRouter()

@router.get("/class/insights")
def get_class_insights(db: Session = Depends(get_db), teacher_id: str = Depends(get_current_user_id)):
    # 1. Check In-Memory Cache (Fastest)
    if teacher_id in INSIGHTS_CACHE:
        return INSIGHTS_CACHE[teacher_id]
    
    # 2. Check PostgreSQL Cache (Persistent)
    db_cached = get_db_cache(db, teacher_id, "insights")
    if db_cached:
        INSIGHTS_CACHE[teacher_id] = db_cached
        return db_cached

    students = db.query(models.Student).filter(models.Student.teacher_id == teacher_id).all()

    if not students:
        return {"avg_g1": 0, "avg_g2": 0, "avg_pred_g3": 0, "avg_absences": 0, "shap_graph_base64": None, "metric_plots": {}}
    
    avg_g1 = round(sum(s.G1 for s in students) / len(students), 1)
    avg_g2 = round(sum(s.G2 for s in students) / len(students), 1)
    avg_absences = round(sum(s.absences for s in students) / len(students), 1)
    
    avg_pred_g3 = 0
    shap_graph_base64 = None
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

            with plt_lock:
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

        except Exception as e:
            print(f"Error in class insights: {e}")

    result = {
        "avg_g1": avg_g1, "avg_g2": avg_g2, "avg_pred_g3": avg_pred_g3, "avg_absences": avg_absences,
        "engineered_metrics": engineered_metrics, "shap_graph_base64": shap_graph_base64
    }
    set_db_cache(db, teacher_id, "insights", result)
    INSIGHTS_CACHE[teacher_id] = result
    return result



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
