import mongoose from "mongoose";
import userSchema from "./user";

const songSchems = new mongoose.Schema({
    title: {type: String,required: true,trim: true},
    description: {type: String,required: false,trim: true,default: 'description'},
    artist: {type: String,required: true,default: "Unkown"},
    cover: {type: String,required: true},
    audio: {type: String,required: true},
    size: {type: Number,required: true},
    type: {type: String,required: true},
    owner: {type: mongoose.Schema.Types.ObjectId,ref: userSchema},
    isAds: {type: Boolean,default: false},
    duration: {type: Number,default: undefined},
    album: {type: String,default: undefined,default: "Unkown"}
},{timestamps: true});



export default mongoose.model('song',songSchems);