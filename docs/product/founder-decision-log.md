# Founder decision log

Issue #1. Status of this log: open for founder review. Nothing in this file is an accepted product rule until the founder accepts an option. Accepted rules live in [the MVP scope](mvp-scope.md) and in [accepted ADRs](../adr/README.md).

## How to use this log

Each entry has the decision topic, the source conflict or ambiguity, the available options, the recommended option, the consequence of each option, and whether engineering is blocked without the decision.

"Blocked" means an issue cannot honestly implement that behavior until the founder chooses. It does not mean the whole platform is blocked. Issue #2 is blocked only by the entries marked as blocking #2, plus founder acceptance of the two accepted ADRs. Later issues are blocked by the entries that name them.

## Source gap

These documents were requested as source material and were not in the repository at base commit `7e5e124`:

- Education Marketplace & Learning Platform — Product Specification V1
- Morocco Education Marketplace Business Plan
- Education Marketplace — Complete Project Handoff & Product Specification

Rules already written into GitHub issues #1–#16 are treated as the backlog. Where a backlog issue states a rule, it is either accepted in an ADR or repeated as an agreed rule in the MVP scope. Where the backlog assigns the choice to Issue #1, or states no rule, the choice is below. Business-plan projections are not copied in as product rules, because the backlog says financial projections are planning assumptions.

If the missing documents are added and disagree with an accepted ADR, stop and surface the conflict. Do not silently edit the ADR to match a new assumption.

## FD-01. Launch languages

- Source ambiguity: Issue #2 and Issue #8 require localization that can support Arabic (RTL), French, and English, and they assign the launch set to Issue #1. No issue states which of the three languages customers see at launch.
- Options:
  - A. Ship Arabic, French, and English at launch.
  - B. Ship Arabic and French at launch. Add English in a later release.
  - C. Ship one language at launch and add the others later.
- Recommended option: A.
- Consequences:
  - A. Issue #2 builds locale routing, Arabic RTL, and message catalogs for all three before the pilot. Catalogue and transactional copy must exist in all three. This is more launch copy, and it matches a Morocco marketplace used in Arabic, French, and English.
  - B. Smaller copy set. English-speaking families wait. The infrastructure should still allow English so a later release does not redo routing.
  - C. Smallest copy set. It leaves out at least one language the backlog already treats as in scope for the product.
- Engineering blocked without a decision: Yes for #2. Issue #2's localization acceptance criterion depends on this choice.

## FD-02. Learner and payer/guardian relationship

- Source ambiguity: Issue #3 requires guardian-payer relationships. Issue #5 requires an explicit approved payer/guardian relationship and forbids access merely because an email or surname matches. Issue #10 requires checkout to show the payer and the learner. Issue #15 tracks unique learners and unique payers separately. None of these says whether one person may be both learner and payer.
- Options:
  - A. The learner account and the payer account are always two different people. A guardian pays and a linked learner receives access.
  - B. One account may be both learner and payer when that person is the contracting party. A separate guardian link is required when another person pays, or when the learner is not allowed to contract. See FD-03.
  - C. One household login covers payment and learning, with no separate learner identity.
- Recommended option: B.
- Consequences:
  - A. Adult students need a second account. Minor safety is easier to explain. Onboarding has more steps for every purchase.
  - B. Adults can subscribe for themselves. A child still needs an explicit linked guardian. Authorization uses that link. Metrics can still separate learners and payers. Checkout can show both roles even when one person holds both.
  - C. Unique-learner and unique-payer metrics collapse. Reviews, attendance, and entitlements become ambiguous inside the household.
- Engineering blocked without a decision: No for #2, if #2 keeps authentication as identity only. Yes for #3 and #5.

## FD-03. Minors and guardian onboarding

- Source ambiguity: The backlog requires a guardian relationship and does not state an age threshold, who creates the learner account, or who may accept paid terms.
- Options:
  - A. Any learner account may subscribe. The product does not ask about age.
  - B. Below an age set by the founder with legal review, the guardian creates or links the learner, accepts the terms, and is the payer. That learner cannot independently contract. At or above that age, FD-02 option B applies.
  - C. Every learner requires a guardian, at every age.
