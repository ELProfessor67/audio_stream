
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";
import { auth } from "@/middleswares/auth";


export const GET = connectDB(auth(async function (req){
    return NextResponse.json({success: true,user: req.user},{status: 200});
}));