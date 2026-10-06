# MVP scope

Issue #1. This is the product baseline for later engineering issues. It is documentation only. It does not choose a storage vendor, a payment provider, or a legal funds-flow model.

## How to read this document

Every rule below has one of these statuses.

| Status | Meaning |
| --- | --- |
| Agreed | Stated by Issue #1 or by a backlog acceptance criterion, and accepted in an ADR where the rule is product-significant. Engineering may build it. |
| Open | A founder decision in [the decision log](founder-decision-log.md). Engineering must not invent the missing rule. |
| Planning assumption | A business-plan or forecast figure. It is not a product rule and must not be posted as revenue, cost, or an automatic refund. |
| Deferred | Explicitly out of the launch pilot. |

The three named source documents were not in the repository at base commit `7e5e124`:

- Education Marketplace & Learning Platform — Product Specification V1
- Morocco Education Marketplace Business Plan
- Education Marketplace — Complete Project Handoff & Product Specification

This baseline uses the GitHub backlog that describes itself as based on those documents and on founder clarifications. If the documents are added later and disagree with an agreed rule, stop and surface the conflict.

Accepted records:

- [ADR 0001 — MVP subscription and supply rules](../adr/0001-mvp-subscription-and-supply-rules.md)
- [ADR 0002 — Paid access and private-content semantics](../adr/0002-paid-access-and-private-content.md)

## Product goal

Agreed. Prove a trustworthy paid education marketplace for Morocco with one complete discovery-to-settlement journey: a verified teacher publishes a class, a family understands the offer before paying, a trusted payment creates exactly one entitlement, the learner reaches the private classroom, and refunds and teacher settlement stay auditable.

The pilot optimizes for that journey. It does not optimize for native video, artificial-intelligence tutoring, or a native mobile app.

## Launch user roles

Agreed roles and relationships from the backlog:

| Role or relationship | What the backlog already fixes |
| --- | --- |
| Learner | Receives classroom access, attendance, and submissions for classes they are entitled to. |
| Teacher | Publishes classes only inside an approved subject and level, delivers paid periods, and manages sessions and attendance. |
| Administrator | The two founders are the initial support and review team. They approve teachers, handle suspensions, and approve exceptional refunds. |
| Payer / guardian | Checkout shows the payer and the learner. Unique payers and unique learners are tracked separately. Access is never granted because an email address or a surname matches. |

Open. Whether one person may be both learner and payer, and how minors are onboarded, is [FD-02](founder-decision-log.md) and [FD-03](founder-decision-log.md). Until those are accepted, schema and registration must not hard-code a household model.

## Launch marketplace scope

Agreed.

- Public discovery of published classes, on a mobile-width browser and on a desktop browser. This is responsive web, not a native app.
- Filters for curriculum, subject, language, timetable, and availability.
- A class page that shows the teacher, the verification explanation, the total monthly price in MAD, the schedule, capacity, cancellation terms, and the recording policy.
- Private learner data stays off public pages.
- The catalogue does not show fabricated reviews, fabricated enrolment counts, or unsupported quality claims.
- Sorting is relevance-oriented. Personalized recommendation ranking is deferred.
- The curriculum list itself is not agreed. [FD-18](founder-decision-log.md) must supply the closed list before verification and publishing treat a subject as real.
- Which public files count as previews is [FD-17](founder-decision-log.md).

## Class lifecycle

Agreed states from Issue #7:

| State | Meaning that is already fixed |
| --- | --- |
| Draft | Not sellable. The teacher is still completing the offer. |
| Published | Sellable only when the teacher is approved for that subject and level and the listing is complete. |
| Closed to renewal | The teacher has stopped future renewal. The latest outstanding paid period is still delivered. |
| Ended | Not sellable. Historical obligations remain. |

Agreed constraints:

- Capacity is a maximum. Listings with zero students are allowed. Delivery to one student is allowed. There is no minimum enrolment and no platform price floor.
- The teacher sets the monthly student price in MAD, subject to the commission model in [FD-19](founder-decision-log.md).
- Changing the listed price does not change the price of an in-force subscription. See ADR 0001.
- A class must not be deleted in a way that destroys an active paid obligation.
- Server-side checks reject publication by an unapproved teacher or outside the approved subject and level.
- A recording policy is part of the class. Storing recordings is open under [FD-12](founder-decision-log.md). Until that decision, launch classes are not recorded by Taalim.

