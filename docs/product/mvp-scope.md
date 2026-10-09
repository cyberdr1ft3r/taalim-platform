# MVP scope

Issue #1. This is the product baseline for later engineering issues. It is documentation only. It does not choose a storage vendor, a payment provider, or a legal funds-flow model.

[ADR 0001](../adr/0001-mvp-subscription-and-supply-rules.md) and [ADR 0002](../adr/0002-paid-access-and-private-content.md) are Proposed. They are not Accepted. Founder approval of those records has not been recorded. [FD-01](founder-decision-log.md) is the accepted exception: Arabic and French launch copy, with English architecture-ready and deferred. Do not treat any other rule below as accepted product truth.

## How to read this document

| Status | Meaning |
| --- | --- |
| Accepted | The founder has approved this item. FD-01 is the only Accepted decision. |
| Source-backed rule | Stated by the backlog or by the externally reviewed sources. Not an open design choice. Not Accepted until the founder accepts that rule. |
| Source-backed recommendation | A source proposes it. Founder approval is still required. |
| Source conflict | The sources disagree. The founder must choose. |
| Product gap | No source answer. Do not invent a number, age, rate, cap, formula, or timing rule. |
| Planning assumption | A forecast or commercial test figure. Not a product rule and not a ledger entry. |
| Deferred | Left out of the initial behavior the sources describe. |

The product source documents are not repository files. This baseline has been reconciled against externally reviewed source findings from the Product Specification V1, the Morocco Education Marketplace Business Plan, and the Complete Project Handoff. It does not claim those documents are stored in the repository.

Open and proposed items are detailed in [the founder decision log](founder-decision-log.md).

## Product goal

Source-backed rule, from the backlog. Prove a trustworthy paid education marketplace for Morocco with one complete discovery-to-settlement journey: a verified teacher publishes a class, a family understands the offer before paying, a trusted payment creates exactly one entitlement, the learner reaches the private classroom, and refunds and teacher settlement stay auditable.

The pilot uses external live links. Native video, recording automation, artificial-intelligence tutoring, and a native mobile app are deferred.

## Launch user roles

Source-backed backlog constraints:

| Role or relationship | What is already stated |
| --- | --- |
| Learner | Receives classroom access, attendance, and submissions for classes they are entitled to. |
| Teacher | Publishes classes only inside an approved subject and level, delivers paid periods, and manages sessions and attendance. |
| Administrator | The two founders are the initial support and review team. They approve teachers, handle suspensions, and approve exceptional refunds. |
| Payer / guardian | Checkout shows the payer and the learner. Unique payers and unique learners are tracked separately. Access is not granted because an email address or a surname matches. |

Product gap. Whether one person may be both learner and payer, and how minors are onboarded, is [FD-02](founder-decision-log.md) and [FD-03](founder-decision-log.md). There is no source-backed recommendation. Schema and registration must not hard-code a household model. FD-03 has a proposed MVP position in the decision log. Ali has not accepted it.

## Launch marketplace scope

Source-backed backlog rules:

- Public discovery of published classes, on a mobile-width browser and on a desktop browser. This is responsive web, not a native app.
- Filters for curriculum, subject, language, timetable, and availability.
- A class page that shows the teacher, the verification explanation, the total monthly price in MAD, the schedule, capacity, cancellation terms, and the recording policy.
- Private learner data stays off public pages.
- The catalogue does not show fabricated reviews, fabricated enrolment counts, or unsupported quality claims.
- Sorting is relevance-oriented. Personalized recommendation ranking is deferred.

Product gaps: the curriculum list is [FD-18](founder-decision-log.md). Which public files count as previews is [FD-17](founder-decision-log.md).

## Class lifecycle

Source-backed states from Issue #7:

| State | Meaning that is already stated |
| --- | --- |
| Draft | Not sellable. The teacher is still completing the offer. |
| Published | Sellable only when the teacher is approved for that subject and level and the listing is complete. |
| Closed to renewal | The teacher has stopped future renewal. The latest outstanding paid period is still delivered. |
| Ended | Not sellable. Historical obligations remain. |

