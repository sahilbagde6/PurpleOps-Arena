#!/usr/bin/env python3
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.scenario import ScenarioRun
from app.models.detection import Detection, SigmaRule
from datetime import datetime, timedelta

sync_url = settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql+psycopg2://')
try:
    engine = create_engine(sync_url)
except:
    sync_url = settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')
    engine = create_engine(sync_url)

with Session(engine) as db:
    runs = db.execute(select(ScenarioRun).limit(8)).scalars().all()
    rules = db.execute(select(SigmaRule).limit(4)).scalars().all()
    
    count = 0
    for run in runs:
        # Create 1-2 detections per run
        for i, rule in enumerate(rules[:2]):
            detection = Detection(
                run_id=run.id,
                rule_id=rule.id,
                fired=True,
                confidence=0.85 + (i * 0.1),
                evidence=f'Matched rule: {rule.name}',
                detected_at=run.started_at + timedelta(seconds=10+i*5),
            )
            db.add(detection)
            count += 1
    
    db.commit()
    print(f'✓ Created {count} detections')

engine.dispose()