- Recommended option: B. Engineering should not invent the age. The founder should set it with counsel before #5 builds the gate.
- Consequences:
  - A. Fastest onboarding. It leaves minor contracting and parental authority unresolved in the product.
  - B. Matches a marketplace where families pay for children and adults may pay for themselves. The launch copy and the checkout block depend on the age the founder confirms.
  - C. Maximum guardian coverage. Adult students must onboard a second person before they can pay.
- Engineering blocked without a decision: No for #2. Yes for #5.

## FD-04. Stopping a class versus stopping renewal

- Source ambiguity: Issue #7 requires draft, published, closed-to-renewal, and ended states, and requires fulfilment of the latest outstanding paid period. Issue #11 requires teacher stop-renewal. Neither issue says whether "closed to renewal" also refuses new enrolments.
- Options:
  - A. Closed-to-renewal refuses new enrolments and refuses future renewals. Learners already inside a paid period keep that period, and the teacher still delivers it. Ended is the state after those obligations finish. Deletion must not destroy them.
  - B. Closed-to-renewal stops only automatic renewal. New students may still enrol until the class is ended.
  - C. Stopping a class cancels remaining sessions immediately and creates refunds for undelivered time.
- Recommended option: A.
- Consequences:
  - A. Teachers can stop taking students without abandoning people who already paid. No new proration rule is required. The teacher remains obliged to deliver the paid period.
  - B. A class can gain new subscribers after the teacher has decided to wind it down. Those new subscribers would then need their own full period.
  - C. Conflicts with Issue #7's requirement to fulfil the outstanding paid period, and it needs a refund rule that is not accepted. See FD-20.
- Engineering blocked without a decision: No for #2. Yes for #7 and #11.

## FD-05. Class reactivation and charging consent

- Source ambiguity: Issue #11 requires approved reactivation without unauthorized new charges. It does not say whether an old payment mandate resumes, or who must agree.
- Options:
  - A. Reopening a class never charges a person until that payer completes a new explicit payment consent. People still inside a paid period are not charged again for that period.
  - B. Reopening resumes the previous mandate automatically at the previous price.
  - C. Founder approval alone resumes charges, without a new payer consent.
- Recommended option: A.
- Consequences:
  - A. No surprise charges when a teacher republishes a class. A payer who wants to continue goes through checkout again. In-force price protection from ADR 0001 still applies only to subscriptions that never ended.
  - B. Faster for returning subscribers. A payer can be charged because a teacher reopened a class. That needs a clear prior authorization that the backlog does not state.
  - C. Puts a charge decision on the founder without the payer's fresh consent.
- Engineering blocked without a decision: No for #2. Yes for #11.

## FD-06. Same-teacher class switching and credits

- Source ambiguity: Issue #11 says class switching uses the Issue #1 policy and tells implementers not to invent proration or credits. No credit, proration, or switch rule exists in the backlog.
- Options:
  - A. No in-product switch and no credit. The payer cancels at the end of the paid period and may subscribe to another class separately. The two subscriptions can overlap, and both prices are payable.
  - B. A learner may switch to another class by the same teacher, and unused time becomes a credit on the new class.
  - C. A switch is allowed only at a period boundary, with no credit and no overlapping charge for the same period.
- Recommended option: A for the launch baseline.
- Consequences:
  - A. Issue #11 can ship renewal and cancellation without a credit ledger. Families who move mid-period may pay for two classes until the first period ends.
  - B. Needs a credit formula, expiry, teacher-payable adjustment, and refund interaction. None of those are defined. Implementing B would invent the policy Issue #11 forbids.
  - C. Avoids credits and avoids double payment. It needs a defined boundary and a rule for what happens to the old seat. It is a reasonable later addition if the founder wants switching without credits.
- Engineering blocked without a decision: No for #2. Yes for #11. Until a choice is accepted, #11 must not implement switching or credits.

## FD-07. Schedule changes and dissenting subscribers

- Source ambiguity: Classes have schedules, and the catalogue shows them before payment. No issue states whether a teacher may change the schedule after someone has paid, or what a subscriber who cannot attend the new time may do.
- Options:
  - A. Sessions inside an already paid period stay on the schedule that was purchased. A proposed schedule applies to later periods. A subscriber who does not accept sets cancellation at the end of the paid period. There is no mid-period refund or credit.
  - B. A material schedule change lets a dissenting subscriber take an immediate refund or credit for unused time.
  - C. After the first payment, the schedule is immutable. The teacher must close the class and create a new one.
