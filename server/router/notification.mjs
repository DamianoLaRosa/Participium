import { Router } from "express";
import {
  getNotificationsByCitizen,
  getUnreadCount,
  markNotificationAsSeen,
  markAllAsSeen,
} from "../dao.mjs";

const router = Router();

// GET /api/notifications - Get all notifications for logged citizen
router.get("/notifications", async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== "user") {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const notifications = await getNotificationsByCitizen(req.user.id, limit);
    return res.status(200).json(notifications);
  } catch (err) {
    return res.status(503).json({ error: "Database error during notification retrieval" });
  }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get("/notifications/unread-count", async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== "user") {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const count = await getUnreadCount(req.user.id);
    return res.status(200).json({ count });
  } catch (err) {
    return res.status(503).json({ error: "Database error during count retrieval" });
  }
});

// PUT /api/notifications/:id/seen - Mark notification as seen
router.put("/notifications/:id/seen", async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== "user") {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const notificationId = parseInt(req.params.id, 10);
    if (isNaN(notificationId)) {
      return res.status(422).json({ error: "Invalid notification id" });
    }

    const result = await markNotificationAsSeen(notificationId, req.user.id);

    if (!result) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(503).json({ error: "Database error during update" });
  }
});

// PUT /api/notifications/mark-all-seen - Mark all notifications as seen
router.put("/notifications/mark-all-seen", async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== "user") {
      return res.status(401).json({ error: "Not authenticated" });
    }

    await markAllAsSeen(req.user.id);
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(503).json({ error: "Database error during update" });
  }
});

export default router;