Source-backed constraints:

- Capacity is a maximum. Listings with zero students are allowed. Delivery to one student is allowed. There is no minimum enrolment and no platform price floor.
- The teacher sets the monthly student price in MAD. Commission is [FD-19](founder-decision-log.md) and is not an approved rate.
- Changing the listed price does not change the price of an in-force subscription. See proposed ADR 0001.
- A class must not be deleted in a way that destroys an active paid obligation.
- Server-side checks reject publication by an unapproved teacher or outside the approved subject and level.
- A class may remain open after it has started while capacity remains. See [FD-14](founder-decision-log.md).

Recording policy is part of the class. See [FD-12](founder-decision-log.md). The paid pilot uses external live links. Recording automation is deferred. Optional manually supplied recordings exist only when they were disclosed before purchase and the founder has approved consent and retention. Otherwise the product does not store recordings.

Product gaps on this lifecycle:

- Whether closed-to-renewal also refuses new enrolments: [FD-04](founder-decision-log.md).
- How reactivation charges: [FD-05](founder-decision-log.md).
- Schedule changes: [FD-07](founder-decision-log.md).
- Holiday dates versus billing: [FD-08](founder-decision-log.md).

## Subscription lifecycle

Source-backed, from the backlog and proposed ADR 0001:

1. Checkout creates an idempotent attempt. The payer sees the learner, the MAD price, the monthly anchor, the next renewal, and the cancellation term before paying.
2. Capacity is reserved so two concurrent checkouts cannot take the same last seat. Hold length and late capture are the product gap in [FD-15](founder-decision-log.md). Do not invent a hold duration.
3. The subscription becomes active only after trusted payment confirmation. Abandoned and failed checkouts do not create entitlement.
4. A learner has at most one active subscription to a given class.
5. The subscription renews monthly from its anchor date. The short-month day rule is the product gap in [FD-25](founder-decision-log.md).
6. The customer may cancel. Cancellation takes effect at the end of the period already paid. No further renewal is charged. Access continues until that period ends. Cancellation also stops future retry behavior. See FD-09.
7. The in-force price stays at the agreed price when the teacher changes the public price.
8. Times are stored in UTC. Schedule and billing dates are displayed in Africa/Casablanca, including timezone-rule changes.

Source-backed grace rules from the business plan and Issue #11, recorded in [FD-09](founder-decision-log.md). These are not an open choice of length, and they are not Accepted until the founder accepts the baseline:

- three days of provisional access after a failed payment
- unpaid retries do not count as collected earnings
- retries are idempotent
- cancellation safely stops future renewal and retry behavior

The billing anchor after a successful recovery is still a product gap inside FD-09. Do not invent it.

Source-backed late enrolment from [FD-14](founder-decision-log.md):

- the learner may join after the class has started, while a seat remains
- the charge is the full monthly price
- the subscription stays monthly and shows a clear rolling end date
- the learner receives previous lessons, resources, and recordings where those exist
- there is no proration

Same-teacher switching and credits: [FD-06](founder-decision-log.md). Do not invent proration or credits. Whether any switch flow exists is a product gap.

Reactivation charges: [FD-05](founder-decision-log.md). Product gap.

## Entitlement and access lifecycle

Source-backed, from proposed ADR 0002. Not Accepted until the founder accepts that record.

| Situation | Classroom access |
| --- | --- |
| Checkout not confirmed by a trusted payment | No paid access. |
| Active paid period | Access to that class's private resources, sessions, and meeting link. |
| Cancellation scheduled, paid period not finished | Access continues until the paid period ends. |
| Failed payment, inside the three-day grace | Provisional access, under the FD-09 source-backed rules. |
| Grace exhausted without trusted payment | Paid access ends. Unpaid retries are not earnings. |
| Paid period ended after cancellation | Paid access ends. |
| Another person, or another class | No access, even with the id, key, or URL. |

