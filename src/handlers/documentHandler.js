const { request } = require("express");
const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const DocumentService = require("../services/documentService");
const { constructPDEError } = require("./errorHandler");
const {documentValidation} = require('../utils/validations');
const {encryptWithAESPassPhrase} = require('../utils/index');
const sysConstanst = require("../utils/sysConstanst");
const PaymentReciptDetailsDao = require('../dao/paymentReciptDao')
const axios = require("axios");
const https = require("https");
const UrbanService = require('../services/urbanServices')
const propertiesModel = require('../model/propertyModel')
const ThirdPartyAPIResponseDao = require('../dao/thirdPartyAPIResponseDao');
const {thirdPartyDepartments}=require('../utils/config');
class DocumentHandler {

    constructor(){
        this.documentService = new DocumentService();
		this.paymentReceiptDao= new PaymentReciptDetailsDao();
        this.urbanService = new UrbanService();     
        this.thirdPartyAPIResponseDao = new ThirdPartyAPIResponseDao()   
    }
    validateNonJudicialStampPaper = async (req, res) => {
        console.log("validate Non Judicial Stamp - validate || Request is ", req.query);
        const requiredParams = {
            mainSerialNumber: req.query.mainSerialNumber,
            serialNumber: req.query.serialNumber,
            value:req.query.value
        }
        for (let key in requiredParams) {
            if (!requiredParams[key]) {
                return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json(
                    {
                        status: false,
                        message: `${NAMES.VALIDATION_ERROR}.${key} is Mandatory`
                    }
                );
            }
        }
        try {
            const stampDetails = await this.documentService.nonJudicialStampsValidationService(requiredParams)
            if (stampDetails.length > 0) {
                const isStampUtilized = await this.documentService.isNonJudicialStampUtilized(requiredParams,true);
                if(isStampUtilized?.alreadyUsedDocs?.length>0){
                    return res.status(200).json({
                        status:false,
                        message:"Stamp Paper already Utilized."
                    })
                };
                return res.status(200).json({
                    status: true,
                    message: "Document fetched Successfully.",
                    code: "200",
                    data: stampDetails,
                    res : isStampUtilized
                });
            }else{
                return res.status(404).json({
                    status: false,
                    message: "Stamp details are not found",
                });
            }

        } catch (error) {
            console.error("validate Non Judicial Stamp - validate || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).json(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }
    }

    validateUtilizedStamps=async(req,res)=>{
        console.log("validate utilized Stamp - validate || Request is ", req.body);
        try {
            const isStampUtilized = await this.documentService.isNonJudicialStampUtilized(req.body.noOfStampPapers, false);
            if (isStampUtilized?.alreadyUsedDocs?.length > 0) {
                return res.status(200).json({
                    status: false,
                    message: "Stamp Paper already Utilized.",
                    data: isStampUtilized
                })
            }
            return res.status(200).json({
                status: true,
                message: "Document fetched Successfully.",
                code: "200",
                data: isStampUtilized

            })
        } catch (error) {
            console.error("validate Non Judicial Stamp - validate || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).json(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }
    }

    createDocument = async (req, res) => {
		req.body.userId = req.user.userId;
        console.log("DocumentHandler - createDocument || Request is ", req.body);
        if(req == null || req.body == null || req.body.registrationType == null || req.body.sroOffice == null || req.body.sroCode == null || req.body.userId == null
            || req.body.executionDate == null || req.body.stampPurchaseDate == null || req.body.amount == null || req.body.stampPaperValue == null){
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
		let validations = await documentValidation(req.body);
		if(validations && validations.status === false){
			let codes = validations.code ? NAMES.UNAUTHORIZED : NAMES.VALIDATION_ERROR;
			res.status(NAMES_STATUS_MAPPINGS[codes]).send(
                {
                    status: false,
                    message: validations.err
                }
            );
            return;
		}
        try {
            await this.documentService.frankIdExist(req.body); 
            let response = await this.documentService.createDocument(req.body);
            res.status(200).send(
                {
                    status:true, 
                    message: "Application Created Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("DocumentHandler - createDocument || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            )
        }
    }

    updateDocument = async (req, res) => {
        console.log("DocumentHandler - updateDocument || Request is ", req.body);
        if(req == null || req.body == null || req.body.applicationId == null  ){
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        try {
            let response = await this.documentService.updateDocument(req.body,req.user || {});
			let hash = encryptWithAESPassPhrase(JSON.stringify(response), sysConstanst.HASHING_PASSPHRASE);
            response.hash =hash;
			if(response != null){
				res.status(200).send(
					{
						status:true, 
						message: "Application Updated Successfully",
						code: "200",
					}
				);
			}
        } catch (error) {
            console.error("DocumentHandler - updateDocument || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }
    }

    deleteDocument = async (req, res) => {
        console.log("DocumentHandler - deleteDocument || Request is ", req.body);
        if(req == null || req.body == null || req.params.documentId == null){
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        try {
            let response = await this.documentService.deleteDocument(req.params.documentId);
            res.status(200).send(
                {
                    status:true, 
                    message: "Application Deleted Successfully",
                    code: "200",
                    data: {
                        status: response
                    }
                }
            );
        } catch (error) {
            console.error("DocumentHandler - deleteDocument || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            )
        }
    }

    getDocumentDetailsByUserId = async (req, res) => {
		
		let reqData={}
		if(req?.query && req.query.status != undefined){
			reqData.status = {
                $in: req.query.status.split(',')          
            };
            // reqData.status = req.query.status;
		}
        console.log("DocumentHandler - getDocumentDetailsByUserId || Request is ",);
        if( req?.user?.userId == null){
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        try {
			reqData.userId = req.user.userId.toString();
            let response = req.query.simple ? await this.documentService.getSimpleListOfDocs(reqData) : await this.documentService.getDocumentDetails(reqData);
            return res.status(200).send(
                {
                    status:true, 
                    message: "Application Fetched Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("DocumentHandler - getDocumentDetailsByUserId || Error :", error);
            var pdeError = constructPDEError(error);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                     message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }
    }

    getDocumentDetailsByUserIdAndDocumentId = async (req, res) => {
        console.log("DocumentHandler - getDocumentDetailsByUserIdAndDocumentId || Request is ", req.params);
        if(req == null || req.params == null || req.user.userId == null || req.params.documentId == null){
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        try {
			let query;
			if(req.user.loginType ==="officer"){
				query = {documentId: req.params.documentId}
			}else{
				query = {userId:req.user.userId,documentId: req.params.documentId};
			}
            let response = await this.documentService.getDocumentDetails(query);
            return res.status(200).send(
                {
                    status:true, 
                    message: "Application Fetched Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("DocumentHandler - getDocumentDetailsByUserIdAndDocumentId || Error :", error.message);
            var pdeError = constructPDEError(error);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }
    }

    getSignedDocumentByDocumentId = async (req, res) => {
        console.log("DocumentHandler - getSignedDocumentByDocumentId || Request is ", req.params);
        if(req == null || req.params == null || req.params.documentId == null){
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        try {
            let response = await this.documentService.getSignedDocument(req.params.documentId);
            res.status(200).send(
                {
                    status:true, 
                    message: "Application Fetched Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("DocumentHandler - getSignedDocumentByDocumentId || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }
    }


	fileUploadStore = async(req,res)=>{
		const reqParams = req.params;
		if(reqParams.fileName == null || reqParams.documentId == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
		}
		try{
			const reqFiles = req.files;
			let response = await this.documentService.uploadFile(reqParams,reqFiles);
			if(response != null){
				res.status(200).send(
					{
						status:true, 
						message: "File Upload Successfully",
						code: "200",
					}
				);
			}
		}catch(ex){
			console.error("DocumentHandler - getImagesbyId || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}
	}
	getAllFlagsById = async (req,res)=>{
		const reqParams = req.params;
		if( reqParams.documentId == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
		}
		try{
			let response = await this.documentService.getDocDetails(reqParams);
			if(response != null){
				res.status(200).send(
					{
						status:true, 
						message: "data Fetched Successfully",
						code: "200",
						data:response
					}
				);
			}
		}catch(ex){
			console.error("DocumentHandler - getAllFlagsById || Error :", ex);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR,
					Err:pdeError
                }
            )
		}
	}
	getImagesbyId = async (req,res)=>{
		const reqParams = req.params;
		if( reqParams.documentId == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
		}
		try{
			let response = await this.documentService.getImages(reqParams);
			if(response != null){
				res.status(200).send(
					{
						status:true, 
						message: "Images Fetched Successfully",
						code: "200",
						data:response
					}
				);
			}
		}catch(ex){
			console.error("DocumentHandler - getImagesbyId || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}
	}
	delImageById = async (req,res)=>{
		const reqParams = req.params;
		if( reqParams.documentId == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
		}
		try{
			let response = await this.documentService.delImgesById(reqParams);
			if(response != null){
				res.status(200).send(
					{
						status:true, 
						message: "Image Deleted Successfully",
						code: "200"
					}
				);
			}
		}catch(ex){
			console.error("DocumentHandler - delImageById || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}
	}
    syncservice = async (req, res) => {
        try {
            let result = await axios.post(`${process.env.SYNC_SERVICE}/${req.params.id}`);
            if(result?.data?.status === 'Success'){                
                return res.status(200).send(result.data);
            } else {
                let properties = await propertiesModel.find({ applicationId: req.params.id });            
                for (let property of properties) {
                    let cdmaDetails = property?.cdma_details;
                    if (typeof cdmaDetails === "string" && cdmaDetails.trim().startsWith("{") && cdmaDetails.trim() !== "{}") {
                        try {
                            cdmaDetails = JSON.parse(cdmaDetails);
                        } catch (e) {
                            console.error("Failed to parse cdma_details JSON string for property:", property._id);
                            continue;
                        }
                    }    
                    const assessmentNumber = cdmaDetails?.propertyID;                    
                    const cdmaApplicationNumber = cdmaDetails?.applicationNumber;                    
                    if (cdmaApplicationNumber && assessmentNumber && assessmentNumber !== 0) {
                        const ulbCodeFromAssessment = assessmentNumber.substring(0, 4);
                        const urbanReqData = {
                            ulbCode: ulbCodeFromAssessment,
                            assessmentNumber,
                            applicationNumber: cdmaApplicationNumber
                        };                        
                        try {
                            const urbanDeleteResponse = await this.urbanService.deletePropertySrvc(urbanReqData);
                            if (urbanDeleteResponse) {
                			    delete cdmaDetails.applicationNumber;							
                			    property.cdma_details = JSON.stringify(cdmaDetails);
                                await property.save();
	            		    }
                        } catch (urbanError) {
                            console.error("Error deleting urban property for property",urbanError.message);
                        }
                    }
                }
                return res.status(400).send({
                    status:false,
                    message: "Sync Service failed"
                })
            }
        } catch (ex) {
            console.error("DocumentHandler - syncservice || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }
    }
	getChalanDetails = async (req,res)=>{
		try {
			let paymentDetails = await this.paymentReceiptDao.getByFindOne({applicationNumber:req.params.documentId});
			let trans_Base64,cfmsresults,chalanDetails=[];
			if(paymentDetails != null){
				trans_Base64 = Buffer.from(paymentDetails.departmentTransID).toString("base64");
				const data = JSON.stringify({
					"deptTransactionID": trans_Base64
				});
				var config = {
					method: 'post',
					url: `${process.env.CFMS_TRANS_API}/getCfmsTransactionByDepartmentID`,
					headers: { 
					  'Content-Type': 'application/json'
					},
					data : data
				};
				cfmsresults = await axios.request(config)
			}
			let chalans = cfmsresults.data.data;
			// if(chalans && chalans.length >0){
			// 	for(let i of chalans){
			// 		const chalanEncode = Buffer.from(i.challanNumber).toString("base64");
			// 		const chalanData = JSON.stringify({
			// 			"challanNumber": chalanEncode
			// 		});
			// 		  var config = {
			// 			method: 'post',
			// 			url: `${process.env.CFMS_TRANS_API}/getChallanDetailsByChallanNumber`,
			// 			headers: { 
			// 			  'Content-Type': 'application/json'
			// 			},
			// 			data : chalanData
			// 		};
			// 		let results =await  axios.request(config);
			// 		if(results && results.data && results.data.data){
			// 			chalanDetails =[...chalanDetails,results.data.data];
			// 		}
			// 	}
			// }
			if(chalans){
				return res.status(200).send({status: true,data: chalans});
			}else{
				return res.status(400).send({status: false,message: "Something went Wrong"});
			}
        } catch (ex) {
            console.error("DocumentHandler - getChalanDetails || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }
	}

    getDocsForEsign = async(req, res) => {
        try {
            let response = await this.documentService.getDocsForEsign(req.user.userId);
			if(response != null){
				res.status(200).send(
					{
						status:true, 
						response
					}
				);
			}
        } catch (ex) {
            console.error("DocumentHandler - getDocsForEsign || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }
    }
    updateTdHandler = async (req,res)=>{
		const docsData = req.body;
		console.log(":::::::::::::::::::::propertyData:::::::::::::::::::;",docsData)
		try{
			
			let response = await this.documentService.updateTdValue(docsData);
			if(response){
				return res.status(200).send(
					{
						status:true, 
						message: "Td Updated Successfully",
						code: "200",
						data: response
					}
				);
			}
		}catch(ex){
			console.error("PropertyHandler - updateTdHandler || Error :", ex);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
    updateStatusHstr =  async (req,res)=>{
		const {documentid,sd} = req.params;
		try{
			
			let response = await this.documentService.statusUpdate(documentid,sd);
				return res.status(200).send(
					{
						status:true, 
						message: "Updated Successfully",
						code: "200",
					}
				);
			
		}catch(ex){
			console.error("DocuemntHandler - updateTdHandler || Error :", ex);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
    
	documentPreviewhndlr = async(req,res)=>{
		const reqParams = req.params;        
		if(reqParams.fileName == null || reqParams.documentId == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
		}
		try{
			let response = await this.documentService.documentPreviewSRVC(reqParams);
            res.setHeader('Content-Type', 'application/pdf');
            res.status(200).send(response);
          } catch (ex) {
            console.error("Error in pdfpreview:", ex);
            const pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send({
              status: false,
              message: pdeError.message,
            });
          }
    }     
    updateQrSlot  = async (req,res)=>{
		const reqBody = req.body;
        reqBody.type = req.params
		try{
			
			let response = await this.documentService.QrDocmentUpdate(reqBody);
				return res.status(200).send(
					{
						status:true, 
						message: "Updated Successfully",
						code: "200",
					}
				);
			
		}catch(ex){
			console.error("DocuemntHandler - updateQrSlot || Error :", ex);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
    getDocsforSlot =  async (req,res)=>{
		const reqBody = req.body;
		try{
			reqBody.status ="SYNCED"
			let response = await this.documentService.getDocs(reqBody);
            if(response){
                return res.status(200).send(
					{
						status:true, 
						code: "200",
					}
				);
            }else{
                return res.status(400).send(
					{
						status:false, 
                        message:"Application doesn't Exist",
						code: "400",
					}
				);
            }
				
			
		}catch(ex){
			console.error("DocuemntHandler - updateQrSlot || Error :", ex);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
    getAnywhereDocStatus = async (req, res) => {
        const reqBody = req.params;
        try {      
            let response = await this.documentService.getAnywhereDocStatusSrvc(reqBody);
            let responseData = {
                status: true,
                message: "Success",
                code: "200",
                data: response
            };
            res.status(200).send({ ...responseData });
        }catch(ex){
			console.error("DocuemntHandler - updateQrSlot || Error :", ex);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
    }

    fetchFrankId = async (req, res) => {
		const reqBody = req.body;
        let paramsToStoreThirdPartyData={}
		try {
            const username = process.env.FRANKLIN_USERNAME;
            const password = process.env.FRANKLIN_PASSWORD;
            const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;                    
			const headers = {              
				'Authorization': `${authHeader}`, 
				'Content-Type': 'application/json'
			};
			const url = `${process.env.FRANKLIN_URL}/pbsecuredatasyncservice/admin/verifyTransactionDetails`;
			const data = JSON.stringify({
				methodName: "Transaction",
				serialno: reqBody.serialno
			});
            paramsToStoreThirdPartyData={
                request: {
                    method: "POST",
                    url: url,
                    headers: headers,
                    parameters: JSON.parse(data)
                },
            }
            let result = await axios(
                {
                    method: "POST",
                    data: data,
                    url: url,
                    headers: headers,
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false
                    }),
                    timeout: 0
                });
            paramsToStoreThirdPartyData.response=result.data;
            paramsToStoreThirdPartyData.status='success';
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: result.data.responseBody
			};	
			res.status(200).send({ ...responseData });
		}  catch (ex) {
            paramsToStoreThirdPartyData.status='failed';
            paramsToStoreThirdPartyData.response=ex.response.data;
            console.error("DocuemntHandler - fetchFrankId || Error:", ex);       
            if (ex.response && ex.response.data) {
                const { status, responseMsg } = ex.response.data;
                return res.status(status || 500).send({
                    status: false,
                    message: responseMsg || "Invalid Transaction ID",
                    code: status || "500"
                });
            }                                
        }finally{
            await this.thirdPartyAPIResponseDao.create({
                request: paramsToStoreThirdPartyData.request,
                response: paramsToStoreThirdPartyData.response,
                userID: req?.user?.userId,
                module:"PDE",
                source: thirdPartyDepartments.franking,
                status: paramsToStoreThirdPartyData.status
            })
        }
    }

    documentScheduler = async () => {
        try {
            let result = await this.documentService.documentSchedulerSrvc();
            return result;
        } catch (error) {
            console.log("DocuemntHandler - documentScheduler || Error :", error);
            throw error;
        }
    }

    verifyNRIPanDetails =async(req,res)=>{
        const instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });
        const reqBody = req.body;
        let paramsToStoreThirdPartyData={}
		try {
            const config = {
                method: 'POST',
                url: `${process.env.PAN_URL}/igrs-pan-ms/validatePANDetails`,
                data: req.query,
                headers: {
                    'Content-Type': 'application/json'
                },
            }
            paramsToStoreThirdPartyData.request={...config,parameters:req.body};
            delete paramsToStoreThirdPartyData.data
            let result = await instance.request(config);
            paramsToStoreThirdPartyData.response=result.data;
            paramsToStoreThirdPartyData.status=result.data.statusCode==200?'success':'failed';
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: result.data
			};
			res.status(200).send({ ...result.data });
		}  catch (ex) {
            paramsToStoreThirdPartyData.status='failed';
            paramsToStoreThirdPartyData.response=ex.message??ex;
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send({
                status: false,
                message: NAMES.INTERNAL_SERVER_ERROR
            });                
        }finally{
            await this.thirdPartyAPIResponseDao.create({
                request: paramsToStoreThirdPartyData.request,
                response: paramsToStoreThirdPartyData.response,
                userID: req?.user?.userId,
                module:"PDE",
                source: thirdPartyDepartments.pan,
                status: paramsToStoreThirdPartyData.status
            })
        }
    }

    verifyPassportDetails =async(req,res) =>{
        const instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });
        const reqBody = req.query;
        let paramsToStoreThirdPartyData={}
		try {
            const config = {
                method: 'POST',
                url: `${process.env.PASSPORT_URL}/igrs-passport-ms/validatePassportDetails`,
                data: req.query,
                headers: {
                    'Content-Type': 'application/json'
                },
            }
            paramsToStoreThirdPartyData.request={...config,parameters:req.query};
            delete paramsToStoreThirdPartyData.data
            let result = await instance.request(config);
            paramsToStoreThirdPartyData.response=result.data;
            paramsToStoreThirdPartyData.status=result.data.statusCode==200?'success':'failed';
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: result.data
			};	
			res.status(200).send({ ...result.data });
		}  catch (ex) {
            paramsToStoreThirdPartyData.status='failed';
            paramsToStoreThirdPartyData.response=ex.message??ex;
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send({
                status: false,
                message: NAMES.INTERNAL_SERVER_ERROR
            });                
        }finally{
            await this.thirdPartyAPIResponseDao.create({
                request: paramsToStoreThirdPartyData.request,
                response: paramsToStoreThirdPartyData.response,
                userID: req?.user?.userId,
                module:"PDE",
                source: thirdPartyDepartments.passport,
                status: paramsToStoreThirdPartyData.status
            })
        }
    }

    validateStamps=async(req,res)=>{
        console.log("validate utilized Stamp - validate || Request is ", req.body);
        try {
            const isStampUtilized = await this.documentService.validStamps(req.query)
            if (isStampUtilized.length > 0) {
                return res.status(200).json({
                    status: false,
                    message: "Stamp Paper already Utilized.",
                    data: isStampUtilized
                })
            }
            return res.status(200).json({
                status: true,
                message: "Document fetched Successfully.",
                code: "200",
                data: isStampUtilized

            })
        } catch (error) {
            console.error("validate Non Judicial Stamp - validate || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).json(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }
    }

    verifyStockHoldingId = async (req, res) => {
		const reqBody = req.body;
		try {
            let query = {stockHoldingId: reqBody.stockid, typeOfStamps: "StockHolding", status: "SYNCED"}
            let docres = await this.documentService.getDocs(query);
            if (docres) {
                return res.status(400).json({
                    status: false,
                    message: "StockHolding id is already used.",
                })
            } else {
                if (reqBody?.localValidator) {
                    return res.status(200).json({
                        status: true,
                        message: "StockHolding id is not used yet.",
                    })
                }
                let urlValue = `${process.env.CARD_API}/stock/getStockHoldingReceipt/stock`;
                let data =`?certificateId=${reqBody.stockid}&certIssueDate=${reqBody.date}`;
                var config = {
                    method: 'get',
                    url: urlValue + data,
                    httpsAgent: new https.Agent({  
                        rejectUnauthorized: false
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                        "api-key":process.env.CARD_API_KEY
                    }
                };
                const response = await axios.request(config);
                if(response.data && response.data.status == true){
                    let stampDeficitRespData = response.data.data;
                    if(stampDeficitRespData.CertificatesDetails!=undefined && stampDeficitRespData.CertificatesDetails){
                        return res.status(200).json({
                            status: response.data.status,
                            message: "Valid Stockholding Id",
                            code: "200",
                            data: stampDeficitRespData
                        })
                    } else {
                        return res.status(400).json({
                            status: false,
                            message: "Invalid Stockholding Id (or) Invalid Date of Stamp Purchase",
                        })
                    }
                }
            }
        } catch (ex) {
            if(ex.response && ex.response.data?.status==false){
                res.status(400).send({ status: false, message: "Invalid Stockholding Id (or) Invalid Date of Stamp Purchase" });
            }
            else{
                return {
                    status: false,
                    message: ex?.message || "Invalid Stockholding Id (or) Invalid Date of Stamp Purchase"
                }
            }
        }
	}

    urbanPropertyScheduler = async () => {
        try {
            let response = await this.documentService.urbanPropertySchedulerSrvc();
            return response;
        } catch (error) {
            console.log("DocuemntHandler - urbanPropertyScheduler || Error :", error);
            throw error;
        }
    }

     GOupdateDocument = async (req, res) => {
        if(req == null || req.body == null || req.body.applicationId == null  ){
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        try {
            let response = await this.documentService.GoupdateDocument(req.body,req.user || {});
			let hash = encryptWithAESPassPhrase(JSON.stringify(response), sysConstanst.HASHING_PASSPHRASE);
            response.hash =hash;
			if(response != null){
				res.status(200).send(
					{
						status:true, 
						message: "Application Updated Successfully",
						code: "200",
					}
				);
			}
        } catch (error) {
            console.error("DocumentHandler - updateDocument || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }
    }
    getGOupdateDocument = async (req, res) => {
    if (!req.params.applicationId) {
        return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send({
            status: false,
            message: NAMES.VALIDATION_ERROR
        });
    }
    try {
        let response = await this.documentService.getGODocument(req.params.applicationId);
        let hash = encryptWithAESPassPhrase(
            JSON.stringify(response),
            sysConstanst.HASHING_PASSPHRASE
        );

        if (response) {
            return res.status(200).send({
                status: true,
                data: response,
                hash: hash,
                message: "GO Exemptions Data Fetched Successfully"
            });
        }

    } catch (error) {
        var pdeError = constructPDEError(error);
        res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send({
            status: false,
            message: NAMES.INTERNAL_SERVER_ERROR
        });
    }
};

}

module.exports = DocumentHandler;