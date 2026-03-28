# Technical Specification: Scraper Orchestrator

## 1. Overview
The Scraper Orchestrator is a centralized service responsible for receiving scraping requirements from users, managing the lifecycle of scraping jobs, and coordinating with distributed worker nodes (Scraper Apps) to execute these tasks.

> [!IMPORTANT]
> The Orchestrator is the source of truth for the system's state. It manages the database schema and migrations through the `@repo/database` package, which is shared across the monorepo.

## 2. System Architecture
The system follows a decoupled worker pattern to ensure scalability and resilience.

- **gRPC Server**: Exposes internal methods for job management and user status updates.
- **Message Broker/Queue**: Decouples the Orchestrator from the Workers (e.g., Redis).
- **Scraper Worker**: Stateless service that performs the actual browser automation/scraping.

## 3. Database Schema
The system requires a persistent store to manage job state and user accounts. The schema is implemented using **Prisma** in the `@repo/database` workspace.

| Field | Type | Constraint |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `status` | ENUM | PENDING, RUNNING, COMPLETED, FAILED, PAUSED |
| `priority` | INTEGER | DEFAULT 0 (Higher is faster) |
| `target_url` | TEXT | Not Null |
| `instructions` | JSONB | Not Null |
| `raw_results` | JSONB | Nullable |
| `error_log` | TEXT | Nullable |
| `created_at` | TIMESTAMP | DEFAULT NOW() |

## 4. gRPC Interface
Defined in `@repo/grpc/proto/orchestrator.proto`.

### Job Management
| Method | Request | Response | Description |
| :--- | :--- | :--- | :--- |
| `LaunchJob` | `LaunchJobRequest` | `JobDetails` | Enqueues a new job into BullMQ. |
| `GetJob` | `GetJobRequest` | `JobDetails` | Retrieves current status and results. |
| `CancelJob` | `GetJobRequest` | `Empty` | Cancels a pending or running job. |

### Account & Policy Management
| Method | Request | Response | Description |
| :--- | :--- | :--- | :--- |
| `UpdateUserStatus` | `UpdateUserStatusRequest` | `Empty` | Disables user and pauses pending jobs. |
| `SetUserTier` | `SetUserTierRequest` | `Empty` | Updates user tier (FREE/PAID). |

## 5. Requirements Reference
For detailed business, scheduling, and security requirements, refer to the separate [Product Requirements](./requirements.md) document.