const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("./errorHandler");
const lpmBaseService = require('../services/lpmBaseServices');

class lpmBaseHandler {
	constructor(){
		this.lpmBaseService = new lpmBaseService();
	}

    form4Checkhndlr = async (req,res)=>{
		const reqdata = req.body;
        if (!Array.isArray(reqdata?.data) || reqdata?.data.length === 0) {
            return res.status(400).json({ error: "Invalid survey numbers provided" });
          }
  try{
    const response = await this.lpmBaseService.form4Checksrvc(reqdata.data);
      let responseData = {
      status:true, 
      message: "Success",
      code: "200",
      data : response
    };
    res.status(200).send({...responseData});
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

module.exports = lpmBaseHandler;