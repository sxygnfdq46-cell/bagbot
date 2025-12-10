# Post-merge verification for brain orchestrator runtime (PR #46 already merged)

Summary
- Runtime shim and orchestrator merged in PR #46.
- This note captures local quick checks and a staging verification ask for ops/QA.

Quick checks performed locally
- Import: PYTHONPATH="$PWD" BRAIN_FAKE_MODE=1 python -c "import backend.brain.orchestrator" -> PASS
- Import: PYTHONPATH="$PWD" BRAIN_FAKE_MODE=1 python -c "import backend.brain.adapter" -> PASS
- Adapter tests: pytest -q backend/brain/tests -k adapter -> PASS
- Runtime tests: pytest -q -k "brain and runtime" -> PASS
- Payments slice: pytest -q -k payments -> PASS

Staging verification ask (ops/QA)
1) Deploy the staging build for commit <insert commit sha here> (or current main).
2) Start a worker with BRAIN_FAKE_MODE=1.
3) Connect to /ws/brain and perform handshake + 3 decision requests.
4) Confirm metrics in staging (snapshot):
   - brain_orchestrator_requests_total{outcome="success"} increment
   - brain_orchestrator_decision_total{action=...} values
   - brain_decisions_total{action=...} from adapter
5) Reply in PR with a short snippet: timestamp + metric values or "STAGING OK".

Checklist
- [ ] CI import-checks (brain-import-check & brain-e2e) pass
- [ ] Ops/QA confirm staging canary OR we label needs-staging-verification
- [ ] Add one-liner to CHANGELOG after staging OK

Notes
- The original PR #46 remains merged; this follow-up is for verification and ops sign-off.
