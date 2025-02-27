import { NextResponse } from "next/server"
import jwt from 'jsonwebtoken';
import userModel from "@/models/user";

export const auth = (func) => async (req) => {
    try {
        const token = req.cookies.get('token')?.value;
        const {_id} = await jwt.verify(token,process.env.JWT_SECRET);
        let user = await userModel.findById(_id);
        if (!user){
            throw new Error('user unauthorized');
        }
        // '/playlist',
        const url = req.url;
        
        const djList = ['/playlist','/filter','/temp-playlist','/welcome-tone','/ending-tone','/song','/filter','/dashboard']

        // if(user.isDJ && !user.djPermissions.includes('playlists')){
        //    djList.push('/playlist');
        // }
        let change = true;
        djList.forEach((ele) => {
            if(url.includes(ele)){
                change = false;
            }
        })
        // if(user.isDJ && !url.includes('/playlist')){
        //     user._id = user.djOwner
        // }
        if(user.isDJ && change){
            const copyUser = JSON.parse(JSON.stringify(user));
            user = {...copyUser,originalId: user._id,_id: user.djOwner}
            // user._id = user.djOwner
        }
        req.user = user;
        return func(req);
    } catch (error) {
        return NextResponse.json({success: false,message: error.message},{status: 501})
    }
}