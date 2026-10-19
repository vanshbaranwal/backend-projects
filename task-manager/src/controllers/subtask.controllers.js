import { ProjectMember } from "../models/projectmember.models.js";
import { SubTask } from "../models/subtask.models.js";
import { Task } from "../models/task.models.js";
import { ApiError } from "../utils/apiErrors.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";

const ensureTaskAccess = async (taskId, userId) => {
    const task = await Task.findById(taskId);
    if (!task) throw new ApiError(404, "Task not found");
    const member = await ProjectMember.exists({
        project: task.project,
        user: userId,
    });
    if (
        !member &&
        task.assignedTo.toString() !== userId.toString() &&
        task.assignedBy.toString() !== userId.toString()
    ) {
        throw new ApiError(403, "You do not have access to this task");
    }
    return task;
};

const createSubTask = asyncHandler(async (req, res) => {
    await ensureTaskAccess(req.body.task, req.user._id);
    const subTask = await SubTask.create({
        title: req.body.title,
        task: req.body.task,
        createdBy: req.user._id,
    });
    return res
        .status(201)
        .json(new ApiResponse(201, subTask, "Subtask created successfully"));
});

const listSubTasks = asyncHandler(async (req, res) => {
    await ensureTaskAccess(req.params.taskId, req.user._id);
    const subTasks = await SubTask.find({ task: req.params.taskId }).populate(
        "createdBy",
        "username email",
    );
    return res
        .status(200)
        .json(new ApiResponse(200, subTasks, "Subtasks fetched successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
    const subTask = await SubTask.findById(req.params.subTaskId);
    if (!subTask) throw new ApiError(404, "Subtask not found");
    await ensureTaskAccess(subTask.task, req.user._id);
    const updatedSubTask = await SubTask.findByIdAndUpdate(
        subTask._id,
        { $set: { title: req.body.title, isCompleted: req.body.isCompleted } },
        { new: true, runValidators: true },
    );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedSubTask,
                "Subtask updated successfully",
            ),
        );
});

const deleteSubTask = asyncHandler(async (req, res) => {
    const subTask = await SubTask.findById(req.params.subTaskId);
    if (!subTask) throw new ApiError(404, "Subtask not found");
    await ensureTaskAccess(subTask.task, req.user._id);
    await subTask.deleteOne();
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Subtask deleted successfully"));
});

export { createSubTask, listSubTasks, updateSubTask, deleteSubTask };
