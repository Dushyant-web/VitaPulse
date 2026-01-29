import copy
from ml.preprocess import preprocess_input
from config import SCALER_PATH


def what_if_analysis(model, input_data: dict):
    scenarios = []

    # 1. Stop smoking
    if int(input_data.get("smoke", 0)) == 1:
        modified = copy.deepcopy(input_data)
        modified["smoke"] = 0

        X, _ = preprocess_input(modified, SCALER_PATH)
        prob = model.predict_proba(X)[0][1]

        scenarios.append({
            "change": "If smoking is stopped",
            "new_probability": round(float(prob), 3)
        })

    # 2. Control blood pressure
    if int(input_data.get("ap_hi", 0)) > 130:
        modified = copy.deepcopy(input_data)
        modified["ap_hi"] = 130
        modified["ap_lo"] = 85

        X, _ = preprocess_input(modified, SCALER_PATH)
        prob = model.predict_proba(X)[0][1]

        scenarios.append({
            "change": "If blood pressure is controlled",
            "new_probability": round(float(prob), 3)
        })

    # 3. Symptoms resolved (optional)
    if input_data.get("chest_pain") in ("moderate", "severe"):
        modified = copy.deepcopy(input_data)
        modified["chest_pain"] = "none"

        X, _ = preprocess_input(modified, SCALER_PATH)
        prob = model.predict_proba(X)[0][1]

        scenarios.append({
            "change": "If chest pain symptoms reduce",
            "new_probability": round(float(prob), 3)
        })

    return scenarios