const PDEError = require("../errors/customErrorClass");
const PaymentModel = require('../model/paymentDetailsModel')
class PaymentsDao { 
	create = async (paymentData)=>{

        if(!paymentData){
            console.error("PaymentsDao - create || Payment Deatils can't be empty")
            throw new Error("EMPTY Payment Deatils");
        }

        const payment = new PaymentModel({
            ...paymentData
        });
        try {
            const paymentDb = await payment.save();
            return paymentDb;
        } catch (error) {
            console.error("PaymentsDao - create ||  Error : ", error.message);
            throw new PDEError({err: "Internal Server Problem"});
        }

    }

	getByFilters = async (filters) =>{
		try{
			const paymentData = await PaymentModel.find(filters);
			return paymentData;
		}catch(ex){
			console.log("PaymentsDao - getByFilters || Error : ", ex.message);
            throw new PDEError({err: "Internal Server Problem"});
		}
		
	}
	getByFindOne = async (filters) =>{
		try{
			const paymentData = await PaymentModel.findOne(filters);
			return paymentData;
		}catch(ex){
			console.log("PaymentsDao - getByFindOne || Error : ", ex.message);
            throw new PDEError({err: "Internal Server Problem"});
		}
		
	}
	getFindandUpdate = async (filters,update)=>{
		try{
			const paymentData = await PaymentModel.findOneAndUpdate(filters,update);
			return paymentData;
		}catch(ex){
			console.log("PaymentsDao - getFindandUpdate || Error : ", ex.message);
            throw new PDEError({err: "Internal Server Problem"});
		}
	};
	delete =  async (filters)=>{
		try{
			const paymentData = await PaymentModel.findOneAndDelete(filters);
			return paymentData;
		}catch(ex){
			console.log("PaymentsDao - delete || Error : ", ex.message);
            throw new PDEError({err: "Internal Server Problem"});
		}
	};
}

module.exports = PaymentsDao;