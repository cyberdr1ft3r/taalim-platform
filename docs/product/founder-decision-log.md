# Founder decision log

Issue #1 established the original decision log. Accepted entries currently include FD-01, FD-02, FD-03, FD-10, FD-11, FD-24, and FD-25. All other entries retain the classification stated in their own section.

On 2026-10-09, Ali explicitly approved the previously proposed MVP positions for FD-03, FD-10, and FD-11. Those three entries are now Accepted.

[ADR 0001](../adr/0001-mvp-subscription-and-supply-rules.md) and [ADR 0002](../adr/0002-paid-access-and-private-content.md) stay Proposed. Accepting FD-01 does not accept those records.

The product source documents are not repository files. This log has been reconciled against externally reviewed findings from:

- Education Marketplace & Learning Platform — Product Specification V1
- Morocco Education Marketplace Business Plan
- Education Marketplace — Complete Project Handoff & Product Specification

Those files are still not in the GitHub repository. This log does not claim they are.

## Classifications

| Classification | Meaning |
| --- | --- |
| Accepted | The founder has approved this entry. Current Accepted entries include FD-01, FD-02, FD-03, FD-10, FD-11, FD-24, and FD-25. |
| Source-backed rule | The reviewed sources or the backlog state the rule. It is not an open design choice. It is still not Accepted until the founder accepts that rule. |
| Source-backed recommendation | A source proposes it. Founder approval is still required before engineering treats it as the rule. |
| Genuine source conflict | The sources disagree. The founder must choose. This log does not choose. |
| Product gap | The reviewed sources do not answer it. Engineering must not invent a number, age, rate, cap, formula, or timing rule. |

## How to read an entry

Each entry states the classification, the source position, the options where a real choice remains, the recommendation only when a source supports one, the consequence of each option, and whether engineering is blocked.

Issue #2 is merged and ADR 0003 is the canonical application architecture baseline. Later entries block only the issues named on each entry; they do not retroactively block the merged scaffold, fake payment adapter, or provider-neutral storage boundary.

## FD-01. Launch languages

- Classification: Accepted.
- Accepted option: Launch copy is Arabic and French. English stays architecture-ready and is deferred until demand justifies enabling launch copy.
- Source: The Morocco business plan recommended this launch set. The founder accepted it for Issue #1.
- What Issue #2 builds from this decision: RTL-ready Arabic, French launch copy, and an English locale path that does not ship English launch copy. Curriculum labels and interface copy stay data, not hard-coded feature logic.
- Options not accepted: shipping English copy at launch, or shipping only one language.
- Engineering blocked: No. This decision unblocks Issue #2 localization and scaffold work. It does not start Issue #2.

## FD-02. Learner and payer/guardian relationship

- Classification: Accepted.
- Accepted option: One account may be both learner and payer when that person is the contracting party. A separate explicit guardian/payer relationship is used when another person pays or acts for the learner.
- Source context: Issue #3 requires guardian-payer relationships. Issue #5 requires an explicit approved link and forbids access merely because an email or surname matches. Issue #10 shows payer and learner at checkout. Issue #15 counts them separately.
- Consequences:
  - Adults can subscribe for themselves without creating a second account.
  - A learner and a payer can still be different people and must then be connected through an explicit application relationship.
  - Unique learner and unique payer metrics remain distinguishable even when the same account fulfills both roles.
  - This decision does not set a legal age threshold or minor-contracting rule; FD-03 remains open.
- Engineering blocked: No for #3 account shape. #5 still depends on FD-03 for minors.

## FD-03. Minors and guardian onboarding

- Classification: Accepted.
- Accepted on: 2026-10-09 by Ali.
- Source: The backlog requires a guardian relationship. No reviewed finding states an age threshold, who creates the learner account, or who may accept paid terms. This log does not invent an age.
- Options:
  - A. Any learner account may subscribe. The product does not ask about age.
  - B. Below an age the founder sets with legal review, the guardian creates or links the learner, accepts the terms, and is the payer. That learner cannot independently contract.
  - C. Every learner requires a guardian, at every age.
- Accepted MVP position:
  - Do not hard-code a Moroccan legal-age threshold in application code yet.
  - Keep explicit guardian relationships. FD-02 already requires that link when the learner and the payer are different people.
  - Leave any age or minor-specific enforcement configurable and deferred until legal and product review establishes the rule.
  - Do not infer guardianship from an email address, a surname, or a shared household.