- Recommended option: A.
- Consequences:
  - A. Buyers keep the sessions they paid for. Teachers can change future periods with notice. Dissent is handled by the cancellation rule already accepted in ADR 0001. No proration is created.
  - B. Fairer for a family whose timetable breaks immediately. It requires the refund or credit policy in FD-06 and FD-20, which is not accepted.
  - C. Simplest money rule. Teachers cannot correct a timetable without ending the offer and sending current subscribers through a new purchase.
- Engineering blocked without a decision: No for #2. Yes for #7 and #12.

## FD-08. Holidays and other non-session dates

- Source ambiguity: Issue #7 requires holiday terms on a class. It does not say whether a skipped session extends the paid period, reduces the price, or leaves billing unchanged.
- Options:
  - A. Teacher-declared non-session dates skip those sessions. The monthly price and the billing period stay the same. Material access continues through the paid period.
  - B. Declared holidays extend the paid period by the skipped time.
  - C. Declared holidays create a credit or a price reduction.
- Recommended option: A.
- Consequences:
  - A. Teachers can publish a term calendar. Billing stays on the rolling monthly anchor. Families need to see the calendar before they pay.
  - B. The entitlement end date moves. Renewal, grace, and teacher payable periods all need an extension rule.
  - C. Invents a credit. Same blocker as FD-06 option B.
- Engineering blocked without a decision: No for #2. Yes for #7 and #11.

## FD-09. Failed-payment grace

- Source ambiguity: Issue #1 lists failed-payment grace as something to resolve. Issue #11 says to keep a three-day grace period with provisional access, then suspend, and not to count unpaid retries as collected earnings. The original product documents are not in the repository, so the three-day figure cannot be checked against them. Retry count, the clock start, and the post-failure anchor are not fully stated.
- Options:
  - A. Accept the Issue #11 statement as the product rule. After a renewal fails at the end of a paid period, the subscriber has three calendar days of provisional classroom access. Successful trusted payment during those days continues the same subscription, the same agreed price, and the same monthly anchor, and pays the period that was due. Unpaid attempts are not earnings. When the three days end without trusted payment, access is suspended. A later purchase is a new subscription at the current listed price and a new anchor, unless FD-05 says otherwise for reactivation.
  - B. No grace. Access ends when the paid period ends if renewal has failed.
  - C. A grace length other than three days, with the same access and non-revenue rules as A.
- Recommended option: A.
- Consequences:
  - A. Issue #11 has a concrete clock. Teachers may still be delivering during the three days while the platform has not collected the renewal. Provisional access must be distinguishable from a fully paid period in support tools.
  - B. Simpler access rules. Families lose the classroom as soon as a renewal fails, including for a short provider outage.
  - C. Same operational shape as A with a different duration. The founder would need to name the duration.
- Engineering blocked without a decision: No for #2. Yes for #11.

## FD-10. Student authentication factors

- Source ambiguity: Issue #5 requires two-factor authentication and safe recovery for teachers and administrators. It assigns the student authentication policy to Issue #1. That teacher and administrator requirement is already an agreed rule in the MVP scope. This entry is only the student and payer question.
- Options:
  - A. Learner-only accounts are not required to use a second factor at launch. Session revocation still applies. A second factor may be offered as optional.
  - B. Every learner must use a second factor.
  - C. Payer and guardian accounts must use a second factor. Learner-only accounts follow option A.
- Recommended option: C.
- Consequences:
  - A. Least friction for students. A stolen learner password is limited by session revocation and by the learner's inability to pay, if FD-02 and FD-03 keep payment on the guardian.
  - B. Stronger learner-account protection. More recovery failures for younger students, and guardian recovery must be designed with it.
  - C. Protects the account that can pay and manage links. Learners can sign in with less setup. Recovery for the payer must be safe and must not bypass the guardian link.
- Engineering blocked without a decision: No for #2. Yes for #5. Teacher and administrator two-factor authentication can proceed from the agreed rule.

## FD-11. Device limits and social login

- Source ambiguity: Issue #5 requires session revocation and says to defer social login and advanced device UI only if Issue #1 approves that cut. No device cap is stated.
- Options:
  - A. No concurrent-device cap at launch. Users can revoke sessions. Social login and a device-management UI are deferred.
  - B. One active device per learner account.
  - C. Social login is part of launch, with or without a device cap.
