import { Router } from "express";
import {
    forgotPassword,
    getCurrentUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    resetPassword,
    updateAvatar,
    updateProfile,
    changePassword,
    searchUsers,
    verifyEmail,
} from "../controllers/auth.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
    userLoginValidator,
    userRegistrationValidator,
    profileValidator,
    changePasswordValidator,
} from "../validators/index.js";

const router = Router();

router
    .route("/register")
    .post(userRegistrationValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/verify-email/:token").get(verifyEmail);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:token").post(resetPassword);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);
router
    .route("/me")
    .patch(verifyJWT, profileValidator(), validate, updateProfile);
router
    .route("/password")
    .patch(verifyJWT, changePasswordValidator(), validate, changePassword);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
router.route("/users/search").get(verifyJWT, searchUsers);

export default router;