- Accepted option: the position above. It deliberately does not choose an age.
- Consequences:
  - A. Fastest onboarding. Minor contracting stays unresolved in the product.
  - B. Families can pay for children, and adults can pay for themselves, once the founder and counsel name the age.
  - C. Adult students must onboard a second person before they can pay.
  - The proposal lets launch proceed without an invented age, while the explicit relationship from FD-02 remains the only guardian path.
- Engineering blocked without a decision: No for #2 or #5 on this decision. The merged Issue #5 authorization code does not encode an age and does not infer guardianship. Any future age gate remains deferred until legal and product review names the rule.

## FD-04. Stopping a class versus stopping renewal

- Classification: Product gap.
- Source: Issue #7 requires draft, published, closed-to-renewal, and ended states, and requires fulfilment of the latest outstanding paid period. Issue #11 requires teacher stop-renewal. Neither the backlog nor the reviewed findings say whether closed-to-renewal also refuses new enrolments.
- Options:
  - A. Closed-to-renewal refuses new enrolments and refuses future renewals. Learners already inside a paid period keep that period, and the teacher still delivers it.
  - B. Closed-to-renewal stops only automatic renewal. New students may still enrol until the class is ended.
  - C. Stopping a class cancels remaining sessions immediately and creates refunds for undelivered time.
- Recommendation: none. Option C would invent a refund formula. See FD-20.
- Consequences:
  - A. Teachers can stop taking students without abandoning people who already paid. The outstanding paid period is still delivered.
  - B. A class can gain new subscribers after the teacher has started to wind it down.
  - C. Conflicts with fulfilment of the outstanding paid period unless a refund rule is accepted. No such formula is source-backed.
- Engineering blocked without a decision: No for #2. Yes for #7 and #11.

## FD-05. Class reactivation and charging consent

- Classification: Product gap.
- Source: Issue #11 requires approved reactivation without unauthorized new charges. The reviewed findings do not say whether an old payment mandate resumes.
- Options:
  - A. Reopening a class never charges a person until that payer completes a new explicit payment consent. People still inside a paid period are not charged again for that period.
  - B. Reopening resumes the previous mandate automatically at the previous price.
  - C. Founder approval alone resumes charges, without a new payer consent.
- Recommendation: none.
- Consequences:
  - A. Republishing a class does not by itself create a new charge. A payer who wants to continue goes through checkout again.
  - B. A payer can be charged because a teacher reopened a class.
  - C. A founder can resume charges without the payer's fresh consent.
- Engineering blocked without a decision: No for #2. Yes for #11.

## FD-06. Same-teacher class switching and credits

- Classification: Source-backed constraint, plus a product gap for any switch flow.
- Source: Issue #11 says not to invent proration or credits. The reviewed late-enrolment findings also say not to invent a proration rule. No source states a credit formula or a switch procedure.
- What is fixed: engineering must not invent proration or credits.
- Options for the remaining gap:
  - A. No in-product switch. The payer cancels at the end of the paid period and may subscribe to another class separately. Overlap is possible, and both prices are payable.
  - B. A switch carries unused time as a credit.
  - C. A switch is allowed only at a period boundary, with no credit and no overlapping charge.
- Recommendation: none beyond the constraint. Option B is not available unless the founder later accepts a credit rule that the sources do not state.
- Consequences:
  - A. Renewal and cancellation can ship without a credit ledger. A family that moves mid-period may pay for two classes until the first period ends.
  - B. Needs a credit formula the sources do not provide.
  - C. Avoids credits and avoids a double charge. It still needs a boundary and a seat rule the sources do not state.
- Engineering blocked without a decision: No for #2. Yes for any switch behavior in #11. #11 must not implement credits while this gap is open.

## FD-07. Schedule changes and dissenting subscribers

- Classification: Product gap.
- Source: Classes have schedules, and the catalogue shows them before payment. No reviewed finding states how a later schedule change treats a subscriber who cannot attend.
- Options:
  - A. Sessions inside an already paid period stay on the purchased schedule. A new schedule applies to later periods. A subscriber who does not accept cancels at the end of the paid period. There is no mid-period refund or credit.
  - B. A material schedule change gives a dissenting subscriber an immediate refund or credit.
  - C. After the first payment, the schedule is immutable. The teacher closes the class and creates a new one.
