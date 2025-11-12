import { getEventResult } from "./tron.service";
import { getLastSyncedState } from "../api/state.service";
import { sendToApi } from "../api/sender.service";
import { getEventKey } from "../utils/helpers";
import { config } from "../config/env";

export type EventConfig = {
  name: string;
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
  eventConfig: EventConfig
): Promise<number> {
  const lastState = await getLastSyncedState(eventConfig.name);
  const result = await getEventResult(eventConfig.name);
  let data = result?.data ?? [];
  if (!data.length) return 0;

  data = data.reverse();

  const newEvents = lastState
    ? data.filter((e: any) => {
        const b = e.block_number;
        const idx = e.event_index;
        const lb = lastState.last_block_number;
        const lidx = lastState.last_event_index;

        if (b < lb) return false;
        if (b === lb) return idx > lidx;
        return true;
      })
    : data;

  if (!newEvents.length) return 0;

  console.log(
    `📦 Processing ${newEvents.length} ${eventConfig.name} events...`
  );
  let processedCount = 0;

  for (const ev of newEvents) {
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

    const sent = await sendToApi(payload);
    if (sent) processedCount++;
  }

  return processedCount;
}
