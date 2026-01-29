def map_risk(probability: float):
    """
    Convert probability to human-readable risk level.
    """

    if probability < 0.30:
        return "Low"
    elif probability < 0.60:
        return "Medium"
    else:
        return "High"