Preview access waits on [FD-17](founder-decision-log.md). Recording access waits on [FD-12](founder-decision-log.md) and [FD-13](founder-decision-log.md).

Possession of a meeting link, storage key, or class id is not authorization. The server resolves the caller, the entitlement, and the object before it streams a file or issues a short-lived provider URL.

## Payment, refund, and payout policy assumptions

Source-backed mechanics. These are provider-neutral. They do not approve a vendor or a legal model.

- Student prices and settlements are MAD amounts in integer minor units.
- The provider-hosted or tokenized checkout is the payment flow. The product does not store raw card numbers or CVV.
- A browser redirect is not payment confirmation.
- Provider transaction state, customer entitlement, platform commission, teacher payable, provider settlement, reserves, and actual refunds are different facts.
- A planning refund percentage is not an automatic expense and is not an automatic deduction.
- Releasing a reserve returns the original teacher and platform shares. It does not create new revenue.
- Monthly teacher settlement must not pay obligations that have not been earned. Billing anchors and calendar-month payout dates are not the same clock.
- No minimum payout threshold is in force. Adding one would be a new founder decision.
- There is no guaranteed teacher income and no guaranteed platform profit.
- Payment retries are idempotent. Unpaid retries are not collected earnings.
- Prepaid or manual renewal is not a silent substitute for recurring monthly billing.

Source-backed payment gates from [FD-21](founder-decision-log.md):

- No production provider route is approved.
- The ability to charge cards is not enough.
- Marketplace collection and teacher payout need written provider confirmation.
- Legal and accounting review is required before the first paid customer.
- Live charges stay disabled.
- Development uses a fake or sandbox provider until those gates are satisfied.

Planning assumption, not a product rule: the business plan proposes testing a 20% commission. That figure is not approved. It is not in the proposed ADRs and it is not in `PROJECT_MEMORY.md`. See [FD-19](founder-decision-log.md).

Still unresolved, with no invented formula:

- Seller, invoicing, and which provider can collect and pay out: FD-21. Leave this unapproved.
- Commission model and rate: FD-19.
- When a payer is entitled to a refund beyond end-of-period cancellation: [FD-20](founder-decision-log.md).
- Which side receives a remainder centime: [FD-24](founder-decision-log.md).
- Seat-hold duration and late capture: FD-15.

Issue #14's operational controls are source-backed backlog requirements and apply to whatever refund policy is later accepted: a reason is recorded, exceptional financial actions need a second approver, and support impersonation cannot change payment accounts, credentials, or financial actions. Safety suspension is distinct from ordinary administrative suspension and blocks unsafe teacher interaction immediately.

## Teacher verification policy

Source-backed, from Issue #6:

- A teacher applies and uploads identity and qualification documents through the canonical private storage service.
- An uploaded file is not usable merely because the bytes were stored. Quarantine or scanning state is explicit.
- Founders approve, reject, or request corrections with a reason and an audit history.
- Approval is stored per subject and level. The public profile explains what that review means. The exact sentence is the product gap in [FD-23](founder-decision-log.md). The profile must not make a guaranteed learning claim.
- Unapproved teachers cannot publish or sell. The check is server-side. Losing approval removes the ability to sell.
- Documents are private to authorized founder reviewers. They are not public URLs and they are not written into logs.
- The teacher does not need an existing audience.
- There is no automatic yearly reverification unless a later decision adds it.

Product gap. How long documents are kept is [FD-22](founder-decision-log.md). Do not invent a retention period.

## Learner and guardian model

Source-backed constraints:

- The payer and the learner are identifiable separately at checkout and in pilot metrics.
- A guardian or payer relationship is an explicit link. Matching contact details do not create it.
- The account that pays sees the price, the renewal date, and the cancellation term before checkout.

Product gaps. The account model and the minor gate are [FD-02](founder-decision-log.md) and [FD-03](founder-decision-log.md). No age is stated. The proposed FD-03 position is: do not hard-code an age, keep explicit guardian relationships, and do not infer guardianship. That position is not Accepted.

Source-backed account security:

