# Security & Privacy Skill

Use this for authentication, authorization, private files, admin actions, teacher verification, learner data, sessions, logs, and recovery.

## Non-negotiables
- Server-side authorization on every private action.
- Synthetic test data only; never place real identity/payment data in code or agent context.
- No public shortcuts for private storage.
- No secrets, tokens, signed URLs, raw card data, or verification documents in logs.
- Privileged provider credentials stay server-side.
- Negative tests must cover cross-account, cross-class, role-escalation, ID/key tampering, and suspended-account paths where relevant.

## Review questions
- Who is authenticated?
- What business relationship grants access?
- Can changing an ID/key bypass that check?
- What sensitive data is stored, logged, cached, exported, or backed up?
- How is access revoked and recovery audited?
