import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { ProjectNote } from "../models/projectnote.models.js";
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
};

const createNote = asyncHandler(async (req, res) => {
    await ensureProjectAccess(req.body.project, req.user._id);
    const note = await ProjectNote.create({
        project: req.body.project,
        content: req.body.content,
        createdBy: req.user._id,
    });
    return res
        .status(201)
        .json(new ApiResponse(201, note, "Note created successfully"));
});

const listNotes = asyncHandler(async (req, res) => {
    await ensureProjectAccess(req.params.projectId, req.user._id);
    const notes = await ProjectNote.find({
        project: req.params.projectId,
    }).populate("createdBy", "username email");
    return res
        .status(200)
        .json(new ApiResponse(200, notes, "Notes fetched successfully"));
});

const updateNote = asyncHandler(async (req, res) => {
    const note = await ProjectNote.findById(req.params.noteId);
    if (!note) throw new ApiError(404, "Note not found");
    await ensureProjectAccess(note.project, req.user._id);
    if (note.createdBy.toString() !== req.user._id.toString())
        throw new ApiError(403, "Only the note creator can update this note");
    const updatedNote = await ProjectNote.findByIdAndUpdate(
        note._id,
        { content: req.body.content },
        { new: true, runValidators: true },
    );
    return res
        .status(200)
        .json(new ApiResponse(200, updatedNote, "Note updated successfully"));
});

const deleteNote = asyncHandler(async (req, res) => {
    const note = await ProjectNote.findById(req.params.noteId);
    if (!note) throw new ApiError(404, "Note not found");
    await ensureProjectAccess(note.project, req.user._id);
    if (note.createdBy.toString() !== req.user._id.toString())
        throw new ApiError(403, "Only the note creator can delete this note");
    await note.deleteOne();
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Note deleted successfully"));
});

export { createNote, listNotes, updateNote, deleteNote };