- Recommendation: none. Option B would invent a refund or credit formula.
- Consequences:
  - A. The paid period keeps the sessions that were purchased. Dissent uses the existing end-of-period cancellation rule.
  - B. Needs a money rule the sources do not state.
  - C. A timetable correction requires a new class and a new purchase.
- Engineering blocked without a decision: No for #2. Yes for #7 and #12.

## FD-08. Holidays and other non-session dates

- Classification: Product gap.
- Source: Issue #7 requires holiday terms. No reviewed finding says whether a skipped session changes the price or the period end.
- Options:
  - A. Teacher-declared non-session dates skip those sessions. The monthly price and the billing period stay the same.
  - B. Declared holidays extend the paid period.
  - C. Declared holidays create a credit or a price reduction.
- Recommendation: none. Options B and C invent an extension or credit rule.
- Consequences:
  - A. The term calendar is visible before payment. Billing stays on the monthly anchor.
  - B. Entitlement end dates move, and renewal math needs an extension rule.
  - C. Invents a credit.
- Engineering blocked without a decision: No for #2. Yes for #7 and #11.

## FD-09. Failed-payment grace

- Classification: Source-backed rule for the grace behavior below. One related anchor question remains a product gap. This is not an unsupported recommendation, and it is not Accepted until the founder accepts the baseline.
- Source: The business plan supports keeping the stated three-day grace period. Issue #11 states the same period. Preserve all of the following:
  - three days of provisional access after a failed payment
  - unpaid retries do not count as collected earnings
  - retries must be idempotent
  - cancellation must safely stop future renewal and retry behavior
- Not part of this source-backed rule: the billing anchor after a successful recovery, and the price of a subscription that starts only after grace is exhausted. Issue #11 asks for post-failure anchors to be defined. The reviewed findings do not define them. Do not invent that anchor here.
- Options for the remaining anchor gap only:
  - A. A successful retry during the three days continues the same subscription and the same anchor.
  - B. The founder defines a different post-failure anchor before #11 implements recovery.
- Recommendation for the grace rules: keep the four source-backed rules above. Do not replace them with a different grace length.
- Founder disposition for the anchor gap: deferred to Issue #11. Issue #3 must store neutral timing fields and must not encode a post-recovery anchor algorithm.
- Consequences:
  - Keeping the four rules gives #11 a concrete access clock, keeps failed attempts out of earnings, and makes cancellation win over a later retry.
  - Leaving the anchor undefined means #11 must not guess when the next period starts after a successful retry or after grace ends.
  - Dropping the three-day period would contradict the business plan and Issue #11.
- Engineering blocked without a decision: No for #2. The four grace rules are not an open length choice. The anchor gap blocks #11's recovery scheduling until the founder defines it. #11 must not implement a different grace length.

## FD-10. Student authentication factors

- Classification: Accepted.
- Accepted on: 2026-10-09 by Ali.
- Source tension:
  - The fuller handoff requires two-factor authentication for Student, Teacher, and Admin.
  - The lean business plan recommends risk-based student verification, while Teacher and Admin two-factor authentication stays mandatory.
- What both sources support: Teacher and Admin two-factor authentication is mandatory, with safe recovery. That part is not the conflict.
- Options:
  - A. Follow the fuller handoff. Students must use a second factor, as teachers and administrators do.
  - B. Follow the lean business plan. Student verification is risk-based. Do not require a second factor for every student. Teachers and administrators still must use a second factor.
- Accepted MVP position:
  - Learners: a second factor is optional for the MVP.
  - The architecture stays ready for a later risk-based or step-up check. This proposal does not define a risk score.
  - Teachers and administrators: a second factor stays mandatory for privileged access. Both sources already agree on that part.
  - This follows option B for learners and does not adopt option A.
- Accepted option: follow option B for learners. Teacher and administrator privileged access still requires a second factor.
- Consequences:
  - A. One authentication policy for every role. Younger students need a recovery path that does not weaken the guardian link.
  - B. Less setup for students. The meaning of "risk-based" still has to be specified before any later step-up rule is built. This proposal does not invent that score.
- Engineering blocked without a decision: No for #2 or #5 on this decision. The merged Issue #5 code matches the accepted rule: teacher and administrator privileged operations require a second factor; learner access does not require one globally. Instance-wide Clerk "Require multi-factor authentication" must stay off because that toggle would force every learner.

## FD-11. Device and session restrictions

- Classification: Accepted.
- Accepted on: 2026-10-09 by Ali.
- Source tension:
  - The full product direction includes device and session restriction concepts.
  - The lean business plan recommends deferring a full device-management console.
