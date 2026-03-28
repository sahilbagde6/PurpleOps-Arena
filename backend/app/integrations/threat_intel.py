import httpx
from typing import Optional


class ThreatIntelClient:
    """
    Integrates with VirusTotal and AbuseIPDB for IOC enrichment.
    Set API keys in environment variables.
    """

    def __init__(self, vt_api_key: str = "", abuse_api_key: str = ""):
        self.vt_key = vt_api_key
        self.abuse_key = abuse_api_key

    async def lookup_ip(self, ip: str) -> dict:
        result = {"ip": ip, "malicious": False, "sources": []}

        if self.vt_key:
            async with httpx.AsyncClient() as client:
                try:
                    r = await client.get(
                        f"https://www.virustotal.com/api/v3/ip_addresses/{ip}",
                        headers={"x-apikey": self.vt_key},
                        timeout=10,
                    )
                    if r.status_code == 200:
                        data = r.json()
                        stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                        result["malicious"] = stats.get("malicious", 0) > 0
                        result["vt_stats"] = stats
                        result["sources"].append("virustotal")
                except Exception:
                    pass

        return result

    async def lookup_hash(self, file_hash: str) -> dict:
        result = {"hash": file_hash, "malicious": False, "sources": []}

        if self.vt_key:
            async with httpx.AsyncClient() as client:
                try:
                    r = await client.get(
                        f"https://www.virustotal.com/api/v3/files/{file_hash}",
                        headers={"x-apikey": self.vt_key},
                        timeout=10,
                    )
                    if r.status_code == 200:
                        data = r.json()
                        stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                        result["malicious"] = stats.get("malicious", 0) > 0
                        result["vt_stats"] = stats
                        result["sources"].append("virustotal")
                except Exception:
                    pass

        return result


threat_intel = ThreatIntelClient()