Open parameters on this lifecycle:

- Whether closed-to-renewal also refuses new enrolments: [FD-04](founder-decision-log.md). Recommended: yes.
- How reactivation charges: [FD-05](founder-decision-log.md). Recommended: a new explicit payer consent, and no charge for a period already paid.
- Schedule changes: [FD-07](founder-decision-log.md).
- Holiday dates versus billing: [FD-08](founder-decision-log.md).

## Subscription lifecycle

Agreed, from ADR 0001 and Issues #10 and #11:

1. Checkout creates an idempotent attempt. The payer sees the learner, the MAD price, the monthly anchor, the next renewal, and the cancellation term before paying.
2. Capacity is reserved so two concurrent checkouts cannot take the same last seat. The hold duration and the result of a payment that succeeds after expiry are [FD-15](founder-decision-log.md).
3. The subscription becomes active only after trusted payment confirmation. Abandoned and failed checkouts do not create entitlement.
4. A learner has at most one active subscription to a given class.
5. The subscription renews monthly from its anchor date. Short months use [FD-25](founder-decision-log.md). Recommended: keep the original day, and use the last day of a short month only for that month.
6. The customer may cancel. Cancellation takes effect at the end of the period already paid. No further renewal is charged. Access continues until that period ends.
7. The in-force price stays at the agreed price when the teacher changes the public price.
8. Times are stored in UTC. Schedule and billing dates are displayed in Africa/Casablanca, including timezone-rule changes.

Open, and not to be invented in implementation:

- Grace length, provisional access, and the anchor after a failed renewal: [FD-09](founder-decision-log.md). Issue #11 states three days of provisional access. That figure is the recommended option. It is not accepted until the founder confirms it, because Issue #1 lists grace as a decision and the original documents are not in the repository.
- Same-teacher switching and credits: [FD-06](founder-decision-log.md). No credit and no proration rule exists. Recommended launch behavior is no in-product switch.
- Late joiners: [FD-14](founder-decision-log.md). Recommended: a full first month and a new anchor, with no credit for sessions already held.
- Reactivation charges: [FD-05](founder-decision-log.md).

If the founder accepts FD-09 option A, the failed-renewal path is: three calendar days of provisional access; a trusted success continues the same subscription, price, and anchor; unpaid retries are not earnings; exhaustion suspends access; a later purchase is a new subscription at the current listed price.

## Entitlement and access lifecycle

Agreed, from ADR 0002:

| Situation | Classroom access |
| --- | --- |
| Checkout not confirmed by a trusted payment | No paid access. |
| Active paid period | Access to that class's private resources, sessions, and meeting link. |
| Cancellation scheduled, paid period not finished | Access continues until the paid period ends. |
| Paid period ended after cancellation | Paid access ends. |
| Another person, or another class | No access, even if they know the id, key, or URL. |

Preview access and grace access are not in this table. Preview waits on [FD-17](founder-decision-log.md). Grace waits on [FD-09](founder-decision-log.md). Recording access waits on [FD-12](founder-decision-log.md) and [FD-13](founder-decision-log.md).

Possession of a meeting link, storage key, or class id is not authorization. The server resolves the caller, the entitlement, and the object before it streams a file or issues a short-lived provider URL.

## Payment, refund, and payout policy assumptions

Agreed mechanics. These are provider-neutral. They do not approve a vendor or a legal model.

- Student prices and settlements are MAD amounts in integer minor units.
- The provider-hosted or tokenized checkout is the payment flow. The product does not store raw card numbers or CVV.
- A browser redirect is not payment confirmation.
- Provider transaction state, customer entitlement, platform commission, teacher payable, provider settlement, reserves, and actual refunds are different facts.
- A planning refund percentage is not an automatic expense and is not an automatic deduction. Planning assumption.
- Releasing a reserve returns the original teacher and platform shares. It does not create new revenue.
- Monthly teacher settlement must not pay obligations that have not been earned. Billing anchors and calendar-month payout dates must not be treated as the same clock.
- No minimum payout threshold is in force. Adding one would be a new founder decision.
- There is no guaranteed teacher income and no guaranteed platform profit.
- Development uses a fake or sandbox adapter. Live charges stay disabled until Issue #4 records provider capability and the required legal review, and Issue #16 records paid-pilot readiness.
- Prepaid or manual renewal is not a silent substitute for recurring monthly billing. It would be an explicit founder exception.

