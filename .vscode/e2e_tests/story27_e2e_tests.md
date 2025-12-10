# E2E Test Cases - Email Verification with Code

**User Story:** As a citizen, I want to confirm my registration with a code so that my account becomes valid and I can start using the system.

**Requirements:**
- User receives email with confirmation code after registration
- Code is valid for 30 minutes
- User must enter code to activate account
- User can use the application only after confirmation

---

## TC-VER-001: Successful registration sends verification code

**Preconditions:**
- User is NOT registered in the system

**Steps:**
1. Navigate to registration page
2. Fill registration form with valid data:
   - Email: neyinij279@discounp.com (tempmail)
   - First name: Carmelo
   - Last name: Catania
   - Password: password
3. Submit registration
4. Check email inbox

**Expected Result:**
- Registration successful message appears
- User receives email with 6-digit verification code
- Email contains expiration time (30 minutes from sending)

**Actual Result:**  The user is redirected to the code confirmation page, and the email with the code is received in their mailbox.

**Status:** [PASS]  


---

## TC-VER-002: Account inactive before verification

**Preconditions:**
- User just registered but has NOT verified email

**Steps:**
1. Complete registration (as in TC-VER-001)
2. Attempt to login with credentials

**Expected Result:**
- The user is redirected to the code confirmation page

**Actual Result:** The user is redirected to the code confirmation page while waiting for the verification.

**Status:** [PASS]  

---

## TC-VER-003: Successful verification with valid code

**Preconditions:**
- User registered and received verification code via email
- Code is still valid (within 30 minutes)

**Steps:**
1. Login with registered credentials
2. Navigate to email verification page
3. Enter the 6-digit code from email
4. Click "Submit"

**Expected Result:**
- Account becomes active
- User can now access all features
- Redirect to user page

**Actual Result:** The user is redirected to their user page, where they can access the map. The account becomes active.
  
**Status:** [PASS]  

---

## TC-VER-004: Verification with incorrect code

**Preconditions:**
- User registered and received verification code
- Code is still valid

**Steps:**
1. Login with registered credentials
2. Navigate to verification page
3. Enter WRONG 6-digit code (e.g., 999999)
4. Click "Submit"

**Expected Result:**
- Error message "Invalid or expired code. Please try again"
- Account remains inactive
- User can try again

**Actual Result:** The error message appears and the account remains inactive.

**Status:** [PASS]  

---

## TC-VER-005: Verification with expired code (after 30 minutes)

**Preconditions:**
- User registered MORE than 30 minutes ago
- Verification code has expired

**Steps:**
1. Login with registered credentials
2. Navigate to verification page
3. Enter the original code (now expired)
4. Click "Submit"

**Expected Result:**
- Error message "Invalid or expired code. Please try again"
- Option to request new code appears
- Account remains inactive

**Actual Result:** The error message appears and the account remains inactive.

**Status:** [PASS]  

---

## TC-VER-006: Request new verification code

**Preconditions:**
- User registered but code expired or lost

**Steps:**
1. Login with registered credentials
2. Navigate to verification page
3. Click "Resend verification code"
4. Check email inbox

**Expected Result:**
- New 6-digit code sent to email
- Old code becomes invalid
- New code valid for 30 minutes

**Actual Result:** [to be filled during testing]  
**Status:** [PASS]  

---

## TC-VER-007: Code format validation

**Preconditions:**
- User on verification page

**Steps:**
1. Login with registered credentials
2. Navigate to verification page
3. Test invalid inputs:
   - Less than 6 digits (e.g., 12345)
   - More than 6 digits (e.g., 1234567)
   - Letters (e.g., ABCDEF)
   - Special characters (e.g., 123@45)

**Expected Result:**
- Verify button disabled until valid format entered

**Actual Result:** The “Submit” button is disabled until all 6 digits are entered.
It is not possible to enter more than 6 digits, and any character that is not a number is not accepted in the input field.

**Status:** [PASS] 

---


**Testing Date:** 10/12/2025  

**Browser(s):**  Edge  

**Device(s):** Desktop
