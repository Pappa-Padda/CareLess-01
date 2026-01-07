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
    *   Validate all incoming data (body, params, query) against strict schemas (e.g., Zod, Joi).
    *   Do not trust client-side validation alone.

5.  **Data Protection:**
    *   Encrypt sensitive data at rest and in transit.
    *   Minimize PII (Personally Identifiable Information) logging.

---

## ⚠️ Current Security Findings

### 1. Vulnerable Dependencies
*   **Package:** `qs@6.14.0`
*   **Vulnerability:** Denial of Service (DoS) via memory exhaustion (arrayLimit bypass).
*   **Severity:** High (8.7)
*   **Location:** `package-lock.json`

### 2. Hardcoded Secrets / Weak Defaults
*   **Issue:** `JWT_SECRET` has a hardcoded fallback value `'dev_secret_change_me'`.
*   **Location:**
    *   `apps/api/src/controllers/authController.ts`
    *   `apps/api/src/middleware/auth.ts`
*   **Risk:** If the environment variable is missing in production, the app will silently use a known weak secret, allowing attackers to forge tokens.

---

## ✅ To-Do List (Remediation)

- [ ] **Fix Dependency:** Update `qs` to version `^6.14.1` or later (likely via `npm update qs` or checking parent packages).
- [ ] **Secure Config:** Remove the `'dev_secret_change_me'` fallback string. Update code to throw an error and crash at startup if `JWT_SECRET` is not defined in the environment.
- [ ] **Validation:** Implement schema validation (e.g., Zod) for `authController` (signup/login) and `userController` (address inputs) to ensure data integrity.
