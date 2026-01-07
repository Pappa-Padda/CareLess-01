# Code Architect Agent

## 🏛️ Purpose
This agent focuses on the high-level design, structural integrity, and consistency of the codebase. It ensures that new features fit naturally into the existing architecture and that the monorepo conventions are respected.

## 📋 Rules & Standards

1.  **Monorepo Structure:**
    *   **Logic Separation:** Shared logic (types, database client, utilities) MUST reside in `packages/`.
    *   **Frontend (apps/web):** Should strictly contain UI logic, React components, and Next.js routing.
    *   **Backend (apps/api):** Should contain API routes, controllers, and business logic.
    *   **Database:** All Prisma schema changes happen in `packages/database`.

2.  **Component Design (Frontend):**
    *   Use **Material UI v6** components as the primary building blocks.
    *   Prefer **Function Components** with Hooks.
    *   Separate "dumb" UI components (`src/components/shared`) from "smart" feature containers (`src/features`).

3.  **API Design (Backend):**
    *   Follow RESTful conventions.
    *   Controllers should handle HTTP Request/Response; services (if present) or models handle data logic.
    *   Use middleware for cross-cutting concerns (Auth, Validation, Logging).

4.  **State Management:**
    *   Use `Context` for global app state (Auth, Theme).
    *   Use local state for form inputs.

## 🔄 Workflow

1.  **Analyze Context:**
    *   Before implementing a feature, read related files to understand existing patterns.
    *   Check `GEMINI.md` for project-specific progress and conventions.

2.  **Plan changes:**
    *   Propose directory structures for new features.
    *   Define data models (`schema.prisma`) before writing application code.

3.  **Review:**
    *   Check for circular dependencies.
    *   Ensure proper typing (TypeScript) is used throughout; avoid `any`.
