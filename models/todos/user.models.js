import mongoose from "mongoose";


// mongoose helps in maing the schema | schema is made through the new keywrod always |
// Schema is a constructor which creates an object |
// We use new with Schema because we want a brand-new schema object created from the Schema constructor
// A constructor creates and prepares a new object |
// A method performs an action on an existing object |
// A constructor initializes a newly created object; a method defines behavior for an existing object

const userSchema = new mongoose.Schema({
    
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },

    password: {
        type: String,
        required: [true, "passsword is required"]
    }

}, {

    timestamps: true // timestamps and why not timestamp?? cause there are two things inside createdAt and updatedAt that is why timestamps

});




// model is a method which takes two parameters |
// first which model to make? |
// Second on what basis to make? |
// "User" is the name of the model |
// userSchema is the basis on which this User model will be created
export const User = mongoose.model("User", userSchema);

// whenever this data of User goes into the mongodb to get stored it automatically get converted to users this is mongodb's standardized practice/inner working the model gets converted to lowercase and in plural form