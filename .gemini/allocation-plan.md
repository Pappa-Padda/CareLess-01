# Allocation Console & Group Pickup Management Plan

## 1. Objective
Implement a system for Group Admins to manage standard pickup locations ("Meeting Points") and an Allocation Console to assign passengers to drivers (lifts) for events.

## 2. Data Modeling
- **New Concept: Group Meeting Points**
    - These are predefined locations created by Group Admins.
    - Unlike personal addresses, these belong to the Group.
    - Used as standard pickup spots for multiple passengers.
    - *Action:* Need to define schema (e.g., `GroupLocation` or reuse `Address` with a tag/relation).

## 3. Feature: Group Pickup Management
- **Target User:** Group Admin.
- **Functionality:**
    - CRUD (Create, Read, Update, Delete) Meeting Points.
    - UI: A list view of locations and a form to add new ones (using the existing `AddressForm`).

## 4. Feature: Allocation Console
- **Target User:** Group Admin (and potentially System Admin).
- **Context:** Specific to an **Event**.
- **UI Components:**
    - **Unallocated Passengers List:** Passengers who have requested a lift but aren't assigned.
    - **Drivers/Offers List:** Available cars and seats.
    - **Map View (Optional/Future):** To visualize locations.
    - **"Magic Auto Allocate" Button:**
        - Logic: TBD (Waiting for user input/mockup).
        - *Placeholder Plan:* Basic matching (e.g., nearest pickup, or just filling seats sequentially) until details provided.
    - **Manual Drag-and-Drop (implied):** Ability to move passengers to cars.

## 5. Backend Requirements
- API to manage Group Meeting Points.
- API to fetch "Allocation State" for an event (Passengers + Offers + Meeting Points).
- API to `commit` allocations (save the state).

## 6. Next Steps
- Wait for User's UI mockups/details regarding the "Magic Auto Allocate" button.
- Begin schema design for Group Meeting Points.
