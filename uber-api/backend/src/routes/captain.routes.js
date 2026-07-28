import express from "express";
import { authCaptain, authUser } from "../middleware/auth.middleware.js";
import { loginValidator, registerValidator } from "../validators/captain.validator.js";
import { getCaptainProfile, loginCaptain, logoutCaptain, registerCaptain } from "../controllers/captain.controller.js";


const captainRoutes = express.Router();


captainRoutes.post("/register", registerValidator, registerCaptain);

captainRoutes.post("/login", loginValidator, loginCaptain);

captainRoutes.get("/profile", authCaptain, getCaptainProfile);

captainRoutes.get("logout", authCaptain, logoutCaptain); 


export default captainRoutes;