import captainModal from "../models/captain.model.js";
import { validationResult } from "express-validator";
import { createCaptain } from "../services/captain.services.js";

export const registerCaptain = async(req, res) => {
    try {
        
        const error = validationResult(req);

        if(!error.isEmpty()){
            return res.status(400).json({
                error: error.array(),
            });
        };

        const { fullname, email, password, vehicle } = req.body;

        const isCaptainAlreadyExists = await captainModal.findOne({ email });
        if(isCaptainAlreadyExists){
            return res.status(400).json({
                message: "captain already exists",
            });
        };

        const hashedPassword = await captainModal.hashPassword(password);

        const captain = await createCaptain({
            firstname: fullname.firstname,
            lastname: fullname.lastname,
            email,
            password: hashedPassword,
            color: vehicle.color,
            plate: vehicle.plate,
            capacity: vehicle.capacity,
            vehicleType: vehicle.vehicleType,
        });

        const token = captain.generateAuthToken();

        return res.status(201).json({ token, captain });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "internal server error",
        });
    };
};

export const loginCaptain = async(req, res) => {
    try {
        
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({
                errors: errors.array(),
            });
        };

        const { email, password } = req.body;

        const captain = await captainModal.findOne({ email }).select("+password");
        if(!captain){
            return res.status(400).json({
                message: "invalid credentials",
            });
        };

        const isMatch = await captain.comparePassword(password);
        if(!isMatch){
            return res.status(400).json({
                message: "invalid credentials",
            });
        };

        const token = captain.generateAuthToken();
        res.cookie("token", token);
        res.status(200).json({ token, captain });


    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "internal server error",
        });
    }
};


export const getCaptainProfile = async(req, res) => {
    res.status(200).json({
        captain: req.captain,
    });
};


export const logoutCaptain = async(req, res) => {
    res.clearCookie("token");
    res.status(200).json({
        message: "logged out successfully",
    });
};