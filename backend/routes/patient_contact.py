from flask import Blueprint, request, jsonify
from firebase import db
from firebase_admin import firestore
from utils.auth import verify_hospital_token

patient_contact_bp = Blueprint("patient_contact", __name__)


@patient_contact_bp.route("/patients/<patient_id>/contact", methods=["PATCH"])
def update_patient_contact(patient_id):
    try:
        # =============================
        # 🔐 AUTH (Hospital only)
        # =============================
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Authorization token missing")

        id_token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(id_token)

        # =============================
        # 📥 INPUT
        # =============================
        data = request.get_json()

        patient_email = data.get("patient_email")
        guardian_email = data.get("guardian_email")

        if patient_email is None and guardian_email is None:
            raise ValueError("At least one email field must be provided")

        # =============================
        # 📂 PATIENT REF
        # =============================
        patient_ref = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
            .document(patient_id)
        )

        if not patient_ref.get().exists:
            raise ValueError("Patient not found")

        # =============================
        # 💾 UPDATE (MUTABLE)
        # =============================
        update_data = {
            "updated_at": firestore.SERVER_TIMESTAMP
        }

        if patient_email is not None:
            update_data["patient_email"] = patient_email

        if guardian_email is not None:
            update_data["guardian_email"] = guardian_email

        patient_ref.update(update_data)

        return jsonify({
            "message": "Patient contact information updated",
            "patient_id": patient_id,
            "updated_fields": list(update_data.keys())
        })

    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500