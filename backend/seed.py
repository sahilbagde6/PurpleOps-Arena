"""
Seed script — populates database with demo scenarios, rules, and sample users.
Run from the backend/ directory:  python seed.py
"""
import asyncio
import sys
import os

# Ensure backend/ is the CWD so relative paths work
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import AsyncSessionLocal, init_db
from app.models.user import User
from app.models.scenario import Scenario
from app.models.detection import SigmaRule
from app.core.security import hash_password


SCENARIOS = [
    {
        "name": "Credential access chain",
        "description": "Simulates LSASS dump via Mimikatz after token impersonation. Tests credential access detection rules.",
        "difficulty": "hard",
        "tactic": "TA0006",
        "steps": [
            {"technique_id": "T1566.001", "host": "WIN-TARGET-01", "command": "macro_execution.ps1", "delay_seconds": 2},
            {"technique_id": "T1134",     "host": "WIN-TARGET-01", "command": "PrintSpoofer.exe -i -c cmd", "delay_seconds": 3},
            {"technique_id": "T1003.001", "host": "WIN-TARGET-01", "command": "mimikatz sekurlsa::logonpasswords", "delay_seconds": 2},
        ],
    },
    {
        "name": "Lateral movement via PsExec",
        "description": "Uses PsExec to move laterally between Windows hosts, simulating a realistic post-exploitation phase.",
        "difficulty": "medium",
        "tactic": "TA0008",
        "steps": [
            {"technique_id": "T1021.002", "host": "WIN-TARGET-01", "command": "psexec \\\\10.0.0.20 cmd /c whoami", "delay_seconds": 3},
        ],
    },
    {
        "name": "PowerShell obfuscation",
        "description": "Executes encoded PowerShell payloads to test AMSI and Script Block Logging detection.",
        "difficulty": "easy",
        "tactic": "TA0002",
        "steps": [
            {"technique_id": "T1059.001", "host": "WIN-TARGET-01", "command": "powershell.exe -enc JABzAD0A...", "delay_seconds": 2},
        ],
    },
]


def read_rule(path):
    """Read sigma rule YAML — path is relative to backend/rules/"""
    full = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rules", path)
    if os.path.exists(full):
        return open(full).read()
    return f"# Rule file not found: {path}\ntitle: Placeholder\nstatus: experimental"


RULES = [
    {
        "name": "SIGMA-LSASS-001",
        "sigma_yaml": read_rule("credential_access/lsass_memory_access.yml"),
        "enabled": True,
        "severity": "critical",
        "technique_id": "T1003.001",
        "tactic": "Credential Access",
    },
    {
        "name": "SIGMA-PS-001",
        "sigma_yaml": read_rule("execution/powershell_encoded.yml"),
        "enabled": True,
        "severity": "high",
        "technique_id": "T1059.001",
        "tactic": "Execution",
    },
    {
        "name": "SIGMA-PSEXEC-001",
        "sigma_yaml": read_rule("lateral_movement/psexec_lateral.yml"),
        "enabled": True,
        "severity": "high",
        "technique_id": "T1021.002",
        "tactic": "Lateral Movement",
    },
    {
        "name": "SIGMA-TOKEN-001",
        "sigma_yaml": read_rule("credential_access/token_impersonation.yml"),
        "enabled": False,  # Disabled — demonstrates missing coverage gap
        "severity": "critical",
        "technique_id": "T1134",
        "tactic": "Privilege Escalation",
    },
]


async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Demo analyst user
        db.add(User(
            email="analyst@demo.com",
            display_name="Demo Analyst",
            hashed_password=hash_password("password123"),
            role="analyst",
            xp_total=2840,
            level=7,
        ))
        # Admin user
        db.add(User(
            email="admin@purpleops.io",
            display_name="PurpleOps Admin",
            hashed_password=hash_password("admin_changeme"),
            role="admin",
            xp_total=9500,
            level=10,
        ))

        for s in SCENARIOS:
            db.add(Scenario(**s))

        for r in RULES:
            db.add(SigmaRule(**r))

        await db.commit()

    print("✓ Database seeded successfully")
    print("  Demo login : analyst@demo.com  /  password123")
    print("  Admin login: admin@purpleops.io / admin_changeme")


if __name__ == "__main__":
    asyncio.run(seed())
