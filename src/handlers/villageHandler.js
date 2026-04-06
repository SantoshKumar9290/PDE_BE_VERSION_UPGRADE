const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const axios=require('axios');
const VillageService = require("../services/villageService");
const { constructPDEError } = require("./errorHandler");
const {encryptWithAESPassPhrase, decryptWithAES, DecryptAdrwithPkcs,decryptData} = require('../utils/index');
const sysConstanst = require("../utils/sysConstanst");

class VillageHandler {

    constructor(){
        this.villageService = new VillageService();
    }

    getDistricts = async (req, res) => {
        console.log("VillageHandler - getDistricts || In Get Districts");
        try {
            let response = await this.villageService.getDistricts();
            res.status(200).send(
                {
                    status:true, 
                    message: "Disticts Fetched Successfully",
                    code: "200",
                    data: response
                }
            );
            return;
        } catch (error) {
            var pdeError = constructPDEError(error);
            console.error("VillageHandler - getDistricts || Error :", pdeError.message);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }

    getMandals = async (req, res) => {
        console.log("VillageHandler - getMandals || Request is ", req.params);
        try {
            if(req == null || req.params == null || req.params.districtId == null){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
            let response = await this.villageService.getMandals(req.params.districtId);
            res.status(200).send(
                {
                    status:true, 
                    message: "Mandals Fetched Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("VillageHandler - getMandals || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }
	getlinkSroDetails = async (req,res)=>{
		console.log("VillageHandler - getSroDetails || Request is ", req.params);
		try {
            if(req == null || req.params == null || req.params.districtId == null){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
            let response = await this.villageService.getLinkSrDetails(req.params.districtId);
            res.status(200).send(
                {
                    status:true, 
                    message: "SRO Details Fetched Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("VillageHandler - getSroDetails || Error :", error);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError
                }
            );
        }
	}
	getSroDetails = async (req, res) => {
        console.log("VillageHandler - getSroDetails || Request is ", req.params);
        try {
            if(req == null || req.params == null || req.params.villageCode == null){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
            let response = await this.villageService.getSroDetails(req.params.villageCode);
            res.status(200).send(
                {
                    status:true, 
                    message: "SRO Details Fetched Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("VillageHandler - getSroDetails || Error :", error);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError
                }
            );
        }
    }

    getVillages = async (req, res) => {
        console.log("VillageHandler - getVillages || Request query is ", req.query);
        try {
            if(req == null || req.query == null){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
            let response = await this.villageService.getVillages(req.query.districtId, req.query.mandalId,req.query.sroCode);
            res.status(200).send(
                {
                    status:true, 
                    message: "Villages Fetched Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("VillageHandler - getVillages || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }

    getCurrentPahaniDetailsSRO = async (req, res) => {
        const reqQuery = req.query;
		if(reqQuery.sryno && reqQuery.sryno.includes("/")){
			// reqQuery.sryno = String(reqQuery.sryno).replace(/\//g, "-");
		}
        try {
            if(req == null || req.query == null || !reqQuery.vgcode ){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
            reqQuery.user=req.user;
            let response = await this.villageService.getCurrentPahaniDetailsSRO(reqQuery);

            if(response.length > 0){
                return res.status(200).send(
                    {
                        status:true, 
                        message: "Village Pahani's List Fetched Successfully",
                        code: "200",
                        data: response,
                    }
                );
            }else{
                return res.status(404).send(
                    {
                        status:false, 
                        message: "No Details found",
                    }
                );
            }
        } catch (error) {
            console.error("VillageHandler - getCurrentPahaniDetailsSRO || Error :", error);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            );
        }
    };
	villagesbyODb = async (req,res)=>{
		const reqParams = req.params;
		try{
			if(reqParams?.sroCode == null){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
			let response = await this.villageService.getVillagesFromODB(reqParams.sroCode)
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("VillageHandler - villagesbyODb || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
	habitationsByVillageCode = async (req,res)=>{
		const reqParams = req.params;
		if(reqParams?.villageCode == null || reqParams?.type == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
		try{

			let response = await this.villageService.getHabitationsFromODB(reqParams)
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("VillageHandler - habitationsByVillageCode || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	};
	partyAndPropertyDetails = async (req,res)=>{
		const reqQueryParams = req.query;
		if(reqQueryParams.sroCode == null || reqQueryParams.documentId == null || reqQueryParams.regYear == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
		try{
			let response = await this.villageService.getPartyAndPropertyFromODB(reqQueryParams);
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("VillageHandler - partyAndPropertyDetails || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}

	getMarketHandler = async (req,res)=>{
		const reqParams = req.params;
		if(reqParams.villageCode == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
		try{
			let response = await this.villageService.getMarketValueService(reqParams);
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );

		}catch(ex){
			console.error("VillageHandler - getMarketHandler || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	};
	getDoorDetailsHandlerByUrban = async (req,res)=>{
		const reqQueryParams = req.query;
		if(reqQueryParams?.wardNo == null || reqQueryParams?.blockNo ==null || reqQueryParams?.habitation == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
		try{
			let response = await this.villageService.getDrDetailsService(reqQueryParams);
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );

		}catch(ex){
			console.error("VillageHandler - getDoorDetailsHandler || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
	getDetailsByClassic = async (req,res)=>{
		const reqQueryParams = req.query;
		if(reqQueryParams?.villageCode == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
		try{
			let response = await this.villageService.getDetailsServiceByClassic(reqQueryParams);
			return res.status(200).send(
				{
					status:true, 
					code: "200",
					data: response
				}
			);

		}catch(ex){
			console.error("VillageHandler - getDoorDetailsHandler || Error :", ex.message);
			var pdeError = constructPDEError(ex);
			res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
				{
					status: false,
					message: NAMES.INTERNAL_SERVER_ERROR
				}
			);
		}
	};
	getProhibitedDetails = async (req,res)=>{
		const reqBody = req.body;
		const reqParams = req.params;
		if(reqBody?.sroCode == null || reqBody?.villageCode ==null || reqBody?.proField == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
		try{
			let response = await this.villageService.getProhibitedDetailsService(reqBody,reqParams);
			// let hash = encryptWithAESPassPhrase(JSON.stringify(response[0]), sysConstanst.HASHING_PASSPHRASE);
            // response[0].hash = hash;
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );

		}catch(ex){
			console.error("VillageHandler - getDoorDetailsHandler || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	};

	dutyCalculaterHandler = async (req,res)=>{
		const reqBody = req.body;
        if(!reqBody.reqFrom){        
		if(reqBody?.tmaj_code == null || reqBody?.tmin_code ==null || reqBody?.local_body == null || reqBody.flat_nonflat == null || reqBody.finalTaxbleValue  == null|| reqBody.adv_amount  == null ){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}}
		try{
			let response = await this.villageService.dutyService(reqBody);
			let hash = encryptWithAESPassPhrase(JSON.stringify(response), "123456");
            response.hash = hash;
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("VillageHandler - dutyCalculaterHandler || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
    vacantLandHandler =async (req,res)=>{
		const reqBody = req.body;
		if(reqBody?.vgCode == null || reqBody?.surveyNo ==null  ){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
		try{
			let response = await this.villageService.vacantLandService(reqBody);
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("VillageHandler - dutyCalculaterHandler || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}

	getLocalBodyHandler = async (req,res)=>{
		const reqParams = req.params;
		if(reqParams == null || reqParams.habCode == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
		try{
			let response = await this.villageService.localBodyService(reqParams);
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("VillageHandler - getLocalBodyHandler || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
	structureDetails = async (req,res)=>{
		const reqBody = req.body;
		if(reqBody?.sroCode == null || reqBody?.linkDoc_No ==null || reqBody?.regYear == null  ){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
		try{
			let response = await this.villageService.structureDetails(reqBody);
			let hash = encryptWithAESPassPhrase(JSON.stringify(response), sysConstanst.HASHING_PASSPHRASE);
            response.push(hash);
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("VillageHandler - dutyCalculaterHandler || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}

	eChallanHandler = async (req,res)=>{
		const reqQuery = req.query;
		if( reqQuery.deptTransId  == null ){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
		try{
			let response = await this.villageService.eChalanService(reqQuery);
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("VillageHandler - eChallanHandler || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}

    getCDMAPropertyAssessmentDetails = async (req, res) => {
        const {ulbCode, assessmentNo, registrationValue, marketValue} = req.body;

        try {
            if(req == null || req.body == null || !ulbCode || !assessmentNo){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
            let response = await this.villageService.getCDMAPropertyAssessmentDetails(ulbCode, assessmentNo, registrationValue, marketValue);
            res.status(200).send(
                {
                    status:true, 
                    message: "CDMA Property Assessment Details Fetched Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("VillageHandler - getCurrentPahaniDetailsSRO || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    };
    


    getSingleCertificateDetails = async (req, res) => {
        const {certificateId, certIssueDate} = req.query;
        try {
            if(req == null || req.query == null || !certificateId || !certIssueDate){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
            let response = await this.villageService.getSingleCertificateDetails(certificateId, certIssueDate);
            res.status(200).send(
                {
                    status:true, 
                    message: "Single Certificate Details Fetched Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("Single Certificate Details - getSingleCertificateDetails || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    };

    sendSMS = async (req, res) => {
        const {number} = req.body;
        try {
            if(req == null || req.body == null || !number){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
            else if(number.toString().length != 10 ){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: "Invalid Number"
                    }
                );
                return;
            }
            let response = await this.villageService.sendSMS(number);
            res.status(200).send(
                {
                    status:true, 
                    message: "SMS Sent Successfully",
                    code: "200",
                    data: {}
                }
            );
        } catch (error) {
            console.error("SMS Error Details - sendSMS || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    };

	mvCalculator = async (req,res) =>{
		try{
			let reqParams = req.params;
            
			let response = await this.villageService.mvCalcService(req.body,reqParams);
            // let hash = encryptWithAESPassPhrase(JSON.stringify(response), sysConstanst.HASHING_PASSPHRASE);
            // response.hash = hash;
				return res.status(200).send(
					{
						status:true, 
						message: "Successfully retrived market value data",
						code: "200",
						data: response
					}
				);
		}catch(ex){
			console.error("VillageHandler - mvCalculator || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}

	lpmCheck = async(req,res)=>{
		const reqParams = req.params;
		if(reqParams.villageCode == null ){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
		try{
			let response = await this.villageService.lpmCheckSrvc(reqParams);
			return res.status(200).send(
				{
					status:true, 
					message: "Successfully retrived lpm data",
					code: "200",
					data: response
				}
			);
		}catch(ex){
			console.error("VillageHandler - lpmCheck || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
	getWLVgCode = async(req,res)=>{
		const reqParams = req.params;
		if(reqParams.vgCodes == null ){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
		try{
			let response = await this.villageService.getVgSrvce(reqParams);
			return res.status(200).send(
				{
					status:true, 
					message: "Successfully retrived lpm data",
					code: "200",
					data: response
				}
			);
		}catch(ex){
			console.error("VillageHandler - lpmCheck || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
	mvHandler = async(req,res)=>{
		const reqBody = req.body;
		const reqUser = req.user;
		if(reqBody.vgCode == null || reqBody.surveyNum == null ){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
		if(reqUser.loginName !== reqBody.uName){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: `Please Check User Credentails`
				}
			);
			return;
		}
		try{
			let response = await this.villageService.mvCalcOtherService(reqBody);
			return res.status(200).send(
				{
					status:true, 
					message: "Successfully retrived Market Value",
					code: "200",
					data: response
				}
			);


		}catch(ex){
			console.error("VillageHandler - mvHandler || Error :", ex);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
    mvClassHandler = async(req,res)=>{
		const reqBody = req.body;
		const reqUser = req.user;
        const requiredFields = [
            "vgCode",
            "surveyNum",
            "clasification",
            "uName",
            "uPwd"
        ];
        for (let field of requiredFields) {
		if(reqBody[field] === undefined || reqBody[field] === null || reqBody[field].trim() === '' || (/^0+$/.test(reqBody[field]))) {
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: `Invalid ${field} value`
				}
			);
			return;
		}
        }        
        const surveyRegex = /^[A-Za-z0-9\/\-]+$/;
        if (!surveyRegex.test(reqBody.surveyNum)) {
            return res
                .status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR])
                .send({
                    status: false,
                    message: "Invalid Survey number format"
                });
        }
        const classificationRegex = /^\d+$/;
        if (!classificationRegex.test(reqBody.clasification) || !classificationRegex.test(reqBody.vgCode)) {
            return res
                .status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR])
                .send({
                    status: false,
                    message: "Village code/Classification must contain digits only"
                });
        }
        if (reqUser.loginName !== reqBody.uName || decryptData(reqUser.loginPassword) !== reqBody.uPwd) {
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: `Please Check User Credentails`
				}
			);
			return;
		}
		try{
			let response = await this.villageService.mvCalcwithClassificationService(reqBody);
			return res.status(200).send(
				{
					status:true, 
					message: "Successfully retrived Market Value",
					code: "200",
					data: response
				}
			);


		}catch(ex){
			console.error("VillageHandler - mvHandler || Error :", ex);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
    wgCodeOfVg = async (req,res)=>{
		const reqBody = req.body;
		// if(reqBody?.tmaj_code == null || reqBody?.tmin_code ==null || reqBody?.local_body == null || reqBody.flat_nonflat == null || reqBody.finalTaxbleValue  == null|| reqBody.adv_amount  == null ){
		// 	res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
		// 		{
		// 			status: false,
		// 			message: NAMES.VALIDATION_ERROR
		// 		}
		// 	);
		// 	return;
		// }
		try{
			let response = await this.villageService.wgCodeOfVgService(reqBody);
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("VillageHandler - mvadatapost || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}

	mvadatapost = async (req,res)=>{
		const reqBody = req.body;
		// if(reqBody?.tmaj_code == null || reqBody?.tmin_code ==null || reqBody?.local_body == null || reqBody.flat_nonflat == null || reqBody.finalTaxbleValue  == null|| reqBody.adv_amount  == null ){
		// 	res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
		// 		{
		// 			status: false,
		// 			message: NAMES.VALIDATION_ERROR
		// 		}
		// 	);
		// 	return;
		// }
		try{
			let response = await this.villageService.mvadatapost(reqBody);
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("VillageHandler - mvadatapost || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
    dutyFeeforLeaseDocs = async (req,res)=>{
		const reqBody = req.body;
		if(reqBody?.tmaj_code == null || reqBody?.tmin_code ==null || reqBody?.tot_rent == null || reqBody.avg_ann_rent == null || reqBody.rentperiod  == null ){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
		try{
			let response = await this.villageService.dutyFeeforLeaseDocs(reqBody);
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("VillageHandler - mvadatapost || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}

    wgCodeOfVg = async (req,res)=>{
		const reqBody = req.body;
		// if(reqBody?.tmaj_code == null || reqBody?.tmin_code ==null || reqBody?.local_body == null || reqBody.flat_nonflat == null || reqBody.finalTaxbleValue  == null|| reqBody.adv_amount  == null ){
		// 	res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
		// 		{
		// 			status: false,
		// 			message: NAMES.VALIDATION_ERROR
		// 		}
		// 	);
		// 	return;
		// }
		try{
			let response = await this.villageService.wgCodeOfVgService(reqBody);
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("VillageHandler - mvadatapost || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}



	ecLinkedList = async (req,res)=>{
		const reqParams = req.query;
		if(reqParams.habCode == null || reqParams.surveyNum == null ){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
		try{
			let response = await this.villageService.ecLinkedData(reqParams);
			return res.status(200).send(
				{
					status:true,
					code: "200",
					data: response
				}
			);
		}catch(ex){
			console.error("VillageHandler - ecLinkedList || Error :", ex);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
    adharvalidate = async (req,res)=>{
        try{
            const reqBody = req.body;
                if(reqBody.aadhar == null && reqBody.aadhaar == null ){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				}
			);
			return;
		}
        if(reqBody.aadhar || reqBody.aadhaar ){
			let adharDecrypt
            if (reqBody.aadhaar && reqBody.aadhaar.length > 12) {
                let decryptedData = Buffer.from(reqBody.aadhaar, 'base64').toString('utf-8');
                decryptedData = decryptData(decryptedData);
                adharDecrypt = decryptedData;
            }
            else if (reqBody.aadhar && reqBody.aadhar.length > 12) {
                let decryptedData = Buffer.from(reqBody.aadhar, 'base64').toString('utf-8');
                decryptedData = decryptData(decryptedData);
                adharDecrypt = decryptedData;
            } else {
                adharDecrypt = reqBody.aadhar ? reqBody.aadhar : reqBody.aadhaar;
            }
            reqBody.aadhaar = adharDecrypt;
	    }
        let response = await this.villageService.adharvalidate(reqBody.aadhaar);
        return res.status(200).send(
            {
                status:true,
                code: "200",
                data: response
            }
        );
 
        }catch(ex){
 
        }
    }
    lpmHandler = async(req,res)=>{
        const reqBody = req.body;
        const reqUser = req.user;
        if(reqBody.vgCode == null || reqBody.lpmNo == null ){
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        if(reqUser.loginName !== reqBody.uName){
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: `Please Check User Credentails`
                }
            );
            return;
        }
        try{
            let response = await this.villageService.lpmService(reqBody);
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
    
    
        }catch(ex){
            console.error("VillageHandler - lpmHandler || Error :", ex);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }
    habitationForPAI = async (req,res)=>{
        const reqBody = req.body;
        if(reqBody.vgCode == null){
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        try{
            let response = await this.villageService.habitationforCCLA(reqBody);
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
        }catch(ex){
            console.error("VillageHandler - habitationForCCla || Error :", ex);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }
    getunitRateByVg= async (req,res)=>{
        const reqBody = req.body;
        if(reqBody.vgCode == null){
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        try{
            let response = await this.villageService.unitRateForCCLA(reqBody);
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
        }catch(ex){
            console.error("VillageHandler - habitationForCCla || Error :", ex);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }
    getCDMADetails = async (req, res) => {
        const { ulbCode, assessmentNo, registrationValue, villageCode, sroCode, marketValue, source="" } = req.body;

        try {
            if(req == null || req.body == null || !ulbCode || !assessmentNo){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
            if(marketValue=='Y'){
                let details=await this.villageService.getDetailsByPanchayathCode(assessmentNo?`${assessmentNo}`.substring(0,6):`${ulbCode}`.substring(1,6),villageCode)
                if(details){          
                let response=await this.getPanchayatDetails(assessmentNo?assessmentNo:ulbCode)
                if(response?.SCODE === '01'){
                response=response.DATA[0]
                if((`${response.extent_of_property_parcel}`).includes(".")){
                    let secondPart=`${response.extent_of_property_parcel}`.split(".")[1].substring(0,2)
                        let firstPart=`${response.extent_of_property_parcel}`.split(".")[0]
                        response.extent_of_property_parcel=firstPart+"."+secondPart;
                    }
                response['propertyAddress']=`${response.door_no},${response.street_colony},${response.village_name},${response.mandal_name},${response.district_name}`,
                response['ownerNames']=[{"ownerName":`${response.applicant_name} ${response.surname}`,"gender":'M',"guardian":response.so_ho,"guardianRelation":''}]
                response['siteExtent']=response.extent_of_property_parcel,
                response['houseNo']=response.door_no,
                response['propertyDetails']={"propertyType":response.
                nature_of_property_desc,"taxDue":'2023'}
                    return res.status(200).send({
                        status: true,
                        message: "CDMA Property Assessment Details Fetched Successfully",
                        data: response
                    })
                } else {                    
                   return res.status(400).send({
                        status: false,
                        message: response.SDESC?response.SDESC ==("NO DATA FOUND!!!")?`No Data Found with this PTIN ${assessmentNo}`:response.SDESC : response.SDESC
                    })
                }
            }
            else{
                return res.status(400).send({
                    status: false,
                    message: `This PTIN ${assessmentNo} does not belongs to the selected village`
                })  
            }
            }
            else{
                if(source && source !== "igrsWebsite"){
                    let checkUlb=await this.villageService.checkUlbJurisdiction(sroCode,ulbCode);
                    if(!checkUlb.length){
                    return res.status(400).send({
                        status: false,
                        message: "PTIN number doesnot belong to selected jurisdiction"
                        })
                    }
                }
                let response = await this.villageService.getCDMAPropertyDetails(ulbCode, assessmentNo, registrationValue, marketValue,req);
                if(typeof response === 'string'){
                    return res.status(400).send({
                        status: false,
                        message: response
                    })
                } else {
                    return res.status(200).send(
                        {
                            status:true,
                            message: "CDMA Property Assessment Details Fetched Successfully",
                            code: "200",
                            data: response
                        }
                    );
                }
            }
        } catch (error) {
            console.error("VillageHandler - getCurrentPahaniDetailsSRO || Error :", error.message);
            var pdeError = constructPDEError(error);
           return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    };

    searchAssessmentNumberByDoorNumber = async (req,res) =>{
        const requiredParams = {
            ulbCode:req.body.ulbCode,
            doorNo:req.body.doorNo
        }
        for(let key in requiredParams){
            if(!requiredParams[key]){
                return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
            }
        }
        const credentials = `${process.env.URBAN_AUTH_USERNAME}:${process.env.URBAN_AUTH_PASSWORD}`;
        const base64Credentials = Buffer.from(credentials).toString('base64');

        const data=JSON.stringify({
            ulbCode:req.body.ulbCode,
            doorNo:req.body.doorNo
        })
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: process.env.URBAN_BASE_URL + '/v1.0/property/search/doorno',
            headers: {
                'Referer': `${process.env.URBAN_SERVER_IP}`,
                'Authorization': `Basic ${base64Credentials}`,
            },
            data: data
        };
        try{
            let response = await axios.request(config);
            console.log(response,"Search by door number api response");
            if(response){
                return res.status(200).send(response.data);
            }else{
                console.log('error block')
                return res.status(404).send(response.data);
            }

        }catch(ex) {
            if (req.flag) {
                return ex.message
            } else {
                return res.status(400).send({
                    status: false,
                    message: ex.message
                })
            }
        }
    }

    checkUlbJurisdiction = async (req, res) => {
        const {sroCode, ulbCode} = req.query;

        try {
            if(!sroCode || !ulbCode){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
            let response = await this.villageService.checkUlbJurisdiction(sroCode, ulbCode);
            if(!response.length){
                return res.status(404).send({
                    status: false,
                    message: "PTIN number doesnot belong to selected jurisdiction"
                })
            } else {
                return res.status(200).send(
                    {
                        status:true, 
                    }
                );
            }
        } catch (error) {
            console.error("VillageHandler -  || Error :", error.message);
            var pdeError = constructPDEError(error);
           return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    };

    getPanchayatDetails = async(req, res) => {
        const assessmentNo = req;
        try {
            if(!assessmentNo){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            } else {
                let data = await this.villageService.getPanchayatDetails(assessmentNo);
                return data;
            }
        } catch (error) {
            console.error("VillageHandler -  || Error :", error.message);
            var pdeError = constructPDEError(error);
           return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message ? pdeError.message : NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }
    sendSMSForApproveReject = async (req, res) => {
        const {number} = req.body;
        try {
            if(req == null || req.body == null || !number){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
            else if(number.length != 10 ){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: "Invalid Number"
                    }
                );
                return;
            }
            let response = await this.villageService.sendSMSForApproveReject(number,"","");
            res.status(200).send(
                {
                    status:true, 
                    message: "SMS Sent Successfully",
                    code: "200",
                    data: {}
                }
            );
        } catch (error) {
            console.error("SMS Error Details - sendSMS || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    };
    Lpmdivison =async(req,res)=>{
        const reqBody = req.body;        
		if(reqBody.villageCode == null || reqBody.lpmNo == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
		}
        try{
            const data = JSON.stringify({
                "UN": process.env.LPM_BASE_UNAME,
                "UP": process.env.LPM_BASE_PASSWORD
            });
            let url= process.env.LPM_WEB_LAND
            var config = {
                method: 'post',
                url: `${url}/Token`,
                headers: { 
                  'Content-Type': 'application/json'
                },
                data : data
              };
            
            let tokenData = await axios(config);
            if(tokenData?.data?.Data){
            let rData ={
                    "VillageCode": reqBody.villageCode,
                    "LPM_no": reqBody.lpmNo
                }
                const headers = {
                    'Authorization': `Bearer ${tokenData?.data?.Data}`
                };
            let dataResponse = await axios.post(`${url}/RegistrationService/SubdivLpmsList`,rData,{ headers });
                let SubdivLpms = dataResponse.data.Data
                // console.log('SubdivLpmsSubdivLpms:::::::::::::::::',SubdivLpms);
                // console.log('dataResponsedataResponse::::::::::',dataResponse);
            if(SubdivLpms==undefined){
                    let errorData = dataResponse.data;
                let errorMessage=errorData?.Message;
                    res.status(200).send(
                        {
                        status:false, 
                        message: errorMessage?errorMessage:"Base LPM CCLA API data fetch failed",
                            data: []
                        });
                    return;
                }
            if(SubdivLpms && SubdivLpms.length === 1 && SubdivLpms[0].Code ==="101"){
                    res.status(200).send(
                        {
                        status:false, 
                            message: "Data Failed",
                            data: []
                        }
                    );
                    return;
            }else{
                    res.status(200).send(
                        {
                        status:true,
                            message: "Data fetched Successfully",
                            code: "200",
                            data: SubdivLpms
                        }
                    );
                    return;
                }
            }
        else{
            res.status(200).send(
                {
                    status:false, 
                    message: "CCLA API Token Generation failed. Please try after sometime"
                }
            );
        }

        }catch(ex){
            console.error("SMS Error Details - sendSMS || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }

      surveyNoList = async (req, res) => {
        try {

            const { searchValue, villageCode } = req.query;
            if (!villageCode || !searchValue ){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
            let response = await this.villageService.getVillageSurveynos(villageCode,searchValue);
            res.status(200).send(
                {
                    status: true,
                    message: "survyenolist Fetched Successfully",
                    code: "200",
                    data: response
                }
            );
        }
        catch (error) {
            console.error("VillageHandler - getsurveynos || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    } 

    getReraProjectDetails = async(req, res) => {
        const { ProjectID } = req.query;
        try {
            if(!ProjectID){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            } else {
                let response = await this.villageService.getReraProjectDetails(ProjectID,req);
                if(response.StatusCode == '0' || response?.Result?.length == 0){
                    return res.status(400).send(
                        {
                            status: false,
                            message: response.Message,
                            code: "400"
                        }
                    );
                }
                return res.status(200).send(
                    {
                        status: true,
                        message: "Rera Project Details Fetched Successfully",
                        code: "200",
                        data: response
                    }
                );
            }
        } catch (error) {
            console.error("VillageHandler - getReraProjectDetails || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }

    getBuildingApprovalNoDetails = async(req, res) => {
        const { FileNo } = req.query;
        try {
            if(!FileNo){
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            } else {
                let response = await this.villageService.getBuildingApprovalNoDetails(req);
                if(response?.isSuccess ==  false || response?.qbTemplateResults?.length == 0)
                     return res.status(400).send(
                        {
                            status: false,
                            message: response,
                            code: "400"
                        }
                    );
                else
                    return res.status(200).send(
                        {
                            status: true,
                            message: "Building Approval No Details Fetched Successfully",
                            code: "200",
                            data: response
                        }
                    );
            }
        } catch (error) {
            console.error("VillageHandler - getBuildingApprovalNoDetails || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }

    getSezJuriSRO = async(req, res) => {
        try {
            let response = await this.villageService.getSezJuriSRO(req.query);
            return res.status(200).send({
                status: true,
                response
            })
        } catch (error) {
            console.error("VillageHandler - getSezJuriSRO || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }
}

module.exports = VillageHandler;