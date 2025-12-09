import amqp from "amqplib";
import { config } from "../config/env.config";
import { EventRoutingKeys, ExchangeNames } from "../utils/enum";

let connection: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;

const assertedExchanges = new Set<string>();

export async function getRabbitChannel() {
  if (channel) return channel;

  connection = await amqp.connect(config.rabbitUrl);
  channel = await connection.createChannel();

  return channel;
}

export async function publishEvent(
  exchangeName: ExchangeNames,
  eventName: EventRoutingKeys,
  payload: any
) {
  const ch = await getRabbitChannel();

  if (!assertedExchanges.has(exchangeName)) {
    await ch.assertExchange(exchangeName, "topic", { durable: true });
    assertedExchanges.add(exchangeName);
    console.log(`🐇 Exchange ${exchangeName} ready`);
  }

  const routingKey = eventName;

  const buffer = Buffer.from(JSON.stringify(payload));

  ch.publish(exchangeName, routingKey, buffer, { persistent: true });
  console.log(`📤 Published ${eventName} to ${exchangeName} → ${routingKey}`);
}
