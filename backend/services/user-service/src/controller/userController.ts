// userController.ts

import { Request, Response } from "express";
import User, { IUser } from "../models/userModel";
import { sendBulkPush } from "../../../../shared/notifications/push.service";
import { HydratedDocument } from "mongoose";
import Role from "../models/roleModel";
import { uploadToS3 } from "../utils/s3Upload";

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

// export const sendCustomNotification = async (req: Request, res: Response) => {
//   try {
//     const { title, body, userIds, role, city, state, locality, target } =
//       req.body;

//     if (!title || !body) {
//       return res.status(400).json({ message: "Title & body required" });
//     }

//     const image = (req.file as any)?.location;

//     const query: any = {
//       fcmToken: { $ne: null },
//     };

//     if (userIds?.length) {
//       query._id = { $in: userIds };
//     }

//     if (role) {
//       const roleDoc = await Role.findOne({ name: role });

//       if (!roleDoc) {
//         return res.status(404).json({ message: "Role not found" });
//       }

//       query.roleId = roleDoc._id;
//     }

//     if (city) {
//       query.city = new RegExp(`^${city}$`, "i");
//     }

//     if (state) {
//       query.state = new RegExp(`^${state}$`, "i");
//     }

//     if (locality) {
//       query.locality = new RegExp(`^${locality}$`, "i");
//     }

//     if (target === "all" && !userIds && !role && !city && !state && !locality) {
//       // no extra filters needed
//     }

//     // 🚀 Fetch Users
//     const users: HydratedDocument<IUser>[] = await User.find(query);

//     if (!users.length) {
//       return res.status(404).json({
//         message: "No users found",
//         appliedQuery: query,
//       });
//     }

//     // 🎯 Extract Tokens
//     const tokens = users
//       .map((u) => u.fcmToken)
//       .filter((token): token is string => !!token);

//     if (!tokens.length) {
//       return res.status(404).json({
//         message: "No valid FCM tokens found",
//       });
//     }

//     // 🚀 Send Notification
//     await sendBulkPush({
//       tokens,
//       title,
//       body,
//       image,
//     });

//     res.json({
//       success: true,
//       message: `Notification sent to ${tokens.length} users 🚀`,
//       filters: query,
//     });
//   } catch (error) {
//     console.error("❌ Notification Error:", error);
//     res.status(500).json({
//       message: "Error sending notification",
//     });
//   }
// };

export const sendCustomNotification = async (req: Request, res: Response) => {
  try {
    const {
      title,
      body,
      userIds,
      role,
      city,
      state,
      locality,
    } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: "Title & body required",
      });
    }

    let image: string | undefined;

    // ✅ Upload image
    if (req.file) {
      const file = req.file;

      const key = `notifications/${Date.now()}-${file.originalname}`;

      const uploaded = await uploadToS3({
        buffer: file.buffer,
        key,
        mimetype: file.mimetype,
      });

      image = uploaded.url;
    }

    // ✅ Base query
    const query: any = {
      fcmToken: { $ne: null },
    };

    // ✅ UserIds priority
    if (userIds?.length) {
      query._id = { $in: userIds };
    }

    // ✅ 🔥 FIXED ROLE FILTER (IMPORTANT)
    else if (role) {
      const roleDoc = await Role.findOne({
        name: new RegExp(`^${role}$`, "i"), // ✅ case-insensitive
      });

      if (!roleDoc) {
        return res.status(400).json({
          success: false,
          message: `Role '${role}' not found`,
        });
      }

      query.roleId = roleDoc._id;
    }

    // ✅ Location filters
    if (city) query.city = new RegExp(`^${city}$`, "i");
    if (state) query.state = new RegExp(`^${state}$`, "i");
    if (locality) query.locality = new RegExp(`^${locality}$`, "i");

    console.log("🔍 Final Query:", query);

    // ✅ Fetch users
    const users: HydratedDocument<IUser>[] = await User.find(query);

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No users found",
        query,
      });
    }

    // ✅ Map userId → token
    const tokenUserMap = users
      .filter((u) => u.fcmToken)
      .map((u) => ({
        userId: u._id,
        token: u.fcmToken!,
      }));

    const tokens = tokenUserMap.map((t) => t.token);

    if (!tokens.length) {
      return res.status(404).json({
        success: false,
        message: "No valid tokens",
      });
    }

    // ✅ Send push
    const response = await sendBulkPush({
      tokens,
      title,
      body,
      ...(image ? { image } : {}),
    });


    if (!response) {
  return res.status(500).json({
    success: false,
    message: "Failed to send notifications",
  });
}

    // ✅ 🔥 MAP FAILED USERS
    const failedUsers: any[] = [];
    const successUsers: any[] = [];

    response?.failedTokens?.forEach((failedToken: string) => {
      const user = tokenUserMap.find((t) => t.token === failedToken);
      if (user) failedUsers.push(user.userId);
    });

    tokenUserMap.forEach((t) => {
      if (!response.failedTokens.includes(t.token)) {
        successUsers.push(t.userId);
      }
    });

    return res.status(200).json({
      success: true,
      message: `Notification sent`,
      totalUsers: users.length,
      successCount: response.successCount,
      failureCount: response.failureCount,

      // 🔥 IMPORTANT OUTPUT
      successUserIds: successUsers,
      failedUserIds: failedUsers,

      image,
    });
  } catch (error: any) {
    console.error("❌ Notification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error sending notification",
      error: error.message,
    });
  }
};