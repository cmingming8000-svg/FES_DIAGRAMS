# DFD Alignment with FES Source Code

## Overview
Updated the Data Flow Diagram (DFD) to accurately reflect the actual data flow implemented in the FES source code repository: https://github.com/cmingming8000-svg/FES_V0.0.2/tree/Account-Manager-Update

## Critical Findings from Source Code Analysis

### 1. Faculty Flow - MAJOR CORRECTION

**Previous (Incorrect):**
```
Faculty → Auth → Faculty Dashboard → Verify & Release → TNA Engine → Reports
```

**Actual (From Source Code):**
```
Faculty → Auth → Bootstrap → Faculty Dashboard → Evaluations DB (view metrics)
                                               → TNA Engine (individual insights)
                                               → Verify & Release (e-sign acknowledgment)
```

**Why This Matters:**
- Faculty does NOT go through "verify-release" to access their data
- Faculty receives role-scoped data via Bootstrap service after HR/QA release
- Faculty views their own metrics directly from evaluations database
- Faculty receives deterministic TNA insights (pre-approved templates)
- Faculty e-signs acknowledgment of results (RA 8792 compliance)

**Source Code Evidence:**
- `server/src/routes/data.ts`: `GET /api/bootstrap` returns role-scoped data
- `server/src/routes/terms.ts`: `POST /:id/acknowledge` for faculty acknowledgment
- `src/utils/tnaEngine.ts`: Deterministic individual TNA rules
- Faculty dashboard shows: personal metrics, course breakdown, TNA insights

### 2. Dean Flow - MAJOR CORRECTION

**Previous (Incorrect):**
```
Dean → Auth → Dean Oversight → Verify & Release → TNA Engine → Reports
```

**Actual (From Source Code):**
```
Dean → Auth → Bootstrap → Dean Oversight → Evaluations DB (department queries)
                                          → TNA Engine (department TNA)
                                          → Verify & Release (oversight sign-off)
```

**Why This Matters:**
- Dean does NOT access "verify-release" to get data
- Dean receives department-scoped bootstrap data (aggregates only)
- Dean queries evaluations database directly (student IDs hidden via RLS)
- Dean accesses department-level TNA snapshots
- Dean e-signs oversight within 7-day window (does NOT gate faculty access)

**Source Code Evidence:**
- `server/src/routes/data.ts`: Bootstrap returns department aggregates for Dean
- `server/src/routes/terms.ts`: `POST /:id/oversight-signoff` for Dean oversight
- `server/src/routes/tna.ts`: `GET /tna/department` for department TNA
- Dean can send acknowledgment reminders to faculty

### 3. Student Flow - MINOR CORRECTION

**Previous:**
```
Student → Auth → Eval Submit → PII Redaction → Evaluations DB
```

**Actual:**
```
Student → Auth → Bootstrap → Eval Submit → PII Redaction → Evaluations DB
                                                    → Audit Log
```

**Why This Matters:**
- Student receives role-scoped bootstrap data (enrollments, subjects, faculty)
- 3-step evaluation flow: Program → Subject → Professor
- PII redaction applied to feedback text (RA 10173 compliance)
- Evaluation submission logged to audit trail

**Source Code Evidence:**
- `server/src/routes/data.ts`: `POST /evaluations` with `stripPII()` applied
- Bootstrap returns: programs, subjects, faculty, evaluatedSubjectIds
- AuditService.record() called on every submission

### 4. HR/QA Flow - ENHANCEMENT

**Previous:**
```
HR/QA → Auth → Admin Dashboard → Evaluations DB → Verify & Release → Audit Service
```

**Actual:**
```
HR/QA → Auth → Bootstrap → Admin Dashboard → Evaluations DB (full access with student IDs)
                                            → Verify & Release (e-sign release)
                                            → Audit Service (verify hash chain)
                                            → TNA Engine (department & institution)
                                            → Account Management (new feature)
```

**Why This Matters:**
- HR/QA has FULL access to all data including student IDs
- HR/QA can manage user accounts (activate/deactivate/unlock)
- HR/QA can bulk import accounts and send invitations
- HR/QA e-signs release which immediately grants faculty access
- HR/QA can verify audit trail hash chain integrity

