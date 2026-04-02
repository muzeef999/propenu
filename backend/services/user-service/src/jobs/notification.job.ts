import cron from "node-cron";
import User from "../models/userModel";
import { sendBulkPush } from "../../../../shared/notifications/push.service";

export const startNotificationJob = () => {
  
  cron.schedule("*/1 * * * *", async () => {

    try {
      const users = await User.find({
        fcmToken: { $ne: null },
      }).populate("roleId");

      // 👉 filter only agents
      const agentUsers = users.filter(
        (u: any) => u.roleId?.name?.toLowerCase() === "agent"
      );

      const tokens = agentUsers
        .map((u) => u.fcmToken)
        .filter((t): t is string => !!t);
  
      if (!tokens.length) return;

      await sendBulkPush({
        tokens,
        title: "Auto Notification 🚀",
        body: "This is automated test",
      });
      console.log("✅ Notification Sent");
    } catch (error) {
      console.error("❌ Job Error:", error);
    }
  });
};