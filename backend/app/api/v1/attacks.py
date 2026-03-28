from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.scenario import AttackEvent, RawLog

router = APIRouter()


class LogIngest(BaseModel):
    source: str
    event_id: str | None = None
    payload: dict


@router.post("/telemetry/ingest")
async def ingest_telemetry(body: LogIngest, db: AsyncSession = Depends(get_db)):
    log = RawLog(source=body.source, event_id=body.event_id, payload=body.payload)
    db.add(log)
    await db.commit()
    return {"status": "ingested"}


@router.get("/events/{run_id}")
async def get_attack_events(run_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AttackEvent).where(AttackEvent.run_id == run_id))
    events = result.scalars().all()
    return [
        {
            "id": e.id, "technique_id": e.technique_id,
            "host": e.host, "command": e.command, "occurred_at": e.occurred_at,
        }
        for e in events
    ]
