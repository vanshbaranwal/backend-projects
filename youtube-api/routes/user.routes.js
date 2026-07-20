import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/user.model.js";

const router = express.Router();

router.post("/signup", async(req, res) => {
    try {
        const hashcode = await bcrypt.hash(req.body.password, 10);
    } catch (error) {
        
    }
});


export default router; 