# Samkiel Bot Deployment Platform

## Project Overview

This project is a centralized web platform designed for the deployment, management, and orchestration of WhatsApp bot instances. It serves as a management layer that sits between the end-user and the underlying infrastructure (Pterodactyl).

**Purpose**: To allow users to provision, configure, and manage WhatsApp bots without needing to interact directly with command-line tools, raw servers, or complex git workflows.

**Target Audience**: 
- Users seeking to run their own WhatsApp automated assistants.
- Administrators managing a BOT of bot instances.

**Problem Solved**: Abstracts the complexity of server provisioning, git configuration, and application lifecycle management into a user-friendly web dashboard.

---

## What This Repository Is / Is Not

**This Repository IS:**
- A Next.js web application (Frontend & API).
- An orchestration engine that controls Pterodactyl servers.
- A user account and credit management system.

**This Repository is NOT:**
- The WhatsApp bot logic itself.
- A collection of WhatsApp plugins or commands.

**Separation of Concerns:**
- **This Platform**: Handles "Meta-operations" (Deploy, Start, Stop, Delete, Billing).
- **Bot Repository** (`samkiell/SAMKIEL-AI`): Contains the actual application logic that runs inside the containers spawned by this platform.

---

## High-Level Architecture

The system follows a typical 3-tier architecture with an additional infrastructure integration layer.

### 1. Frontend (Next.js)
- Built with React 18 and Tailwind CSS.
- Provides the User Interface for authentication, dashboard, deployment wizard, and billing.
- Uses `socket.io-client` for real-time updates (console logs, pairing codes, status changes).

### 2. Backend (Next.js API + Custom Server)
- **API Routes**: Handle standard CRUD operations (Users, Deployments, Credits).
- **Custom Express Server**: Hosts the Socket.io instance for real-time communication.
- **Orchestration Service**: Interacts with external APIs to provision resources.

### 3. Infrastructure Layer
- **Pterodactyl Panel**: Acts as the container orchestration engine.
- **GitHub**: Stores user-specific configurations in isolated branches.

---

## Core Features

### Authentication & User Management
- Secure JWT-based authentication.
- Role-based access control (User vs Admin).
- Credit-based resource usage system.

### Bot Deployment Flow
- Automated provisioning of Docker containers.
- Dynamic generation of configuration files (`settings.js`).
- Git branch management for user isolation.

### Pairing Workflow
- Real-time interception of the WhatsApp Pairing Code from the server console.
- WebSocket push of the code to the frontend UI.
- Elimination of the need for users to view raw server logs.

### Management Dashboard
- Real-time status monitoring (Online, Offline, Starting).
- Power controls (Start, Stop, Restart, Kill).
- Resource usage monitoring (CPU, RAM, Disk).

---

## Deployment Flow (Step by Step)

When a user deploys a bot, the following sequence occurs:

1.  **User Action**: User submits the "Deploy" form with a Bot Name and WhatsApp Number.
2.  **Validation**: Backend validates user credits and input formats.
3.  **Configuration (GitHub)**:
    -   System fetches the template `settings.js` from the Bot Repository.
    -   System injects the specific `botNumber` and owner configuration.
    -   System creates a dedicated git branch (e.g., `bot-1234567890`) and commits the config.
4.  **Infrastructure Provisioning (Pterodactyl)**:
    -   System requests a new server allocation via Pterodactyl API.
    -   Server is configured to clone the specific git branch created in Step 3.
    -   Environment variables (RAM, CPU limits) are applied based on the user's plan.
5.  **Startup & Monitoring**:
    -   Server starts and runs `npm install`.
    -   Backend connects to the server's WebSocket console.
    -   System scans logs for the regex pattern `Your Pairing Code : XXXX-XXXX`.
6.  **Result**: The code is delivered to the user's browser via Socket.io. The user enters this code on their phone to link the bot.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 18)
- **Styling**: Tailwind CSS
- **State/Effects**: React Context, SWR (implied), Socket.io Client

### Backend
- **Runtime**: Node.js
- **Server**: Express (Custom Next.js server entry point)
- **Database**: MongoDB (Mongoose ODM)
- **Job Scheduling**: node-cron (Resource usage calculation, maintenance)

### Infrastructure Integration
- **Container Platform**: Pterodactyl (Panel & Wings)
- **Version Control API**: Octokit (GitHub REST API)
- **WebSocket**: `ws` (For Pterodactyl console streams)

---

## Environment Variables

The application relies on the following environment variables. Do NOT commit values to version control.

### Application Config
- `PORT`: Port for the application (default to 3000).
- `NODE_ENV`: `production` or `development`.
- `NEXT_PUBLIC_API_URL`: Public URL for frontend API calls.

### Database
- `MONGO_URI`: Connection string for MongoDB.

### Authentication
- `JWT_SECRET`: Secret key for signing JSON Web Tokens.

### GitHub Integration
- `GITHUB_TOKEN`: Personal Access Token for managing the Bot Repository (Reading/Writing contents and branches).

### Pterodactyl Integration
- `PTERODACTYL_DOMAIN`: Base URL of the Pterodactyl Panel.
- `PTERODACTYL_APP_KEY`: Application API Key (Admin) for server creation.
- `PTERODACTYL_CLIENT_KEY`: Client API Key for user-level interactions.
- `PTERODACTYL_NEST_ID`: ID of the Nest to deploy into.
- `PTERODACTYL_EGG_ID`: ID of the Egg (Node.js environment).
- `PTERODACTYL_NODE_ID`: Technical ID of the node to deploy servers on.

### Payments
- `PAYSTACK_SECRET_KEY`: Secret key for Paystack payment verification.

---

## Security & Isolation Model

### Git Isolation
Every bot deployment utilizes a unique git branch. This ensures that one user's configuration (custom logic, owner numbers) does not accidentally leak into another user's deployment if they were to pull updates.

### Container Isolation
Bots run in isolated Docker containers managed by Pterodactyl. Users cannot access the file system or processes of other users.

### Credential Safety
End-users never see raw API keys or database credentials. The platform acts as a proxy for all sensitive infrastructure operations.

---

## Current State vs Future Roadmap

### Implemented
- [x] User Authentication & Registration.
- [x] Basic Pterodactyl Server Deployment.
- [x] Real-time Pairing Code extraction.
- [x] Power Actions (Start/Stop/Restart).
- [x] Credit-based billing system foundation.

### Planned / In Progress
- [ ] Automated recurring subscription billing (vs currently implemented credit top-ups).
- [ ] Advanced file manager for users to upload custom plugins.
- [ ] Multi-node load balancing (currently single node targeted).
- [ ] Automated backup & snapshots.

---

## Glossary

- **Deployment**: A single instance of the bot software running in a container.
- **Pairing**: The process of linking a WhatsApp account to the bot instance using the official MD (Multi-Device) pairing code method.
- **Egg**: Pterodactyl terminology for a specific software environment configuration (e.g., Node.js 22).
- **Nest**: A category grouping for Eggs (e.g., "Whatsapp Bots").