Open:

- Who is the seller, who invoices, and which provider can collect and pay out: [FD-21](founder-decision-log.md). Recommended: leave this unapproved.
- Whether the teacher-set price is the student gross price, and what the commission rate is: [FD-19](founder-decision-log.md). Recommended model: teacher sets the student price, and a versioned commission is deducted. The percentage is not known and must not be invented.
- When a payer is entitled to a refund beyond ordinary end-of-period cancellation: [FD-20](founder-decision-log.md). Recommended: no automatic refund of the current period; a founder may approve a refund when the paid period is not delivered.
- Which side receives a remainder centime: [FD-24](founder-decision-log.md). Recommended: the platform.
- Seat-hold expiry refunds: [FD-15](founder-decision-log.md).

Issue #14's operational controls are agreed and apply to whatever refund policy is accepted: a reason is recorded, exceptional financial actions need a second approver, and support impersonation cannot change payment accounts, credentials, or financial actions. Safety suspension is distinct from ordinary administrative suspension and blocks unsafe teacher interaction immediately.

## Teacher verification policy

Agreed, from Issue #6:

- A teacher applies and uploads identity and qualification documents through the canonical private storage service.
- An uploaded file is not usable merely because the bytes were stored. Quarantine or scanning state is explicit.
- Founders approve, reject, or request corrections with a reason and an audit history.
- Approval is stored per subject and level. The public profile explains what that review means. The public sentence is [FD-23](founder-decision-log.md). Recommended sentence: founder-reviewed for the listed subjects and levels, with no government-accreditation claim and no learning-outcome claim.
- Unapproved teachers cannot publish or sell. The check is server-side. Losing approval removes the ability to sell.
- Documents are private to authorized founder reviewers. They are not public URLs and they are not written into logs.
- The teacher does not need an existing audience.
- There is no automatic yearly reverification unless a later decision adds it.
- The product does not promise a learning result.

Open. How long documents are kept is [FD-22](founder-decision-log.md). Recommended until counsel sets a period: keep them until an authorized, audited deletion.

## Learner and guardian model

Agreed constraints:

- The payer and the learner are identifiable separately at checkout and in pilot metrics.
- A guardian or payer relationship is an explicit link. Matching contact details do not create it.
- The account that pays is the account that must see the price, the renewal date, and the cancellation term before checkout.

Open. The account model and the minor gate are [FD-02](founder-decision-log.md) and [FD-03](founder-decision-log.md).

Recommended, not accepted: one person may be both learner and payer when they are allowed to contract; below the founder-confirmed age, a guardian is the payer and accepts the terms. Engineering does not choose the age.

Agreed account security from Issue #5:

- Teachers and administrators must use a second factor, with a safe recovery path.
- Sensitive account changes are logged without secrets. Sessions can be revoked.

Open account security:

- Learner and payer second factor: [FD-10](founder-decision-log.md). Recommended: require it for payer and guardian accounts, and do not require it for learner-only accounts at launch.
- Device caps and social login: [FD-11](founder-decision-log.md). Recommended: no device cap at launch, session revocation stays, and social login waits.

## Scheduling rules

Agreed:

- A class has a schedule and a session length, and it can declare holiday or other non-session dates.
- Sessions are shown in Africa/Casablanca.
- Delivery at launch uses an external meeting link. The link is visible only to people with current access. It is not on the public catalogue.
- The teacher records attendance and can correct it. The correction history is kept.
- Automated attendance import and native conferencing are deferred.

Open:

- Changing the schedule after payment, and what a dissenting subscriber can do: [FD-07](founder-decision-log.md). Recommended: the current paid period keeps the purchased schedule; a new schedule applies to later periods; dissenters cancel at period end; no mid-period credit.
- Whether a holiday changes the price or the period end: [FD-08](founder-decision-log.md). Recommended: the session is skipped and the billing period is unchanged.
- Joining after the class has started: [FD-14](founder-decision-log.md).

