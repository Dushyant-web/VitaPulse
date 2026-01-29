import os
import joblib
from firebase_admin import storage

MODEL_BUCKET_PATH = "model.pkl"   # ✅ FIXED
LOCAL_MODEL_PATH = "/tmp/model.pkl"

def load_model():
    bucket = storage.bucket()

    blobs = list(bucket.list_blobs())

    blob = bucket.blob("model.pkl")

    if not blob.exists():
        raise FileNotFoundError("model.pkl not found in Firebase Storage")

    blob.download_to_filename("/tmp/model.pkl")
    return joblib.load("/tmp/model.pkl")