from firebase_admin import auth


# ===============================
# 🔐 HOSPITAL TOKEN
# ===============================
def verify_hospital_token(id_token: str):
    decoded = auth.verify_id_token(id_token)

    hospital_id = decoded.get("uid")
    hospital_email = decoded.get("email")

    if not hospital_id or not hospital_email:
        raise ValueError("Invalid authentication token")

    return hospital_id, hospital_email


# ===============================
# 🔐 ADMIN TOKEN
# ===============================
def verify_admin_token(token: str):
    decoded = auth.verify_id_token(token)

    if not decoded.get("admin", False):
        raise ValueError("Not an admin user")

    return decoded