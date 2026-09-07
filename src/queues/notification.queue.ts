import { Queue } from "bullmq";

import { bullmqRedis } from "../lib/bullmq.js";

export const notificationQueue = new Queue("notification-queue", {
	connection: bullmqRedis,
});
