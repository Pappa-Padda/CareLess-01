# CareLess-01 Monorepo

This project is structured as a **Monorepo** using npm workspaces. It separates the frontend, backend, and shared logic into distinct packages while keeping them in a single repository for easier development.

## 📈 App Progress

### Completed Features
- [x] **Monorepo Setup:** Turbo/NPM Workspaces with Web (Next.js), API (Express), and Database packages.
- [x] **UI Architecture:**
    - Material UI v6 + Emotion + CSS Modules.
    - `AppTheme` provider for consistent theming (Light/Dark mode).
    - `NextAppDirEmotionCacheProvider` (`src/lib`) implemented for SSR style compatibility (fixes hydration errors).
- [x] **Branding:**
    - Renamed to **CAReLESS**.
    - Custom Favicons and Manifest for PWA.
    - Logo/Icon integration in Headers and Auth pages.
- [x] **Pages & Components:**
    - **Home:** Redesigned Hero with feature grid, hover effects, and clear CTA.
    - **Navigation:** Simplified AppBar with dynamic authentication states.
    - **Footer:** Unified `shared/Footer` with interactive Privacy/Terms modals.
    - **Auth:** Refactored to use a shared `AuthLayout` and centralized styling in `src/components/shared/auth`.
- [x] **Authentication & State:**
    - **Backend:** Functional Sign In, Sign Up, and Sign Out endpoints with JWT (stored in httpOnly cookies).
    - **Frontend:** Global `AuthContext` providing user state and actions across the app.
    - **Persistence:** Dynamic header updates (Name/Logout vs Sign In/Up) based on session.
- [x] **Driver Core:**
    - **Car Management:** Complete CRUD interface for drivers to manage their vehicles (`/cars`).
    - **Event Integration:** Drivers can see "Offer Lift" options in the Event List, enabled only for registered drivers.
- [x] **Passenger Core:**
    - **Backend Support:** `LiftRequest` model added.
    - **Event Integration:** Passengers can see "Request Lift" options in the Event List (toggle logic implemented).
- [x] **Database Updates:**
    - Renamed `DriverBooking` to `LiftOffer`.
    - Added `LiftRequest` model for passenger ride requests.
    - Updated `PassengerAllocation` to link with `LiftOffer`.

### Current Focus
- Polishing Frontend UI/UX.
- Implementing Group and Event management features.
- Connecting more Frontend features to Backend API.

## 📂 Directory Structure

```text
├── apps/
│   ├── web/                # Next.js Frontend (PWA)
│   │   ├── src/
│   │   │   ├── app/        # Application layer (routes, providers, etc.)
│   │   │   ├── assets/     # Static files (images, fonts, etc.)
│   │   │   ├── components/ 
│   │   │   │   ├── home/       # Home page specific components
│   │   │   │   ├── shared/     # Reusable components (Footer, Icons, Modals)
│   │   │   │   ├── shared-theme/ # MUI Theme definitions
│   │   │   │   └── ...
│   │   │   ├── config/     # Global configurations & env exports
│   │   │   ├── features/   # Feature-based modules
│   │   │   ├── hooks/      # Shared custom hooks
│   │   │   ├── lib/        # Reusable libraries (Emotion cache, etc.)
│   │   │   ├── stores/     # Global state management
│   │   │   ├── types/      # Local frontend types
│   │   │   └── utils/      # Shared utility functions
│   │   └── ...
│   │
│   └── api/                # Express.js Backend
│       ├── src/
│       │   ├── controllers/ # Business logic
│       │   ├── middleware/  
    │   │   ├── models/      # For Custom API Models
│       │   ├── routes/      # Endpoint definitions
│       │   └── index.ts     # Server entry point
│       └── ...
│
├── packages/
│   ├── database/           # Shared Prisma ORM Client
│   │   ├── prisma/         # Schema & Migrations
│   │   └── src/            # Exports the PrismaClient 
│   └── types/              # Shared TypeScript interfaces
│       └── src/            # Export shared types here
│
├── .env                    # Single Environment file
├── package.json            # Root configuration & scripts
```

## 🗺️ Application Navigation & Routes

The application is structured around a central sidebar navigation for authenticated users. Below is the mapping of sidebar menu items to their respective route paths, organized by section:

