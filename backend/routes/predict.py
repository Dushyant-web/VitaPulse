from flask import Blueprint, request, jsonify
import joblib

from ml.preprocess import preprocess_input
from utils.validators import validate_input
from utils.risk_mapper import map_risk
from utils.explain import get_top_features, explain_symptoms
from utils.auth import verify_hospital_token
from utils.schema import validate_record_schema
from config import MODEL_PATH, SCALER_PATH

from utils.human_explain import generate_explanation
from utils.what_if import what_if_analysis
from utils.confidence import prediction_confidence
from utils.ecg_validator import validate_ecg
from utils.ecg_flags import generate_ecg_flags
from utils.ecg_risk_delta import calculate_ecg_risk_delta
from firebase_admin import firestore

from firebase import db

#  Load ONCE at startup (fast + safe)
model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

predict_bp = Blueprint("predict", __name__)

def get_hospital_id_by_email(email: str) -> str:
    hospitals = (
        db.collection("hospitals")
        .where("email", "==", email)
        .limit(1)
        .stream()
    )

    for hospital in hospitals:
        return hospital.id

    raise ValueError("Hospital not registered in Firestore")


CHEST_PAIN_MAP = {
    "none": 0,
    "mild": 1,
    "moderate": 2,
    "severe": 3
}

YES_NO_MAP = {
    0: 0,
    1: 1,
    "no": 0,
    "yes": 1,
    False: 0,
    True: 1
}


def build_model_input(input_data: dict):
    """
    Builds ML-ready feature vector EXACTLY as model expects
    """

    age_years = input_data["age"]

    height = input_data["height"]
    weight = input_data["weight"]

    bmi = round(weight / ((height / 100) ** 2), 2)

    #  ENCODE STRINGS → NUMBERS HERE
    chest_pain_raw = input_data.get("chest_pain", "none")
    chest_pain = CHEST_PAIN_MAP.get(str(chest_pain_raw).lower(), 0)

    feature_vector = [[
        age_years,
        int(input_data["gender"]),
        height,
        weight,
        bmi,
        input_data["ap_hi"],
        input_data["ap_lo"],
        input_data["cholesterol"],
        input_data["gluc"],
        YES_NO_MAP.get(input_data.get("smoke"), 0),
        YES_NO_MAP.get(input_data.get("alco"), 0),
        YES_NO_MAP.get(input_data.get("active"), 0),
        chest_pain,  # ✅FIXED
        YES_NO_MAP.get(input_data.get("nausea"), 0),
        YES_NO_MAP.get(input_data.get("palpitations"), 0),
        YES_NO_MAP.get(input_data.get("dizziness"), 0),
    ]]

    return feature_vector, bmi

def build_patient_risk_factors(input_data, bmi):
    factors = []

    if input_data["ap_hi"] >= 140:
        factors.append({
            "label": "High Blood Pressure",
            "severity": "high",
            "score": min(100, int((input_data["ap_hi"] - 120) * 1.5))
        })

    if bmi >= 25:
        factors.append({
            "label": "High BMI (Obesity)",
            "severity": "medium",
            "score": min(100, int((bmi - 23) * 10))
        })

    if input_data["cholesterol"] == 1:
        factors.append({
            "label": "High Cholesterol",
            "severity": "medium",
            "score": 60
        })

    if input_data["gluc"] == 1:
        factors.append({
            "label": "High Blood Glucose",
            "severity": "medium",
            "score": 60
        })

    if input_data["smoke"] == 1:
        factors.append({
            "label": "Smoking Habit",
            "severity": "high",
            "score": 70
        })

    return factors[:3]


