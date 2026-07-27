import { body } from "express-validator";


export const registerValidator = [
    body("email").isEmail().withMessage("invalid email"),
    body("fullname.firstname").isLength({ min: 3 }).withMessage("first name must be atleast 3 characters long"),
    body("password").isLength({ min: 6 }).withMessage("password must be atleast 6 characters long"),
    body("vehicle.color").isLength({ min: 3 }).withMessage("color must be atleast 3 characters long"),
    body("vehicle.plate").isLength({ min: 3 }).withMessage("plate must be atleast 3 characters long"),
    body("vehicle.capacity").isInt({ min: 1 }).withMessage("capacity must be atleast 1"),
    body("vehicle.vehicleType").isIn([ "car", "motorcycle", "auto" ]).withMessage("invalid vehicle type"),
];

export const loginValidator = [
    body("email").isEmail().withMessage("invalid email"),
    body("password").isLength({ min: 6 }).withMessage("password must be atleast 6 characters long"),
];

