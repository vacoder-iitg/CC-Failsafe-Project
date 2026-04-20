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

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n🚀 FAILSAFE MULTI-TENANT ENGINE STARTING...")
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

# --- THE BOUNCER (Authentication) ---
def get_current_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized access")
    return authorization.split(" ")[1]

# --- AUTH ROUTES ---
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

# --- STABLE MODEL LOADING ---
try:
    model_clf = joblib.load('xgb_classifier_v3.pkl')
    model_reg = joblib.load('xgb_regressor_v3.pkl')
    model_features = joblib.load('feature_cols_v3.pkl')
    print("✅ ML Models Loaded Successfully")
except Exception as e:
    model_clf, model_reg, model_features = None, None, None
    print(f"⚠️ ML Models failed to load: {e}")

def get_risk_tier(prob):
    if prob >= 0.7: return '🔴 HIGH'
    if prob >= 0.4: return '🟡 MODERATE'
    return '🟢 LOW'

def preprocess_notebook8_features(df, db_g1_mean=10.9):
    df_model = df.copy()
    binary_cols = ['schoolsup','famsup','paid','activities','nursery','higher','internet','romantic']
    for col in binary_cols:
        if col in df_model.columns:
            df_model[col] = df_model[col].map({'yes': 1, 'no': 0, 1: 1, 0: 0}).fillna(0)

    if 'school' in df_model.columns: df_model['school'] = df_model['school'].map({'GP': 0, 'MS': 1, 0: 0, 1: 1}).fillna(0)
    if 'sex' in df_model.columns: df_model['sex'] = df_model['sex'].map({'F': 0, 'M': 1, 0: 0, 1: 1}).fillna(0)
    
    if 'G1' in df_model.columns:
        df_model['G1'] = pd.to_numeric(df_model['G1'], errors='coerce').fillna(10)
        df_model['G1_deviation'] = df_model['G1'] - db_g1_mean
        df_model['G1_below_pass'] = (df_model['G1'] < 10).astype(int)
        
    if 'absences' in df_model.columns:
        df_model['absences'] = pd.to_numeric(df_model['absences'], errors='coerce').fillna(0)
        df_model['high_absence'] = (df_model['absences'] > 6).astype(int)
        
    return df_model

# --- SECURE ROUTES ---

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
            db_g1_mean = float(db.query(func.avg(models.Student.G1)).scalar() or 10.9)
            df = pd.DataFrame(student_list)
            
            df_engineered = preprocess_notebook8_features(df, db_g1_mean)
            df_final = df_engineered.reindex(columns=model_features, fill_value=0)
            df_final = df_final.apply(pd.to_numeric, errors='coerce').fillna(0).astype(float)
            
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
    
    if model_reg and model_clf and model_features is not None:
        try:
            db_g1_mean = float(db.query(func.avg(models.Student.G1)).scalar() or 10.9)
            student_dict = {c.name: getattr(student, c.name) for c in student.__table__.columns}
            
            df_engineered = preprocess_notebook8_features(pd.DataFrame([student_dict]), db_g1_mean)
            df_final = df_engineered.reindex(columns=model_features, fill_value=0)
            df_final = df_final.apply(pd.to_numeric, errors='coerce').fillna(0).astype(float)
            
            pred_g3 = round(float(np.clip(model_reg.predict(df_final)[0], 0, 20)), 1)
            risk_prob = float(model_clf.predict_proba(df_final)[:, 1][0])
        except Exception as e:
            print(f"Prediction Error in insights: {e}")

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
        "recommended_actions": actions
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
            csv_g1_mean = df['G1'].mean() if 'G1' in df.columns else 10.9
            
            df_engineered = preprocess_notebook8_features(df, csv_g1_mean)
            df_final = df_engineered.reindex(columns=model_features, fill_value=0)
            df_final = df_final.apply(pd.to_numeric, errors='coerce').fillna(0).astype(float)
            
            scores = model_clf.predict_proba(df_final)[:, 1]
        
        new_students = []
        for i, row in df.iterrows():
            score = float(scores[i])
            new_student = models.Student(
                teacher_id=teacher_id,
                student_name=row.get('student_name', f"Student {i+1}"),
                age=int(row.get('age', 15) if pd.notna(row.get('age')) else 15),
                G1=int(row.get('G1', 10) if pd.notna(row.get('G1')) else 10),
                absences=int(row.get('absences', 0) if pd.notna(row.get('absences')) else 0),
                failures=int(row.get('failures', 0) if pd.notna(row.get('failures')) else 0),
                studytime=int(row.get('studytime', 2) if pd.notna(row.get('studytime')) else 2),
                goout=int(row.get('goout', 3) if pd.notna(row.get('goout')) else 3),
                schoolsup=str(row.get('schoolsup', 'no')),
                famsup=str(row.get('famsup', 'no')),
                internet=str(row.get('internet', 'yes')),
                health=int(row.get('health', 3) if pd.notna(row.get('health')) else 3),
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