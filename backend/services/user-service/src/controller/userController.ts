// userController.ts

import { Request, Response } from "express";
import User , { IUser } from "../models/userModel";
import { sendBulkNotification, sendBulkPush } from "../../../../shared/notifications/push.service";
import { HydratedDocument } from "mongoose";
import Role from "../models/roleModel";


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
    const { title, body, userIds,  role,  city,  state,  locality,  target,  image  } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: "Title & body required" });
    }

    const query: any = {
      fcmToken: { $ne: null },
    };

    if (userIds?.length) {
      query._id = { $in: userIds };
    }

    if (role) {
      const roleDoc = await Role.findOne({ name: role });

      if (!roleDoc) {
        return res.status(404).json({ message: "Role not found" });
      }

      query.roleId = roleDoc._id;
    }

    if (city) {
      query.city = new RegExp(`^${city}$`, "i");
    }

    if (state) {
      query.state = new RegExp(`^${state}$`, "i");
    }

    if (locality) {
      query.locality = new RegExp(`^${locality}$`, "i");
    }

    if (
      target === "all" &&
      !userIds &&
      !role &&
      !city &&
      !state &&
      !locality
    ) {
      // no extra filters needed
    }

    // 🚀 Fetch Users
    const users: HydratedDocument<IUser>[] = await User.find(query);

    if (!users.length) {
      return res.status(404).json({
        message: "No users found",
        appliedQuery: query,
      });
    }

    // 🎯 Extract Tokens
    const tokens = users
      .map((u) => u.fcmToken)
      .filter((token): token is string => !!token);

    if (!tokens.length) {
      return res.status(404).json({
        message: "No valid FCM tokens found",
      });
    }

    // 🚀 Send Notification
    await sendBulkPush({
      tokens,
      title,
      body,
      image,
    });

    res.json({
      success: true,
      message: `Notification sent to ${tokens.length} users 🚀`,
      filters: query,
    });

  } catch (error) {
    console.error("❌ Notification Error:", error);
    res.status(500).json({
      message: "Error sending notification",
    });
  }
};



