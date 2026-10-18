import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { deviceSchema } from './device.models.js';

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim:true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        // Google-only accounts have no password
        required: [function () { return !this.googleId; }, 'Password is requrired'],
        // select: false
    },
    // Google account subject id; no default, a null default would break the sparse unique index
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    devices: [deviceSchema],
    refreshToken: {
        type: String,
    },
    hashOtp:{
        type: String,
        default: null
    },
    otpExpiresAt: {
        type: Date,
        default: null
    }
},{timestamps: true})


// make this function call before save event occurs 
userSchema.pre('save', async function(){
    if(!this.isModified("password") || !this.password) return;
    this.password = await bcrypt.hash(this.password,10);
})


userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password,this.password);
}


userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRATION
        }
    )
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRATION
        }
    )
}


export const User = mongoose.model('User',userSchema);