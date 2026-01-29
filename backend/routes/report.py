from flask import Blueprint, request, send_file
from firebase import db
from utils.auth import verify_hospital_token
from utils.pdf_generator import generate_patient_report

report_bp = Blueprint("report", __name__)


@report_bp.route("/patients/<patient_id>/report/pdf", methods=["GET"])
def patient_pdf_report(patient_id):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return {"error": "Unauthorized"}, 401

    id_token = auth_header.replace("Bearer ", "")
    hospital_id, _ = verify_hospital_token(id_token)

    hospital = db.collection("hospitals").document(hospital_id).get().to_dict()

    patient_ref = (
        db.collection("hospitals")
        .document(hospital_id)
        .collection("patients")
        .document(patient_id)
    )

    patient = patient_ref.get().to_dict()
    if not patient:
        return {"error": "Patient not found"}, 404

    patient["patient_id"] = patient_id

    records = []
    for r in patient_ref.collection("records").order_by("created_at").stream():
        d = r.to_dict() or {}

        # ✅ SAFE DOCTOR NOTE HANDLING
        doctor_notes = d.get("doctor_notes") or {}

        records.append({
            "created_at": d.get("created_at"),
            "prediction": d.get("prediction", {}),
            "input": d.get("input", {}),
            "derived": d.get("derived", {}),
            "doctor_note": doctor_notes.get("text"),
            "ecg_flags": d.get("ecg_flags"),
        })

    pdf = generate_patient_report(hospital, patient, records)

    return send_file(
        pdf,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"{patient_id}_report.pdf"
    )