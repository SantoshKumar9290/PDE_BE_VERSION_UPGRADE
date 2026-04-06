const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const PDEError = require("../errors/customErrorClass");
const PaymentService = require("../services/paymentService");
const { constructPDEError } = require("./errorHandler");
const {paymentValidations} =  require('../utils/validations');
const sysConstanst = require("../utils/sysConstanst");
const paymentmodel = require('../model/paymentDetailsModel');
const PaymentDao = require("../dao/PaymentsDao");
const {encryptData} = require("../utils");

class PaymentHandler{
	constructor(){
        this.paymentService = new PaymentService();
		this.paymentDao = new PaymentDao();
    };
	createPayment = async (req,res)=>{
		const reqBody = req.body;
		const reqParams = req.params;
		let validation = await paymentValidations(reqBody,sysConstanst.REQ_METHOD_CREATE);
		if(validation && validation.status == false){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
			{
				status: false,
				message: validation.err
			})
		};
		if((reqParams.type == "SALE" && reqBody.paymentMode == 'CASH' && (reqBody.paymentMode == null || reqBody.payAmount == null || reqBody.dateOfPayment == null || reqBody.transactionNo || reqBody.bankName || reqBody.branchName || reqBody.checkNo|| reqBody.utrNumber))){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
            {
                status: false,
                message: NAMES.VALIDATION_ERROR
            });
		}else if( reqParams.type == "SALE" && reqBody.paymentMode == 'UPI'   && (reqBody.paymentMode == null || reqBody.payAmount == null || reqBody.dateOfPayment == null || reqBody.transactionNo == null )){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
			{
				status: false,
				message: NAMES.VALIDATION_ERROR
			});
		}else if(reqParams.type == "SALE" && reqBody.paymentMode == 'CHEQUE' && (reqBody.paymentMode == null || reqBody.payAmount == null || reqBody.dateOfPayment == null || reqBody.bankName == null || reqBody.branchName == null || reqBody.checkNo == null )){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
			{
				status: false,
				message: NAMES.VALIDATION_ERROR
			});
		}else if(reqParams.type == "SALE" && reqBody.paymentMode == 'NEFT/RTGS' && (reqBody.payAmount == null || reqBody.utrNumber == null || reqBody.bankName == null )){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
			{
				status: false,
				message: NAMES.VALIDATION_ERROR
			});
		}else if(reqParams.type == "MORTAGAGE" && (reqBody.payAmount == null || reqBody.rateOfInterest == null || reqBody.duration == null ||reqBody.interestOfPenalty  == null)){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
			{
				status: false,
				message: NAMES.VALIDATION_ERROR
			});
		}else if(reqParams.type == "GIFT" && (reqBody.donarName == null || reqBody.relationType == null || reqBody.doneeName == null )){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
			{
				status: false,
				message: NAMES.VALIDATION_ERROR
			});
		}
		try{
			reqBody.natureOfDocument = reqParams.type;
			let response = await this.paymentService.createPayment(reqBody);
			if(response){
				return res.status(200).send(
					{
						status:true, 
						message: "Data Saved Successfully",
						code: "200",
						data: response
					}
				);
			}
		}catch(ex){
			console.error("PaymentHandler - createPayment || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
	editPayment = async (req,res)=>{
		const reqParams = req.params;
		const reqBody = req.body;
		if(reqParams?.id == null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
			{
				status: false,
				message: "Bad Request"
			})
		}
		reqBody["id"]=reqParams.id;
		let validation = await paymentValidations(reqBody,sysConstanst.REQ_METHOD_EDIT);
		if(validation && validation.status == false){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
			{
				status: false,
				message: validation.err
			})
		};
		try{
			let response = await this.paymentService.updatePaymentService(reqParams,reqBody);
			if(response){
				return res.status(200).send(
					{
						status:true, 
						message: "Updated Successfully",
						code: "200",
					}
				);
			}
		}catch(ex){
			console.error("PaymentHandler - createPayment || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	};

	updatePaymentDetails = async (req,res)=>{
		const reqParams = req.params;
		if(reqParams?.id == null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
			{
				status: false,
				message: "Bad Request"
			})
		}
	
		try{

			let response = await this.paymentService.updatePaymentDetailsService(reqParams?.id);
			if(response){
				return res.status(200).send(
					{
						status:true, 
						message: "Updated Successfully",
						code: "200",
					}
				);
			}
		}catch(ex){
			console.error("PaymentHandler - createPayment || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	};

	deletePayment = async (req,res)=>{
		const reqParams = req.params;
		if(reqParams?.id == null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
			{
				status: false,
				message: "Bad Request"
			})
		}
		let checkValidate = await this.paymentDao.getByFilters({_id:reqParams.id,documentId:reqParams.documentId});
		if(checkValidate && checkValidate.length === 0){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: "MissMatch.."
				})
		}
		try{
			let response = await this.paymentService.deletePaymentService(reqParams);
			if(response){
				return res.status(200).send(
					{
						status:true, 
						message: "Deleted Successfully",
						code: "200",
					}
				);
			}
		}catch(ex){
			console.error("PaymentHandler - createPayment || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: ex.message
                }
            );
		}
	};
	getPaymentStatus = async (req, res) => {
		const id = req.params.id;
		if(!id){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: "Bad Request"
				})
		}
		try{
			let response = await this.paymentService.getPaymentStatus(id);
			if(response && response.length){
				return response[0].transactionStatus === "Success" ? res.status(200).send(
					{
						status:true, 
						message: "Data fetched Successfully",
						data: response[0]
					}
				) : res.status(400).send({
					status: false,
					message: `Rs ${response[0].amount}/- Payment Failed.`
				});
			} else {
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
					{
						status: false,
						message: "Payment Record not found"
					})
			}
		} catch(ex) {
			var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
	getCCPaymentStatus = async (req, res) => {
		const id = req.params.id;
		const srcode = req.params.srcode;
		if(!id){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: "Bad Request"
				})
		}
		try{
			let response = await this.paymentService.getCCPaymentStatus(id,srcode);			
			if(response && response.length){
				return response[0].transactionStatus === "Success" ? res.status(200).send(
					{
						status:true, 
						message: "Data fetched Successfully",
						data: response[0]
					}
				) : res.status(400).send({
					status: false,
					message: `Rs ${response[0].amount}/- Payment Failed.`
				});
			} else {
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
					{
						status: false,
						message: "Payment Record not found"
					})
			}
		} catch(ex) {
			var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}

	getCSCPaymentStatus = async (req, res) => {
		const reqBody = req.body;
		if(reqBody==undefined || reqBody==null || reqBody.requestNum==undefined || reqBody.requestNum==null
			|| reqBody.requestNum.trim().length==0 || reqBody.cscId==undefined || reqBody.cscId==null || 
			reqBody.cscId.trim().length==0 || reqBody.service==undefined || reqBody.service==null || 
			reqBody.service.trim().length==0 ){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.BAD_REQUEST]).send(
				{
					status: false,
					message: "Bad Request"
				})
		}
		try{
			let response = await this.paymentService.getCSCPaymentStatus(reqBody);
			if(response && response.length > 0 && response!='Bad Request'){
				return response[0].transactionStatus === "Success" ? res.status(200).send(
					{
						status:true, 
						message: "Payment completed successfully",
						data: response[0]
					}
				) : (response[0].transactionStatus === "Failure" ? res.status(400).send(
					{
					status: false,
					message: `Payment got failed for request number ${reqBody.requestNum}.`
					}
				) : res.status(400).send(
					{
					status: false,
					message: `Payment is pending for request number ${reqBody.requestNum}.`
					}
				));
			}else if(response && response=='Bad Request'){
				return res.status(NAMES_STATUS_MAPPINGS[NAMES.BAD_REQUEST]).send(
				{
					status: false,
					message: "Bad Request"
				});
			} else {
				return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: "Payment Record not found"
				});
			}
		} catch(ex) {
			var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}

	cscPaymentCheck = async (req, res) => {
		let reqBody = req.body;
		if(reqBody.cscId==undefined || reqBody.cscId==null || reqBody.cscId.trim().length==0){
			const loginUser = req.user;
			reqBody['cscId'] = loginUser.loginId;
		}
		if(reqBody==undefined || reqBody==null || reqBody.requestNo==undefined || reqBody.requestNo==null
			|| reqBody.requestNo.trim().length==0 || reqBody.cscId==undefined || reqBody.cscId==null || 
			reqBody.cscId.trim().length==0 || reqBody.service==undefined || reqBody.service==null || 
			reqBody.service.trim().length==0 ){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.BAD_REQUEST]).send(
				{
					status: false,
					message: "Bad Request"
				})
		}
		try{
			let response = await this.paymentService.cscPaymentCheck(reqBody);
			if(response && response.status){
				return res.status(200).send(
				{
					status:true, 
					message: "success",
					data: response
				});
			} else {
				return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: "CSC payment service issue. Please try after sometime"
				});
			}
		} catch(ex) {
			var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}

	getPaymentCheck = async (req, res) => {
		const id = req.params.id;
		if(!id){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: "CFMS/Challan id is required"
				})
		}
		try{
			let response = await this.paymentService.getPaymentCheckSrvc(id);
			if(response && typeof response === 'object'){
				return res.status(200).send(
					{
						status:true, 
						message: "Data fetched Successfully",
						data: encryptData(JSON.stringify(response))
					}
				)
			} else {
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
					{
						status: false,
						message: response || "Payment Record not found"
					})
			}
		} catch(ex) {
			var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
	
}
module.exports= PaymentHandler;