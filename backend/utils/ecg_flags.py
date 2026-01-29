# backend/utils/ecg_flags.py

def generate_ecg_flags(ecg: dict, gender: str | None = None):
    """
    Rule-based ECG abnormality detection.

    Args:
        ecg (dict): validated ECG values
        gender (str | None): 'male' | 'female' | None

    Returns:
        dict:
        {
            "status": "normal" | "abnormal" | "critical",
            "flags": [str, ...]
        }
    """

    if not ecg:
        return {
            "status": "normal",
            "flags": []
        }

    flags = []
    critical = False

    # -------------------------
    # HEART RATE
    # -------------------------
    hr = ecg.get("heart_rate")
    if hr is not None:
        if hr < 50:
            flags.append("Bradycardia (low heart rate)")
        elif hr > 100:
            flags.append("Tachycardia (high heart rate)")

    # -------------------------
    # PR INTERVAL
    # -------------------------
    pr = ecg.get("pr_interval_ms")
    if pr is not None and pr > 200:
        flags.append("Prolonged PR interval (AV conduction delay)")

    # -------------------------
    # QRS DURATION
    # -------------------------
    qrs = ecg.get("qrs_duration_ms")
    if qrs is not None and qrs > 120:
        flags.append("Wide QRS complex (ventricular conduction abnormality)")

    # -------------------------
    # QT INTERVAL (gender aware)
    # -------------------------
    qt = ecg.get("qt_interval_ms")
    if qt is not None:
        if gender == "female":
            if qt > 480:
                flags.append("Prolonged QT interval (female)")
        else:  # male or unknown
            if qt > 470:
                flags.append("Prolonged QT interval")

    # -------------------------
    # ARRHYTHMIA (CRITICAL)
    # -------------------------
    if ecg.get("arrhythmia_detected") is True:
        flags.append("Arrhythmia detected")
        critical = True

    # -------------------------
    # FINAL STATUS
    # -------------------------
    if critical:
        status = "critical"
    elif flags:
        status = "abnormal"
    else:
        status = "normal"

    return {
        "status": status,
        "flags": flags
    }