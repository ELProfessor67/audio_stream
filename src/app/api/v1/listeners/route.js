
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import listenersModel from "@/models/listeners";
import { auth } from "@/middleswares/auth";


export const POST = connectDB(auth(async function (req){
    const {listeners} = await req.json();
    await listenersModel.create({count:listeners,owner:req.user._id});
    return NextResponse.json({success: true},{status: 200});
}));



export const GET = connectDB(auth(async function(req,res){
    const params = new URLSearchParams(req.url.split('?')[1]);
    const time = params.get('time');
    let data = {
        labels: ['Sunday','Monday','Tuesday','Wednesday','Thusday','Friday','Saturday'],
        datasets: [{
          label: 'Listeners',
          data: [0,0,0,0,0,0],
          borderColor: 'rgb(79 70 229)'
        }]
    }
    if(time === 'today'){
        const date = new Date()
        date.setHours(0,0,0,0);

        const listeners = await listenersModel.find({owner:req.user._id,date:{$gte: date}});
        const label = []
        const tdata = []
        listeners.forEach(ele => {
            const hour = new Date(ele.date).getHours();
            const min = new Date(ele.date).getMinutes();

            label.push(`${hour};${min}`);
            tdata.push(ele.count);
        });

        data['labels'] = label;
        data['datasets']['data'] = tdata
    }else if(time === 'last-week'){
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate()-7);
    }
    
    console.log(data)
     return NextResponse.json({success: true},{status: 200});
}))