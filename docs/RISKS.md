# Risk Index

| Risk | Why it matters | Current control/owner |
| --- | --- | --- |
| Conflicting product rules | Can corrupt billing/access behavior | Agreed rules are in [accepted ADRs](adr/README.md) and the [MVP scope](product/mvp-scope.md). Open items stay in the [founder decision log](product/founder-decision-log.md) until the founder accepts them. |
| Agent overlap | Parallel agents can overwrite shared contracts/config | #17 ownership/worktree/shared-surface rules |
| Storage lock-in or public-file exposure | Private learning/verification data could leak or become hard to migrate | #2 provider-neutral storage boundary; #5 authorization |
| Payment-provider mismatch | Recurring marketplace funds flow may not be approved/supported | #4 provider/legal validation; fake provider first |
| Duplicate/out-of-order payment events | Can double-grant access or corrupt balances | #9 idempotent processing/reconciliation |
| Overselling final class seat | Concurrent checkout can exceed capacity | #10 transactional reservation |
| Incorrect renewals/grace | Can charge or grant access incorrectly | #11 state/race testing |
| Refund/payout accounting errors | Can pay teachers unearned funds or misstate platform revenue | #13 ledger/settlement rules |
| Sensitive teacher/learner data exposure | High trust/privacy impact | #5/#6 authorization, private storage, safe logs, synthetic test data |
| Backup exists but restore fails | Paid service cannot recover safely | #16 isolated restore rehearsal |
| Framework/provider churn | Agents may introduce inconsistent stack decisions | #2 architecture baseline + AGENTS.md guardrails |

Keep this index focused on cross-cutting risks. Issue-specific details belong in the relevant issue/ADR.
