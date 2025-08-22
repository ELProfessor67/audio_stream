import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";
import { auth } from "@/middleswares/auth";


export const POST = connectDB(auth(async function (req){
        const {name,email,password,permissions,starttime,endtime,djDate,djTimeInDays,djDays,rawTime,timezone,phone} = await req.json();

        // console.log(name,email,password,permissions)
        if (!name || !email || !password || !permissions || permissions?.length == 0) return NextResponse.json({success: false,message: 'all fields are requiree'},{status: 401})

        const emailExist = await userModel.findOne({email});

        if(emailExist){
            return NextResponse.json({success: false,message: 'email is alread exist'},{status: 409})
        }

        const owner = req.user;

        const userData = {
            name,email,password,
            country: owner.country,
            station_name: owner.station_name,
            website_url: owner.website_url,
            timezone: timezone || owner.timezone,
            isDJ: true,
            djOwner: owner._id,
            djPermissions: permissions,
            isSubscriber: owner.isSubscriber,
            djStartTime: starttime,
            djEndTime: endtime,
            djDate,djTimeInDays,djDays,rawTime,
            phone
        }
        const user = await userModel.create(userData);


        return NextResponse.json({success: true,message: 'dj add successfully',dj: user})

    try{
        
    }catch(err){
        return NextResponse.json({success: false,message: 'Internal Seerver Error'},{status: 501});
    }
}));

// export const GET = connectDB(auth(async function (req){
//     try{
//         const teams = await userModel.find({djOwner: req.user._id});
//         return NextResponse.json({success: true,teams})
//     }catch(err){
//         return NextResponse.json({success: false,message: 'Internal Seerver Error'},{status: 501});
//     }
// }))
export const GET = connectDB(async function (req){
    try{
        const teams = await userModel.find({djOwner: "655347b59c00a7409d9181c3"});
        return NextResponse.json({success: true,teams})
    }catch(err){
        return NextResponse.json({success: false,message: 'Internal Seerver Error'},{status: 501});
    }
})


export const DELETE = connectDB(auth(async function (req){
    try{
        const params = new URLSearchParams(req.url.split('?')[1]);
        const id = params.get('id');
        if(!id) return NextResponse.json({success: false,message: 'please id is required'},{status: 401});
        const teams = await userModel.findByIdAndDelete(id);
        return NextResponse.json({success: true})
    }catch(err){
        return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}))