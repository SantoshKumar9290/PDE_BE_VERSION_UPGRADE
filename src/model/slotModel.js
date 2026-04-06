const mongoose = require('mongoose');
var slotBookingModel = new mongoose.Schema({
	sroDistrict:{
		type:String,
		required:true
	},
	sroOffice:{
		type:String,
		required:true
	},
	sroOfcNum:{
		type:Number,
		required:true
	},
	dateForSlot:{
		type:Date,
		required:true
	},
	applicationId:{type:String},
	slotTime:{type:String},
	isAuthenticateThroughQr:{type:Boolean},
	AuthenticationDate:{type:Date},
	sroSequence:{type:Number},
	status:{type:String}
	// slots:[
	// 	{
	// 		applicationId:{type:String},
	// 		slotTime:{type:String},
	// 		isAuthenticateThroughQr:{type:Boolean}
	// 	}
	// ]

},{timestamps:true},);


const SlotsDb = mongoose.model('slot_details2', slotBookingModel);

module.exports = SlotsDb;