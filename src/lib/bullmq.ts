import IORedis from "ioredis";

import config from "../config";

export const bullmqRedis = new IORedis({
	username: config.redis_user,
	password: config.redis_password,
	host: config.redis_host,
	port: Number(config.redis_port),
	maxRetriesPerRequest: null,
});
