import time
from app.tasks.celery_app import celery_app


@celery_app.task(name="process_logs")
def process_logs_task(run_id: str):
    """Evaluate sigma rules against attack events from a run (sync version for Celery)."""
    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import Session
    from app.core.config import settings
    from app.models.detection import SigmaRule, Detection
    from app.models.scenario import AttackEvent

    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    try:
        engine = create_engine(sync_url)
    except Exception:
        sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        engine = create_engine(sync_url)

    with Session(engine) as db:
        rules = db.execute(select(SigmaRule).where(SigmaRule.enabled == True)).scalars().all()
        events = db.execute(select(AttackEvent).where(AttackEvent.run_id == run_id)).scalars().all()

        for rule in rules:
            for event in events:
                fired = rule.technique_id == event.technique_id
                detection = Detection(
                    run_id=run_id,
                    rule_id=rule.id,
                    fired=fired,
                    confidence=0.95 if fired else 0.0,
                    evidence=f"Matched technique {event.technique_id}" if fired else None,
                )
                db.add(detection)

        db.commit()

    engine.dispose()
    return {"run_id": run_id, "status": "evaluated"}
