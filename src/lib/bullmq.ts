import { Redis } from "ioredis";

import config from "../config/index.js";

export const bullmqRedis = new Redis({
	username: config.redis_user,
	password: config.redis_password,
	host: config.redis_host,
	port: Number(config.redis_port),
	maxRetriesPerRequest: null,
});
