import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { ProjectNote } from "../models/projectnote.models.js";
import { Task } from "../models/task.models.js";
import { SubTask } from "../models/subtask.models.js";
import { ApiError } from "../utils/apiErrors.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";

const ensureOwner = (project, userId) => {
    if (project.createdBy.toString() !== userId.toString()) {
        throw new ApiError(
            403,
            "Only the project owner can perform this action",
        );
    }
};

const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const project = await Project.create({
        name,
        description,
        createdBy: req.user._id,
    });
    await ProjectMember.create({
        user: req.user._id,
        project: project._id,
        role: "project_admin",
    });
    return res
        .status(201)
        .json(new ApiResponse(201, project, "Project created successfully"));
});

const listProjects = asyncHandler(async (req, res) => {
    const memberships = await ProjectMember.find({ user: req.user._id }).select(
        "project",
    );
    const projectIds = memberships.map(({ project }) => project);
    const filter = {
        $or: [{ createdBy: req.user._id }, { _id: { $in: projectIds } }],
    };
    if (req.query.includeArchived !== "true") filter.isArchived = false;
    if (req.query.search)
        filter.name = { $regex: req.query.search, $options: "i" };
    const projects = await Project.find(filter).sort({ updatedAt: -1 });
    return res
        .status(200)
        .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.projectId).populate(
        "createdBy",
        "username email",
    );
    if (!project) throw new ApiError(404, "Project not found");
    const member = await ProjectMember.exists({
        project: project._id,
        user: req.user._id,
    });
    if (
        !member &&
        project.createdBy?._id.toString() !== req.user._id.toString()
    )
        throw new ApiError(403, "You do not have access to this project");
    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project fetched successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.projectId);
    if (!project) throw new ApiError(404, "Project not found");
    ensureOwner(project, req.user._id);
    const updatedProject = await Project.findByIdAndUpdate(
        project._id,
        { $set: { name: req.body.name, description: req.body.description } },
        { new: true, runValidators: true },
    );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedProject,
                "Project updated successfully",
            ),
        );
});

const deleteProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.projectId);
    if (!project) throw new ApiError(404, "Project not found");
    ensureOwner(project, req.user._id);
    const tasks = await Task.find({ project: project._id }).select("_id");
    const taskIds = tasks.map((task) => task._id);
    await Promise.all([
        Project.deleteOne({ _id: project._id }),
        ProjectMember.deleteMany({ project: project._id }),
        Task.deleteMany({ project: project._id }),
        ProjectNote.deleteMany({ project: project._id }),
        SubTask.deleteMany({ task: { $in: taskIds } }),
    ]);
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Project deleted successfully"));
});

const archiveProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.projectId);
    if (!project) throw new ApiError(404, "Project not found");
    ensureOwner(project, req.user._id);
    project.isArchived = req.body.isArchived !== false;
    await project.save();
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                project,
                project.isArchived
                    ? "Project archived successfully"
                    : "Project restored successfully",
            ),
        );
});

const getProjectStats = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.projectId);
    if (!project) throw new ApiError(404, "Project not found");
    const member = await ProjectMember.exists({
        project: project._id,
        user: req.user._id,
    });
    if (!member && project.createdBy.toString() !== req.user._id.toString())
        throw new ApiError(403, "You do not have access to this project");

    const [statusCounts, priorityCounts, overdue, members, notes] =
        await Promise.all([
            Task.aggregate([
                { $match: { project: project._id } },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            Task.aggregate([
                { $match: { project: project._id } },
                { $group: { _id: "$priority", count: { $sum: 1 } } },
            ]),
            Task.countDocuments({
                project: project._id,
                dueDate: { $lt: new Date() },
                status: { $ne: "done" },
            }),
            ProjectMember.countDocuments({ project: project._id }),
            ProjectNote.countDocuments({ project: project._id }),
        ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totals: {
                    tasks: statusCounts.reduce(
                        (total, item) => total + item.count,
                        0,
                    ),
                    members,
                    notes,
                    overdue,
                },
                byStatus: Object.fromEntries(
                    statusCounts.map((item) => [item._id, item.count]),
                ),
                byPriority: Object.fromEntries(
                    priorityCounts.map((item) => [item._id, item.count]),
                ),
            },
            "Project statistics fetched successfully",
        ),
    );
});

export {
    createProject,
    listProjects,
    getProject,
    updateProject,
    deleteProject,
    archiveProject,
    getProjectStats,
};
