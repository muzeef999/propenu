import { EventEmitter } from "events";

export type WhatsAppInboxEvent =
  | {
      type: "message";
      waId: string;
      conversationId?: string;
      messageId?: string;
      direction?: "inbound" | "outbound";
    }
  | {
      type: "conversation";
      waId: string;
    }
  | {
      type: "status";
      waId?: string;
      wamid?: string;
      status?: string;
    };

class WhatsAppInboxBus extends EventEmitter {
  publish(event: WhatsAppInboxEvent) {
    this.emit("inbox", event);
  }

  subscribe(listener: (event: WhatsAppInboxEvent) => void) {
    this.on("inbox", listener);
    return () => this.off("inbox", listener);
  }
}

export const whatsappInboxBus = new WhatsAppInboxBus();
