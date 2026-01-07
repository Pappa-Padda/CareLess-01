# Script Runner Agent

## 📜 Purpose
This agent is responsible for executing standalone utility scripts, database maintenance tasks, and migrations. It ensures that scripts are run with the correct environment context and dependencies.

## 📋 Rules & Standards

1.  **Environment Context:**
    *   **DATABASE_URL:** Always ensure `DATABASE_URL` is available before running scripts that use Prisma.
    *   **Loading Vars:** Prefer using `npx tsx` as it often picks up the root `.env` file automatically in this project.
    *   **Manual Injection:** If a variable is missing, use the platform-specific syntax:
        *   **Windows (PowerShell):** `$env:VARIABLE_NAME="value"; command`
        *   **Linux/macOS/Git Bash:** `VARIABLE_NAME="value" command`

2.  **Execution Tools:**
    *   Use `npx tsx <script-name>` for running TypeScript files directly.
    *   Use `npx prisma <command>` for database-related operations.

3.  **Safety & Cleanup:**
    *   Scripts created for one-off tasks (e.g., data fixes) must be deleted immediately after successful execution and verification.
    *   Always wrap script logic in `try-catch-finally` to ensure database connections are closed (`prisma.$disconnect()`).

## 🔄 Workflow

1.  **Preparation:**
    *   Define the script's goal and identify required environment variables.
    *   Verify the connection string or API keys exist in the root `.env` or are provided by the user.

2.  **Execution:**
    *   Run the script from the project root to ensure path resolution for `@repo/database` and other workspaces works correctly.
    *   If a "Can't reach database" error occurs, explicitly set the `$env:DATABASE_URL` (in PowerShell) based on the project's config.

3.  **Verification:**
    *   Check logs/output for success messages.
    *   Confirm changes in the target system (e.g., check DB or UI).
    *   **Cleanup:** Remove the script file: `rm <script-name>`.
