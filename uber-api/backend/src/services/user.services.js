import userModel from "../models/user.model.js";

export const createUser =  async({ firstname, lastname, email, password }) => {
    if(!firstname, !lastname, !email, !password){
        throw new error("all fields are requireed");
    };

    const user = await userModel.create({
        fullname: {
            firstname,
            lastname,
        },
        email,
        password,
    });

    return user;
};