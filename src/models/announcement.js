import mongoose from "mongoose";

const announcementSchems = new mongoose.Schema({
    message: {type: String,required: true},
    owner: {type: mongoose.Schema.Types.ObjectId,ref: 'users'}
},{timestamps: true});



export default mongoose.model('announcementSchems',announcementSchems);