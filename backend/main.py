from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from database import engine, SessionLocal
import models
from contextlib import asynccontextmanager
import pandas as pd
import numpy as np
import joblib
import io
import shap
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import base64

FEATURE_LABELS = {
    'age': 'Age', 'traveltime': 'Commute Time', 'studytime': 'Study Time', 'failures': 'Past Class Failures',
    'famrel': 'Family Relationship', 'health': 'Health Status', 'absences': 'Total Absences',
    'G1': 'Period 1 Grade', 'G2': 'Period 2 Grade', 'Total_Alcohol': 'Total Alcohol Intake',
    'Parent_Edu_Sum': "Parents' Education", 'Social_Life': 'Social Life & Free Time',
    'Study_Support': 'Total Academic Support', 'Study_vs_Social': 'Study Time vs Social Life',
    'Study_per_Absent': 'Study Time per Absence', 'Support_per_Fail': 'Support vs Past Failures',
    'Fail_Burden': 'Failure History x Alcohol Use', 'Health_Absence': 'Health Issues x Absences',
    'Risk_Index': 'Composite Risk Index', 'G1_norm': 'Period 1 Grade (Normalized)',
    'G2_norm': 'Period 2 Grade (Normalized)', 'G2_G1_delta': 'Grade Trend (G2 - G1)',
    'G_avg_P1P2': 'Average Grade (P1 & P2)', 'G1_below_pass': 'Failed Period 1',
    'G2_below_pass': 'Failed Period 2', 'Both_failing': 'Failing Both Periods',
    'studytime_sq': 'Consistent Study Habit', 'absences_log': 'Frequent Absences',
    'age_failures': 'Age x Past Failures', 'parent_support': 'Parental Education & Support',
    'school_MS': 'School: Mousinho da Silveira', 'sex_M': 'Gender: Male',
    'address_U': 'Urban Resident', 'famsize_LE3': 'Small Family Size',
    'Pstatus_T': 'Parents Living Together', 'Mjob_health': "Mother's Job: Health",
    'Mjob_other': "Mother's Job: Other", 'Mjob_services': "Mother's Job: Services",
    'Mjob_teacher': "Mother's Job: Teacher", 'Fjob_health': "Father's Job: Health",
    'Fjob_other': "Father's Job: Other", 'Fjob_services': "Father's Job: Services",
    'Fjob_teacher': "Father's Job: Teacher", 'reason_home': 'Reason for School: Close to Home',
    'reason_other': 'Reason for School: Other', 'reason_reputation': 'Reason for School: Reputation',
    'guardian_mother': 'Guardian: Mother', 'guardian_other': 'Guardian: Other',
    'schoolsup_yes': 'Receives School Support', 'famsup_yes': 'Receives Family Support',
    'paid_yes': 'Attends Paid Classes', 'activities_yes': 'Extracurricular Activities',
    'nursery_yes': 'Attended Nursery School', 'higher_yes': 'Wants Higher Education',
    'internet_yes': 'Has Internet Access', 'romantic_yes': 'In a Romantic Relationship',
    'subject_por': 'Subject: Portuguese'
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n[STARTING] FAIL SAFE MULTI-TENANT ENGINE STARTING...")
    yield

app = FastAPI(lifespan=lifespan)
models.Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def get_current_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized access")
    return authorization.split(" ")[1]

class UserAuth(BaseModel):
    username: str
    password: str

@app.post("/signup")
def create_user(user: UserAuth, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="⚠️ Username already exists. Please log in.")
    new_user = models.User(username=user.username, password=user.password)
    db.add(new_user)
    db.commit()
    return {"message": "Account created successfully!"}

@app.post("/login")
def login_user(user: UserAuth, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="❌ User not found. Please create an account.")
    if db_user.password != user.password:
        raise HTTPException(status_code=401, detail="❌ Incorrect password.")
    return {"token": db_user.username, "role": "Faculty"}

try:
    model_clf = joblib.load('xgb_risk_classifier.pkl')
    model_reg = joblib.load('xgb_g3_regressor.pkl')
    model_features = joblib.load('feature_names.pkl')
    
    try:
        best_threshold = float(joblib.load('best_threshold.pkl'))
    except Exception:
        best_threshold = 0.5 
        
    explainer = shap.TreeExplainer(model_clf)
    print(f"[SUCCESS] ML Models Loaded. Features: {len(model_features)} | F1 Threshold: {best_threshold}")
except Exception as e:
    model_clf, model_reg, model_features, explainer, best_threshold = None, None, None, None, 0.5
    print(f"[ERROR] ML Models failed to load: {e}")

def get_risk_tier(prob, threshold=None):
    th = threshold if threshold else best_threshold
    if prob >= th: return '🔴 HIGH'
    if prob >= (th * 0.6): return '🟡 MODERATE' 
    return '🟢 LOW'

# --- THE EXACT FEATURE ENGINEERING FROM THE IPYNB ---
def preprocess_features(df, expected_features):
    df_e = df.copy()

    for col in ['G1', 'G2']:
        df_e[col] = pd.to_numeric(df_e[col], errors='coerce').fillna(0)

    df_e['Total_Alcohol']   = df_e['Dalc'] + df_e['Walc']
    df_e['Parent_Edu_Sum']  = df_e['Medu'] + df_e['Fedu']
    df_e['Social_Life']     = df_e['goout'] + df_e['freetime']

    for col in ['schoolsup', 'famsup', 'paid', 'activities', 'internet', 'higher', 'nursery', 'romantic']:
        if col in df_e.columns:
            df_e[col + '_bin'] = df_e[col].map({'yes': 1, 'no': 0}).fillna(0)
            
    df_e['Study_Support'] = df_e.get('schoolsup_bin', 0) + df_e.get('famsup_bin', 0) + df_e.get('paid_bin', 0)

    df_e['Study_vs_Social']  = df_e['studytime'] / (df_e['Social_Life'] + 1)
    df_e['Study_per_Absent'] = df_e['studytime'] / (df_e['absences'] + 1)
    df_e['Support_per_Fail'] = df_e['Study_Support'] / (df_e['failures'] + 1)

    df_e['Fail_Burden']    = df_e['failures'] * df_e['Total_Alcohol']
    df_e['Health_Absence'] = df_e['health'] * df_e['absences']
    df_e['Risk_Index']     = (df_e['failures'] * 2 + df_e['Total_Alcohol'] + df_e['absences'] / 10 + (5 - df_e['health']))

    df_e['G1_norm']       = df_e['G1'] / 20.0
    df_e['G2_norm']       = df_e['G2'] / 20.0
    df_e['G2_G1_delta']   = df_e['G2'] - df_e['G1']
    df_e['G_avg_P1P2']    = (df_e['G1'] + df_e['G2']) / 2.0
    df_e['G1_below_pass'] = (df_e['G1'] < 10).astype(int)
    df_e['G2_below_pass'] = (df_e['G2'] < 10).astype(int)
    df_e['Both_failing']  = df_e['G1_below_pass'] * df_e['G2_below_pass']

    df_e['studytime_sq']  = df_e['studytime'] ** 2
    df_e['absences_log']  = np.log1p(df_e['absences'])
    df_e['age_failures']  = df_e['age'] * df_e['failures']
    df_e['parent_support'] = df_e['Parent_Edu_Sum'] * df_e['Study_Support']

    drop_cols = (
        ['G3', 'is_at_risk', 'Dalc', 'Walc', 'Medu', 'Fedu', 'goout', 'freetime'] +
        [c for c in df_e.columns if c.endswith('_bin')]
    )
    df_e = df_e.drop(columns=[c for c in drop_cols if c in df_e.columns])

    X_new = pd.get_dummies(df_e, drop_first=True)
    bool_c = X_new.select_dtypes(include='bool').columns
    X_new[bool_c] = X_new[bool_c].astype(int)

    # STRICT ALIGNMENT to `feature_names.pkl`
    df_final = pd.DataFrame(0, index=X_new.index, columns=expected_features)
    common_cols = list(set(X_new.columns) & set(expected_features))
    df_final[common_cols] = X_new[common_cols]
    df_final = df_final.astype(float)
    
    return df_final

@app.get("/students/")
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

@app.get("/students/{student_id}/insights")
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
    if student.G1 < 10: actions.append("📚 G1 below pass - Schedule tutoring")
    if student.absences > 5: actions.append("📋 High absences - Parent-Teacher meeting")
    if student.studytime == 1: actions.append("⏰ Low study time - Time management workshop")
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

@app.get("/class/insights")
def get_class_insights(db: Session = Depends(get_db), teacher_id: str = Depends(get_current_user_id)):
    students = db.query(models.Student).filter(models.Student.teacher_id == teacher_id).all()
    if not students:
        return {"avg_g1": 0, "avg_g2": 0, "avg_pred_g3": 0, "avg_absences": 0, "shap_graph_base64": None}
    
    avg_g1 = round(sum(s.G1 for s in students) / len(students), 1)
    avg_g2 = round(sum(s.G2 for s in students) / len(students), 1)
    avg_absences = round(sum(s.absences for s in students) / len(students), 1)
    
    avg_pred_g3 = 0
    shap_graph_base64 = None
    trend_commute_base64 = None
    trend_grades_base64 = None
    engineered_metrics = {}
    
    if model_reg and model_clf and model_features is not None and explainer is not None:
        try:
            student_list = []
            for s in students:
                student_list.append({c.name: getattr(s, c.name) for c in s.__table__.columns})
                
            df = pd.DataFrame(student_list)
            df_final = preprocess_features(df, model_features)
            
            features_to_extract = ['Risk_Index', 'Fail_Burden', 'Total_Alcohol', 'Social_Life', 'Study_Support', 'Parent_Edu_Sum', 'G2_G1_delta']
            for f in features_to_extract:
                if f in df_final.columns:
                    engineered_metrics[f] = round(float(df_final[f].mean()), 2)
            
            preds = np.clip(model_reg.predict(df_final), 0, 20)
            avg_pred_g3 = round(float(np.mean(preds)), 1)
            
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
            
            labels = []
            values = []
            colors = []
            for feature, val in top_shap_pairs:
                if val > 0:
                    cat = "Avg High Risk Factor" if val > 0.05 else "Avg Moderate Risk Factor"
                    color = "#e74c3c" if val > 0.05 else "#f39c12"
                else:
                    cat = "Avg High Protective Factor" if val < -0.05 else "Avg Moderate Protective Factor"
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
                plt.text(val + x_offset, bar.get_y() + bar.get_height()/2, f"{val:+.3f}", va='center', ha=ha, fontsize=10, fontweight='bold', color='#333333')

            plt.tight_layout()
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight', transparent=True)
            buf.seek(0)
            shap_graph_base64 = base64.b64encode(buf.read()).decode('utf-8')
            plt.close()
            
            try:
                # Plot 2: Commute Time vs Predicted G3
                travel_vals = [s.traveltime for s in students]
                plt.figure(figsize=(6, 4))
                data = [preds[np.array(travel_vals) == 1], preds[np.array(travel_vals) == 2], preds[np.array(travel_vals) == 3], preds[np.array(travel_vals) == 4]]
                data = [d if len(d) > 0 else [0] for d in data] 
                plt.boxplot(data, labels=["<15 min", "15-30 min", "30-60 min", ">60 min"], patch_artist=True, boxprops=dict(facecolor='#1abc9c', color='#16a085'))
                plt.title("Commute Time vs Predicted Final Grade", fontsize=12)
                plt.xlabel("Commute Time")
                plt.ylabel("Predicted G3 Score")
                plt.grid(True, axis='y', linestyle='--', alpha=0.5)
                for spine in plt.gca().spines.values(): spine.set_color('#e5e7eb')
                plt.tight_layout()
                buf = io.BytesIO()
                plt.savefig(buf, format='png', bbox_inches='tight', transparent=True, dpi=100)
                buf.seek(0)
                trend_commute_base64 = base64.b64encode(buf.read()).decode('utf-8')
                plt.close()
                
                # Plot 3: Average G1 & G2 vs Predicted G3
                avg_past_grades = [(s.G1 + s.G2) / 2 for s in students]
                plt.figure(figsize=(6, 4))
                plt.scatter(avg_past_grades, preds, alpha=0.6, color="#9b59b6")
                if len(avg_past_grades) > 1:
                    z = np.polyfit(avg_past_grades, preds, 1)
                    p = np.poly1d(z)
                    plt.plot(sorted(avg_past_grades), p(sorted(avg_past_grades)), "r--", linewidth=2)
                plt.title("Avg Past Grades (G1, G2) vs Predicted G3", fontsize=12)
                plt.xlabel("Average Past Grade (G1 & G2)")
                plt.ylabel("Predicted G3 Score")
                plt.grid(True, linestyle='--', alpha=0.5)
                for spine in plt.gca().spines.values(): spine.set_color('#e5e7eb')
                plt.tight_layout()
                buf = io.BytesIO()
                plt.savefig(buf, format='png', bbox_inches='tight', transparent=True, dpi=100)
                buf.seek(0)
                trend_grades_base64 = base64.b64encode(buf.read()).decode('utf-8')
                plt.close()
                
            except Exception as e:
                print(f"Failed to generate trend plots: {e}")
            
        except Exception as e:
            print(f"Prediction/SHAP Error in class insights: {e}")
            
    return {
        "avg_g1": avg_g1,
        "avg_g2": avg_g2,
        "avg_pred_g3": avg_pred_g3,
        "avg_absences": avg_absences,
        "engineered_metrics": engineered_metrics,
        "shap_graph_base64": shap_graph_base64,
        "trend_commute_base64": trend_commute_base64,
        "trend_grades_base64": trend_grades_base64
    }

@app.post("/upload-csv/")
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
        return {"message": f"Processed {len(new_students)} students for your vault."}
    except Exception as e:
        print(f"CSV Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/nuke")
def nuke_database(db: Session = Depends(get_db)):
    models.User.__table__.drop(engine, checkfirst=True)
    models.Student.__table__.drop(engine, checkfirst=True)
    models.User.__table__.create(engine)
    models.Student.__table__.create(engine)
    return {"message": "DATABASE COMPLETELY RESET FOR AUTHENTICATION!"}