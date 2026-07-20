import mongoose from "mongoose";


export const ConnectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("database connection successful ✅");
    } catch (error) {
        console.log(error.message);
        throw new Error(`something went wrong ${error}`);
    }
}