import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    name: {type: String,required: true},
    email: {type: String,required: true,unique: true,trim: true},
    password: {type: String,required: true},
    country: {type: String,required: true},
    station_name: {type: String,required: true},
    website_url: {type: String,required: false,default: undefined},
    timezone: {type: String,required: true},
    avatar: {
        public_id: {type: String,default: undefined},
        url: {type: String,default: undefined}
    },
    subscription: {
        subscription_id: {type: String,default: undefined},
        date: {type: Date, default: undefined},
    },
    isSubscriber: {type: Boolean, default: false },
    resetPasswordToken: {type: String,default: undefined},
    resetPasswordExpire: {type: Date,default: undefined},
    isDJ: {type: Boolean,default: false},
    djOwner: {type: mongoose.Schema.Types.ObjectId,ref: 'user',default: undefined},
    djPermissions: [{type: String,enum: ['songs','playlists','schedules','live','dashboard','requests','ads','add_song']}],
    djStartTime: {type: String,default: undefined},
    djEndTime: {type: String,default: undefined},
    djDate: {type: String,default: undefined},
    djTimeInDays: {type: Boolean,default: false},
    djDays: [{type: String}],
    welcomeTone: {type: String,default: undefined},
    endingTone: {type: String,default: undefined},
    rawTime: {type: String,default: ''},
    phone: {type: String,default: undefined},
    OTP: {type: String,default: undefined}
},{timestamps: true});


userSchema.pre('save',async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password,10);
    }
    next();
});

userSchema.methods.getJWTToken = function (){
    return jwt.sign({_id:this._id},process.env.JWT_SECRET,{
        expiresIn: `${process.env.TOEKN_EXPIRE}d`
    })
}

userSchema.methods.comparePass = async function(password){
    return await bcrypt.compare(password,this.password);
}


userSchema.methods.getResetToken = function(){
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken;
}


// userSchema.methods.getUserTimeRange = async function(start,end){
//     const teams = await mongoose.model('user',userSchema).find({isDJ: true,djOwner: this._id});

// }

mongoose.models = {};

export default mongoose.model('user',userSchema);