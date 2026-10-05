import { asyncHandler } from "../utils/asyncHandler.utils.js";

const registerUser = asyncHandler(async(req, res) => {
    const { email, username, password, role } = req.body;
});

export { registerUser };