const mongoose = require('mongoose');

var paymentSchema = new mongoose.Schema({
	bankName:{type:String},
	branchName:{type:String},
	checkNo:{type:String},
	dateOfPayment:{type:Date},
	documentId:{type:String},
	donarName:{type:String},
	doneeName:{type:String},
	natureOfDocument:{type:String},
	paymentId:{type:String,required:true,unique: true},
	paymentMode:{
		type:String
	},
	payAmount:{
		type:Number,require:true
	},
	rateOfInterest:{type:Number},
	relationType:{type:String},
	duration:{type:Number},
	interestOfPenalty:{type:Number},
	transactionNo:{type:String},
	utrNumber:{
		type:Number
	},
},{timestamps:{type:Date,default:new Date().toISOString()}});


const PaymentDetails = mongoose.model('payment_details', paymentSchema);

module.exports = PaymentDetails;