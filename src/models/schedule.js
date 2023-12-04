import mongoose from "mongoose";
import userSchema from "./user";
import songSchema from './song'

const scheduleSchems = new mongoose.Schema({
    date: {type: String,required: true},
    time: {type: String, required: true},
    songs: [{type: mongoose.Schema.Types.ObjectId, ref: songSchema}],
    owner: {type: mongoose.Schema.Types.ObjectId,ref: userSchema},
    songsPerAds: {type: Number,required: true},
    status: {type: String,enum: ['pending','processing','complete'],default: 'pending'}
},{timestamps: true});



export default mongoose.model('schedule',scheduleSchems);