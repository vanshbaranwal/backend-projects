import { ApiResponse } from "../utils/apiResponse.utils.js";

const healthCheck = (req, res) => {
    res.status(200).json(
        new ApiResponse(200, { message: "server is running" })
    );
};

export { healthCheck };