- These are different decisions. This log does not set a numeric device cap and does not drop the restriction concept.
- Session control already stated by Issue #5: sessions can be revoked, and sensitive account changes are logged without secrets. That requirement stays. It is not a device-management console.
- What is not stated: a numeric device cap, and whether a restriction is enforced at launch or only the console is deferred. Do not invent a cap.
- Options:
  - A. Enforce a device or session restriction at launch, and defer the full device-management console. The founder must name the restriction. This log does not name one.
  - B. Defer both the restriction and the console. Keep session revocation from Issue #5.
  - C. Build a full device-management console at launch.
- Accepted MVP position:
  - No fixed numeric device cap. Do not invent a limit such as two devices.
  - Keep session listing and remote revocation of the caller's own sessions.
  - Do not build a device-management console for the MVP.
  - Suspicious-session or device controls may be added later from evidence. This proposal does not define them.
  - This follows option B. Social login stays a separate unset release cut. This entry does not decide it.
- Accepted option: follow option B for the MVP. This does not turn "no cap" into a permanent product rule.
- Consequences:
  - A. The product direction's restriction concept is honored. The console can wait. #5 cannot implement the restriction until the founder names it.
  - B. Shared devices keep working. The full product direction's restriction concept is postponed, not deleted.
  - C. Adds a management UI the lean plan says to defer.
- Engineering blocked without a decision: No for #2 or #5 on this decision. The merged Issue #5 code lists and revokes the caller's own sessions and does not enforce a device cap. A numeric cap or a device console stays unimplemented for the MVP.

## FD-12. Recordings in the paid pilot

- Classification: Source-backed direction, with consent and retention still requiring founder approval.
- Source:
  - The paid pilot can use external live links.
  - Recording automation is deferred.
  - Optional recordings may exist if they are explicitly disclosed before purchase.
  - Recording consent and retention still need approval. See FD-13.
- Recommendation:
  - No recording automation in the initial paid pilot.
  - Optional manually supplied recordings only if founder-approved consent and retention rules are in place.
  - Otherwise recordings remain off.
- This is not a blanket statement that the paid pilot has no recordings.
- Consequences:
  - Following the recommendation keeps live classes on external links, avoids an automated recorder, and allows a teacher-supplied recording only after disclosure plus an accepted consent and retention rule.
  - Storing recordings before those rules exist would skip the approval the sources still require.
  - Building in-product recording automation would pull a deferred capability into the pilot.
- Engineering blocked without a decision: No for #2. Yes for storing any recording in #7 and #12. External meeting links do not wait on this entry. #12 must not build recording automation in the initial pilot.

## FD-13. Recording retention

- Classification: Source-backed recommendation requiring founder approval.
- Source: The business plan proposes a stated rolling retention limit, for example 90 days per recording. The reason to prefer a rolling per-recording limit is that "class end plus three months" can run without a finish date when a class never formally ends. No original product document reviewed here establishes a mandatory duration.
- Options:
  - A. Each recording is kept for 90 days from that recording, then deleted. This is the business-plan example.
  - B. Keep recordings until the class ends, plus a further period. This can become indefinite if the class never ends.
  - C. The founder names a different rolling per-recording limit.
- Recommendation: A, as a proposal. It is not a mandatory value and it is not Accepted.
- Consequences:
  - A. Retention has a finish date even when the class stays open. Late learners can receive a recording only while it is still inside that window and they are entitled.
  - B. An open-ended class can retain recordings without a real end.
  - C. Same shape as A with a duration the founder sets. Engineering must not invent that duration.
- Engineering blocked without a decision: No for #2. Yes for #12 when recordings are stored. If FD-12 leaves recordings off, no retention clock is required.

## FD-14. Late enrolment

- Classification: Source-backed rule. Not a free-form recommendation. Not Accepted until the founder accepts the baseline.
- Source, from the product specification and the business plan:
  - A class may remain open after it has started, while capacity remains.
  - A late learner receives previous lessons, resources, and recordings where those exist.
  - The subscription stays monthly.
  - There is no proration rule. Do not invent one.
  - Business-plan guidance supports full-price late enrolment, a clear rolling end date, and access to prior content.
