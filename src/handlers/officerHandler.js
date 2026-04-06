const Ofcrservice = require('../services/officerService');
const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const { constructPDEError } = require("./errorHandler");
// const { Handler,reqHandler } = require('../common/requestHandler');

//FORMAT:  exports.<action>=(req,res)=>Handler(req,res,service.<function>,<successMessage>,<failMessage>);
// exports.login = (req, res) => Handler(req, res, service.login, 'Success', 'User Details access failed');
// exports.signUp = (req, res) => { Handler(req, res, service.signUp, 'Success', 'Save Failed'); }
// exports.reset =async (req,res)=> await reqHandler(req,res,service.resetPswrd)

class OfficerHandler {
	constructor(){
        this.ofcrService = new Ofcrservice();
    }

	login = async (req,res)=>{
		const reqBody = req.body;
		const requrl = req.protocol + "://" + req.get("host") + "/v1/token/";
		try{
			let query;
			if(reqBody.loginMode=="CSC"){
				query={sroOffice:reqBody.cscSro,loginPassword:reqBody.cscPassword}
			}else{
				query ={loginEmail : reqBody.loginEmail,loginPassword:reqBody.loginPassword}
			}
			let response = await this.ofcrService.login(query,requrl)
			res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("UserHandler - login || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}
	}
	getDocumentHandler = async (req,res)=>{
		const reqUser = req.user;
		if( reqUser.sroNumber === null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
		}
		try{
			let response = await this.ofcrService.getDocumentService(reqUser.sroNumber);
			if(response.length === 0){
				return res.status(400).send({
					status:false, 
					code: "400",
					message: "Bad request"
				})
			}else{
				res.status(200).send(
					{
						status:true, 
						code: "200",
						data: response
					}
				);
				return;
			}


		}catch(ex){
			console.error("OfficerHandler - getDocumentHandler || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}
	}
	officerListHandler = async (req,res)=>{
		try{
			let response =await this.ofcrService.listOfSros()
			res.status(200).send({
					status:true,
					data: response
				}
			);
			return;
		}catch(ex){
			console.error("OfficerHandler - officerListHandler || Error :", ex.message);
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

module.exports = OfficerHandler;
