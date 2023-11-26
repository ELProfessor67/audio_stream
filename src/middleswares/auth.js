import { NextResponse } from "next/server"
import jwt from 'jsonwebtoken';
import userModel from "@/models/user";

export const auth = (func) => async (req) => {
    try {
        const token = req.cookies.get('token')?.value;
        const {_id} = await jwt.verify(token,process.env.JWT_SECRET);
        const user = await userModel.findById(_id);
        if (!user){
            throw new Error('user unauthorized');
        }

        req.user = user;
        return func(req);
    } catch (error) {
        return NextResponse.json({success: false,message: error.message},{status: 501})
    }
}