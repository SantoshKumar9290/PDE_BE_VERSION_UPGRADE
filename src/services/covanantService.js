const { NAMES } = require("../constants/errors");
const CovanatsDao = require("../dao/covanantsDao");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("../handlers/errorHandler");
const uuid = require('uuid');
const {Logger} = require('../../services/winston');
class CovanantsService {
	constructor(){
        this.coavantDao = new CovanatsDao();
    }
	createCovanants = async (reqData) => {
		try{
						reqData.covanantId = uuid.v4();
			let covanantDb = await this.coavantDao.createandUpdate(reqData);
			 return  covanantDb;
		}catch(ex){
			Logger.error(ex.message);
			console.error("CovanantsService - createCovanants || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	};

	getCovanantsById = async (docId)=>{
		try{
			let filters = {documentId:docId};
			let covanantDb = await this.coavantDao.getOneByFilters(filters)
			 return  covanantDb;
		}catch(ex){
			Logger.error(ex.message);
			console.error("CovanantsService - getCovanantsById || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	};
	updateCovanantsSrvc = async (reqData,reqBody)=>{
        try{
            let filters,update;
            if(reqBody.type ==="acquation"){
                filters ={documentId:reqData.docId,"acquireCovenents._id":reqData.id};
                update ={$set:{"acquireCovenents.$.value":reqBody.value}}
            }else{
                filters ={documentId:reqData.docId,"covanants._id":reqData.id};
                update ={$set:{"covanants.$.value":reqBody.value}}
            }
            let covanantDb = await this.coavantDao.updateOneByFilters(filters,update)
             return  covanantDb;
        }catch(ex){
            Logger.error(ex.message);
            console.error("CovanantsService - updateCovanants || Error : ", ex.message);
            throw constructPDEError(ex);
        }
    }
	delCovanantsSrvc = async (reqData,reqBody)=>{
        try{
            let filters,update;
            if(reqData.type ==="acquation"){
                filters ={documentId:reqData.docId,"acquireCovenents":{$elemMatch: {"_id": reqData.id}}};
                update ={
                    $pull: {
                        acquireCovenents: {
                            _id: reqData.id
                        }
                    }
                }
            }else{
                filters ={documentId:reqData.docId,"covanants":{$elemMatch: {"_id": reqData.id}}};
                update ={
                    $pull: {
                        covanants: {
                            _id: reqData.id
                        }
                    }
                }
            }
            let covanantDb = await this.coavantDao.delOneByFilters(filters,update)
             return  covanantDb;
        }catch(ex){
            Logger.error(ex.message);
            console.error("CovanantsService - delCovanantsSrvc || Error : ", ex.message);
            throw constructPDEError(ex);
        }
    }

};
module.exports = CovanantsService;