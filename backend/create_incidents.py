#!/usr/bin/env python3
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.scenario import ScenarioRun, Scenario
from app.models.incident import Incident
import uuid
from datetime import datetime

sync_url = settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql+psycopg2://')
try:
    engine = create_engine(sync_url)
except:
    sync_url = settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')
    engine = create_engine(sync_url)

with Session(engine) as db:
    runs = db.execute(select(ScenarioRun)).scalars().all()
    
    for run in runs:
        existing = db.execute(select(Incident).where(Incident.run_id == run.id)).scalar_one_or_none()
        if existing:
            continue
        
        scenario = db.execute(select(Scenario).where(Scenario.id == run.scenario_id)).scalar_one_or_none()
        
        incident = Incident(
            id='incident-' + str(uuid.uuid4())[:8],
            run_id=run.id,
            title='Attack: ' + (scenario.name if scenario else 'Run'),
            severity='high',
            status='open',
            created_at=run.started_at,
        )
        db.add(incident)
        print('Created incident for run ' + run.id)
    
    db.commit()
    print('✓ All incidents created')

engine.dispose()
