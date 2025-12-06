from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_metrics_endpoint_returns_prometheus_payload():
    r = client.get("/api/metrics")
    assert r.status_code == 200
    text = r.text
    # Check for at least one expected metric name produced by this PR
    assert (
        "bagbot_job_enqueue_total" in text
        or "bagbot_job_run_total" in text
    )
