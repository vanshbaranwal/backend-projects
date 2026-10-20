import { Router } from "express";
import {
    createSubTask,
    deleteSubTask,
    listSubTasks,
    updateSubTask,
} from "../controllers/subtask.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { subTaskValidator } from "../validators/index.js";

const router = Router();

router.use(verifyJWT);
router.route("/").post(subTaskValidator(), validate, createSubTask);
router.route("/task/:taskId").get(listSubTasks);
router.route("/:subTaskId").patch(updateSubTask).delete(deleteSubTask);

export default router;
