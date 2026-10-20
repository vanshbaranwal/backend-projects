import { Router } from "express";
import {
    createTask,
    deleteTask,
    getTask,
    listTasks,
    updateTask,
} from "../controllers/task.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { taskValidator } from "../validators/index.js";

const router = Router();

router.use(verifyJWT);
router
    .route("/")
    .post(
        upload.array("attachments", 5),
        taskValidator(),
        validate,
        createTask,
    );
router.route("/project/:projectId").get(listTasks);
router.route("/:taskId").get(getTask).patch(updateTask).delete(deleteTask);
export default router;
