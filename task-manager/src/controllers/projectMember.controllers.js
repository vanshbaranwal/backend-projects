import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiErrors.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { UserRolesEnum } from "../utils/constants.utils.js";

const findProject = async (projectId) => {
    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");
    return project;
};

const ensureProjectManager = async (projectId, userId) => {
    const project = await findProject(projectId);
    if (project.createdBy.toString() === userId.toString()) return project;

    const membership = await ProjectMember.findOne({
        project: projectId,
        user: userId,
    });
    if (
        !membership ||
        ![UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN].includes(
            membership.role,
        )
    ) {
        throw new ApiError(403, "Only project admins can manage members");
    }
    return project;
};

const ensureProjectAccess = async (projectId, userId) => {
    const project = await findProject(projectId);
    const member = await ProjectMember.exists({
        project: projectId,
        user: userId,
    });
    if (!member && project.createdBy.toString() !== userId.toString()) {
        throw new ApiError(403, "You do not have access to this project");
    }
    return project;
};

const listMembers = asyncHandler(async (req, res) => {
    await ensureProjectAccess(req.params.projectId, req.user._id);
    const members = await ProjectMember.find({
        project: req.params.projectId,
    }).populate("user", "username email fullname avatar");
    return res
        .status(200)
        .json(new ApiResponse(200, members, "Members fetched successfully"));
});

const addMember = asyncHandler(async (req, res) => {
    await ensureProjectManager(req.params.projectId, req.user._id);
    const { email, username, role = UserRolesEnum.MEMBER } = req.body;
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (!user) throw new ApiError(404, "User not found");

    const existingMember = await ProjectMember.exists({
        project: req.params.projectId,
        user: user._id,
    });
    if (existingMember)
        throw new ApiError(409, "User is already a project member");

    const member = await ProjectMember.create({
        project: req.params.projectId,
        user: user._id,
        role,
    });
    const populatedMember = await member.populate(
        "user",
        "username email fullname avatar",
    );
    return res
        .status(201)
        .json(
            new ApiResponse(201, populatedMember, "Member added successfully"),
        );
});

const updateMemberRole = asyncHandler(async (req, res) => {
    const project = await ensureProjectManager(
        req.params.projectId,
        req.user._id,
    );
    const member = await ProjectMember.findOne({
        project: project._id,
        user: req.params.userId,
    });
    if (!member) throw new ApiError(404, "Project member not found");
    if (member.user.toString() === project.createdBy.toString())
        throw new ApiError(400, "The project owner role cannot be changed");

    member.role = req.body.role;
    await member.save();
    return res
        .status(200)
        .json(new ApiResponse(200, member, "Member role updated successfully"));
});

const removeMember = asyncHandler(async (req, res) => {
    const project = await ensureProjectManager(
        req.params.projectId,
        req.user._id,
    );
    const member = await ProjectMember.findOne({
        project: project._id,
        user: req.params.userId,
    });
    if (!member) throw new ApiError(404, "Project member not found");
    if (member.user.toString() === project.createdBy.toString())
        throw new ApiError(400, "The project owner cannot be removed");

    await member.deleteOne();
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Member removed successfully"));
});

export { listMembers, addMember, updateMemberRole, removeMember };
