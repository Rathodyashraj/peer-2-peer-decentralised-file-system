import mongoose from 'mongoose';

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
        required: [true, 'Password is requrired'],
        // select: false
    },
    publicKey: {
        type: String,
        unique: true,
        required: true
    }   
},{timestamps: true})

export const User = mongoose.model('User',userSchema);