const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const EsignService = require("../services/esignService");
const { constructPDEError } = require("./errorHandler");

const CovanentsDao = require('../dao/covanantsDao');

class EsignHandler {

	constructor(){
        this.esignService = new EsignService();
    }

	esignParty = async (req, res) => {
		const reqBody = req.body
		if(reqBody == null || reqBody.documentId == null || !(reqBody.partyId != null || (reqBody.repId != null && reqBody.parentId != null))){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
		}
		
		try{
			let response = await this.esignService.esignUser(reqBody);
            return res.status(200).send(
                {
                    status:true, 
                    message: "Esign Done Successfully",
                    code: "200",
                    data: response
                }
            );

		}catch(ex){
			console.error("EsignHandler - esignParty || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message:  ex.message??NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}

	}

    esignStatus = async (req, res) => {
		const reqBody = req.body
		if(reqBody == null || reqBody.documentId == null || reqBody.txnId == null || !(reqBody.partyId != null || (reqBody.repId != null && reqBody.parentId != null))){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
		}
		
		try{
			let response = await this.esignService.esignStatus(reqBody);
            return res.status(200).send(
                {
                    status:true, 
                    message: "Esign Done Successfully",
                    code: "200",
                    data: response
                }
            );

		}catch(ex){
			console.error("EsignHandler - esignStatus || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: ex.message??NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}

	}

    esignExecuted = async (req, res) => {
		const reqBody = req.body
		if(reqBody == null || reqBody.documentId == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
		}
		
		try{
			let response = await this.esignService.esignExecute(reqBody);
            return res.status(200).send(
                {
                    status:true, 
                    message: "Esign Executed Successfully",
                    code: "200",
                    data: response
                }
            );

		}catch(ex){
			console.error("EsignHandler - esignExecuted || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: ex.message??NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}

	}

    esignRemove = async (req, res) => {
		const reqBody = req.body
		if(reqBody == null || reqBody.documentId == null){
			res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
		}
		
		try{
			let response = await this.esignService.esignRemove(reqBody);
            return res.status(200).send(
                {
                    status:true, 
                    message: "Esign Removed Successfully",
                    code: "200",
                    data: response
                }
            );

		}catch(ex){
			console.error("EsignHandler - esignRemove || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: ex.message??NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}

	}
}

module.exports = EsignHandler;