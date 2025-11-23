export function getEventKey(ev: any, eventName: string) {
  return `${eventName}-${ev.transactionHash}-${ev.index}`;
}
