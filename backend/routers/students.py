from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import io
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

import models
from dependencies import get_db, get_current_user_id
from ml_utils import (
    model_reg, model_clf, model_features, explainer,
    preprocess_features, get_risk_tier, FEATURE_LABELS
)
from cache_utils import clear_teacher_cache

router = APIRouter()

@router.get("/students/")
def list_students(db: Session = Depends(get_db), teacher_id: str = Depends(get_current_user_id)):
    students = db.query(models.Student).filter(models.Student.teacher_id == teacher_id).all()
    student_list = []
    for s in students:
        d = {c.name: getattr(s, c.name) for c in s.__table__.columns}
        d['predicted_g3'] = "-" 
        student_list.append(d)
    
    if model_reg is not None and model_clf is not None and student_list and model_features is not None:
        try:
            df = pd.DataFrame(student_list)
            df_final = preprocess_features(df, model_features)
            
            preds = np.clip(model_reg.predict(df_final), 0, 20)
            risk_probs = model_clf.predict_proba(df_final)[:, 1]
            
            for i in range(len(student_list)):
                student_list[i]['predicted_g3'] = round(float(preds[i]), 1)
                student_list[i]['risk_score'] = float(risk_probs[i])
                student_list[i]['risk_category'] = get_risk_tier(float(risk_probs[i]))
        except Exception as e:
            print(f"Prediction Error in list_students: {e}") 

    return student_list

@router.get("/students/{student_id}/insights")
def get_insights(student_id: int, db: Session = Depends(get_db), teacher_id: str = Depends(get_current_user_id)):
    student = db.query(models.Student).filter(models.Student.id == student_id, models.Student.teacher_id == teacher_id).first()
    if not student: raise HTTPException(status_code=404, detail="Student not found or access denied")
    
    pred_g3 = "-"
    risk_prob = student.risk_score or 0.0
    top_10_insights = []
    shap_graph_base64 = None
    
    if model_reg and model_clf and model_features is not None and explainer is not None:
        try:
            student_dict = {c.name: getattr(student, c.name) for c in student.__table__.columns}
            
            df_final = preprocess_features(pd.DataFrame([student_dict]), model_features)
            
            # Compute class-wide statistics for the UI scale
            all_students = db.query(models.Student).filter(models.Student.teacher_id == teacher_id).all()
            all_students_dict = [{c.name: getattr(s, c.name) for c in s.__table__.columns} for s in all_students]
            df_all = pd.DataFrame(all_students_dict)
            df_all_final = preprocess_features(df_all, model_features)
            
            feature_means = df_all_final.mean().to_dict()
            feature_mins = df_all_final.min().to_dict()
            feature_maxs = df_all_final.max().to_dict()
            
            pred_g3 = round(float(np.clip(model_reg.predict(df_final)[0], 0, 20)), 1)
            risk_prob = float(model_clf.predict_proba(df_final)[:, 1][0])

            shap_results = explainer.shap_values(df_final)
            shap_vals = shap_results[1][0] if isinstance(shap_results, list) and len(shap_results) > 1 else (shap_results[0][0] if isinstance(shap_results, list) else shap_results[0])
            
            try:
                feature_names_friendly = [FEATURE_LABELS.get(f, f) for f in model_features]
                shap_pairs = list(zip(feature_names_friendly, shap_vals))
                shap_pairs.sort(key=lambda x: abs(x[1]), reverse=True)
                top_shap_pairs = shap_pairs[:10]
                top_shap_pairs.reverse()
                
                labels = []
                values = []
                colors = []
                for feature, val in top_shap_pairs:
                    if val > 0:
                        cat = "High Risk Factor" if val > 0.08 else "Moderate Risk Factor"
                        color = "#e74c3c" if val > 0.08 else "#f39c12"
                    else:
                        cat = "High Protective Factor" if val < -0.08 else "Moderate Protective Factor"
                        color = "#27ae60" if val < -0.08 else "#2ecc71"
                            
                    labels.append(f"{feature}\n({cat})")
                    values.append(val)
                    colors.append(color)

                plt.figure(figsize=(10, 7))
                bars = plt.barh(labels, values, color=colors, edgecolor='none')
                plt.axvline(0, color='gray', linewidth=1, linestyle='--')
                plt.title("Student Risk Drivers (Protective vs. Risk Factors)", fontsize=14, pad=20)
                plt.xlabel("Impact on Risk Probability", fontsize=12)
                for spine in plt.gca().spines.values():
                    spine.set_visible(False)
                plt.grid(axis='x', linestyle='--', alpha=0.5)
                for bar, val in zip(bars, values):
                    x_offset = 0.005 if val > 0 else -0.005
                    ha = 'left' if val > 0 else 'right'
                    plt.text(val + x_offset, bar.get_y() + bar.get_height()/2, f"{val:+.3f}", va='center', ha=ha, fontsize=10, fontweight='bold', color='#333333')

                plt.tight_layout()
                buf = io.BytesIO()
                plt.savefig(buf, format='png', bbox_inches='tight', transparent=True)
                buf.seek(0)
                shap_graph_base64 = base64.b64encode(buf.read()).decode('utf-8')
                plt.close()
            except Exception as e:
                print(f"Failed to generate custom SHAP plot: {e}")
                
            student_record = df_final.iloc[0].to_dict()
            for feature_name, val in zip(model_features, shap_vals):
                if abs(val) >= 0.02: 
                    friendly_name = FEATURE_LABELS.get(feature_name, feature_name)
                    if val > 0:
                        type_str = "High Risk Factor" if val > 0.08 else "Moderate Risk Factor"
                    else:
                        type_str = "High Protective Factor" if val < -0.08 else "Moderate Protective Factor"
                    
                    top_10_insights.append({
                        "feature": friendly_name,
                        "impact_score": round(float(val), 3),
                        "type": type_str,
                        "raw_student_value": round(float(student_record.get(feature_name, 0)), 2),
                        "avg_value": round(float(feature_means.get(feature_name, 0)), 2),
                        "min_value": round(float(feature_mins.get(feature_name, 0)), 2),
                        "max_value": round(float(feature_maxs.get(feature_name, 0)), 2)
                    })
            
            top_10_insights.sort(key=lambda x: abs(x["impact_score"]), reverse=True)
            top_10_insights = top_10_insights[:10]

        except Exception as e:
            print(f"Prediction/SHAP Error in insights: {e}")

    actions = []
    if student.G1 < 10: actions.append("📉 G1 below pass - Schedule tutoring")
    if student.absences > 5: actions.append("🗓️ High absences - Parent-Teacher meeting")
    if student.studytime == 1: actions.append("⏳ Low study time - Time management workshop")
    if not actions: actions.append("✅ Stable performance - Continue monitoring")

    return {
        "student_info": {
            "name": student.student_name, "age": student.age, "current_g1": student.G1,
            "predicted_g3": pred_g3, "at_risk_probability": f"{round(risk_prob * 100, 1)}%",
            "risk_tier": get_risk_tier(risk_prob), "total_absences": student.absences,
            "past_failures": student.failures, "study_time_category": student.studytime,
            "social_outings_level": student.goout
        },
        "top_10_shap_drivers": top_10_insights, 
        "recommended_actions": actions,
        "shap_graph_base64": shap_graph_base64
    }

