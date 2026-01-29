def validate_ecg(ecg: dict):
    """
    Validate doctor-entered ECG parameters.
    All fields are OPTIONAL, but if provided must be valid.
    """

    if not isinstance(ecg, dict):
        raise ValueError("ECG data must be an object")

    def _is_empty(value):
        return value is None or value == ""

    # -------------------------------
    # Heart Rate
    # -------------------------------
    if "heart_rate" in ecg and not _is_empty(ecg["heart_rate"]):
        try:
            hr = int(ecg["heart_rate"])
        except Exception:
            raise ValueError("ECG heart_rate must be a number")

        if not (30 <= hr <= 220):
            raise ValueError("ECG heart_rate out of valid range")

    # -------------------------------
    # PR Interval
    # -------------------------------
    if "pr_interval_ms" in ecg and not _is_empty(ecg["pr_interval_ms"]):
        try:
            pr = int(ecg["pr_interval_ms"])
        except Exception:
            raise ValueError("PR interval must be a number")

        if not (80 <= pr <= 300):
            raise ValueError("Invalid PR interval")

    # -------------------------------
    # QRS Duration
    # -------------------------------
    if "qrs_duration_ms" in ecg and not _is_empty(ecg["qrs_duration_ms"]):
        try:
            qrs = int(ecg["qrs_duration_ms"])
        except Exception:
            raise ValueError("QRS duration must be a number")

        if not (60 <= qrs <= 200):
            raise ValueError("Invalid QRS duration")

    # -------------------------------
    # QT Interval
    # -------------------------------
    if "qt_interval_ms" in ecg and not _is_empty(ecg["qt_interval_ms"]):
        try:
            qt = int(ecg["qt_interval_ms"])
        except Exception:
            raise ValueError("QT interval must be a number")

        if not (300 <= qt <= 550):
            raise ValueError("Invalid QT interval")

    # -------------------------------
    # ST Elevation (optional)
    # -------------------------------
    if "st_elevation" in ecg and not _is_empty(ecg["st_elevation"]):
        if not isinstance(ecg["st_elevation"], bool):
            raise ValueError("st_elevation must be boolean")

    # -------------------------------
    # Arrhythmia Detected
    # -------------------------------
    if "arrhythmia_detected" in ecg and not _is_empty(ecg["arrhythmia_detected"]):
        if not isinstance(ecg["arrhythmia_detected"], bool):
            raise ValueError("arrhythmia_detected must be boolean")

    return True