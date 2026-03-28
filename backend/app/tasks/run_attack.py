import time
from datetime import datetime
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, name="run_attack")
def execute_scenario_task(self, run_id: str, steps: list):
    """
    Execute each step of a scenario using synchronous SQLAlchemy.
    Celery workers run in a thread pool — asyncio.run() inside them
    can conflict with existing event loops. Use sync engine instead.
    """
    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import Session
    from app.core.config import settings
    from app.models.scenario import ScenarioRun, AttackEvent
    from app.models.incident import Incident
    import uuid

    # Use sync engine URL (replace asyncpg with psycopg2)
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://")

    try:
        engine = create_engine(sync_url)
    except Exception:
        # psycopg2 not installed — try plain postgresql
        sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        engine = create_engine(sync_url)

    self.update_state(state="STARTED", meta={"run_id": run_id, "step": 0})

    with Session(engine) as db:
        run = db.execute(select(ScenarioRun).where(ScenarioRun.id == run_id)).scalar_one_or_none()
        if not run:
            return {"error": "Run not found"}

        run.status = "running"
        db.commit()

        for i, step in enumerate(steps):
            self.update_state(
                state="PROGRESS",
                meta={"run_id": run_id, "step": i + 1, "total": len(steps)},
            )

            event = AttackEvent(
                run_id=run_id,
                technique_id=step.get("technique_id"),
                host=step.get("host", "WIN-TARGET-01"),
                command=step.get("command", ""),
                occurred_at=datetime.utcnow(),
            )
            db.add(event)
            db.commit()

            time.sleep(step.get("delay_seconds", 2))

        run.status = "complete"
        run.ended_at = datetime.utcnow()
        db.commit()

        # Get scenario to build incident title
        from app.models.scenario import Scenario
        scenario = db.execute(select(Scenario).where(Scenario.id == run.scenario_id)).scalar_one_or_none()
        
        # Create incident for this run
        incident = Incident(
            id=f"incident-{str(uuid.uuid4())[:8]}",
            run_id=run_id,
            title=f"Attack: {scenario.name if scenario else 'Unknown'}",
            severity="high",
            status="open",
            created_at=datetime.utcnow(),
        )
        db.add(incident)
        db.commit()

    engine.dispose()
    return {"run_id": run_id, "status": "complete", "incident_created": True}
