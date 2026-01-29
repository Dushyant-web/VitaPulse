import os
from flask import Flask
from flask_cors import CORS

from routes.predict import predict_bp
from routes.timeline import timeline_bp
from routes.auth import auth_bp
from routes.patients import patients_bp
from routes.report import report_bp
from routes.patient_contact import patient_contact_bp
from routes.send_report import send_report_bp
from routes.doctor_notes import doctor_notes_bp
from routes.outcome import outcome_bp
from routes.dashboard import dashboard_bp
from routes.hospital_request import hospital_request_bp
from routes.admin_reject import admin_reject_bp
from routes.admin_stats import admin_stats_bp
from routes.admin_audit import admin_audit_bp
from routes import register_routes


def create_app():
    app = Flask(__name__)

    # ✅ CORS (correct)
    CORS(
        app,
        origins=[
            "https://vitapulsetrack.netlify.app"
        ],
        allow_headers=["Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    )

    # 🔗 Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(predict_bp)
    app.register_blueprint(timeline_bp)
    app.register_blueprint(patients_bp)
    app.register_blueprint(doctor_notes_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(patient_contact_bp)
    app.register_blueprint(send_report_bp)
    app.register_blueprint(outcome_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(hospital_request_bp)
    app.register_blueprint(admin_reject_bp)
    app.register_blueprint(admin_stats_bp)
    app.register_blueprint(admin_audit_bp)

    register_routes(app)
    return app


# 🚀 THIS is what Gunicorn loads
app = create_app()