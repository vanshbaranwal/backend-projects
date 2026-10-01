import mongoose from "mongoose";
import dotenv from "dotenv";


dotenv.config();
// export a function that connects to the db

const db = () => {
    mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
        console.log("connection to the database successful!");
    })
    .catch((err) => {
        console.log("error connecting to the databse");
    })
};

export default db;