import express from "express";
import { loginValidator, registerValidator } from "../validators/user.validator.js";
import { getUserProfile, loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { authUser } from "../middleware/auth.middleware.js";

const userRoutes = express.Router();


userRoutes.post("/register", registerValidator, registerUser);

userRoutes.post("/login", loginValidator, loginUser);

userRoutes.get("/profile", authUser, getUserProfile);

userRoutes.get("/logout", authUser, logoutUser);



export default userRoutes;