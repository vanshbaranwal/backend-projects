import { body } from "express-validator";

// these are just validations which means it is not checking in the database but before that only


const userRegistrationValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty().withMessage("email is required")
            .isEmail().withMessage("email is invalid"),
        body("username")
            .trim()
            .notEmpty().withMessage("uername is required")
            .isLength({ min: 3 }).withMessage("the username should be atleast 3 characters long")
            .isLength({ max: 13 }).withMessage("the username should be within 13 characters")
    ]
};


const userLoginValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty().withMessage("email is required")
            .isEmail().withMessage("email is invalid"),
        body("password")
            .notEmpty().withMessage("password is required")

    ]
};

export { userRegistrationValidator, userLoginValidator };