import { Worker, Job } from "bullmq";
import { logger } from "@repo/logger";
import { PuppeteerScraper } from "./scrapers/puppeteer.scraper.js";
import { ScrapeJob, SCRAPE_QUEUE_NAME, SCRAPE_JOB_NAME } from "@repo/jobs";

const scraper = new PuppeteerScraper();

// Redis connection settings
const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

const processJob = async (job: Job<ScrapeJob>) => {
  if (job.name !== SCRAPE_JOB_NAME) return;
  
  const { url } = job.data;
  logger.info(`Processing job ${job.id}: Scraping ${url}`);

  try {
    await scraper.goTo(url);
    const title = await scraper.getTitle();
    logger.info(`Job ${job.id} complete. Title: ${title}`);
  } catch (error) {
    logger.error(`Job ${job.id} failed:`, error);
    throw error;
  }
};

const main = async () => {
  await scraper.init();
  logger.info("Scraper Engine Worker started. Waiting for jobs...");

  const worker = new Worker(SCRAPE_QUEUE_NAME, processJob, { connection });

  worker.on("completed", (job) => {
    logger.info(`Job ${job.id} has completed!`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Job ${job?.id} has failed with ${err.message}`);
  });
  
  process.on('SIGINT', async () => {
    await worker.close();
    await scraper.close();
    process.exit(0);
  });
};

main();
