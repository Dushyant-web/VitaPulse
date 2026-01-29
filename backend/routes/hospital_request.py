from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from firebase import db
from utils.email_sender import send_admin_new_request_email

hospital_request_bp = Blueprint("hospital_request", __name__)


@hospital_request_bp.route("/hospital-request", methods=["POST"])
def create_hospital_request():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body missing"}), 400

        # ✅ REQUIRED FIELDS (phone REMOVED)
        required_fields = [
            "hospital_name",
            "email",
            "address",
            "license_number",
            "hospital_type",
            "intended_use",
            "justification"
        ]

        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "error": f"Missing field: {field}"
                }), 400

        # 🔁 Prevent duplicate pending requests by email
        existing = (
            db.collection("hospital_requests")
            .where("email", "==", data["email"])
            .where("status", "==", "pending")
            .limit(1)
            .stream()
        )

        for _ in existing:
            return jsonify({
                "error": "A request with this email is already pending"
            }), 409

        # 📝 CREATE REQUEST DOCUMENT
        doc_ref = db.collection("hospital_requests").add({
            "hospital_name": data["hospital_name"],
            "email": data["email"],
            "address": data["address"],
            "license_number": data["license_number"],

            "hospital_type": data["hospital_type"],
            "intended_use": data["intended_use"],
            "justification": data["justification"],
            "patient_volume": data.get("patient_volume"),  # optional

            "status": "pending",
            "created_at": firestore.SERVER_TIMESTAMP
        })

        # 📧 AUTO-EMAIL ADMIN (NON-BLOCKING)
        try:
            send_admin_new_request_email(data)
        except Exception as e:
            print("ADMIN EMAIL FAILED:", e)

        return jsonify({
            "success": True,
            "message": "Hospital access request submitted",
            "request_id": doc_ref[1].id
        }), 201

    except Exception as e:
        print("HOSPITAL REQUEST ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500