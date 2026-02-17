# Stock Variance Investigation Workflow

## Overview

This system provides a comprehensive variance investigation workflow to handle discrepancies discovered during stock recounts. Instead of just accepting variances, the system creates investigations that require root cause analysis and approval before inventory adjustments are made.

## Roles Involved

### 1. **Inventory Manager / Warehouse Manager** 
- **Responsibility**: Conduct field investigations
- **Actions**:
  - Conduct physical inspections
  - Interview staff
  - Document findings
  - Submit investigation report with root cause and proposed action

### 2. **Operations Manager**
- **Responsibility**: Oversee inventory operations and investigations
- **Actions**:
  - Monitor active investigations
  - Assign investigations to warehouse managers
  - Review findings
  - Approve or reject investigation submissions
  - Coordinate remedial actions

### 3. **Finance Manager**
- **Responsibility**: Financial impact assessment
- **Actions**:
  - Review variance impact on financials
  - Calculate cost implications
  - Approve write-offs and adjustments
  - Set thresholds for escalation
  - Report to executive management

### 4. **Accountant**
- **Responsibility**: Record keeping and reconciliation
- **Actions**:
  - View all variances and investigations
  - Track approved adjustments
  - Reconcile inventory to general ledger
  - Generate variance reports
  - Audit investigation trails

### 5. **Admin**
- **Responsibility**: System administration and oversight
- **Actions**:
  - Full system access
  - Can perform all operations
  - Override decisions if needed
  - Manage system-level settings
  - Generate executive reports

## Investigation Workflow

### Stage 1: Detection → New Investigation
When a stock recount shows variance:
1. System automatically creates a `StockVarianceInvestigation` record
2. Status: **NEW**
3. Notifications sent to: Admin, Accountant, Warehouse Manager, Operations Manager, Inventory Manager, Finance Manager

### Stage 2: Assignment → Under Investigation
Operations Manager assigns the investigation:
1. Investigation is assigned to a Warehouse/Inventory Manager
2. Status changes to: **ASSIGNED**
3. Assigned investigator receives notification

### Stage 3: Investigation Period
Investigator conducts field investigation:
- Verifies actual quantity on hand
- Checks recent transactions
- Reviews handling procedures
- Interviews relevant staff
- Documents findings

### Stage 4: Root Cause Analysis & Submission
Investigator submits findings:
- **Status**: ROOT_CAUSE_IDENTIFIED → PENDING_APPROVAL
- **Root Causes** (can be multiple factors):
  - Product Damage
  - Possible Theft
  - Recording/Entry Error
  - System/Software Error
  - Supplier Supply Error
  - Delivery/Transport Error
  - Packaging/Unit Error
  - Natural Loss (Evaporation/Leakage)
  - Unknown

### Stage 5: Proposed Action
Investigator recommends action:
- **Adjust Down** (Write-off loss)
- **Adjust Up** (Recount error correction)
- **Write Off Asset** (Total loss)
- **Submit Claim** (Insurance/Supplier claim)
- **Disciplinary Action** (Staff compliance issue)
- **Investigation Only** (No inventory action needed)

### Stage 6: Approval Process
Finance Manager / Operations Manager / Admin reviews:
1. Assess root cause validity
2. Verify proposed action appropriateness
3. Calculate financial impact
4. Document approval decision
5. Status: **APPROVED**

### Stage 7: Action Execution
Upon approval:
- **Adjust Down/Write-off**: Inventory reduced, stock movement recorded
- **Adjust Up**: Inventory increased (recount error correction)
- **Claim**: Investigation stays open for claim tracking
- **Disciplinary/Investigation Only**: Case closed
- Status: **RESOLVED** → **CLOSED**

## Investigation States

```
┌─────────────────────────────────────────────────────────────┐
│ NEW (Variance detected)                                     │
│ ↓ Operations Manager assigns                                │
│ ASSIGNED (Awaiting investigator)                             │
│ ↓ Investigator begins investigation                          │
│ INVESTIGATING                                               │
│ ↓ Root cause found, action proposed                          │
│ ROOT_CAUSE_IDENTIFIED                                       │
│ ↓ Submit findings                                            │
│ PENDING_APPROVAL                                            │
│ ├─ Finance/Ops Manager approves → APPROVED                  │
│ │  ↓ Action executes automatically                          │
│ │  RESOLVED                                                 │
│ │  ↓                                                        │
│ │  CLOSED                                                  │
│ │                                                          │
│ └─ Finance/Ops Manager rejects → INVESTIGATING (back to)   │
│    (Investigator must resubmit)                            │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. **Investigation Notes**
Multiple team members can add notes throughout investigation:
- Investigation notes: Field findings
- Finding notes: Key discoveries
- Decision notes: Recommendations
- Resolution notes: Final resolution details

### 2. **Audit Trail**
Complete tracking of:
- Who created the investigation
- Who assigned it
- Who investigated
- All notes and discussions
- Who approved/rejected
- What action was taken
- When and by whom

### 3. **Financial Tracking**
- Cost impact calculation
- Write-off reasons documented
- Adjustment quantities tracked
- Insurance claim tracking

### 4. **Automatic Actions**
Upon approval, system automatically:
- Adjusts inventory balance
- Creates stock movement record
- Updates product quantity
- Logs the transaction
- Generates audit entries

### 5. **Notifications**
Smart notifications to relevant staff:
- Investigation assigned → Investigator
- Approval needed → Approvers
- Investigation rejected → Investigator (for resubmission)
- Note added → Investigation team
- Status changes → Relevant stakeholders

## Database Tables

### `stock_variance_investigations`
Main investigation tracking table with:
- Variance details (qty, direction)
- Status tracking
- User assignments (assigned_to, investigated_by, approved_by)
- Root cause and action taken
- Financial impact
- Timestamps for audit trail

### `variance_investigation_notes`
Supporting notes table:
- Note text and type
- Creator information
- Timestamps
- Links to investigation

## API Endpoints

- `GET /dashboard/inventory/variance-investigations` - List all investigations
- `GET /dashboard/inventory/variance-investigations/{id}` - View investigation details
- `POST /dashboard/inventory/variance-investigations/{id}/assign` - Assign investigation
- `POST /dashboard/inventory/variance-investigations/{id}/submit` - Submit findings
- `POST /dashboard/inventory/variance-investigations/{id}/approve` - Approve investigation
- `POST /dashboard/inventory/variance-investigations/{id}/reject` - Reject investigation
- `POST /dashboard/inventory/variance-investigations/{id}/notes` - Add investigation note

## Thresholds & Escalation

System can be configured to:
- Auto-escalate high-value variances
- Require multiple approvals for large variances
- Notify executive management for significant losses
- Generate compliance reports for recurring issues

## Reports

Variance investigations enable:
- **Variance Analysis Report**: Trends, patterns, root causes
- **Personnel Report**: Investigations involving specific staff
- **Financial Report**: Total variance impact, write-offs
- **Compliance Report**: Response times, approval rates
- **Root Cause Summary**: Most common causes for improvement

## Best Practices

1. **Timely Investigation**: Complete investigation within 48-72 hours
2. **Documentation**: Ensure all findings are well-documented
3. **Evidence**: Preserve evidence (photos, witness statements)
4. **Consistency**: Apply similar actions for similar root causes
5. **Prevention**: Use variance patterns to implement preventive measures
6. **Communication**: Keep staff informed about investigation outcomes
