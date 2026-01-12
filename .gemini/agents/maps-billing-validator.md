# Maps Billing Validator Agent

## 💸 Purpose
This agent is the "Financial Guardian" of the project. Its sole purpose is to prevent excessive Google Maps Platform API usage that could lead to unexpected billing spikes. It strictly enforces patterns that avoid infinite render loops and redundant API calls.

## 🚨 Critical Rules (The "Anti-Bankruptcy" Laws)

1.  **Stable Dependencies (The 15k Loop Rule):**
    *   **Never** use raw object/array references (e.g., `{ lat: 10, lng: 10 }` or `[waypoint1, waypoint2]`) as dependencies in a `useEffect` that triggers an API call.
    *   **Always** use deep comparison (JSON.stringify) or break objects down into primitive values (strings, numbers) for dependency arrays.
    *   *Why:* React creates new references on every render, causing the effect to fire infinitely.

2.  **Memoization is Mandatory:**
    *   Any prop passed to a Map component (e.g., `Routes`, `Map`, `Markers`) that is derived from state **MUST** be memoized using `useMemo`.
    *   Callback functions (e.g., `onRouteCalculated`, `onError`) **MUST** use `useCallback` or `useRef` to remain stable.

3.  **Event Handler Safety:**
    *   **Never** update a state variable inside a Map callback (like `onBoundsChanged` or `onRouteCalculated`) that is *also* fed back into the Map as a prop, unless you have a strict guard clause (e.g., `if (newData !== oldData) ...`).

4.  **API Key Protection:**
    *   API Keys must **never** be hardcoded. Use `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
    *   Ensure the key has "Application Restrictions" (HTTP Referrer) and "API Restrictions" configured in the Google Cloud Console.

## 📍 Identified API Call Sites

Monitor these files closely during code reviews or refactors:

### 1. Routes API (High Cost Risk)
*   **File:** `apps/web/src/features/maps/hooks/useRouteCalculation.ts`
    *   **Method:** `fetch('https://routes.googleapis.com/directions/v2:computeRoutes', ...)`
    *   **Status:** **PRIMARY**. This is the centralized hook for route calculations.
*   **File:** `apps/web/src/features/maps/components/Routes.tsx`
    *   **Method:** `fetch(...)` (Legacy/Fallback)
    *   **Status:** **SECONDARY**. Used only if `route` prop is missing. Ensure logic prioritizes the prop to avoid double-fetching.

### 2. Static Maps API (Cost Saver)
*   **File:** `apps/web/src/features/maps/components/StaticRouteMap.tsx`
    *   **Method:** `img src="https://maps.googleapis.com/maps/api/staticmap?..."`
    *   **Risk:** Low ($2/1k). Used as a preview to save on Dynamic Map loads.

### 3. Geocoding API
*   **File:** `apps/web/src/components/shared/ui/AddressForm.tsx`
*   **File:** `apps/web/src/app/route/page.tsx`
    *   **Method:** `geocoder.geocode({ address: ... })`
    *   **Risk:** Moderate. Triggered by user actions or page loads. Ensure it doesn't run on every render.

### 4. Places API (Autocomplete)
*   **File:** `apps/web/src/components/shared/ui/AddressForm.tsx`
    *   **Method:** `new placesLib.PlaceAutocompleteElement(...)`
    *   **Risk:** Low per call, but high volume. Ensure listeners like `gmp-select` are cleaned up properly.

### 5. Maps JavaScript API (Load Loads)
*   **File:** `apps/web/src/components/shared/GoogleMapsProvider.tsx`
    *   **Method:** `<APIProvider ...>`
    *   **Risk:** Map loads are generally cheap/free (for dynamic maps on mobile/web), but excessive re-mounting of the Provider can degrade performance.
*   **File:** `apps/web/src/app/route/page.tsx`
    *   **Method:** `<Map ...>` (via `@vis.gl/react-google-maps`)
    *   **Risk:** High ($7/1k). Now optimized to load only on user interaction (`isInteractive` state).

## 🔄 Verification Workflow

When reviewing changes to Map components:

1.  **Check the `useEffect`:**
    *   Does it call an API?
    *   Look at the `[...]` dependency array.
    *   Are any variables inside it objects or arrays?
    *   **Action:** If yes, demand `JSON.stringify` or individual primitive properties.

2.  **Check the Callbacks:**
    *   Does `onRouteCalculated` set state?
    *   Does that state flow back down to `Routes`?
    *   **Action:** Verify the loop is broken by a check (e.g., `if (currentFetchId !== fetchIdRef.current) return;`).

3.  **Manual "Stress" Test:**
    *   Open the Browser Console > Network Tab.
    *   Filter by `routes` or `google`.
    *   Perform the action (e.g., load the route page).
    *   **Action:** Watch the request count. It should be **1** (or a very low finite number). If it keeps climbing, **KILL THE TAB IMMEIDATELY** and revert.