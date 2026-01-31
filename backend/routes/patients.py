from flask import Blueprint, request, jsonify
from firebase import db
from firebase_admin import firestore
from utils.auth import verify_hospital_token
import re

EMAIL_REGEX = re.compile(
    r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
)

def is_valid_email(email):
    if email is None:
        return True
    if not isinstance(email, str):
        return False
    email = email.strip()
    if email == "":
        return True
    return bool(EMAIL_REGEX.match(email))

patients_bp = Blueprint("patients", __name__)


def generate_patient_id(hospital_id):
    counter_ref = (
        db.collection("hospitals")
        .document(hospital_id)
        .collection("meta")
        .document("patient_counter")
    )

    counter_doc = counter_ref.get()

    if not counter_doc.exists:
        last_id = 0
    else:
        last_id = counter_doc.to_dict().get("last_id", 0)

    new_id = last_id + 1
    counter_ref.set({"last_id": new_id})

    return str(new_id).zfill(12)
    


@patients_bp.route("/patients", methods=["POST"])
def create_patient():
    try:
        #  AUTH
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Authorization token missing")

        id_token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(id_token)

        data = request.get_json()

        #  REQUIRED FIELDS
        name = data.get("name")
        age = data.get("age")
        gender = data.get("gender")
        primary_mobile = data.get("primary_mobile")

        if not all([name, age, gender, primary_mobile]):
            raise ValueError("name, age, gender, primary_mobile are required")

        #  Normalize mobile → last 10 digits only
        digits_only = "".join(filter(str.isdigit, primary_mobile))
        if len(digits_only) < 10:
            raise ValueError("Invalid mobile number")

        primary_mobile_norm = digits_only[-10:]

        #  DUPLICATE MOBILE CHECK (hospital scoped)
        existing = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
            .where("primary_mobile_norm", "==", primary_mobile_norm)
            .limit(1)
            .stream()
        )

        for _ in existing:
            raise ValueError("Patient with this mobile already exists")

        #  GENERATE PATIENT ID
        patient_id = generate_patient_id(hospital_id)

        patient_email = data.get("patient_email")
        guardian_email = data.get("guardian_email")
        
        if not is_valid_email(patient_email):
            raise ValueError("Invalid patient email")
        
        if not is_valid_email(guardian_email):
            raise ValueError("Invalid guardian email")

        patient_data = {
            "patient_id": patient_id,
            "name": name,
            "age": age,
            "gender": gender,

            "primary_mobile": primary_mobile,
            "primary_mobile_norm": primary_mobile_norm,

            "patient_email": data.get("patient_email"),
            "guardian_email": data.get("guardian_email"),

            "created_at": firestore.SERVER_TIMESTAMP,
            "is_deleted": False
        }

        db.collection("hospitals") \
          .document(hospital_id) \
          .collection("patients") \
          .document(patient_id) \
          .set(patient_data)

        return jsonify({
            "message": "Patient created successfully",
            "patient_id": patient_id
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 400



@patients_bp.route("/patients/search", methods=["GET"])
def search_patient_by_mobile():
    try:
        #  AUTH
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Authorization token missing")

        id_token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(id_token)

        q = request.args.get("q", "").strip()
        if len(q) < 3:
            return jsonify({"patients": []})

        q_norm = "".join(filter(str.isdigit, q))

        patients_ref = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .limit(50)
        )

        matches = []

        for doc in patients_ref.stream():
            d = doc.to_dict()


            mobile_norm = d.get("primary_mobile_norm", "")
            if q_norm == mobile_norm:
                matches.append({
                    "patient_id": d["patient_id"],
                    "name": d["name"],
                    "age": d["age"],
                    "gender": d["gender"],
                    "primary_mobile": d["primary_mobile"],
                     "created_at": d.get("created_at"),
                     "is_deleted": d.get("is_deleted", False)
                })

        return jsonify({
            "count": len(matches),
            "patients": matches
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400



@patients_bp.route("/patients", methods=["GET"])
def list_patients():
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Authorization token missing")

        id_token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(id_token)

        patients_ref = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
            .order_by("created_at", direction=firestore.Query.DESCENDING)
        )

        patients = []

        for doc in patients_ref.stream():
            d = doc.to_dict()

            patients.append({
                "patient_id": d["patient_id"],
                "name": d["name"],
                "age": d["age"],
                "gender": d["gender"],
                "primary_mobile": d["primary_mobile"],
                "created_at": d.get("created_at"),
                "is_deleted": d.get("is_deleted", False)
            })

        return jsonify({
            "count": len(patients),
            "patients": patients
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@patients_bp.route("/patients/<patient_id>", methods=["GET"])
def get_patient(patient_id):
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Authorization token missing")

        id_token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(id_token)

        patient_ref = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
            .document(patient_id)
        )

        doc = patient_ref.get()
        if not doc.exists:
            return jsonify({"error": "Patient not found"}), 404

        d = doc.to_dict()


        return jsonify({
            "patient_id": d["patient_id"],
            "name": d["name"],
            "age": d["age"],
            "gender": d["gender"],
            "primary_mobile": d["primary_mobile"],
            "primary_mobile_norm": d["primary_mobile_norm"],
            "patient_email": d.get("patient_email"),
            "guardian_email": d.get("guardian_email"),
            "is_deleted": d.get("is_deleted", False)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400



@patients_bp.route("/patients/<patient_id>/soft-delete", methods=["POST"])
def soft_delete_patient(patient_id):
    try:
        #  AUTH
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Authorization token missing")

        id_token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(id_token)

        patient_ref = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
            .document(patient_id)
        )

        snap = patient_ref.get()
        if not snap.exists:
            return jsonify({"error": "Patient not found"}), 404

        patient = snap.to_dict()

        if patient.get("is_deleted") is True:
            return jsonify({"error": "Patient already deleted"}), 400

        patient_ref.update({
            "is_deleted": True,
            "deleted_at": firestore.SERVER_TIMESTAMP,
            "deleted_reason": "manual_soft_delete",

            # PII wipe
            "name": "DELETED_PATIENT",
            "primary_mobile": None,
            "primary_mobile_norm": None,
            "patient_email": None,
            "guardian_email": None,
        })

        return jsonify({
            "success": True,
            "patient_id": patient_id,
            "message": "Patient soft-deleted successfully"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
@patients_bp.route("/patients/<patient_id>", methods=["PATCH", "POST"])
def update_patient(patient_id):
    try:
        #  AUTH
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token missing"}), 401

        id_token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(id_token)

        data = request.get_json() or {}

        patient_ref = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
            .document(patient_id)
        )

        snap = patient_ref.get()
        if not snap.exists:
            return jsonify({"error": "Patient not found"}), 404

        patient = snap.to_dict()

        #  BLOCK EDIT IF DELETED
        if patient.get("is_deleted") is True:
            return jsonify({
                "error": "Deleted patient cannot be edited"
            }), 403

        update_fields = {}



        if "name" in data:
            name = data["name"].strip()
            if name:
                update_fields["name"] = name

        if "age" in data:
            try:
                age = int(data["age"])
                if age > 0:
                    update_fields["age"] = age
            except:
                pass

        if "gender" in data:
            if data["gender"] in [0, 1, "0", "1"]:
                update_fields["gender"] = int(data["gender"])

        if "patient_email" in data:
            email = data["patient_email"]
            if not is_valid_email(email):
                return jsonify({"error": "Invalid patient email"}), 400
            update_fields["patient_email"] = email if email else None

        if "guardian_email" in data:
            email = data["guardian_email"]
            if not is_valid_email(email):
                return jsonify({"error": "Invalid guardian email"}), 400
            update_fields["guardian_email"] = email if email else None


        if "primary_mobile" in data or "primary_mobile_norm" in data:
            return jsonify({
                "error": "Mobile number cannot be changed"
            }), 400


        if not update_fields:
            return jsonify({
                "message": "No changes provided"
            }), 200

        update_fields["updated_at"] = firestore.SERVER_TIMESTAMP

        patient_ref.update(update_fields)

        return jsonify({
            "success": True,
            "updated_fields": list(update_fields.keys())
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@patients_bp.route("/patients/duplicate-check", methods=["GET"])
def duplicate_check():
    try:
        #  AUTH
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token missing"}), 401

        id_token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(id_token)

        name = request.args.get("name", "").strip().lower()
        age = request.args.get("age", "").strip()

        if not name or not age:
            return jsonify({"matches": []})

        try:
            age = int(age)
        except:
            return jsonify({"matches": []})

        patients_ref = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
            .where("age", "==", age)
            .limit(10)
        )

        matches = []

        for doc in patients_ref.stream():
            d = doc.to_dict()

            existing_name = d.get("name", "").lower()

            # simple fuzzy check
            if name in existing_name or existing_name in name:
                matches.append({
                    "patient_id": d.get("patient_id"),
                    "name": d.get("name"),
                    "age": d.get("age"),
                    "primary_mobile": d.get("primary_mobile")
                })

            if len(matches) >= 3:
                break

        return jsonify({
            "count": len(matches),
            "matches": matches
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@patients_bp.route("/patients/<patient_id>/outcome", methods=["POST"])
def set_patient_outcome(patient_id):
    try:
        #  AUTH
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token missing"}), 401

        id_token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(id_token)

        data = request.get_json() or {}

        if data.get("cardiac_arrest") != 1:
            return jsonify({"error": "Invalid outcome value"}), 400

        patient_ref = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
            .document(patient_id)
        )

        snap = patient_ref.get()
        if not snap.exists:
            return jsonify({"error": "Patient not found"}), 404

        patient = snap.to_dict()

        #  LOCK ONCE
        if patient.get("outcome", {}).get("cardiac_arrest") == 1:
            return jsonify({"message": "Outcome already locked"}), 200

        #  WRITE AT PATIENT LEVEL (ML SAFE)
        patient_ref.update({
            "outcome": {
                "cardiac_arrest": 1,
                "marked_at": firestore.SERVER_TIMESTAMP
            }
        })

        return jsonify({
            "success": True,
            "message": "Cardiac arrest outcome saved"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@patients_bp.route(
    "/patients/<patient_id>/records/<record_id>",
    methods=["DELETE"]
)
def hard_delete_record(patient_id, record_id):
    try:
        #  AUTH
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token missing"}), 401

        id_token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(id_token)

        record_ref = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
            .document(patient_id)
            .collection("records")
            .document(record_id)
        )

        snap = record_ref.get()
        if not snap.exists:
            return jsonify({"error": "Record not found"}), 404

        #  HARD DELETE
        record_ref.delete()

        return jsonify({
            "success": True,
            "message": "Record permanently deleted"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500