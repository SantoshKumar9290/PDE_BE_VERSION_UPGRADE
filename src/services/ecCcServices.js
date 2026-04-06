const PDEError = require("../errors/customErrorClass");
const orDbDao = require('../dao/oracleDbDaos')
const { Logger } = require('../../services/winston');

// const { Error } = require("../handlers/errorHandler");
const PaymentReceiptDetails = require("../model/paymentReceiptDetailsModel");
const axios = require("axios");
const https = require('https');
const { generateDoubleHashValue } = require('../utils/validations')
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const { constructPDEError } = require("../handlers/errorHandler");
const { encryptWithAESPassPhrase } = require("../utils/index");

class EcCcService {
	constructor() {
		this.dbDao = new orDbDao();
	}

	getAllECRequestsByUserId = async (loginUser) => {
		console.log("ecCcServices - Inside of getAllECRequestsByUserId ::: ");
		Logger.info(`ecCcServices - Inside of getAllECRequestsByUserId ===> ${JSON.stringify(loginUser)}`);
		try {
			let query = 'select * from srouser.public_ec_status where user_id=:userId order by time_stamp desc';
			let reqData = { userId: loginUser.userId };
			let result = await this.dbDao.fetchDataByQuery(query, reqData);
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: result,
			};
			console.log("ecCcServices - End of getAllECRequestsByUserId ::: ");
			Logger.info(`ecCcServices - End of getAllECRequestsByUserId ===> ${JSON.stringify(reqData)}`);
			return responseData
		} catch (ex) {
			console.log("ecCcServices - getAllECRequestsByUserId || Error : ", ex.message);
			Logger.error("ecCcServices - getAllECRequestsByUserId || Error:", ex.message);
			throw new PDEError({ err: ex.message });
		}
	}

	paystatus = async (reqData) => {
		console.log("ecCcServices - Inside of paystatus ::: ");
		Logger.info(`ecCcServices - Inside of paystatus ===> ${JSON.stringify(reqData)}`);
		try {
			let respose = await this.getECQueryDataByRequestNumber(reqData.reqno);
			if (respose == undefined) {
				return {
					status: false,
					message: "Requested EC got expired. Please raise a new EC request and do payment immediately.",
					code: "404",
				};
			}
			const query = { applicationNumber: reqData.reqno, isUtilized: false, transactionStatus: "Success" };
			let resultData = await PaymentReceiptDetails.find(query).sort({ createdAt: -1 }).limit(1);
			if (resultData != null && resultData != undefined && resultData.length > 0) {
				let peymentReceipt = resultData[0];
				resultData = await this.updateECRequestsPaymentData(reqData, peymentReceipt.departmentTransID);
			} else {
				let transBase64 = Buffer.from(reqData.reqno).toString("base64");
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
				console.log("ecCcServices - Executing the IGRS Payment gateway API :::: ");
				const response = await axios.request(config);
				if (response.data.transStatus == "Success") {
					resultData = await this.updateECRequestsPaymentData(reqData, response.data.departmentTransID);
				}
			}

			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: resultData,
			};
			console.log("ecCcServices - End of paystatus ::: ");
			return responseData;
		} catch (ex) {
			Logger.error(ex.message);
			console.log("ecCcServices - paystatus || Error : ", ex.message);
			throw new PDEError({ err: ex.message });
		}
	}

	getECQueryDataByRequestNumber = async (requestNumber) => {
		console.log("ecCcServices - Inside of getECQueryDataByRequestNumber ::: ");
		Logger.info(`ecCcServices - Inside of getECQueryDataByRequestNumber ===> ${JSON.stringify(requestNumber)}`);
		try {
			let reqNoQuery = "select * from SROUSER.nec_qry where SLNO=:reqnum";
			let resultList = await this.dbDao.fetchDataByQuery(reqNoQuery, { reqnum: requestNumber });
			let responseData;
			if (resultList != null && resultList.length > 0)
				responseData = resultList[0];
			console.log("ecCcServices - End of getECQueryDataByRequestNumber ::: ");
			return responseData
		} catch (ex) {
			console.log("ecCcServices - getECQueryDataByRequestNumber || Error : ", ex.message);
			Logger.error("ecCcServices - getECQueryDataByRequestNumber || Error :",ex.message);
			throw new PDEError({ err: ex.message });
		}
	}

	updateECRequestsPaymentData = async (reqData, deptId) => {
		console.log("ecCcServices - Inside of updateECRequestsPaymentData ::: ");
		Logger.info(`ecCcServices - Inside of updateECRequestsPaymentData ===> ${JSON.stringify(reqData)}`);
		try {
			let query = `update srouser.public_ec_status set STATUS='P', PAID_ON=sysdate, 
						DEPT_TRANS_ID=:deptID where SR_CODE=:srcode and REQUEST_NO=:reqNum`;

			let bindParams = { deptID: deptId, srcode: reqData.srcode, reqNum: reqData.reqno };

			let result = await this.dbDao.oDbUpdateWithBindParams(query, bindParams);
			// if payment succeeded, shift any temp rows from dummy table to real table
			let moveQuery = `INSERT INTO SROUSER.ec_temp (slno, sr_code, reg_year, doct_no, schedule_no, 
					flag_sn, lnkno, code)
					SELECT slno, sr_code, reg_year, doct_no, schedule_no, flag_sn, lnkno, code
					  FROM SROUSER.ec_temp_unpaid
					 WHERE slno = :reqNum`;
			let moved = await this.dbDao.oDbUpdateWithBindParams(moveQuery, { reqNum: reqData.reqno });
			Logger.info(`ecCcServices - moved ${moved} rows from ec_temp_unpaid for ${reqData.reqno}`);
			if(moved>0) {
				let delDummy = `DELETE FROM SROUSER.ec_temp_unpaid WHERE slno = :reqNum`;
				let deleted = await this.dbDao.oDbUpdateWithBindParams(delDummy, { reqNum: reqData.reqno });
				Logger.info(`ecCcServices - deleted ${deleted} dummy rows for ${reqData.reqno}`);
			} else {
				Logger.warn(`ecCcServices - no dummy rows to move for ${reqData.reqno}`);
			}

			delete bindParams["deptID"];
			query = 'select * from srouser.public_ec_status where SR_CODE=:srcode and REQUEST_NO=:reqNum';
			result = await this.dbDao.fetchDataByQuery(query, bindParams);
			let responseData;
			if (result.length > 0)
				responseData = result[0];
			console.log("ecCcServices - End of updateECRequestsPaymentData ::: ");
			Logger.info(`ecCcServices - End of updateECRequestsPaymentData ===> ${JSON.stringify(responseData)}`);
			return responseData
		} catch (ex) {
			console.log("ecCcServices - updateECRequestsPaymentData || Error : ", ex.message);
			Logger.error("ecCcServices - updateECRequestsPaymentData || Error :",ex.message);
			throw new PDEError({ err: ex.message });
		}
	}

	checkDailyRequestLimit = async (userId) => {
		try {
			let countQuery = `SELECT COUNT(*) AS count FROM srouser.public_ec_status WHERE user_id = :userId AND TRUNC(TIME_STAMP) = TRUNC(SYSDATE)`;
			let result = await this.dbDao.fetchDataByQuery(countQuery, { userId });
			if (result[0]?.count >= 5 || result[0]?.COUNT >= 5) {
				throw new PDEError({
					err: "Daily requests limit of 5 reached. Please try again tomorrow."
				});
			}
			return true
		} catch (ex) {
			throw ex;
		}
	};

	createCCRequest = async (reqData) => {
		try {
			Logger.info(`ecCcServices - createCCRequest ===> ${JSON.stringify(reqData)}`);
			let response = await this.getDataSrvc(reqData);
			let isValidReq = false;
			if (response != null && response != undefined && typeof response == 'object') {
				isValidReq = true;
			}
			if (!isValidReq) {
				throw new Error( response.message || 'Request creation failed due to data not found');
			}
			// 	let query = `INSERT INTO SROUSER.PUBLIC_CC_STATUS (SR_CODE, DOCT_NO, REG_YEAR, BOOK_NO, USER_ID, STATUS, TIME_STAMP,DEPT_TRANS_ID, REQUESTED_ON, REQUESTED_BY, APP_ID)
			// 	VALUES (${reqData.SR_CODE}, ${reqData.DOCT_NO}, ${reqData.REG_YEAR}, ${reqData.BOOK_NO}, '${reqData.USER_ID}', '${reqData.STATUS}', TO_DATE('${reqData.TIME_STAMP}', 'YYYY-MM-DD'),'${reqData.DEPT_TRANS_ID}',TO_DATE('${reqData.REQUESTED_ON}', 'YYYY-MM-DD'), '${reqData.REQUESTED_BY}', '${reqData.APP_ID}')
			//   `;
			let query = ` INSERT INTO SROUSER.PUBLIC_CC_STATUS (SR_CODE, DOCT_NO, REG_YEAR, BOOK_NO, USER_ID, STATUS,TIME_STAMP,REQUESTED_ON, REQUESTED_BY,APP_ID, CC_FROM) VALUES(:SR_CODE,:DOCT_NO,:REG_YEAR, :BOOK_NO, :USER_ID, :STATUS, TO_DATE(:TIME_STAMP, 'YYYY-MM-DD'), TO_DATE(:REQUESTED_ON, 'YYYY-MM-DD'),:REQUESTED_BY, :APP_ID, :CC_FROM)`;
			const bindParams = {
				SR_CODE : reqData.SR_CODE,
				DOCT_NO : reqData.DOCT_NO,
				REG_YEAR : reqData.REG_YEAR,
				BOOK_NO : reqData.BOOK_NO,
				USER_ID : reqData.USER_ID,
				STATUS : reqData.STATUS,
				TIME_STAMP : reqData.TIME_STAMP,
				REQUESTED_ON : reqData.REQUESTED_ON,
				REQUESTED_BY : reqData.REQUESTED_BY,
				APP_ID : reqData.APP_ID,
				CC_FROM : reqData.CC_FROM
			}
			let result = await this.dbDao.oDbInsertDocsWithBindParams(query, bindParams);
			if (result <= 0) {
				throw new Error('Bad Request')
			}
			return result
		} catch (ex) {
			console.log("ecCcServices - createCCRequest || Error : ", ex.message);
			Logger.error("ecCcServices - createCCRequest || Error : ", ex.message);
			throw new PDEError({ err: ex.message });
		}
	}

	updtCCpaymentdetails = async (reqData) => {
		try {
			if((reqData.DEPT_TRANS_ID != null && reqData.DEPT_TRANS_ID != undefined 
				&& reqData.STATUS == 'RD') || reqData.STATUS != 'RD' )
			{
				if((reqData.DEPT_TRANS_ID != null && reqData.DEPT_TRANS_ID != undefined && reqData.STATUS == 'RD')){
					let validationQuery = "select * from SROUSER.PUBLIC_CC_STATUS where  DEPT_TRANS_ID=:deptTransId";
					let bindParam = {
						"deptTransId": reqData.DEPT_TRANS_ID
					}

					let deptResult = await this.dbDao.fetchDataByQuery(validationQuery, bindParam);
					if(deptResult != undefined && deptResult != null && deptResult.length > 1){
						throw new PDEError({ err: "Invalid Payment Data" });
					}

					let challanData = await this.getChallandetailsbyTransactionID(reqData.DEPT_TRANS_ID);
					if(challanData == null || challanData == undefined){
						throw new PDEError({ err: "Invalid Payment Data" });
					}
				}
				
				const Status = {
					"RD": `STATUS='RD', DEPT_TRANS_ID='${reqData.DEPT_TRANS_ID}', PAID_ON = to_date('${reqData.REQUESTED_ON}', 'YYYY-MM-DD')`,
					DD: `DOWNLOADED_ON=to_date('${reqData.DOWNLOADED_ON}','YYYY-MM-DD'),STATUS='DD'`,
					SD: `REQUESTED_ON=to_date('${reqData.REQUESTED_ON}','YYYY-MM-DD'),STATUS='SD'`
				};
				console.log(Status[reqData.STATUS], 'premstatus');
				try {
					let query = `UPDATE SROUSER.PUBLIC_CC_STATUS SET ${Status[reqData.STATUS]} WHERE APP_ID='${reqData.APP_ID}' and SR_CODE=${reqData.SR_CODE}`;
					console.log("::::::2222222222:::::::", query)
					console.log(query);
					let result = await this.dbDao.oDbUpdate(query);
					if (result < 0) {
						throw new Error('Bad Request');
					}
					return result;
				} catch (ex) {
					Logger.error("ecCcServices - updtCCpaymentdetails || Error: ", ex);
					console.error("ecCcServices - updtCCpaymentdetails || Error: ", ex);
					throw new PDEError({ err: ex.message });
				}
			}else{
				throw new Error('Invalid Data');
			}
		} catch (ex) {
			console.log("ecCcServices - createCCRequest || Error : ", ex.message);
			throw new PDEError({ err: ex.message });
		}
	}


	getChallandetailsbyTransactionID = async (departmentTransID) => {
		try {
				let trans_Base64 = Buffer.from(departmentTransID).toString("base64");
				const data = JSON.stringify({
					"deptTransactionID": trans_Base64
				});
				var config = {
                    method: 'post',
                    url: `${process.env.CFMS_TRANS_API}/getCfmsTransactionByDepartmentID`,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: data,
                    httpsAgent: new https.Agent({  
                        rejectUnauthorized: false
                      })
                };

			let	cfmsresults = await axios.request(config);
			
			let chalans = cfmsresults?.data?.data;
			return chalans;
			
		}catch (ex) {
			console.log("ecCcServices - getChallandetailsbyTransactionID || Error : ", ex.message);
			// throw new PDEError({ err: ex.message });
			return null;
		}
	}





	//CC Servcies
	getAllCCRequestsByUserId = async (loginUser) => {
		console.log("ecCcServices - Inside of getAllCCRequestsByUserId ::: ");
		try {
			// let query = 'select * from srouser.public_cc_status where user_id=:userId order by time_stamp';
			let query = 'SELECT * FROM srouser.public_cc_status WHERE user_id = :userId ORDER BY time_stamp DESC';
			console.log("query ::::: ", query);
			let reqData = { userId: loginUser.userId };
			console.log("reqData ::::: ", reqData);
			let result = await this.dbDao.fetchDataByQuery(query, reqData);
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: result,
			};
			console.log("ecCcServices - End of getAllCCRequestsByUserId ::: ");
			return responseData
		} catch (ex) {
			console.log("ecCcServices - getAllCCRequestsByUserId || Error : ", ex.message);
			throw new PDEError({ err: ex.message });
		}
	}



	downloadCCAndUpdateStatus = async (reqData) => {
		try {
			let validationQuery = "select * from SROUSER.PUBLIC_CC_STATUS where APP_ID = :APP_ID and SR_CODE = :SR_CODE and status = 'RD'";

			let bindParam = {
				"SR_CODE": reqData.SR_CODE,
				"APP_ID": reqData.APP_ID,
			}

			let result = await this.dbDao.fetchDataByQuery(validationQuery, bindParam);
			if(result != undefined && result != null && result.length > 0){
				let ccDetails = result[0];
				let deptTransId = ccDetails.DEPT_TRANS_ID;

				validationQuery = "select * from SROUSER.PUBLIC_CC_STATUS where DEPT_TRANS_ID=:deptTransId";
				bindParam = {
					"deptTransId": deptTransId
				}

				let deptResult = await this.dbDao.fetchDataByQuery(validationQuery, bindParam);
				if(deptResult != undefined && deptResult != null && deptResult.length > 1){
					throw new PDEError({ err: "Invalid Payment Data" });
				}
				let challanData = this.getChallandetailsbyTransactionID(ccDetails.DEPT_TRANS_ID);
				if(challanData == null || challanData == undefined){
					throw new PDEError({ err: "Invalid Payment Data" });
				}
			}else{
				throw new PDEError({ err: "Invalid Payment Data" });
			}
			reqData = {...reqData, CC_FROM : result[0].ccfrom};
			let response = await this.getDataSrvc(reqData);
			if (response != null && response != undefined && typeof response == 'object') {
				let updateData = {
					"DOWNLOADED_ON": new Date().toISOString().split("T")[0],
					"STATUS": "DD",
					"SR_CODE": reqData.SR_CODE,
					"APP_ID": reqData.APP_ID,
				}
				this.updtCCpaymentdetails(updateData);
				let query = `update scanuser.echallan_trans set CON_STATUS='Y' where DEPTTRANSID='${reqData.APP_ID}' and SR_CODE='${reqData.SR_CODE}'`;
				let result = await this.dbDao.oDbUpdate(query);
				return response;
			} else {
				throw new Error(response.message || 'Data not found');
			}
		} catch (ex) {
			console.log("ecCcServices - downloadCCAndUpdateStatus || Error : ", ex.message);
			throw new PDEError({ err: ex.message });
		}

	}

	getDataSrvc = async (reqData) => {
		try {
			Logger.info(`CCServices - getDataSrvc ===> ${JSON.stringify(reqData)}`);
			let countQuery = `SELECT COUNT(*) AS COUNT FROM SROUSER.PUBLIC_CC_STATUS WHERE USER_ID= :USER_ID AND TRUNC(TIME_STAMP) = TRUNC(SYSDATE)`;
			let countResult = await this.dbDao.oDBQueryServiceWithBindParams(countQuery, { USER_ID: reqData.USER_ID });
			if (countResult[0].count >= 5 || countResult[0].COUNT >= 5) {
				throw new PDEError({ err: "Daily requests limit of 5 reached. Please try again tomorrow." });
			}
			let result, fileName = `CertifyCopy_${reqData.SR_CODE}_${reqData.BOOK_NO}_${reqData.DOCT_NO}_${reqData.REG_YEAR}`;
			if (reqData?.CC_FROM && reqData?.CC_FROM?.toUpperCase() == 'WRITER') {
				reqData.hash = encryptWithAESPassPhrase(JSON.stringify(reqData), process.env.HASH_ENCRYPTION_KEY);
				const response = await axios.post(`${process.env.CARD_API}/cc/pde/oldcertifycopy`, reqData, {
					httpsAgent: httpsAgent,
					headers: {
						'Content-Type': 'application/json',
						"api-key": process.env.CARD_API_KEY
					}
				})
				result = { dataBase64: response.data.data, fileName: fileName };
			} else {
				let imageQuery = `SELECT IMAGE 
									FROM cardimages.digitally_sign_docs 
									WHERE SR_CODE= :SR_CODE
									AND BOOK_NO= :BOOK_NO 
									AND REG_YEAR= :REG_YEAR 
									AND DOCT_NO= :DOCT_NO`;
				const bindparams = {
					SR_CODE: reqData.SR_CODE,
					BOOK_NO: reqData.BOOK_NO,
					REG_YEAR: reqData.REG_YEAR,
					DOCT_NO: reqData.DOCT_NO
				}
				result = await this.dbDao.oDBQueryServiceCCWithBindParams(imageQuery, bindparams);
				if (result.length === 0) {
					let docQuery = `SELECT doct_no, reg_year 
                						FROM tran_major 
                					WHERE SR_CODE= :SR_CODE
                  						AND BOOK_NO= :BOOK_NO 
                  						AND ryear= :REG_YEAR 
                  						AND RDOCT_NO= :DOCT_NO`;
					const docResult = await this.dbDao.oDBQueryServiceWithBindParams(docQuery, bindparams);
					if (!docResult || docResult.length === 0) {
						throw new Error("Document not found");
					}
					const payload = JSON.stringify({
						sroCode: reqData.SR_CODE,
						bookNo: reqData.BOOK_NO,
						documentNo: docResult[0].DOCT_NO,
						registedYear: docResult[0].REG_YEAR
					});
					const config = {
						method: 'post',
						maxBodyLength: Infinity,
						url: 'http://10.96.47.48:3021/digitalSign/v1/dsc/signedFile',
						headers: {
							'Content-Type': 'application/json'
						},
						data: payload
					};
					const apiResponse = await axios.request(config);
					if (!apiResponse?.data?.data || apiResponse.data.data.length === 0) {
						throw new Error("No data returned from signing service");
					}
					result = apiResponse.data.data;
					result.fileName = fileName;
				}
			}
			return result;
		} catch (ex) {
			console.error("CCServices - getDataSrvc || Error :", ex.message);
			throw new PDEError({ err: ex.message });
		}
	};


	getCCCopyByDetailsDataSrvc = async (reqData) => {
		try {
			let hashValue = generateDoubleHashValue("APONLINE", reqData.randomNo);
			if (hashValue != reqData.hashMsgNew) {
				return 'Unauthorized Access';
			}
			let result;
			let imageQuery = `SELECT IMAGE FROM cardimages.digitally_sign_docs WHERE SR_CODE=${reqData.sroCode} AND REG_YEAR = ${reqData.year} AND DOCT_NO=${reqData.docId}`;
			result = await this.dbDao.oDBQueryService(imageQuery);
			if (result.length === 0) {
				try {
					let query = `SELECT doct_no, book_no FROM tran_major WHERE SR_CODE=${reqData.sroCode} AND REG_YEAR = ${reqData.year} AND RDOCT_NO=${reqData.docId}`;
					result = await this.dbDao.oDBQueryService(query);
					/*
							let data = JSON.stringify({
								"bookNo": result[0].BOOK_NO,
								"sroCode": reqData.sroCode,
								"documentNo": result[0].DOCT_NO,
								"registedYear": reqData.year,
							});
							let config = {
								method: 'post',
								maxBodyLength: Infinity,
								url: 'http://10.96.47.48:3021/digitalSign/v1/dsc/signedFile',
								headers: {
									'Content-Type': 'application/json'
								},
								data: data
							};
							const response = await axios.request(config);
							console.log('1234567890234567890', response.data.data);
							if (response.data.data.length === 0) {
								console.log("No Data Found in scanuser Table");
							} else {
								result = response.data.data;
							}
							*/
					result = {
						"dataBase64": "JVBERi0xLjcNCiW1tbW1DQoxIDAgb2JqDQo8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbikgL1N0cnVjdFRyZWVSb290IDE3IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4vT3V0cHV0SW50ZW50c1s8PC9UeXBlL091dHB1dEludGVudC9TL0dUU19QREZBMS9PdXRwdXRDb25kaXRpb25JZGVudGlmaWVyKHNSR0IpIC9SZWdpc3RyeU5hbWUoaHR0cDovL3d3dy5jb2xvci5vcmcpIC9JbmZvKENyZWF0b3I6IEhQICAgICBNYW51ZmFjdHVyZXI6SUVDICAgIE1vZGVsOnNSR0IpIC9EZXN0T3V0cHV0UHJvZmlsZSA0NCAwIFI+Pl0gL01ldGFkYXRhIDQ1IDAgUi9WaWV3ZXJQcmVmZXJlbmNlcyA0NiAwIFI+Pg0KZW5kb2JqDQoyIDAgb2JqDQo8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1sgMyAwIFJdID4+DQplbmRvYmoNCjMgMCBvYmoNCjw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDUgMCBSL0YyIDkgMCBSPj4vRXh0R1N0YXRlPDwvR1M3IDcgMCBSL0dTOCA4IDAgUj4+L1hPYmplY3Q8PC9JbWFnZTE0IDE0IDAgUj4+L1Byb2NTZXRbL1BERi9UZXh0L0ltYWdlQi9JbWFnZUMvSW1hZ2VJXSA+Pi9NZWRpYUJveFsgMCAwIDU5NS4yIDg0MS45Ml0gL0NvbnRlbnRzIDQgMCBSL0dyb3VwPDwvVHlwZS9Hcm91cC9TL1RyYW5zcGFyZW5jeS9DUy9EZXZpY2VSR0I+Pi9TdHJ1Y3RQYXJlbnRzIDA+Pg0KZW5kb2JqDQo0IDAgb2JqDQo8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDQwNT4+DQpzdHJlYW0NCnictdbdS8MwEADw90L/h3vcBG+5fF0CY+A+HBMH6iY+iA9DZp82df7/4GVszImCC6ZQQpuk/fV6vRQ6s7fFGrrdznQwGYLqXC/WDbSW6/OL+3avB/3hAN7rSqFKWwg+ggIXHWoIljBq2Czr6uEM1nXVn9dV55KACJWF+UtdkQxWQKAjI2tgmWekZyXjxjOG5kOuDM32KOyOxnX12IL2E8yv6mokV7ytKxhNBwDHUiorZY0cttIt8O8uXdblFFqf4zJlXZox5rBsWZaShKMclyvq8kHSy+W4fFmXl/QyOS4u6zKMgXNcoayLZF5W3seiLhc1xqx4UdkVwLEkWNYHSYUKvjURDYMNjHmusgXfekafVfCpbMW31qHKWiHpH2q+3D+g0scy8hE1g5FXafeyVM+kH5kCbJrvZ+6SuasUaUU8lN0pcqn10iaLUcqNUl/PdndDfO/oCU8N6A9uqz3S6e5fYn1zCLQ7xJackwU6ZbnRoINJDROSC1+Mu/NJJX0ajiY9p7+2yWrRLMnC8BX2d/wES8ITWA0KZW5kc3RyZWFtDQplbmRvYmoNCjUgMCBvYmoNCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1RydWVUeXBlL05hbWUvRjEvQmFzZUZvbnQvQkNERUVFK0NhbGlicmkvRW5jb2RpbmcvV2luQW5zaUVuY29kaW5nL0ZvbnREZXNjcmlwdG9yIDYgMCBSL0ZpcnN0Q2hhciAzMi9MYXN0Q2hhciAzMi9XaWR0aHMgNDMgMCBSPj4NCmVuZG9iag0KNiAwIG9iag0KPDwvVHlwZS9Gb250RGVzY3JpcHRvci9Gb250TmFtZS9CQ0RFRUUrQ2FsaWJyaS9GbGFncyAzMi9JdGFsaWNBbmdsZSAwL0FzY2VudCA3NTAvRGVzY2VudCAtMjUwL0NhcEhlaWdodCA3NTAvQXZnV2lkdGggNTIxL01heFdpZHRoIDE3NDMvRm9udFdlaWdodCA0MDAvWEhlaWdodCAyNTAvU3RlbVYgNTIvRm9udEJCb3hbIC01MDMgLTI1MCAxMjQwIDc1MF0gL0ZvbnRGaWxlMiA0MCAwIFI+Pg0KZW5kb2JqDQo3IDAgb2JqDQo8PC9UeXBlL0V4dEdTdGF0ZS9CTS9Ob3JtYWwvY2EgMT4+DQplbmRvYmoNCjggMCBvYmoNCjw8L1R5cGUvRXh0R1N0YXRlL0JNL05vcm1hbC9DQSAxPj4NCmVuZG9iag0KOSAwIG9iag0KPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTAvQmFzZUZvbnQvQkNERkVFK0NhbGlicmkvRW5jb2RpbmcvSWRlbnRpdHktSC9EZXNjZW5kYW50Rm9udHMgMTAgMCBSL1RvVW5pY29kZSAzOSAwIFI+Pg0KZW5kb2JqDQoxMCAwIG9iag0KWyAxMSAwIFJdIA0KZW5kb2JqDQoxMSAwIG9iag0KPDwvQmFzZUZvbnQvQkNERkVFK0NhbGlicmkvU3VidHlwZS9DSURGb250VHlwZTIvVHlwZS9Gb250L0NJRFRvR0lETWFwL0lkZW50aXR5L0RXIDEwMDAvQ0lEU3lzdGVtSW5mbyAxMiAwIFIvRm9udERlc2NyaXB0b3IgMTMgMCBSL1cgNDIgMCBSPj4NCmVuZG9iag0KMTIgMCBvYmoNCjw8L09yZGVyaW5nKElkZW50aXR5KSAvUmVnaXN0cnkoQWRvYmUpIC9TdXBwbGVtZW50IDA+Pg0KZW5kb2JqDQoxMyAwIG9iag0KPDwvVHlwZS9Gb250RGVzY3JpcHRvci9Gb250TmFtZS9CQ0RGRUUrQ2FsaWJyaS9GbGFncyAzMi9JdGFsaWNBbmdsZSAwL0FzY2VudCA3NTAvRGVzY2VudCAtMjUwL0NhcEhlaWdodCA3NTAvQXZnV2lkdGggNTIxL01heFdpZHRoIDE3NDMvRm9udFdlaWdodCA0MDAvWEhlaWdodCAyNTAvU3RlbVYgNTIvRm9udEJCb3hbIC01MDMgLTI1MCAxMjQwIDc1MF0gL0ZvbnRGaWxlMiA0MCAwIFI+Pg0KZW5kb2JqDQoxNCAwIG9iag0KPDwvVHlwZS9YT2JqZWN0L1N1YnR5cGUvSW1hZ2UvV2lkdGggMzgyL0hlaWdodCA5Ni9Db2xvclNwYWNlL0RldmljZVJHQi9CaXRzUGVyQ29tcG9uZW50IDgvSW50ZXJwb2xhdGUgZmFsc2UvU01hc2sgMTUgMCBSL0ZpbHRlci9GbGF0ZURlY29kZS9MZW5ndGggMTY5MzM+Pg0Kc3RyZWFtDQp4nOyd918VWbboV9XJOZEzyKHJSUAkHTIIimQDiqKiCAKKhEbhECSDmECJYug2tLa2tqG77W6n7dvz5vXce+fNzL3z3kzPzLszc/+Qt+scJJxQtetw0L73sT7rBz8fqdp716n9rbX2XmttAIPI+RDjCgcjoS0JOnWUntoK+VrwVACHhHUTQiknkoJ4TXlkd+5iu/o07tlCMj+GcFWvX7sb8rMWRx8ISYPQHMhrgVOfQft3gsYvnfY9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ZW5kb2JqDQoxOCAwIG9iag0KPDwvRm9vdG5vdGUvTm90ZS9FbmRub3RlL05vdGUvVGV4dGJveC9TZWN0L0hlYWRlci9TZWN0L0Zvb3Rlci9TZWN0L0lubGluZVNoYXBlL1NlY3QvQW5ub3RhdGlvbi9TZWN0L0FydGlmYWN0L1NlY3QvV29ya2Jvb2svRG9jdW1lbnQvV29ya3NoZWV0L1BhcnQvTWFjcm9zaGVldC9QYXJ0L0NoYXJ0c2hlZXQvUGFydC9EaWFsb2dzaGVldC9QYXJ0L1NsaWRlL1BhcnQvQ2hhcnQvU2VjdC9EaWFncmFtL0ZpZ3VyZS9UaXRsZS9IMS9Db21tZW50QW5jaG9yL1NwYW4+Pg0KZW5kb2JqDQoxOSAwIG9iag0KPDwvTnVtc1sgMCAyMyAwIFJdID4+DQplbmRvYmoNCjIwIDAgb2JqDQo8PC9OYW1lc1tdID4+DQplbmRvYmoNCjIxIDAgb2JqDQo8PC9QIDE3IDAgUi9TL0RvY3VtZW50L1R5cGUvU3RydWN0RWxlbS9LWyAyMiAwIFIgMjQgMCBSIDI1IDAgUiAyNiAwIFIgMjcgMCBSIDI4IDAgUiAyOSAwIFIgMzAgMCBSIDMxIDAgUiAzMiAwIFIgMzMgMCBSIDM0IDAgUiAzNSAwIFIgMzYgMCBSIDM3IDAgUiAzOCAwIFJdID4+DQplbmRvYmoNCjIyIDAgb2JqDQo8PC9QIDIxIDAgUi9TL1AvVHlwZS9TdHJ1Y3RFbGVtL0tbIDBdIC9QZyAzIDAgUj4+DQplbmRvYmoNCjIzIDAgb2JqDQpbIDIyIDAgUiAyNCAwIFIgMjUgMCBSIDI2IDAgUiAyNyAwIFIgMjggMCBSIDI5IDAgUiAzMCAwIFIgMzEgMCBSIDMyIDAgUiAzMyAwIFIgMzQgMCBSIDM2IDAgUiAzNyAwIFIgMzggMCBSIDM1IDAgUl0gDQplbmRvYmoNCjI0IDAgb2JqDQo8PC9QIDIxIDAgUi9TL1AvVHlwZS9TdHJ1Y3RFbGVtL0tbIDFdIC9QZyAzIDAgUj4+DQplbmRvYmoNCjI1IDAgb2JqDQo8PC9QIDIxIDAgUi9TL1AvVHlwZS9TdHJ1Y3RFbGVtL0tbIDJdIC9QZyAzIDAgUj4+DQplbmRvYmoNCjI2IDAgb2JqDQo8PC9QIDIxIDAgUi9TL1AvVHlwZS9TdHJ1Y3RFbGVtL0tbIDNdIC9QZyAzIDAgUj4+DQplbmRvYmoNCjI3IDAgb2JqDQo8PC9QIDIxIDAgUi9TL1AvVHlwZS9TdHJ1Y3RFbGVtL0tbIDRdIC9QZyAzIDAgUj4+DQplbmRvYmoNCjI4IDAgb2JqDQo8PC9QIDIxIDAgUi9TL1AvVHlwZS9TdHJ1Y3RFbGVtL0tbIDVdIC9QZyAzIDAgUj4+DQplbmRvYmoNCjI5IDAgb2JqDQo8PC9QIDIxIDAgUi9TL1AvVHlwZS9TdHJ1Y3RFbGVtL0tbIDZdIC9QZyAzIDAgUj4+DQplbmRvYmoNCjMwIDAgb2JqDQo8PC9QIDIxIDAgUi9TL1AvVHlwZS9TdHJ1Y3RFbGVtL0tbIDddIC9QZyAzIDAgUj4+DQplbmRvYmoNCjMxIDAgb2JqDQo8PC9QIDIxIDAgUi9TL1AvVHlwZS9TdHJ1Y3RFbGVtL0tbIDhdIC9QZyAzIDAgUj4+DQplbmRvYmoNCjMyIDAgb2JqDQo8PC9QIDIxIDAgUi9TL1AvVHlwZS9TdHJ1Y3RFbGVtL0tbIDldIC9QZyAzIDAgUj4+DQplbmRvYmoNCjMzIDAgb2JqDQo8PC9QIDIxIDAgUi9TL1AvVHlwZS9TdHJ1Y3RFbGVtL0tbIDEwXSAvUGcgMyAwIFI+Pg0KZW5kb2JqDQozNCAwIG9iag0KPDwvUCAyMSAwIFIvUy9QL1R5cGUvU3RydWN0RWxlbS9LWyAxMV0gL1BnIDMgMCBSPj4NCmVuZG9iag0KMzUgMCBvYmoNCjw8L1AgMjEgMCBSL1MvRmlndXJlL1R5cGUvU3RydWN0RWxlbS9LWyAxNV0gL1BnIDMgMCBSPj4NCmVuZG9iag0KMzYgMCBvYmoNCjw8L1AgMjEgMCBSL1MvUC9UeXBlL1N0cnVjdEVsZW0vS1sgMTJdIC9QZyAzIDAgUj4+DQplbmRvYmoNCjM3IDAgb2JqDQo8PC9QIDIxIDAgUi9TL1AvVHlwZS9TdHJ1Y3RFbGVtL0tbIDEzXSAvUGcgMyAwIFI+Pg0KZW5kb2JqDQozOCAwIG9iag0KPDwvUCAyMSAwIFIvUy9QL1R5cGUvU3RydWN0RWxlbS9LWyAxNF0gL1BnIDMgMCBSPj4NCmVuZG9iag0KMzkgMCBvYmoN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ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCjwv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P0A/KHgo9bDskfKjuh/1f2wdtR49M+Y21vc45PH9cdb4s5+yfvowkfeE/KRsUm2yccpi6vS0x/SNpyueTjzLeDY/k/+z9M/Vz/Wef/eL0y99s5GzEy/4LxZ+LXqp8PLIK8tX3XOBc49ep72ef1PwVuHt0XeMd73vI95Pzud8wH4o/6j/seuT76cHC2kLC78B94Tz+w0KZW5kc3RyZWFtDQplbmRvYmoNCjQ1IDAgb2JqDQo8PC9UeXBlL01ldGFkYXRhL1N1YnR5cGUvWE1ML0xlbmd0aCAzMjMxPj4NCnN0cmVhbQ0KPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz48eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSIzLjEtNzAxIj4KPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgIHhtbG5zOnBkZj0iaHR0cDovL25zLmFkb2JlLmNvbS9wZGYvMS4zLyI+CjxwZGY6UHJvZHVjZXI+TWljcm9zb2Z0wq4gV29yZCAyMDE2PC9wZGY6UHJvZHVjZXI+PC9yZGY6RGVzY3JpcHRpb24+CjxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iPgo8ZGM6Y3JlYXRvcj48cmRmOlNlcT48cmRmOmxpPkVkZGllICBCdWdkYXk8L3JkZjpsaT48L3JkZjpTZXE+PC9kYzpjcmVhdG9yPjwvcmRmOkRlc2NyaXB0aW9uPgo8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIj4KPHhtcDpDcmVhdG9yVG9vbD5NaWNyb3NvZnTCriBXb3JkIDIwMTY8L3htcDpDcmVhdG9yVG9vbD48eG1wOkNyZWF0ZURhdGU+MjAyNC0wMy0yOFQyMzowMToyOSsxMTowMDwveG1wOkNyZWF0ZURhdGU+PHhtcDpNb2RpZnlEYXRlPjIwMjQtMDMtMjhUMjM6MDE6MjkrMTE6MDA8L3htcDpNb2RpZnlEYXRlPjwvcmRmOkRlc2NyaXB0aW9uPgo8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iPgo8eG1wTU06RG9jdW1lbnRJRD51dWlkOkI1NjhDMjU2LTA4QkQtNDVCMi04Rjc1LTdEM0E0NEJDN0RCMjwveG1wTU06RG9jdW1lbnRJRD48eG1wTU06SW5zdGFuY2VJRD51dWlkOkI1NjhDMjU2LTA4QkQtNDVCMi04Rjc1LTdEM0E0NEJDN0RCMjwveG1wTU06SW5zdGFuY2VJRD48L3JkZjpEZXNjcmlwdGlvbj4KPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgIHhtbG5zOnBkZmFpZD0iaHR0cDovL3d3dy5haWltLm9yZy9wZGZhL25zL2lkLyI+CjxwZGZhaWQ6cGFydD4zPC9wZGZhaWQ6cGFydD48cGRmYWlkOmNvbmZvcm1hbmNlPkE8L3BkZmFpZDpjb25mb3JtYW5jZT48L3JkZjpEZXNjcmlwdGlvbj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCjwvcmRmOlJERj48L3g6eG1wbWV0YT48P3hwYWNrZXQgZW5kPSJ3Ij8+DQplbmRzdHJlYW0NCmVuZG9iag0KNDYgMCBvYmoNCjw8L0Rpc3BsYXlEb2NUaXRsZSB0cnVlPj4NCmVuZG9iag0KeHJlZg0KMCA0Nw0KMDAwMDAwMDAwMCA2NTUzNSBmDQowMDAwMDAwMDE3IDAwMDAwIG4NCjAwMDAwMDAzNjIgMDAwMDAgbg0KMDAwMDAwMDQxOCAwMDAwMCBuDQowMDAwMDAwNzE2IDAwMDAwIG4NCjAwMDAwMDExOTUgMDAwMDAgbg0KMDAwMDAwMTM2MiAwMDAwMCBuDQowMDAwMDAxNjAxIDAwMDAwIG4NCjAwMDAwMDE2NTQgMDAwMDAgbg0KMDAwMDAwMTcwNyAwMDAwMCBuDQowMDAwMDAxODM4IDAwMDAwIG4NCjAwMDAwMDE4NjggMDAwMDAgbg0KMDAwMDAwMjAyOCAwMDAwMCBuDQowMDAwMDAyMTAyIDAwMDAwIG4NCjAwMDAwMDIzNDIgMDAwMDAgbg0KMDAwMDAxOTQ3MCAwMDAwMCBuDQowMDAwMDI2NjcyIDAwMDAwIG4NCjAwMDAwMjY4OTkgMDAwMDAgbg0KMDAwMDAyNzAwOCAwMDAwMCBuDQowMDAwMDI3MjkwIDAwMDAwIG4NCjAwMDAwMjczMzEgMDAwMDAgbg0KMDAwMDAyNzM2NCAwMDAwMCBuDQowMDAwMDI3NTQxIDAwMDAwIG4NCjAwMDAwMjc2MTAgMDAwMDAgbg0KMDAwMDAyNzc0NSAwMDAwMCBuDQowMDAwMDI3ODE0IDAwMDAwIG4NCjAwMDAwMjc4ODMgMDAwMDAgbg0KMDAwMDAyNzk1MiAwMDAwMCBuDQowMDAwMDI4MDIxIDAwMDAwIG4NCjAwMDAwMjgwOTAgMDAwMDAgbg0KMDAwMDAyODE1OSAwMDAwMCBuDQowMDAwMDI4MjI4IDAwMDAwIG4NCjAwMDAwMjgyOTcgMDAwMDAgbg0KMDAwMDAyODM2NiAwMDAwMCBuDQowMDAwMDI4NDM2IDAwMDAwIG4NCjAwMDAwMjg1MDYgMDAwMDAgbg0KMDAwMDAyODU4MSAwMDAwMCBuDQowMDAwMDI4NjUxIDAwMDAwIG4NCjAwMDAwMjg3MjEgMDAwMDAgbg0KMDAwMDAyODc5MSAwMDAwMCBuDQowMDAwMDI5MTQ0IDAwMDAwIG4NCjAwMDAwNTM0MTQgMDAwMDAgbg0KMDAwMDA1NDk2MCAwMDAwMCBuDQowMDAwMDU1MDY5IDAwMDAwIG4NCjAwMDAwNTUwOTYgMDAwMDAgbg0KMDAwMDA1Nzc2OSAwMDAwMCBuDQowMDAwMDYxMDgzIDAwMDAwIG4NCnRyYWlsZXINCjw8L1NpemUgNDcvUm9vdCAxIDAgUi9JbmZvIDE2IDAgUi9JRFs8NTZDMjY4QjVCRDA4QjI0NThGNzU3RDNBNDRCQzdEQjI+PDU2QzI2OEI1QkQwOEIyNDU4Rjc1N0QzQTQ0QkM3REIyPl0gPj4NCnN0YXJ0eHJlZg0KNjExMjgNCiUlRU9G",
						"fileName": "certifiedCopy.pdf",
						"fileType": "pdf"
					}
				} catch (error) {
					console.log("Error occurred while fetching data from external API:", error);
					throw new Error("Error occurred while fetching data from external API");
				}
			}
			return result;
		} catch (ex) {
			console.error("CCServices - getDataSrvc || Error :", ex);
			throw new PDEError({ err: ex });
		}
	}

	lpmMarketValueCheck = async (reqData) => {
		try {
			let query = `WITH check_condition AS (
                              SELECT 
                                CASE 
                                   WHEN EXISTS (
                                       SELECT 1 
                                        FROM card.gs_srcode 
                                           WHERE VILLAGE_CODE ='${reqData.VILLAGE_CODE}'
                                       ) 
                                 AND NOT EXISTS (
                                         SELECT 1 
                                         FROM sromstr.mv_basic_rur_reg 
                                         WHERE REV_VILL_CODE = '${reqData.VILLAGE_CODE}'
                                         AND SUB_SURVEY_NO != '/'
                                         )
                                 THEN 'Y'
                                 ELSE 'N'
                                 END AS status
                             FROM dual)
                        SELECT status FROM check_condition`;
			console.log(query);
			let response = await this.dbDao.oDBQueryService(query);
			console.log(response);
			return response
		} catch (ex) {
			console.log("ecCcServices - lpmMarketValueCheck || Error : ", ex.message);
			throw new PDEError({ err: ex.message });
		}
	}


	updateUserCCPaymentDetailsIfAny = async ()=>{
        try{
            console.log("CCSearchService - Inside of updateUserCCPaymentDetailsIfAny ");
            let userRequestedCcs = await this.getTodaysUserCCRequesSubmitStatus();
            console.log("No of records ::::: ", userRequestedCcs.length);
            let count = 1;
            for(const userRequestCC of userRequestedCcs) {
                let transBase64 = Buffer.from(userRequestCC.appid).toString("base64");
                const data = JSON.stringify({
                    "deptTransactionID": transBase64
                });
                var config = {
                    method: 'post',
                    url: `${process.env.CFMS_TRANS_API}/getCfmsTransactionDataByAppNumOrDeptTranId`,
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    data : data,
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false
                    })
                };
                console.log("CCSearchService - Executing the IGRS Payment gateway API :::: ", count);
                const response = await axios.request(config);
                console.log("API response :::: ", response.data);
                if(response.data.transStatus=="Success"){
					let date = new Date();
					let dateStr = date.getFullYear() + "-" +
            			("00" + (date.getMonth() + 1)).slice(-2) + "-" +
            			("00" + date.getDate()).slice(-2);
					let updateStatusQuery =`UPDATE SROUSER.PUBLIC_CC_STATUS SET STATUS='RD', DEPT_TRANS_ID = '${response.data.departmentTransID}', PAID_ON = to_date('${dateStr}', 'YYYY-MM-DD') WHERE APP_ID='${userRequestCC.appid}' and SR_CODE=${userRequestCC.srcode}`;
					console.log("::::::updateStatusQuery:::::::", updateStatusQuery)
					let resultData = await this.dbDao.oDbUpdate(updateStatusQuery);
                    console.log("resultData ::: ", resultData);
                }
                count++;
            }
            console.log("CCSearchService - End of updateUserCCPaymentDetailsIfAny ");
			return "Success";
        }catch(error){
            console.log("CCSearchService - updateUserCCPaymentDetailsIfAny || Error :", error.message);
            return "Failed";
        }
    }



	getTodaysUserCCRequesSubmitStatus = async () => {
        console.log("ECSearchDao - Inside of getTodaysUserECRequesSubmitStatus");
        try{
			let ccreqQuery = `select app_id, sr_code from srouser.public_cc_status where 
							TRUNC(requested_on) >= TRUNC(SYSDATE-1) and status='SD' and TRUNC(requested_on) >= TRUNC(time_stamp)`;
            let result = await this.dbDao.fetchDataByQuery(ccreqQuery, {});
            console.log("ECSearchDao - End of getTodaysUserECRequesSubmitStatus ");
            return result;
        }catch(ex){
            console.log("ECSearchDao - getTodaysUserECRequesSubmitStatus || Error : ", ex.message);
            throw ex;
        }
    }

	getOldCCValidateSrvc = async (reqData) => {
		console.log("ecCCServices - Inside of getOldCCValidateSrvc");
		try {
			let result = await axios.post(`${process.env.CARD_API}/cc/oldcertifycopy/validate`, reqData, {
				httpsAgent: httpsAgent,
				headers: {
					'Content-Type': 'application/json',
					"api-key": process.env.CARD_API_KEY
				}
			})
			result = result.data;
			console.log("ecCCServices - End of getOldCCValidateSrvc ");
			if (!result?.status) {
				throw new Error(result?.message);
			}
			return result?.message;
		} catch (ex) {
			console.log("ecCCServices - getOldCCValidateSrvc || Error : ", ex?.response?.data ? ex?.response?.data : ex);
			throw constructPDEError(ex?.response?.data ? ex?.response?.data : ex);
		}
	}
};


module.exports = EcCcService;