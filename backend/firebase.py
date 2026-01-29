import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase once
if not firebase_admin._apps:
    key_json = os.getenv("FIREBASE_KEY_JSON")
    if not key_json:
        raise RuntimeError("FIREBASE_KEY_JSON env variable not set")

    cred = credentials.Certificate(json.loads(key_json))

    firebase_admin.initialize_app(
        cred,
        {
            "storageBucket": "vitapulse-9606a.firebasestorage.app"
        }
    )

# 🔥 THIS MUST BE OUTSIDE THE IF BLOCK
db = firestore.client()