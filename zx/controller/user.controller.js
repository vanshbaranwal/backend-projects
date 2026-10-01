import User from "../model/user.model.js";
import crypto from "crypto"; // it is used to generate random bytes 
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const registerUser = async(req, res) => {
    
    // get data
    // validate
    // check if user already exists
    // create a user in the database
    // create a verification token
    // save token in database
    // send token as email to user
    // send success to user

    const { name, email, password } = req.body;

    if(!name || !email || !password){
        return res.status(400).json({
            message: "all fields are required"
        });
    }

    try {
        const existingUser = await User.findOne({ email });

        if(existingUser){
            return res.status(400).json({
                message: "user already exists"
            });
        }

        const user = await User.create({
            name,
            email,
            password
        });
        console.log(user);

        if(!user){
            return res.status(400).json({
                message: "user not registered"
            });
        }

        const token = crypto.randomBytes(32).toString("hex");
        console.log("token: ", token);

        user.verificationToken = token;
        await user.save();

        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASS,
            },
        });

        const mailOption = {
            from: process.env.SENDER_EMAIL, // sender address
            to: user.email, // list of recipients
            subject: "verify your email", // subject line
            text: `please click on the following link:\n${process.env.BASE_URL}/api/v1/users/verify/${token}`, // plain text body
            html: `<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify Your Email</title>
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
                            <tr>
                                <td align="center" style="padding: 40px 0;">
                                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                        <tr>
                                            <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #4F46E5; border-radius: 8px 8px 0 0;">
                                                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Verify Your Email</h1>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 40px 40px 20px 40px;">
                                                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.5;">Hi there,</p>
                                                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.5;">Thank you for signing up! Please verify your email address by clicking the button below:</p>
                                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                                    <tr>
                                                        <td align="center">
                                                            <a href="${process.env.BASE_URL}/api/v1/users/verify/${token}" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">Verify Email</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                                <p style="margin: 0 0 20px 0; color: #6B7280; font-size: 14px; line-height: 1.5;">Or copy and paste this link into your browser:</p>
                                                <p style="margin: 0 0 20px 0; padding: 12px 16px; background-color: #F3F4F6; border-radius: 4px; word-break: break-all;">
                                                    <a href="${process.env.BASE_URL}/api/v1/users/verify/${token}" style="color: #4F46E5; text-decoration: none; font-size: 14px;">${process.env.BASE_URL}/api/v1/users/verify/${token}</a>
                                                </p>
                                                <p style="margin: 0; color: #6B7280; font-size: 14px; line-height: 1.5;">If you didn't create an account, you can safely ignore this email.</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 20px 40px 40px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                                                <p style="margin: 0; color: #9CA3AF; font-size: 12px; line-height: 1.5;">This is an automated message. Please do not reply to this email.</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>`
        };

        await transporter.sendMail(mailOption);
        console.log("email sent: \n", mailOption);

        res.status(201).json({
            success: true,
            message: "user registered successfully"
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "user registration failed",
            error: error.message
        });
    }
};

const verifyUser = async(req, res) => {
    // get token from url
    // validate
    // find user based on token
    // if not 
    // set isVerified to true
    // remove verification token
    // save
    // return response

    try {

        const { token } = req.params;
    
        if(!token){
            return res.status(400).json({
                message: "invalid token"
            });
        }
    
        const user = await User.findOne({
            verificationToken: token
        });
    
        if(!user){
            return res.status(400).json({
                message: "invalid token"
            });
        }
    
        user.isVerified = true;
        user.verificationToken = undefined;
    
        await user.save();
        
        return res.status(200).json({
            success: true,
            message: "email verified successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "user verification failed",
            error: error.message
        });
    }

};

const loginUser = async(req, res) => {
    const { email, password } = req.body;

    if(!email || !password){
        return res.status(400).json({
            message: "all fields are required"
        });
    }

    try {
        const user = await User.findOne({ email });

        if(!user){
            return res.status(401).json({
                message: "invalid credentials"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("isMatch: ", isMatch);

        if(!isMatch){
            return res.status(401).json({
                message: "invalid credentials"
            });
        }

        if(!user.isVerified){
            return res.status(400).json({
                message: "user is not verified please verify your email"
            });
        }

        const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN });
        console.log("jwt token:", token);

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
            message: "user login failed",
            error: error.message
        });
    }
};

const getMe = async(req, res) => {
    
    try {
        
    } catch (error) {
        
    }
};

const logoutUser = async(req, res) => {
    try {
        
    } catch (error) {
        
    }
};

const forgotPassword = async(req, res) => {
    try {
        
    } catch (error) {
        
    }
};

const resetPassword = async(req, res) => {
    try {
        
    } catch (error) {
        
    }
};


export { registerUser, verifyUser, loginUser, logoutUser, forgotPassword, resetPassword, getMe };