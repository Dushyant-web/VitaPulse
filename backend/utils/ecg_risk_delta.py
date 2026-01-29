def calculate_ecg_risk_delta(ecg: dict) -> dict:
    """
    Returns ECG risk delta and reasons.
    Output:
    {
        "delta": +0.07,
        "reasons": ["Tachycardia", "Prolonged QT"]
    }
    """

    if not ecg:
        return {
            "delta": 0.0,
            "reasons": []
        }

    delta = 0.0
    reasons = []

    hr = ecg.get("heart_rate")
    qt = ecg.get("qt_interval_ms")
    qrs = ecg.get("qrs_duration_ms")
    arr = ecg.get("arrhythmia_detected")

    # ⏱ Heart rate
    if hr:
        if hr > 100:
            delta += 0.05
            reasons.append("Tachycardia (high heart rate)")
        elif hr < 50:
            delta += 0.04
            reasons.append("Bradycardia (low heart rate)")

    # ⚡ QT interval
    if qt and qt > 470:
        delta += 0.04
        reasons.append("Prolonged QT interval")

    # 📈 QRS
    if qrs and qrs > 120:
        delta += 0.03
        reasons.append("Wide QRS complex")

    # ❗ Arrhythmia
    if arr is True:
        delta += 0.06
        reasons.append("Arrhythmia detected")

    return {
        "delta": round(delta, 3),
        "reasons": reasons
    }