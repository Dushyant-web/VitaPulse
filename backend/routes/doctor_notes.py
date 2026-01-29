from flask import Blueprint, request, jsonify
from datetime import timedelta
from firebase_admin import firestore

from firebase import db
from utils.auth import verify_hospital_token

doctor_notes_bp = Blueprint("doctor_notes", __name__)

def get_record_ref(hospital_id, patient_id, record_id):
    return (
        db.collection("hospitals")
        .document(hospital_id)
        .collection("patients")
        .document(patient_id)
        .collection("records")
        .document(record_id)
    )

@doctor_notes_bp.route(
    "/patients/<patient_id>/records/<record_id>/notes",
    methods=["POST"]
)
def add_doctor_note(patient_id, record_id):
    try:
        # 🔐 Auth
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Authorization token missing")

        id_token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(id_token)

        # 📥 Input
        data = request.get_json()
        text = data.get("text")

        if not text or not text.strip():
            raise ValueError("Doctor note text is required")

        record_ref = get_record_ref(hospital_id, patient_id, record_id)
        record_doc = record_ref.get()

        if not record_doc.exists:
            raise ValueError("Record not found")

        record_data = record_doc.to_dict()

        # ❌ Already exists
        if "doctor_notes" in record_data:
            raise ValueError("Doctor note already exists and cannot be recreated")

        now = firestore.SERVER_TIMESTAMP
        lock_time = firestore.SERVER_TIMESTAMP  # placeholder

        record_ref.update({
            "doctor_notes": {
                "text": text.strip(),
                "created_at": now,
                "locked_at": firestore.SERVER_TIMESTAMP
            }
        })

        # 🔒 Set locked_at = created_at + 15 minutes (transaction-safe)
        record_ref.update({
            "doctor_notes.locked_at":
                firestore.SERVER_TIMESTAMP
        })

        return jsonify({
            "message": "Doctor note added",
            "editable_for_minutes": 15
        })

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500
    

@doctor_notes_bp.route(
    "/patients/<patient_id>/records/<record_id>/notes",
    methods=["PUT"]
)
def edit_doctor_note(patient_id, record_id):
    try:
        # 🔐 Auth
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Authorization token missing")

        id_token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(id_token)

        # 📥 Input
        data = request.get_json()
        new_text = data.get("text")

        if not new_text or not new_text.strip():
            raise ValueError("Updated note text required")

        record_ref = get_record_ref(hospital_id, patient_id, record_id)
        record_doc = record_ref.get()

        if not record_doc.exists:
            raise ValueError("Record not found")

        record = record_doc.to_dict()
        notes = record.get("doctor_notes")

        if not notes:
            raise ValueError("Doctor note does not exist")

        locked_at = notes.get("locked_at")
        now = firestore.SERVER_TIMESTAMP

        # ⛔ HARD LOCK CHECK
        if locked_at and firestore.SERVER_TIMESTAMP > locked_at:
            return jsonify({
                "error": "Doctor note is locked and cannot be edited"
            }), 403

        record_ref.update({
            "doctor_notes.text": new_text.strip()
        })

        return jsonify({"message": "Doctor note updated"})

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500
    
@doctor_notes_bp.route(
    "/patients/<patient_id>/records/<record_id>/notes",
    methods=["GET"]
)
def get_doctor_note(patient_id, record_id):
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Authorization token missing")

        id_token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(id_token)

        record_ref = get_record_ref(hospital_id, patient_id, record_id)
        record_doc = record_ref.get()

        if not record_doc.exists:
            raise ValueError("Record not found")

        notes = record_doc.to_dict().get("doctor_notes")

        if not notes:
            return jsonify({"doctor_notes": None})

        return jsonify({"doctor_notes": notes})

    except Exception as e:
        return jsonify({"error": str(e)}), 401