- Recommended option: A.
- Consequences:
  - A. Issue #5 ships registration, sign-in, recovery, and revocation without a device-binding product. Shared family devices keep working.
  - B. Reduces password sharing. It punishes legitimate study on a phone and a laptop, and it needs a recovery path when a device is lost.
  - C. Adds an identity-provider dependency at launch. Issue #5 currently says not to implement a custom protocol, and social login is an extra product choice.
- Engineering blocked without a decision: No for #2. Yes for #5.

## FD-12. Recording consent

- Source ambiguity: Issue #7 puts a recording policy on the class. Issue #12 says recordings are optional, and that if they are offered the product must enforce consent, retention, and access. It does not say who consents, or whether one refusal stops the recording for everyone.
- Options:
  - A. Launch classes are not recorded by Taalim. Teachers may still use an external meeting tool. The product does not store recordings until a later decision.
  - B. A class may be recorded only if the teacher selects that policy. Enrolment requires consent from the payer and, when the learner has an account, from the learner. A minor's guardian must consent. Refusal means that person does not enrol. It does not silently record them.
  - C. The class is recorded, and a participant may opt out of appearing while the recording still exists for others.
- Recommended option: A for the paid pilot. Option B is the rule to accept if the founder wants recordings in the pilot.
- Consequences:
  - A. Removes a minor-consent and retention risk from the first paid launch. Issue #12 can ship resources, sessions, and attendance without a recording pipeline. External meeting tools may still record on their own; the product copy should not promise that those tools are unrecorded.
  - B. Teachers can offer recordings as part of the paid class. Checkout and guardian consent become part of enrolment. FD-13 must be accepted at the same time.
  - C. High privacy risk. A person can be in a room that is recorded after refusing. This is a poor fit for minors.
- Engineering blocked without a decision: No for #2. Yes for #7's recording-policy behavior and for #12. Until a choice is accepted, the product must not store recordings.

## FD-13. Recording retention

- Source ambiguity: Issue #12 requires an approved retention policy and does not state a duration. This matters only if FD-12 option B is accepted.
- Options:
  - A. A recording is available to entitled participants of that class and is deleted within 30 days after that learner's entitlement ends.
  - B. Recordings are kept until the class ends, then deleted within 30 days.
  - C. Recordings are kept for the life of the teacher account.
- Recommended option: A, if recordings are in scope. If FD-12 option A is accepted, no retention clock is required for launch.
- Consequences:
  - A. Access matches payment. A former student does not keep the archive after entitlement ends. Teachers need to understand that the archive is not permanent.
  - B. Every entitled student in the class shares the same archive lifetime, including students who left earlier.
  - C. Longest operational burden and the largest privacy surface, including after a learner or teacher leaves.
- Engineering blocked without a decision: No for #2. Yes for #12 if recordings are stored. No for #12 if FD-12 option A is accepted.

## FD-14. Late enrolment

- Source ambiguity: The backlog allows enrolment up to a maximum capacity and uses a per-subscription monthly anchor. It does not say whether a student who joins after sessions have started pays a full month, waits, or pays a prorated amount.
- Options:
  - A. A student may enrol while a seat remains. The first charge is a full month at the current listed price. That subscription gets its own anchor from the trusted payment time. Access covers future sessions and current entitled materials. Sessions already held are not credited.
  - B. New students may join only at a published period boundary.
  - C. The first period is prorated by remaining sessions.
- Recommended option: A.
- Consequences:
  - A. Works with rolling monthly anchors and with no proration rule. A late joiner may pay a full month and attend fewer sessions in that first period. The catalogue must show the schedule before payment.
  - B. Fairer session counts. Teachers must operate fixed cohort dates, which the backlog does not require.
  - C. Needs a proration formula. That formula is not accepted.
- Engineering blocked without a decision: No for #2. Yes for #10.

## FD-15. Seat hold and payment after the hold expires

- Source ambiguity: Issue #10 requires a transactional capacity reservation with expiry, and a defined outcome when a payment succeeds after that expiry. It does not state the hold length or the outcome.
- Options:
  - A. The seat hold lasts 15 minutes. If trusted payment succeeds and a seat is still available, activate the subscription. If trusted payment succeeds and the seat is gone, do not activate entitlement. Refund that capture through the refund path so the payer is not charged for a class they did not join.
  - B. The hold lasts until a payment webhook arrives, with no expiry.
  - C. Payment after expiry never activates, and the refund outcome is left unspecified.
