# backend/utils/validators.py

def validate_input(data: dict):
    """
    Validate incoming user input.
    Raises ValueError if invalid.
    """

    # REQUIRED INPUT FIELDS
    required_fields = [
        "age", "gender",
        "height", "weight",
        "ap_hi", "ap_lo",
        "cholesterol", "gluc",
        "smoke", "alco", "active"
    ]

    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing field: {field}")

    # -----------------------------
    # CORE VALIDATION
    # -----------------------------

    # Age
    if not (1 <= int(data["age"]) <= 120):
        raise ValueError("Age must be between 1 and 120")

    # Gender (1 = male, 2 = female)
    if int(data["gender"]) not in (1, 2):
        raise ValueError("Invalid gender value")

    # Height (cm)
    if not (100 <= float(data["height"]) <= 250):
        raise ValueError("Height must be between 100 and 250 cm")

    # Weight (kg)
    if not (20 <= float(data["weight"]) <= 300):
        raise ValueError("Weight must be between 20 and 300 kg")

    # Blood pressure
    if not (50 <= int(data["ap_hi"]) <= 250):
        raise ValueError("Invalid systolic blood pressure")

    if not (30 <= int(data["ap_lo"]) <= 150):
        raise ValueError("Invalid diastolic blood pressure")

    if int(data["ap_lo"]) >= int(data["ap_hi"]):
        raise ValueError("Diastolic BP must be less than systolic BP")

    # Lifestyle (binary)
    for field in ["smoke", "alco", "active"]:
        if int(data[field]) not in (0, 1):
            raise ValueError(f"{field} must be 0 or 1")

    # Encoded medical values
    if int(data["cholesterol"]) not in (1, 2, 3):
        raise ValueError("Cholesterol must be 1, 2, or 3")

    if int(data["gluc"]) not in (1, 2, 3):
        raise ValueError("Glucose must be 1, 2, or 3")

    # -----------------------------
    # SYMPTOMS (OPTIONAL)
    # -----------------------------
    chest_pain_allowed = {"none", "mild", "moderate", "severe"}
    dizziness_allowed = {"no", "mild", "severe"}

    if "chest_pain" in data and data["chest_pain"] not in chest_pain_allowed:
        raise ValueError("Invalid chest pain value")

    if "dizziness" in data and data["dizziness"] not in dizziness_allowed:
        raise ValueError("Invalid dizziness value")

    if "nausea" in data and data["nausea"] not in ("yes", "no", 0, 1):
        raise ValueError("Invalid nausea value")

    if "palpitations" in data and data["palpitations"] not in ("yes", "no", 0, 1):
        raise ValueError("Invalid palpitations value")

    return True