import httpx
from app.core.config import settings


class CalderaClient:
    """
    Thin wrapper around the MITRE Caldera REST API.
    Docs: https://caldera.readthedocs.io/en/latest/
    """

    def __init__(self):
        self.base = settings.CALDERA_URL
        self.headers = {
            "KEY": settings.CALDERA_API_KEY,
            "Content-Type": "application/json",
        }

    async def list_abilities(self) -> list:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{self.base}/api/v2/abilities", headers=self.headers)
            r.raise_for_status()
            return r.json()

    async def list_adversaries(self) -> list:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{self.base}/api/v2/adversaries", headers=self.headers)
            r.raise_for_status()
            return r.json()

    async def create_operation(self, adversary_id: str, group: str = "red") -> dict:
        payload = {
            "name": "PurpleOps Run",
            "adversary": {"adversary_id": adversary_id},
            "group": group,
            "planner": {"id": "aaa7c857-37a0-4c4a-85f7-4e9f7f30e31a"},
        }
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{self.base}/api/v2/operations", headers=self.headers, json=payload)
            r.raise_for_status()
            return r.json()

    async def get_operation_result(self, operation_id: str) -> dict:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{self.base}/api/v2/operations/{operation_id}", headers=self.headers)
            r.raise_for_status()
            return r.json()


caldera = CalderaClient()
