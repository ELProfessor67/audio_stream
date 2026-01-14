import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";
import { generateOTP } from "@/utils/generateOTP";
import { Resend } from "resend";
import sendEmail from "@/utils/sendEmail";
import axios from "axios";
const resend = new Resend('re_6dwherEo_t9t4G217pFAK1hFfJajiWB5i');

export const POST = connectDB(async function (req) {
    try {
        const { email, password } = await req.json();


        if (!email || !password) return NextResponse.json({ success: false, message: 'all fields are requiree' }, { status: 401 });

        const user = await userModel.findOne({ email });

        if (!user) return NextResponse.json({ success: false, message: 'invalid details' }, { status: 401 });

        const isMatch = await user.comparePass(password);

        if (!isMatch) return NextResponse.json({ success: false, message: 'invalid details' }, { status: 401 });

        const OTP = generateOTP();
        user.OTP = OTP;
        user.save();

        //send otp
        // sendEmail(user.email,"Verify OTP",`You OTP is <strong>${OTP}`,`<p>You OTP is <strong>${OTP}</strong></p>`)

        try{
            console.log('Sending email to', user.email);
            const response = await axios.post('https://mailing.hgcradio.com/send-email', {
                email: user.email,
                subject: "Verify OTP",
                message: `Your OTP is> ${OTP}`
              }, {
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              console.log('Success:', response.data);
        }catch(err){
            console.error('Error:', err.response?.data || err.message);
        }

        console.log(OTP)
        const res = NextResponse.json({ success: true, message: 'OTP send to your email', user }, { status: 200 });

        // const token = await user.getJWTToken();
        // res.cookies.set({
        //     name: 'token',
        //     value: token,
        //     httpOnly: true,
        //     expires: new Date(Date.now() + Number(process.env.TOEKN_EXPIRE) * 24 * 60 * 60 * 1000)
        // });

        return res;
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message || 'Internal Seerver Error' }, { status: 501 });
    }
});

export const GET = async function (req) {
    const res = NextResponse.json({ success: true, message: 'logout succussfully' }, { status: 200 });
    res.cookies.set({
        name: 'token',
        value: null,
        httpOnly: true,
        expires: new Date(Date.now())
    });
    return res;
}