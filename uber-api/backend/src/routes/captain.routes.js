import express from "express";
import { authUser } from "../middleware/auth.middleware.js";
import { loginValidator, registerValidator } from "../validators/captain.validator.js";


const captainRoutes = express.Router();


captainRoutes.post("/register", registerValidator);

captainRoutes.post("/login", loginValidator);

// captainRoutes.get("/profile")

// captainRoutes.get("logout")


export default captainRoutes;