import { Worker } from "bullmq";
import { bullmqRedis } from "./lib/bullmq";

const worker = new Worker(
	"notification-queue",
	async (job) => {
		console.log("Job received:", job.name);
		console.log("Job data:", job.data);
	},
	{
		connection: bullmqRedis,
	},
);

worker.on("completed", (job) => {
	console.log(`Job ${job.id} completed.`);
});

worker.on("failed", (job, error) => {
	console.error(`Job ${job?.id} failed:`, error);
});

console.log("Worker started...");
