import dotenv from "dotenv";
dotenv.config();

export const config = {
  polygonWs: process.env.POLYGON_WS!,
  paymentExecutorAddress: process.env.PAYMENT_EXECUTOR!,
  multisenderAddress: process.env.MULTISENDER!,
  rabbitUrl: process.env.RABBIT_URL!,
  network: process.env.NETWORK!,
};
