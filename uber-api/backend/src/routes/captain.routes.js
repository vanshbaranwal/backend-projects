import express from "express";
import { authUser } from "../middleware/auth.middleware.js";
import { loginValidator, registerValidator } from "../validators/captain.validator.js";
import { loginCaptain, registerCaptain } from "../controllers/captain.controller.js";


const captainRoutes = express.Router();


captainRoutes.post("/register", registerValidator, registerCaptain);

captainRoutes.post("/login", loginValidator, loginCaptain);

// captainRoutes.get("/profile")

// captainRoutes.get("logout")


export default captainRoutes;