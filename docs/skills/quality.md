# Quality Skill

Use this for testing, review evidence, and acceptance verification.

## Minimum expectations
- Test business behavior, not only rendering.
- Add negative authorization tests for private data/actions.
- Cover state transitions and race/idempotency behavior for money/access features.
- Keep fixtures synthetic and deterministic.
- Re-run relevant checks after rebasing/integrating current `main`.
- A passing harness check is necessary for repository coordination but does not replace application lint/type/test/build checks.

## PR evidence
State exact checks run, important scenarios covered, known gaps, and whether acceptance criteria are fully met.
