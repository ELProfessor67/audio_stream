import mongoose from "mongoose";
import userSchema from "./user";
import songSchema from './song'

const scheduleSchems = new mongoose.Schema({
    day: {type: String,required: true},
    songs: [{type: mongoose.Schema.Types.ObjectId, ref: songSchema}],
    owner: {type: mongoose.Schema.Types.ObjectId,ref: userSchema},
    status: {type: String,enum: ['pending','processing','complete'],default: 'pending'},
    enabled: {type: Boolean,default: false}
},{timestamps: true});



export default mongoose.model('schedule',scheduleSchems);