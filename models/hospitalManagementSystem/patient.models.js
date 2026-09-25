import mongoose from "mongoose";


const patientSchema = new mongoose.model({

    name: {
        type: String,
        required: true
    },

    diagonsedWith: {
        type: String,
        required: true
    },

    address: {
        type: String,
        required: true
    },

    age: {
        type: Number,
        required: true
    },

    bloodGroup: {
        type: String,
        required: true
    },

    gender: {
        type: String,
        required: true,
        enum: ["MALE", "FEMALE", "OTHER"],
    },

    addmittedIn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hospital"
    }

}, { timestamps: true });




export const Patient = mongoose.model("Patient", patientSchema);