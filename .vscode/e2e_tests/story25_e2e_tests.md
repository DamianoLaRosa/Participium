# E2E Test Cases - External Maintainer Status Updates

**User story:** As an external maintainer
I want to update the status of a report assigned to me
So that I can updated citizens about the intervention.

---

## TC-EXT-001: External maintainer login and dashboard access

**Preconditions:**
- External maintainer account exists
- At least 3 reports assigned to this external maintainer

**Steps:**
1. Navigate to login page
2. Login with external maintainer credentials
3. Verify dashboard/home page

**Expected Result:**
- Login successful
- Dashboard shows external maintainer-specific view
- Navigation limited to relevant sections (no access to all reports or approval functions)
- User role indicator: "External Maintainer" or company name visible

**Actual Result:** [to be filled during testing]

**Status:** [PASS/FAIL]

---

## TC-EXT-002: View list of assigned reports

**Preconditions:**
- User authenticated as external maintainer
- 5 reports assigned

**Steps:**
1. Navigate to "My Assigned Reports" or work queue
2. Review list of reports
3. Verify information displayed

**Expected Result:**
- List shows all 5 reports assigned to this external maintainer
- For each report visible:
  - Report ID and title
  - Current status with color-coded badge
  - Creation day
- No reports from other maintainers visible

**Actual Result:** [to be filled during testing]

**Status:** [PASS/FAIL]

---

## TC-EXT-003: View assigned report full details

**Preconditions:**
- User authenticated as external maintainer
- Report assigned with ID

**Steps:**
1. Navigate to assigned reports queue
2. Click on a report 
3. Review all report details
4. Identify available actions

**Expected Result:**
- Detail page shows complete information:
  - Full title and description
  - Reporter name 
  - Category 
  - Address
  - All attached photos (viewable full size)
  - Current status: "Assigned"
  - Creation date
- Available actions:
  - "Update Status" button/dropdown
  - "View comments" button 

**Actual Result:** [to be filled during testing]

**Status:** [PASS/FAIL]

---

## TC-EXT-004: Update status from "Assigned" to "In Progress"

**Preconditions:**
- User authenticated as external maintainer
- Report with status "Assigned" exists 

**Steps:**
1. Open report details
2. Click "Update Status" button
3. Select "In Progress" from dropdown
4. Save status update
5. Verify update confirmation

**Expected Result:**
- Status successfully updated to "In Progress"
- Success message: "Report status updated to In Progress"
- Status badge updated in list view

**Actual Result:** [to be filled during testing]

**Status:** [PASS/FAIL]

---

## TC-EXT-005: Update status from "In Progress" to "Resolved"

**Preconditions:**
- User authenticated as external maintainer
- Report with status "In progress" exists 

**Steps:**
1. Open report details
2. Click "Update Status" button
3. Select "Resolved" from dropdown
4. Save status update
5. Verify update confirmation

**Expected Result:**
- Status successfully updated to "Resolved"
- Success message: "Report status updated to Resolved"
- Status badge updated in list view

**Actual Result:** [to be filled during testing]

**Status:** [PASS/FAIL]

---

## TC-EXT-006: Update status to "Suspended" 

**Preconditions:**
- User authenticated as external maintainer
- Report with status "In progress" exists 

**Steps:**
1. Open report details
2. Click "Update Status" button
3. Select "Suspended" from dropdown
4. Save status update
5. Verify update confirmation

**Expected Result:**
- Status successfully updated to "Suspended"
- Success message: "Report status updated to Suspended"
- Status badge updated in list view

**Actual Result:** [to be filled during testing]

**Status:** [PASS/FAIL]

---

## TC-EXT-007: Access control - Cannot access reports assigned to other maintainers

**Preconditions:**
- User authenticated as external maintainer 
- Reports exist assigned to different maintainer 

**Steps:**
1. Navigate to assigned reports 
2. Verify only own reports visible

**Expected Result:**
- Dashboard shows only reports assigned to the maintainer
- Reports from another maintainers not visible in any list

**Actual Result:** [to be filled during testing]

**Status:** [PASS/FAIL]

---

## TC-EXT-008: Access control - Cannot reassign reports

**Preconditions:**
- User authenticated as external maintainer
- Report assigned to this maintainer exists

**Steps:**
1. Open report details
2. Look for reassignment or transfer functionality
3. Verify available actions

**Expected Result:**
- No "Reassign" or "Transfer" button visible
- Cannot change report assignment
- Only status update and comments available
- Report remains assigned to current maintainer
- Must contact technical office for reassignment

**Actual Result:** [to be filled during testing]

**Status:** [PASS/FAIL]

---

## TC-EXT-009: Mobile responsive interface for field work

**Preconditions:**
- User authenticated as external maintainer on mobile device
- Screen size: iPhone SE
- Report with status "Assigned" exists

**Steps:**
1. Login on mobile device
2. Navigate to assigned reports
3. Open report details
4. Update status to "In Progress"
5. Save changes

**Expected Result:**
- Interface fully responsive and mobile-friendly
- All functions accessible on small screen
- Buttons properly sized for touch

**Actual Result:** [to be filled during testing]

**Status:** [PASS/FAIL]

---


