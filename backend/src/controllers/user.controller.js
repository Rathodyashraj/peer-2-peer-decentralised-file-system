import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessandRefreshToken = async (userid) => {
    try {

        const user = await User.findById(userid);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        console.log("token generated",accessToken);
        console.log(`refresh token generated`,refreshToken);
        
        return {accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access token and refresh token");
    }


}


const signUp = asyncHandler(async (req,res) => {

    const { username, email, password, confirmPassword, publicKey } = req.body;

    // check if all the fields are there
    if([username,email,password,confirmPassword].some((field) => !field?.trim())){
        throw new ApiError(400,"All fields are required");
    }

    //check password and confirm password are same
    if(password !== confirmPassword) throw new ApiError(400,"password and confirm password should be same")
    
    //check if the user exist or not

    const existingUser = await User.findOne(
        { 
            $or: [{ username }, { email }] 
        }
    );

    if(existingUser){

        if(existingUser.username === username && existingUser.email === email){
            throw new ApiError(409,"User already exists");
        }

        if(existingUser.username === username){
            throw new ApiError(409,"Username already exists",[{ field: "username" }]);
        }

        if(existingUser.email === email){
            throw new ApiError(409,"Email already exists",[{ field: "email" }]);
        }

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

    const {accessToken,refreshToken} = await generateAccessandRefreshToken(user._id); // generating accesstoken and refresh token

    const options = {
        httpOnly: true,
        secure: false // change to true during production
      }

    return res
    .status(201)
    .cookie('accessToken',accessToken,options)
    .cookie('refreshToken',refreshToken,options)
    .json(
        new ApiResponse(201,createdUser,"User registered successfully")
    );

})



export {signUp};