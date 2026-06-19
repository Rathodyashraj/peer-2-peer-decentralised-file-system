import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';


const generateAccessandRefreshToken = async (userid) => {
    try {

        const user = await User.findById(userid);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        
        return {accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access token and refresh token");
    }


}


const signUp = asyncHandler(async (req,res) => {

    const { username, email, password, confirmPassword, publicKey, deviceId} = req.body;

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
        password,
        devices: [
            {
                deviceId,
                publicKey
            }
        ]
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

const loginUser = asyncHandler(async (req,res) => {
    

    // verify token first using auth middleware

    // when user comes then its token should be verifed and if veriied then direct login

    // if login with username and pass then-->

    const { login, password } = req.body;

    // check fields empty or not
    if((!login?.trim())) throw new ApiError(400,'Username or email is required');
    if(!password?.trim()) throw new ApiError(400,'Password is required');

    
    // if not empty then search for the user in db based on username or email
    const user = await User.findOne({
        $or: [{username: login},{email: login}]
    });
    

    // if user not exist then send res
    if(!user) throw new ApiError(404,'User not Registered');
    
    // if exist then verify pass and gnerate new accesand refresh token and send res
    const isPasswordValid = await user.isPasswordCorrect(password);

    
    if(!isPasswordValid) throw new ApiError(401,"Invalid User credentials");
    
    //now generate accesstoken and refreshtoken

    const {accessToken,refreshToken} = await generateAccessandRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        " -password -refreshToken"
    )
    
    const options = {
        httpOnly: true,
        secure: false
    }


    return res
    .status(201)
    .cookie('accessToken',accessToken,options)
    .cookie('refreshToken',refreshToken,options)
    .json(
        new ApiResponse(201,{
            user: loggedInUser,accessToken,refreshToken
        },"User logged in successfully")
    );
})


// auth check controller for validating access token
const authCheck = asyncHandler(async (req,res) => {

    const accessToken = req.cookies?.accessToken;

    if(!accessToken) {
        throw new ApiError(401,"Unauthorised request") // handle from fronend and check if refreshtoken is there then send request to refresh access token endpoint and if not then redirect to login page
    }

    const decodedaccessToken = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedaccessToken._id).select(
        "-password -refreshToken"
    )

    if(!user) { 
        throw new ApiError(401,"Access token Invalid"); // handle from fronend and check if refreshtoken is there then send request to refresh access token endpoint and if not then redirect to login page
    }

    return res.status(200).json( new ApiResponse(200,user,"logged in successfully using accesstoken"))


})

const refreshAccessToken = asyncHandler(async (req,res) => {

    const incomingRefreshToken = req.cookies?.refreshToken;

    if(!incomingRefreshToken) throw new ApiError(401,'Unauthorised request'); // user should be redirected to login page based on this error

    const decodedRefreshToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

    const user  = await User.findById(decodedRefreshToken._id);
    
    if(!user) {
        throw new ApiError(401,'Invalid Refresh Token')// throw error refreshtoken invalid or expired so based on this redirect to login page
    }

    if(incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401,'Invalid Refresh Token')// throw error refreshtoken invalid or expired so based on this redirect to login page
    }

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id);

    const options = {
        httpOnly: true,
        secure: false
    };

    return res
    .status(200)
    .cookie('accessToken',accessToken,options)
    .cookie('refreshToken',refreshToken,options)
    .json( new ApiResponse(
        200,
        {user,accessToken: accessToken, refreshToken: refreshToken},
        "Access token renewed successfully using refresh token"
    ))

})

// logout controller
const logoutUser = asyncHandler(async (req,res) => {
    
    await User.findByIdAndUpdate(
        req.user_id,
        {
            $set : {
                refreshToken: null
            }
        }
    )

    const options = {
        httpOnly: true,
        secure: false
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User logged out successfully")
    )
})

// for storing public key and deviceId
const registerDevice = asyncHandler(async (req,res) => {
    const { deviceId, publicKey } = req.body;

    if(!deviceId || !publicKey) throw new ApiError(400,"deviceID and public key are missing ");


    const user = await User.findById(req.user._id).select("-password -refreshToken");

    const existingDevice = user.devices.find(device => device.deviceId === deviceId);

    if(!existingDevice){
        user.devices.push({
            deviceId,
            publicKey
        })
    }

    await user.save({validateBeforeSave: false});
    

    return res
    .status(200)
    .json(new ApiResponse(200,"Device Registered successfully"));


})

export {signUp,loginUser,authCheck,refreshAccessToken,logoutUser,registerDevice};








    // if user has accesstoken no matter it has refresh token or not then the session should remain active that is user should be able to login without username/pass
    // if user has refreshtoken and if accesstoken is expired then user shouldnt be asked for username/pass get direct login and renew accestoken
    // this should be done by refreshaccessToken controller
    // if user has refresh token expired then he should be asked to login again using username and pass and generate new accesstokena and referesh token
    // based on verificatio send response