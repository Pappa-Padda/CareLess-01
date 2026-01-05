# Plan: Event Management Screen Implementation

I have analyzed the requirements and confirmed that the database schema (`Event`, `Group`, `Address`) is ready.

## 1. Backend API (`apps/api`)
We need to expose endpoints for the frontend to manage events.

-   **Controller:** Create `src/controllers/eventController.ts`
    -   `createEvent`: Create an event (requires `groupId` and `address` data).
    -   `getEvents`: List all events.
    -   `updateEvent`: Modify event details.
    -   `deleteEvent`: Remove an event.
-   **Routes:** Create `src/routes/eventRoutes.ts` and register in `index.ts`.

## 2. Frontend (`apps/web`)
We will build an Admin Event Management screen.

-   **Feature Logic:** Create `src/features/events`
    -   `types.ts`: TypeScript interfaces for Event data.
    -   `services/eventService.ts`: API client functions.
-   **UI Components:**
    -   `EventManagementTable`: A DataGrid/Table to list events with Edit/Delete actions.
    -   `EventFormDialog`: A modal with a form to Create/Edit events.
        -   Fields: Name, Description, Date, Start Time, End Time.
        -   **Note:** We will need a way to input Address and Group ID. For this iteration, I'll use simple text fields or a basic dropdown if data allows.
-   **Page:** Create `src/app/admin/events/page.tsx`
    -   This page will host the Table and the "Add Event" button.

## Execution Order
1.  **Backend:** Implement Controller & Routes.
2.  **Frontend Logic:** Define Types & Service.
3.  **Frontend UI:** Build the Page and Components.

Shall I proceed with **Step 1: Backend API Implementation**?