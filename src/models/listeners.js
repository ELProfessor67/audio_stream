import mongoose from "mongoose";

const listnerSchems = new mongoose.Schema({
    count: {type: Number,required: true},
    date: {type: Date,default: Date.now},
    owner: {type: mongoose.Schema.Types.ObjectId,ref: 'users'}
},{timestamps: true});



export default mongoose.model('listener',listnerSchems);