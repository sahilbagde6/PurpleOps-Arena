from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.detection import SigmaRule, Detection

router = APIRouter()


class RuleCreate(BaseModel):
    name: str
    sigma_yaml: str
    enabled: bool = True
    severity: str
    technique_id: str
    tactic: str


class RuleUpdate(BaseModel):
    enabled: Optional[bool] = None
    sigma_yaml: Optional[str] = None
    severity: Optional[str] = None


@router.get("")
async def list_detections(run_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(Detection)
    if run_id:
        query = query.where(Detection.run_id == run_id)
    result = await db.execute(query)
    detections = result.scalars().all()
    return [
        {
            "id": d.id, "run_id": d.run_id, "rule_id": d.rule_id,
            "fired": d.fired, "confidence": d.confidence,
            "evidence": d.evidence, "detected_at": d.detected_at,
        }
        for d in detections
    ]


@router.get("/rules")
async def list_rules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SigmaRule))
    rules = result.scalars().all()
    return [
        {
            "id": r.id, "name": r.name, "enabled": r.enabled,
            "severity": r.severity, "technique_id": r.technique_id,
            "tactic": r.tactic, "false_positives": r.false_positives,
        }
        for r in rules
    ]


@router.put("/rules/{rule_id}")
async def update_rule(
    rule_id: str,
    body: RuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(SigmaRule).where(SigmaRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    if body.enabled is not None:
        rule.enabled = body.enabled
    if body.sigma_yaml is not None:
        rule.sigma_yaml = body.sigma_yaml
    if body.severity is not None:
        rule.severity = body.severity
    await db.commit()
    return {"id": rule.id, "enabled": rule.enabled}


@router.post("/rules")
async def create_rule(
    body: RuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    rule = SigmaRule(
        name=body.name,
        sigma_yaml=body.sigma_yaml,
        enabled=body.enabled,
        severity=body.severity,
        technique_id=body.technique_id,
        tactic=body.tactic,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return {
        "id": rule.id,
        "name": rule.name,
        "enabled": rule.enabled,
        "severity": rule.severity,
        "technique_id": rule.technique_id,
        "tactic": rule.tactic,
    }


@router.post("/rules/{rule_id}/test")
async def test_rule(rule_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SigmaRule).where(SigmaRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    # Stub: run against recent logs
    return {"rule_id": rule_id, "result": "pass", "matches": 3, "false_positives": 0}
