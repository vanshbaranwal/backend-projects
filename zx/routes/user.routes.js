import express from "express";
import { forgotPassword, getMe, loginUser, registerUser, resetPassword, verifyUser } from "../controller/user.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";


const router = express.Router();


router.post("/register", registerUser);
router.get("/verify/:token", verifyUser); // the /:token is coming from the verify controller from this line => const { token } = req.params;
router.post("/login", loginUser);
router.get("/me", isLoggedIn, getMe);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password", resetPassword);

export default router;