- Teachers and administrators must use a second factor, with a safe recovery path. The fuller handoff and the lean business plan agree on this.
- Sensitive account changes are logged without secrets.
- Sessions can be revoked. That is session control, not a device-management console.

Source conflict. Student two-factor authentication is [FD-10](founder-decision-log.md). The fuller handoff requires it for students. The lean business plan recommends risk-based student verification instead. The proposed MVP position, not Accepted, is optional learner MFA and mandatory teacher/administrator MFA for privileged access. Ali must explicitly approve it.

Source conflict. Device and session restrictions are [FD-11](founder-decision-log.md). The full product direction includes restriction concepts. The lean plan recommends deferring a full device-management console. The proposed MVP position, not Accepted, is no numeric device cap, with session listing and revocation only. Ali must explicitly approve it.

## Scheduling rules

Source-backed:

- A class has a schedule and a session length, and it can declare holiday or other non-session dates.
- Sessions are shown in Africa/Casablanca.
- The paid pilot delivers live sessions through an external meeting link. The link is visible only to people with current access. It is not on the public catalogue.
- The teacher records attendance and can correct it. The correction history is kept.
- Automated attendance import, native conferencing, and recording automation are deferred.
- A learner who joins after the start, while capacity remains, receives previous lessons, resources, and recordings where those exist, and pays the full monthly price. See FD-14.

Product gaps:

- Changing the schedule after payment: [FD-07](founder-decision-log.md).
- Whether a holiday changes the price or the period end: [FD-08](founder-decision-log.md).

## Content, resources, and recording rules

Source-backed privacy semantics, from proposed ADR 0002. The storage vendor is not part of these rules.

| Category | Who may access | Public catalogue |
| --- | --- | --- |
| Class resources | Class teacher, authorized administrator, learner with current paid entitlement for that class | No |
| Learner submissions | Submitting learner, that class's teacher, authorized administrator | No |
| Verification documents | Authorized founder reviewers | No |
| Meeting links | People with current class access, the teacher, authorized administrators | No |
| Recordings | Only under FD-12 and FD-13. Never a public object | No |
| Preview files | Only after FD-17 defines them | Only if a later decision explicitly marks them |

Source-backed handling:

- Feature code uses the canonical storage service. It does not call a vendor SDK and does not treat a filesystem path as identity.
- The server authorizes the relationship before it streams bytes or asks a provider for a short-lived URL.
- Uploads declare size and type limits. Path traversal and cross-class access fail closed.
- Replacement and deletion must be representable so a retained file can be removed when its policy says so.
- Backup and restore must not make private objects public.
- Late learners receive prior lessons and resources that exist. They receive a recording only where one exists under FD-12 and FD-13.

Source-backed recording direction from [FD-12](founder-decision-log.md):

- no recording automation in the initial paid pilot
- optional manually supplied recordings only if they were disclosed before purchase and founder-approved consent and retention rules are in place
- otherwise recordings remain off

Source-backed retention proposal from [FD-13](founder-decision-log.md), not a mandatory value: 90 days per recording, rolling from that recording, so an open-ended class does not keep recordings forever. Founder approval is required.

Product gap. Verification-document lifetime is FD-22. Preview marking is FD-17.

## Review eligibility

Source-backed:

- A review must be tied to genuine enrolment or participation.
- Public pages do not show seeded reviews, fake enrolment counts, or quality claims the product cannot support.
- Eligible public reviews may be staged or deferred until the service has repeatable renewal.

Product gap. The exact eligibility timing is [FD-16](founder-decision-log.md). No attended-session count is stated. Do not invent one.

## Localization and language scope

Accepted in [FD-01](founder-decision-log.md). Launch copy is Arabic and French. English does not ship in the MVP. English stays architecture-ready and is deferred until demand justifies enabling launch copy.

The architecture is RTL-ready for Arabic and localization-ready for French and for a later English locale. Curriculum labels and interface copy are data, not hard-coded feature logic. Dates and times shown to users use Africa/Casablanca.