## Content, resources, and recording rules

Agreed privacy semantics, from ADR 0002. The storage vendor is not part of these rules.

| Category | Who may access | Public catalogue |
| --- | --- | --- |
| Class resources | Class teacher, authorized administrator, learner with current paid entitlement for that class | No |
| Learner submissions | Submitting learner, that class's teacher, authorized administrator | No |
| Verification documents | Authorized founder reviewers | No |
| Meeting links | People with current class access, the teacher, authorized administrators | No |
| Recordings | Not stored until FD-12 is accepted | No |
| Preview files | Only after FD-17 defines them | Only if explicitly marked, under the accepted option |

Agreed handling:

- Feature code uses the canonical storage service. It does not call a vendor SDK and does not treat a filesystem path as identity.
- The server authorizes the relationship before it streams bytes or asks a provider for a short-lived URL.
- Uploads declare size and type limits. Path traversal and cross-class access fail closed.
- Replacement and deletion must be representable so a retained file can be removed when its policy says so.
- Backup and restore must not make private objects public.

Open:

- Preview marking: [FD-17](founder-decision-log.md).
- Recording consent: [FD-12](founder-decision-log.md). Recommended for the paid pilot: do not store recordings.
- Recording retention, if recordings are stored: [FD-13](founder-decision-log.md).
- Verification-document lifetime: [FD-22](founder-decision-log.md).

## Review eligibility

Agreed. Public pages do not show seeded reviews, fake enrolment counts, or quality claims that the product cannot support.

Open. Who may submit a review is [FD-16](founder-decision-log.md). Recommended: one review per learner per class, by that learner or a linked guardian, only after at least one attended session is recorded. Until that decision, the catalogue ships without a review list.

## Localization and language scope

Agreed. The product must be able to present Arabic with RTL layout, French, and English. Curriculum labels and interface copy are data, not hard-coded feature logic. Dates and times shown to users use Africa/Casablanca.

Open. Which of those languages ship to customers at launch is [FD-01](founder-decision-log.md). Recommended: all three. This decision blocks Issue #2.

## Launch inclusions

The launch pilot is the discovery-to-settlement path already split across Issues #2–#16. Inclusions below are the product contents of that path. They are not permission to start an issue before its dependencies and open decisions are settled.

- Founder-reviewed teacher onboarding and scoped permission to sell.
- Class draft, publish, stop-renewal, and end, with teacher-set MAD prices and a maximum capacity.
- Public class discovery on mobile and desktop web, including price, schedule, teacher, cancellation, and delivery terms before payment.
- Recurring monthly checkout, capacity reservation, and a single entitlement after trusted payment confirmation.
- End-of-period cancellation, in-force price protection, and renewal.
- Private classroom: sessions, external meeting link, resources, submissions, and teacher-managed attendance.
- Ledger separation for gross tuition, commission, teacher payable, refunds, and reserves, using the commission and refund decisions once accepted.
- Founder support for teacher review, suspension, reasoned refunds, and audit.
- Required transactional notices on the channel accepted in [FD-26](founder-decision-log.md). Recommended: email only.
- Pilot metrics that separate learners, payers, subscriptions, actual refunds, reserves, commission, and teacher obligations. Founder support time is workload, not an automatic payroll expense. Planning assumption figures stay labeled as assumptions.
- Staging proof of the journey, including private-file restore, before any live charge.

Measurable acceptance of the journey, using synthetic people only:

1. A teacher is approved for a subject and level that are on the founder list.
2. That teacher publishes a class whose page shows price, schedule, capacity, cancellation at period end, and delivery by external meeting.
3. A payer completes checkout. A second concurrent buyer cannot take the same last seat.
4. Entitlement appears only after trusted payment confirmation, and a different account cannot open the classroom or the files.
5. The learner can attend the recorded session entry and the teacher can mark attendance.
6. Cancellation stops the following renewal and leaves the current paid period usable.
7. A founder-approved refund and a teacher settlement post as separate ledger outcomes, and unearned amounts are not paid out.
8. A restored backup still requires application authorization for private files.

