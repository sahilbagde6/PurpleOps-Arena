import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, Float, Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class SigmaRule(Base):
    __tablename__ = "sigma_rules"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    sigma_yaml: Mapped[str] = mapped_column(Text, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    severity: Mapped[str] = mapped_column(String, default="medium")
    technique_id: Mapped[str] = mapped_column(String, nullable=True)  # MITRE ATT&CK ID
    tactic: Mapped[str] = mapped_column(String, nullable=True)
    false_positives: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    detections: Mapped[list["Detection"]] = relationship(back_populates="rule")


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id: Mapped[str] = mapped_column(String, ForeignKey("scenario_runs.id"), nullable=False)
    rule_id: Mapped[str] = mapped_column(String, ForeignKey("sigma_rules.id"), nullable=False)
    fired: Mapped[bool] = mapped_column(Boolean, default=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    evidence: Mapped[str] = mapped_column(Text, nullable=True)
    detected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    rule: Mapped["SigmaRule"] = relationship(back_populates="detections")
