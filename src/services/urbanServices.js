const { set } = require("lodash");
const { NAMES } = require("../constants/errors");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("../handlers/errorHandler");
const axios = require('axios');
const {Logger} = require('../../services/winston');
const oracleDbDaos= require('../dao/oracleDbDaos');
const propertiesModel = require('../model/propertyModel');
const PropertyStrModel = require("../model/propertyStructureModel");
const electionAndSecratariatMasterDataModel = require('../model/electionAndSecratariatWardMasterDataCDMA')
const partiesModel = require('../model/partiesModel');
const VillageService = require('../services/villageService');
const DocumentDetailsDb = require("../model/documentDetailsModel");
const { cdmaAPIs,cdmaHostURL, cdmaHostGU } =require ("../constants/CDMAConstants");
class urbanService {
    constructor(){
		this.oracleDbDaos = new oracleDbDaos();
        this.villageServices =new VillageService();
    }

    getSecretariatWardBysroService = async (ulbCode) =>{
        try {
			const details = await electionAndSecratariatMasterDataModel.aggregate([{$match:{ulbCode:ulbCode}}])
            // oDBQueryService(query);
            return details
        } catch (error) {
            Logger.error(error.message);
            console.error("UrbanService - get Secretariat ward by SRO || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    }
    updateAssessmentMutationStatus = async(params)=>{
        try{
            let query =  `select * from srouser.mutation_sent_urban_cr where PTIN_APPLICATIONID=:applicationNumber and PROVISIONAL_PTIN=:assessmentNumber`;
        	let details = await this.oracleDbDaos.oDBQueryServiceWithBindParams(query,{assessmentNumber:params.assessmentNumber,applicationNumber:params.applicationNumber})
            if(details.length<1){
                return details
            }else{
             let updateQuery =  `update srouser.mutation_sent_urban_cr set PTIN=:updatedAssessmentNumber where PTIN_APPLICATIONID=:applicationNumber and PROVISIONAL_PTIN=:assessmentNumber`;  
             let updatedResult = await this.oracleDbDaos.oDbUpdateWithBindParams(updateQuery,{assessmentNumber:params.assessmentNumber,applicationNumber:params.applicationNumber,updatedAssessmentNumber:params.updatedAssessmentNumber});
                return updatedResult;
            }
        } catch (error) {
            Logger.error(error.message);
            console.error("UrbanService - Update Assessment Mutation status || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    }
    getUlbCodeOfMuncipality = async (sroCode) => {
        try {
			let query = `select * from sromstr.municipality_codes where SR_CODE=:sroCode`;
			let details = await this.oracleDbDaos.oDBQueryServiceWithBindParams(query,{sroCode})
            // oDBQueryService(query);
            return details
        } catch (error) {
            Logger.error(error.message);
            console.error("UrbanService - get UlbCode of muncipality || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    }

    getUlbCodeOfMuncipalityFromMutationEnabled = async (villageCode) => {
        try {
            villageCode=villageCode.length==6?`0${villageCode}01`:villageCode.length==7?`${villageCode}01`:villageCode;
            const toGetTheHabCode=`select * from sromstr.hab_match where webland_code=:villageCode`
            let getTheDetails = await this.oracleDbDaos.oDBQueryServiceWithBindParams(toGetTheHabCode, { villageCode })
            let query = `select a.* ,b.*, b.ulb_code as muni_code from sromstr.hab_match a join sromstr.hab_ulb b on a.webland_code=b.village_code where a.hab_code=:villageCode and rownum=1`;
            let details = await this.oracleDbDaos.oDBQueryServiceWithBindParams(query, { villageCode:getTheDetails[0]?.HAB_CODE })
            return details
        } catch (error) {
            Logger.error(error.message);
            console.error("UrbanService - get UlbCode of muncipality || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    }

    generateAssessment = async (reqData) => {
        try {
            const paramsObj = {
                ulbCode: reqData.ulbCode,
                propertyDetails: {
                    ulbCode: reqData.ulbCode,
                    ownershipCategory: "Private",
                    propertyType: "Residential",
                    apartmentName: "",
                    extensionOfSite: 220
                },
                ownerDetails: [
                    {
                        aadhaarNumber: "",
                        mobileNumber: "9090909090",
                        ownerName: "TestUser",
                        gender: "MALE",
                        emailAddress: "",
                        guardianRelation: "Father",
                        guardian: "Tt"
                    }
                ],
                propertyAddress: {
                    electionWardNo: "441",
                    wardSecretariat: "2",
                    northBoundary: "N",
                    eastBoundary: "E",
                    westBoundary: "W",
                    southBoundary: "S"
                },
                igrsDetails: {
                    sroCode: "",
                    sroName: "",
                    igrsWard: "Ward 0",
                    igrsLocality: "HOUSE SITE",
                    igrsBlock: "Block 0",
                    habitation: "MUTYALAMPADU",
                    igrsDoorNoFrom: "",
                    igrsDoorNoTo: ""
                },
                floorDetails: [
                    {
                        floorNumber: "0",
                        classificationOfBuilding: "RCC",
                        igrsClassification: "RES",
                        firmName: "MS",
                        plinthArea: "160"
                    }
                ],
                vltDetails: {
                    surveyNumber: "",
                    vacantLandArea: "",
                    igrsClassification: "",
                    currentMarketValue: null,
                    registeredDocumentValue: null
                },
                registeredDocumentLink: "https://igrs.gov/sampledoc",
                mutationType: "unassessed_full_mutation"
            }
            console.log('before urban token')
            let token =await  this.villageServices.UrbanTokenGeneration({ flag: 1, ulbCode:reqData.ulbCode })
            console.log('after urban token',token)

            if(typeof token !== 'string'){
                token = token.access_token;

                const url = `${cdmaHostURL}${cdmaAPIs.createAssessment}`

                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url:`${cdmaHostURL}${cdmaAPIs.createAssessment}`,
                    headers: {
                        'Referer': `${process.env.URBAN_SERVER_IP}`,
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
    
                    },
                    data: paramsObj
                };

                console.log(config,"configuration @@@@@@@@@@")

                const assDetResponse = await axios(config)
                console.log(assDetResponse,"asssss")
                if (assDetResponse.status == 200)
                    return assDetResponse.data;
                else{
                    return {};
                }
            }else{
                throw `Token Generation Failed. ${token}`
            }
        } catch (error) {
            Logger.error(error.message);
            console.error("VillageService - getVillages || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    }


    getSlotEnabledForSRO = async(sroCode)=>{
        try {
			let query = `select * from srouser.slot_enable_sro where SR_CODE=:sroCode`;
			let details = await this.oracleDbDaos.oDBQueryServiceWithBindParams(query,{sroCode})
            return details
        } catch (error) {
            Logger.error(error.message);
            console.error("VillageService - getDistricts || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    }

    getPropertyDetailsService = async (params)=>{
        const data =await propertiesModel.aggregate([{$match:{"applicationId":params.applicationId}},
            {$lookup:{
                from:'property_structure_details',
                let: { "properyID": "$propertyId" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$propertyId", "$$properyID"] } } },
                ],
                as: "propertyStructureDetails",
        }}
        ]);
        return data
    }

    createUrbanPropertySrvc = async (propertyData)=>{
        try{
            const property = await propertiesModel.findOne({ applicationId: propertyData.applicationId, propertyId: propertyData.propertyId });
            if (!property) {
                throw new Error(`No property found for applicationId: ${applicationId}`);
            }                
            const propertyStr = await PropertyStrModel.find({ propertyId: property?.propertyId })                

            let cdmaDetails = property?.cdma_details;          
            if (typeof cdmaDetails === "string") {
                try {
                    cdmaDetails = JSON.parse(cdmaDetails);
                } catch (e) {
                    throw new Error("Failed to parse cdma_details JSON string.");
                }
            }

            const plinthSum = Array.isArray(propertyStr) ? propertyStr.reduce((total, prop) => {
                const structureSum = Array.isArray(prop.structure) ? prop.structure.reduce((sum, s) => sum + parseFloat(s.plinth || 0), 0) : 0;
                return total + structureSum;
            }, 0) : 0;
            let ulbCode = cdmaDetails?.propertyID?.slice(0, 4);
            const guardianRelation = {
                "S/O": "Father",
                "D/O": "Mother",
                "W/O": "Husband",           
            };

            let claimants = [];
            let SParties = []
        
            try {
                if (property.applicationId) {
                    const applicationDetails= await DocumentDetailsDb.findOne({documentId:property.applicationId});
                    let parties = await partiesModel.find({applicationId: property.applicationId, partyCode:{$in: ["RE","AY","TE","CL","LE","ME","DE","OE","AP","SP","WI"] }});
                    SParties = await partiesModel.find({applicationId: property.applicationId, partyCode:{$in: ["EX", "MR", "DR", "RR", "FP", "LR", "PL", "TR", "NP", "DC", "OR", "HS", "PA", "AR", "FP", 'E'] }});
                    if(applicationDetails.documentSubType.TRAN_MAJ_CODE=='04'){
                        const mutableClaimantsNumbers = property.partyNumber.split(',').map(val => +val);
                        parties = parties.filter(item => mutableClaimantsNumbers.includes(item.seqNumber));
                    }
                    claimants = parties.map(party => {
                        let relationType = "Gurdian";
                        if (party.relationType) {
                            for (const code of Object.keys(guardianRelation)) {
                                if (party.relationType.startsWith(code)) {
                                    relationType = code;
                                    break;
                                }
                            }
                        }
                        return {
                            mobileNumber: party.phone.toString(),
                            ownerName: party.name,
                            gender: "MALE",
                            emailAddress: party.email || 'abc@allvy.com',
                            guardianRelation: guardianRelation[relationType]||relationType,
                            guardian: party.relationName,
                            aadhaarNumber: ""
                        };
                    });                
                }
            } catch (error) {
                console.log('Error ion fetch party details:', error);   
                throw error;         
            }

            let buyer = claimants.map(c => c.ownerName).join(", ");
            let seller = SParties.map(p => p.name).join(", ");

            const propertObj = {
                ulbCode: ulbCode,
                assessmentNumber: cdmaDetails?.propertyID,
                seller: seller,
                buyer: buyer,
                claimants: claimants,
                propertyAddress: cdmaDetails?.propertyAddress,
                registeredPlinthArea: plinthSum,
                registeredPlotArea:  parseFloat(property?.conveyedExtent[0].extent),
                northBoundary: property.northBoundry,
                eastBoundary: property.eastBoundry,
                southBoundary: property.southBoundry,
                westBoundary: property.westBoundry,
                sroName: property.sroOffice,
                mutationReason: "REGISTRATION",
                partyValue: property.marketValue,
                marketValue: property.marketValue,
                action: "CREATE"
            }            
            let token = await this.villageServices.UrbanTokenGeneration({ flag: 1, ulbCode })                        
            if(typeof token !== 'string'){
                token = token.access_token;
                const cdmaURL = `${cdmaHostURL}${cdmaAPIs.saveProperty}${ulbCode}`                
                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url:cdmaURL,
                    headers: {
                        'Referer': `${process.env.URBAN_SERVER_IP}`,
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    data: propertObj
                };                    
                let assDetResponse;
                try {
                    assDetResponse = await axios(config)                    
                } catch (error) {
                    let errorMessage = error?.response?.data?.error_description || error.message || error;
                    throw new Error(errorMessage);
                }                
                if (assDetResponse.status === 200)  {
                    if(assDetResponse.data?.errorDetails && assDetResponse.data?.errorDetails?.errorMessage 
                        && assDetResponse.data?.errorDetails?.errorMessage != 'SUCCESS'){
                        let errorMessage = assDetResponse?.data?.errorDetails?.errorMessage;
                        throw new Error(errorMessage);
                    }
                    else{
                        return assDetResponse.data;
                    }
                }                  
                else{
                   let errorMessage = assDetResponse?.errorDetails?.error_description;
                    throw new Error(errorMessage);
                }
            }else{
                throw  new Error(`Token Generation Failed. ${token}`);
            }            
        }
        catch(error){
            console.log('UrbanSerice - createUrbanPropertySrvc',error)
            Logger.error(error.message);
            throw error;
        }
       
    }

    propertyTaxDueSrvc = async (reqData)=>{     
        try{
            let ulbCode = reqData.ulbCode;
            if (!ulbCode && reqData.assessmentNo) {
                ulbCode = reqData.assessmentNo.substring(0, 4);            
            }
            const propertObj = {
                ulbCode: ulbCode,
                assessmentNo: reqData.assessmentNo,               
            }
            let token =await  this.villageServices.UrbanTokenGeneration({ flag: 1, ulbCode })                        
            if(typeof token !== 'string'){
                token = token.access_token;

                const url = `${cdmaHostURL}${cdmaAPIs.propertyTax}`                
                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url:`${cdmaHostURL}${cdmaAPIs.propertyTax}`,
                    headers: {
                        'Referer': `${process.env.URBAN_SERVER_IP}`,
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    data: propertObj
                };
                    
                const assDetResponse = await axios(config)                
                if (assDetResponse.status === 200 && assDetResponse.data) {
                    const responseData = assDetResponse.data;                
                    const { 
                        propertyDue = 0,
                        waterTaxDue = 0,
                        sewerageDue = 0, 
                        mutationDues = 0 } = responseData;

                    const totalDue = parseInt(propertyDue)+parseInt(waterTaxDue)+parseInt(sewerageDue);    
                    let duesObj = { mutationPaymentDue: totalDue, mutationFee: parseInt(mutationDues)};        
                    await propertiesModel.findOneAndUpdate({ applicationId: reqData.applicationId,propertyId: reqData.propertyId}, { $set: duesObj});  
                    return duesObj;
                } else {
                    return ({
                        status: false,
                        message: "Failed to Fetch Dues"
                    });
                }
        } else{
                throw `Token Generation Failed. ${token}`
            }            
        }
        catch(error){
            console.log('UrbanService - propertyTaxDueSrvc',error)
        }
       
    }

    updateUrbanPropertySrvc = async (partyDbFilter)=>{        
        try{
                const propertyData = await propertiesModel.findOne({ applicationId: partyDbFilter.applicationId, propertyId: partyDbFilter.propertyId });                           
                if (!propertyData) {
                    throw new Error(`No property found for applicationId: ${applicationId}`);
                }                

                let cdmaDetails = propertyData?.cdma_details;                   
			    if (typeof cdmaDetails === "string") {
    			    try {
        			    cdmaDetails = JSON.parse(cdmaDetails);                                          
    			    } catch (e) {
        			    throw new Error("Failed to parse cdma_details JSON string.");
    			    }
			    }

                const plinthSum = (Array.isArray(propertyData.structure) && propertyData.structure.length > 0)
                ? propertyData.structure.reduce((sum, s) => sum + parseFloat(s.plinth || 0), 0): 0;
                                
                let ulbCode = cdmaDetails?.propertyID?.toString().slice(0,4);                                
                const guardianRelation = {  
                "S/O": "Father",
                "D/O": "Mother",
                "W/O": "Husband",                
                };

                let claimants = [];
                let SParties = []
        
            try {            
                if (applicationId) {                                    
                    const applicationDetails= await DocumentDetailsDb.findOne({documentId:applicationId});    
                    const parties = await partiesModel.find({applicationId: applicationId, partyCode:{$in: ["RE","AY","TE","CL","LE","ME","DE","OE","AP","SP","WI"] }});
                    SParties = await partiesModel.find({applicationId: propertyData.applicationId, partyCode:{$in: ["EX", "MR", "DR", "RR", "FP", "LR", "PL", "TR", "NP", "DC", "OR", "HS", "PA", "AR", "FP", 'E'] }});
                    if(applicationDetails.documentSubType.TRAN_MAJ_CODE=='04'){
                        const mutableClaimantsNumbers = propertyData.partyNumber.split(',').map(val => +val);
                        parties = parties.filter(item => mutableClaimantsNumbers.includes(item.seqNumber));
                    }
                    claimants = parties.map(party => {                    
                    let relationType = "Gurdian";
                    if (party.relationType) {                        
                        for (const code of Object.keys(guardianRelation)) {
                            if (party.relationType.startsWith(code)) {
                                relationType = code;
                                break;
                            }
                        }
                    }                    
                    return {
                        mobileNumber: party.phone ? party.phone.toString() : "",
                        ownerName: party.name,
                        gender: "MALE",
                        emailAddress: party.email || 'abc@allvy.com',
                        guardianRelation: guardianRelation[relationType],
                        guardian: party.relationName,
                        aadhaarNumber: party.aadhaar ? party.aadhaar.toString() : ""
                    };
                });                
            }
        } catch (error) {
            console.log('Error ion fetch party details:', error);            
        }

        let buyer = claimants.map(c => c.ownerName).join(", ");
        let seller = SParties.map(p => p.name).join(", ");

            const propertObj = {
                ulbCode: ulbCode,
                assessmentNumber: cdmaDetails?.propertyID,
                seller: seller,
                buyer: buyer,
                claimants: claimants,
                propertyAddress: cdmaDetails?.propertyAddress,                
                registeredPlinthArea: plinthSum,
                registeredPlotArea: parseFloat(propertyData.conveyedExtent?.extent),
                northBoundary: propertyData.northBoundry,
                eastBoundary: propertyData.eastBoundry,
                southBoundary: propertyData.southBoundry,
                westBoundary: propertyData.westBoundry,
                sroName: propertyData.sroOffice,
                mutationReason:  "REGISTRATION",
                partyValue: propertyData.marketValue,
                marketValue: propertyData.marketValue,
                action: "UPDATE",
                applicationNumber: cdmaDetails?.applicationNumber
            }            
            let token =await  this.villageServices.UrbanTokenGeneration({ flag: 1, ulbCode })                        
            if(typeof token !== 'string'){
                token = token.access_token;

                const url = `${cdmaHostURL}${cdmaAPIs.saveProperty}${ulbCode}`
                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url:`${cdmaHostURL}${cdmaAPIs.saveProperty}${ulbCode}`,
                    headers: {
                        'Referer': `${process.env.URBAN_SERVER_IP}`,
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    data: propertObj
                };                                
               let assDetResponse;
                try {
                    assDetResponse = await axios(config)                    
                } catch (error) {
                    let errorMessage = error?.response?.data?.error_description || error.message || error;
                    throw new Error(errorMessage);
                }                
                if (assDetResponse.status === 200)  {                    
                    if(assDetResponse.data?.errorDetails && assDetResponse.data?.errorDetails?.errorMessage 
                        && assDetResponse.data?.errorDetails?.errorMessage != 'SUCCESS'
                        && assDetResponse.data?.errorDetails?.errorMessage != 'Mutation fee payment is already done. Please cancel the receipt in order to update or cancel the application.'){
                        let errorMessage = assDetResponse?.data?.errorDetails?.errorMessage;
                        throw new Error(errorMessage);
                    }
                    else{
                        return assDetResponse.data;
                    }
                }                  
                else{
                   let errorMessage = assDetResponse?.errorDetails?.error_description;
                    throw new Error(errorMessage);
                }
            }else{
                throw  new Error(`Token Generation Failed. ${token}`);
            }            
        }
        catch(error){
            console.log('UrbanSerice - updateUrbanPropertySrvc',error)
            Logger.error(error.message);
            throw error;
        }      
    }

    deletePropertySrvc = async (urbanReqData)=>{        
        try{

            let ulbCode = urbanReqData.assessmentNumber?.slice(0, 4);
            const propertObj = {
                ulbCode: ulbCode,
                assessmentNumber: urbanReqData.assessmentNumber,
                action: "CANCEL",
                applicationNumber: urbanReqData.applicationNumber
            }            
            let token =await  this.villageServices.UrbanTokenGeneration({ flag: 1, ulbCode })                        
            if(typeof token !== 'string'){
                token = token.access_token;

                const url = `${cdmaHostURL}${cdmaAPIs.saveProperty}${ulbCode}`                
                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url:`${cdmaHostURL}${cdmaAPIs.saveProperty}${ulbCode}`,
                    headers: {
                        'Referer': `${process.env.URBAN_SERVER_IP}`,
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    data: propertObj
                };                
                let assDetResponse;
                try {
                    assDetResponse = await axios(config)
                } catch (error) {
                    let errorMessage = error?.response?.data?.error_description || error.message || error;
                    throw new Error(errorMessage);
                }                
                if (assDetResponse.status === 200)  {
                    if(assDetResponse.data?.errorDetails && assDetResponse.data?.errorDetails?.errorMessage 
                        && assDetResponse.data?.errorDetails?.errorMessage != 'Application has been cancelled successfully.' 
                        && assDetResponse.data?.errorDetails?.errorMessage != 'Application is already approved or cancelled'
                        && assDetResponse.data?.errorDetails?.errorMessage != 'Mutation fee payment is already done. Please cancel the receipt in order to update or cancel the application.'){
                        let errorMessage = assDetResponse?.data?.errorDetails?.errorMessage;
                        throw new Error(errorMessage);
                    }
                    else{
                        return assDetResponse.data;
                    }
                }                  
                else{
                   let errorMessage = assDetResponse?.errorDetails?.error_description;
                    throw new Error(errorMessage);
                }
            }else{
                throw  new Error(`Token Generation Failed. ${token}`);
            }            
        }
        catch(error){
            console.log('UrbanSerice - createUrbanPropertySrvc',error)
            Logger.error(error.message);
            throw error;
        }
       
    }

    getVillageStatusSrvc = async (villageCode) => {
        try {
            let weblandVillageCode = villageCode.length === 6 ? "0" + villageCode + "01" : villageCode.length === 7 ? villageCode + "01" : villageCode ;
            let query = `SELECT* FROM SROMSTR.HAB_ULB  WHERE VILLAGE_CODE = :villageCode`;
            let result = await this.oracleDbDaos.oDBQueryServiceWithBindParams(query,{villageCode:weblandVillageCode})            
            return result
        } catch (error) {
            Logger.error(error.message);
            console.error("UrbanService - get Village Status Srvc || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    }
}

module.exports = urbanService