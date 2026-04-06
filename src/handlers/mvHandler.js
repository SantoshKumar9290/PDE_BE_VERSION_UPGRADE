const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
// const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("./errorHandler");
const mvService = require('../services/mvServices');
const moment = require('moment');
class mvHandler {
	constructor(){
		this.mvService = new mvService();
	}
    mvAssitanceReport = async (req, res) => {  
        const reqData = req.body;
        try {
            let response = await this.mvService.mvAssitanceReport(reqData);
          if (response.length > 0) {
            let responseData = {
                status: true,
                message: "Success",
                code: "200",
                data: response
            };
            res.status(200).send({ ...responseData });
          } else {
                res.status(404).send({
                    status: false,
                    message: "No data found",
                    code: "404"
                })
                return;
            }
        } catch (ex) {
            console.error("MISHandler - getMISDetails || Error :", ex);
            const pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            );
        }
    }

    getmvasrlist = async (req, res) => {  
        const reqData = req.query;
        try {
            let response = await this.mvService.getmvasrlist(reqData);
            if(response.length === 0){
                res.status(404).send({
                    status: false,
                    message: "No data found",
                    code: "404"
                })
                return;
            }else{
            let responseData = {
                status: true,
                message: "Success",
                code: "200",
                data: response
            };
            res.status(200).send({ ...responseData });
        }
        } catch (ex) {
            console.error("MISHandler - getmvasrlist || Error :", ex);
            const pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            );
        }
    }

    pdfpreview = async (req, res) => {
        const reqData = req.query;
        if (
          reqData.SR_CODE == null ||
          reqData.REG_YEAR == null  || reqData.REQ_NO== null
        ) {
          res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send({
            status: false,
            message: NAMES.VALIDATION_ERROR,
          });
          return;
        }
        try {
          const response = await this.mvService.pdfpreviewSrvc(reqData);
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
      };
      

getmvacoordinatesdata = async (req, res) => {
    const qParams = req.query;
    if (qParams.SR_CODE == null || qParams.REG_YEAR == null || qParams.REQ_NO == null) {
      res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
        {
          status: false,
          message: NAMES.VALIDATION_ERROR
        }
      );
      return;
    }
    try {
      let response = await this.mvService.getmvacoordinatesdata(qParams);
      let responseData = {
        status: true,
        message: "Success",
        code: "200",
        data: response
      };
      console.log('Handler', responseData);
      res.status(200).send({ ...responseData });
    } catch (ex) {
      console.error("mvHandler - getmvacoordinatesdata || Error :", ex);
      const pdeError = constructPDEError(ex);
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
        {
          status: false,
          message: pdeError.message
        }
      );
    }
  }

  pendingesignlist = async (req, res) => {
    const reqData = req.query;
    if (
      reqData.SR_CODE == null ||
      reqData.REQ_NO == null ||
      reqData.REG_YEAR == null 
    ) {
      res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send({
        status: false,
        message: NAMES.VALIDATION_ERROR,
      });
      return;
    }
    try {
      let response = await this.mvService.pendingEsignList(reqData);
      let responseData = {
        status: true,
        message: "Success",
        code: "200",
        data: response,
      };
      // let hash = encryptWithAESPassPhrase(JSON.stringify(responseData), process.env.HASH_ENCRYPTION_KEY);
      // responseData.hash = hash;
      res.status(200).send({ ...responseData });
    } catch (ex) {
      console.error("refuseHandlers - pendingEsignList || Error :", ex);
      const pdeError = constructPDEError(ex);
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send({
        status: false,
        message: pdeError.message,
      });
    }
  };
  mvamvCalculator = async (req,res) =>{
		try{
			let reqParams = req.params;
            
			let response = await this.mvService.mvamvCalculator(req.body,reqParams);
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

  verifyPayment = async (req, res) => {
    const reqData = req.query;
    try {
        let response = await this.mvService.verifyPaymentByAppNumber(reqData);
        let responseData = {
            status: true,
            message: "Success",
            code: "200",
            data: response
        };
        res.status(200).send({ ...responseData });
    } catch (ex) {
        console.error("MVHandler - get Payment reports|| Error :", ex);
        const PDEError = constructPDEError(ex);
        return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
            {
                status: false,
                message: PDEError.message
            }
        );
    }
}
createMVRequest = async (req,res)=>{
  const reqBody = req.body;
  try{
    const response = await this.mvService.createMVRequest(reqBody);
      let responseData = {
      status:true, 
      message: "Success",
      code: "200",
      data : response
    };
    res.status(200).send({...responseData});
  }catch(ex){
    console.error("MVAHandler - createMVRequest || Error :", ex);
          let PDEError = constructPDEError(ex);
          return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
              {
                  status: false,
                  message: PDEError.message
              }
          );
  }
}

