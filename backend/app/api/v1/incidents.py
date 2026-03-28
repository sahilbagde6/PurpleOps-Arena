from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.incident import Incident, ResponseAction
from app.models.scenario import AttackEvent, ScenarioRun
from app.models.detection import Detection, SigmaRule

router = APIRouter()


@router.get("")
async def list_incidents(db: AsyncSession = Depends(get_db), recent_only: bool = True):
    """List incidents. Set recent_only=false to see all historical incidents."""
    query = select(Incident)
    
    if recent_only:
        # Only show incidents from last 24 hours
        cutoff = datetime.utcnow() - timedelta(hours=24)
        query = query.where(Incident.created_at >= cutoff)
    
    result = await db.execute(query.order_by(Incident.created_at.desc()))
    incidents = result.scalars().all()
    return [
        {
            "id": i.id, "run_id": i.run_id, "title": i.title,
            "severity": i.severity, "status": i.status, "created_at": i.created_at,
        }
        for i in incidents
    ]


@router.get("/{incident_id}")
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {
        "id": incident.id, "run_id": incident.run_id,
        "title": incident.title, "severity": incident.severity,
        "status": incident.status, "created_at": incident.created_at,
    }


@router.get("/{incident_id}/timeline")
async def get_timeline(incident_id: str, db: AsyncSession = Depends(get_db)):
    incident_res = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = incident_res.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    events_res = await db.execute(
        select(AttackEvent).where(AttackEvent.run_id == incident.run_id)
        .order_by(AttackEvent.occurred_at)
    )
    events = events_res.scalars().all()

    detections_res = await db.execute(
        select(Detection).where(Detection.run_id == incident.run_id)
    )
    detections = detections_res.scalars().all()

    # Build rule lookup
    rule_ids = [d.rule_id for d in detections]
    if rule_ids:
        rules_res = await db.execute(
            select(SigmaRule).where(SigmaRule.id.in_(rule_ids))
        )
        rules = {r.id: r for r in rules_res.scalars().all()}
    else:
        rules = {}

    # Build timeline with attack events and detections merged
    timeline_items = []
    
    for e in events:
        # Find detections for this event (match by time proximity within 120 seconds)
        matched_detections = [
            d for d in detections 
            if abs((d.detected_at - e.occurred_at).total_seconds()) < 120
        ]
        
        item = {
            "type": "attack_event",
            "id": e.id,
            "technique_id": e.technique_id,
            "host": e.host,
            "command": e.command,
            "occurred_at": str(e.occurred_at),
            "detected": len(matched_detections) > 0,
            "detections": [
                {
                    "id": d.id,
                    "rule_id": d.rule_id,
                    "rule_name": rules.get(d.rule_id).name if d.rule_id in rules else "Unknown Rule",
                    "rule_severity": rules.get(d.rule_id).severity if d.rule_id in rules else "unknown",
                    "fired": d.fired,
                    "confidence": d.confidence,
                    "detected_at": str(d.detected_at),
                }
                for d in matched_detections
            ]
        }
        timeline_items.append(item)

    return {
        "incident": {"id": incident.id, "title": incident.title, "severity": incident.severity},
        "timeline": sorted(timeline_items, key=lambda x: x["occurred_at"])
    }


@router.put("/{incident_id}/status")
async def update_status(
    incident_id: str,
    status: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    incident.status = status
    await db.commit()
    return {"id": incident.id, "status": incident.status}
