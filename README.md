# SAMKIEL BOT - Deployment Platform

## High Level Overview
This platform is a comprehensive, full-stack orchestration system designed to automate the deployment, management, and scaling of containerized WhatsApp agents. It functions as a centralized control plane, abstracting complex infrastructure requirements—such as Docker containerization, version control management, and resource provisioning—behind a streamlined user interface. The system integrates directly with Pterodactyl for node management and GitHub for dynamic configuration injection, providing a robust "Bot Vault" for persistent automation services.

## Problem Statement
Deploying stateful, always-online automation agents requires significant technical overhead. Users typically need to manage virtual private servers (VPS), handle process daemonization (PM2/Docker), and manually configure environment variables for every instance. This complexity creates a barrier to entry and introduces security risks related to credential mismanagement and resource exhaustion. Furthermore, managing the lifecycle of multiple distinct agents across a distributed infrastructure is operationally expensive and error-prone without a centralized management layer.

## Solution Architecture
The platform solves these challenges by implementing a highly coupled orchestration pipeline.
1.  **Configuration Injection**: User inputs are sanitized and programmatically injected into a `settings.js` configuration file.
2.  **Version Control as Middleware**: The system authenticates with GitHub to create unique, isolated branches (e.g., `bot-[id]`) for each deployment. This ensures that every active container pulls a specific, immutable configuration state.
3.  **Container Orchestration**: The backend interfaces with the Pterodactyl API (Wingman) to provision isolated Docker containers on bare-metal nodes.
4.  **Real-Time Monitoring**: A custom Express/Socket.IO layer maintains persistent connections to the infrastructure to stream terminal logs and deployment status back to the client in real-time.

## Core Features

### Infrastructure Orchestration
*   **Automated Provisioning**: Zero-touch creation of server instances with predefined resource allocations (RAM, CPU, Disk).
*   **Resource Guardrails**: Intelligent pre-flight checks prevent deployment if target nodes exceed critical thresholds (e.g., >80% RAM usage), ensuring platform stability.
*   **Lifecycle Management**: Full control over component lifecycle, allowing users to start, stop, restart, or terminate instances via API calls.

### Dynamic Configuration Engine
*   **Runtime Injection**: Automates the customization of agent logic by writing owner credentials, feature toggles (security modes, privacy settings), and branding directly into the source code before deployment.
*   **Branch-Based Isolation**: Utilizes Git branching strategies to separate configurations, preventing cross-contamination between tenants sharing the same base codebase.

### Administrative Governance
*   **System Telemetry**: Provides administrators with a high-level view of cluster health, including aggregate resource consumption.
*   **Sovereign Control**: Enables administrative override for any tenant, allowing for force-termination or restart of rogue processes.
*   **Audit Logging**: Immutable logging of critical actions, such as user deletion or forced infrastructure adjustments.

### Economic Model
*   **Credit-Based Computation**: Implements a billing system where resource uptime equates to credit consumption ("Daily Burn").
*   **Usage Enforcement**: Background schedulers monitor credit balances, automatically pausing or terminating services for accounts with insufficient funds.

## Deployment Lifecycle
The deployment process follows a strict linear workflow to ensure data integrity and successful initialization:
1.  **Validation**: The system validates user credits and checks the health of the target infrastructure node.
2.  **Versioning**: A new branch is created in the central repository derived from the master template.
3.  **Injection**: Specific configuration files are committed to this branch.
4.  **Provisioning**: A request is sent to the Pterodactyl API to create a server bound to the newly created branch.
5.  **Initialization**: The container spins up, installs dependencies, and the backend begins polling for 'online' status.
6.  **Handover**: Once health checks pass, control is handed over to the user dashboard.

## Technology Stack

### Frontend
*   **Next.js 16.0.0**: React 18-based framework for server-side rendering and static generation.
*   **Tailwind CSS**: Utility-first styling for a scalable design system.
*   **Framer Motion**: Library for complex state-based animations.

### Backend & Middleware
*   **Node.js & Express**: Custom server entry point handling API routing and WebSocket upgrades.
*   **Socket.IO**: Bi-directional event-based communication for live logs and status updates.
*   **MongoDB & Mongoose**: Document store for user profiles, deployment metadata, and audit trails.

### Infrastructure Services
*   **Pterodactyl (Panel & Wings)**: Management interface for Dockerized application containers.
*   **GitHub API (Octokit)**: Programmatic management of repositories and branches.
*   **Paystack**: Payment gateway integration for credit transactions.

## Security and Isolation Model
*   **Container Isolation**: Each deployed agent runs in its own Docker container with strict CPU and memory limits, preventing "noisy neighbor" issues.
*   **Source Code Isolation**: Unique Git branches ensure that configuration leaks between users are impossible at the source level.
*   **Authentication**: JWT-based stateless authentication protects API routes, with role-based access control (RBAC) strictly separating User and Admin capabilities.

## Scalability and Constraints
*   **Vertical Scaling**: The current architecture enforces a hard limit of 2 deployments per user to prevent abuse.
*   **Resource Guardrails**: automated guards prevent scheduling on nodes with >85% Disk or CPU utilization, protecting the physical hardware from saturation.
*   **Single-Node Tenancy**: Deployments are currently routed to a specific high-performance node (Node 3) to simplify monitoring, with logic in place for future multi-node horizontal scaling.

## Project Structure Overview
```text
samkiel-bot-deployment/
├── components/          # Reusable UI elements (Charts, Status Indicators)
├── lib/                 # Business logic and external adapters
│   ├── controllers/     # Orchestration logic (Deployment, Auth, Payment)
│   ├── services/        # Background workers (Health Checks, GitHub Sync)
│   ├── models/          # Database schemas
│   └── utils/           # Shared helper functions
├── pages/               # Routing layer
│   ├── admin/           # Secured administrative interfaces
│   ├── api/             # Internal API endpoints
│   └── deploy/          # Deployment configuration wizard
├── public/              # Static assets
└── server.js            # Unified application server
```

## Current State
The platform is fully operational for production workflows. Users can register, purchase credits, and deploy fully functional instances. The integration with Pterodactyl is stable, and the "Daily Burn" credit logic effectively monetizes the service. Admin oversight tools are active and capable of managing the current user base.

## Roadmap
*   **Horizontal Scaling**: Implementing dynamic node selection to distribute load across multiple physical servers.
*   **Tiered Feature Gating**: Introducing subscription tiers that unlock advanced bot capabilities (e.g., higher memory limits, priority support).
*   **Automated Healing**: Enhancing the health check service to automatically attempt restarts on crashed containers without user intervention.

## Author Note
This project represents a rigorous approach to full-stack engineering, prioritizing system stability and architectural cleanliness over rapid feature expansion. It demonstrates the ability to build complex, integrated platforms that bridge the gap between software development and infrastructure operations.
