import { config } from "../config/env";
import { events, fetchAndProcessEvents } from "./event.service";

let pollLevel = 0;
let idleCount = 0;
let pollInterval = config.pollLevels[pollLevel];

export async function pollEvents() {
  let totalProcessed = 0;

  for (const ev of events) {
    try {
      const count = await fetchAndProcessEvents(ev);
      totalProcessed += count;
    } catch (err) {
      console.error(`❌ Error polling ${ev.name}:`, err);
    }
  }

  if (totalProcessed === 0) {
    idleCount++;
    console.log(`🕒 No new events (${idleCount}/${config.maxIdlePolls})`);

    if (idleCount >= config.maxIdlePolls) {
      if (pollLevel < config.pollLevels.length - 1) {
        pollLevel++;
        pollInterval = config.pollLevels[pollLevel];
        console.log(`⚙️ Increased poll interval to ${pollInterval / 1000}s`);
      }
      idleCount = 0;
    }
  } else {
    if (pollLevel !== 0)
      console.log(
        `🔁 Resetting poll interval to ${config.pollLevels[0] / 1000}s`
      );
    pollLevel = 0;
    pollInterval = config.pollLevels[0];
    idleCount = 0;
  }

  setTimeout(pollEvents, pollInterval);
}
