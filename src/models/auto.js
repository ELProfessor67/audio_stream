import mongoose from "mongoose";
import userSchema from "./user";
import songSchema from './song';
import playlistModel from './playlist';

const autoSchems = new mongoose.Schema({
    owner: {type: mongoose.Schema.Types.ObjectId,ref: userSchema},
    playlist: [{type: mongoose.Schema.Types.ObjectId,ref: playlistModel}],
    songs: [{type: mongoose.Schema.Types.ObjectId,ref: songSchema}]
},{timestamps: true});



export default mongoose.model('auto',autoSchems);