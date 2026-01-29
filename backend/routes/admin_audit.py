from flask import Blueprint, jsonify, request
from firebase_admin import auth
from firebase import db

admin_audit_bp = Blueprint("admin_audit", __name__)

def verify_admin(request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise Exception("Missing Authorization")

    id_token = auth_header.replace("Bearer ", "")
    decoded = auth.verify_id_token(id_token)

    if not db.collection("admins").document(decoded["uid"]).get().exists:
        raise Exception("Not admin")

    return decoded


@admin_audit_bp.route("/admin/audit-logs", methods=["GET"])
def get_audit_logs():
    try:
        verify_admin(request)

        logs_ref = (
            db.collection("audit_logs")
            .order_by("timestamp", direction="DESCENDING")
            .limit(50)
            .stream()
        )

        logs = []
        for doc in logs_ref:
            logs.append({
                **doc.to_dict(),
                "id": doc.id
            })

        return jsonify({"logs": logs})

    except Exception as e:
        return jsonify({"error": str(e)}), 401