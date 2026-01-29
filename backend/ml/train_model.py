import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# -----------------------------
# 1. Load Dataset
# -----------------------------
DATA_PATH = "../data/cardiac_failure_with_symptoms.csv"
df = pd.read_csv(DATA_PATH)

print("Dataset shape:", df.shape)

# -----------------------------
# 2. Drop unnecessary columns
# -----------------------------
for col in ["id", "Unnamed: 0"]:
    if col in df.columns:
        df.drop(columns=[col], inplace=True)

# -----------------------------
# 3. Fix Age (normalized → years)
# -----------------------------
df["age_years"] = (df["age"] * 100).astype(int)
df.drop(columns=["age"], inplace=True)

# -----------------------------
# 4. BMI Feature
# -----------------------------
df["bmi"] = df["weight"] / ((df["height"] / 100) ** 2)

# -----------------------------
# 5. Encode Symptoms (SINGLE SOURCE OF TRUTH)
# -----------------------------
df["chest_pain"] = df["chest_pain"].map({
    "none": 0,
    "mild": 1,
    "moderate": 2,
    "severe": 3
})

df["nausea"] = df["nausea"].map({
    "no": 0,
    "yes": 1
})

df["palpitations"] = df["palpitations"].map({
    "no": 0,
    "yes": 1
})

df["dizziness"] = df["dizziness"].map({
    "no": 0,
    "mild": 1,
    "severe": 2
})

# -----------------------------
# 6. Handle missing / invalid mappings
# -----------------------------
df.fillna(0, inplace=True)

# -----------------------------
# 7. Features & Target
# -----------------------------
TARGET = "cardio"

FEATURES = [
    "age_years",
    "gender",
    "height",
    "weight",
    "bmi",
    "ap_hi",
    "ap_lo",
    "cholesterol",
    "gluc",
    "smoke",
    "alco",
    "active",
    "chest_pain",
    "nausea",
    "palpitations",
    "dizziness"
]

X = df[FEATURES]
y = df[TARGET]

# -----------------------------
# 8. Train / Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# -----------------------------
# 9. Scaling
# -----------------------------
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# -----------------------------
# 10. Train Model
# -----------------------------
model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced"
)

model.fit(X_train_scaled, y_train)

# -----------------------------
# 11. Evaluation
# -----------------------------
y_pred = model.predict(X_test_scaled)

print("\nAccuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n", classification_report(y_test, y_pred))

# -----------------------------
# 12. Save Model & Scaler
# -----------------------------
joblib.dump(model, "../models/model.pkl")
joblib.dump(scaler, "../models/scaler.pkl")

print("\nModel and scaler saved successfully.")