from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "purpleops",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.run_attack", "app.tasks.process_logs", "app.tasks.evaluate_rules"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)
