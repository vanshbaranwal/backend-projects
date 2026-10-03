import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";


export const registerUser = async (req, res) => {

    const { name, email, password, phone } = req.body;

    if(!name || !email || !password || !phone){
        console.log("data is missing");
        return res.status(400).json({
            success: false,
            message: "all fields are required"
        });
    }

    try {
        
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "user already exists"
            });
        }

        // hash the password
        const hashPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString("hex");

        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: hashPassword,
                verificationToken
            }
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "registration failed internal server error"
        });
    }

};


export const loginUser = async(req, res) => {
    const { email, password } = req.body;

    if(!email || !password){
        return res.status(400).json({
            success: false,
            message: "all fields are required"
        });
    }

    try {
        
        const user = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if(!user){
            return res.status(400).json({
                success: false,
                message: "invalid credentials"
            });
        }

        const isMatch = bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({
                success: false,
                message: "invalid credentials"
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET,
            { expiresIn: process.env.EXPIRES_IN }
        );

        const cookieOptions = {
            httpOnly: true, //cookie gets in the control of the backend and a normal user can not tease it
            secure: process.env.NODE_ENV === "production",
            samesite: "none",
            maxAge: 24*60*60*1000 //24h
        };
        res.cookie("token", token, cookieOptions);

        res.status(200).json({
            success: true,
            message: "user login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "login failed internal server error"
        });
    }
};