from fastapi.testclient import TestClient

from backend.main import app
from backend.api import health


ALLOWED_STATUSES = {"healthy", "degraded", "down"}


def test_health_contract_fields(monkeypatch, tmp_path):
    prom_dir = tmp_path / "prom"
    monkeypatch.setenv("PROMETHEUS_MULTIPROC_DIR", str(prom_dir))
    monkeypatch.delenv("APP_VERSION", raising=False)

    # Reset caches for isolation
    health._VERSION_CACHE = None
    health._PROCESS_START = None

    with TestClient(app) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    data = response.json()

    assert set(["status", "version", "uptime_s"]) <= set(data.keys())
    assert data["status"] in ALLOWED_STATUSES

    version = data["version"]
    assert version is None or isinstance(version, str)

    uptime = data["uptime_s"]
    assert uptime is None or isinstance(uptime, (int, float))

    # Metrics directory is idempotently ensured when env is set
    assert prom_dir.exists()
