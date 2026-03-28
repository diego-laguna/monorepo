# Product Requirements: Scraper Orchestrator

## 1. Business Logic Requirements

### 1.1 Job Scheduling & Multi-Tier Service
- **Paid Tier**: Paid users MUST be assigned a high priority (e.g., `priority: 10`). Their jobs MUST bypass standard queues or be processed by dedicated high-speed workers.
- **Free Tier**: Free users MUST be assigned standard priority (e.g., `priority: 0`). Their jobs SHOULD only be processed when no high-priority jobs are pending.
- **Queue Configuration**: The message queue infrastructure MUST enforce these priorities during task assignment.

### 1.2 Account Management & Billing Hooks
- **Payment Defaults**: If a user's account status becomes `DISABLED` due to missed payments, the system MUST intercept all of their `PENDING` jobs and switch them to `PAUSED`.
- **Account Resumption**: When a disabled account is re-enabled, any `PAUSED` jobs MUST automatically revert to `PENDING` while retaining their original priority tier.

## 2. Security Requirements

### 2.1 Worker Access Control
- **Worker Authentication**: The callback endpoint for receiving job results MUST be protected by Mutual TLS or Token Authentication to ensure only authorized Worker nodes can post results.

### 2.2 Attack Mitigation
- **Payload Validation**: The system MUST perform strict schema and structure validation on the job `instructions` to prevent arbitrary command or injection attacks in the worker environment.
- **URL Filtering**: The system MUST enforce a blocklist of internal IP ranges (e.g., localhost, AWS metadata server, corporate subnets) for any `target_url` to prevent SSRF (Server Side Request Forgery) attacks.
