const officerModel = require('../model/officerModel');
const jwt = require('../plugins/auth/authService');
const OfcrDao = require('../dao/officerDao');
const DocumentDao = require('../dao/documentDetailsDao');
const DocumentServce = require('./documentService');
const PDEError = require('../errors/customErrorClass');
const gAuth = require('../plugins/auth/authService');
const { constructPDEError } = require("../handlers/errorHandler");
const {Logger} = require('../../services/winston');

class OfficerService {
	constructor(){
        this.ofcDao = new OfcrDao();
		this.documentDao = new DocumentDao();
		this.docService = new DocumentServce();
    }

	login = async (reqData,requrl)=>{
		let loginUser = await this.ofcDao.findOne(reqData);
		if(!loginUser){
			console.error("officerService - login || Officer Not Found")
            throw new Error("Officer Not Found");
		} else if(loginUser.loginPassword !== reqData.loginPassword){
			console.error("officerService - login || Invalid Login")
            throw new Error("Invalid Login");
		} else {
			try{
				const officerDetails = await gAuth.getUserInfo(loginUser);
				officerDetails.token = await gAuth.createToken(officerDetails,requrl);
				return officerDetails
		
			}catch(ex){
				Logger.error(ex.message);
				console.error("officerService - Login || Error : ", ex.message);
				throw constructPDEError(ex);
			}
		}
	};
	getDocumentService = async(sroNumber)=>{
		if(sroNumber === null){
			console.log("officerService - getDocumentService || sroNumber can't be Empty");
			throw new Error("sroNumber can't be Empty");
		}
		try{
			let query = {sroCode:sroNumber}
			let documentData = await this.documentDao.getByFilters(query);
			return documentData;
		}catch(ex){
			Logger.error(ex.message);
			console.error("officerService - getDocumentService || Error : ", ex.message);
			throw constructPDEError(ex);
		}
	}
	listOfSros = async()=>{
		try{
			let list = await this.ofcDao.findAll();
			let sroList;
			if(list && list.length >0){
				sroList =list.map((x)=>{return x.sroOffice});
			}
			return sroList;
		}catch(ex){
			Logger.error(ex.message);
			console.error("officerService - getDocumentService || Error : ", ex.message);
			throw constructPDEError(ex);
		}
	}
}

module.exports = OfficerService;
