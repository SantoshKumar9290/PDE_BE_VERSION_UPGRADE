const { NAMES } = require("../constants/errors");
const PaymentDao = require("../dao/PaymentsDao");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("../handlers/errorHandler");
const uuid = require("uuid");
const PaymentReceiptDetails = require("../model/paymentReceiptDetailsModel");
const PaymentDetails = require("../model/paymentDetailsModel");
const DocumentDetailsDao = require("../dao/documentDetailsDao");
const { Logger } = require('../../services/winston');
const orDbDao = require('../dao/oracleDbDaos')
const https = require('https');
const axios = require("axios");
const { encryptWithAESPassPhrase } = require("../utils");

const instance = axios.create({
  httpsAgent: new https.Agent({
	rejectUnauthorized: false
  })
});

class PaymentService {
	constructor() {
		this.paymentDao = new PaymentDao();
		this.documentDetailsDao = new DocumentDetailsDao();
		this.dbDao = new orDbDao();
	}
	createPayment = async (reqData) => {
		try {
			reqData.paymentId = uuid.v4();
			let paymentDb = await this.paymentDao.create(reqData);
			return paymentDb;
		} catch (ex) {
			Logger.error(ex.message);
			console.error("PaymentService - createPayment || Error : ", ex.message);
			throw constructPDEError(ex);
		}
	};
	getPayment = async (docId) => {
		try {
			let filters = { documentId: docId };
			let response = await this.paymentDao.getByFilters(filters);
			return response;
		} catch (ex) {
			Logger.error(ex.message);
			console.error("PaymentService - getPayment || Error : ", ex.message);
			throw constructPDEError(ex);
		}
	}
	updatePaymentService = async (reqData, update) => {
		try {
			let filters = { _id: reqData.id, documentId: update.documentId };
			let response = await this.paymentDao.getFindandUpdate(filters, update);
			return response;
		} catch (ex) {
			Logger.error(ex.message);
			console.error("PaymentService - updatePaymentService || Error : ", ex.message);
			throw constructPDEError(ex);
		}
	}

	updatePaymentDetailsService = async (appId) => {
		try {
			let filters = { applicationNumber: appId};
			let latestPayement = await PaymentReceiptDetails.findOne(filters).sort({createdAt:-1});
			let newfilters = { applicationNumber: appId,departmentTransID:latestPayement.departmentTransID}
			let response = await PaymentReceiptDetails.findOneAndUpdate(newfilters,{
				$set:{isUtilized:true}
			});
			return response;
		} catch (ex) {
			Logger.error(ex.message);
			console.error("PaymentService - updatePaymentService || Error : ", ex.message);
			throw constructPDEError(ex);
		}
	}

	deletePaymentService = async (reqData) => {
		try {
			let filters = { _id: reqData.id };
			let response = await this.paymentDao.delete(filters);
			return response;
		} catch (ex) {
			Logger.error(ex.message);
			console.error("PaymentService - deletePaymentService || Error : ", ex.message);
			throw constructPDEError(ex);
		}
	}
	getPaymentStatus = async (id) => {
		try {
			const query = { applicationNumber: id, isUtilized: false };
			// const query = {documentId: id};
			const latestReceipt = await PaymentReceiptDetails.find(query).sort({ createdAt: -1 }).limit(1);
			return latestReceipt;
		} catch (ex) {
			Logger.error(ex.message);
			throw constructPDEError(ex);
		}
	}

	getCCPaymentStatus = async (id,srcode) => {
        try {
            let latestReceipt = await PaymentReceiptDetails.find({applicationNumber:id,isUtilized:false}).sort({ createdAt: -1 }).limit(1);
            if(latestReceipt == undefined || latestReceipt == null || latestReceipt.length == 0){
                let transBase64 = Buffer.from(id).toString("base64");
                const data = JSON.stringify({
                    "deptTransactionID": transBase64
                });
                var config = {
                    method: 'post',
                    url: `${process.env.CFMS_TRANS_API}/getCfmsTransactionDataByAppNumOrDeptTranId`,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: data,
                };
                console.log("paymentService - Executing the IGRS Payment gateway API :::: ");
                const response = await axios.request(config);
                if(response.data && response.data.STATUS == 'Success'){
                    let paymentData = response.data;
                    paymentData['isUtilized'] = false;
                    paymentData['paidTo'] = srcode;
                    let timeStamp = paymentData.bankTransDate;
                    let transactionStatus = paymentData.transStatus;
                    paymentData['bankTimeStamp'] = timeStamp;
                    paymentData['transactionStatus'] = transactionStatus;
                    delete paymentData["bankTransDate"];
                    delete paymentData["transStatus"];
                    delete paymentData["otherAmount"];
                    delete paymentData["serviceName"];
                    let payemntRecieptData = new PaymentReceiptDetails({...paymentData});
                    latestReceipt = await payemntRecieptData.save();
                }
            }
               
            return latestReceipt;
 
        } catch (ex) {
            Logger.error(ex.message);
            throw constructPDEError(ex);
        }
    }

