def generate_explanation(data: dict, bmi: float):
    reasons = []

    ap_hi = int(data.get("ap_hi", 0))
    ap_lo = int(data.get("ap_lo", 0))

    # Blood pressure
    if ap_hi >= 150 or ap_lo >= 95:
        reasons.append("very high blood pressure")

    # BMI
    if bmi >= 30:
        reasons.append("obesity")
    elif bmi >= 25:
        reasons.append("overweight")

    # Cholesterol
    if int(data.get("cholesterol", 1)) == 3:
        reasons.append("high cholesterol")

    # Glucose
    if int(data.get("gluc", 1)) == 3:
        reasons.append("high blood glucose")

    # Lifestyle
    if int(data.get("smoke", 0)) == 1:
        reasons.append("smoking habit")

    if int(data.get("alco", 0)) == 1:
        reasons.append("alcohol consumption")

    if int(data.get("active", 1)) == 0:
        reasons.append("low physical activity")

    if not reasons:
        return "Your inputs indicate generally healthy cardiovascular factors."

    return "Risk is mainly influenced by " + ", ".join(reasons) + "."