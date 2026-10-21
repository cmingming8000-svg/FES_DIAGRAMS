# SAD Client Separation - HR/QA and Dean

## Overview
Separated the merged "Admin Client" into two distinct client nodes: **HR/QA Client** and **Dean Client**, reflecting their different purposes, access levels, and dashboards in the FES system.

## Changes Made

### 1. Client Types
**Before:**
```typescript
export type SADClientType = 'student' | 'faculty' | 'admin';
```

**After:**
```typescript
export type SADClientType = 'student' | 'faculty' | 'hr_qa' | 'dean';
```

### 2. Client Components
**Before:**
- Single `admin-client` component for both HR/QA and Dean

**After:**
- `hr-qa-client` - Web interface for system management (red, #ef4444)
- `dean-client` - Web interface for oversight & analytics (amber, #f59e0b)

### 3. Client Popup Options
Now shows 4 distinct client types:
1. 🎓 **Student** - Submit evaluations
2. 👨‍🏫 **Faculty** - View evaluation results
3. 🛡️ **HR/QA** - Manage system & release evaluations
4. 🏛️ **Dean** - Oversight & analytics

### 4. Distinct Flow Sequences

#### HR/QA Flow (10 steps):
Focuses on **system management and evaluation release**:
1. Client Entry → Entry point
2. HR/QA Client → Accesses admin interface
3. Load Balancer → Request routed
4. API Server → Handles admin request
5. Auth Service → HR/QA authentication
6. Session Store → Admin session created
7. Evaluation Service → **Manage evaluations & criteria**
8. PII Redaction Service → **Verify PII redaction**
9. PostgreSQL → **Update evaluation data**
10. Audit Log → All admin actions logged

**Key HR/QA Responsibilities:**
- ✅ Manage evaluation criteria
- ✅ Verify PII redaction compliance
- ✅ Update evaluation data
- ✅ Release evaluations
- ✅ Full system administration

#### Dean Flow (10 steps):
Focuses on **analytics and oversight**:
1. Client Entry → Entry point
2. Dean Client → Accesses analytics interface
3. Load Balancer → Request routed
4. API Server → Handles analytics request
5. Auth Service → Dean authentication
6. Session Store → Dean session created
7. TNA Engine → **Generate department analytics**
8. PostgreSQL → **Query aggregated data**
9. Evaluation Service → **View evaluation summaries**
10. Audit Log → Access logged for compliance

**Key Dean Responsibilities:**
- ✅ Generate department analytics
- ✅ Query aggregated evaluation data
- ✅ View evaluation summaries
- ✅ Oversight and reporting
- ✅ Read-only access to most data

### 5. Connections
Added new connection for Dean client:
- `c3`: HR/QA Client → Load Balancer (HTTPS)
- `c15`: Dean Client → Load Balancer (HTTPS)

### 6. Tour Order
Updated tour sequence to include both clients:
1. Client Entry (tourOrder: 0)
2. Student Client (tourOrder: 1)
3. Faculty Client (tourOrder: 2)
4. **HR/QA Client (tourOrder: 3)**
5. **Dean Client (tourOrder: 4)**
6. Load Balancer (tourOrder: 5)
7. Web Server (tourOrder: 6)
8. API Server (tourOrder: 7)
9. Auth Service (tourOrder: 8)
10. Evaluation Service (tourOrder: 9)
11. PII Redaction Service (tourOrder: 10)
12. TNA Engine (tourOrder: 11)
13. PostgreSQL (tourOrder: 12)
14. Audit Log (tourOrder: 13)
15. Session Store (tourOrder: 14)

## Why This Matters

### Different Access Levels

| Feature | HR/QA | Dean |
|---------|-------|------|
| **Access Type** | Full admin | Read-only analytics |
| **Can Edit Data** | ✅ Yes | ❌ No |
| **Can Release Evaluations** | ✅ Yes | ❌ No |
| **Can Manage Criteria** | ✅ Yes | ❌ No |
| **Can View PII** | ✅ Yes (for verification) | ❌ No |
| **Can Generate Reports** | ✅ Yes | ✅ Yes |
| **Can View Analytics** | ✅ Yes | ✅ Yes |
| **Audit Logging** | All actions logged | Access logged |

### Different Dashboards

**HR/QA Dashboard:**
- Evaluation management interface
- Criteria configuration
- PII redaction verification
- Release workflow
- System settings
- User management

**Dean Dashboard:**
- Department analytics
- Evaluation summaries
- TNA reports
- Trend analysis
- Oversight reports
- Read-only views

### Different Purposes

**HR/QA Purpose:**
- System administration
- Evaluation lifecycle management
- Compliance verification
- Data integrity assurance
- Release coordination

**Dean Purpose:**
- Department oversight
- Performance analytics
- Strategic planning
- Quality assurance
- Reporting to stakeholders

## Visual Differences

### Component Styling
- **HR/QA Client**: Red (#ef4444) - indicates administrative power
- **Dean Client**: Amber (#f59e0b) - indicates oversight/authority

### Flow Visualization
- **HR/QA Flow**: Highlights management and verification components
- **Dean Flow**: Highlights analytics and reporting components

## User Experience

### Before (Merged Admin):
- ❌ Confusing - which admin am I?
- ❌ Unclear access levels
- ❌ Generic flow that doesn't match reality
- ❌ No distinction between management and oversight

### After (Separated):
- ✅ Clear role distinction
- ✅ Accurate access representation
- ✅ Realistic flow paths
- ✅ Matches actual system architecture
- ✅ Better educational value
- ✅ More accurate documentation

## Implementation Details

### Files Modified
1. `src/data/sadData.ts`
   - Updated `SADClientType` to include 'hr_qa' and 'dean'
   - Split `admin-client` into `hr-qa-client` and `dean-client`
   - Created separate flow sequences for each
   - Added connection `c15` for Dean client
   - Updated tour orders

2. `src/components/ClientPopup.tsx`
   - Updated `clientIcons` to include both HR/QA and Dean
   - Now shows 4 client options instead of 3

### No Changes Required
- `src/App.tsx` - Already uses `SADClientType` dynamically
- `src/components/SADCanvas.tsx` - Works with any component ID
- Flow navigation logic - Already generic

## Testing Checklist

- [x] Client popup shows 4 options
- [x] HR/QA Client node exists and is red
- [x] Dean Client node exists and is amber
- [x] HR/QA flow highlights management components
- [x] Dean flow highlights analytics components
- [x] Both flows have 10 steps
- [x] Connections exist for both clients
- [x] Tour includes both client nodes
- [x] Flow navigation works for both
- [x] Build succeeds without errors

## Benefits

### 1. **Accuracy**
- Reflects actual system architecture
- Matches real-world access patterns
- Represents distinct user roles

### 2. **Clarity**
- Clear role separation
- Distinct purposes visible
- Access levels obvious

### 3. **Education**
- Better understanding of system
- Clearer role responsibilities
- More realistic flows

### 4. **Documentation**
- Accurate architecture representation
- Clear access control visualization
- Better stakeholder communication

## Future Enhancements

### Potential Improvements
1. **Role-specific colors** - Different colors for different access levels
2. **Access indicators** - Visual badges showing read/write permissions
3. **Dashboard previews** - Show what each client sees
4. **Permission matrix** - Overlay showing who can do what
5. **Flow comparison** - Side-by-side comparison of different roles
6. **Audit trail visualization** - Show what gets logged for each role

## Conclusion

Splitting the merged "Admin Client" into separate HR/QA and Dean clients provides a more accurate, clear, and educational representation of the FES system architecture. Each role now has its own distinct flow that reflects its actual purpose, access level, and responsibilities in the system.

This change aligns the SAD mode with the DFD mode, which already has separate flows for all four roles (Student, Faculty, HR/QA, Dean), ensuring consistency across all visualization modes.
