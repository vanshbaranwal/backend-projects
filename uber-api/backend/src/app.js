import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/user.routes.js";
import { connectDB } from "./lib/db.lib.js";
import dotenv from "dotenv";

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
app.use("api/v1/users", router);



export default app;