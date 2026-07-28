import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import captainModal from "../models/captain.model.js";


export const authUser = async(req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if(!token){
        return res.status(401).json({
            message: "Unauthorized",
        });
    };

    try {
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded._id);
        req.user = user;

        return next();

    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    };
};


export const authCaptain = async(req, res) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if(!token){
        return res.status(401).json({
            message: "Unauthorized",
        });
    };

    try {
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const captain = await captainModal.findById(decoded._id);

        req.captain = captain;

        return next();

    } catch (error) {
        console.log(error);
        return res.status(401).json({
            message: "Unauthorized",
        });
    };

};  