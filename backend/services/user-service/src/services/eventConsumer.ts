// user-service/src/services/eventConsumer.ts
import { connectBroker, subscribe } from "./brokerClient";
import User from "../models/User";

async function startConsumer() {
  const broker = await connectBroker();
  await broker.subscribe("subscription.activated", async (msg) => {
    const { subscriptionId, userId, planId, periodStart, periodEnd } = JSON.parse(msg.content.toString());
    await User.findByIdAndUpdate(userId, {
      subscriptionId,
      subscriptionStatus: "active",
      subscriptionPlan: planId,
      subscriptionEndsAt: new Date(periodEnd)
    });
    // ack
    broker.ack(msg);
  });
}
startConsumer();
