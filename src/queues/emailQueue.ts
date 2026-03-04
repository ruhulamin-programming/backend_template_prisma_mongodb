import { Queue } from "bullmq";
import redisClient from "../helpers/redis";

export const emailQueue = new Queue("emails", {
  connection: redisClient,
});
