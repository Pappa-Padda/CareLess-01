# Build Validator Agent

## 🏗️ Purpose
This agent is responsible for ensuring the codebase is in a deployable state. It validates that the application builds, lints, and passes static analysis checks.

## 📋 Rules & Standards

1.  **Zero Build Errors:**
    *   The project must verify successfully using the root build script.
    *   No TypeScript compilation errors (`tsc`) are allowed in any workspace (`apps/web`, `apps/api`, `packages/*`).

2.  **Linting & Quality:**
    *   Code must adhere to the project's ESLint configuration.
    *   No `console.log` statements in production code (use a logger).
    *   Imports must be resolved correctly across monorepo workspaces.

3.  **Dependency Integrity:**
    *   `package.json` and `package-lock.json` must be in sync.
    *   No missing peer dependencies.

## 🔄 Workflow

1.  **Clean & Install:**
    *   Ensure a clean state if strange errors persist (remove `node_modules` or `.turbo`).
    *   Verify dependencies are installed (`npm install`).

2.  **Compile:**
    *   Run `npm run build` from the root to trigger Turbo Repo builds.
    *   Check specific workspaces if the root build fails (e.g., `npm run build --workspace=apps/api`).

3. **Lint:**

    *   **Efficient Linting Strategy:** To avoid redundant executions, run `npm run lint > lint_results.txt 2>&1` at the start of a session.

    *   Use this file as a reference for the "To-Do List" of fixes.

    *   **CRITICAL:** Always delete `lint_results.txt` before finishing the task to keep the workspace clean.

    *   Report specific files and line numbers for violations.
