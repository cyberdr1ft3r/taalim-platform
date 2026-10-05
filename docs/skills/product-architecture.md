# Product Architecture Skill

Use this for changes touching application structure, shared contracts, storage, payments, background work, or provider integrations.

## Canonical rules
- Issue #2 owns the architecture baseline.
- Prefer modular-monolith boundaries over premature services.
- Authentication establishes identity; application logic authorizes.
- Feature code uses canonical storage and payment abstractions.
- Production storage/payment providers remain replaceable behind adapters.
- Coordinate schema, migrations, shared contracts, root config, and dependency changes before editing.

## Before implementation
1. Read #2 and any accepted architecture ADRs.
2. Identify shared surfaces and dependent issues.
3. If changing an accepted boundary, propose the architecture change explicitly rather than embedding it in feature work.
