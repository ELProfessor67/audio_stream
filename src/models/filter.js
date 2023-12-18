import mongoose from "mongoose";
import userSchema from "./user";

const filterSchems = new mongoose.Schema({
    title: {type: String,required: true,trim: true},
    audio: {type: String,required: true},
    size: {type: Number,required: true},
    type: {type: String,required: true},
    owner: {type: mongoose.Schema.Types.ObjectId,ref: userSchema},
    duration: {type: Number,default: undefined},
    cover: {type: String, default: '/upload/cover/filter.jpeg'}
},{timestamps: true});



export default mongoose.model('filter',filterSchems);