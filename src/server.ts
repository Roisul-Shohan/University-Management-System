
import app from "./app.js";
import config from "./config/index.js";
import { prisma } from "./lib/prisma.js";
import { redisClient } from "./lib/redis.js";


const PORT = config.port;

async function  main() {
    try {
       await prisma.$connect();
       console.log("database connected succesfully");

       await redisClient.connect();
       console.log("redis connected Successfully")

       app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`);
      });


    } catch (error) {
        console.error("Error starting the server:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
    
}

main();