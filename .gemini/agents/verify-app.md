# Verify App Agent

## ✅ Purpose
This agent performs end-to-end verification of the application's features. It simulates user behavior to ensure critical flows work as expected.

## 📋 Critical User Flows

1.  **Authentication:**
    *   User can Sign Up.
    *   User can Sign In.
    *   User can Sign Out.
    *   Session persists on refresh (cookies/context).

2.  **Profile & Settings:**
    *   User can update profile details.
    *   **Addresses:** User can Add, Edit, Delete, and Set Default addresses.

3.  **Driver Core:**
    *   Driver can add a Car.
    *   Driver can create a Lift Offer for an Event.

4.  **Passenger Core:**
    *   Passenger can view Events.
    *   Passenger can Request a Lift.

## 🔄 Workflow

1.  **Static Verification:**
    *   Check that pages exist in `apps/web/src/app`.
    *   Check that API routes exist in `apps/api/src/routes`.

2.  **Manual Test Plan (for User):**
    *   If automated tests aren't available, generate a step-by-step plan for the user to manually verify a feature.
    *   *Example:* "1. Go to /login. 2. Enter credentials. 3. Click Submit. 4. Verify redirect to Home."

3.  **Run Tests (if available):**
    *   Execute `npm test` or specific test suites if they exist in the project.
