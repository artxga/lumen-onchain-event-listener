import amqp from "amqplib";
import { config } from "../config/env";
import { EventRoutingKeys } from "../utils/enum";

let channel: amqp.Channel | null = null;

export async function getRabbitChannel() {
  if (channel) return channel;

  const connection = await amqp.connect(config.rabbitUrl);
  channel = await connection.createChannel();

  await channel.assertExchange("pexcon.events", "topic", { durable: true });
  console.log("🐇 Connected to RabbitMQ and exchange 'pexcon.events' ready");

  return channel;
}

export async function publishEvent(
  eventName: keyof typeof EventRoutingKeys,
  payload: any
) {
  const ch = await getRabbitChannel();

  const routingKey = EventRoutingKeys[eventName];

  const buffer = Buffer.from(JSON.stringify(payload));

  ch.publish("pexcon.events", routingKey, buffer, { persistent: true });
  console.log(`📤 Published ${eventName} → ${routingKey}`);
}
