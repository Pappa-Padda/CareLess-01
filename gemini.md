# CareLess-01 Monorepo

This project is structured as a **Monorepo** using npm workspaces. It separates the frontend, backend, and shared logic into distinct packages while keeping them in a single repository for easier development.

## 📂 Directory Structure

```text
├── apps/
│   ├── web/                # Next.js Frontend (PWA)
│   │   ├── src/
│   │   │   ├── app/        # Application layer (routes, providers, etc.)
│   │   │   ├── assets/     # Static files (images, fonts, etc.)
│   │   │   ├── components/ # Shared UI components
│   │   │   ├── config/     # Global configurations & env exports
│   │   │   ├── features/   # Feature-based modules
│   │   │   ├── hooks/      # Shared custom hooks
│   │   │   ├── lib/        # Reusable libraries (API clients, etc.)
│   │   │   ├── stores/     # Global state management
│   │   │   ├── testing/    # Test utilities and mocks
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
└── package.json            # Root configuration & scripts
```

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
  - `NEXT_PUBLIC_API_URL`: The full URL of your deployed API (e.g., `https://api.myapp.com`).

## 🛠️ Root Scripts

- `npm run dev`: Starts all apps in parallel using `env-cmd` to load variables.
- `npm run build`: Builds all workspaces. Includes a fallback to support both local `.env` files and production CI/CD.
- `npm run lint`: Runs linting across all workspaces.
- `postinstall`: Automatically generates the Prisma client after install. Safe for both local and production.
