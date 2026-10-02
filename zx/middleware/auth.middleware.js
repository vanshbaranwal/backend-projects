import jwt from "jsonwebtoken";

export const isLoggedIn = async(req, res, next) => {
    try {
        
        console.log(req.cookies);

        const token = req.cookies?.token // the question mark says -> aagar cookies ke ander token h toh mujhe dedo warna khaali rehne do 
        
        console.log("token found: ", token ? "yes" : "no"); // if token is foound return yes otherwise no

        if(!token){
            console.log("no token");
            return res.status(401).json({
                success: false,
                message: "authentication failed"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("decoded: ", decoded);

        req.user = decoded;

        next();
    } catch (error) {
        console.log("auth middleware failure");
        return res.status(500).json({
            success: false,
            message: "internal server error",
            error: error.message
        });

    }
}