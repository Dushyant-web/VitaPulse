from flask import Blueprint, request, jsonify
from firebase_admin import firestore, auth
from firebase import db
from utils.email_sender import send_rejection_email

admin_reject_bp = Blueprint("admin_reject", __name__)

def verify_admin(request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise Exception("Missing Authorization header")

    id_token = auth_header.replace("Bearer ", "")
    decoded = auth.verify_id_token(id_token)

    if not db.collection("admins").document(decoded["uid"]).get().exists:
        raise Exception("Not an admin user")

    return decoded


@admin_reject_bp.route("/admin/hospital-requests/<request_id>/reject", methods=["POST"])
def reject_hospital(request_id):
    try:
        decoded = verify_admin(request)

        req_ref = db.collection("hospital_requests").document(request_id)
        req_doc = req_ref.get()

        if not req_doc.exists:
            return jsonify({"error": "Request not found"}), 404

        data = req_doc.to_dict()
        if data["status"] != "pending":
            return jsonify({"error": "Already processed"}), 400

        req_ref.update({
            "status": "rejected",
            "rejected_at": firestore.SERVER_TIMESTAMP
        })

        # 🧾 AUDIT LOG
        db.collection("audit_logs").add({
            "action": "REJECT_HOSPITAL",
            "admin_id": decoded["uid"],
            "hospital_email": data["email"],
            "request_id": request_id,
            "status": "rejected",
            "timestamp": firestore.SERVER_TIMESTAMP
        })

        # 📧 REJECTION EMAIL
        try:
            send_rejection_email(
                email=data["email"],
                hospital_name=data.get("hospital_name", "Team")
            )
        except Exception as e:
            print("REJECTION EMAIL FAILED:", e)

        return jsonify({"success": True})

    except Exception as e:
        print("REJECT ERROR:", e)
        return jsonify({"error": str(e)}), 500