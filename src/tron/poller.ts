import { config } from "../config/env";
import { events, fetchAndProcessEvents } from "./event.service";

export type SyncedState = {
  last_block_number: number;
  last_event_index: number;
  last_fingerprint: string;
  last_block_timestamp: number;
};

const syncStateCache: Record<string, SyncedState> = {};

let pollLevel = 0;
let idleCount = 0;
let pollInterval = config.pollLevels[pollLevel];

function getLocalState(eventName: string): SyncedState {
  if (!syncStateCache[eventName]) {
    syncStateCache[eventName] = {
      last_block_number: 0,
      last_event_index: 0,
      last_fingerprint: "",
      last_block_timestamp: 0,
    };
  }

  return syncStateCache[eventName];
}

export async function pollEvents() {
  let totalProcessed = 0;

  for (const ev of events) {
    try {
      const state = getLocalState(ev.name);

      const count = await fetchAndProcessEvents(ev, state);
      totalProcessed += count;

      console.log(`📦 Processed ${count} ${ev.name} events`);
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
