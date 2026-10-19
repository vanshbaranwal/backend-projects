import { Router } from "express";
import {
    createProject,
    deleteProject,
    getProject,
    listProjects,
    updateProject,
} from "../controllers/project.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addMember,
    listMembers,
    removeMember,
    updateMemberRole,
} from "../controllers/projectMember.controllers.js";

const router = Router();

router.use(verifyJWT);
router.route("/").post(createProject).get(listProjects);
router.route("/:projectId/members").get(listMembers).post(addMember);
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
