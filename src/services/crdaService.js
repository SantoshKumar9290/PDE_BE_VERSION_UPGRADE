
const { NAMES } = require("../constants/errors");
const CrdaDao = require("../dao/crdaDao");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("../handlers/errorHandler");
const uuid = require('uuid');
const {Logger} = require('../../services/winston');



class CrdaService {
    constructor(){
        this.crdaDao =new CrdaDao();
    }
    getAllVillages = async (reqData)=>{
        try{
            let payload= reqData != undefined ?
            [{   "$match":{villageCode:reqData.vgCode}} ]
            :
            [{"$project":{villageCode:1,villageName:1,_id:0}}]
            let res=await this.crdaDao.getData(payload);
            if(res && res.length>0){
                return res;
            }else{
                throw new PDEError({err:"Bad Request"});
            }
        }catch(ex){
            Logger.error(ex.message);
            console.error("CrdaService - getAllVillages || Error : ", ex.message);
            throw constructPDEError(ex);
        }
    }
    checkEmpList = async (reqData)=>{
        try{
            let payload = {empAdhar:{"$in":reqData.aadhar}};
            let res=await this.crdaDao.getEmpData(payload);

            if(res && res.length>0){
                return true;
            }else{
               return false;
            }

        }catch(ex){
            Logger.error(ex.message);
            console.error("CrdaService - checkEmpList || Error : ", ex.message);
            throw constructPDEError(ex);
        }
    }
}


module.exports = CrdaService;