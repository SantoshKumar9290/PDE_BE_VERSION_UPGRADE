const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("./errorHandler");
const Section47AService = require('../services/section47AServices');

class section47AHandler {
	constructor(){
		this.Section47AService = new Section47AService();
	}


    Section47ApublicDochndlr = async (req,res)=>{
		const data = req.body;
        // console.log( req.body, 'trackingdata')
		try{
			let responseData = await this.Section47AService.Section47ApublicDocsrvc(data);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename=section47ADocument.pdf');
            // res.status(200).send(pdfBuffer);
			res.status(200).send(responseData);
		}catch(ex){
			console.error("Section47AHandler - Section47ApublicDochndlr || Error :", ex);
            let PDEError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
                {
                    status: false,
                    message: PDEError.message
                }
            );
		}
	}
    generateForm2PDF47Ahndlr = async (req,res)=>{
		const data = req.body;
        // console.log( req.body, 'trackingdata')
		try{
			let responseData = await this.Section47AService.generateForm2PDF47ASrvc(data);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename=section47ADocument.pdf');
            // res.status(200).send(pdfBuffer);
			res.status(200).send(responseData);
		}catch(ex){
			console.error("Section47AHandler - Section47ApublicDochndlr || Error :", ex);
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

module.exports = section47AHandler;