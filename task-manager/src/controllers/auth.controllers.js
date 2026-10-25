import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiErrors.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
    emailVerificationMailGenContent,
    forgotPasswordMailGenContent,
    sendMail,
} from "../utils/mail.utils.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
};

const createTokens = async (user) => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
};

const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password, fullname } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        throw new ApiError(409, "Email or username is already registered");
    }

    const user = await User.create({
        email,
        username,
        password,
        fullname,
    });
    const verificationToken = user.generateTemporaryToken();
    user.emailVerificationToken = verificationToken.hashedToken;
    user.emailVerificationExpiry = verificationToken.tokenExpiry;
    await user.save({ validateBeforeSave: false });
    await sendMail({
        email: user.email,
        subject: "Verify your Task Manager email",
        mailGenContent: emailVerificationMailGenContent(
            user.username,
            `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email/${verificationToken.unHashedToken}`,
        ),
    });
    const safeUser = await User.findById(user._id).select(
        "-password -refreshToken",
    );

    return res
        .status(201)
        .json(new ApiResponse(201, safeUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !(await user.isPasswordCorrect(password))) {
        throw new ApiError(401, "Invalid email or password");
    }

    const tokens = await createTokens(user);
    const safeUser = await User.findById(user._id).select(
        "-password -refreshToken",
    );

    return res
        .status(200)
        .cookie("accessToken", tokens.accessToken, cookieOptions)
        .cookie("refreshToken", tokens.refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { user: safeUser, ...tokens },
                "Login successful",
            ),
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, null, "Logout successful"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched successfully"),
        );
});

const updateProfile = asyncHandler(async (req, res) => {
    const { username, email, fullname } = req.body;
    const duplicate = await User.findOne({
        _id: { $ne: req.user._id },
        $or: [{ username }, { email }],
    });
    if (duplicate)
        throw new ApiError(409, "Username or email is already in use");

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { username, email, fullname } },
        { new: true, runValidators: true },
    ).select("-password -refreshToken");
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Profile updated successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.isPasswordCorrect(currentPassword)))
        throw new ApiError(401, "Current password is incorrect");

    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save();
    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(
                200,
                null,
                "Password changed successfully; please log in again",
            ),
        );
});

const searchUsers = asyncHandler(async (req, res) => {
    const query = String(req.query.q || "").trim();
    if (query.length < 2)
        throw new ApiError(
            400,
            "Search query must contain at least 2 characters",
        );

    const users = await User.find({
        _id: { $ne: req.user._id },
        $or: [
            { username: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
            { fullname: { $regex: query, $options: "i" } },
        ],
    })
        .select("username email fullname avatar")
        .limit(20);
    return res
        .status(200)
        .json(new ApiResponse(200, users, "Users found successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!incomingToken) throw new ApiError(401, "Refresh token is required");

    let decodedToken;
    try {
        decodedToken = jwt.verify(
            incomingToken,
            process.env.REFRESH_TOKEN_SECRET,
        );
    } catch {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findOne({
        _id: decodedToken._id,
        refreshToken: incomingToken,
    });
    if (!user) throw new ApiError(401, "Refresh token is no longer valid");
    const tokens = await createTokens(user);
    return res
        .status(200)
        .cookie("accessToken", tokens.accessToken, cookieOptions)
        .cookie("refreshToken", tokens.refreshToken, cookieOptions)
        .json(
            new ApiResponse(200, tokens, "Access token refreshed successfully"),
        );
});

const verifyEmail = asyncHandler(async (req, res) => {
    const user = await User.findOne({
        emailVerificationToken: hashToken(req.params.token),
        emailVerificationExpiry: { $gt: new Date() },
    });
    if (!user)
        throw new ApiError(
            400,
            "Email verification token is invalid or expired",
        );

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Email verified successfully"));
});

const forgotPassword = asyncHandler(async (req, res) => {
    const user = await User.findOne({
        email: req.body.email.toLowerCase().trim(),
    });
    if (user) {
        const resetToken = user.generateTemporaryToken();
        user.forgotPasswordToken = resetToken.hashedToken;
        user.forgotPasswordExpiry = resetToken.tokenExpiry;
        await user.save({ validateBeforeSave: false });
        await sendMail({
            email: user.email,
            subject: "Reset your Task Manager password",
            mailGenContent: forgotPasswordMailGenContent(
                user.username,
                `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${resetToken.unHashedToken}`,
            ),
        });
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "If that email exists, a reset link has been sent",
            ),
        );
});

const resetPassword = asyncHandler(async (req, res) => {
    const user = await User.findOne({
        forgotPasswordToken: hashToken(req.params.token),
        forgotPasswordExpiry: { $gt: new Date() },
    });
    if (!user)
        throw new ApiError(400, "Password reset token is invalid or expired");

    user.password = req.body.password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    user.refreshToken = undefined;
    await user.save();
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Password reset successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Avatar file is required");
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            avatar: {
                url: `/images/${req.file.filename}`,
                localpath: req.file.path,
            },
        },
        { new: true, runValidators: true },
    ).select("-password -refreshToken");
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    refreshAccessToken,
    verifyEmail,
    forgotPassword,
    resetPassword,
    updateAvatar,
    updateProfile,
    changePassword,
    searchUsers,
};