**Source Code Evidence:**
- `server/src/routes/accounts.ts`: Account management endpoints
- `server/src/routes/terms.ts`: `POST /:id/release` for HR/QA release
- `server/src/routes/audit.ts`: Audit trail verification
- `server/src/routes/tna.ts`: Institution-wide TNA access

## Node Updates

### 1. Verify & Release Node
**Updated Details:**
- Now handles THREE types of e-signatures:
  1. HR/QA Release (Tier 1 - grants faculty access)
  2. Faculty Acknowledgment (RA 8792 compliance)
  3. Dean Oversight Sign-off (7-day window, non-blocking)
- Tracking IDs: `FES-[timestamp]-[hash]`
- SHA-256 document hashes stored
- PDF receipts generated server-side

### 2. Faculty Dashboard Node
**Updated Details:**
- View personal evaluation results (after HR/QA release)
- Course breakdown & score distribution
- Individual TNA insights (deterministic templates from `tna_templates`)
- E-sign acknowledgment of results
- Server-computed aggregates only (no direct DB access)

### 3. Dean Oversight Node
**Updated Details:**
- Department aggregate reviews (RLS-scoped)
- Drill-down into faculty metrics
- Department TNA snapshots
- Comparative analytics (vs institution average)
- Oversight sign-off (7-day window from HR/QA release)
- Send acknowledgment reminders to faculty

### 4. Admin Dashboard Node
**Updated Details:**
- Manage academic terms (create/activate/archive)
- Configure evaluation criteria & performance indicators
- **NEW:** Account management (activate/deactivate/unlock)
- **NEW:** Bulk import accounts & send invitations
- View TNA analytics (department & institution level)
- Monitor audit trail & verify hash chain

## Flow Updates

### New Flows Added:
1. **f17b**: Faculty Dashboard → Verify & Release (Acknowledgment)
   - Faculty e-signs acknowledgment of results
   - Step 5 in faculty flow

### Modified Flows:
1. **f15**: Auth → Faculty Dashboard (Bootstrap data)
   - Changed from "Scoped data" to "Bootstrap data"
   - Now includes return flow
   - Step 2 in faculty flow

2. **f16**: Faculty Dashboard → Evaluations DB (View metrics)
   - Changed from "verify-release → faculty-dashboard"
   - Faculty queries their own evaluation data
   - Step 3 in faculty flow

3. **f17**: Faculty Dashboard → TNA Engine (Individual TNA)
   - Changed from "Request insights" to "Individual TNA"
   - Deterministic, pre-approved templates
   - Step 4 in faculty flow

4. **f19**: Auth → Dean Oversight (Bootstrap data)
   - Changed from "Department scope" to "Bootstrap data"
   - Now includes return flow
   - Step 2 in dean flow

5. **f20**: Dean Oversight → Evaluations DB (Department evaluations)
   - Changed from "verify-release → dean-oversight"
   - Dean queries department evaluations (RLS-scoped)
   - Step 3 in dean flow

6. **f21**: Dean Oversight → TNA Engine (Department TNA)
   - Changed from "Department analysis" to "Department TNA"
   - Department-level TNA snapshots
   - Step 4 in dean flow

7. **f22**: Dean Oversight → Verify & Release (Oversight sign-off)
   - Step 5 in dean flow (was step 6)
   - 7-day window from HR/QA release
   - Does NOT gate faculty access

## Step Count Updates

### Faculty Flow: 5 steps (was 6)
1. Faculty → Auth (credentials)
2. Auth → Faculty Dashboard (bootstrap data)
3. Faculty Dashboard → Evaluations DB (view metrics)
4. Faculty Dashboard → TNA Engine (individual TNA)
5. Faculty Dashboard → Verify & Release (acknowledgment)

### Dean Flow: 5 steps (was 6)
1. Dean → Auth (credentials)
2. Auth → Dean Oversight (bootstrap data)
3. Dean Oversight → Evaluations DB (department evaluations)
4. Dean Oversight → TNA Engine (department TNA)
5. Dean Oversight → Verify & Release (oversight sign-off)

