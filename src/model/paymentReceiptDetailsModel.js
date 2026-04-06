const mongoose = require('mongoose');

var paymentReceipt = new mongoose.Schema({
	applicationNumber: {type: String},
    departmentTransID: {type: String},
    cfmsTransID: {type: String},
    transactionStatus: {type: String},
    amount: {type: Number},
    totalAmount: {type: Number},
    paymentMode: {type: String},
    isUtilized: {type: Boolean},
    bankTransID: {type: String},
   bankTimeStamp: {type: Date}
},{timestamps: true});


const PaymentReceiptDetails = mongoose.model('paymentreceipt', paymentReceipt);

module.exports = PaymentReceiptDetails;