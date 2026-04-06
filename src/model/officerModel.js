const mongoose = require("../plugins/database/mongooseService").mongoose;
const Schema = mongoose.Schema;

const officerSchema = new Schema({
    // appNo: { type: String , default: Date.now(), unique : true},
    loginType:{type:String, default:""},
    loginName: { type: String },
    loginEmail: { type: String },
    loginMobile: { type: String },
    loginPassword: { type: String },
	sroDistrict:{type:String},
	sroMandal:{type:String},
	sroOffice:{type:String},
	sroNumber:{type:Number},
	sroName:{type:String},
    status:{ type: String ,default: "" }
},{timestamps:true});

module.exports = mongoose.model("officer", officerSchema, "officer");
