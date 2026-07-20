import express from "express";
import dotenv from "dotenv";


import { ConnectDB } from "./config/db.config.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();
ConnectDB();

app.use("/api/v1/user", userRoutes);


app.listen(process.env.PORT, () => {
    console.log(`server is running at http://localhost:${process.env.PORT}`);
});

