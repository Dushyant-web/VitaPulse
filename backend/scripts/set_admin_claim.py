import firebase_admin
from firebase_admin import auth, credentials

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

ADMIN_UID = "ITidlDrBm5f7s8tBu67Z3n4noiH3"

auth.set_custom_user_claims(ADMIN_UID, {
    "admin": True
})

print("✅ Admin claim set successfully")