This decision unblocks Issue #2 localization and scaffold work. It does not start Issue #2.

## Launch inclusions

The launch pilot is the discovery-to-settlement path already split across Issues #2–#16. Inclusions below are the product contents of that path. They are not permission to start an issue before its dependencies and the decisions that block it are settled.

- Founder-reviewed teacher onboarding and scoped permission to sell.
- Class draft, publish, stop-renewal, and end, with teacher-set MAD prices and a maximum capacity, including enrolment after the start while capacity remains.
- Public class discovery on mobile and desktop web, including price, schedule, teacher, cancellation, and delivery terms before payment.
- Recurring monthly checkout, capacity reservation, and a single entitlement after trusted payment confirmation.
- End-of-period cancellation, in-force price protection, renewal, and the source-backed three-day grace rules.
- Private classroom: sessions, external meeting link, resources, submissions, and teacher-managed attendance.
- Optional manually supplied recordings only after FD-12 and FD-13 are approved. Otherwise recordings stay off. No recording automation.
- Ledger separation for gross tuition, commission, teacher payable, refunds, and reserves. The commission rate is not approved.
- Founder support for teacher review, suspension, reasoned refunds, and audit.
- Required transactional notices on the channel the founder names in [FD-26](founder-decision-log.md). SMS and WhatsApp are not assumed.
- Pilot metrics that separate learners, payers, subscriptions, actual refunds, reserves, commission, and teacher obligations. Founder support time is workload, not an automatic payroll expense. Planning assumptions stay labeled as assumptions.
- Staging proof of the journey, including private-file restore, before any live charge.

Measurable acceptance of the journey, using synthetic people only:

1. A teacher is approved for a subject and level that are on the founder list from FD-18.
2. That teacher publishes a class whose page shows price, schedule, capacity, cancellation at period end, and delivery by an external meeting link.
3. A payer completes checkout. A second concurrent buyer cannot take the same last seat.
4. Entitlement appears only after trusted payment confirmation, and a different account cannot open the classroom or the files.
5. The learner can open the meeting link, and the teacher can mark attendance.
6. A late enrollee, while capacity remains, pays a full month, sees the rolling end date, and can open prior lessons and resources that exist.
7. A failed renewal grants three days of provisional access. Unpaid retries are not earnings. Cancellation stops later renewal and retry work.
8. Cancellation stops the following renewal and leaves the current paid period usable.
9. A founder-approved refund and a teacher settlement post as separate ledger outcomes, and unearned amounts are not paid out.
10. A restored backup still requires application authorization for private files.

Steps that depend on a product gap or a source conflict use the option the founder accepts. They are not passed by substituting a different rule. Source-backed rules are not replaced with a different design while the founder reviews them.

## Explicit deferrals

- Native video conferencing.
- Recording automation. Optional manual recordings are not deferred as a category; they stay off until FD-12 and FD-13 are approved.
- Artificial-intelligence tutoring, lesson generation, and automated assessment.
- Native mobile applications. Responsive web is in scope.
- Advanced exam tooling and automated attendance integrations.
- Personalized ranking and recommendation engines.
- A full device-management console, if the founder follows the lean plan in FD-11. The restriction concept itself is a source conflict, not a deferral.
- Automatic yearly teacher reverification.
- Advanced configurable role systems and helpdesk automation.
- SMS and WhatsApp, unless FD-26 includes them.
- English launch copy. Arabic and French are the launch languages. English stays architecture-ready until demand justifies enabling that copy.
- Platform price floors, minimum class size, minimum payout, and guaranteed income.
- Kubernetes, microservices, a separate backend stack, a required Redis dependency, and a required GraphQL API. Those are architecture boundaries owned by Issue #2.
- A production storage vendor choice.
- A production payment provider choice and any live charge.
- Same-teacher switching credits, unless the founder later accepts a credit rule the sources do not state.
- Seeded or unverified reviews.
- Public review display before the service has repeatable renewal, which the sources allow to be staged.

## Known unresolved decisions

