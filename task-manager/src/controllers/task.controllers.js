import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Task } from "../models/task.models.js";
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

const createTask = asyncHandler(async (req, res) => {
    await ensureProjectAccess(req.body.project, req.user._id);
    const attachments = (req.files || []).map((file) => ({
        url: `/images/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
    }));
    const task = await Task.create({
        ...req.body,
        assignedTo: req.body.assignedTo || req.user._id,
        assignedBy: req.user._id,
        attachments,
    });
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
    const updatedTask = await Task.findByIdAndUpdate(
        task._id,
        { $set: allowedUpdates },
        { new: true, runValidators: true },
    );
    return res
        .status(200)
        .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.taskId);
    if (!task) throw new ApiError(404, "Task not found");
    await ensureProjectAccess(task.project, req.user._id);
    await task.deleteOne();
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Task deleted successfully"));
});

export { createTask, listTasks, getTask, updateTask, deleteTask };
