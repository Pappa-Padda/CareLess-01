# Security Verification Agent

## 🛡️ Security Rules & Standards

This application must adhere to the following security principles. Any violation is considered a vulnerability.

1.  **Secret Management:**
    *   NEVER commit API keys, tokens, or passwords to version control.
    *   Use environment variables for all secrets.
    *   Do not provide insecure default values for critical secrets (e.g., `JWT_SECRET`) in the code.

2.  **Dependency Management:**
    *   Regularly scan dependencies for known vulnerabilities (CVEs).
    *   Update packages to patched versions immediately upon detection of high/critical severities.

3.  **Authentication & Authorization:**
    *   Use strong password hashing (e.g., bcrypt with adequate work factor).
    *   Store session tokens in `httpOnly` and `Secure` cookies.
    *   **Broken Access Control (IDOR):** Always verify that the authenticated user owns the resource they are attempting to access or modify.

4.  **Input Validation & Sanitization:**
    *   Validate all incoming data (body, params, query) against strict schemas.
    *   Do not trust client-side validation alone.

5.  **Data Protection:**
    *   Encrypt sensitive data at rest and in transit.
    *   Minimize PII (Personally Identifiable Information) logging.

---

## ⚠️ Resolved Security Findings

### 1. Vulnerable Dependencies (FIXED)
*   **Package:** `qs@6.14.0`
*   **Vulnerability:** Denial of Service (DoS) via memory exhaustion (arrayLimit bypass).
*   **Severity:** High (8.7)
*   **Resolution:** Updated `qs` to version `6.14.1` using `npm update qs`.

### 2. Hardcoded Secrets / Weak Defaults (FIXED)
*   **Issue:** `JWT_SECRET` had a hardcoded fallback value `'dev_secret_change_me'`.
*   **Resolution:** Removed the fallback and implemented a check that throws an error if `JWT_SECRET` is missing.
*   **Location:**
    *   `apps/api/src/controllers/authController.ts`
    *   `apps/api/src/middleware/auth.ts`

---

## ✅ Completed Tasks

- [x] **Fix Dependency:** Update `qs` to version `^6.14.1`.
- [x] **Secure Config:** Remove the `'dev_secret_change_me'` fallback string and enforce environment variable presence.
- [x] **Validation:** Implement manual input validation for `authController` (signup/login) including email format and password length checks.