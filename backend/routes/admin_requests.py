from flask import Blueprint, request, jsonify
from firebase_admin import auth
from firebase import db

admin_requests_bp = Blueprint("admin_requests", __name__)

# ===============================
# 🔐 VERIFY ADMIN
# ===============================
def verify_admin(request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise Exception("Missing Authorization header")

    id_token = auth_header.replace("Bearer ", "")
    decoded = auth.verify_id_token(id_token)

    uid = decoded["uid"]

    admin_doc = db.collection("admins").document(uid).get()
    if not admin_doc.exists:
        raise Exception("Not an admin user")

    return decoded


# ===============================
# 📋 LIST PENDING REQUESTS
# ===============================
@admin_requests_bp.route("/admin/hospital-requests", methods=["GET"])
def list_hospital_requests():
    try:
        verify_admin(request)

        status = request.args.get("status", "pending")

        requests_ref = (
            db.collection("hospital_requests")
            .where("status", "==", status)
            .stream()
        )

        requests = []
        for doc in requests_ref:
            data = doc.to_dict()
            data["request_id"] = doc.id
            requests.append(data)

        return jsonify({
            "requests": requests,
            "status": status
        })

    except Exception as e:
        print("ADMIN LIST ERROR:", e)
        return jsonify({"error": "Unauthorized"}), 401