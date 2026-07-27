import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/user.routes.js";
import { connectDB } from "./lib/db.lib.js";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes.js";
import captainRoutes from "./routes/captain.routes.js";

const app = express();

dotenv.config();

connectDB();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());


// route
app.get("/", (req, res) => {
    res.json({
        message: "welcome to the uber-api",
    });
});

// our application api roputes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/captain", captainRoutes);



export default app;