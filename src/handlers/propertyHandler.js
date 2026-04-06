const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const PDEError = require("../errors/customErrorClass");
const PropertyService = require("../services/propertyService");
const { constructPDEError } = require("./errorHandler");
const {encryptWithAESPassPhrase,decryptWithAESPassPhrase} = require('../utils/index');
const sysConstanst = require("../utils/sysConstanst");
const {PropertyValidation} =require('../utils/validations');
const PropertDao = require('../dao/propertiesDao')
const { amendBackUpLogs } = require('../utils/helper');
const orDbDao = require('../dao/oracleDbDaos')
class PropertyHandler{
	constructor(){
        this.propertyService = new PropertyService();
		this.proprtyDao = new PropertDao()
    	this.orDao = new orDbDao();
    };

	createProperty = async (req,res) =>{
		console.log("PropertyHandler - createProperty || Request is ", req.body);
        let propertyData = {};
			propertyData = req.body;
            if(!(propertyData.isLinkedDocument != null && propertyData.isLinkedDocument == true) && 
                (propertyData.applicationId == null || propertyData.localBodyType == null || propertyData.localBodyName == null || propertyData.district == null || 
                    propertyData.sroOffice == null || propertyData.propertyType == null || propertyData.landUse == null)){
                return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                });
            }
			// let validation = await PropertyValidation(propertyData);
			// if(validation && validation.status === false){
			// 	let codes = validation.code ? NAMES.UNAUTHORIZED : NAMES.VALIDATION_ERROR;
			// 	res.status(NAMES_STATUS_MAPPINGS[codes]).send(
			// 		{
			// 			status: false,
			// 			message: validation.err
			// 		}
			// 	);
			// 	return;
			// }
		
		try {
            let response = await this.propertyService.createProperty(propertyData,req);
			// let hash = encryptWithAESPassPhrase(JSON.stringify(response), sysConstanst.HASHING_PASSPHRASE);
            // response.hash =hash;
			if(req.user && req.user.sroNumber){
				const [query, values] = amendBackUpLogs(req.body, req.user, 'Create', 'Property')
				await this.orDao.oDbInsertDocsWithBindParams(query, values);
			}
			if(response){
				return res.status(200).send(
					{
						status:true, 
						message: "Property Created Successfully",
						code: "200",
						data: response
					}
				);
			}

        } catch (error) {
            console.error("PropertyHandler - createProperty || Error :", error.message);
            var pdeError = constructPDEError(error);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: error.message
                }
            );
        }
	};


	createSection47A = async (req,res) =>{
		console.log("PropertyHandler - createProperty || Request is ", req.body);
        let propertyData = {};
			propertyData = req.body;
        try {
			
			
            let response = await this.propertyService.createSection47A(propertyData);
			// let hash = encryptWithAESPassPhrase(JSON.stringify(response), sysConstanst.HASHING_PASSPHRASE);
            // response.hash =hash;
			if(response){
				return res.status(200).send(
					{
						status:true, 
						message: "Section47 Added Successfully",
						code: "200",
						data: response
					}
				);
			}

        } catch (error) {
            console.error("PropertyHandler - createProperty || Error :", error.message);
            var pdeError = constructPDEError(error);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: error.message
                }
            );
        }
	};


	othersPropCreation = async (req,res)=>{
		const propertyData = req.body;
		try{
			let response = await this.propertyService.OtherProperty(propertyData);
			// let hash = encryptWithAESPassPhrase(JSON.stringify(response), sysConstanst.HASHING_PASSPHRASE);
            // response.hash =hash;
			if(response){
				if(req.user && req.user.sroNumber){
					const [query, values] = amendBackUpLogs(req.body, req.user, 'Create', 'OtherProperty')
					await this.orDao.oDbInsertDocsWithBindParams(query, values);
				}
				return res.status(200).send(
					{
						status:true, 
						message: "Other Property Created Successfully",
						code: "200",
						data: response
					}
				);
			}

		}catch(ex){
			console.error("PropertyHandler - othersPropCreation || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
	editProperty = async (req,res)=>{
		const propertyData = req.body;
		const reqParams= req.params;
		try{
			
			let response = await this.propertyService.updateProperty(reqParams, propertyData);
			if (response) {
				let hash = encryptWithAESPassPhrase(JSON.stringify(response), sysConstanst.HASHING_PASSPHRASE);
				response.hash = hash;
				if (req.user && req.user.sroNumber) {
					const [query, values] = amendBackUpLogs(req.body, req.user, 'Edit', 'Property')
					await this.orDao.oDbInsertDocsWithBindParams(query, values);
				}
				return res.status(200).send(
					{
						status: true,
						message: "Property Updated Successfully",
						code: "200",
						data: response
					}
				);
			}
		}catch(ex){
			console.error("PropertyHandler - createProperty || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}

	getPropertybyAppId = async (req,res)=>{
		const reqParams= req.params;
		try{
			let response = await this.propertyService.getProperties(reqParams);
			// let hash = encryptWithAESPassPhrase(JSON.stringify(response), sysConstanst.HASHING_PASSPHRASE);
			if(response){
				return res.status(200).send(
					{
						status:true, 
						code: "200",
						data: response
					}
				);
			}
		}catch(ex){
			console.error("PropertyHandler - getPropertybyAppId || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            );
		}
	}

    deleteProperty = async (req,res) =>{
		console.log("PropertyHandler - deleteProperty || Request is ", req.params);
        let propertyData = {};
			propertyData = req.params;
            if(propertyData == null || propertyData.applicationId == null || propertyData.propertyId == null){
                return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                });
            }
			let checkValidate = await this.proprtyDao.getByFilters({propertyId:propertyData.propertyId,applicationId:propertyData.applicationId})
			if(checkValidate && checkValidate.length === 0){
				return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
					{
						status: false,
						message: "MissMatch.."
					})
			}
		
		try {
            let response = await this.propertyService.deleteProperty(propertyData);
			if(req.user && req.user.sroNumber){
				const [query, values] = amendBackUpLogs(req.body, req.user, 'Delete', 'Property')
				await this.orDao.oDbInsertDocsWithBindParams(query, values);
			}
			if(response){
				return res.status(200).send(
					{
						status:true, 
						message: "Property Deleted Successfully",
						code: "200",
						data: response
					}
				);
			}

        } catch (error) {
            console.error("PropertyHandler - deleteProperty || Error :", error.message);
            var pdeError = constructPDEError(error);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
	};
}

module.exports = PropertyHandler;