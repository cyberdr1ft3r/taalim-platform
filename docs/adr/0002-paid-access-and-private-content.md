# 0002. Paid access and private-content semantics

- Status: Accepted
- Date: 2026-10-06
- Related issues: #1, #2, #3, #5, #6, #10, #12, #16

## Context

Classroom resources, learner submissions, teacher verification documents, and any recordings are sensitive. Issue #1 requires privacy, access, and retention semantics without choosing a storage vendor. Issue #2 owns the storage adapter. Feature code must stay behind that adapter.

Several retention durations and the recording-consent flow are still founder decisions. This record accepts only the access rules the backlog already states.

## Decision

1. Storage vendor selection is an infrastructure and deployment choice. It is not a product rule. This decision does not select Supabase, S3, R2, or any other provider.
2. The durable identity of a file is an internal stored-object record. A permanent provider URL, bucket path, or absolute filesystem path is not that identity.
3. Authentication establishes who the caller is. Taalim application logic authorizes every private read, write, and download. Possession of an object id, storage key, or URL is not authorization. Provider bucket policy alone is not the application authorization model.
4. Paid classroom access follows trusted payment and subscription state. A browser return or redirect does not confirm payment and does not grant entitlement. Entitlement for a class is created only after trusted payment confirmation for that subscription.
5. A learner has at most one active subscription to a given class. Cancelling that subscription leaves access in place until the end of the period already paid.
6. Private categories and the relationship that authorizes them:
   - Class resources: the class teacher, an authorized administrator, and a learner with a current paid entitlement for that class. Another learner's entitlement does not authorize access.
   - Learner submissions: the submitting learner, the teacher of that class, and an authorized administrator. Other learners do not receive them.
   - Teacher verification documents: authorized founder reviewers only. They are not part of the public teacher profile and are not readable by learners or other teachers.
   - Meeting links: enrolled participants with current access, the class teacher, and authorized administrators. Meeting links are not published in the public catalogue.
   - Recordings: not public objects. Storing a recording in the product waits on the recording decisions in the founder decision log. Until those decisions are accepted, launch classes are treated as not recorded by Taalim.
7. Preview material, if later accepted, is a separate explicit publication choice. This decision does not make ordinary classroom files public.
8. Retention state must be representable on the stored object, including soft-deletion where a category needs it. This decision does not set a retention duration for verification documents or recordings. Those durations remain founder decisions. Authorized deletion of a verification document is audited.
9. Private objects stay private across backup and restore. Recovery must not turn them into public objects.

## Consequences

- Issue #2 can define a provider-neutral storage service and a local private provider for development without a production vendor choice.
- Issue #3 can model stored objects separately from classes, submissions, and verification cases.
- Issue #5 and Issue #12 can write authorization tests for cross-account, cross-class, and id/key tampering.
- Issue #6 can store verification uploads as private objects and keep them out of the public profile.
- Grace-period access, recording consent, recording retention, and which files count as marketplace previews are not granted by this record.

## Alternatives considered

- Choosing a production object-storage vendor in the product baseline. Rejected because Issue #1 and Issue #2 keep that choice in deployment configuration.
- Treating a signed URL or storage key as permission to read. Rejected because Issue #5 requires a server-side relationship check before any private access is issued.
- Publishing meeting links or verification files on the class catalogue. Rejected because Issue #6 and Issue #12 require those objects to stay private.
