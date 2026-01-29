import csv
import os
from backend.firebase import db

OUTPUT_FILE = "cardio_records_export.csv"


def export_all_records():
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

            records = (
                db.collection("hospitals")
                .document(hospital_id)
                .collection("patients")
                .document(patient_id)
                .collection("records")
                .stream()
            )

            for record in records:
                data = record.to_dict()

                # ---------- Base ----------
                created_at = data.get("created_at")
                if created_at:
                    created_at = created_at.isoformat()

                row = {
                    "hospital_id": hospital_id,
                    "patient_id": patient_id,
                    "created_at": created_at,
                }

                # ---------- Prediction ----------
                prediction = data.get("prediction", {})
                row["probability"] = prediction.get("probability")
                row["risk_level"] = prediction.get("risk_level")
                row["confidence"] = prediction.get("confidence")

                # ---------- Derived ----------
                derived = data.get("derived", {})
                row["bmi"] = derived.get("bmi")

                # ---------- Input ----------
                input_data = data.get("input", {})
                for k, v in input_data.items():
                    row[k] = v

                # ---------- ECG ----------
                ecg = data.get("ecg")
                if ecg:
                    for k, v in ecg.items():
                        row[f"ecg_{k}"] = v

                rows.append(row)

    return rows


def write_csv(rows, filename=OUTPUT_FILE):
    if not rows:
        print("❌ No records found to export.")
        return

    output_path = os.path.join(os.getcwd(), filename)

    fieldnames = set()
    for row in rows:
        fieldnames.update(row.keys())

    fieldnames = sorted(fieldnames)

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"✅ CSV exported successfully: {output_path}")


if __name__ == "__main__":
    rows = export_all_records()
    write_csv(rows)