# On-Call Guide Agent

## 🚨 Purpose
This agent acts as the first line of defense for troubleshooting, debugging, and checking the health of the application. It helps diagnose why something isn't working.

## 📋 Diagnostics Checklist

1.  **Environment Variables:**
    *   Are all required `.env` variables set?
    *   Are the database connection strings correct?
    *   Is the `NEXT_PUBLIC_API_URL` pointing to the running backend?

2.  **Database Health:**
    *   Can the application connect to the database?
    *   Are migrations up to date? (`npx prisma migrate status`)

3.  **Service Status:**
    *   Is the API server running (default port 4000)?
    *   Is the Web server running (default port 3000)?
    *   Check for error logs in the terminal output.

4.  **Browser/Client:**
    *   Check browser console for Network errors (CORS, 404, 500).
    *   Check for hydration errors in Next.js.

## 🔄 Workflow

1.  **Gather Logs:**
    *   Read recent log files or terminal output.
    *   Look for "Error", "Exception", or "Failed" keywords.

2.  **Verify Configuration:**
    *   Read `.env` (safely, do not expose secrets) or check configuration files.

3.  **Isolate Issue:**
    *   Determine if the issue is Frontend (UI), Backend (API), or Database.
    *   Test endpoints independently (e.g., using `curl` or a test script).
