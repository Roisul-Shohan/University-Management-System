import app from "./app.js";
import config from "./config/index.js";
import { transporter } from "./lib/nodemailer.js";
import { prisma } from "./lib/prisma.js";
import { redisClient } from "./lib/redis.js";
import { seed } from "./utils/seed.js";

const PORT = config.port;

async function main() {
	try {
		await prisma.$connect();
		console.log("database connected succesfully");

		// await seed();

		await transporter.verify();
		console.log("Nodemailer Connected Successfully");

		await redisClient.connect();
		console.log("redis connected Successfully");

		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Error starting the server:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
}

main();
