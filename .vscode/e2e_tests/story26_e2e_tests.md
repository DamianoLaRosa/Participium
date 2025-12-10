# E2E Test Cases – Report Internal Comments Page

**User Story:**  
As a technical office staff member/external maintainer I want to exchange information and comments on the report internally so that coordination happens without exposing internal notes to citizens


**Requirements:**  
- Technical officer or external maintainer must be logged in  
- A report must be selected
- User can view all internal comments sorted by **newest first**  
- User can add a new comment **unless** report status is **5 (Closed)** or **6 (Archived)**  
- Each comment must display:  
  - Author initials/avatar  
  - Author name  
  - Comment text  
  - Created date formatted as `DD/MM/YYYY HH:mm`  
- A **Back** button returns the user to the previous page  

---

## TC-COM-001: View comment list of selected report

**Preconditions:**  
- Logged in user  
- A report is selected and contains at least one internal comment

**Steps:**  
1. Navigate to the **Report Comments** page  
2. Observe the comments list  

**Expected Result:**  
- All comments for the selected report are displayed  
- Comments are ordered **newest to oldest**  

**Actual Result:** Comments are loaded and sorted correctly  
**Status:** [PASS]

---

## TC-COM-002: Show “No comments yet” when list is empty

**Preconditions:**  
- Logged in user  
- A selected report with **0 comments**

**Steps:**  
1. Navigate to the **Report Comments** page  

**Expected Result:**  
- A message is displayed: *“No comments yet. Be the first to comment!”*

**Actual Result:** Message appears as expected  
**Status:** [PASS]

---

## TC-COM-003: Display author info and avatar

**Preconditions:**  
- Logged in user  
- The selected report contains at least one comment

**Steps:**  
1. Navigate to the **Report Comments** page  
2. Inspect the first comment displayed  

**Expected Result:**  
Each comment shows:  
- Avatar with the first letter of username (uppercase)  
- Author name  
- Comment content  
- Date in **DD/MM/YYYY HH:mm** format  

**Actual Result:** Comment metadata is shown correctly  
**Status:** [PASS]

---

## TC-COM-004: Add a new comment successfully

**Preconditions:**  
- Logged in user with username  
- Report status **NOT** equal to 5 or 6  
- A selected report

**Steps:**  
1. Navigate to the **Report Comments** page  
2. Type text in the **Comment** textarea  
3. Click **Publish Comment**  

**Expected Result:**  
- The comment is added  
- The textarea is cleared  
- The new comment appears at the top of the list  

**Actual Result:** Comment is added and displayed correctly  
**Status:** [PASS]

---

## TC-COM-005: Publish button disabled when text is empty

**Preconditions:**  
- Logged in user  
- Selected report

**Steps:**  
1. Navigate to **Report Comments**  
2. Leave the comment box empty  

**Expected Result:**  
- **Publish Comment** button is disabled  

**Actual Result:** Button remains disabled with empty text  
**Status:** [PASS]

---

## TC-COM-006: Publish button disabled when report is Rejected (status 5)

**Preconditions:**  
- Logged in user  
- A selected report with status **5 (Rejected)**

**Steps:**  
1. Navigate to the **Report Comments** page  
2. Enter any text in the comment textarea  

**Expected Result:**  
- **Publish Comment** button stays **disabled**  

**Actual Result:** Button is disabled  
**Status:** [PASS]

---

## TC-COM-007: Publish button disabled when report is Resolved (status 6)

**Preconditions:**  
- Logged in user  
- A selected report with status **6 (Resolved)**

**Steps:**  
1. Navigate to the **Report Comments** page  
2. Enter a comment  

**Expected Result:**  
- **Publish Comment** button remains disabled  

**Actual Result:** Button is disabled as expected  
**Status:** [PASS]

---

## TC-COM-008: Back button returns to previous page

**Preconditions:**  
- Logged in user  
- Currently viewing **Report Comments** page

**Steps:**  
1. Click the **Back** button  

**Expected Result:**  
- The user is returned to the previous page (Report Details)

**Actual Result:** Navigation returns to previous screen  
**Status:** [PASS]

---

## TC-COM-009: Comments refresh after adding a new one

**Preconditions:**  
- Logged in user  
- Report allows commenting (status not 5 or 6)

**Steps:**  
1. Navigate to **Report Comments**  
2. Add a new comment  
3. Verify the comments list refreshes  

**Expected Result:**  
- The new comment appears instantly  
- Comments remain sorted newest→oldest  

**Actual Result:** List refreshes correctly  
**Status:** [PASS]

---

## TC-COM-010: Date formatting is correct

**Preconditions:**  
- Logged in user  
- A selected report with comments

**Steps:**  
1. Navigate to **Report Comments**  
2. Inspect comment timestamps  

**Expected Result:**  
All timestamps follow the format:  
**DD/MM/YYYY HH:mm**  

**Actual Result:** Date format is correct  
**Status:** [PASS]
