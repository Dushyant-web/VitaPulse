from flask import Blueprint, request, jsonify
from firebase import db
from utils.auth import verify_hospital_token
from utils.pdf_generator import generate_patient_report
from utils.email_sender import send_email_with_pdf

send_report_bp = Blueprint("send_report", __name__)

@send_report_bp.route("/patients/<patient_id>/report/email", methods=["POST"])
def send_report(patient_id):
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError("Authorization token missing")

        id_token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(id_token)

        data = request.get_json() or {}
        send_patient = data.get("send_to_patient", False)
        send_guardian = data.get("send_to_guardian", False)

        hospital = db.collection("hospitals").document(hospital_id).get().to_dict()

        patient_ref = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
            .document(patient_id)
        )

        patient = patient_ref.get().to_dict()
        if not patient:
            raise ValueError("Patient not found")

        patient["patient_id"] = patient_id

        records = []
        for r in patient_ref.collection("records").order_by("created_at").stream():
            d = r.to_dict()
            records.append({
                "created_at": d.get("created_at"),
                "prediction": d.get("prediction", {}),
                "input": d.get("input", {}),
                "derived": d.get("derived", {}),
                "doctor_note": (
                    d.get("doctor_notes", {}).get("text")
                    if isinstance(d.get("doctor_notes"), dict)
                    else None
                ),
                "ecg_flags": d.get("ecg_flags")
            })

        if not records:
            raise ValueError("No records to include")

        pdf_buffer = generate_patient_report(hospital, patient, records)

        recipients = []
        if send_patient and patient.get("patient_email"):
            recipients.append(patient["patient_email"])
        if send_guardian and patient.get("guardian_email"):
            recipients.append(patient["guardian_email"])

        if not recipients:
            raise ValueError("No valid email recipients")

        send_email_with_pdf(
            to_emails=recipients,
            subject="Patient Medical Report",
            body="Please find the attached medical report.",
            pdf_buffer=pdf_buffer
        )

        return jsonify({
            "message": "Report sent successfully",
            "sent_to": recipients,
            "records_included": len(records)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400