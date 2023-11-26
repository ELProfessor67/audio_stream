import mongoose from "mongoose";
import userSchema from "./user";

const songSchems = new mongoose.Schema({
    title: {type: String,required: true,trim: true},
    description: {type: String,required: true,trim: true},
    artist: {type: String,required: true},
    cover: {type: String,required: true},
    audio: {type: String,required: true},
    size: {type: Number,required: true},
    type: {type: String,required: true},
    owner: {type: mongoose.Schema.Types.ObjectId,ref: userSchema}
},{timestamps: true});



export default mongoose.model('song',songSchems);