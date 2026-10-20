import { ApiResponse } from "../utils/apiResponse.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";
import mongoose from "mongoose";

const healthCheck = asyncHandler(async (req, res) => {
    const databaseConnected = mongoose.connection.readyState === 1;
    return res.status(databaseConnected ? 200 : 503).json(
        new ApiResponse(databaseConnected ? 200 : 503, {
            message: databaseConnected
                ? "server is running"
                : "database is unavailable",
            database: databaseConnected ? "connected" : "disconnected",
            uptime: Math.round(process.uptime()),
        }),
    );
});

export { healthCheck };
