from flask import Blueprint, request, jsonify
from firebase import db
from utils.auth import verify_hospital_token

timeline_bp = Blueprint("timeline", __name__)



def serialize_timestamp(ts):
    """
    Convert Firestore Timestamp → JSON-safe dict
    """
    if ts is None:
        return None

    # Firestore Timestamp object
    if hasattr(ts, "seconds"):
        return {
            "seconds": ts.seconds,
            "nanoseconds": ts.nanoseconds
        }

    return ts



def calculate_health_score(probability, trend_status):
    if probability is None:
        return None

    score = 100 - int(round(probability * 100))

    if trend_status == "improving":
        score += 5
    elif trend_status == "worsening":
        score -= 5

    return max(0, min(100, score))



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



@timeline_bp.route("/patients/<patient_id>/timeline", methods=["GET"])
def patient_timeline(patient_id):
    try:
       
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Authorization token missing")

        id_token = auth_header.replace("Bearer ", "").strip()
        _, hospital_email = verify_hospital_token(id_token)
        hospital_id = get_hospital_id_by_email(hospital_email)

      
        patient_ref = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
            .document(patient_id)
        )

        patient_doc = patient_ref.get()
        if not patient_doc.exists:
            raise ValueError("Patient not found")

        patient_data = patient_doc.to_dict()

      
        records_ref = (
            patient_ref
            .collection("records")
            .order_by("created_at")
        )

        timeline = []
        probabilities = []

        for record in records_ref.stream():
            data = record.to_dict() or {}

            created_at = data.get("created_at")
            if created_at is None:
                created_at = record.create_time  # 🔥 GUARANTEED FALLBACK

        
            prob = (
                data.get("probability")
                or data.get("prediction", {}).get("probability")
            )

            if isinstance(prob, (int, float)):
                probabilities.append(prob)

            timeline.append({
                "record_id": record.id,

                #  ALWAYS PRESENT NOW
                "date": serialize_timestamp(created_at),

                "risk": {
                    "probability": prob,
                    "risk_level": (
                        data.get("risk_level")
                        or data.get("prediction", {}).get("risk_level")
                    ),
                    "confidence": data.get("prediction", {}).get("confidence")
                },

                "prediction": {
                "probability": prob or 0,
                "risk_level": (
                    data.get("risk_level")
                    or data.get("prediction", {}).get("risk_level")
                    or "—"
                ),
                "confidence": data.get("prediction", {}).get("confidence")
            },

                "vitals": {
                    "ap_hi": data.get("input", {}).get("ap_hi"),
                    "ap_lo": data.get("input", {}).get("ap_lo"),
                    "bmi": data.get("derived", {}).get("bmi"),
                    "weight": data.get("input", {}).get("weight"),
                    "height": data.get("input", {}).get("height")
                },

                "ecg_risk_delta": data.get("derived", {}).get("ecg_risk_delta"),
                "doctor_notes": data.get("doctor_notes"),

                
                "lifestyle": {
                    "smoke": data.get("input", {}).get("smoke"),
                    "alco": data.get("input", {}).get("alco"),
                    "active": data.get("input", {}).get("active")
                },

                "symptoms": {
                    "chest_pain": data.get("input", {}).get("chest_pain"),
                    "nausea": data.get("input", {}).get("nausea"),
                    "palpitations": data.get("input", {}).get("palpitations"),
                    "dizziness": data.get("input", {}).get("dizziness")
                },

                
                "ecg": data.get("ecg"),

              
                "symptom_insights": data.get("symptom_insights", []),
                "explanation": data.get("explanation"),
                "what_if": data.get("what_if", []),
                "top_factors": data.get("top_factors", [])
            })

        
        trend = {"status": "insufficient_data", "delta": None}

        if len(probabilities) >= 2:
            delta = round(probabilities[-1] - probabilities[0], 3)
            trend["delta"] = delta
            trend["status"] = (
                "worsening" if delta > 0.05
                else "improving" if delta < -0.05
                else "stable"
            )

        latest_probability = probabilities[-1] if probabilities else None
        health_score = calculate_health_score(
            probability=latest_probability,
            trend_status=trend["status"]
        )

       
        return jsonify({
            "hospital": {
                "hospital_id": hospital_id,
                "email": hospital_email
            },
            "patient": {
                "patient_id": patient_id,
                "name": patient_data.get("name"),
                "age": patient_data.get("age"),
                "gender": patient_data.get("gender"),
                "primary_mobile": patient_data.get("primary_mobile"),
                "patient_email": patient_data.get("patient_email"),
                "guardian_email": patient_data.get("guardian_email"),
                "outcome": patient_data.get("outcome", {})
            },
            "summary": {
                "records_count": len(timeline),
                "latest_probability": latest_probability,
                "latest_risk_level": (
                    timeline[-1]["risk"]["risk_level"]
                    if timeline else None
                ),
                "trend": trend,
                "health_score": health_score
            },
            "timeline": timeline
        })

    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        print("TIMELINE ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500