- Recommendation: follow that source-backed behavior. Do not replace it with "wait for the next cohort" or with a prorated first period.
- Consequences:
  - A late learner pays the full monthly price, sees the rolling end date, and can open prior lessons and resources that exist. Recordings are included only where FD-12 and FD-13 actually make a recording available.
  - Closing enrolment at the first session would contradict the specification.
  - A prorated first charge would invent a formula the sources do not state.
- Engineering blocked without a decision: No for #2. Not an open pricing choice for #10. #10 follows this rule after the founder accepts the baseline, and must not add proration.

## FD-15. Seat hold and payment after the hold expires

- Classification: Product gap.
- Source: Issue #10 requires a capacity reservation with expiry, and a defined result when payment succeeds after expiry. No reviewed finding states the hold length or that result. Do not invent a duration.
- Options:
  - A. The founder sets a hold duration. If trusted payment succeeds and a seat remains, activate. If the seat is gone, do not activate. The founder must also say what happens to captured funds. This log does not set a duration or a refund formula.
  - B. The hold lasts until a payment webhook, with no expiry.
  - C. Payment after expiry never activates, and captured funds are left without a stated remedy.
- Recommendation: none.
- Consequences:
  - A. The last seat cannot be sold twice, once the founder names the hold and the money outcome.
  - B. An abandoned checkout can lock the last seat.
  - C. Avoids overselling and can leave captured money without an enrolment.
- Engineering blocked without a decision: No for #2. Yes for #10.

## FD-16. Reviews

- Classification: Source-backed constraints, plus a product gap for exact eligibility timing.
- Source supports only:
  - reviews tied to genuine enrolment or participation
  - no fake or seeded reviews
  - eligible public reviews may be staged or deferred until the service has repeatable renewal
- Exact eligibility timing is a founder decision. The sources reviewed here do not specify a session count or other clock. Do not invent one.
- Options for that timing gap:
  - A. Collect no public reviews until the founder later sets the timing, while still forbidding fake reviews and fake enrolment counts.
  - B. The founder names the participation threshold and whether a guardian may submit. Public display still waits until renewal is repeatable.
- Recommendation: keep the three source constraints. Do not invent the timing threshold.
- Consequences:
  - The catalogue cannot show seeded reviews or fake counts now.
  - Public review display can wait until renewal is repeatable, which matches the source.
  - #8 cannot ship a specific eligibility clock until the founder sets it.
- Engineering blocked without a decision: No for #2. The ban on fake reviews does not wait. The eligibility clock blocks #8 review submission rules.

## FD-17. Marketplace preview content

- Classification: Product gap.
- Source: Issue #7 and Issue #8 include previews on the public class page. Issue #12 mentions preview rules for resources. No reviewed finding defines which files are public.
- Options:
  - A. The public page may include teacher-written description and files the teacher explicitly marks as preview. Meeting links, submissions, verification documents, and recordings are never preview.
  - B. The public page is text, price, schedule, teacher, and terms only. No class file is public.
  - C. The product automatically publishes a sample of classroom files.
- Recommendation: none. Option C can publish a private file.
- Consequences:
  - A. Teachers can show a chosen sample. A mis-marked file becomes public, so the choice must be explicit.
  - B. Families see no class file before payment.
  - C. Risks publishing a private resource, a submission, or a meeting link.
- Engineering blocked without a decision: No for #2. Yes for #7, #8, and #12.

## FD-18. Launch curriculum catalogue

- Classification: Product gap.
- Source: Classes are filtered and verified by curriculum, subject, and level. The reviewed findings do not list the launch curricula, subjects, or levels. Do not invent that list.
- Options:
  - A. The founder supplies a closed list before teacher verification and class publishing treat a subject as real.
  - B. Teachers enter free-text subjects, and founders interpret them during review.
  - C. Engineering assumes a full national curriculum catalogue.
- Recommendation: none. Option C invents a catalogue.
- Consequences:
  - A. Verification scope and public filters use the same list.
  - B. Filters and "approved for this subject" can diverge.
  - C. Presents a curriculum decision that was not made.
- Engineering blocked without a decision: No for #2. Yes for #6 and #7.

## FD-19. Commission

- Classification: Source-backed recommendation requiring founder approval. The recommendation is a planning proposal, not a settled product rule.
- Source: The business plan proposes testing a 20% commission. It treats that figure as a planning and commercial proposal, not as an approved rate. Issue #1 says financial projections are not product rules. The backlog separates gross tuition, commission, and teacher payable, and it requires commission versions. It does not say whether the teacher-set price is the student gross price.
- What must not happen: 20% must not be copied into an ADR, into `PROJECT_MEMORY.md`, or into a ledger as the live rate.
- Options:
  - A. The founder may later approve a test in which the teacher sets the student price and a versioned commission is deducted. The business plan's 20% figure is the candidate test rate, not the approved rate.
  - B. The teacher sets a net amount, and commission is added on top.
  - C. A flat fee per subscription.
