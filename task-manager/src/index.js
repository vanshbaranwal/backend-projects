import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.db.js";


dotenv.config({
    path: "./.env"
});

const port = process.env.PORT;

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log("server is running on port : ", port);
        });
    })
    .catch((err) => {
        console.error("mongodb connection error: ", err);
        process.exit(1);
    });





