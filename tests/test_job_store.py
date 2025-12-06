from backend.workers.job_store import JobStore


def test_claim_and_state_transitions():
    store = JobStore()
    job_id = "j-1"

    assert store.claim(job_id) is True
    assert store.get_state(job_id) == "running"
    assert store.attempts(job_id) == 1

    assert store.claim(job_id) is False

    store.set_state(job_id, "done")
    assert store.claim(job_id) is False


def test_increment_attempts_and_reset():
    store = JobStore()
    job_id = "j-2"

    store.set_state(job_id, "enqueued")
    assert store.attempts(job_id) == 0

    store.increment_attempts(job_id)
    assert store.attempts(job_id) == 1

    store.reset(job_id)
    assert store.get_state(job_id) is None
