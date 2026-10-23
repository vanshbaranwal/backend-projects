import { Notification } from "../models/notification.models.js";
import { ApiError } from "../utils/apiErrors.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";

const listNotifications = asyncHandler(async (req, res) => {
    const { unreadOnly = "false", page = 1, limit = 20 } = req.query;
    const currentPage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(
        Math.max(Number.parseInt(limit, 10) || 20, 1),
        100,
    );
    const filter = { recipient: req.user._id };
    if (unreadOnly === "true") filter.isRead = false;

    const [notifications, total, unread] = await Promise.all([
        Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize)
            .populate("actor", "username fullname avatar"),
        Notification.countDocuments(filter),
        Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                notifications,
                unread,
                pagination: {
                    page: currentPage,
                    limit: pageSize,
                    total,
                    pages: Math.ceil(total / pageSize),
                },
            },
            "Notifications fetched successfully",
        ),
    );
});

const markNotificationRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.notificationId, recipient: req.user._id },
        { isRead: true },
        { new: true },
    );
    if (!notification) throw new ApiError(404, "Notification not found");
    return res
        .status(200)
        .json(
            new ApiResponse(200, notification, "Notification marked as read"),
        );
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
    const result = await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true },
    );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { updated: result.modifiedCount },
                "Notifications marked as read",
            ),
        );
});

export { listNotifications, markNotificationRead, markAllNotificationsRead };
