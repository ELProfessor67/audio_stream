import mongoose from "mongoose";
import userSchema from "./user";
import songSchema from './song';

// A folder groups a subset of the playlist's tracks for browsing. It is only a
// view over `playlist.songs`, which stays the complete flat list every consumer
// (Go Live queue, Auto DJ, schedules, HGC sync) already reads.
const folderSchema = new mongoose.Schema({
    name: {type: String,required: true,trim: true},
    cover: {type: String,default: null},
    songs: [{type: mongoose.Schema.Types.ObjectId,ref: songSchema}],
},{timestamps: true});

const playlistSchems = new mongoose.Schema({
    title: {type: String,required: true,trim: true},
    description: {type: String,required: true,trim: true},
    owner: {type: mongoose.Schema.Types.ObjectId,ref: userSchema},
    songs: [{type: mongoose.Schema.Types.ObjectId,ref: songSchema}],
    folders: [folderSchema],
    isTemp: {type: Boolean,default: false},
    artist: {type: String,trim: true},
    album: {type: String,trim: true},
    cover: {type: String,default: null},
    // 'hgc' marks a playlist synced in from HGC Radio. Those are shared with the
    // whole station, so visibility no longer depends on which account owns them.
    source: {type: String,default: null,index: true},
},{timestamps: true});



export default mongoose.model('playlist',playlistSchems);