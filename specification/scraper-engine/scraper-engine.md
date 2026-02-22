# Scraper Engine Specification

## 1. Overview
The `scraper-engine` is a standalone background worker service responsible for executing asynchronous web scraping tasks. It consumes jobs from a shared Redis queue and uses a headless browser to exact data from target URLs.

## 2. Architecture
- **Pattern**: Producer-Consumer.
- **Queue System**: Redis-backed queue using `bullmq`.
- **Browser Automation**: `puppeteer` (Headless Chrome).
- **Communication**: De-coupled from the producer; communication happens strictly via Redis.

## 3. Configuration
The application is configured via environment variables:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `REDIS_HOST` | Hostname of the Redis server | `localhost` |
| `REDIS_PORT` | Port of the Redis server | `6379` |

## 4. Interfaces

### Scraper Interface
The core scraping logic must adhere to the following interface to ensure modularity (e.g., swapping Puppeteer for Playwright).

```typescript
interface Scraper {
  /** Initialized the browser instance */
  init(): Promise<void>;
  
  /** Navigates the browser to the specified URL */
  goTo(url: string): Promise<void>;
  
  /** Extracts the title from the current page */
  getTitle(): Promise<string>;
  
  /** Takes a screenshot of the current page and saves it to the specified path */
  takeScreenshot(path: string): Promise<void>;
  
  /** Closes the browser instance and cleans up resources */
  close(): Promise<void>;
}
```

## 5. Job Processing

### Queue Definitions
- **Queue Name**: `SCRAPE_QUEUE` (defined in `@repo/jobs`)
- **Job Name**: `SCRAPE_JOB` (defined in `@repo/jobs`)

### Job Data Structure
The input job data must match the `ScrapeJob` interface:
```typescript
interface ScrapeJob {
  url: string;
}
```

### Worker Logic
1.  **Validation**: The worker must only process jobs matching `SCRAPE_JOB_NAME`.
2.  **Execution**:
    -   Extract `url` from job data.
    -   Navigate to `url`.
    -   Extract page title.
    -   Log success message: `Job {id} complete. Title: {title}`.
3.  **Error Handling**:
    -   If any step fails, log the error.
    -   Throw the error to let BullMQ mark the job as `failed`.

## 6. Application Lifecycle

### Startup
1.  Initialize the `Scraper` implementation (launch browser).
2.  Connect to Redis.
3.  Start the `Worker` to listen for jobs.
4.  Log "Scraper Engine Worker started...".

### Shutdown
The application handles `SIGINT` for graceful shutdown:
1.  Close the BullMQ worker.
2.  Close the Scraper instance (browser).
3.  Exit process with code `0`.
