from app.tasks.celery_app import celery_app


@celery_app.task(name="evaluate_rules")
def evaluate_rules_task(rule_id: str, log_sample: list):
    """
    Test a single Sigma rule against a provided log sample.
    Returns match results for the Rule Explorer test feature.
    """
    matches = []
    for log in log_sample:
        # Stub: real implementation uses sigma-cli to compile and match
        if log.get("EventID") in [10, 1, 3]:
            matches.append({"log_id": log.get("id"), "matched": True})

    return {
        "rule_id": rule_id,
        "matches": len(matches),
        "total": len(log_sample),
        "pass": len(matches) > 0,
    }
