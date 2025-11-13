import axios from "axios";
import { config } from "../config/env";

// TODO: Remove
export async function getLastSyncedState(eventName: string) {
  try {
    const res = await axios.get(
      `${config.apiUrl}/payment/pexcon/event/state/${eventName}`
    );
    const d = res.data?.data;
    if (!d) return null;

    return {
      last_block_number: Number(d.last_block_number ?? 0),
      last_tx_hash: d.last_tx_hash ?? null,
      last_event_index: Number(d.last_event_index ?? 0),
    };
  } catch (err: any) {
    console.warn(
      `⚠️ Could not fetch last synced state for ${eventName}:`,
      err.message
    );
    return null;
  }
}
