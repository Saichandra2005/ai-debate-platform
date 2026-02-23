# backend/intelligence/drift_policy.py

def interpret_drift_score(score):
    """
    Interprets semantic drift score with BALANCED enforcement.
    Lower scores = more off-topic
    """

    if score >= 0.65:
        return {
            "status": "ON_TOPIC",
            "severity": "NONE"
        }

    elif score >= 0.5:
        return {
            "status": "PARTIAL_DRIFT",
            "severity": "LOW"
        }

    elif score >= 0.3:
        return {
            "status": "DRIFTING",
            "severity": "MEDIUM"
        }

    else:
        return {
            "status": "OFF_TOPIC",
            "severity": "HIGH"
        }