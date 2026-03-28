import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, JSON, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id: Mapped[str] = mapped_column(String, ForeignKey("scenario_runs.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    severity: Mapped[str] = mapped_column(String, default="medium")
    status: Mapped[str] = mapped_column(String, default="open")  # open|investigating|resolved
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ai_analyses: Mapped[list["AIAnalysis"]] = relationship(back_populates="incident")
    response_actions: Mapped[list["ResponseAction"]] = relationship(back_populates="incident")


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id: Mapped[str] = mapped_column(String, ForeignKey("incidents.id"), nullable=False)
    mode: Mapped[str] = mapped_column(String, default="beginner")  # beginner|analyst|rca
    summary: Mapped[str] = mapped_column(Text, nullable=True)
    technique_map: Mapped[dict] = mapped_column(JSON, default=dict)
    recommendations: Mapped[dict] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    incident: Mapped["Incident"] = relationship(back_populates="ai_analyses")


class ResponseAction(Base):
    __tablename__ = "response_actions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id: Mapped[str] = mapped_column(String, ForeignKey("incidents.id"), nullable=False)
    action_type: Mapped[str] = mapped_column(String, nullable=False)  # isolate|kill_process|block_ip
    target: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending")
    executed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    incident: Mapped["Incident"] = relationship(back_populates="response_actions")


class XPEvent(Base):
    __tablename__ = "xp_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    xp_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String, nullable=True)
    earned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
