import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Task } from "../models/task.models.js";
import { SubTask } from "../models/subtask.models.js";
import { User } from "../models/user.models.js";
import { Notification } from "../models/notification.models.js";
import { ApiError } from "../utils/apiErrors.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";

const ensureProjectAccess = async (projectId, userId) => {
    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");
    const isMember = await ProjectMember.exists({
        project: projectId,
        user: userId,
    });
    if (!isMember && project.createdBy.toString() !== userId.toString())
        throw new ApiError(403, "You do not have access to this project");
    return project;
};

const ensureAssigneeAccess = async (projectId, assigneeId) => {
    const user = await User.findById(assigneeId).select("_id");
    if (!user) throw new ApiError(404, "Assigned user not found");
    const project = await Project.findById(projectId).select("createdBy");
    const member = await ProjectMember.exists({
        project: projectId,
        user: assigneeId,
    });
    if (!member && project.createdBy.toString() !== assigneeId.toString())
        throw new ApiError(400, "Assigned user is not a project member");
};

const createTask = asyncHandler(async (req, res) => {
    await ensureProjectAccess(req.body.project, req.user._id);
    const assignedTo = req.body.assignedTo || req.user._id;
    await ensureAssigneeAccess(req.body.project, assignedTo);
    const attachments = (req.files || []).map((file) => ({
        url: `/images/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
    }));
    const task = await Task.create({
        ...req.body,
        assignedTo,
        assignedBy: req.user._id,
        attachments,
    });
    if (assignedTo.toString() !== req.user._id.toString()) {
        await Notification.create({
            recipient: assignedTo,
            actor: req.user._id,
            type: "task_assigned",
            message: `You were assigned the task: ${task.title}`,
            resource: task._id,
            resourceType: "Task",
        });
    }
    return res
        .status(201)
        .json(new ApiResponse(201, task, "Task created successfully"));
});

const listTasks = asyncHandler(async (req, res) => {
    await ensureProjectAccess(req.params.projectId, req.user._id);
    const {
        status,
        priority,
        assignedTo,
        search,
        page = 1,
        limit = 20,
    } = req.query;
    const currentPage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(
        Math.max(Number.parseInt(limit, 10) || 20, 1),
        100,
    );
    const filter = { project: req.params.projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search)
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];

    const [tasks, total] = await Promise.all([
        Task.find(filter)
            .sort({ dueDate: 1, createdAt: -1 })
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize)
            .populate("assignedTo", "username email"),
        Task.countDocuments(filter),
    ]);
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                tasks,
                pagination: {
                    page: currentPage,
                    limit: pageSize,
                    total,
                    pages: Math.ceil(total / pageSize),
                },
            },
            "Tasks fetched successfully",
        ),
    );
});

const getTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.taskId).populate(
        "assignedTo",
        "username email",
    );
    if (!task) throw new ApiError(404, "Task not found");
    await ensureProjectAccess(task.project, req.user._id);
    return res
        .status(200)
        .json(new ApiResponse(200, task, "Task fetched successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.taskId);
    if (!task) throw new ApiError(404, "Task not found");
    await ensureProjectAccess(task.project, req.user._id);
    const allowedUpdates = (({
        title,
        description,
        assignedTo,
        status,
        priority,
        dueDate,
        attachments,
    }) => ({
        title,
        description,
        assignedTo,
        status,
        priority,
        dueDate,
        attachments,
    }))(req.body);
    if (allowedUpdates.assignedTo)
        await ensureAssigneeAccess(task.project, allowedUpdates.assignedTo);
    const updatedTask = await Task.findByIdAndUpdate(
        task._id,
        { $set: allowedUpdates },
        { new: true, runValidators: true },
    );
    if (
        allowedUpdates.assignedTo &&
        allowedUpdates.assignedTo.toString() !== req.user._id.toString() &&
        allowedUpdates.assignedTo.toString() !== task.assignedTo.toString()
    ) {
        await Notification.create({
            recipient: allowedUpdates.assignedTo,
            actor: req.user._id,
            type: "task_assigned",
            message: `You were assigned the task: ${task.title}`,
            resource: task._id,
            resourceType: "Task",
        });
    }
    return res
        .status(200)
        .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.taskId);
    if (!task) throw new ApiError(404, "Task not found");
    await ensureProjectAccess(task.project, req.user._id);
    await task.deleteOne();
    await SubTask.deleteMany({ task: task._id });
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Task deleted successfully"));
});

export { createTask, listTasks, getTask, updateTask, deleteTask };
