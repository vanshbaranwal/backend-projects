import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/auth.route.js";

dotenv.config();

const app = express();
const port = process.env.PORT;


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.BASE_URL,
    credentials: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));


app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "test checked"
    })
});


app.use("/api/v1/users", userRouter);


app.listen(port, () => {
    console.log(`backend is listening at port: ${port}`);
});