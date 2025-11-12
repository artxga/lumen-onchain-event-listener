import { TronWeb } from "tronweb";
import { config } from "../config/env";

export const tronWeb = new TronWeb({ fullHost: config.tronNode });

export const getEventResult = async (eventName: string) => {
  return tronWeb.getEventResult(config.contractAddress, { eventName } as any);
};
