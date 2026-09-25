import mongoose from "mongoose";
import { stringify } from "node:querystring";


const hospitalSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    addressLine1: {
        type: String,
        required: true
    },

    addressLine2: {
        type: String
    },

    city: {
        type: String,
        required: true
    },

    pincode: {
        type: String,   // using string here cause in some countries the pincodes also include alphabets 
        required: true
    },

    specializedIn: [
        {
            type: String,
        }
    ]

}, { timestamps: true });




export const Hospital = mongoose.model("Hospital", hospitalSchema);