- Recommended option: A.
- Consequences:
  - A. Two buyers cannot take the last seat. A slow successful payment can produce a refund even though the provider captured funds. The refund is a failed-enrolment remedy, not a general customer refund policy.
  - B. An abandoned checkout can lock the last seat indefinitely.
  - C. Avoids overselling and can leave captured money without an enrolment and without a stated remedy.
- Engineering blocked without a decision: No for #2. Yes for #10.

## FD-16. Review eligibility

- Source ambiguity: Issue #8 forbids fabricated reviews, seeded reviews, fake enrolment counts, and unsupported quality claims. It says public review display waits for verified eligibility. It does not define who is eligible.
- Options:
  - A. No public reviews at launch.
  - B. One review per learner per class, submitted by that learner or a linked guardian, only after the teacher has marked at least one attended session on that subscription. Public pages show only reviews that meet this rule. No seeded reviews.
  - C. Any registered account may review a class.
- Recommended option: B.
- Consequences:
  - A. Removes moderation scope from the pilot. The catalogue has no social proof until a later release.
  - B. Ties a review to a real paid attendance event. Volume will be low at the start. Moderation and abuse handling still belong with founder support.
  - C. Allows reviews from people who never attended. That conflicts with the backlog's ban on fabricated social proof.
- Engineering blocked without a decision: No for #2. Yes for #8 review display. The ban on fake counts and fake quality claims is already agreed and does not wait on this entry.

## FD-17. Marketplace preview content

- Source ambiguity: Issue #7 and Issue #8 include previews on the public class page. Issue #12 mentions preview rules when authorizing resources. No issue defines which files or text are public.
- Options:
  - A. The public page may include teacher-written description and files the teacher explicitly marks as preview. All other class files require entitlement. Meeting links, submissions, verification documents, and recordings are never preview.
  - B. The public page is text, price, schedule, teacher, and terms only. No class file is public.
  - C. The product automatically publishes a sample of classroom files.
- Recommended option: A.
- Consequences:
  - A. Teachers can show a sample before payment. A mis-marked file becomes public, so the publish flow must make the preview choice explicit.
  - B. Smallest privacy risk. Families see less of the teaching material before they pay.
  - C. Risks publishing a private resource, a submission, or a meeting link.
- Engineering blocked without a decision: No for #2. Yes for #7, #8, and #12.

## FD-18. Launch curriculum catalogue

- Source ambiguity: Classes are filtered and verified by curriculum, subject, and level. The backlog does not list the curricula, subjects, or levels that exist at launch. Inventing "the full Moroccan national curriculum" would be a new product rule.
- Options:
  - A. The founder supplies a closed list of curricula, subjects, and levels before teacher verification and class publishing are built. Teachers may apply and publish only inside that list.
  - B. Teachers enter free-text subjects, and founders interpret them during review.
  - C. Engineering assumes a full national curriculum catalogue.
- Recommended option: A.
- Consequences:
  - A. Verification scope and catalogue filters mean the same thing. The founder has to write the list. The list can start small.
  - B. Flexible for unusual courses. Public filters and "approved for this subject" become inconsistent.
  - C. Looks complete and is likely wrong. It also pretends a curriculum decision was already made.
- Engineering blocked without a decision: No for #2. Yes for #6 and #7.

## FD-19. Commission model and rate

- Source ambiguity: The backlog separates gross tuition, platform commission, and teacher payable, and it says to preserve commission versions. It never states the percentage or whether the teacher-set price is the student price or the teacher's net. Business-plan percentages are planning assumptions, not a rate approval.
- Options:
  - A. The teacher sets the monthly price the student pays. A versioned platform commission is deducted from that amount. The rate is chosen by the founder, stored as a version, and shown to the teacher before publish. This entry does not name a percentage.
  - B. The teacher sets a net amount, and the platform adds commission on top as the student price.
  - C. A flat fee per subscription, instead of a percentage.
- Recommended option: A. The founder still has to name the numeric rate before teacher statements and checkout disclosures are finalized.
- Consequences:
  - A. The catalogue "total monthly price" is the teacher-set price. Teachers see the commission version that applies to new subscriptions. Changing the rate later does not rewrite commissions already versioned on in-force subscriptions.
  - B. The student price is higher than the number the teacher entered. Catalogue copy must show the gross price, or families will not see what they pay.
  - C. Simple at low prices and heavy at low prices. It needs a fee amount the founder has not set.
