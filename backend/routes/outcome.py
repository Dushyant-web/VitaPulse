from flask import Blueprint, request, jsonify
from firebase import db
from utils.auth import verify_hospital_token
from firebase_admin import firestore

outcome_bp = Blueprint("outcome", __name__)


@outcome_bp.route("/patients/<patient_id>/outcome", methods=["POST"])
def mark_patient_outcome(patient_id):
    try:
        #  AUTH
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Authorization token missing")

        token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(token)

        data = request.get_json()
        cardiac_arrest = data.get("cardiac_arrest")

        if cardiac_arrest not in [0, 1]:
            raise ValueError("cardiac_arrest must be 0 or 1")

        patient_ref = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
            .document(patient_id)
        )

        patient_doc = patient_ref.get()
        if not patient_doc.exists:
            raise ValueError("Patient not found")

        #  CHECK IF ALREADY MARKED
        existing = patient_doc.to_dict().get("outcome", {})
        if existing.get("cardiac_arrest") == 1:
            return jsonify({
                "message": "Outcome already locked",
                "cardiac_arrest": 1
            }), 200

        #  SAVE ONCE (IMMUTABLE)
        patient_ref.set({
            "outcome": {
                "cardiac_arrest": 1,
                "marked_at": firestore.SERVER_TIMESTAMP
            }
        }, merge=True)

        return jsonify({
            "message": "Cardiac arrest outcome saved and locked",
            "cardiac_arrest": 1
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400