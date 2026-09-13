import mongoose from "mongoose";
import userSchema from "./user";
import songSchema from './song';

const playlistSchems = new mongoose.Schema({
    title: {type: String,required: true,trim: true},
    description: {type: String,required: true,trim: true},
    owner: {type: mongoose.Schema.Types.ObjectId,ref: userSchema},
    songs: [{type: mongoose.Schema.Types.ObjectId,ref: songSchema}],
    isTemp: {type: Boolean,default: false},
    artist: {type: String,trim: true},
    album: {type: String,trim: true},
    cover: {type: String,default: null},
    // 'hgc' marks a playlist synced in from HGC Radio. Those are shared with the
    // whole station, so visibility no longer depends on which account owns them.
    source: {type: String,default: null,index: true},
},{timestamps: true});



export default mongoose.model('playlist',playlistSchems);