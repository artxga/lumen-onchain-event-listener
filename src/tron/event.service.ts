import { getEventResult } from "./tron.service";
import { getEventKey } from "../utils/helpers";
import { publishEvent } from "../rabbit/rabbit.service";
import { EventRoutingKeys } from "../utils/enum";
import { SyncedState } from "./poller";

export type EventConfig = {
  name: keyof typeof EventRoutingKeys;
  label: string;
  formatter: (result: any) => Record<string, any>;
};

export const events: EventConfig[] = [
  {
    name: "PaymentExecuted",
    label: "💰 PaymentExecuted",
    formatter: (r) => ({
      payer: r.payer,
      reference_id: r.referenceId,
      total_amount: r.totalAmount,
    }),
  },
  {
    name: "PartnerPaid",
    label: "💰 PartnerPaid",
    formatter: (r) => ({
      partner: r.partner,
      reference_id: r.referenceId,
      amount: r.amount,
    }),
  },
  {
    name: "PartnerOwedRecorded",
    label: "💰 PartnerOwedRecorded",
    formatter: (r) => ({
      partner: r.partner,
      reference_id: r.referenceId,
      amount: r.amount,
    }),
  },
  {
    name: "Withdraw",
    label: "💰 Withdraw",
    formatter: (r) => ({
      to: r.to,
      amount: r.amount,
      reason: r.reason,
    }),
  },
];

export async function fetchAndProcessEvents(
  eventConfig: EventConfig,
  state: SyncedState
): Promise<number> {
  const result = await getEventResult(
    eventConfig.name,
    // state.last_fingerprint,
    state.last_block_timestamp
  );
  // console.log("result =>", result);
  let data = result?.data ?? [];
  if (!data.length) return 0;

  // const newEvents = data.filter((e: any) => {
  //   const b = e.block_number;
  //   const idx = e.event_index;
  //   const lb = state.last_block_number;
  //   const lidx = state.last_event_index;

  //   if (b < lb) return false;
  //   if (b === lb) return idx > lidx;
  //   return true;
  // });

  // if (!newEvents.length) return 0;

  let processedCount = 0;

  for (const ev of data) {
    const key = getEventKey(ev, eventConfig.name);
    const payload = {
      key,
      event_name: eventConfig.name,
      event_index: ev.event_index,
      transaction_hash: ev.transaction_id,
      data: JSON.stringify(eventConfig.formatter(ev.result)),
      block_number: ev.block_number,
      block_time: new Date(ev.block_timestamp).toISOString(),
      reference_id: Number(ev.result?.referenceId || 0),
    };

    try {
      await publishEvent(eventConfig.name, payload);

      // 🧠 Actualiza estado local (sin DB)
      state.last_block_number = ev.block_number;
      state.last_event_index = ev.event_index;
      state.last_fingerprint = result.meta?.fingerprint || "";
      state.last_block_timestamp = ev.block_timestamp;

      processedCount++;
    } catch (error) {
      console.error(`❌ Error publishing ${key}:`, error);
    }
  }

  return processedCount;
}
