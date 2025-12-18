# Project Overview

This is a **Monorepo** containing a Next.js frontend and a separate Express.js API.
- **Frontend**: Next.js (PWA) in `apps/web`.
- **Backend**: Express.js API in `apps/api`.
- **Database**: Prisma with MySQL in `packages/database`.
- **Types**: Shared TypeScript types in `packages/types`.

## 🚀 Getting Started

### Prerequisites

- Node.js installed.
- A running MySQL database instance.
- A `.env` file in the root directory containing your database connection string:
  ```env
  DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
  ```

### Installation

From the root directory, install all dependencies:
```bash
npm install
```

### Development Server

To start both the **Frontend** and the **API** simultaneously, run from the root:

```bash
npm run dev
```

#### Individual Services

If you want to run only one service:

- **Web (Next.js)**: `npm run dev --workspace=web` (Runs on http://localhost:3000)
- **API (Express)**: `npm run dev --workspace=api` (Runs on http://localhost:4000)

## 🗄️ Database

This project uses **MySQL** as its database provider via Prisma, located in `packages/database`.

### Managing the Database

You should run these commands from the root using workspaces or by navigating to `packages/database`.

- **Push schema (Prototyping):**
  ```bash
  npm run push --workspace=@repo/database
  ```

- **Regenerate Prisma Client:**
  ```bash
  npm run generate --workspace=@repo/database
  ```

- **Open Prisma Studio:**
  ```bash
  cd packages/database
  npx prisma studio
  ```

## 🛠️ Scripts (Root)

- `dev`: Runs all apps in development mode.
- `build`: Builds all apps and packages.
- `lint`: Runs ESLint across all workspaces.