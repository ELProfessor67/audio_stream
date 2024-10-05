import mongoose from "mongoose";
import { NextResponse } from "next/server";

const connectDB = (func) => async (req) => {
    try {
        const {connection} = await mongoose.connect(process.env.DB_URL);
        console.log(`database connected : ${connection.host}`);
    } catch (error) {
        console.log('database connection failed: ',error.message);
    }

    return Promise.resolve(func(req)).catch(function (err) {
        return NextResponse.json({success: false,message: err.message},{status: 501});
    })
}


export default connectDB;