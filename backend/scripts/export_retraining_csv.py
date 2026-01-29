import sys
import os
import csv

# ✅ Add backend to Python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from firebase import db

OUTPUT_FILE = "retraining_dataset.csv"

FIELDS = [
    "patient_id",
    "age",
    "gender",
    "height",
    "weight",
    "ap_hi",
    "ap_lo",
    "cholesterol",
    "gluc",
    "smoke",
    "alco",
    "active",
    "bmi",
    "chest_pain",
    "nausea",
    "palpitations",
    "dizziness",
    "ecg_heart_rate",
    "ecg_pr_interval_ms",
    "ecg_qrs_duration_ms",
    "ecg_qt_interval_ms",
    "ecg_arrhythmia_detected",
    "cardio",
]

def export_retraining_data():
    rows = []

    hospitals = db.collection("hospitals").stream()

    for hospital in hospitals:
        hospital_id = hospital.id

        patients = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
            .stream()
        )

        for patient in patients:
            patient_id = patient.id
            patient_data = patient.to_dict()

            # ===============================
            # 🧠 PATIENT-LEVEL LABEL (SOURCE OF TRUTH)
            # ===============================
            outcome = patient_data.get("outcome", {})
            cardiac = outcome.get("cardiac_arrest", 0)

            if cardiac not in (0, 1):
                cardiac = 0  # safety fallback

            records = (
                patient.reference
                .collection("records")
                .stream()
            )

            for r in records:
                d = r.to_dict()

                inp = d.get("input", {})
                derived = d.get("derived", {})
                ecg = d.get("ecg") or {}

                row = {
                    "patient_id": patient_id,
                    "age": inp.get("age"),
                    "gender": inp.get("gender"),
                    "height": inp.get("height"),
                    "weight": inp.get("weight"),
                    "ap_hi": inp.get("ap_hi"),
                    "ap_lo": inp.get("ap_lo"),
                    "cholesterol": inp.get("cholesterol"),
                    "gluc": inp.get("gluc"),
                    "smoke": inp.get("smoke"),
                    "alco": inp.get("alco"),
                    "active": inp.get("active"),
                    "bmi": derived.get("bmi"),
                    "chest_pain": inp.get("chest_pain"),
                    "nausea": inp.get("nausea"),
                    "palpitations": inp.get("palpitations"),
                    "dizziness": inp.get("dizziness"),
                    "ecg_heart_rate": ecg.get("heart_rate"),
                    "ecg_pr_interval_ms": ecg.get("pr_interval_ms"),
                    "ecg_qrs_duration_ms": ecg.get("qrs_duration_ms"),
                    "ecg_qt_interval_ms": ecg.get("qt_interval_ms"),
                    "ecg_arrhythmia_detected": ecg.get("arrhythmia_detected"),
                    "cardio": cardiac,  # ✅ BOTH 0 & 1 now
                }

                rows.append(row)

    with open(OUTPUT_FILE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"✅ Exported {len(rows)} rows to {OUTPUT_FILE}")

if __name__ == "__main__":
    export_retraining_data()