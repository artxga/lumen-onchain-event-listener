export function getEventKey(ev: any, eventName: string) {
  return `${eventName}-${ev.transaction_id}-${ev.event_index}`;
}
