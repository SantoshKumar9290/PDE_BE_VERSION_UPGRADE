const { NAMES } = require("../constants/errors");
const PropertyDao = require("../dao/propertiesDao");
const PropertyStrDao = require("../dao/propertyStructureDao");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("../handlers/errorHandler");
const {landUseCodes} = require('../utils/checkUseCodes')
const uuid = require("uuid");
const {Logger} = require('../../services/winston');
const { parseInt } = require("lodash");
const User = require("../dao/userDao");
const DocumentDetailsDao = require("../dao/documentDetailsDao");
const StatusHistory = require('../model/statusHistoryModel');
const Section47Db = require('../model/section47AModel');
const VillageService = require("../services/villageService");
const UrbanService = require('../services/urbanServices')

class PropertyService {
	constructor(){
        this.propertyDao = new PropertyDao();
        this.propertyStrDao = new PropertyStrDao();
		this.user = new User();
		this.documentDetailsDao = new DocumentDetailsDao();	
		this.villageService = new VillageService();	
		this.urbanService = new UrbanService();
    }

	createProperty = async (propertyData,req) =>{
		try{
		if (propertyData.applicationId === undefined ||propertyData.applicationId === null ||propertyData.applicationId === "" || Number(propertyData.applicationId) === 0) {
            throw new PDEError({ err: "Invalid Property" });
        }
		let documentDbResponse = await this.documentDetailsDao.getOneByFilters({documentId:propertyData.applicationId});	
		if(documentDbResponse == null){
			throw new Error('Document Details not found');
		}
		const { TRAN_MAJ_CODE, TRAN_MIN_CODE } = documentDbResponse.documentSubType || {};

		const isSurrenderOfLease = TRAN_MAJ_CODE === "07" && TRAN_MIN_CODE === "06";

		if (!isSurrenderOfLease && (propertyData.marketValue === undefined ||propertyData.marketValue === null ||propertyData.marketValue === "" || Number(propertyData.marketValue) === 0)) {
            throw new PDEError({ err: "Market Value cannot be zero" });
        }
			 Logger.info(`PropertyService - createProperty ===> ${JSON.stringify(propertyData)}`);
			let seqCount = await this.propertyDao.getByFilters({applicationId:propertyData.applicationId});
			propertyData.seqNumber= seqCount.length === 0 ? 1 : seqCount.length + 1;
			propertyData.propertyId = uuid.v4();
			
			if(propertyData.propertyType.includes("URBAN")){
			
				if(propertyData && propertyData.conveyedExtent && propertyData.conveyedExtent.length>0){
					let value ="0";
					for(let i of propertyData.conveyedExtent){
						if(value === 0){
							value = parseFloat(i.extent)
						}else{
							value = parseFloat(value)+parseFloat(i.extent);
						}
					}
					propertyData.tExtent = value;
				}
			}
			if(propertyData.landUseCode === undefined || propertyData.landUseCode === "" || propertyData.landUseCode === null){
				landUseCodes.map((l)=>{
					if(propertyData.landUse ===l.value){
						propertyData.landUseCode =l.code;
					}
				})
			}
			if(propertyData.propertyType.includes('RURAL')){
				propertyData?.ExtentList?.map(val=>{val['khataNumber']=propertyData.webLandDetails?.occupantKhataNo})
			}
			if(  propertyData.landUseCode != 99 &&(propertyData.landUseCode === undefined  || propertyData.localBodyCode === undefined) ){
				throw new PDEError({err: "Missing LandUseCode/localBodyCode"});
			}
			let mutationEnable = await this.urbanService.getSlotEnabledForSRO(propertyData.sroCode);
			const isVillageEnabledForMutation = await this.urbanService.getUlbCodeOfMuncipalityFromMutationEnabled(propertyData.villageCode);
			let isMutationEnabled = mutationEnable?.[0]?.URBAN_MUTATION_STATUS === 'Y' && isVillageEnabledForMutation.length > 0;

			if (propertyData.propertyType.includes("URBAN") && isMutationEnabled && propertyData.urban_selling_extent === "FULL" && propertyData.ptinNo &&
				propertyData.ptinNo !== "0" && Number(propertyData.ptinNo) !== 0) {
				let assessmentNo = propertyData.ptinNo;
				let ulbCode = String(propertyData.ptinNo).substring(0, 4);
				let marketValue = propertyData.marketValue;

				let response = await this.villageService.getCDMAPropertyDetails(ulbCode, assessmentNo, marketValue, marketValue, req);
				propertyData.payableMutationFee = Number(response.mutationFee) || 0;
			}

			let propertyDb = await this.propertyDao.create(propertyData);
			if(propertyData.propertyType.includes("URBAN")){
				await this.propertyStrDao.create(propertyData);
			}
			 return  propertyDb;
		}catch(ex){
			Logger.error(ex.message);
			console.error("PropertyService - createProperty || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	};	

	createSection47A = async (propertyData) =>{
		try{
		    const newSection47Data = {
				registrationFeePayable:propertyData.rf_p || 0,
				stampDutyFeePayable:propertyData.sd_p || 0,
				transferDutyFeePayable:propertyData.td_p || 0,
				applicationId:propertyData.applicationId || 0,
				sroCode:propertyData.sroCode || 0,
				userCharges: propertyData.userCharges || 0, 
				marketValue: propertyData.marketvalue || 0, 
				considerationValue: propertyData.ConsiderationValue || 0, 
				totalValue: propertyData.totalPayable || 0,
				differentialStampDuty:propertyData.DifferentialStampDuty || 0,
			};

			if (propertyData.Section_47 === "Y") {
				newSection47Data.isSection47 = propertyData.Section_47;
			} else {
				newSection47Data.sectionType = propertyData.SectionType;
			}			
			const savedData = await Section47Db.create(newSection47Data);
           return savedData;
		}catch(ex){
			Logger.error(ex.message);
			console.error("PropertyService - createSection47A || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	};
	getSection47AData = async (applicationId) => {
		try {
			const section47AData = await this.propertyDao.getOneByFilterssection47(applicationId);
			return section47AData;
		} catch (ex) {
			Logger.error(ex.message);
			console.error("PropertyService - getSection47AData || Error: ", ex.message);
			throw constructPDEError(ex);
		}
	};
	
	updateProperty = async (reqData,propertyData)=>{
		try{
			 Logger.info(`PropertyService - updateProperty ===> ${JSON.stringify(reqData)}`);
			let filters ={
				applicationId: reqData.applicationId,
				propertyId: reqData.propertyId
			}

			if(propertyData.propertyType.includes("URBAN")){
			
				if(propertyData && propertyData.conveyedExtent && propertyData.conveyedExtent.length>0){
					let value ="0";
					for(let i of propertyData.conveyedExtent){
						if(value === 0){
							value = parseFloat(i.extent)
						}else{
							value = parseFloat(value)+parseFloat(i.extent);
						}
					}
					propertyData.tExtent = value;
					propertyData.eleSrvcNo = propertyData.eleSrvcNo ||1234567890123;
				}          		
			}
			if(propertyData.landUseCode === undefined || propertyData.landUseCode === "" || propertyData.landUseCode === null){
				landUseCodes.map((l)=>{
					if(propertyData.landUse ===l.value){
						propertyData.landUseCode =l.code;
					}
				})
			}
			if(propertyData.propertyType.includes('RURAL')){
				propertyData?.ExtentList?.map(val=>{val['khataNumber']=propertyData.webLandDetails?.occupantKhataNo})
			}
			let Details = await this.setPropertyDetails(propertyData);
			// if(propertyData.landUseCode === undefined  || propertyData.localBodyCode === undefined ){
			// 	throw new PDEError({err: "Missing LandUseCode / localBodyCode"});
			// }

			let mutationEnable = await this.urbanService.getSlotEnabledForSRO(propertyData.sroCode);
			const isVillageEnabledForMutation = await this.urbanService.getUlbCodeOfMuncipalityFromMutationEnabled(propertyData.villageCode);
			let isMutationEnabled = mutationEnable?.[0]?.URBAN_MUTATION_STATUS === 'Y' && isVillageEnabledForMutation.length > 0;

			if(propertyData.propertyType.includes("URBAN") && isMutationEnabled && propertyData.urban_selling_extent === "FULL" && propertyData.ptinNo &&
				propertyData.ptinNo !== "0" && Number(propertyData.ptinNo) !== 0){
				let assessmentNo = propertyData.ptinNo;
				let ulbCode = String(propertyData.ptinNo).substring(0, 4);
				let marketValue = propertyData.marketValue;

				let response = await this.villageService.getCDMAPropertyDetails(ulbCode, assessmentNo, marketValue, marketValue, reqData);
				Details.PropDetails.payableMutationFee = Number(response.mutationFee) || 0;
			}
			else{
				 Details.PropDetails.payableMutationFee = 0;
			}
			let propertyDb = await this.propertyDao.updateByFilters(filters,Details.PropDetails);
			if(propertyData.propertyType.includes("URBAN")){
				await this.propertyStrDao.updateProperty({propertyId:reqData.propertyId},Details.propStrDetails);
			}
			return  propertyDb;
		}catch(ex){
			Logger.error(ex.message);
			console.error("PropertyService - updateProperty || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}

	getProperties = async (prData) =>{
		try{
			let propertyResponse = [];
			let prDbFilter = {
                applicationId: prData.applicationId
            }
			let propertyData = await this.propertyDao.getByFilters(prDbFilter);
			console.log("PropertyService - getProperties || Property Details Db Response : ",propertyData);
			if(propertyData == null || propertyData.length == 0){
				return propertyResponse;
			}
			for(var i=0;i<propertyData.length; i++){
				let propertyIdFilter ={
					propertyId :propertyData[i].propertyId
				}
				let propertyStructure = await this.propertyStrDao.getOneByFilters(propertyIdFilter);
                let propertyDetails = {...propertyData[i]._doc};
                if(propertyStructure != null)
                    propertyDetails = {...propertyDetails, ...propertyStructure._doc};
				propertyResponse.push(propertyDetails);
			}
			console.log("PropertyService - getProperties || Property Details Response :", propertyResponse);
			return propertyResponse;
		}catch(ex){
			Logger.error(ex.message);
			console.error("PropertyService - getProperties || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}

	deleteProperty = async (prData) =>{
		try{
			let prDbFilter = {
                applicationId: prData.applicationId,
				propertyId: prData.propertyId
            }
			let properties = await this.propertyDao.getOneByFilters(prDbFilter);						
			//statusHistory
			let documentDbResponse = await this.documentDetailsDao.getOneByFilters({documentId:prData.applicationId});
			let user= await  this.user.userFindMethod({loginId:documentDbResponse.userId});
			let Object={
				currentStatus:documentDbResponse.status,
				api:"delete Properties",
				userData:user[0]
			}
			let stausHistoryData= await StatusHistory.findOne({applicationId:prData.applicationId});
			if(!stausHistoryData){
				await StatusHistory.findOneAndUpdate({applicationId:prData.applicationId},{$set:Object},{upsert:true})
			}else if(stausHistoryData && stausHistoryData.currentStatus ==="SYNCED" && documentDbResponse.status === "SYNCED"){

                console.log("Properties - deleteProperties || Synced Document");
				throw new PDEError({name: NAMES.BAD_REQUEST, err: "We cannot delete a synced document PropertyDetails."});
            }
            else{
                await StatusHistory.findOneAndUpdate({applicationId:prData.applicationId},{$set:Object},{upsert:true})
			}


			let propertyData = await this.propertyDao.deleteByFilters(prDbFilter);			
			let propertiesDetails = await this.propertyDao.getByFilters({applicationId: prData.applicationId});
 			
 			if(propertiesDetails.length > 0){
 				const bulkOps = propertiesDetails.map((doc, index) => ({
 					updateOne: {
 						filter: { _id: doc._id },
 						update: { $set: { seqNumber: index + 1 } }
 					}
 				}));
 			
 				await this.propertyDao.bulkUpdate(bulkOps);
 			}
			// for(let i of setSequence){
			// 	if(i.seqNumber != 1 && i.seqNumber > properties.seqNumber){
			// 		let sqNumber = Number(i.seqNumber) - 1;
			// 		await this.propertyDao.updateOneByFilters({_id: i._id}, {seqNumber: sqNumber});
			// 	}
			// }
			let propertyStructure = await this.propertyStrDao.deleteByFilters(prDbFilter);
			console.log("PropertyService - deleteProperty || Property Structure Details Delete Response :", propertyStructure);
			 Logger.info(`PropertyService - deleteProperty  ===> ${JSON.stringify(prDbFilter)}`);
			return "success";
		}catch(ex){
			Logger.error(ex.message);
			console.error("PropertyService - deleteProperty || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}
	OtherProperty = async (propertyData) =>{
		try{
			let seqCount = await this.propertyDao.getByFilters({applicationId:propertyData.applicationId});
			propertyData.seqNumber= seqCount.length === 0 ? 1 : seqCount.length + 1;
			propertyData.propertyId = uuid.v4();
			
			let propertyDb = await this.propertyDao.create(propertyData);
			Logger.info(`PropertyService - OtherProperty ===> ${JSON.stringify(propertyData)}`);
			 return  propertyDb;
		}catch(ex){
			Logger.error(ex.message);
			console.error("PropertyService - OtherProperty || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	};

	setPropertyDetails = async (details)=>{
		let fDetails =[];
		fDetails.PropDetails ={
			applicationId:details.applicationId,
			propertyId: details.propertyId,
			village:details.village,
			villageCode:details.villageCode,
			locality:details.locality,
			habitation:details.habitation,
			habitationOr:details.habitationOr,
			habitationCode:details.habitationCode,
			localBodyType : details.localBodyType,
			localBodyName:details.localBodyName,
			localBodyCode:details.localBodyCode,
			district:details.district,
			ExtentList:details.ExtentList,
			isPrProhibitedSurveyNO:details.isPrProhibitedSurveyNO,
			isPropProhibited:details.isPropProhibited,
			isPrProhibitedDoorNO:details.isPrProhibitedDoorNO,
			sroOffice : details.sroOffice,
			sroCode:details.sroCode,
			propertyType:details.propertyType,
			landUse:details.landUse,
			landUseCode:details.landUseCode,
			isLinkedDocument:details.isLinkedDocument,
			survayNo:details.survayNo,
			northBoundry:details.northBoundry,
			southBoundry:details.southBoundry,
			eastBoundry:details.eastBoundry,
			westBoundry:details.westBoundry,
			conveyedExtent:details.conveyedExtent,
			tExtent: details.tExtent,
			tUnits: details.tUnits,
			seqNumber:details.seqNumber,
			marketValue:details.marketValue,
			ext_Rate:details.ext_Rate,
			isLinkedDocDetails: details.isLinkedDocDetails,
			LinkedDocDetails:details.LinkedDocDetails,
			isExAsPattadhar:details.isExAsPattadhar,
			ispresentExcutent:details.ispresentExcutent,
			leaseDetails:details.leaseDetails,
			exchangeTo:details.exchangeTo,
			urban_selling_extent: details.urban_selling_extent ? details.urban_selling_extent : "",
        	cdma_details: details.cdma_details ? details.cdma_details : "",
			otherPropName:details.otherPropName,
			typeOfProperty:details.typeOfProperty,
			jointOrNot:details.jointOrNot,
			conveyanceType:details.conveyanceType,
			companyShare:details.companyShare,
			lpmNo:details.lpmNo,
			totalExtent:details.totalExtent,
			secratariatWard:details.secratariatWard,
			secratariatWardName:details.secratariatWardName,
			electionWard:details.electionWard,
			electionWardName:details.electionWardName,
			conveyanceValue:details.conveyanceValue,
			registeredState:details.registeredState,
			Go134: details.Go134,
			partyNumber: details.partyNumber,
			payableMutationFee:details.payableMutationFee,
			Go84:details.Go84

		};
		if(details.webLandDetails?.occupantName!=""){
			fDetails.PropDetails.webLandDetails=details.webLandDetails,
			fDetails.PropDetails.freeHoldLands=details.freeHoldLands
		}
		if(details.cdma_details?.length){
			fDetails.PropDetails.cdmaDetails=details.cdmaDetails
		}
		if(details.propertyType.includes("URBAN")){
			fDetails.PropDetails.strType=details.strType;
			if(details.landUseCode == "01"){
				fDetails.PropDetails.eleSrvcNo=Number(details.eleSrvcNo) || 1234567890123
			}
		}
		if(details.propertyType.includes("URBAN")){
			fDetails.propStrDetails ={
				propertyId:details.propertyId,
				propertyType:details.propertyType,
				landUse:details.landUse,
				ward: details.ward,
				block: details.block,
				doorNo: details.doorNo,
				plotNo: details.plotNo,
				survayNo: details.survayNo,
				ptinNo: details.ptinNo,
				extent: details.extent,
				extentUnit: details.extentUnit,
				schedulePropertyType: details.schedulePropertyType,
				layoutNo: details.layoutNo,
				layoutName: details.layoutName,
				reraApprovalNo: details.reraApprovalNo,
				buildingApprovalNo: details.buildingApprovalNo,
				totalFloors: details.totalFloors,
				structure: details.structure,
				conveyedExtent:details.conveyedExtent,
				tExtent:details.tExtent,
				tUnits: details.tUnits,
				appartmentName:details.appartmentName,
				undividedShare: details.undividedShare,
				undividedShareUnit: details.undividedShareUnit,
				flatNo: details.flatNo,
				flatNorthBoundry: details.flatNorthBoundry,
				flatSouthBoundry: details.flatSouthBoundry,
				flatEastBoundry:details.flatEastBoundry,
				flatWestBoundry: details.flatWestBoundry,
				northBoundry: details.northBoundry,
				southBoundry: details.southBoundry,
				eastBoundry: details.eastBoundry,
				westBoundry: details.westBoundry,
				isLinkedDocDetails: details.isLinkedDocDetails,
				LinkedDocDetails:details.LinkedDocDetails,
				leaseDetails:details.leaseDetails,
				exchangeTo:details.exchangeTo,
				cdma_details: details.cdma_details ? details.cdma_details : "",
				payableMutationFee:details.payableMutationFee
 				
			}
		};
		return fDetails;
	}
	
}
module.exports = PropertyService;