- Recommendation: do not adopt 20%, and do not adopt a gross-versus-net model, until the founder approves a commercial test. Record 20% only as the business plan's proposed test rate.
- Consequences:
  - Leaving it unresolved keeps checkout and teacher statements from showing an unapproved rate.
  - Approving a test later requires a versioned rate, teacher disclosure before publish, and no rewrite of commissions already stored on in-force subscriptions.
  - Writing 20% into the product now would turn a planning proposal into a rule.
- Engineering blocked without a decision: No for #2. The model and the rate block teacher disclosure and #13. Issue #3 may store a versioned rate field and must not fill in 20%.

## FD-20. Refund entitlement

- Classification: Product gap, except for the cancellation rule already in proposed ADR 0001.
- Source: Ordinary cancellation at the end of the paid period is a backlog rule and is not a refund. Issue #13 and Issue #14 implement authorized refunds as ledger events. A planning refund percentage must not be posted automatically. No reviewed finding states when a payer is entitled to money back. Do not invent a refund formula.
- Options:
  - A. Cancellation stops the next renewal only. The current paid period is not refunded automatically. Any earlier refund is a separate founder-approved ledger event with a reason. This option does not define the entitlement test.
  - B. The payer has a cooling-off refund for a number of days the founder sets.
  - C. Missed sessions automatically produce a pro-rata refund.
- Recommendation: none. The end-of-period cancellation rule stands as a source-backed backlog rule inside proposed ADR 0001. Options B and C need formulas the sources do not provide.
- Consequences:
  - Catalogue copy can describe cancellation at period end after ADR 0001 is accepted. It must not promise a broader refund.
  - #13 and #14 can record an authorized refund once the founder defines entitlement. They must not post a planning percentage.
- Engineering blocked without a decision: No for #2. Yes for customer refund promises in #13 and #14.

## FD-21. Legal funds-flow and payment provider

- Classification: Source-backed rule for the gates below. The seller model itself remains unresolved. This is not an approval of any provider or legal model.
- Source confirms:
  - no production provider route is approved
  - the ability to charge cards is not enough
  - marketplace collection and teacher payout need written provider confirmation
  - legal and accounting review is required before the first paid customer
  - live charges remain disabled
  - development uses a fake or sandbox provider until those gates are satisfied
- Also from the backlog: a database field must not imply a legal status. Prepaid or manual renewal must not silently replace recurring billing.
- Options for the still-open seller model, none of which is approved:
  - A. The platform is the merchant of record.
  - B. Each teacher is the seller, and the platform is an agent.
  - C. Leave both unapproved until Issue #4 records written provider answers and the legal and accounting review.
- Recommendation: C. Do not select A or B in this issue.
- Consequences:
  - C lets Issue #2 and Issue #9 build a provider-neutral adapter and idempotent handling against a fake provider. The paid pilot cannot start. No issue should hard-code a vendor or a seller role.
  - A or B would assert a legal model the sources say is not approved.
- Engineering blocked without a decision: No for the #2 fake payment adapter. Yes for live charges, real teacher payouts, and the paid-pilot gate in #4 and #16.

## FD-22. Verification-document retention

- Classification: Product gap.
- Source: Issue #6 requires a retention and deletion definition. No reviewed finding states a period. Do not invent one.
- Options:
  - A. Keep each document until an authorized founder deletes it. Deletion is audited. No automatic expiry until counsel sets one.
  - B. Delete on a schedule the founder and counsel set.
  - C. Delete documents as soon as the application is approved or rejected.
- Recommendation: none. Do not invent a multi-year clock.
- Consequences:
  - A. Private upload and audited deletion can ship without a pretended legal period.
  - B. Predictable deletion, once a real period exists.
  - C. A later review may have nothing left to explain the decision.
- Engineering blocked without a decision: No for #2. Yes for automatic deletion in #6. Private storage of the documents does not wait on a duration.

## FD-23. Public meaning of teacher verification

