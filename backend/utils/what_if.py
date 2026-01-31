import copy
from ml.preprocess import preprocess_input
from config import SCALER_PATH


def what_if_analysis(model, input_data: dict):
    scenarios = []

    # 🔹 Base probability (IMPORTANT)
    X_base, _ = preprocess_input(input_data, SCALER_PATH)
    base_prob = model.predict_proba(X_base)[0][1]

    def safe_prob(modified_input):
        X, _ = preprocess_input(modified_input, SCALER_PATH)
        prob = model.predict_proba(X)[0][1]

        # 🛡️ CLINICAL SAFETY CLAMP
        if prob > base_prob:
            prob = base_prob

        return round(float(prob), 3)

    # 1️⃣ Stop smoking
    if int(input_data.get("smoke", 0)) == 1:
        modified = copy.deepcopy(input_data)
        modified["smoke"] = 0

        scenarios.append({
            "change": "If smoking is stopped",
            "new_probability": safe_prob(modified)
        })

    # 2️⃣ Control blood pressure
    if int(input_data.get("ap_hi", 0)) > 130:
        modified = copy.deepcopy(input_data)
        modified["ap_hi"] = 130
        modified["ap_lo"] = 85

        scenarios.append({
            "change": "If blood pressure is controlled",
            "new_probability": safe_prob(modified)
        })

    # 3️⃣ Chest pain resolved
    if input_data.get("chest_pain") in ("moderate", "severe"):
        modified = copy.deepcopy(input_data)
        modified["chest_pain"] = "none"

        scenarios.append({
            "change": "If chest pain symptoms reduce",
            "new_probability": safe_prob(modified)
        })

    return scenarios