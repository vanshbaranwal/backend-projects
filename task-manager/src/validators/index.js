import { body } from "express-validator";

// these are just validations which means it is not checking in the database but before that only

const userRegistrationValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("email is required")
            .isEmail()
            .withMessage("email is invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("username is required")
            .isLength({ min: 3 })
            .withMessage("username must be at least 3 characters long")
            .isLength({ max: 13 })
            .withMessage("username must be at most 13 characters long"),
        body("fullname").trim().notEmpty().withMessage("full name is required"),
        body("password")
            .isLength({ min: 6 })
            .withMessage("password must be at least 6 characters long"),
    ];
};

const userLoginValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("email is required")
            .isEmail()
            .withMessage("email is invalid"),
        body("password").notEmpty().withMessage("password is required"),
    ];
};

const projectValidator = () => [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("project name is required")
        .isLength({ max: 100 })
        .withMessage("project name must be at most 100 characters"),
];

const taskValidator = () => [
    body("title").trim().notEmpty().withMessage("task title is required"),
    body("project").isMongoId().withMessage("a valid project is required"),
];

const subTaskValidator = () => [
    body("title").trim().notEmpty().withMessage("subtask title is required"),
    body("task").isMongoId().withMessage("a valid task is required"),
];

const noteValidator = () => [
    body("content").trim().notEmpty().withMessage("note content is required"),
    body("project").isMongoId().withMessage("a valid project is required"),
];

const profileValidator = () => [
    body("username")
        .trim()
        .isLength({ min: 3, max: 13 })
        .withMessage("username must be 3 to 13 characters long"),
    body("email").trim().isEmail().withMessage("email is invalid"),
    body("fullname").trim().notEmpty().withMessage("full name is required"),
];

const changePasswordValidator = () => [
    body("currentPassword")
        .notEmpty()
        .withMessage("current password is required"),
    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("new password must be at least 6 characters long"),
];

export {
    userRegistrationValidator,
    userLoginValidator,
    projectValidator,
    taskValidator,
    subTaskValidator,
    noteValidator,
    profileValidator,
    changePasswordValidator,
};
