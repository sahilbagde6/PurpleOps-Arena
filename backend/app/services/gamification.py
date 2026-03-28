from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.incident import XPEvent

XP_TABLE = {
    "scenario_complete": 100,
    "detection_fired": 25,
    "rca_complete": 50,
    "rule_fixed": 75,
    "chat_question": 10,
}

LEVEL_THRESHOLDS = [0, 500, 1200, 2500, 4200, 6500, 9500, 13500, 18500, 25000]


def xp_to_level(xp: int) -> int:
    for lvl, threshold in enumerate(reversed(LEVEL_THRESHOLDS)):
        if xp >= threshold:
            return len(LEVEL_THRESHOLDS) - lvl
    return 1


async def award_xp(db: AsyncSession, user_id: str, reason: str) -> dict:
    delta = XP_TABLE.get(reason, 10)

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return {}

    user.xp_total += delta
    user.level = xp_to_level(user.xp_total)

    event = XPEvent(user_id=user_id, xp_delta=delta, reason=reason)
    db.add(event)
    await db.commit()

    return {
        "xp_awarded": delta,
        "xp_total": user.xp_total,
        "level": user.level,
        "reason": reason,
    }
