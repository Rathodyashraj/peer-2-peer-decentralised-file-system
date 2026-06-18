import mongoose from "mongoose";

export const deviceSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        // required: true
    },
    publicKey: {
        type: String,
        // required: true
    }
},{_id: false})

