import { Queue } from "bullmq";

import { bullmqRedis } from "../lib/bullmq";

export const notificationQueue = new Queue("notification-queue", {
	connection: bullmqRedis,
});
