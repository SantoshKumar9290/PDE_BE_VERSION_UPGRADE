const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("./errorHandler");
const EcCcService = require('../services/ecCcServices');
const {generateDoubleHashValue} = require('../utils/validations')

class EcCcHandler {
	constructor(){
		this.EcCcService = new EcCcService();
	}


	createCCRequest = async (req,res)=>{
		const reqBody = req.body;
		try{
            let response = await this.EcCcService.getDataSrvc(reqBody); 
			 let isValidReq = false; 
			 if(response != null && response != undefined && typeof response == 'object'){
				isValidReq = true; 
			 }
			 if(!isValidReq){
				throw new Error('Request creation failed due to data not found');
			 }
			await this.EcCcService.createCCRequest(reqBody);
            let responseData = {
				status: true, 
				message: "Success",
				code: "200"
			};
			res.status(200).send({...responseData});
		}catch(ex){
			console.error("ecCcHandler - createCCRequest || Error :", ex);
            let PDEError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
                {
                    code: 404,
                    status: false,
                    message: ex.message ? ex.message : "Request creation failed due to data not found",
                }
            );
		}
	}

    getAllECRequestsByUserId = async (req,res)=>{
		const loginUser = req.user;
		try{
			let responseData = await this.EcCcService.getAllECRequestsByUserId(loginUser);
			res.status(200).send(responseData);
		}catch(ex){
			console.error("ecCcHandler - createECRequest || Error :", ex);
            let PDEError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
                {
                    status: false,
                    message: PDEError.message
                }
            );
		}
	}

	paystatus = async (req,res)=>{
		const reqData = req.body;
		try{
			let responseData = await this.EcCcService.paystatus(reqData);
			res.status(200).send(responseData);
		}catch(ex){
			console.error("ecCcHandler - paystatus || Error :", ex);
            let PDEError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
                {
                    status: false,
                    message: PDEError.message
                }
            );
		}
	}

	updateECRequestsPaymentData = async (req,res)=>{
		const reqData = req.body;
		try{
			let responseData = await this.EcCcService.updateECRequestsPaymentData(reqData);
			res.status(200).send(responseData);
		}catch(ex){
			console.error("ecCcHandler - updateECRequestsPaymentData || Error :", ex);
            let PDEError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
                {
                    status: false,
                    message: PDEError.message
                }
            );
		}
	}

    checkDailyRequestLimit = async (req, res) =>{
        const loginUser = req.user;
        try {
            let response = await this.EcCcService.checkDailyRequestLimit(loginUser.userId);
            return res.status(200).send({
                status: true,
                message: "User is eligible to make request",
                code: "200",
                data: response
            });

        } catch (ex) {
            console.error("ecCcHandler - checkDailyRequestLimit || Error :", ex);
            let PDEError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send({
                status: false,
                message: PDEError.message
            });
        }
    }

	updtCCpaymentdetails = async (req, res) => {
        const reqBody = req.body;
        try {
            if( reqBody.SR_CODE==undefined || reqBody.SR_CODE==null || reqBody.SR_CODE==""|| 
            ( reqBody.STATUS == 'RD' && ( reqBody.DEPT_TRANS_ID==undefined || reqBody.DEPT_TRANS_ID==null || 
                reqBody.DEPT_TRANS_ID.trim()=="" || reqBody.DEPT_TRANS_ID.trim().toLowerCase()=="null")) ){
                return res.status(400).send({
                    status: false,
                    message: "Invalid request"
                })
            }
            let result = await this.EcCcService.updtCCpaymentdetails(reqBody);
            let responseData ={
                status: true,
                message: "Success",
                code: "200",
            };
			res.status(200).send({...responseData});
		}catch(ex){
			console.error("ecCcHandler - updtCCpaymentdetails || Error :", ex);
            let PDEError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
                {
                    status: false,
                    message: PDEError.message
                }
            );
		}
    }

    getAllCCDataByLoginId = async (req,res)=>{
		const loginUser = req.user;
        console.log("::::::::::::::::::::::::::::",loginUser)
		try{
			let responseData = await this.EcCcService.getAllCCRequestsByUserId(loginUser);
			res.status(200).send(responseData);
		}catch(ex){
			console.error("ccCcHandler - getAllCCDataByLoginId || Error :", ex);
            let PDEError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
                {
                    status: false,
                    message: PDEError.message
                }
            );
		}
	}
    
    getData = async (req,res) => {
        const reqQuery = req.query;
        if (reqQuery?.SR_CODE == null || reqQuery?.BOOK_NO == null || reqQuery?.REG_YEAR == null || reqQuery?.DOCT_NO == null) {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
		try{
            let response = await this.EcCcService.downloadCCAndUpdateStatus(reqQuery);
            if(response.length === 0){
                res.status(404).send({
                    status: false,
                    message: "No data found",
                    code: "404"
                })
                return;
            }else{
			let responseData = {
				status:true, 
				message: "Success",
				code: "200",
				data: response
			};
            res.status(200).send({...responseData});
        }
		}catch(ex){
			console.error("CCHandler - getData || Error :", ex);
            let PDEError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[NAMES.INTERNAL_SERVER_ERROR]).send(
                {
                    status: false,
                    message: PDEError.message
                }
            );
		}
	
    }

    getCCCopyByDetailsData = async (req,res) => {
        const reqQuery = req.body;
        if (reqQuery?.sroCode== null || reqQuery?.year == null || reqQuery?.docId == null || reqQuery?.hashMsgNew == null || reqQuery?.randomNo == null) {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
		try{
            let response = await this.EcCcService.getCCCopyByDetailsDataSrvc(reqQuery);
            if(response == 'Unauthorized Access'){
                res.status(401).send({
                    status: false,
                    message: "Unauthorized Access",
                    code: "401"
                })
                return;
            }
            else if(response.length === 0){
                res.status(404).send({
                    status: false,
                    message: "No data found",
                    code: "404"
                })
                return;
            }else{
			let responseData = {
				status:true, 
				message: "Success",
				code: "200",
				data: response
			};
            res.status(200).send({...responseData});
        }
		}catch(ex){
			console.error("CCHandler - getData || Error :", ex);
            let PDEError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[NAMES.INTERNAL_SERVER_ERROR]).send(
                {
                    status: false,
                    message: PDEError.message
                }
            );
		}
	
    }
    lpmMarketValueCheck = async (req,res)=>{
		const reqData = req.query;
		try{
			let response = await this.EcCcService.lpmMarketValueCheck(reqData);
            let responseData = {
				status:true, 
				message: "Success",
				code: "200",
                data: response

			};
			res.status(200).send({...responseData});
		}catch(ex){
			console.error("ecCcHandler - lpmMarketValueCheck || Error :", ex);
            let PDEError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
                {
                    status: false,
                    message: PDEError.message
                }
            );
		}
	}

    updateUserCCPaymentDetailsIfAny = async () => {
        console.log("CCSearchHandler - Inside of updateUserCCPaymentDetailsIfAny ");
        try {
            let response = await this.EcCcService.updateUserCCPaymentDetailsIfAny();
            console.log("CCSearchHandler - End of updateUserCCPaymentDetailsIfAny ");
            return response;
        } catch (error) {
            console.error("CCSearchHandler - updateUserCCPaymentDetailsIfAny || Error :", error);
            return error.message;
        }
    }

    getOldCCValidate = async (req,res) => {
        const reqQuery = req.query;
        const requiredFields = ['SR_CODE', 'BOOK_NO', 'REG_YEAR', 'DOCT_NO'];
        for (let field of requiredFields) {
            if (reqQuery[field] === undefined || reqQuery[field] === null || reqQuery[field] === '') {
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: `Validation Error: '${field}' is required`
                    }
                );
                return;
            }
            if (!Number.isInteger(Number(reqQuery[field]))) {
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: `Validation Error: '${field}' must be a numeric value`
                    }
                );
                return;
            }
        }
        // const bookArray = [1, 3, 4];
        if (parseInt(reqQuery.BOOK_NO) != 1) {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: `Invalid book number`
                }
            );
            return;
        }
		try{
            let response = await this.EcCcService.getOldCCValidateSrvc(reqQuery);
            if(response.length === 0){
                res.status(404).send({
                    status: false,
                    message: "No data found",
                    code: "404"
                })
                return;
            }else{
			let responseData = {
				status:true, 
				message: "Success",
				code: "200",
				data: response
			};
            res.status(200).send({...responseData});
        }
		} catch(ex) {
			console.error("CCHandler - getData || Error :", ex);
            let PDEError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[NAMES.INTERNAL_SERVER_ERROR]).send(
                {
                    status: false,
                    message: PDEError.message
                }
            );
		}
    }
}

module.exports = EcCcHandler;