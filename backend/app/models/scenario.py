import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, JSON, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(String, default="medium")  # easy|medium|hard
    tactic: Mapped[str] = mapped_column(String, nullable=True)
    steps: Mapped[dict] = mapped_column(JSON, default=list)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    runs: Mapped[list["ScenarioRun"]] = relationship(back_populates="scenario")


class ScenarioRun(Base):
    __tablename__ = "scenario_runs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_id: Mapped[str] = mapped_column(String, ForeignKey("scenarios.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending")  # pending|running|complete|failed
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    ended_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    scenario: Mapped["Scenario"] = relationship(back_populates="runs")
    attack_events: Mapped[list["AttackEvent"]] = relationship(back_populates="run")


class AttackEvent(Base):
    __tablename__ = "attack_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id: Mapped[str] = mapped_column(String, ForeignKey("scenario_runs.id"), nullable=False)
    technique_id: Mapped[str] = mapped_column(String, nullable=True)
    host: Mapped[str] = mapped_column(String, nullable=True)
    command: Mapped[str] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    run: Mapped["ScenarioRun"] = relationship(back_populates="attack_events")
    raw_logs: Mapped[list["RawLog"]] = relationship(back_populates="event")


class RawLog(Base):
    __tablename__ = "raw_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id: Mapped[str] = mapped_column(String, ForeignKey("attack_events.id"), nullable=True)
    source: Mapped[str] = mapped_column(String, nullable=False)  # sysmon|wazuh|zeek|suricata
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    ingested_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    event: Mapped["AttackEvent"] = relationship(back_populates="raw_logs")
