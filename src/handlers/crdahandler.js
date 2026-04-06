const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const axios=require('axios');
const CrdaService = require("../services/crdaService");
const { constructPDEError } = require("./errorHandler");
const {encryptWithAESPassPhrase, decryptWithAES} = require('../utils/index');
const sysConstanst = require("../utils/sysConstanst");



class CrdaHandler {

    constructor(){
        this.crdaSrvc = new CrdaService();
    }

    getVillages = async (req,res)=>{
        try{
            console.log("reqQuery",req.params)
            let response = req.params.vgCode != undefined 
            ?   await this.crdaSrvc.getAllVillages(req.params)
            :   await this.crdaSrvc.getAllVillages();
            if(response && response.length>0){
                res.status(200).send({status:true,data:response});
                return;
            }
        }catch(ex){
            console.error("CrdaHandler - getVillages || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            )
        }
    }
    checkEmp = async (req,res)=>{
        try{
            const reqBody = req.body;
            console.log(":::::::::::reqBody::::::::::::",reqBody);
            let response = await this.crdaSrvc.checkEmpList(reqBody);
            console.log("FFFFFFFFFFFFFFFFf",response)
            if(response){
                res.status(200).send({status:true,data:response});
                return;
            }else{
                res.status(400).send({status:false,data:response});
                return;
            }


        }catch(ex){
            console.error("CrdaHandler - checkEmp || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            )
        }
    }

}

module.exports = CrdaHandler;