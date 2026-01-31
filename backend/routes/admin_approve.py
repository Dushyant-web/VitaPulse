import secrets
from flask import Blueprint, jsonify, request
from firebase_admin import firestore, auth
from firebase import db
from utils.email_sender import send_hospital_credentials, send_welcome_kit

admin_approve_bp = Blueprint("admin_approve", __name__)

def verify_admin(request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise Exception("Missing Authorization header")

    id_token = auth_header.replace("Bearer ", "")
    decoded = auth.verify_id_token(id_token)

    admin_doc = db.collection("admins").document(decoded["uid"]).get()
    if not admin_doc.exists:
        raise Exception("Not an admin user")

    return decoded


@admin_approve_bp.route("/admin/hospital-requests/<request_id>/approve", methods=["POST"])
def approve_hospital(request_id):
    try:
        # ADMIN AUTH
        decoded = verify_admin(request)
        print("STEP 1: Admin verified")

        # FETCH REQUEST
        req_ref = db.collection("hospital_requests").document(request_id)
        req_doc = req_ref.get()

        if not req_doc.exists:
            return jsonify({"error": "Request not found"}), 404

        data = req_doc.to_dict()
        if data["status"] != "pending":
            return jsonify({"error": "Already processed"}), 400

        print("STEP 2: Request fetched")

        # CREATE / REUSE USER
        password = secrets.token_urlsafe(10)

        try:
            user = auth.create_user(email=data["email"], password=password)
            print("STEP 3: Firebase user created")
        except auth.EmailAlreadyExistsError:
            user = auth.get_user_by_email(data["email"])
            print("STEP 3: User already exists")

        hospital_id = user.uid

        #  CREATE HOSPITAL DOC
        db.collection("hospitals").document(hospital_id).set({
            "name": data["hospital_name"],
            "email": data["email"],
            "address": data.get("address"),
            "license_number": data.get("license_number"),
            "created_at": firestore.SERVER_TIMESTAMP,
            "request_id": request_id,
            "is_active": True,
            "is_first_login": True
        })

        print("STEP 4: Hospital document created")

        # SEND LOGIN EMAIL
        try:
            send_hospital_credentials(data["email"], password)
            print("STEP 5: Credentials email sent")
        except Exception as e:
            print("CREDENTIAL EMAIL FAILED:", e)

        #  SEND WELCOME KIT
        try:
            send_welcome_kit(data["email"], data["hospital_name"])
            print("STEP 6: Welcome kit sent")
        except Exception as e:
            print("WELCOME KIT FAILED:", e)

        # UPDATE REQUEST STATUS
        req_ref.update({
            "status": "approved",
            "approved_at": firestore.SERVER_TIMESTAMP,
            "hospital_id": hospital_id
        })

        #  AUDIT LOG
        db.collection("audit_logs").add({
            "action": "APPROVE_HOSPITAL",
            "admin_id": decoded["uid"],
            "hospital_email": data["email"],
            "request_id": request_id,
            "status": "approved",
            "timestamp": firestore.SERVER_TIMESTAMP
        })

        print("STEP 7: Approval completed")

        return jsonify({
            "success": True,
            "hospital_id": hospital_id,
            "login_email": data["email"],
            "temporary_password": password
        })

    except Exception as e:
        print("APPROVAL ERROR:", e)
        return jsonify({"error": str(e)}), 500