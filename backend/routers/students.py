from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import io

import models
from dependencies import get_db, get_current_user_id
from ml_utils import (
    model_reg, model_clf, model_features,
    preprocess_features, get_risk_tier
)
from cache_utils import clear_teacher_cache, get_db_cache, set_db_cache

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
    cache_key = f"student_{student_id}_insights"
    db_cached = get_db_cache(db, teacher_id, cache_key)
    if db_cached:
        return db_cached

    student = db.query(models.Student).filter(models.Student.id == student_id, models.Student.teacher_id == teacher_id).first()
    if not student: raise HTTPException(status_code=404, detail="Student not found or access denied")
    
    pred_g3 = "-"
    risk_prob = student.risk_score or 0.0
    top_10_insights = []
    
    if model_reg and model_clf and model_features is not None:
        try:
            student_dict = {c.name: getattr(student, c.name) for c in student.__table__.columns}
            df_final = preprocess_features(pd.DataFrame([student_dict]), model_features)
            
            pred_g3 = round(float(np.clip(model_reg.predict(df_final)[0], 0, 20)), 1)
            risk_prob = float(model_clf.predict_proba(df_final)[:, 1][0])
        except Exception as e:
            print(f"Prediction Error in insights: {e}")

    actions = []
    if student.G1 is not None and student.G1 < 10:
        actions.append("Low G1 Score - Provide personal tutor for weak subjects")
    if student.G2 is not None and student.G2 < 10:
        actions.append("Low G2 Score - Assign remedial classes & practice tests")
    if student.failures is not None and student.failures >= 1:
        actions.append("Past Failure(s) - Enroll in academic recovery program")
    if student.studytime is not None and student.studytime <= 1:
        actions.append("Very Low Study Time - Provide supervised extra study hours in school")
    if student.absences is not None and student.absences > 10:
        actions.append(f"High Absences ({student.absences}) - Formal warning to student & parents about attendance policy")
    elif student.absences is not None and student.absences > 5:
        actions.append(f"Moderate Absences ({student.absences}) - Counsel student about attendance importance")
    if student.health is not None and student.health <= 2:
        actions.append("Health Concerns - Recommend consultation with school doctor")
    if (student.Dalc is not None and student.Dalc >= 3) or (student.Walc is not None and student.Walc >= 3):
        actions.append("High Alcohol Consumption - Refer to school counselor for substance awareness")
    if student.goout is not None and student.goout >= 4:
        actions.append("High Social Activity - Monitor social time, suggest balanced routine")
    if student.freetime is not None and student.freetime >= 4:
        actions.append("Excessive Free Time - Encourage extracurricular/academic engagement")
    if student.famsup == 'no':
        actions.append("No Family Support - Schedule parent-faculty meeting to engage family")
    if student.schoolsup == 'no' and (student.G1 < 10 or student.G2 < 10):
        actions.append("No School Support - Enroll in school academic support program")
    if student.higher == 'no':
        actions.append("No Higher Ed. Aspiration - Provide career guidance & motivational counseling")
    if student.romantic == 'yes' and student.studytime <= 2:
        actions.append("Relationship + Low Study - Time management workshop")
    
    if not actions:
        actions.append("No Major Concerns - Student appears on track — continue monitoring")

    result = {
        "student_info": {
            "name": student.student_name, "age": student.age, "current_g1": student.G1,
            "predicted_g3": pred_g3, "at_risk_probability": f"{round(risk_prob * 100, 1)}%",
            "risk_tier": get_risk_tier(risk_prob), "total_absences": student.absences,
            "past_failures": student.failures, "study_time_category": student.studytime,
            "social_outings_level": student.goout
        },
        "top_10_shap_drivers": top_10_insights, 
        "recommended_actions": actions,
        "shap_graph_base64": None
    }
    set_db_cache(db, teacher_id, cache_key, result)
    return result

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
        
        new_students = []
        for i, row in df.iterrows():
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
                
                # Outputs default on insert (dynamically predicted at read-time)
                risk_score=0.0,
                risk_category="LOW"
            )
            new_students.append(new_student)
            
        db.add_all(new_students)
        db.commit()
        clear_teacher_cache(db, teacher_id)
        return {"message": f"Processed {len(new_students)} students for your vault."}

    except Exception as e:
        print(f"CSV Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
