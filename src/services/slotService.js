const { NAMES } = require("../constants/errors");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("../handlers/errorHandler");
const SlotsDao = require("../dao/slotDao");
const slotModel = require('../model/slotModel');
const docsModel = require('../model/documentDetailsModel')
const DocumnetsDao = require('../dao/documentDetailsDao')
const {Logger} = require('../../services/winston');
const VillageService = require("./villageService");
const SlotsHistory = require("../model/slotBookingHistory");const OrDbDao = require('../dao/oracleDbDaos')
class SlotService {
	constructor(){
		this.orDbDao = new OrDbDao();
        this.slotsDao = new SlotsDao();
		this.documnetsDao = new DocumnetsDao();
		this.villageService = new VillageService();
    }
	createBooking = async (slotData,user) =>{
		try{
			let filters ={
				sroOfcNum:slotData.sroOfcNum,
				dateForSlot:slotData.dateForSlot,
				sroDistrict:slotData.sroDistrict,
				sroOffice:slotData.sroOffice,
				applicationId:slotData.applicationId,
				slotTime:slotData.slotTime,
				sroSequence:1,
				status:"BOOKED"
			};
			let slots = {applicationId:slotData.applicationId,status:"BOOKED"};
			let slotHistory = await SlotsHistory.findOne(slots);
			if(slotHistory){
				const historyData = new SlotsHistory({...filters,amount:200});
				await historyData.save();
			}else{
				const historyData = new SlotsHistory({...filters,amount:100});
				await historyData.save();
			}
			let slotDataDb = await this.slotsDao.create(filters)
			if(user?.loginMobile?.length==10){
				const slotDat={
					applicationId:slotData.applicationId,
					slotDate:slotData.dateForSlot,
					slotTime:slotData.slotTime
				}
				await this.villageService.sendSMSForApproveReject(user.loginMobile,"SLOT",slotDat)
			}
			// await docsModel.findOneAndUpdate({"documentId":slotData.applicationId},{$set:{status : "BOOKED"}})
			return slotDataDb;
		}catch(ex){
			Logger.error(ex.message)
			console.error("SlotService - CreateBooking || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}


	
	slotStatusUpdate = async (slotbookinDetails) =>{
		try{
			let queryParams = {applicationId:slotbookinDetails.applicationId, sroOfcNum:slotbookinDetails.sroOfcNum}
			let slotDataDb = await slotModel.findOneAndUpdate(queryParams,{$set:{status : slotbookinDetails.status}})
			return slotDataDb;
		}catch(ex){
			Logger.error(ex.message)
			console.error("SlotService - slotStatusUpdate || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}

	getSlotsOnDay = async (queryParams) =>{
		try{
			let slotDataDb = await this.slotsDao.getByFilters(queryParams);
			// getOneSlotByUnwind
			return slotDataDb;
		}catch(ex){
			Logger.error(ex.message)
			console.error("SlotService - getSlotsOnDay || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}
	deletetheSlot = async (queryParams) =>{
		try{
			if(queryParams?.type ==="delete"){
				const historyData = new SlotsHistory({...queryParams,amount:100,status:"CANCELLED"});
				await historyData.save();
			}
			let slotDataDb = await this.slotsDao.deletetheSlot(queryParams);
			// getOneSlotByUnwind
			return slotDataDb;
		}catch(ex){
			Logger.error(ex.message)
			console.error("SlotService - getSlotsOnDay || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}
	getSlotsOnDayByAppId = async (queryParams) =>{
		try{
			let slotDataDb = await this.slotsDao.getOneByFilters(queryParams);
			// getOneSlotByUnwind
			return slotDataDb;
		}catch(ex){
			Logger.error(ex.message)
			console.error("SlotService - getSlotsOnDay || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}
	getSlotsByAppIdService = async (reqData)=>{
		try{
			let slotDataDb = await this.slotsDao.getOneByFilters(reqData);
			let Obj ={};
			
			slotDataDb.map((slot)=>{
				Obj.slotDate= slot.dateForSlot;
				// slot.slots.filter((x)=>{
					if(slot.applicationId === reqData.applicationId){
						Obj.applicationId = slot.applicationId,
						Obj.slotTime = slot.slotTime;
						Obj.isAuthenticateThroughQr = slot.isAuthenticateThroughQr
					}
				// })
			})
			return Obj;
		}catch(ex){
			Logger.error(ex.message)
			console.error("SlotService - getSlotsOnDay || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}
	isSlotEnabledForSro = async (sroCode) =>{
		try{
			let bindparam ={
				SR_CODE : sroCode
			   }
				let query = `select count(*) as count from srouser.slot_enable_sro where status = 'Y' and sr_code = :SR_CODE`;            
				let response = await this.orDbDao.oDBQueryServiceWithBindParams(query, bindparam)
				return response[0].COUNT;
		}catch(ex){
			Logger.error(ex.message)
			console.error("SlotService - getSlotsOnDay || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}


	getSyncedSlotsOnDay = async (queryParams) =>{
		try{
			const filters1 = {'sroOfcNum': Number(queryParams.sroOfcNum),dateForSlot:queryParams.dateForSlot};
			// const lookUp = {
			// 	"from": 'document_details',
			// 	"localField": 'sroOfcNum',
			// 	"foreignField": 'sroCode',
			// 	"as": 'docs'
			// };
			// const filters2 = {
			// 	'docs': {
			// 		$elemMatch: {'sroCode': Number(queryParams.sroOfcNum),'status':"SYNCED"}
			// 	}
			// };
			// const project = {
			// 	"documentId": 1,
			// 	"sroOffice": 1,
			// 	"dateForSlot": 1,
			// 	'sroDistrict': 1,
			// 	'sroOfcNum': 1,
			// 	'sroOffice': 1,
			// 	"slots": 1,
			// };
			let slotDataDb = await this.slotsDao.getByFilters(filters1);
			// // getOneSlotByUnwind
			return slotDataDb;
		}catch(ex){
			Logger.error(ex.message)
			console.error("SlotService - getSlotsOnDay || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}
};
module.exports = SlotService;