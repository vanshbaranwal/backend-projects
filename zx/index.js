import express from "express";
import dotenv from "dotenv";
import cors from "cors";  // cors ke errors humesha backend pai resolve krte h
import db from "./utils/db.utils.js";
import cookieParser from "cookie-parser";

// routes
import userRoutes from "./routes/user.routes.js";


dotenv.config();    


const app = express();
const port = process.env.PORT;

app.use(cors({
    origin: process.env.BASE_URL,
    credentials: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

//this is used to send the json data suppose we send the data from the postman { "name": "vanshbaranwal" } so to make express understand this we use express.json() 
app.use(express.json());
// this is used for the url encoding suppose this is my url -> http://localhost:3000/vansh%21baranwal so inn here the to handle this %21 we use urlencoding
app.use(express.urlencoded({ extended: true })); 
// this helps us accessing the cookies
app.use(cookieParser()); 

app.get("/", (req, res) => {
    res.send("learnning from cohort");
});

app.get("/vansh", (req, res) => {
    res.send("vanshbaranwal");
});

// connect to db
db();

// userRoutes
app.use("/api/v1/users", userRoutes);

app.listen(port, () => {
    console.log(`example app is listening on port: ${port}`);
});

