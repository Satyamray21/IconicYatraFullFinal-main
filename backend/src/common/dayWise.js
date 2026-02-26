import mongoose from "mongoose";
export const itinerarySchema = new mongoose.Schema({
    dayTitle: {
        type: String,
        required: true
    },
    dayNote: {
        type: String
    },
    aboutCity: {
        type: String
    },
    image: {
        type: String // store image URL or path
    }
}, { _id: false });