- Engineering blocked without a decision: No for #2. The model choice blocks #8, #10, and #13. The numeric rate blocks teacher disclosure and #13. Issue #3 can store a versioned rate before the number is chosen, and should not invent the number.

## FD-20. Refund entitlement

- Source ambiguity: Issue #13 and Issue #14 implement authorized partial and full refunds as ledger events. A planning refund percentage must not be posted automatically. The backlog does not say when a payer is entitled to a refund. Ordinary cancellation at period end is already accepted and is not a refund.
- Options:
  - A. Cancellation stops the next renewal only. The current paid period is not refunded automatically. A founder may approve a full or partial refund when the paid period is not delivered. Every approved refund records a reason.
  - B. The payer has a cooling-off refund for a stated number of days after first payment.
  - C. Missed sessions automatically produce a pro-rata refund.
- Recommended option: A.
- Consequences:
  - A. Matches end-of-period cancellation and the ban on invented proration. Founders can still remedy a teacher who does not deliver. Support needs a second approver for exceptional money movement, which Issue #14 already requires.
  - B. Clear consumer promise. It needs a duration, a clawback rule against the teacher payable, and provider refund support from Issue #4.
  - C. Needs a session-count formula and a settlement rule. Those are not accepted.
- Engineering blocked without a decision: No for #2. Yes for #13 and #14 customer remedies. Issue #8 may describe the accepted cancellation rule before this entry is closed. It should not promise a broader refund.

## FD-21. Legal funds-flow and payment provider

- Source ambiguity: Issue #4 requires written answers on recurring mandates, collection for independent teachers, seller onboarding, refunds, payouts, settlement delay, reserves, and fees, plus legal review of seller, agent, and invoicing roles. No provider and no legal model is approved. A database field must not imply a legal status. Prepaid or manual renewal must not silently replace recurring billing.
- Options:
  - A. The platform is the merchant of record.
  - B. Each teacher is the seller, and the platform is an agent.
  - C. Leave both the provider and the legal model unapproved. Development continues on the fake adapter. Live charges stay off until Issue #4 records provider capability and the required legal review.
- Recommended option: C.
- Consequences:
  - A. One merchant account and one customer receipt. It may be unavailable for this marketplace model, and it is not something this issue can approve.
  - B. Teacher onboarding and payout map more directly to independent teachers. It depends on provider and counsel, which are not done.
  - C. Issue #2 and Issue #9 can build a provider-neutral adapter and idempotent event handling against a fake provider. The paid pilot cannot start. No issue should hard-code a vendor or a seller role.
- Engineering blocked without a decision: No for the #2 fake payment adapter. Yes for live charges, real teacher payouts, and the paid-pilot gate in #4 and #16.

## FD-22. Verification-document retention

- Source ambiguity: Issue #6 requires a retention and deletion definition for identity and qualification documents. It does not state a period. Documents are private founder-review material.
- Options:
  - A. Keep each document until an authorized founder deletes it. Deletion is audited. There is no automatic expiry clock until counsel sets one.
  - B. Delete rejected documents after a stated number of days, and keep approved documents for the life of the teacher account plus a stated number of years.
  - C. Delete documents as soon as the application is approved or rejected.
- Recommended option: A until counsel sets a period. Do not invent a multi-year clock in engineering.
- Consequences:
  - A. Issue #6 can ship private upload, review, and audited deletion. Documents can remain longer than a future legal minimum or maximum until counsel decides.
  - B. Predictable deletion. The numbers need a legal source the repository does not contain.
  - C. Smallest store of sensitive files. The founder may be unable to explain a later approval, and a correction request may have nothing to correct.
- Engineering blocked without a decision: No for #2. Yes for #6's deletion behavior.

## FD-23. Public meaning of teacher verification

- Source ambiguity: Issue #6 says the public profile must explain what verification means, and that approved subjects and levels are stored separately from a generic badge. It also says not to make guaranteed learning claims. The exact public sentence is not specified.
- Options:
  - A. The public profile lists the approved subjects and levels and states that a founder reviewed the application. It does not claim government accreditation, employment, or a learning outcome.
  - B. Show a generic verified badge and no explanation.
  - C. Claim that the teacher is officially certified or government-approved.
