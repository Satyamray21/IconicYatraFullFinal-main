// utils/findHotel.js
import Hotel from "../models/hotel.model.js";
import mongoose from "mongoose";

export const findHotelByIdOrHotelId = async (id) => {
    if (mongoose.Types.ObjectId.isValid(id)) {
        // Agar valid ObjectId hai → Mongo _id se search
        return await Hotel.findById(id);
    } else {
        // Warna custom hotelId se search
        return await Hotel.findOne({ hotelId: id });
    }
};
