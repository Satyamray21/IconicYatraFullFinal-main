import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstances = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`DB IS CONNECTED ${connectionInstances.connection.host}`);
    }
    catch (err) {
        console.log('DB connection failed ', err.message);
        process.exit(1);
    }
}
export default connectDB;