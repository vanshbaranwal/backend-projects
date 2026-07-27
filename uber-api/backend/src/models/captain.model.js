import mongoose, { mongo } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const captainSchema = new mongoose.Schema({
    fullname: {
        firstname: {
            type: String,
            required: true,
            minLength: [3, "firstname should be atleast 3 characters long"],
        },
        lastname: {
            type: String,
            minLength: [3, "lastname should be 3 characters long"],
        },
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        minLength: [5, "email should be atleast 5 characters long"],
        match: [/^\S+@\S+\.\S+$/, "invalid email address"],
    },

    password: {
        type: String,
        required: true,
        select: false,
    },

    socketId: {
        type: String,
    },

    status: {
        type: String,
        enum: [ 'active', 'inactive' ],
        default: 'inactive',
    },

    vehicles: {
        color: {
            type: String,
            required: true,
            minLength: [3, "color should be atleast 3 characters long"],
        },
        plate: {
            type: String,
            required: true,
            minLength: [3, "plate should be atleast 3 characters long"],
        },
        capacity: {
            type: Number,
            required: true,
            minLength: [1, "capacity should be atleast 1 character long"],
        },
        vehicleType: {
            type: String,
            required: true,
            enum: ["car", "motorcycle", "auto"]
        },
    },

    location: {
        // latitude and longitude
        ltd: {
            type: Number,
        },
        lng: {
            type: Number,
        },
    },

});


captainSchema.methods.generateAuthToken = function(){
    const token = jwt.sign({
        _id: this_id,
    }, process.env.JWT_SECRET, { expiresIn: "24h" });
    
    return token;
};

captainSchema.methods.comparePassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
};

captainSchema.statics.hashPassword = async function(password){
    return await bcrypt.hash(password, 10);
};


const captainModal = mongoose.model("captain", captainSchema);

export default captainModal;