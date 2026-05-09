import shap
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import io
import base64
import joblib

# Load models
model_clf = joblib.load('xgb_risk_classifier.pkl')
model_features = joblib.load('feature_names.pkl')
explainer = shap.TreeExplainer(model_clf)

# Create a dummy df
df = pd.DataFrame(np.random.rand(1, len(model_features)), columns=model_features)

# Generate Explanation object
shap_values = explainer(df)

# Plot waterfall
plt.figure()
shap.plots.waterfall(shap_values[0], show=False)
buf = io.BytesIO()
plt.savefig(buf, format='png', bbox_inches='tight')
buf.seek(0)
img_base64 = base64.b64encode(buf.read()).decode('utf-8')
print("Base64 string length:", len(img_base64))
