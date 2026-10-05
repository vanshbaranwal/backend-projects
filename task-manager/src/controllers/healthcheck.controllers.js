import { ApiResponse } from "../utils/apiResponse.utils.js";

const healthCheck = async(req, res) => {
    try {
        res.status(200).json(
            new ApiResponse(200, { message: "server is running" })
        );
        console.log("health check hit");
    } catch (error) {
        res.status(500).json(
            new ApiResponse(500, { message: "server error" })
        );
    }
};

export { healthCheck };