import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { touchUserPresence } from "../utils/presence";

/** Online if we heard from them within this many seconds (matches admin heartbeat). */
export const PRESENCE_ONLINE_WINDOW_SECONDS = 180;

/** POST /auth/presence/ping — client heartbeat while the app tab is open. */
export const pingPresence = async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user?.sub || req.user?.id || "");
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const lastSeenAt = await touchUserPresence(userId, { force: true });
    return res.status(200).json({
      success: true,
      data: {
        lastSeenAt,
        onlineWindowSeconds: PRESENCE_ONLINE_WINDOW_SECONDS,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to update presence",
      error: error?.message,
    });
  }
};
