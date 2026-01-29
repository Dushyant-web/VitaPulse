from flask import Blueprint, request, jsonify
from firebase_admin import auth, firestore
from firebase import db
from utils.auth import verify_admin_token

auth_bp = Blueprint("auth", __name__)

# ===============================
# 🔐 LOGIN (handled by Firebase SDK)
# ===============================
@auth_bp.route("/auth/login", methods=["POST"])
def login():
    return jsonify({
        "message": "Login handled by Firebase client SDK"
    }), 200


# ===============================
# 👤 WHO AM I (Hospital Profile)
# ===============================
@auth_bp.route("/auth/me", methods=["GET", "OPTIONS"])
def me():
    # ✅ Handle CORS preflight
    if request.method == "OPTIONS":
        return "", 200

    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Authorization token missing")

        id_token = auth_header.replace("Bearer ", "").strip()
        decoded = auth.verify_id_token(id_token)

        hospital_id = decoded["uid"]

        hospital_doc = db.collection("hospitals").document(hospital_id).get()
        if not hospital_doc.exists:
            raise ValueError("Hospital not found")

        hospital = hospital_doc.to_dict()

        return jsonify({
            "hospital_id": hospital_id,
            "name": hospital.get("name"),
            "email": hospital.get("email"),
            "address": hospital.get("address"),
            "is_first_login": hospital.get("is_first_login", True),
            "is_active": hospital.get("is_active", True)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 401


# ===============================
# 🏥 ADMIN-ONLY HOSPITAL SIGNUP
# ===============================
@auth_bp.route("/auth/signup", methods=["POST"])
def signup_hospital():
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Admin authorization missing")

        admin_token = auth_header.replace("Bearer ", "").strip()
        verify_admin_token(admin_token)

        data = request.get_json()
        if not data:
            raise ValueError("Request body missing")

        user = auth.create_user(
            email=data["email"],
            password=data["password"]
        )

        hospital_id = user.uid

        db.collection("hospitals").document(hospital_id).set({
            "hospital_id": hospital_id,
            "name": data["name"],
            "address": data["address"],
            "email": data["email"],
            "created_at": firestore.SERVER_TIMESTAMP,

            # 🔑 IMPORTANT
            "is_first_login": True,
            "is_active": True
        })

        return jsonify({
            "message": "Hospital created successfully",
            "hospital_id": hospital_id
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ===============================
# ✅ COMPLETE ONBOARDING
# ===============================
@auth_bp.route("/auth/complete-onboarding", methods=["POST"])
def complete_onboarding():
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Authorization missing")

        id_token = auth_header.replace("Bearer ", "").strip()
        decoded = auth.verify_id_token(id_token)

        hospital_id = decoded["uid"]

        db.collection("hospitals").document(hospital_id).update({
            "is_first_login": False
        })

        return jsonify({"success": True})

    except Exception:
        return jsonify({"error": "Unauthorized"}), 401