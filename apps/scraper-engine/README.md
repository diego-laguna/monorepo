# Scraper Engine

The `scraper-engine` is a **background worker service** designed to handle asynchronous web scraping tasks.

## Architecture Overview

It follows a **Producer-Consumer** pattern using a Redis-based job queue.

- **Queue System**: Uses `bullmq` to manage jobs.
- **Browser Automation**: Uses `puppeteer` to control a headless Chrome browser.
- **Entry Point**: `src/main.ts`

## Key Components

### The Worker (`src/main.ts`)

The app starts a `Worker` that listens to a specific Redis queue (`SCRAPE_QUEUE_NAME` from `@repo/jobs`).

- It connects to Redis at `localhost:6379`.
- It processes only jobs with the name `SCRAPE_JOB_NAME`.
- When a job is received, it extracts the `url` from `job.data` and triggers the scraping process.

### The Scraper (`src/scrapers/puppeteer.scraper.ts`)

This class encapsulates the Puppeteer logic:

- **`init()`**: Launches a headless browser instances with specific args (`--no-sandbox`).
- **`goTo(url)`**: Navigates the browser to the target URL.
- **`getTitle()`**: Extracts the page title (currently this is the only data it extracts).
- **`takeScreenshot(path)`**: Has capability to take screenshots, though irrelevant to the current main job flow.

## Execution Flow

1. **Startup**: The app initializes the Puppeteer browser instance and starts the BullMQ worker.
2. **Job Received**: The worker picks up a job containing a URL.
3. **Processing**:
   - Logs "Processing job..."
   - Navigates to the URL.
   - Extracts the page title.
4. **Completion**: Logs the result ("Job complete. Title: ...") and marks the job as completed in Redis.
5. **Failure**: If any step fails (e.g., navigation error), it logs the error and throws it, which marks the job as failed in Redis (allowing for retries if configured).
