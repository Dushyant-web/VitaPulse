def prediction_confidence(probability: float):
    if probability < 0.2 or probability > 0.8:
        return "High confidence"
    elif probability < 0.4 or probability > 0.6:
        return "Medium confidence"
    else:
        return "Low confidence"