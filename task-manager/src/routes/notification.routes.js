import { Router } from "express";
import {
    listNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from "../controllers/notification.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.route("/").get(listNotifications).patch(markAllNotificationsRead);
router.route("/:notificationId").patch(markNotificationRead);

export default router;
