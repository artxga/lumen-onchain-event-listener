import dotenv from "dotenv";
dotenv.config();

export const config = {
  // tronNode: process.env.TRON_FULL_NODE!, // TODO: Remove
  // polygonNode: process.env.POLYGON_FULL_NODE!, // TODO: Remove
  // pollLevels: (process.env.POLL_LEVELS ?? "10000,30000,60000,120000")
  //   .split(",")
  //   .map(Number),
  // maxIdlePolls: Number(process.env.MAX_IDLE_POLLS ?? 3),
  // apiUrl: process.env.INTERNAL_API_URL!,

  polygonWs: process.env.POLYGON_WS!,
  contractAddress: process.env.PAYMENT_EXECUTOR!,
  rabbitUrl: process.env.RABBIT_URL!,
};
