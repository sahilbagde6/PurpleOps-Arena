from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import anthropic
import json

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.incident import Incident, AIAnalysis

router = APIRouter()

_client = None

def get_client():
    global _client
    if _client is None:
        if not settings.ANTHROPIC_API_KEY:
            return None
        _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client

SYSTEM_BEGINNER = """You are PurpleOps Copilot, an AI security assistant for a cyber range platform.
Explain concepts in simple, friendly language for beginners. Avoid jargon.
Use analogies. Keep explanations concise and actionable. Use markdown for formatting."""

SYSTEM_ANALYST = """You are PurpleOps Copilot, an AI security analyst assistant.
Provide technical, detailed analysis. Reference MITRE ATT&CK techniques by ID.
Include IOCs, detection logic, log sources, and remediation steps. Use markdown."""

SYSTEM_RCA = """You are PurpleOps Copilot performing root cause analysis.
Identify WHY a detection succeeded or failed. Pinpoint missing telemetry,
misconfigured rules, or coverage gaps. Be precise and actionable."""


class AnalyzeRequest(BaseModel):
    incident_id: str
    mode: str = "beginner"


class ChatRequest(BaseModel):
    message: str
    mode: str = "beginner"
    context_run_id: Optional[str] = None


class RCARequest(BaseModel):
    incident_id: str
    missed_technique: Optional[str] = None


@router.post("/analyze")
async def analyze_incident(
    body: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Incident).where(Incident.id == body.incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    client = get_client()
    if not client:
        return {
            "analysis_id": "mock-id",
            "summary": "**AI Analysis Unavailable**\n\nTo enable AI Analyst features, configure your ANTHROPIC_API_KEY:\n\n1. Get an API key from [Claude.ai](https://console.anthropic.com)\n2. Add to `backend/.env`: `ANTHROPIC_API_KEY=sk-...`\n3. Restart the backend container\n\nOnce configured, AI will provide detailed incident analysis.",
            "mode": body.mode,
        }

    system = SYSTEM_BEGINNER if body.mode == "beginner" else SYSTEM_ANALYST
    prompt = (
        f"Analyze this security incident:\n"
        f"Title: {incident.title}\n"
        f"Severity: {incident.severity}\n"
        f"Status: {incident.status}\n\n"
        f"Provide: incident summary, ATT&CK technique mapping, severity classification, "
        f"and top 3 response recommendations."
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    summary = response.content[0].text

    analysis = AIAnalysis(
        incident_id=body.incident_id,
        mode=body.mode,
        summary=summary,
        technique_map={},
        recommendations=[],
    )
    db.add(analysis)
    await db.commit()

    return {"analysis_id": analysis.id, "summary": summary, "mode": body.mode}


@router.post("/chat")
async def chat(body: ChatRequest, current_user=Depends(get_current_user)):
    client = get_client()
    if not client:
        return StreamingResponse(
            iter([b"data: {\"text\": \"AI Chat is disabled. Configure ANTHROPIC_API_KEY to enable.\"}\n\ndata: [DONE]\n\n"]),
            media_type="text/event-stream"
        )

    system = {
        "beginner": SYSTEM_BEGINNER,
        "analyst": SYSTEM_ANALYST,
        "rca": SYSTEM_RCA,
    }.get(body.mode, SYSTEM_BEGINNER)

    def stream_response():
        try:
            with client.messages.stream(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                system=system,
                messages=[{"role": "user", "content": body.message}],
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")


@router.post("/rca")
async def root_cause_analysis(
    body: RCARequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Incident).where(Incident.id == body.incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    client = get_client()
    if not client:
        return {
            "rca": "**RCA Analysis Unavailable**\n\nConfigure ANTHROPIC_API_KEY to enable root cause analysis.",
            "incident_id": body.incident_id,
        }

    prompt = (
        f"Perform root cause analysis for incident: {incident.title}\n"
        f"Missed technique: {body.missed_technique or 'unknown'}\n\n"
        f"Identify: 1) Why the detection failed, 2) What telemetry is missing, "
        f"3) What rule changes are needed, 4) How to fix the coverage gap."
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=SYSTEM_RCA,
        messages=[{"role": "user", "content": prompt}],
    )

    return {"rca": response.content[0].text, "incident_id": body.incident_id}
