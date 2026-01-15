# Allocation Console & Group Pickup Management Plan

**Current Status:** Completed (Consolidated into Admin Dashboard)
**Last Updated:** 2026-01-15

## 1. Objective
Implement a system for Group Admins to manage standard pickup locations ("Pickup Points") and an Allocation Console to assign passengers to drivers (lifts) for events.

## 2. Data Modeling
- **Modified Model: `Pickup`**
    - Added a relation to `Group`.
    - This allows a `Pickup` record to serve as a "Group Pickup Point" (reusable location/time).
    - Schema Change:
      ```prisma
      model Pickup {
        // ... existing fields
        groupId   Int?     @map("Group_ID") // Optional, as not all pickups belong to a group
        
        // ... existing relations
        group     Group?   @relation(fields: [groupId], references: [id], onDelete: Cascade)
      }
      ```
    - Updated `Group` model to include `pickups Pickup[]`.

## 3. Feature: Group Pickup Management
- **Target User:** System Admin (via Admin Dashboard) & Group Admin (via Group View - *future optimization*).
- **Route:** `/admin-dashboard/pickup-points` (Consolidated).
- **Functionality:**
    - List all Pickup Points.
    - Filter by "All" or Specific Group.
    - Add new Pickup Point (Global or Group-Specific).
    - Edit/Delete Pickup Points.
- **Backend:**
    - `GET /api/admin/pickups`
    - `POST /api/admin/pickups` (Supports optional `groupId`)
    - `DELETE /api/admin/pickups/:id`

## 4. Feature: Allocation Console
- **Target User:** Group Admin.
- **Current State:** Functional.
- **Enhancements Implemented:**
    - **Pickup Point Selection:** When assigning a passenger, allow selecting from the list of `Pickup` records associated with the Group.
    - **Logic:**
        - When a standard "Pickup Point" is selected, the system fetches its address and creates a *new* Pickup record for the specific allocation (preserving the Template).

## 5. Implementation Steps (Status)

### Phase 1: Database & Backend
- [x] **Schema:** Add `groupId` to `Pickup` model in `schema.prisma`.
- [x] **Schema:** Add `pickups` relation to `Group`.
- [x] **Migration:** Run `db:push` and `db:generate`.
- [x] **API:** Update `GroupController` and `AdminController` to manage these.

### Phase 2: Frontend - Pickup Points Management
- [x] **UI:** Update `AdminDashboard/PickupPoints` to include Group Filtering.
- [x] **UI:** Update `AddPickupDialog` to allow selecting a Group.
- [x] **Refactor:** Removed duplicate `groups/[id]/pickup-points` page to centralize management.

### Phase 3: Frontend - Allocation Console Updates
- [x] **UI:** Update `AllocationConsolePage` to fetch `Group` -> `Pickups`.
- [x] **Logic:** Allow selecting a Group Pickup when assigning.
- [x] **Backend:** Updated `allocationController.ts` to handle `pickupPointId`.

## 6. Future Considerations
- **Cleanup Script:** Automated nightly job to merge duplicate addresses and link pickups to single address records to save space.
