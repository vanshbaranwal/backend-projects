import { Router } from "express";
import { registerUser } from "../controllers/auth.controllers.js";
import {
    getCurrentUser,
    loginUser,
    logoutUser,
} from "../controllers/auth.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
    userLoginValidator,
    userRegistrationValidator,
} from "../validators/index.js";

const router = Router();

router
    .route("/register")
    .post(userRegistrationValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);

export default router;
