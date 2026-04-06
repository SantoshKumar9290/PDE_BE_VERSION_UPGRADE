const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const PDEError = require("../errors/customErrorClass");
const CovanantsService = require("../services/covanantService");
const { constructPDEError } = require("./errorHandler");
const {covenantValidations} =require('../utils/validations');
const sysConstanst = require("../utils/sysConstanst");
const CovanentsDao = require('../dao/covanantsDao');

class CovanantHandler {

	constructor(){
        this.covanantsService = new CovanantsService();
		this.covanentsDao = new CovanentsDao()
    }

	createCovanants = async (req, res) => {
		const reqBody = req.body
		if(reqBody == null && reqBody.documentId == null || reqBody.natureType == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
		}
		let validation = await covenantValidations(reqBody,req.user,sysConstanst.REQ_METHOD_CREATE);
		if(validation && validation.status === false){
			let codes = validation.code ? NAMES.UNAUTHORIZED : NAMES.VALIDATION_ERROR;
			res.status(NAMES_STATUS_MAPPINGS[codes]).send(
                {
                    status: false,
                    message: validation.err
                }
            );
            return;
		}
		try{
			let response = await this.covanantsService.createCovanants(reqBody);
            return res.status(200).send(
                {
                    status:true, 
                    message: "covanant Created Successfully",
                    code: "200",
                    data: response
                }
            );

		}catch(ex){
			console.error("CovanantHandler - createCovanants || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}

	}
	getCovanantsByDocId = async (req,res)=>{
		const reqParams = req.params;
		if(reqParams == null && reqParams.docId == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
		}
		try{
			let response = await this.covanantsService.getCovanantsById(reqParams);
            return res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );

		}catch(ex){
			console.error("CovanantHandler - getCovanantsByDocId || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                	message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}
	}
    updateCovanants = async (req,res)=>{
        const reqParams = req.params;
        const reqBody = req.body;
        if(reqParams == null && reqParams.docId == null ){
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        let validation = await covenantValidations({documentId:reqParams.docId},req.user,sysConstanst.REQ_METHOD_EDIT);
        if(validation && validation.status === false){
            let codes = validation.code ? NAMES.UNAUTHORIZED : NAMES.VALIDATION_ERROR;
            res.status(NAMES_STATUS_MAPPINGS[codes]).send(
                {
                    status: false,
                    message: validation.err
                }
            );
            return;
        }
        try{
            let response = await this.covanantsService.updateCovanantsSrvc(reqParams,reqBody);
            return res.status(200).send(
                {
                    status:true,
                    code: "200",
                    message:"Updated Successfully"
                }
            );
        }catch(ex){
            console.error("CovanantHandler - updateCovanants || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }
    }
    deleteCovenants = async (req,res)=>{
        const reqParams = req.params;
        const reqBody = req.body;
        if(reqParams == null && reqParams.docId == null ){
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        let checkValidate = await this.covanentsDao.getByFilters({documentId:reqParams.docId});
       
        if(checkValidate && checkValidate.length === 0){
            return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: "MissMatch.."
                })
        }
        try{
            let response = await this.covanantsService.delCovanantsSrvc(reqParams,reqBody);
            return res.status(200).send(
                {
                    status:true,
                    code: "200",
                    message:"Deleted Successfully"
                }
            );
        }catch(ex){
            console.error("CovanantHandler - deleteCovenants || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }
    }
}

module.exports = CovanantHandler;