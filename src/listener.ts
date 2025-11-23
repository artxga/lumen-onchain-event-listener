import { ethers, Log } from "ethers";
import abi from "./abis/payment-executor.json";
import { config } from "./config/env";
import { getEventKey } from "./utils/helpers";
import { publishEvent } from "./rabbit/rabbit.service";
import { EventRoutingKeys } from "./utils/enum";

export function listener() {
  let provider: ethers.WebSocketProvider;
  let contract: ethers.Contract;

  function startListener() {
    try {
      provider = new ethers.WebSocketProvider(config.polygonWs, "matic-amoy");
      contract = new ethers.Contract(config.contractAddress, abi, provider);

      const handleEvent = (
        eventName: keyof typeof EventRoutingKeys,
        dataObj: Record<string, any>,
        event: any
      ) => {
        try {
          const {
            blockNumber,
            transactionHash,
            transactionIndex,
            index,
            removed,
          } = event.log;
          const payload = {
            key: getEventKey(event.log, eventName),
            event_name: eventName,
            transactionHash,
            block_number: blockNumber,
            transaction_index: transactionIndex,
            log_index: index,
            removed,
            data: JSON.stringify(
              Object.fromEntries(
                Object.entries(dataObj).map(([k, v]) => [
                  k,
                  v?.toString ? v.toString() : v,
                ])
              )
            ),
          };
          console.log(`${eventName}:`, payload);

          publishEvent(eventName, payload);
        } catch (error) {
          console.error(`Error processing ${eventName}:`, error);
        }
      };

      // PaymentExecuted
      contract.on("PaymentExecuted", (payer, referenceId, totalAmount, event) =>
        handleEvent(
          "PaymentExecuted",
          { payer, referenceId, totalAmount },
          event
        )
      );

      // PartnerPaid
      contract.on("PartnerPaid", (partner, referenceId, amount, event) =>
        handleEvent("PartnerPaid", { partner, referenceId, amount }, event)
      );

      // PartnerOwedRecorded
      contract.on(
        "PartnerOwedRecorded",
        (partner, referenceId, amount, event) =>
          handleEvent(
            "PartnerOwedRecorded",
            { partner, referenceId, amount },
            event
          )
      );

      // Withdraw
      contract.on("Withdraw", (to, amount, reason, event) =>
        handleEvent("Withdraw", { to, amount, reason }, event)
      );

      console.log("👂 Listening for events on Polygon...");
    } catch (error) {
      console.error("Error starting listener, retrying in 5s...", error);
      setTimeout(startListener, 5000); // reconexión automática
    }
  }

  startListener();
}