### HR/QA Flow: 9 steps (unchanged)
### Student Flow: 5 steps (unchanged)

## Compliance & Security Alignment

### RA 8792 (E-Commerce Act) Compliance:
- All e-signatures stored with:
  - Exact agreement text
  - Signer identity
  - Term information
  - Signature image (PNG)
  - SHA-256 document hash
  - Tracking ID: `FES-[timestamp]-[hash]`
- PDF receipts generated server-side
- Verification endpoint: `GET /api/agreements/verify/:trackingId`

### RA 10173 (Data Privacy Act) Compliance:
- PII redaction applied to student feedback
- Student IDs hidden from Faculty and Dean views
- HR/QA retains full verification visibility
- Row-level security (RLS) on evaluations and evaluation_ratings
- Per-transaction security context (`fes.role`, `fes.department_id`)

### Audit Trail Integrity:
- Append-only audit_log table
- UPDATE/DELETE/TRUNCATE blocked by triggers
- Runtime role only has SELECT/INSERT privileges
- SHA-256 hash chain for tamper detection
- HR/QA can verify chain integrity

## Testing Checklist

### Faculty Flow Test:
- [ ] Login as faculty
- [ ] Verify bootstrap data received
- [ ] View personal evaluation metrics
- [ ] Access individual TNA insights
- [ ] E-sign acknowledgment
- [ ] Verify 5-step flow progression

### Dean Flow Test:
- [ ] Login as dean
- [ ] Verify department-scoped bootstrap data
- [ ] Query department evaluations
- [ ] Access department TNA snapshots
- [ ] E-sign oversight within 7 days
- [ ] Send acknowledgment reminder
- [ ] Verify 5-step flow progression

### HR/QA Flow Test:
- [ ] Login as HR/QA
- [ ] Manage academic terms
- [ ] Configure evaluation criteria
- [ ] Manage user accounts (new feature)
- [ ] Bulk import accounts
- [ ] E-sign release
- [ ] Verify audit trail
- [ ] Access institution-wide TNA
- [ ] Verify 9-step flow progression

### Student Flow Test:
- [ ] Login as student
- [ ] Verify bootstrap data (enrollments)
- [ ] Complete 3-step evaluation
- [ ] Verify PII redaction applied
- [ ] Verify audit log entry
- [ ] Verify 5-step flow progression

## Source Code References

### Key Files:
- `server/src/routes/auth.ts` - Authentication flow
- `server/src/routes/data.ts` - Bootstrap and evaluation submission
- `server/src/routes/terms.ts` - Release and acknowledgment workflows
- `server/src/routes/tna.ts` - TNA analytics
- `server/src/routes/accounts.ts` - Account management
- `server/src/routes/audit.ts` - Audit trail
- `src/utils/pii.ts` - PII redaction
- `src/utils/tnaEngine.ts` - Individual TNA rules
- `src/store.ts` - Client-side data cache

### Key Functions:
- `loadBootstrap()` - Role-scoped data loading
- `stripPII()` - Automated PII redaction
- `signAgreement()` - E-signature processing
- `getDepartmentTNA()` - Department-level TNA
- `getInstitutionalTNA()` - Institution-wide TNA
- `AuditService.record()` - Audit trail logging

## Conclusion

The DFD now accurately reflects the actual data flow implemented in the FES source code. All role-based access controls, compliance requirements, and workflow steps are correctly represented. The diagram serves as a reliable reference for understanding the system's architecture and data flow patterns.

**Key Improvements:**
1. ✅ Faculty flow corrected (no longer goes through verify-release for data access)
2. ✅ Dean flow corrected (direct database queries, not via verify-release)
3. ✅ Bootstrap service properly represented
4. ✅ Account management feature added
5. ✅ E-signature workflows clarified (3 types)
6. ✅ Compliance requirements documented
7. ✅ Step counts corrected for all roles
8. ✅ Node details updated to match actual functionality
