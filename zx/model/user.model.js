import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({

    name: String,
    
    email: String,
    
    password: String,
    
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    verificationToken: {
        type: String
    },

    resetPasswordToken: {
        type: String
    },

    resetPasswordExpiry: {
        type: Date
    },

}, { timestamps: true });



userSchema.pre("save", async function(next) {
    
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10); // hash means -> supoose the password is 56 and it get hashed to 78 then when when the user types 56 it gets hashed to 78 whereas, in encryption and decryption the state changes 56 get converted to 78 and 78 to 56 not same as in hashing it stores it like that only. and 10 is for rounds 10 rounds of hashing
    }

    next;
});


const User = mongoose.model("User", userSchema);

export default User;