### General Setup
| Menu Item | Route Path | Description |
| :--- | :--- | :--- |
| **Profile Setup** | `/profile` | Manage user personal details and preferences. |
| **Groups** | `/groups` | View joined groups, create new ones, or join via ID. |

### Passenger Core
| Menu Item | Route Path | Description |
| :--- | :--- | :--- |
| **Event List** | `/event-list` | View upcoming events as a passenger. |
| **My Lifts** | `/my-lifts` | View scheduled lifts for the passenger. |
| **Lift Confirmation** | `/confirmation` | Final confirmation details for a booked lift. |

### Driver Core
| Menu Item | Route Path | Description |
| :--- | :--- | :--- |
| **Car Management** | `/cars` | Register and manage vehicles for drivers. |
| **My Event Bookings** | `/bookings` | Dashboard for drivers to see their confirmed passengers. |
| **Route View** | `/route` | Visual map and route details for a driver. |

### Admin Management
| Menu Item | Route Path | Description |
| :--- | :--- | :--- |
| **Admin Dashboard** | `/admin-dashboard` | System overview and management stats (Admin only). |
| **Event Management** | `/admin/events` | Create, update, and manage church events (Admin). |
| **Address Management** | `/addresses` | Manage reusable addresses and locations. |
| **Allocation Console** | `/allocation` | Interface for manual/auto assignment of passengers to drivers. |
| **Communication Center** | `/chat` | Messaging interface for coordination. |

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **MySQL** Database (Local or Cloud)

### Installation

Install all dependencies for the entire monorepo from the root:

```bash
npm install
```

### Environment Variables

We use a **single root `.env` file**. The `env-cmd` tool loads these variables into all workspaces during development.

Create a `.env` file in the root:

