import { Router } from "express";
import {
    createProject,
    deleteProject,
    getProject,
    listProjects,
    updateProject,
    archiveProject,
    getProjectStats,
} from "../controllers/project.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { projectValidator } from "../validators/index.js";
import {
    addMember,
    listMembers,
    removeMember,
    updateMemberRole,
} from "../controllers/projectMember.controllers.js";

const router = Router();

router.use(verifyJWT);
router
    .route("/")
    .post(projectValidator(), validate, createProject)
    .get(listProjects);
router.route("/:projectId/members").get(listMembers).post(addMember);
router.route("/:projectId/stats").get(getProjectStats);
router.route("/:projectId/archive").patch(archiveProject);
router
    .route("/:projectId/members/:userId")
    .patch(updateMemberRole)
    .delete(removeMember);
router
    .route("/:projectId")
    .get(getProject)
    .patch(updateProject)
    .delete(deleteProject);
export default router;
