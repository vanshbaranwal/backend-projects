import express from "express";
import { loginValidator, registerValidator } from "../validators/user.validator.js";
import { loginUser, registerUser } from "../controllers/user.controller.js";

const router = express.Router();


router.post("/register", registerValidator, registerUser);

router.post("/login", loginValidator, loginUser);

// router.get("/profile");

// router.get("/logout");



export default router;