@predict_bp.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        save_flag = bool(data.get("save", True))

      
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Authorization token missing")

        id_token = auth_header.replace("Bearer ", "").strip()
        _, hospital_email = verify_hospital_token(id_token)
        hospital_id = get_hospital_id_by_email(hospital_email)

        
        if "input" not in data:
            raise ValueError("Missing input data")

        input_data = data["input"]
        ecg_raw = data.get("ecg")
        doctor_note_text = (data.get("doctor_notes") or {}).get("text")

      
        outcome_raw = data.get("outcome", {})
        cardiac_arrest = int(outcome_raw.get("cardiac_arrest", 0))
        confirmed_by = outcome_raw.get("confirmed_by")

        validate_input(input_data)

    
        ecg = None
        ecg_flags = {"status": "not_recorded", "flags": []}
        ecg_risk_delta = {"delta": 0.0, "reasons": []}

        if ecg_raw:
            ecg = {k: v for k, v in ecg_raw.items() if v is not None}
            if ecg:
                validate_ecg(ecg)
                ecg_flags = generate_ecg_flags(ecg, input_data.get("gender"))
                ecg_risk_delta = calculate_ecg_risk_delta(ecg)

        from joblib import load
        
        
        X_raw, bmi = build_model_input(input_data)
        X_scaled = scaler.transform(X_raw)
        
        probability = model.predict_proba(X_scaled)[0][1]
        risk_level = map_risk(probability)

    
        top_factors = build_patient_risk_factors(input_data, bmi)
        symptom_insights = explain_symptoms(input_data)
        explanation = generate_explanation(input_data, bmi)
        what_if = what_if_analysis(model, input_data)
        confidence = prediction_confidence(probability)
       
        patient_id = data.get("patient_id")
        if not patient_id:
            raise ValueError("patient_id is required")

        patient_ref = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
            .document(patient_id)
        )

       
        patient_update = {
            "gender": input_data.get("gender"),
            "updated_at": firestore.SERVER_TIMESTAMP,
        }

        if cardiac_arrest == 1:
            patient_update["cardio_confirmed"] = True
            patient_update["cardio_confirmed_at"] = firestore.SERVER_TIMESTAMP
            patient_update["confirmed_by"] = confirmed_by or "doctor"

        patient_ref.set(patient_update, merge=True)

      
        record = {
            "created_at": firestore.SERVER_TIMESTAMP,

            "input": {
                "age": input_data["age"],
                "gender": input_data["gender"],
                "height": input_data["height"],
                "weight": input_data["weight"],
                "ap_hi": input_data["ap_hi"],
                "ap_lo": input_data["ap_lo"],
                "cholesterol": input_data["cholesterol"],
                "gluc": input_data["gluc"],
                "smoke": input_data["smoke"],
                "alco": input_data["alco"],
                "active": input_data["active"],
                "chest_pain": input_data.get("chest_pain"),
                "nausea": input_data.get("nausea"),
                "palpitations": input_data.get("palpitations"),
                "dizziness": input_data.get("dizziness"),
            },

            "derived": {
                "bmi": bmi,
                "ecg_risk_delta": ecg_risk_delta
            },

            "prediction": {
                "probability": round(float(probability), 3),
                "risk_level": risk_level,
                "confidence": confidence,
            },
            "risk_level": risk_level,
            "probability": round(float(probability), 3),
            "confidence": confidence,

            "symptom_insights": symptom_insights,
            "top_factors": top_factors,
            "what_if": what_if,

            "ecg": ecg,
            "ecg_flags": ecg_flags,

            "doctor_notes": (
                {
                    "text": doctor_note_text.strip(),
                    "created_at": firestore.SERVER_TIMESTAMP,
                    "locked": True
                }
                if doctor_note_text
                else None
            ),

            
            "outcome": {
                "cardiac_arrest": cardiac_arrest,
                "confirmed_by": confirmed_by,
                "confirmed_at": firestore.SERVER_TIMESTAMP if cardiac_arrest == 1 else None
            }
        }

        validate_record_schema(record)
        if save_flag:
            patient_ref.collection("records").add(record)

         
        if save_flag and cardiac_arrest == 1:
            for rec in patient_ref.collection("records").stream():
                rec.reference.set(
                    {
                        "outcome": {
                            "cardiac_arrest": 1,
                            "confirmed_by": confirmed_by or "doctor",
                            "confirmed_at": firestore.SERVER_TIMESTAMP
                        }
                    },
                    merge=True
                )

        
        return jsonify({
            "probability": round(float(probability), 3),
            "risk_level": risk_level,
            "confidence": confidence,
            "bmi": bmi,
            "top_factors": top_factors,
            "symptom_insights": symptom_insights,
            "explanation": explanation,
            "what_if": what_if,
            "ecg_flags": ecg_flags,
            "ecg_risk_delta": ecg_risk_delta,
            "disclaimer": "This is not a medical diagnosis",
        })
    



    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        print("PREDICT ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500
 