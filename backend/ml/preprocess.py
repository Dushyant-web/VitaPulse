import numpy as np
import joblib
import pandas as pd

# Feature order MUST match training
FEATURE_ORDER = [
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

# Symptom encoders (MUST match training)
CHEST_PAIN_MAP = {
    "none": 0,
    "mild": 1,
    "moderate": 2,
    "severe": 3
}

DIZZINESS_MAP = {
    "no": 0,
    "mild": 1,
    "severe": 2
}


def preprocess_input(input_data: dict, scaler_path: str):
    """
    Preprocess user input for prediction.

    Returns:
        np.ndarray: Scaled feature array
        float: Calculated BMI
    """

    # -----------------------------
    # 1. Age (years)
    # -----------------------------
    age_years = int(input_data["age"])

    # -----------------------------
    # 2. BMI calculation
    # -----------------------------
    height_m = float(input_data["height"]) / 100
    weight = float(input_data["weight"])
    bmi = weight / (height_m ** 2)

    # -----------------------------
    # 3. Symptoms (safe defaults)
    # -----------------------------
    chest_pain_raw = input_data.get("chest_pain", "none")
    dizziness_raw = input_data.get("dizziness", "no")

    chest_pain = CHEST_PAIN_MAP.get(chest_pain_raw, 0)
    dizziness = DIZZINESS_MAP.get(dizziness_raw, 0)

    YES_NO_MAP = {
    "no": 0,
    "yes": 1,
    0: 0,
    1: 1
    }
    nausea_raw = input_data.get("nausea", 0)
    palpitations_raw = input_data.get("palpitations", 0)

    nausea = YES_NO_MAP.get(nausea_raw, 0)
    palpitations = YES_NO_MAP.get(palpitations_raw, 0)

    # -----------------------------
    # 4. Build feature dictionary
    # -----------------------------
    features = {
        "age_years": age_years,
        "gender": int(input_data["gender"]),
        "height": float(input_data["height"]),
        "weight": weight,
        "bmi": bmi,
        "ap_hi": int(input_data["ap_hi"]),
        "ap_lo": int(input_data["ap_lo"]),
        "cholesterol": int(input_data["cholesterol"]),
        "gluc": int(input_data["gluc"]),
        "smoke": int(input_data["smoke"]),
        "alco": int(input_data["alco"]),
        "active": int(input_data["active"]),
        "chest_pain": chest_pain,
        "nausea": nausea,
        "palpitations": palpitations,
        "dizziness": dizziness
    }

    # -----------------------------
    # 5. Order features
    # -----------------------------
    feature_vector = [features[col] for col in FEATURE_ORDER]
    feature_array = pd.DataFrame([feature_vector], columns=FEATURE_ORDER)

    # -----------------------------
    # 6. Scale features
    # -----------------------------
    scaler = joblib.load(scaler_path)
    scaled_features = scaler.transform(feature_array)

    return scaled_features, round(bmi, 2)