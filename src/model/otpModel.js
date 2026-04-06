const mongoose = require("../plugins/database/mongooseService").mongoose;
const Schema = mongoose.Schema;

const otpSchema = new Schema({
    loginEmail: { type: String },
	loginMobile:{type: String, default: ""},
	aadhar:{type:Number,min:12},
    status:{type:Boolean},
	otpType:{
		type:String
	},
	loginAs:{type:String,default:""},
	otpFrom:{type:String},
	loginOtp: { type: String,default:"" },
	isSendingCount:{type:Number},
	isValidateCount:{type:Number},
	sTStamp:{type:Date},
	applicationId:{type:String,default:""},
	claimentOtp:{type:Number},
	claimantMobile:{type:Number}

},{timestamps:true});

module.exports = mongoose.model("otp", otpSchema, "otp");
