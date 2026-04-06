const PDEError = require("../errors/customErrorClass");
const PaymentReciptModel = require('../model/paymentReceiptDetailsModel')
class PaymentsReceiptDao { 
	
	getByFindOne = async (filters) =>{
		try{
			const paymentData = await PaymentReciptModel.findOne(filters);
			return paymentData;
		}catch(ex){
			console.log("PaymentsDao - getByFindOne || Error : ", ex.message);
            throw new PDEError({err: "Internal Server Problem"});
		}
		
	}
	
}

module.exports = PaymentsReceiptDao;