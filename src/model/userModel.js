const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
    
    loginId: { type: String, default: "" },
    loginName: { type: String, default: "" },
    loginEmail: { type: String, default: "" },
    loginMobile: { type: String, default: "" },
    loginType: { type: String, default: "" },
	aadhar:{type:Number,min:12},
    lastLogin:{type:String},
	loginPassword: {type: String},
    createdAt: { type: String, default: "" },
    status: { type: Boolean,default:false },
    
},{timestamps:true})





module.exports = mongoose.model("users", userSchema);
