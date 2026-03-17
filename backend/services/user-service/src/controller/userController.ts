// userController.ts

import { Request, Response } from "express";
import User from "../models/userModel";
import { sendPushNotification } from "../../../../shared/notifications/push.service";

export const saveFcmToken = async (req: Request, res: Response) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ message: "Missing fields" });
    }

    await User.findByIdAndUpdate(userId, {
      fcmToken: token,
    });

    res.json({ message: "Token saved" });
  } catch (error) {
    console.error("Save FCM Token Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const testPush = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user?.fcmToken) {
      return res.status(400).json({ message: "No FCM token found" });
    }

    await sendPushNotification({
      token: user.fcmToken,
      title: "🔥 Test Notification",
      body: "Push is working bro 🚀",
    });

    res.json({ message: "Push sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending push" });
  }
};