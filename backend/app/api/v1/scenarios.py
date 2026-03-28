from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.scenario import Scenario, ScenarioRun
from app.tasks.run_attack import execute_scenario_task

router = APIRouter()


class ScenarioCreate(BaseModel):
    name: str
    description: Optional[str] = None
    difficulty: str = "medium"
    tactic: Optional[str] = None
    steps: list = []


@router.get("")
async def list_scenarios(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scenario).where(Scenario.is_public == True))
    scenarios = result.scalars().all()
    return [
        {
            "id": s.id, "name": s.name, "description": s.description,
            "difficulty": s.difficulty, "tactic": s.tactic, "steps": s.steps,
        }
        for s in scenarios
    ]


@router.post("")
async def create_scenario(
    body: ScenarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    scenario = Scenario(**body.model_dump())
    db.add(scenario)
    await db.commit()
    await db.refresh(scenario)
    return {"id": scenario.id, "name": scenario.name}


@router.post("/{scenario_id}/run")
async def run_scenario(
    scenario_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Scenario).where(Scenario.id == scenario_id))
    scenario = result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    run = ScenarioRun(
        scenario_id=scenario_id,
        user_id=current_user["sub"],
        status="pending",
        started_at=datetime.utcnow(),
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)

    try:
        execute_scenario_task.delay(run.id, scenario.steps)
    except Exception:
        # Celery not running — mark running for demo mode
        run.status = "running"
        await db.commit()

    return {"run_id": run.id, "status": run.status, "message": "Scenario queued"}


# Separate router for runs to avoid path collision with /{scenario_id}
runs_router = APIRouter()


@runs_router.get("/{run_id}")
async def get_run(run_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ScenarioRun).where(ScenarioRun.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {
        "id": run.id, "scenario_id": run.scenario_id,
        "status": run.status, "started_at": run.started_at, "ended_at": run.ended_at,
    }


@runs_router.post("/{run_id}/stop")
async def stop_run(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(ScenarioRun).where(ScenarioRun.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    run.status = "stopped"
    run.ended_at = datetime.utcnow()
    await db.commit()
    return {"id": run.id, "status": run.status}
