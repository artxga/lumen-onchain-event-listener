import axios from "axios";
import { config } from "../config/env";

export async function sendToApi(payload: any): Promise<boolean> {
  try {
    await axios.post(`${config.apiUrl}/payment/pexcon/event`, payload);
    console.log(`✅ Sent ${payload.event_name}: ${payload.key}`);
    return true;
  } catch (err: any) {
    if (err.response?.status === 409)
      console.warn(`⚠️ Duplicate event ${payload.key} ignored`);
    else console.error(`❌ Error sending ${payload.key}:`, err.message);
    return false;
  }
}
