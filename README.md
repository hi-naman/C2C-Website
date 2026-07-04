# Code to Career (C2C) student platform

Welcome to the **Code to Career (C2C)** project, a premium web portal for student coaching, programming contests, mock hackathons, leaderboards, discussion forums, and academic calendar coordination.

---

## 1. Project Directory Structure
This repository splits the codebase into frontend and backend workspaces:

*   **`frontend/`**: The client-side dashboard built with **Next.js (App Router), React 19, Tailwind CSS v4, Zustand, React Query, and shadcn/ui**.
*   **`backend/`**: The server-side API engine built with **Node.js, Express, TypeScript, Prisma (ORM), PostgreSQL, and Redis**.

---

## 2. Prerequisites
Before running the application, make sure you have the following installed on your machine:
*   [Node.js (v20+ or v24+)](https://nodejs.org/)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Recommended for zero-configuration local database setup)
*   [Git](https://git-scm.com/)

---

## 3. How to Run Using Docker Compose (Recommended)
The easiest way to run the entire backend stack along with a local database and cache is to use Docker:

1.  **Configure Environment Variables**:
    *   Navigate into `backend/`.
    *   Copy `.env.example` to `.env` and fill out your variables:
        ```bash
        cp .env.example .env
        ```
2.  **Start the Stack**:
    *   From the `backend/` folder, run:
        ```bash
        docker compose up -d
        ```
    *   This automatically downloads and starts:
        *   **PostgreSQL** (Port 5432)
        *   **Redis** (Port 6379)
        *   **Backend App Container** (Port 5000) and executes Prisma migrations automatically.
3.  **Start the Frontend**:
    *   Navigate into `frontend/`.
    *   Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    *   Install dependencies and run:
        ```bash
        npm install
        npm run dev
        ```
    *   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. How to Run Locally (Manual setup)
If you prefer to run services individually without Docker, configure local PostgreSQL and Redis servers and follow these instructions:

### A. Backend Setup
1.  Navigate to `backend/`.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your local `.env` values (Database URL, Redis URL, JWT, Google OAuth, Cloudinary).
4.  Generate the Prisma ORM Client and execute migrations:
    ```bash
    npx prisma generate
    npx prisma migrate dev
    ```
5.  Start the development server:
    ```bash
    npm run dev
    ```
    *The API will run on `http://localhost:5000`.*

### B. Frontend Setup
1.  Navigate to `frontend/`.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure `.env` with `NEXT_PUBLIC_API_URL=http://localhost:5000`.
4.  Start Next.js dev server:
    ```bash
    npm run dev
    ```
    *The client portal will run on `http://localhost:3000`.*
