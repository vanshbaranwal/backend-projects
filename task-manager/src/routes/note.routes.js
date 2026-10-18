import { Router } from "express";
import {
    createNote,
    deleteNote,
    listNotes,
    updateNote,
} from "../controllers/note.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.route("/").post(createNote);
router.route("/project/:projectId").get(listNotes);
router.route("/:noteId").patch(updateNote).delete(deleteNote);
export default router;
