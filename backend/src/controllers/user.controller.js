import { User } from "../models/user.models"
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const signUp = asyncHandler((req,res) => {

    const { username, email, password, confirmPassword, publicKey } = req.body();

    // check if all the fields are there
    if([username,email,password,confirmPassword].some((field) => field?.trim() === "")){
        throw new ApiError(400,"All fields are required");
    }

    //check password and confirm password are same
    if(password !== confirmPassword) throw new ApiError(401,"password and confirm password should be same") //////////
    
    //check if the user exist or not
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser) throw new ApiError(402,"User with username and email already exists");


    // if not then create a user and send response removing password and refreshtoken and public key

    const user = await User.create({
        username,
        email,
        password
    });

    const createdUser = await User.findById(user._id).select(
        "password , refreshToken"
    )


    if(!createdUser) throw new ApiError(500,"Something went wrong while registering");

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    );

})