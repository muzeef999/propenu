// userController.ts

import { Request, Response } from "express";
import User , { IUser } from "../models/userModel";
import { sendBulkNotification, sendBulkPush } from "../../../../shared/notifications/push.service";
import { HydratedDocument } from "mongoose";


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


export const sendCustomNotification = async (req: Request, res: Response) => {
  try {
    const { title, body, userIds, target, city } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: "Title & body required" });
    }

    // ✅ FIX: Proper typing
    let users: HydratedDocument<IUser>[] = [];

    // 🎯 1. Specific users
    if (userIds?.length) {
      users = await User.find({
        _id: { $in: userIds },
        fcmToken: { $ne: null },
      });
    }

    // 🎯 2. All users
    else if (target === "all") {
      users = await User.find({
        fcmToken: { $ne: null },
      });
    }

    // 🎯 3. City-based
    else if (city) {
      users = await User.find({
        city,
        fcmToken: { $ne: null },
      });
    }

    if (!users.length) {
      return res.status(404).json({ message: "No users found" });
    }

    // ✅ FIX: Safe token extraction
    const tokens = users
      .map((u) => u.fcmToken)
      .filter((token): token is string => !!token);

    await sendBulkPush({
      tokens,
      title,
      body,
    });

    res.json({
      message: `Notification sent to ${tokens.length} users 🚀`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending notification" });
  }
};