Steps that depend on an open decision use the option the founder accepts. They are not passed by substituting a different rule.

## Explicit deferrals

These are out of the launch pilot unless a later founder decision pulls one back in.

- Native video conferencing and in-product recording, until FD-12 accepts recordings. External meeting links are the launch delivery mode.
- Artificial-intelligence tutoring, lesson generation, and automated assessment.
- Native mobile applications. Responsive web is in scope.
- Advanced exam tooling and automated attendance integrations.
- Personalized ranking and recommendation engines.
- Social login and a device-limit product, unless FD-11 accepts them.
- Automatic yearly teacher reverification.
- Advanced configurable role systems and helpdesk automation.
- SMS and WhatsApp, unless FD-26 accepts them.
- Platform price floors, minimum class size, minimum payout, and guaranteed income.
- Kubernetes, microservices, a separate backend stack, a required Redis dependency, and a required GraphQL API. Those are architecture boundaries owned by Issue #2, recorded here so product scope does not smuggle them in.
- A production storage vendor choice.
- A production payment provider choice and any live charge.
- Same-teacher switching credits, unless FD-06 accepts a credit rule.
- Seeded or unverified reviews.

## Known unresolved decisions

The full statements, options, and consequences are in [the founder decision log](founder-decision-log.md).

| ID | Topic | Blocks |
| --- | --- | --- |
| FD-01 | Launch languages | #2 |
| FD-02 | Learner and payer/guardian | #3, #5 |
| FD-03 | Minors and guardian onboarding | #5 |
| FD-04 | Class stop versus new enrolment | #7, #11 |
| FD-05 | Reactivation and charge consent | #11 |
| FD-06 | Switching and credits | #11 |
| FD-07 | Schedule changes and dissent | #7, #12 |
| FD-08 | Holidays and billing | #7, #11 |
| FD-09 | Failed-payment grace | #11 |
| FD-10 | Student and payer second factor | #5 |
| FD-11 | Device limits and social login | #5 |
| FD-12 | Recording consent | #7, #12 |
| FD-13 | Recording retention | #12, only if recordings are stored |
| FD-14 | Late enrolment | #10 |
| FD-15 | Seat hold and late capture | #10 |
| FD-16 | Review eligibility | #8 |
| FD-17 | Preview content | #7, #8, #12 |
| FD-18 | Launch curriculum list | #6, #7 |
| FD-19 | Commission model and rate | #8, #10, #13 |
| FD-20 | Refund entitlement | #13, #14 |
| FD-21 | Legal funds-flow and payment provider | Live charges, #4, #16 |
| FD-22 | Verification-document retention | #6 |
| FD-23 | Public verification wording | #6, #8 |
| FD-24 | Commission rounding | #3, #13 |
| FD-25 | Short-month billing anchor | #3, #11 |
| FD-26 | Launch notification channels | #15 |

Issue #2 is blocked by founder acceptance of ADR 0001 and ADR 0002, and by FD-01. The other rows block the issues in the last column. They do not block the scaffold, the fake payment adapter, or the provider-neutral storage boundary.

## Paid-pilot readiness criteria

Live customer charges wait until all of the following are true. Issue #16 is the evidence issue. This list is the product gate that evidence must satisfy.

- The founder has accepted the agreed rules in this document and has closed every open decision that the pilot journey actually uses.
- A synthetic staging run completes the measurable journey above, including renewal, cancellation, a refund, and a teacher settlement.
- Authorization failures are demonstrated for cross-account classroom access, verification documents, and submissions.
- Payment events are authenticated, duplicate-safe, and reconcilable. A browser return alone does not grant access.
- The configured private storage can be backed up and restored without making private objects public, and missing or orphaned objects are detectable.
- Health, failed payment processing, and reconciliation alerts have a named owner.
- Issue #4 has written provider answers for recurring collection, teacher payout, refunds, reserves, settlement delay, and fees, plus the legal review of seller, agent, and invoicing roles.
- No critical defect remains in money movement, authorization, privacy, storage recovery, or learner safety.
- Deployment, rollback, and incident response are written down. Live payment configuration stays off until those blockers are closed.

A business-plan revenue target is not a readiness criterion. Planning assumption.