- Recommended option: A.
- Consequences:
  - A. Matches the scoped approval model. Families can see what was reviewed. The founder must be able to support that sentence with the actual review.
  - B. Invites people to assume a stronger check than the product performed. Issue #6 asks for an explanation.
  - C. Requires evidence and authority the backlog does not provide. It is a false claim if that evidence is absent.
- Engineering blocked without a decision: No for #2. Yes for #6 and #8 public copy.

## FD-24. Commission rounding

- Source ambiguity: Issue #3 requires documented rounding rules for MAD minor units. It does not say who receives a remainder centime when a percentage split does not land on an integer.
- Options:
  - A. Compute the platform commission in minor units and give any remainder centime to the platform. Publish worked examples in Issue #3.
  - B. Give the remainder centime to the teacher.
  - C. Use banker's rounding and a written tie-break.
- Recommended option: A.
- Consequences:
  - A. Teacher payable plus commission equals gross tuition in minor units. The platform keeps the dust centime. Examples must be tested.
  - B. Same conservation of minor units, with the dust centime on the teacher payable.
  - C. Harder to explain on a teacher statement, and still needs a tie-break when the split is not even.
- Engineering blocked without a decision: No for #2. Yes for #3 money splits and for #13.

## FD-25. Short-month billing anchor

- Source ambiguity: Billing is rolling monthly. Issue #3 requires month-end anchors, short months, and Africa/Casablanca timezone changes to be specified. It does not choose the short-month rule. UTC storage and Africa/Casablanca display are already agreed in the MVP scope.
- Options:
  - A. The anchor keeps its original day of month. In a month that lacks that day, the renewal falls on the last day of that month, then returns to the original day when it exists.
  - B. If the anchor day does not exist, the renewal moves to the first day of the next month and the anchor changes permanently.
  - C. Every subscription renews on calendar month-end.
- Recommended option: A.
- Consequences:
  - A. A subscriber who starts on the 31st is billed on the 30th or 28th in short months and on the 31st again afterward. Period length varies by a few days. Statements need to show the actual period dates.
  - B. January 31 subscribers become February 1 subscribers forever. The purchased "monthly" date drifts.
  - C. Abandons per-subscription rolling anchors and bunches renewals on one day. It conflicts with the rolling-monthly rule unless the founder wants to replace that rule.
- Engineering blocked without a decision: No for #2. Yes for #3 and #11.

## FD-26. Launch notification channels

- Source ambiguity: Issue #15 requires essential payment, renewal, failure, cancellation, and session notices on approved launch channels. It says SMS and WhatsApp spending need an explicit channel choice. It does not name the launch channel.
- Options:
  - A. Email is the only launch channel for required transactional notices. SMS and WhatsApp wait for a later channel decision.
  - B. Email plus SMS at launch.
  - C. Email plus WhatsApp at launch.
- Recommended option: A.
- Consequences:
  - A. One channel to template, deliver, and retry. Families who do not read email can miss a renewal warning. Marketing mail stays separate from these required notices, which Issue #15 already requires.
  - B. Better delivery for some families. It adds a provider, consent, and a cost before the pilot has proved the core journey.
  - C. Same as B, with a different provider and a different consent model.
- Engineering blocked without a decision: No for #2. Yes for #15.

## What blocks Issue #2

Issue #2 stays blocked until:

1. The founder accepts [ADR 0001](../adr/0001-mvp-subscription-and-supply-rules.md) and [ADR 0002](../adr/0002-paid-access-and-private-content.md), or sends corrections.
2. The founder decides FD-01, because Issue #2's localization criterion depends on the launch language set.

The other entries block the issues named on each entry. They do not, by themselves, block the application scaffold, the fake payment adapter, or the provider-neutral storage boundary.

## Suggested review order

1. FD-01, so Issue #2 can be unblocked after ADR review.
2. FD-02, FD-03, FD-10, and FD-11, so authentication and guardian work has a model.
3. FD-04, FD-05, FD-06, FD-07, FD-08, FD-09, and FD-25, so class and subscription state machines have one meaning.
4. FD-14, FD-15, FD-19, FD-20, FD-21, and FD-24, so money movement is not guessed.
5. FD-12, FD-13, FD-16, FD-17, FD-18, FD-22, FD-23, and FD-26, so content, verification, reviews, and notices match the pilot.