UpdatePaymentMVRequest = async (req,res)=>{
  const reqData = req.query;
  try{
    const response = await this.mvService.UpdatePaymentMVRequest(reqData);
      let responseData = {
      status:true, 
      message: "Success",
      code: "200",
      data : response
    };
    res.status(200).send({...responseData});
  }catch(ex){
    console.error("MVAHandler - createMVRequest || Error :", ex);
          let PDEError = constructPDEError(ex);
          return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
              {
                  status: false,
                  message: PDEError.message
              }
          );
  }
}

getMVRequestsData = async (req, res) => {
  const reqData = req.query;
  try {
      let response = await this.mvService.getMVRequestsData(reqData);
      let responseData = {
          status: true,
          message: "Success",
          code: "200",
          data: response
      };
      res.status(200).send({ ...responseData });
  } catch (ex) {
      console.error("MVHandler - get Mv requests|| Error :", ex);
      const PDEError = constructPDEError(ex);
      return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
          {
              status: false,
              message: PDEError.message
          }
      );
  }
}

getMVRequestsDatabySRO = async (req, res) => {
  const reqData = req.query;
  try {
      let response = await this.mvService.getMVRequestsDataofSRO(reqData);
      let responseData = {
          status: true,
          message: "Success",
          code: "200",
          data: response
      };
      res.status(200).send({ ...responseData });
  } catch (ex) {
      console.error("MVHandlerSRO - get request data by SRO|| Error :", ex);
      const PDEError = constructPDEError(ex);
      return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
          {
              status: false,
              message: PDEError.message
          }
      );
  }
}

getcompletedMVRequestsDatabySRO = async (req, res) => {
  const reqData = req.query;
  try {
      let response = await this.mvService.getcompletedMVRequestsDataofSRO(reqData);
      let responseData = {
          status: true,
          message: "Success",
          code: "200",
          data: response
      };
      res.status(200).send({ ...responseData });
  } catch (ex) {
      console.error("MVHandlerSRO - get completed  MV requests data|| Error :", ex);
      const PDEError = constructPDEError(ex);
      return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
          {
              status: false,
              message: PDEError.message
          }
      );
  }
}

updateMVRequest = async (req,res)=>{
  const reqdata = req.query;
  try{
    const response = await this.mvService.updateMVRequest(reqdata);
      let responseData = {
      status:true, 
      message: "Success",
      code: "200",
      data : response
    };
    res.status(200).send({...responseData});
  }catch(ex){
    console.error("MVAHandler - updateMVRequest || Error :", ex);
          let PDEError = constructPDEError(ex);
          return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
              {
                  status: false,
                  message: PDEError.message
              }
          );
  }
}
getCRDAdetails = async (req, res) => {
  const reqData = req.query;
  const { FROM_DATE, TO_DATE } = req.query;
  const dateFormat = 'DD-MM-YY';
  if (!FROM_DATE || !TO_DATE) {
    return res.status(400).json({ status: false,
      message: "FROM_DATE and TO_DATE are required." });
  }
  if (!moment(FROM_DATE, dateFormat, true).isValid() || !moment(TO_DATE, dateFormat, true).isValid()) {
    return res.status(400).json({ status: false,
      message: `Dates must be in the format ${dateFormat}.` });
  }
  const fromDate = moment(FROM_DATE, dateFormat);
  const toDate = moment(TO_DATE, dateFormat);
  if (fromDate.isAfter(toDate)) {
    return res.status(400).json({ status: false,
      message: "FROM_DATE should be less than TO_DATE." });
  }
  const today = moment();
  if (fromDate.isAfter(today) || toDate.isAfter(today)) {
    return res.status(400).json({ 
        status: false,
    message: "Dates cannot be in the future." });
  }
  try {
      let response = await this.mvService.getCRDAdetails(reqData);
      let responseData = {
          status: true,
          message: "Success",
          code: "200",
          data: response
      };
      res.status(200).send({ ...responseData });
  } catch (ex) {
      console.error("mvHandler - getCRDAdetails|| Error :", ex);
      const PDEError = constructPDEError(ex);
      return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send(
          {
              status: false,
              message: PDEError.message
          }
      );
  }
}
 
}

module.exports = mvHandler;