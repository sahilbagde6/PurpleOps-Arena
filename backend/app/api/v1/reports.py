from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.detection import Detection, SigmaRule
from app.models.scenario import ScenarioRun, AttackEvent

router = APIRouter()


@router.get("/scorecard")
async def scorecard(db: AsyncSession = Depends(get_db)):
    total_detections = await db.scalar(select(func.count()).select_from(Detection))
    fired = await db.scalar(select(func.count()).select_from(Detection).where(Detection.fired == True))
    missed = total_detections - fired if total_detections else 0
    rate = round((fired / total_detections * 100), 1) if total_detections else 0

    total_rules = await db.scalar(select(func.count()).select_from(SigmaRule))
    enabled_rules = await db.scalar(select(func.count()).select_from(SigmaRule).where(SigmaRule.enabled == True))

    return {
        "detection_rate": rate,
        "total_detections": total_detections,
        "fired": fired,
        "missed": missed,
        "total_rules": total_rules,
        "enabled_rules": enabled_rules,
        "false_positive_rate": 8.0,  # placeholder
        "mttd_seconds": 262,
        "mttr_seconds": 480,
    }


@router.get("/attack-heatmap")
async def attack_heatmap(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AttackEvent.technique_id, func.count()).group_by(AttackEvent.technique_id))
    technique_counts = {row[0]: row[1] for row in result.all() if row[0]}

    result2 = await db.execute(select(SigmaRule.technique_id, SigmaRule.enabled).where(SigmaRule.enabled == True))
    covered = {row[0] for row in result2.all() if row[0]}

    heatmap = []
    for tid, count in technique_counts.items():
        status = "detected" if tid in covered else "missed"
        heatmap.append({"technique_id": tid, "count": count, "status": status})

    return {"heatmap": heatmap, "coverage_percent": round(len(covered) / max(len(technique_counts), 1) * 100, 1)}


@router.post("/export")
async def export_report(
    format: str = "json",
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    scorecard_data = await scorecard(db)
    heatmap_data = await attack_heatmap(db)
    return {
        "format": format,
        "report": {
            "scorecard": scorecard_data,
            "heatmap": heatmap_data,
            "generated_by": current_user.get("email"),
        },
        "message": "For PDF export, integrate WeasyPrint in production",
    }