- Classification: Product gap for the exact sentence. Source-backed constraints still apply.
- Source: Issue #6 requires the public profile to explain what verification means, stores subjects and levels separately from a generic badge, and forbids guaranteed learning claims. The exact public sentence is not specified.
- Options:
  - A. The profile lists the approved subjects and levels and states that a founder reviewed the application. It does not claim government accreditation or a learning outcome.
  - B. Show a generic verified badge and no explanation.
  - C. Claim official or government certification.
- Recommendation: none beyond the constraints. Option B drops the explanation Issue #6 requires. Option C claims a status the sources do not establish.
- Consequences:
  - A. Families can see the scope of the review, if the founder adopts that sentence.
  - B. Invites a stronger assumption than the review performed.
  - C. Can be a false claim.
- Engineering blocked without a decision: No for #2. Yes for the public sentence in #6 and #8. The server-side block on unapproved selling does not wait on the sentence.

## FD-24. Commission rounding

- Classification: Accepted.
- Accepted rule: Compute the platform commission from the agreed percentage in integer minor units using deterministic half-up rounding to the nearest centime. Compute teacher payable as `gross_minor - platform_commission_minor`.
- Required invariant: `gross_minor = platform_commission_minor + teacher_payable_minor`.
- Consequences:
  - The rounding operation occurs once on the platform commission amount.
  - Any fractional remainder created by the percentage calculation is resolved by that deterministic rounding; teacher payable is always the exact balancing amount.
  - Worked examples must accompany the financial implementation and tests.
  - This decision defines rounding only. It does not accept any commission rate; FD-19 remains open.
- Engineering blocked: No for #3 rounding. #13 still depends on FD-19 for the commission model/rate.

## FD-25. Short-month billing anchor

- Classification: Accepted.
- Accepted rule: Preserve the subscription's original billing day. If a month does not contain that day, renew on the final calendar day of that month, then return to the original billing day in the next month that contains it.
- Example: a 31st-day anchor renews on 28/29 February and returns to the 31st in March.
- Consequences:
  - Persist the original anchor separately from each actual period boundary.
  - Statements and entitlement periods use the actual calculated dates.
  - UTC remains the storage standard; Africa/Casablanca remains the scheduling/display timezone.
  - This decision does not settle the post-failed-payment recovery anchor in FD-09.
- Engineering blocked: No for #3 and the ordinary monthly-anchor model.

## FD-26. Launch notification channels

- Classification: Product gap, plus one source-backed constraint.
- Source: Issue #15 requires essential payment, renewal, failure, cancellation, and session notices on approved launch channels. SMS and WhatsApp spending require an explicit channel choice. No reviewed finding names the launch channel. Do not assume email, SMS, or WhatsApp.
- Options:
  - A. The founder names one launch channel for required transactional notices. SMS and WhatsApp stay off unless that choice includes them.
  - B. Add SMS at launch.
  - C. Add WhatsApp at launch.
- Recommendation: none. The constraint is that SMS and WhatsApp are not launch channels until the founder chooses them.
- Consequences:
  - A required channel still has to be named before #15 can send renewal and failure notices.
  - Marketing mail stays separate from required notices, which Issue #15 already requires.
- Engineering blocked without a decision: No for #2. Yes for #15.

## Classification index

| ID | Classification | Blocks #2 |
| --- | --- | --- |
| FD-01 | Accepted. Arabic and French at launch. English architecture-ready and deferred. | No |
| FD-02 | Accepted. One account may be both learner and payer; explicit relationship when different people are involved. | No |
| FD-03 | Accepted. No hard-coded age; explicit guardian relationships; age enforcement deferred pending legal/product review | No |
| FD-04 | Product gap | No |
| FD-05 | Product gap | No |
| FD-06 | Source-backed constraint against invented credits, plus a product gap for any switch flow | No |
| FD-07 | Product gap | No |
| FD-08 | Product gap | No |
| FD-09 | Source-backed grace rules; anchor after recovery remains a product gap | No |
| FD-10 | Accepted. Learner MFA optional; teacher/admin privileged access requires MFA | No |
| FD-11 | Accepted. No numeric device cap; session listing/revocation only for MVP | No |
| FD-12 | Source-backed direction; consent and retention still need approval | No |
| FD-13 | Source-backed recommendation requiring founder approval | No |
| FD-14 | Source-backed rule | No |
| FD-15 | Product gap | No |
| FD-16 | Source-backed constraints; eligibility timing is a product gap | No |
| FD-17 | Product gap | No |
| FD-18 | Product gap | No |
| FD-19 | Source-backed planning proposal, not a settled rate | No |
| FD-20 | Product gap beyond end-of-period cancellation | No |
| FD-21 | Source-backed payment gates; seller model unresolved | No |
| FD-22 | Product gap | No |
| FD-23 | Product gap for the public sentence; explanation and no learning guarantee are source-backed constraints | No |
| FD-24 | Accepted. Half-up rounding of platform commission; teacher payable is the balancing amount. | No |
| FD-25 | Accepted. Preserve original day; clamp to month-end when absent and return later. | No |
| FD-26 | Product gap; SMS and WhatsApp are not assumed | No |

