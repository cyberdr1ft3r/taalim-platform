# Core data model preflight for Issue #3

Status: design review only; no migration in this branch.

## Founder decisions now available

- FD-02 Accepted: one account may be both learner and payer. When payer/guardian and learner are different people, Taalim stores an explicit relationship.
- FD-24 Accepted: platform commission is rounded half-up to the nearest minor unit; teacher payable is the exact balancing amount.
- FD-25 Accepted: preserve the original billing day, clamp to month-end when absent, then return to the original day.
- FD-09 recovery anchor: explicitly deferred to Issue #11. The schema stores neutral timing fields and no recovery-anchor algorithm.

## Proposed entity map

### Identity

```text
UserAccount
  id
  clerkSubject UNIQUE
  createdAt
  updatedAt

RoleAssignment
  id
  userId -> UserAccount
  role
  UNIQUE(userId, role)

GuardianLearnerRelationship
  id
  guardianOrPayerUserId -> UserAccount
  learnerUserId -> UserAccount
  relationshipType
  status
  createdAt
  updatedAt
  UNIQUE(guardianOrPayerUserId, learnerUserId, relationshipType)
```

A user can hold both learner and payer roles. A relationship row is only needed when two different users are involved.

### Teacher verification

```text
TeacherProfile
  id
  userId -> UserAccount UNIQUE

TeacherVerificationCase
  id
  teacherProfileId
  status
  reviewedByUserId?
  reviewedAt?
  createdAt
  updatedAt

TeacherApprovalScope
  id
  teacherProfileId
  subjectId
  educationLevelId
  status
  approvedAt?
  UNIQUE(teacherProfileId, subjectId, educationLevelId)
```

Verification files reference StoredObject records and remain private.

### Curriculum

```text
Curriculum
EducationLevel
Subject
SubjectLevel
```

The exact launch catalog is seed/config data, not a schema invariant.

### Classes and sessions

```text
ClassOffering
  id
  teacherProfileId
  subjectId
  educationLevelId
  lifecycleState
  capacity?
  currentPriceVersionId?
  createdAt
  updatedAt

ClassPriceVersion
  id
  classId
  amountMinor
  currency = MAD
  effectiveFrom
  effectiveTo?

ClassSession
  id
  classId
  startsAtUtc
  endsAtUtc
  timezone = Africa/Casablanca
  status
```

Price history is immutable once referenced by a subscription.

### Stored objects

```text
StoredObject
  id
  provider
  storageKey
  originalFilename
  mimeType
  sizeBytes
  checksum?
  createdByUserId?
  createdAt
  updatedAt
  deletedAt?
  retentionUntil?
  status
  UNIQUE(provider, storageKey)
```

No durable provider URL or absolute filesystem path is stored as identity.

### Subscription, enrolment and entitlement

```text
Subscription
  id
  payerUserId
  classId
  state
  originalBillingDay
  currentPeriodStartAt
  currentPeriodEndAt
  cancelAtPeriodEnd
  createdAt
  updatedAt

Enrollment
  id
  subscriptionId
  learnerUserId
  classId
  state
  UNIQUE(subscriptionId, learnerUserId)

Entitlement
  id
  enrollmentId
  startsAt
  endsAt
  state
```

The subscription belongs to the payer. Enrollment identifies the learner receiving the class. Entitlement grants access for a concrete period.

### Payment and financial records

```text
PaymentAttempt
  id
  subscriptionId
  provider
  providerAttemptId?
  amountMinor
  currency
  state
  idempotencyKey UNIQUE
  createdAt
  updatedAt

PaymentEvent
  id
  paymentAttemptId?
  provider
  providerEventId
  normalizedType
  receivedAt
  payloadHash?
  UNIQUE(provider, providerEventId)

FinancialEvent
  id
  eventType
  sourceType
  sourceId
  grossMinor
  platformCommissionMinor?
  teacherPayableMinor?
  currency
  createdAt

RefundRecord
PayoutRecord
```

Provider settlement, platform revenue, teacher payable and cash movement remain distinct facts.

## Money rules

- Currency for launch records is MAD.
- Persist integer minor units.
- For a commission split:
  - calculate raw commission from the accepted percentage;
  - round platform commission half-up to the nearest minor unit;
  - teacher payable = gross - rounded commission.
- Invariant: `grossMinor = platformCommissionMinor + teacherPayableMinor`.
- FD-19 still controls the actual commission model/rate.

## Billing anchor rules

Persist:
- original billing day;
- actual period start/end timestamps.

Ordinary monthly renewal:
- use the original billing day;
- if absent in the next month, use that month's final day;
- return to the original day when it exists again.

Do not encode post-failure recovery-anchor behavior; Issue #11 owns that rule.

## State machine drafts

### Class

```text
draft -> published
published -> closed_to_renewal
closed_to_renewal -> ended
published -> ended   (only if later product rules allow the required obligations)
```

Do not add reactivation behavior until FD-04/FD-05-related rules are accepted.

### Payment attempt

```text
created -> pending
pending -> succeeded
pending -> failed
pending -> cancelled
failed -> pending     (retry, same logical obligation, idempotent)
```

Trusted provider/server events drive transitions. Browser redirects do not.

### Subscription

```text
pending -> active
active -> grace
grace -> active       (recovery; next-anchor rule deferred to #11)
active -> cancel_scheduled
cancel_scheduled -> ended
grace -> ended
```

No transition may silently charge after cancellation.

### Entitlement

```text
pending -> active
active -> expired
active -> revoked     (admin/security path only, separately authorized)
```

Payment evidence and entitlement remain separate records.

### Refund

```text
requested -> approved -> processing -> succeeded
requested -> rejected
processing -> failed
```

Exact refund entitlement/formula remains controlled by FD-20.

### Payout

```text
pending -> approved -> processing -> paid
processing -> failed
pending -> held
held -> approved
```

Provider settlement confirmation and Taalim ledger state remain distinct.

## Required database invariants

Implementation PR should prove:

- Clerk subject uniqueness.
- Stored-object provider/key uniqueness.
- provider event uniqueness.
- idempotency-key uniqueness for payment attempts.
- foreign keys on all business relationships.
- one active commercial subscription for the same payer/class where the accepted product rule requires it.
- no duplicate entitlement creation from repeated payment events.
- no invalid financial split where component sums differ from gross.
- clean migration from empty PostgreSQL.
- synthetic seeds only.
- production/staging DB refusal remains active in tests.

## Shared interfaces for later issues

- #5 consumes UserAccount, RoleAssignment, GuardianLearnerRelationship.
- #6 consumes TeacherProfile, TeacherVerificationCase, TeacherApprovalScope, StoredObject.
- #7 consumes curriculum/class/session/price-version models.
- #9 consumes PaymentAttempt and PaymentEvent.
- #10 consumes Subscription, Enrollment, Entitlement and payment models.
- #11 consumes subscription timing and state.
- #12 consumes Enrollment, Entitlement and StoredObject.
- #13 consumes FinancialEvent, RefundRecord and PayoutRecord.

## Review questions before migration

1. Are the proposed cardinalities sufficient for adult self-pay and separate guardian/payer flows?
2. Should role assignment be normalized as rows or represented by another Taalim-owned permission structure?
3. Which state names should be Prisma enums versus application constants?
4. Which financial records must be append-only at the database layer versus enforced in services?
5. Which unique constraints should be partial PostgreSQL indexes rather than Prisma-level uniqueness?

After these are reviewed, Issue #3 can move to the implementation PR with additive migrations and PostgreSQL integration tests.
