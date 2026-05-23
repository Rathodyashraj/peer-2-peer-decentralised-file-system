import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const signUp = asyncHandler(async (req,res) => {

    const { username, email, password, confirmPassword, publicKey } = req.body;

    // check if all the fields are there
    if([username,email,password,confirmPassword].some((field) => !field || field.trim() === "")){
        throw new ApiError(400,"All fields are required");
    }

    //check password and confirm password are same
    if(password !== confirmPassword) throw new ApiError(400,"password and confirm password should be same") //////////
    
    //check if the user exist or not
    const existingUsername = await User.findOne({ username });

    if (existingUsername) {
        throw new ApiError(409, "Username already exists");
    }

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
        throw new ApiError(409, "Email already exists");
    }


    // if not then create a user and send response removing password and refreshtoken and public key

    const user = await User.create({
        username,
        email,
        password
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )


    if(!createdUser) throw new ApiError(500,"Something went wrong while registering");

    return res.status(201).json(
        new ApiResponse(201,createdUser,"User registered successfully")
    );

})



export {signUp};