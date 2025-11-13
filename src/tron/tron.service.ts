import { TronWeb } from "tronweb";
import { config } from "../config/env";

export const tronWeb = new TronWeb({ fullHost: config.tronNode });

export const getEventResult = async (
  eventName: string,
  // fingerprint: string,
  minBlockTimestamp: number
) => {
  return tronWeb.getEventResult(config.contractAddress, {
    eventName,
    limit: 3,
    // fingerprint,
    orderBy: "block_timestamp,asc",
    minBlockTimestamp: minBlockTimestamp + 1000,
  } as any);
};