FD-01 is Accepted and is not in this list. Launch copy is Arabic and French. English is architecture-ready and deferred. That acceptance unblocks Issue #2 from the product-language side. The scaffold is in draft pull request #20 and is not merged.

The full statements are in [the founder decision log](founder-decision-log.md). Entries below are for later issues. They are not Accepted. ADR 0001 and ADR 0002 remain Proposed.

| ID | Topic | Classification | Blocks |
| --- | --- | --- | --- |
| FD-02 | Learner and payer/guardian | Product gap | #3, #5 |
| FD-03 | Minors and guardian onboarding | Product gap; proposed position not Accepted | #5 |
| FD-04 | Class stop versus new enrolment | Product gap | #7, #11 |
| FD-05 | Reactivation and charge consent | Product gap | #11 |
| FD-06 | Switching and credits | No invented credits; switch flow is a gap | #11 |
| FD-07 | Schedule changes and dissent | Product gap | #7, #12 |
| FD-08 | Holidays and billing | Product gap | #7, #11 |
| FD-09 | Failed-payment grace | Source-backed rules; recovery anchor is a gap | Anchor blocks #11 |
| FD-10 | Student second factor | Source conflict; proposed position not Accepted | #5 |
| FD-11 | Device and session restrictions | Source conflict; proposed position not Accepted | #5, for a restriction or a console |
| FD-12 | Recordings in the pilot | Source-backed direction; consent still needs approval | Storing recordings blocks #7 and #12 |
| FD-13 | Recording retention | Source-backed 90-day proposal | #12, if recordings are stored |
| FD-14 | Late enrolment | Source-backed rule | None, after baseline acceptance |
| FD-15 | Seat hold and late capture | Product gap | #10 |
| FD-16 | Review timing | Source constraints; timing is a gap | #8 eligibility clock |
| FD-17 | Preview content | Product gap | #7, #8, #12 |
| FD-18 | Launch curriculum list | Product gap | #6, #7 |
| FD-19 | Commission | Planning proposal to test 20%; not a settled rate | #8, #10, #13 |
| FD-20 | Refund entitlement | Product gap | #13, #14 |
| FD-21 | Legal funds-flow and provider | Gates are source-backed; seller model is open | Live charges, #4, #16 |
| FD-22 | Verification-document retention | Product gap | Automatic deletion in #6 |
| FD-23 | Public verification wording | Product gap for the sentence | #6, #8 copy |
| FD-24 | Commission rounding | Product gap | #3, #13 |
| FD-25 | Short-month billing anchor | Product gap | #3, #11 |
| FD-26 | Launch notification channels | Product gap; SMS and WhatsApp not assumed | #15 |

None of these rows block Issue #2. They block only the later issue in the last column. They do not block the scaffold, the fake payment adapter, or the provider-neutral storage boundary.

## Paid-pilot readiness criteria

Live customer charges wait until all of the following are true. Issue #16 is the evidence issue.

- The founder has accepted the proposed baseline, including the source-backed rules, and has closed every product gap and source conflict that the pilot journey uses.
- A synthetic staging run completes the measurable journey above, including renewal, the three-day grace behavior, cancellation, a refund, and a teacher settlement.
- Authorization failures are demonstrated for cross-account classroom access, verification documents, and submissions.
- Payment events are authenticated, duplicate-safe, and reconcilable. A browser return alone does not grant access. Retries are idempotent.
- The configured private storage can be backed up and restored without making private objects public, and missing or orphaned objects are detectable.
- Health, failed payment processing, and reconciliation alerts have a named owner.
- Written provider confirmation covers marketplace collection, teacher payout, refunds, reserves, settlement delay, and fees. Card charging alone is not enough.
- Legal and accounting review of seller, agent, and invoicing roles is recorded before the first paid customer.
- No critical defect remains in money movement, authorization, privacy, storage recovery, or learner safety.
- Deployment, rollback, and incident response are written down. Live payment configuration stays off until those blockers are closed.

A business-plan revenue target, and the proposed 20% commission test, are not readiness criteria and are not approved rates.
