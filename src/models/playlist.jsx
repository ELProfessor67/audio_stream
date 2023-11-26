import mongoose from "mongoose";
import userSchema from "./user";
import songSchema from './song';

const playlistSchems = new mongoose.Schema({
    title: {type: String,required: true,trim: true},
    description: {type: String,required: true,trim: true},
    owner: {type: mongoose.Schema.Types.ObjectId,ref: userSchema},
    songs: [{type: mongoose.Schema.Types.ObjectId,ref: songSchema}]
},{timestamps: true});



export default mongoose.model('playlist',playlistSchems);