## Issue #2 disposition

Issue #2 is merged. ADR 0003 is Accepted and canonical for the application architecture. ADR 0001 and ADR 0002 remain Proposed. The accepted FD-02, FD-24, and FD-25 decisions are later product decisions and do not alter the Issue #2 architecture boundary.

## Issue #1 disposition

Issue #1 asked for one baseline that preserves the commercial rules and explicitly records anything still unresolved. It does not require every later-feature choice to be finalized.

Accepted decisions currently recorded:

- FD-01. Launch languages are Arabic and French. English is architecture-ready and deferred.
- FD-02. One account may be both learner and payer; when they are different people, the relationship is explicit.
- FD-24. Platform commission uses deterministic half-up rounding to minor units; teacher payable balances the gross amount.
- FD-25. Monthly billing preserves the original billing day, clamps to month-end when absent, then returns to the original day.

Recorded for later issues, not left silent:

- Source-backed rules and constraints for later implementation: FD-09 grace behavior, FD-14 late enrolment, FD-06 ban on invented credits, FD-12 recording direction, FD-16 review constraints, FD-21 payment gates.
- Still open, and blocking only the later issue named below.
- Legal and provider gates in FD-21. They block live charges, not this issue and not the Issue #2 fake adapter.

ADR 0001 and ADR 0002 stay Proposed until a separate founder approval. Their Proposed status does not reopen FD-01 and does not keep Issue #1 incomplete.

## Remaining decisions by later issue

| Later issue | Still open there | Gate |
| --- | --- | --- |
| #3 | No remaining founder decision blocks the neutral schema. FD-09 recovery anchor is explicitly deferred to #11. | Ready for schema design/implementation after review |
| #4, #16 | FD-21 seller model, written provider confirmation, legal and accounting review | Legal/provider gate. Live charges stay off. |
| #5 | FD-03, FD-10, and FD-11 are Accepted. Clerk development-instance configuration and the real-instance acceptance run are still open. | Product decisions resolved. FD-02/03/10/11 are accepted. |
| #6 | FD-18 curriculum list, FD-22 document lifetime, FD-23 public sentence | Product gap |
| #7 | FD-04 who may enrol after stop-renewal, FD-07 schedule changes, FD-12 before any recording is stored, FD-17 previews, FD-18 | Product gap, or approval before storing recordings |
| #8 | FD-16 review timing, FD-17 previews, FD-19 commission disclosure, FD-23 public sentence | Product gap or unapproved commercial proposal |
| #10 | FD-15 seat hold, FD-19 commission disclosure | Product gap. Late enrolment itself is the source-backed rule in FD-14. |
| #11 | FD-04, FD-05 reactivation consent, FD-06 switch flow, FD-08 holidays, FD-09 recovery anchor | Product gap. FD-25 is accepted for ordinary month anchors; the three-day grace rules are not an open length choice. |
| #12 | FD-07, FD-12 and FD-13 before storing a recording, FD-17 | Approval or product gap |
| #13 | FD-19 rate and model, FD-20 refund entitlement | Unapproved commercial proposal or product gap. FD-24 rounding is accepted. |
| #14 | FD-20 refund entitlement | Product gap |
| #15 | FD-26 launch channel | Product gap. SMS and WhatsApp are not assumed. |

## Suggested review order for later issues

1. FD-03, FD-10, and FD-11 are resolved for Issue #5. The merged authorization code matches those accepted positions.
2. Remaining money gaps before checkout copy and settlement: FD-15, FD-19, FD-20, FD-21, and the FD-09 recovery anchor. FD-24 and FD-25 are now Accepted.
4. Content and catalogue gaps when those issues start: FD-04, FD-05, FD-06, FD-07, FD-08, FD-12, FD-13, FD-16, FD-17, FD-18, FD-22, FD-23, FD-26.
