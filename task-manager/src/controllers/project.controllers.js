import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { ProjectNote } from "../models/projectnote.models.js";
import { Task } from "../models/task.models.js";
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
    const projects = await Project.find({
        $or: [{ createdBy: req.user._id }, { _id: { $in: projectIds } }],
    });
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
    await Promise.all([
        Project.deleteOne({ _id: project._id }),
        ProjectMember.deleteMany({ project: project._id }),
        Task.deleteMany({ project: project._id }),
        ProjectNote.deleteMany({ project: project._id }),
    ]);
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Project deleted successfully"));
});

export {
    createProject,
    listProjects,
    getProject,
    updateProject,
    deleteProject,
};
