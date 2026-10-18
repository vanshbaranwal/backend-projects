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
    const task = await Task.create({
        ...req.body,
        assignedTo: req.body.assignedTo || req.user._id,
        assignedBy: req.user._id,
    });
    return res
        .status(201)
        .json(new ApiResponse(201, task, "Task created successfully"));
});

const listTasks = asyncHandler(async (req, res) => {
    await ensureProjectAccess(req.params.projectId, req.user._id);
    const tasks = await Task.find({ project: req.params.projectId }).populate(
        "assignedTo",
        "username email",
    );
    return res
        .status(200)
        .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
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
        attachments,
    }) => ({
        title,
        description,
        assignedTo,
        status,
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
