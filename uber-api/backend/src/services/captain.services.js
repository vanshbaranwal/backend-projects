import captainModal from "../models/captain.model.js";


export const createCaptain = async({firstname, lastname, email, password, color, plate, vehicleType, capacity}) => {
    if(!firstname || !lastname || !email || !password || !color || !plate || !vehicleType || !capacity){
        return res.status(400).json({
            message: "all the fields are required",
        });
    };

    const captain = captainModal.create({
        fullname: {
            firstname,
            lastname,
        },
        email,
        password,
        vehicles: {
            color,
            plate,
            vehicleType,
            capacity,
        }
    });

    return captain;

};