	getCSCPaymentStatus = async (reqBody) => {
		try {
			let requestNum = reqBody.requestNum;
			let cscId = reqBody.cscId;
			let service = reqBody.service;
			let isValidPaymentCheck = await this.validateRequestByServiceAndCscIDAndRequestNum(requestNum, cscId, service);
			let latestReceipt;
			if(isValidPaymentCheck){
				const query = { applicationNumber: requestNum, isUtilized: false };
				latestReceipt = await PaymentReceiptDetails.find(query).sort({ createdAt: -1 }).limit(1);
			}else{
				latestReceipt = "Bad Request";
			}
			return latestReceipt;
		} catch (ex) {
			Logger.error(ex.message);
			throw constructPDEError(ex);
		}
	}

	validateRequestByServiceAndCscIDAndRequestNum = async (requestNum, cscId, service) => {
		try {
			if(service=="PDE"){
				let documentDbFilter = {"userId":cscId, "documentId":requestNum};
				let documentDbResponse = await this.documentDetailsDao.getByFilters(documentDbFilter);
				if(documentDbResponse != undefined && documentDbResponse != null && documentDbResponse.length > 0){
					return true;
				}
			} else {
				let query;
				if(service=="EC"){
					query = 'select * from srouser.public_ec_status where USER_ID=:userId and REQUEST_NO=:reqNum';
				}
				else if(service=="CC"){
					query = 'select * from srouser.public_cc_status where USER_ID=:userId and APP_ID=:reqNum';
				}
				if(query!=undefined){
					let reqData = { userId: cscId, reqNum: requestNum};
					let result = await this.dbDao.fetchDataByQuery(query, reqData);
					if(result.length>0)
						return true;
				}
			}
		} catch (ex) {
			Logger.error(ex.message);
		}
		return false;
	}

	cscPaymentCheck = async (reqBody) => {
		try {
			console.log("PaymentService - Inside of cscPaymentCheck method:::");
			let cscId = reqBody.cscId;
			let requestNo = reqBody.requestNo;
			let serviceName = reqBody.service;
			let requestData = JSON.stringify({ "cscId": cscId, "requestNo": requestNo, "serviceName": serviceName });

			let config = {
				url: process.env.CSC_PAYMENT_VERIFY_URL,
				httpsAgent: new https.Agent({  
					rejectUnauthorized: false
				}),
				headers: { 
				  'Content-Type': 'application/json',
				  'Access-Control-Allow-Origin': '*',
				  'Accept': '*',
				  'token': process.env.CSC_PAYMENT_VERIFY_API_TOKEN
				},
				data : requestData
			};
			const response = await axios.request(config);
			console.log("PaymentService - End of cscPaymentCheck method:::");
			return response.data;
		} catch (ex) {
			console.error("PaymentService - Error inside of cscPaymentCheck method:::", ex);
			Logger.error(ex);
			throw constructPDEError(ex);
		}
	}

	getPaymentCheckSrvc = async (id) => {
		try {
			Logger.info(`getPaymentCheckSrvc - Inside of getPaymentCheckSrvc method::: ${id}`);
			let latestReceipt = await PaymentReceiptDetails.find({ cfmsTransID: id }).sort({ createdAt: -1 }).limit(1);
			Logger.info(`Payment from Database::: ${JSON.stringify(latestReceipt)}`);
			let response;
			const config = {
				method: 'post',
				headers: {
						'Content-Type': 'application/json'
				},
			}
			if (latestReceipt.length > 0) {
				let transBase64 = Buffer.from(latestReceipt[0]?.departmentTransID).toString("base64");
				Logger.info(`getPaymentCheckSrvc - Executing the IGRS Payment gateway API ::::`);
				response = await instance.request({
					...config,
					url: `${process.env.CFMS_TRANS_API}/getCfmsTransactionByDepartmentID`,
					data: { deptTransactionID: transBase64 }
				});
				Logger.info(`CFMS Response::: ${JSON.stringify(response.data)}`);
				if (response.data) {
					return response.data;
				}
			}
			if (!latestReceipt.length || !response?.data) {
				Logger.info(`getPaymentCheckSrvc - Executing the Challan API::::::`);
				const challanResponse = await instance.request({
					...config,
					url: `${process.env.CFMS_TRANS_API}/getChallanDetailsByChallanNumber`,
					data: { challanNumber: encryptWithAESPassPhrase(id, "igrsSecretPhrase") }
				});
				Logger.info(`CHALLAN RESPONSE API:::::::: ${JSON.stringify(challanResponse?.data)}`);
				if (challanResponse?.data?.statusCode && typeof challanResponse?.data?.data === 'object') {
					return challanResponse?.data?.data;
				}
				else {
					return challanResponse?.data?.message;
				}
			}
		} catch (ex) {
			console.error("PaymentService - getPaymentCheckSrvc:::", ex);
			Logger.error(ex.message);
			throw constructPDEError(ex);
		}
	}	

}
module.exports = PaymentService;