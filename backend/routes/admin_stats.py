from flask import Blueprint, jsonify, request
from firebase_admin import auth
from firebase import db

admin_stats_bp = Blueprint("admin_stats", __name__)


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



@admin_stats_bp.route("/admin/stats", methods=["GET"])
def get_admin_stats():
    try:
        verify_admin(request)

        pending = len(list(
            db.collection("hospital_requests")
            .where("status", "==", "pending")
            .stream()
        ))

        approved = len(list(
            db.collection("hospital_requests")
            .where("status", "==", "approved")
            .stream()
        ))

        rejected = len(list(
            db.collection("hospital_requests")
            .where("status", "==", "rejected")
            .stream()
        ))

        hospitals = len(list(
            db.collection("hospitals").stream()
        ))

        return jsonify({
            "pending": pending,
            "approved": approved,
            "rejected": rejected,
            "hospitals": hospitals
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 401