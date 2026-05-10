import pandas as pd
import numpy as np
import joblib
import shap
import os

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

# All .pkl model files live in backend/models/
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')

def _model_path(filename: str) -> str:
    """Return the absolute path to a model file inside backend/models/."""
    return os.path.join(MODELS_DIR, filename)

try:
    model_clf      = joblib.load(_model_path('xgb_risk_classifier.pkl'))
    model_reg      = joblib.load(_model_path('xgb_g3_regressor.pkl'))
    model_features = joblib.load(_model_path('feature_names.pkl'))

    try:
        best_threshold = float(joblib.load(_model_path('best_threshold.pkl')))
    except Exception:
        best_threshold = 0.5

    explainer = shap.TreeExplainer(model_clf)
    print(f"[SUCCESS] ML Models Loaded. Features: {len(model_features)} | F1 Threshold: {best_threshold}")
except Exception as e:
    model_clf, model_reg, model_features, explainer, best_threshold = None, None, None, None, 0.5
    print(f"[ERROR] ML Models failed to load: {e}")


def get_risk_tier(prob, threshold=None):
    th = threshold if threshold else best_threshold
    if prob >= th: return 'HIGH'
    if prob >= (th * 0.6): return 'MODERATE'
    return 'LOW'

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
