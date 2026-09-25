import mongoose from "mongoose";


const todoSchema = new mongoose.Schema({
    
    content: {
        type: String,
        required: true
    },

    complete: {
        type: Boolean,
        default: false
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,   // this is a type just like string, boolean this is also a type -- which means we are gonna give a refference of some other model to this model (here we are giving the reference of the User model)
        ref: "User" // this "User" is coming from this part of the User model mongoose.model("User", userSchema) the User here in the parameter in strings is getting reffered here
    },

    subTodos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubTodo"
        }
    ]   // array of subTodos

}, { timestamps: true });



export const Todo = mongoose.model("Todo", todoSchema);