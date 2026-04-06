const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("./errorHandler");
const Masterservices = require('../services/mastersSevices');

class EcCcHandler {
	constructor() {
		this.Masterservices = new Masterservices();
	}


	getSroDetailshndl = async (req, res) => {
		const reqBody = req.query;
		try {
			let data = await this.Masterservices.getSroDetailsSrvc(reqBody);
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: data
			};
			res.status(200).send({ ...responseData });
		} catch (ex) {
			console.error("masterHandler - getSroDetailshndl || Error :", ex);
			let PDEError = constructPDEError(ex);
			return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
				{
					status: false,
					message: PDEError.message
				}
			);
		}
	}

	generateDocumentId = async (req, res) => {
		const reqBody = req.query.sr_code;
		try {
			let data = await this.Masterservices.generateDocumentId(reqBody);
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: data
			};
			res.status(200).send({ ...responseData });
		} catch (ex) {
			console.error("masterHandler - generateDocumentId || Error :", ex);
			let PDEError = constructPDEError(ex);
			return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
				{
					status: false,
					message: PDEError.message
				}
			);
		}
	}

	stamptypelisthndlr = async (req, res) => {
		const reqBody = req.query;
		try {
			let data = await this.Masterservices.stamptypelistsrvc(reqBody);
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: data
			};
			res.status(200).send({ ...responseData });
		} catch (ex) {
			console.error("masterHandler - stamptypelisthndlr || Error :", ex);
			let PDEError = constructPDEError(ex);
			return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
				{
					status: false,
					message: PDEError.message
				}
			);
		}
	}

	denominationslisthndl = async (req, res) => {
		const reqBody = req.query;
		try {
			let data = await this.Masterservices.denominationslistsrvc(reqBody);
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: data
			};
			res.status(200).send({ ...responseData });
		} catch (ex) {
			console.error("masterHandler - stamptypelisthndlr || Error :", ex);
			let PDEError = constructPDEError(ex);
			return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
				{
					status: false,
					message: PDEError.message
				}
			);
		}
	}
	getstampavailablelisthndlr = async (req, res) => {
		const reqBody = req.query.sr_code;
		try {
			let data = await this.Masterservices.getstampavailablelistsrvc(reqBody);
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: data
			};
			res.status(200).send({ ...responseData });
		} catch (ex) {
			console.error("masterHandler - getstampavailablelisthndlr || Error :", ex);
			let PDEError = constructPDEError(ex);
			return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
				{
					status: false,
					message: PDEError.message
				}
			);
		}
	}
	createStampIndent = async (req, res) => {
		const reqBody = req.body;
		try {
			let data=await this.Masterservices.createStampIndent(reqBody);
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data:data
			};
			res.status(200).send({ ...responseData });
		} catch (ex) {
			console.error("masterHandler - createStampIndent || Error :", ex);
			let PDEError = constructPDEError(ex);
			return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
				{
					status: false,
					message: PDEError.message
				}
			);
		}
	}

	stamIndentReport = async (req, res) => { 
		const reqData = req.query;
		try {
		  let response = await this.Masterservices.createStampIndentReport(reqData);
		  res.status(200).send({
			status: true,
			message: "Success",
			code: "200",
			data: response
		  });
		} catch (ex) {
		  console.error("masterHandler - stamIndentReport || Error :", ex);
		  const pdeError = constructPDEError(ex);
		  res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send({
			status: false,
			message: pdeError.message
		  });
		}
	  }
	  freezstamphndlr = async (req,res)=>{
		const reqdata = req.body;
		try{
		  const response = await this.Masterservices.freezstampsrvc(reqdata);
			let responseData = {
			status:true, 
			message: "Success",
			code: "200",
			data : response
		  };
		  res.status(200).send({...responseData});
		}catch(ex){
		  console.error("masterHandler - updatestamppaystatushndlr || Error :", ex);
				let PDEError = constructPDEError(ex);
				return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
					{
						status: false,
						message: PDEError.message
					}
				);
		}
	  }	 
	  Stamppaymentupdatehndlr = async (req,res)=>{
		const reqdata = req.body;
		try{
		  const response = await this.Masterservices.Stamppaymentupdatesrvc(reqdata);
			let responseData = {
			status:true, 
			message: "Success",
			code: "200",
			data : response
		  };
		  res.status(200).send({...responseData});
		}catch(ex){
		  console.error("mastersHandler - Stamppaymentupdatehndlr || Error :", ex);
				let PDEError = constructPDEError(ex);
				return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
					{
						status: false,
						message: PDEError.message
					}
				);
		}
	  }	  
	  verifyStampPaymenthndlr = async (req, res) => {
		const reqData = req.query;
		try {
			let response = await this.Masterservices.verifyStampPaymentsrvc(reqData,res);
			if(!response.status){
			  res.status(404).send({
				status: false,
				message: response.message,
				code: "404"
			})
			return;
			}
			else{
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: response
			};
			res.status(200).send({ ...responseData });}
		} catch (ex) {
			console.error("masterHandler - verifyStampPaymenthndlr || Error :", ex);
			const PDEError = constructPDEError(ex);
			return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
				{
					status: false,
					message: PDEError.message
				}
			);
		}
	}

	getstampindentdetailshndlr = async (req, res) => {
		const reqBody = req.query;
		try {
			let data = await this.Masterservices.getstampindentdetailssrvc(reqBody);
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: data
			};
			res.status(200).send({ ...responseData });
		} catch (ex) {
			console.error("masterHandler - getstampindentdetailshndlr || Error :", ex);
			let PDEError = constructPDEError(ex);
			return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
				{
					status: false,
					message: PDEError.message
				}
			);
		}
	}
	deletestampdetailshndlr = async (req, res) => {
		const reqBody = req.query;
		try {
			let data = await this.Masterservices.deletestampdetailssrvc(reqBody);
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: data
			};
			res.status(200).send({ ...responseData });
		} catch (ex) {
			console.error("masterHandler - getstampindentdetailshndlr || Error :", ex);
			let PDEError = constructPDEError(ex);
			return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
				{
					status: false,
					message: PDEError.message
				}
			);
		}
	}
	unpaidrequestlist = async (req, res) => {
		const reqBody = req.query;
		try {
			let data = await this.Masterservices.unpaidrequestlistsrvc(reqBody);
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: data
			};
			res.status(200).send({ ...responseData });
		} catch (ex) {
			console.error("masterHandler - getstampindentdetailshndlr || Error :", ex);
			let PDEError = constructPDEError(ex);
			return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
				{
					status: false,
					message: PDEError.message
				}
			);
		}
	}
	stampindentverificationhndlr = async (req, res) => {
		const reqBody = req.query;
		try {
			let data = await this.Masterservices.stampindentverificationsrvc(reqBody);
			let responseData = {
				status: true,
				message: "Success",
				code: "200",
				data: data
			};
			res.status(200).send({ ...responseData });
		} catch (ex) {
			console.error("masterHandler - getstampindentdetailshndlr || Error :", ex);
			let PDEError = constructPDEError(ex);
			return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
				{
					status: false,
					message: PDEError.message
				}
			);
		}
	}

	saveAadhaarConsentAcceptanceDetailsHandler = async (req,res)=>{
		const reqBody = req.body;
		try{
			let response = await this.Masterservices.saveAadhaarConsentAcceptanceDetailsService(reqBody);
			let responseData = {
				status:true, 
				message: "Success",
				code: "200",
				data: response
			};
			res.status(200).send({...responseData});	
		}catch(ex){
			console.error("masterHandler - saveAadhaarConsentAcceptanceDetailsHandler || Error :", ex);
            let PDEError = constructPDEError(ex);
			return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
				{
					status: false,
					message: PDEError.message
				}
			);
		}
	}
}
module.exports = EcCcHandler;