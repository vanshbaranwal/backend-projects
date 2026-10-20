import { Router } from "express";
import {
    createNote,
    deleteNote,
    listNotes,
    updateNote,
} from "../controllers/note.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { noteValidator } from "../validators/index.js";

const router = Router();

router.use(verifyJWT);
router.route("/").post(noteValidator(), validate, createNote);
router.route("/project/:projectId").get(listNotes);
router.route("/:noteId").patch(updateNote).delete(deleteNote);
export default router;
