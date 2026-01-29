import firebase_admin
from firebase_admin import credentials, auth

# 🔐 Initialize Firebase Admin
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

# 👤 ADMIN CREDENTIALS (temporary)
email = "admin@vitapulse.dev"
password = "Admin@12345"

# ✅ Create user
user = auth.create_user(
    email=email,
    password=password
)

# ✅ Set admin claim
auth.set_custom_user_claims(user.uid, {"admin": True})

print("✅ Admin user created successfully")
print("Email:", email)
print("Password:", password)
print("UID:", user.uid)