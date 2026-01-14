import { realtimeMiddleware } from "@inngest/realtime/middleware";
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "nodebase",
  middleware: [realtimeMiddleware()],
  // Explicitly set the event key (can be 'local' for dev if dev server is used)
  eventKey: process.env.INNGEST_EVENT_KEY || "local",
});
