def calculate_health_score(risk_probability, trend=None):
    """
    risk_probability: float between 0 and 1
    trend: 'improving' | 'stable' | 'worsening'
    """

    if risk_probability is None:
        return None

    # Base score
    score = 100 - int(round(risk_probability * 100))

    # Trend adjustment
    if trend == "improving":
        score += 5
    elif trend == "worsening":
        score -= 5

    # Clamp 0–100
    score = max(0, min(100, score))

    return score