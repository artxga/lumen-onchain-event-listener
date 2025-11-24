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
    console.log("🔄 Starting listener...");

    provider = new ethers.WebSocketProvider(config.polygonWs, "matic-amoy");

    const ws = (provider as any).websocket;

    if (!ws) {
      console.error("❌ ERROR: provider.websocket no existe");
      return;
    }

    ws.on("close", (code: number) => {
      console.error("❌ WebSocket closed:", code);
      console.log("Reconnecting in 3s...");
      setTimeout(startListener, 3000);
    });

    ws.on("error", (err: any) => {
      console.error("❌ WebSocket error:", err);
    });

    provider.on("error", (err) => {
      console.error("❌ Provider error:", err);
    });

    contract = new ethers.Contract(config.contractAddress, abi, provider);

    async function handleEvent(
      eventName: keyof typeof EventRoutingKeys,
      dataObj: Record<string, any>,
      event: any
    ) {
      try {
        const { blockNumber, transactionHash, index, removed }: Log = event.log;
        const block = await provider.getBlock(blockNumber);
        const blockTime = block?.timestamp
          ? new Date(block.timestamp * 1000).toISOString()
          : null;

        const payload = {
          reference_id: Number(dataObj.referenceId),
          key: getEventKey(event.log, eventName),
          event_name: eventName,
          transaction_hash: transactionHash,
          block_number: blockNumber,
          block_time: blockTime,
          event_index: index,
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
    }

    // EVENTOS
    contract.on("PaymentExecuted", (payer, referenceId, totalAmount, event) =>
      handleEvent("PaymentExecuted", { payer, referenceId, totalAmount }, event)
    );

    contract.on("PartnerPaid", (partner, referenceId, amount, event) =>
      handleEvent("PartnerPaid", { partner, referenceId, amount }, event)
    );

    contract.on("PartnerOwedRecorded", (partner, referenceId, amount, event) =>
      handleEvent(
        "PartnerOwedRecorded",
        { partner, referenceId, amount },
        event
      )
    );

    contract.on("Withdraw", (to, amount, reason, event) =>
      handleEvent("Withdraw", { to, amount, reason }, event)
    );

    console.log("👂 Listening for events on Polygon...");
  }

  startListener();
}
