import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.models.js';

export const verifySocketJWT = async(socket, next) => {
    try {
        //get the access token from the socket connection
        const cookies = cookie.parse(socket.handshake.headers.cookie || '');

        const token = cookies?.accessToken;
    
        if(!token) throw new ApiError(401,'Unauthorised request');  
    
        //verify access token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // find user
    
        const user = await User.findById(decodedToken._id).select('-password -refreshToken');
    
        if(!user) throw new ApiError(401,'Invalid access token');

        const deviceId = socket.handshake.auth.deviceId;
    
        socket.user = user;
        socket.deviceId = deviceId;
    
        next();

    } catch (error) {
        next(new Error('Authentication error'));
    }

}