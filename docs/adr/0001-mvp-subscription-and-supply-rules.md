# 0001. MVP subscription and supply rules

- Status: Accepted
- Date: 2026-10-06
- Related issues: #1, #7, #8, #10, #11, #13

## Context

Issue #1 requires one implementation baseline for the Morocco marketplace. The GitHub backlog already states a set of commercial rules to preserve. Those rules are accepted here so later issues do not reinterpret them.

This record does not approve a payment provider, a legal funds-flow model, a commission percentage, proration, or class-switching credits. Those remain in [the founder decision log](../product/founder-decision-log.md).

The named product-source documents were not present in the repository at base commit `7e5e124`. The accepted rules below are the rules Issue #1 and the related backlog issues already state. If those source documents are added later and disagree with this record, stop and surface the conflict.

## Decision

1. Taalim's launch product is a Morocco-focused paid education marketplace. Student prices are in MAD. Persisted money amounts use integer minor units (100 minor units = 1 MAD).
2. The teacher sets the monthly student price. The platform does not impose a price floor or a guaranteed teacher income.
3. A class may be listed and delivered with zero enrolled students or with one student. Capacity is a maximum. The platform does not require a minimum enrolment.
4. A teacher may sell a class only after founder approval for the relevant subject and level. A generic verified badge is not a substitute for that scope.
5. Billing is a rolling monthly subscription with a per-subscription anchor date. The customer may cancel, and that cancellation takes effect at the end of the period already paid. Access for that paid period continues until the period ends.
6. When a teacher changes the listed price, subscriptions that are already in force keep the price those subscribers agreed. New subscribers are offered the new listed price. In force means the subscription is active, or it is inside a paid period whose cancellation has been scheduled.
7. Whether a later, separate subscription keeps an earlier price is not decided here. Failed-payment recovery and class reactivation are [FD-09 and FD-05](../product/founder-decision-log.md).
8. Figures that exist only as business-plan projections, including forecast revenue, a planning refund percentage, and infrastructure or acquisition cost assumptions, are not product rules and are not automatic ledger entries.

## Consequences

- Checkout, class publishing, and settlement copy can state teacher-set MAD prices, no minimum class size, cancellation at the end of the paid period, and price protection for in-force subscribers.
- Issue #3 can store MAD in integer minor units and can store a versioned price on each subscription.
- Issue #7 can reject a publish attempt by a teacher who is not approved for that subject and level.
- Issue #11 can implement end-of-period cancellation without a new founder decision.
- Commission rate, refund entitlement beyond the paid period, grace length, switching credits, and the legal seller model still need the decision log before the issues that implement them treat those topics as decided.
- This record does not select a payment provider and does not authorize live charges.

## Alternatives considered

- Platform price bands or a minimum class size. Rejected because Issue #1 and Issue #7 say to preserve teacher-selected prices and no minimum enrolment.
- Immediate cancellation with an automatic partial refund. Rejected because Issue #1 and Issue #11 require ordinary cancellation at the end of the paid period, and no proration rule is accepted.
- Treating a business-plan commission or refund percentage as the live product rule. Rejected because the backlog states that financial projections are planning assumptions, not product rules.
