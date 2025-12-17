# Project Overview

This is a **Next.js** application configured as a PWA (Progressive Web App) using `@ducanh2912/next-pwa`. It uses **TypeScript** for type safety and **Prisma** as an ORM to interact with a **MySQL** database.

## 🚀 Getting Started

### Prerequisites

- Node.js installed.
- A running MySQL database instance.
- A `.env` file in the root directory containing your database connection string:
  ```env
  DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
  ```

### Development Server

To start the development server, run:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🗄️ Database

This project uses **MySQL** as its database provider.

### Managing the Database

We use **Prisma** to manage the database schema.

- **Apply schema changes (Development):**
  To create a migration and apply it to the database:
  ```bash
  npx prisma migrate dev
  ```

- **Push schema (Prototyping):**
  To push the schema state to the database without creating a migration file (useful for quick prototyping):
  ```bash
  npx prisma db push
  ```

- **Open Prisma Studio:**
  To view and edit your data in a GUI:
  ```bash
  npx prisma studio
  ```

- **Regenerate Prisma Client:**
  If you make changes to `schema.prisma`, you may need to regenerate the client manually (though `postinstall` handles this often):
  ```bash
  npx prisma generate
  ```

## 🛠️ Scripts

- `dev`: Runs the app in development mode.
- `build`: Builds the app for production.
- `start`: Starts the production server.
- `lint`: Runs ESLint.
- `postinstall`: Generates the Prisma Client.
