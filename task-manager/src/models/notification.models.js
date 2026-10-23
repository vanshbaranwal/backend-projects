import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        actor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        type: {
            type: String,
            enum: ["project_member_added", "task_assigned"],
            required: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        resource: {
            type: Schema.Types.ObjectId,
            required: true,
        },

        resourceType: {
            type: String,
            enum: ["Project", "Task"],
            required: true,
        },

        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
