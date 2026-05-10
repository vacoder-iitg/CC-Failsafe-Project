from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np

import models
from dependencies import get_db, get_current_user_id
from ml_utils import (
    model_reg, model_clf, model_features,
    preprocess_features, get_risk_tier
)

router = APIRouter()

@router.get("/hod/overview")
def hod_overview(db: Session = Depends(get_db), requester: str = Depends(get_current_user_id)):
    """HoD endpoint: returns per-teacher summary + aggregate metrics."""
    # Verify requester is HoD
    req_user = db.query(models.User).filter(models.User.username == requester).first()
    if not req_user or (req_user.role or 'Faculty') != 'HoD':
        raise HTTPException(status_code=403, detail="Access denied. HoD role required.")

    # Get all faculty users
    faculty_users = db.query(models.User).filter(models.User.role != 'HoD').all()
    teachers_data = []

    for faculty in faculty_users:
        students = db.query(models.Student).filter(models.Student.teacher_id == faculty.username).all()
        if not students:
            continue

        student_list = []
        for s in students:
            d = {c.name: getattr(s, c.name) for c in s.__table__.columns}
            d['predicted_g3'] = '-'
            student_list.append(d)

        # Run predictions
        if model_reg is not None and model_clf is not None and model_features is not None:
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
                print(f"HoD prediction error for {faculty.username}: {e}")

        total = len(student_list)
        high_risk = sum(1 for s in student_list if s.get('risk_category') == 'HIGH')
        moderate_risk = sum(1 for s in student_list if s.get('risk_category') == 'MODERATE')
        low_risk = sum(1 for s in student_list if s.get('risk_category') == 'LOW')
        avg_risk = round(sum(s.get('risk_score', 0) for s in student_list) / total * 100, 1) if total else 0
        avg_g1 = round(sum(s.get('G1', 0) or 0 for s in student_list) / total, 1) if total else 0
        avg_g2 = round(sum(s.get('G2', 0) or 0 for s in student_list) / total, 1) if total else 0
        avg_absences = round(sum(s.get('absences', 0) or 0 for s in student_list) / total, 1) if total else 0
        pred_g3_vals = [s['predicted_g3'] for s in student_list if isinstance(s.get('predicted_g3'), (int, float))]
        avg_pred_g3 = round(sum(pred_g3_vals) / len(pred_g3_vals), 1) if pred_g3_vals else 0

        teachers_data.append({
            'teacher_name': faculty.username,
            'total_students': total,
            'high_risk': high_risk,
            'moderate_risk': moderate_risk,
            'low_risk': low_risk,
            'avg_risk_pct': avg_risk,
            'avg_g1': avg_g1,
            'avg_g2': avg_g2,
            'avg_pred_g3': avg_pred_g3,
            'avg_absences': avg_absences,
        })

    # Aggregate across all teachers
    all_total = sum(t['total_students'] for t in teachers_data)
    aggregate = {
        'total_teachers': len(teachers_data),
        'total_students': all_total,
        'total_high_risk': sum(t['high_risk'] for t in teachers_data),
        'total_moderate_risk': sum(t['moderate_risk'] for t in teachers_data),
        'total_low_risk': sum(t['low_risk'] for t in teachers_data),
        'avg_risk_pct': round(sum(t['avg_risk_pct'] * t['total_students'] for t in teachers_data) / all_total, 1) if all_total else 0,
    }

    return { 'teachers': teachers_data, 'aggregate': aggregate }
