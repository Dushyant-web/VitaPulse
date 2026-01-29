import numpy as np

# Human-readable symptom labels
SYMPTOM_LABELS = {
    "chest_pain": "Chest pain severity",
    "nausea": "Nausea",
    "palpitations": "Palpitations",
    "dizziness": "Dizziness"
}


def get_top_features(model, feature_names, top_n=5):
    """
    Return top contributing features based on feature importance.
    """
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1][:top_n]

    results = []
    for idx in indices:
        results.append({
            "feature": feature_names[idx],
            "importance": round(float(importances[idx]), 3)
        })

    return results


def explain_symptoms(data: dict):
    """
    Rule-based clinical explanations for symptoms.
    Independent of ML feature importance.
    """

    insights = []

    chest_pain = data.get("chest_pain", "none")
    dizziness = data.get("dizziness", "no")
    nausea = int(data.get("nausea", 0))
    palpitations = int(data.get("palpitations", 0))

    if chest_pain in ("moderate", "severe"):
        insights.append(
            "Chest pain is a significant cardiac warning sign and requires clinical attention"
        )

    if palpitations == 1:
        insights.append(
            "Palpitations may indicate irregular heart rhythm or cardiac stress"
        )

    if nausea == 1:
        insights.append(
            "Nausea can be associated with cardiac events, especially when combined with chest discomfort"
        )

    if dizziness in ("mild", "severe"):
        insights.append(
            "Dizziness may suggest reduced blood flow or blood pressure instability"
        )

    if not insights:
        insights.append(
            "No major cardiac-related symptoms reported at this checkup"
        )

    return insights