@router.post("/upload-csv/")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db), teacher_id: str = Depends(get_current_user_id)):
    try:
        content = await file.read()
        decoded_content = content.decode('utf-8')
        
        if ';' in decoded_content.split('\n')[0]:
            df = pd.read_csv(io.StringIO(decoded_content), sep=';')
        else:
            df = pd.read_csv(io.StringIO(decoded_content))
            
        db.query(models.Student).filter(models.Student.teacher_id == teacher_id).delete()
        db.commit()
        
        scores = [0.0] * len(df)
        if model_clf and model_features is not None:
            df_final = preprocess_features(df, model_features)
            scores = model_clf.predict_proba(df_final)[:, 1]
        
        new_students = []
        for i, row in df.iterrows():
            score = float(scores[i])
            new_student = models.Student(
                teacher_id=teacher_id,
                student_name=row.get('student_name', f"Student {i+1}"),
                
                # Demographics
                age=int(row.get('age', 15) if pd.notna(row.get('age')) else 15),
                Medu=int(row.get('Medu', 2) if pd.notna(row.get('Medu')) else 2),
                Fedu=int(row.get('Fedu', 2) if pd.notna(row.get('Fedu')) else 2),
                
                # Support & Extracurriculars
                schoolsup=str(row.get('schoolsup', 'no')),
                famsup=str(row.get('famsup', 'no')),
                paid=str(row.get('paid', 'no')),
                activities=str(row.get('activities', 'no')),
                nursery=str(row.get('nursery', 'yes')),
                higher=str(row.get('higher', 'yes')),
                internet=str(row.get('internet', 'yes')),
                romantic=str(row.get('romantic', 'no')),
                
                # Lifestyle & Health
                freetime=int(row.get('freetime', 3) if pd.notna(row.get('freetime')) else 3),
                goout=int(row.get('goout', 3) if pd.notna(row.get('goout')) else 3),
                Dalc=int(row.get('Dalc', 1) if pd.notna(row.get('Dalc')) else 1),
                Walc=int(row.get('Walc', 1) if pd.notna(row.get('Walc')) else 1),
                health=int(row.get('health', 3) if pd.notna(row.get('health')) else 3),
                
                # Academics
                absences=int(row.get('absences', 0) if pd.notna(row.get('absences')) else 0),
                failures=int(row.get('failures', 0) if pd.notna(row.get('failures')) else 0),
                studytime=int(row.get('studytime', 2) if pd.notna(row.get('studytime')) else 2),
                G1=int(row.get('G1', 10) if pd.notna(row.get('G1')) else 10),
                G2=int(row.get('G2', 10) if pd.notna(row.get('G2')) else 10),
                
                # Outputs
                risk_score=score,
                risk_category=get_risk_tier(score)
            )
            new_students.append(new_student)
            
        db.add_all(new_students)
        db.commit()
        clear_teacher_cache(db, teacher_id)
        return {"message": f"Processed {len(new_students)} students for your vault."}

    except Exception as e:
        print(f"CSV Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
