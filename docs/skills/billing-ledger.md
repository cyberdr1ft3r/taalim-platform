# Billing & Ledger Skill

Use this for subscriptions, payment events, entitlements, refunds, reserves, commission, teacher payables, and reconciliation.

## Rules
- Provider transaction state, customer entitlement, platform revenue, provider settlement, reserves, and teacher payable are distinct concepts.
- Use integer minor units for MAD and documented rounding rules.
- Payment callbacks must be authenticated, durable, idempotent, and safe for duplicate/out-of-order delivery.
- Browser redirects are not payment confirmation.
- Actual refunds are ledger events; planning percentages are not automatic deductions.
- Paid access follows trusted payment/subscription state and explicit grace rules.
- Never invent proration, credits, reserve release, or payout policy not accepted in product decisions.

## Evidence
Test duplicate events, races, delayed events, cancellation/retry ordering, refund-after-payout, rounding, and reconciliation where relevant.
