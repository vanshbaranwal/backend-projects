import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

router.post("/signup", async(req, res) => {
    try {
        const hashedpassword = await bcrypt.hash(req.body.password, 10);
        const uploadImage = await cloudinary.uploader.upload(
            req.files.logo.tempFilePath
        );
        console.log("image : ", uploadImage);

        const newUser = new User({
            _id: new mongoose.Schema.Types.ObjectId,
            email: req.body.email,
            password: hashedpassword,
            channelName: req.body.channelName,
            phone: req.body.phone,
            logoUrl: uploadImage.secure_url,
            logoId: uploadImage.public_id
        });

        let user = await newUser.save();

        res.status(201).json({
            user
        })

    } catch (error) {
        
    }
});


export default router; 