const mongoose = require('mongoose');
var slotBopkingHistory = new mongoose.Schema({

	sroOfcNum:{
		type:Number,
	},
	dateForSlot:{
		type:Date,
	},
	applicationId:{type:String},
	slotTime:{type:String},
	status:{type:String},
    amount:{type:Number},
	// slots:[
	// 	{
	// 		applicationId:{type:String},
	// 		slotTime:{type:String},
	// 		isAuthenticateThroughQr:{type:Boolean}
	// 	}
	// ]

},{timestamps:true},);


const SlotsHistory = mongoose.model('slot_booking_history', slotBopkingHistory,'slot_booking_history');

module.exports = SlotsHistory;