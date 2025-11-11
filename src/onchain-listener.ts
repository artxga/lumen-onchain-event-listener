import { TronWeb } from "tronweb";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const fullNode = process.env.TRON_FULL_NODE!;
const contractAddress = process.env.PAYMENT_EXECUTOR!;
const abiPath = path.resolve(__dirname, "../src/abis/payment-executor.json");
const abiFile = JSON.parse(fs.readFileSync(abiPath, "utf8"));
const abi = abiFile.entrys ?? abiFile; // 👈 cambio aquí

console.log("📡 Connecting to Tron network:", fullNode);

const tronWeb = new TronWeb({
  fullHost: fullNode,
  // Si usas una API key de TronGrid:
  // headers: { "TRON-PRO-API-KEY": process.env.TRON_API_KEY },
});

const POLL_INTERVAL = 10_000; // 10 segundos
let lastCheck = Date.now() - 60 * 60 * 1000; // empezamos con última hora

async function pollEvents() {
  try {
    const { data, success, meta }: any = await tronWeb.getEventResult(
      contractAddress,
      {
        eventName: "PaymentExecuted",
        sort: "block_timestamp",
        order: "desc",
      } as any
    );

    if (!success) {
      console.error("❌ Error fetching events:", meta);
      return;
    }

    console.debug("📡 Received", data.length, "events");

    // 🔍 Filtramos manualmente los eventos de la última hora
    const recent = data.filter((e: any) => e.block_timestamp >= lastCheck);

    for (const ev of recent) {
      console.log("💰 PaymentExecuted", {
        payer: ev.result.payer,
        referenceId: ev.result.referenceId,
        totalAmount: ev.result.totalAmount,
        blockTime: new Date(ev.block_timestamp).toLocaleString(),
        tx: ev.transaction_id,
      });
    }

    lastCheck = Date.now();
  } catch (err) {
    console.error("❌ Error fetching events:", err);
  }
}

async function main() {
  console.log("👂 Listening for PaymentExecuted on Tron...");
  await pollEvents(); // primera ejecución inmediata
  setInterval(pollEvents, POLL_INTERVAL);
}

main();
