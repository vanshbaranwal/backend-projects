import { ApiError } from "../utils/apiErrors.utils.js";

export const errorHandler = (err, req, res, next) => {
    const error =
        err instanceof ApiError
            ? err
            : new ApiError(500, err?.message || "Internal server error");

    if (err?.name === "ValidationError") {
        error.statusCode = 400;
        error.message = "Database validation failed";
    }

    if (err?.code === 11000) {
        error.statusCode = 409;
        error.message = "A record with that value already exists";
    }

    res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
};
