from flask import Blueprint, jsonify, request
from firebase import db
from firebase_admin import firestore
from utils.auth import verify_hospital_token
from datetime import datetime, timedelta, timezone

dashboard_bp = Blueprint("dashboard", __name__)

# =====================================================
# 📊 DASHBOARD ANALYTICS (HOSPITAL ONLY)
# =====================================================
@dashboard_bp.route("/dashboard/analytics", methods=["GET"])
def dashboard_analytics():
    try:
        # 🔐 AUTH
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token missing"}), 401

        id_token = auth_header.replace("Bearer ", "").strip()
        hospital_id, _ = verify_hospital_token(id_token)

        patients_ref = (
            db.collection("hospitals")
            .document(hospital_id)
            .collection("patients")
        )

        now = datetime.now(timezone.utc)
        today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

        total_patients = 0
        deleted_patients = 0
        new_today = 0
        new_last_7_days = 0

        # 📅 date -> count map (FOR 30 DAYS)
        daily_counts = {}

        for doc in patients_ref.stream():
            d = doc.to_dict()
            total_patients += 1

            if d.get("is_deleted") is True:
                deleted_patients += 1
                continue

            created_at = d.get("created_at")
            if not created_at:
                continue

            created_dt = created_at.replace(tzinfo=timezone.utc)
            created_date = created_dt.date()

            # 🟢 Today
            if created_dt >= today_start:
                new_today += 1

            # 🟢 Last 7 days
            if created_dt >= today_start - timedelta(days=6):
                new_last_7_days += 1

            # 🟦 Track for daily graph (30 days)
            day_key = created_date.isoformat()
            daily_counts[day_key] = daily_counts.get(day_key, 0) + 1

        # 📊 Build FULL 30-DAY SERIES
        daily_list = []
        start_date = today_start.date() - timedelta(days=29)

        for i in range(30):
            day = start_date + timedelta(days=i)
            key = day.isoformat()

            daily_list.append({
                "date": key,
                "count": daily_counts.get(key, 0)
            })

        return jsonify({
            "total_patients": total_patients,
            "deleted_patients": deleted_patients,
            "new_today": new_today,
            "new_last_7_days": new_last_7_days,
            "daily_counts": daily_list
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500