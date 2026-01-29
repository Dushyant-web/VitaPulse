# ===============================
# RECORD LEVEL
# ===============================
RECORD_SCHEMA = {
    "created_at",
    "input",
    "derived",
    "prediction",
    "ecg",
    "ecg_flags",
    "symptom_insights",
    "top_factors",
    "what_if",
    "doctor_notes"        # ✅ ADDED
}

# ===============================
# INPUT FIELDS
# ===============================
INPUT_FIELDS = {
    "age", "gender",
    "height", "weight",
    "ap_hi", "ap_lo",
    "cholesterol", "gluc",
    "smoke", "alco", "active",
    "chest_pain",
    "dizziness",
    "nausea",
    "palpitations"
}

# ===============================
# DERIVED
# ===============================
DERIVED_FIELDS = {
    "bmi",
    "ecg_risk_delta"      # ✅ ADDED
}

# ===============================
# PREDICTION
# ===============================
PREDICTION_FIELDS = {
    "probability",
    "risk_level",
    "confidence"
}

# ===============================
# ECG (OPTIONAL)
# ===============================
ECG_FIELDS = {
    "heart_rate",
    "pr_interval_ms",
    "qrs_duration_ms",
    "qt_interval_ms",
    "arrhythmia_detected"
}

# ===============================
# ECG FLAGS
# ===============================
ECG_FLAGS_FIELDS = {
    "status",
    "flags"
}


def validate_record_schema(record: dict):
    # ---------- RECORD ----------
    if not RECORD_SCHEMA.issubset(record.keys()):
        raise ValueError("Record schema violation")

    # ---------- INPUT ----------
    if set(record["input"].keys()) != INPUT_FIELDS:
        raise ValueError("Input schema violation")

    # ---------- DERIVED ----------
    if set(record["derived"].keys()) != DERIVED_FIELDS:
        raise ValueError("Derived schema violation")

    # ---------- PREDICTION ----------
    if set(record["prediction"].keys()) != PREDICTION_FIELDS:
        raise ValueError("Prediction schema violation")

    # ---------- ECG ----------
    if record["ecg"] is not None:
        if set(record["ecg"].keys()) != ECG_FIELDS:
            raise ValueError("ECG schema violation")

    # ---------- ECG FLAGS ----------
    if record["ecg_flags"] is not None:
        if set(record["ecg_flags"].keys()) != ECG_FLAGS_FIELDS:
            raise ValueError("ECG flags schema violation")

    # ---------- DOCTOR NOTES (OPTIONAL) ----------
    if record.get("doctor_notes") is not None:
        if not isinstance(record["doctor_notes"], dict):
            raise ValueError("Doctor notes schema violation")

    return True