```env
# Database Connection
DATABASE_URL="mysql://root:password@localhost:3306/careless"

# Backend Configuration
API_PORT=4000

# Frontend Configuration
# Points to the API. In Prod, this will be your deployed API domain.
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

### Running Development Server

To start both the **Frontend** (port 3000) and **Backend** (port 4000) simultaneously:

```bash
npm run dev
```
*You will see blue logs for Web and magenta logs for API.*

## 🎨 Styling & UI Strategy

This project primarily uses **Material UI (MUI)** for components and theming, with **CSS Modules** for complex or custom layouts.

### 1. Framework & Theme
- **MUI (Material UI):** We use MUI v6+ components (e.g., `<Box>`, `<Stack>`, `<Typography>`, `<Button>`) as the core building blocks.
- **Theming:** The custom theme is defined in `apps/web/src/components/shared-theme/AppTheme.tsx` and applied via the `AppTheme` provider. This controls colors, typography, and component overrides.
- **Dark Mode:** Supported out-of-the-box via MUI's color scheme customization.

### 2. Component Styling
- **MUI System (`sx` prop):** For simple, one-off overrides (margins, padding, basic flexbox), use the `sx` prop directly on components.
  ```tsx
  <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
  ```
- **CSS Modules:** For complex layouts, animations, or extensive custom styling, use CSS Modules (e.g., `ComponentName.module.css`).
  - Create a `.module.css` file next to the component.
  - Import it as `import styles from './ComponentName.module.css';`.
  - Use classes like `className={styles.container}`.
  - This keeps JSX clean and styles scoped.

### 3. Icons & Assets
- **Icons:** We use `@mui/icons-material` for standard UI icons.
- **Custom Assets:** Custom SVG icons or images (like `SitemarkIcon`) are stored in `apps/web/src/components/shared` or public assets.

### 4. Layout
- **Responsive Design:** Use MUI's responsive syntax in `sx` (e.g., `width: { xs: '100%', md: '50%' }`) or media queries in CSS Modules.
- **Grid (MUI v6+):** Use the new Grid system.
  - Do NOT use the `item` prop.
  - Use the `size` prop for breakpoints: `<Grid size={{ xs: 12, md: 6 }}>`.
  - Use `<Grid container>` for parent wrappers.
- **Stack:** Prefer MUI's `<Stack>` for linear layouts and CSS Grid (via CSS Modules) for complex 2D layouts.
- **Page Wrapper:** Always use the `PageContainer` component (`src/components/shared/ui/PageContainer.tsx`) to wrap top-level pages for consistent padding, alignment, and max-width.

### 5. Standard UI Components
Always check `apps/web/src/components/shared/ui` before creating new primitive elements. Reuse:
- `PageHeading`: Standard H1-style heading.
- `CustomTextField`: Outlined text input with integrated labels.
- `CustomTable`: Standardized data table with loading states.
  - **IMPORTANT:** All data objects passed to the table MUST include a unique `id` property (e.g., `id: number | string`). If the backend returns `userId` or `uuid`, map it to `id` before passing to the component.
- `CustomDialog`: Reusable modal for forms and confirmations.
- `SubmitButton` / `CancelButton`: Consistent action buttons.
- `IconButton`: Use for icon-only actions. Note: `IconButton` does NOT support the `variant` prop.

## 💻 Coding Standards & Best Practices

### 1. Conditional Logic
- **Prefer `if-else` statements** over ternary operators (`? :`) for complex conditional rendering or logic to improve readability. Ternaries should only be used for very simple, single-line value assignments.
  ```tsx
  // PREFERRED
  if (isLoading) {
    return <CircularProgress />;
  }
  return <DataView />;

  // AVOID for complex blocks
  return isLoading ? <CircularProgress /> : <DataView />;
  ```

### 2. State Management
- Use `AuthContext` for user session data.
- Prefer local component state (`useState`) for form data.

## 🗄️ Database Management

The database logic is centralized in `@repo/database`.

### Standard Workflow

1.  **Modify Schema:** Edit `packages/database/prisma/schema.prisma`.
2.  **Push Changes:** Update your development database:
    ```bash
    npm run db:push
    ```
3.  **Generate Client:** Update the TypeScript client (automatically runs on install, but run this if you edit schema manually):
    ```bash
    npm run db:generate
    ```

### Deployment Note
We have added a `postinstall` script to the root `package.json`. This means whenever you (or Render/Vercel) run `npm install`, the Prisma Client will be automatically generated. You do not need to add a custom build command for this.

- **Open Prisma Studio** (GUI to view data):
  ```bash
  cd packages/database
  npx prisma studio
  ```

### Prisma Migration Steps (recommended for schema changes)

When you change the Prisma schema and need a migration rather than a quick push, follow these steps.

- From the repo root (loads root `.env` automatically):
  ```powershell
  # create a dev migration and apply it locally
  npx prisma migrate dev --schema packages/database/prisma/schema.prisma --name add-descriptive-name
  ```

- If you run commands inside the package folder, ensure Prisma can load env vars:
  - Create `packages/database/.env` or set `DATABASE_URL` in your shell before running.
  - Or run from repo root with `--schema` to point to the package schema.

- After running migrations, regenerate the client and run any seeds:
  ```powershell
  npm --prefix packages/database run generate
  npm --prefix packages/database run seed
  ```

- If Prisma complains about missing env vars when running inside a package, you can explicitly export them in PowerShell, for example:
  ```powershell
  $env:DATABASE_URL = "your_database_url_here"
  $env:JWT_SECRET = "your_jwt_secret_here"
  npx prisma migrate dev --schema packages/database/prisma/schema.prisma --name add-auth-and-role
  ```

## 🌐 Production & Deployment

In production, you will deploy the `apps/web` and `apps/api` separately (or containerized together), but they will no longer read from the root `.env` file. You must set environment variables in your hosting provider's dashboard.

### 1. Database
Use a managed MySQL provider (e.g., PlanetScale, AWS RDS, Railway).
- Set `DATABASE_URL` to the connection string provided by the host.

### 2. API (Backend)
Deploy to **Render** (Free Web Service).

**Critical Settings:**
- **Root Directory:** `.` (Leave empty / Project Root). **Do not set to apps/api**.
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start:api`
- **Env Vars:**
  - `DATABASE_URL`: Your cloud DB string.
  - `PORT`: (Optional, Render handles this automatically).

### 3. Web (Frontend)
Deploy `apps/web` to a static/Node host (e.g., Vercel, Netlify).
- **Env Vars:**
  - `NEXT_PUBLIC_API_URL`: Find it in the .env file.

## 🛠️ Root Scripts

- `npm run dev`: Starts all apps in parallel using `env-cmd` to load variables.
- `npm run build`: Builds all workspaces. Includes a fallback to support both local `.env` files and production CI/CD.
- `npm run lint`: Runs linting across all workspaces.
- `postinstall`: Automatically generates the Prisma client after install. Safe for both local and production.