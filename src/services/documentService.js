const { NAMES } = require("../constants/errors");
const CovanantDao = require('../dao/covanantsDao');
const DocumentDetailsDao = require("../dao/documentDetailsDao");
const MasterDataVillageDao = require("../dao/masterDataVillageDao");
const PartiesDao = require("../dao/partiesDao");
const PartySaleDetailsDao = require("../dao/partySaleDetailsDao");
const PaymentDao = require("../dao/PaymentsDao");
const SlotBookingDao = require('../dao/slotDao')
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("../handlers/errorHandler");
const PartySaleService = require("./partySaleService");
const PropertyService = require("./propertyService");
const PaymentService = require('./paymentService');
const PaymentReciptDetailsDao = require('../dao/paymentReciptDao')
const documentModel = require('../model/documentDetailsModel');
const CovanantService = require('./covanantService');
const uuid = require("uuid");
const SlotService = require("./slotService");
const propertyDetailsDao = require("../dao/propertiesDao")
const helper =require('../utils/helper');
const {Logger} = require('../../services/winston');
const moment = require('moment');
const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const VillageService = require("./villageService");
const StatusHistory = require('../model/statusHistoryModel');
const User = require("../dao/userDao");
const path = require('path');
const SlotModel = require('../model/slotModel');
const OdbDao = require("../dao/oracleDbDaos");
const checkCodes = require('../utils/urbanMutationCodes')
const UrbanService = require('../services/urbanServices')
const propertiesModel = require('../model/propertyModel')
const PartiesService = require('../services/partiesService')
const partiesModel = require('../model/partiesModel');
//corn job schema
const PropertyStrDao = require("../dao/propertyStructureDao");
const ekycExemptionStatusDb = require('../model/ekycExemptionStatusModel');

const {decryptWithAESPassPhrase,decryptData} = require('../utils/index');
const fileResolver = require("../utils/fileResolver");
class DocumentService {
    constructor(){
        this.documentDetailsDao = new DocumentDetailsDao();
		this.propertyDao = new propertyDetailsDao();
        this.partySaleDetailsDao = new PartySaleDetailsDao();
        this.masterDataVillageDao = new MasterDataVillageDao();
		this.covanantDao = new CovanantDao();
		this.slotDao = new SlotBookingDao();
        this.partiesDao = new PartiesDao();
		this.paymentDao = new PaymentDao();
		this.paymentReceiptDao= new PaymentReciptDetailsDao();
		this.villageService = new VillageService();
		this.statushistory = new StatusHistory();
		this.user = new User();
		this.odbDao = new OdbDao();
		this.propertyStrDao = new PropertyStrDao();
		this.urbanService = new UrbanService();
		this.propertyService = new PropertyService();
		this.partiesService = new PartiesService()
    }

    createDocument = async (documentReqData) => {
        try {
            var documentDbData = {
                documentId: this.generateDocumentId(documentReqData.sroCode),
                documentType: documentReqData.registrationType,
                documentSubType: documentReqData.documentNature,
                sroOffice: documentReqData.sroOffice,
				sroCode:documentReqData.sroCode,
				district:documentReqData.district,
				distCode:documentReqData.distCode,
				mandal:documentReqData.mandal,
				mandalCode:documentReqData.mandalCode,
				docProcessType:documentReqData.docProcessType ==="Public Data Entry With Upload Document"?"PDE":"PDEWD",
				village:documentReqData.village,
				villageCode:documentReqData.villageCode,
                status: "DRAFT",
				docDownLoadedBy:"N",
				regWith:documentReqData.regWith,
				regWithCode:documentReqData.regWithCode,
				regWithValue:documentReqData.regWithValue,
				docProcessCode:documentReqData.docProcessCode,
                userId: documentReqData.userId,
                executionDate:documentReqData.executionDate,
				stampPurchaseDate:documentReqData.stampPurchaseDate,
                amount: documentReqData.amount,
				noOfStampPapers:documentReqData.noOfStampPapers,
                stampPaperValue: documentReqData.stampPaperValue,
				docsExcutedBy: documentReqData.docsExcutedBy,
				typeOfStamps:documentReqData.typeOfStamps,
				frankingId:documentReqData.frankingId,
				stockHoldingId:documentReqData.stockHoldingId,
				leasePropertyDetails: documentReqData.leasePropertyDetails,
				nonJudicialStamps:documentReqData.nonJudicialStamps,
				goNumber:documentReqData.exemptionType
            };
			if(documentReqData.typeOfStamps=="Non-Judicial Stamp Papers"){
                delete documentDbData['stockHoldingId'];
                delete documentDbData['frankingId'];
            }else if(documentReqData.typeOfStamps=="Franking"){
                delete documentDbData['stockHoldingId'];
            }
            else if(documentReqData.typeOfStamps=="StockHolding"){
                delete documentDbData['frankingId'];
            }
            let documentDbResponse = await this.documentDetailsDao.create(documentDbData);
            console.log("DocumentService - createDocument || Document Details Db Response : ",documentDbResponse );
			Logger.info(`DocumentService - createDocument ===> ${JSON.stringify(documentDbResponse)}`);
            
            var partySaleDetailsDbData = {
                sale_id: uuid.v4(),
                document_id: documentDbData.documentId
            };
        
            let partySaleDetailsDbResponse = await this.partySaleDetailsDao.create(partySaleDetailsDbData);
            console.log("DocumentService - createDocument || Party Sale Details Db Response : ",partySaleDetailsDbResponse );
			Logger.info(`DocumentService - createDocument ===> ${JSON.stringify(partySaleDetailsDbResponse)}`);

            var documentResponse = {
                applicationId : documentDbData.documentId,
                registrationType : documentReqData.registrationType,
                documentNature : documentReqData.documentNature,
                district : documentReqData.district,
                sroOffice : documentReqData.sroOffice,
				sroCode:documentReqData.sroCode,
				docProcessType:documentReqData.docProcessType,
                executionDate:documentReqData.executionDate,
				stampPurchaseDate:documentReqData.stampPurchaseDate,
				noOfStampPapers:documentReqData.noOfStampPapers,
                amount: documentReqData.amount,
				docDownLoadedBy:"N",
				regWith:documentReqData.regWith,
                stampPaperValue: documentReqData.stampPaperValue,
				docsExcutedBy: documentReqData.docsExcutedBy,
				typeOfStamps:documentReqData.typeOfStamps,
				frankingId:documentReqData.frankingId,
				stockHoldingId:documentReqData.stockHoldingId,
				leasePropertyDetails: documentReqData.leasePropertyDetails
            }
            return documentResponse;
        } catch (error) {
			Logger.error(error.message);
            console.error("DocumentService - createDocument ||  Error : ", error.message);
            throw constructPDEError(error);
        }
    }

     updateDocument = async (documentReqData,user) => {
        try {
            var documentDbFilter = {
                documentId: documentReqData.applicationId
            };
			let propertiesData = await this.propertyDao.getDataByAggregation({ applicationId: documentReqData.applicationId });
			for (let propertyData of propertiesData) {
				let filters = {
				applicationId : propertyData.applicationId,
				propertyId: propertyData.propertyId
				}				
				let propType = propertyData.propertyType;
        		if (typeof propType === 'string') propType = [propType];
				const isUrban = propType?.some(type => type.toUpperCase().includes('URBAN'));
				if(isUrban){
					if(propertyData.landUse && propertyData.landUse.trim() != "" && propertyData.landUse != "Cash (Partition Only)"){							
						let cdmaDetails = propertyData.cdma_details;
						if(cdmaDetails.length>0){
							let	cdma = JSON.parse(cdmaDetails);
							if (cdma?.applicationNumber) {
								console.log(`Skipped when application Number is Exist`);
								continue;
							}					
							let sroCheck = await this.urbanService.getUlbCodeOfMuncipality(propertyData.sroCode);							
							let mutationEnable = await this.urbanService.getSlotEnabledForSRO(propertyData.sroCode);
							const isVillageEnabledForMutation = await this.urbanService.getUlbCodeOfMuncipalityFromMutationEnabled(propertyData.villageCode);
							let isMutationEnabled = mutationEnable?.[0]?.URBAN_MUTATION_STATUS === 'Y' && isVillageEnabledForMutation.length > 0;
							if (isMutationEnabled) {
								propertyData.isUrbanMutationEnabled = true;
							}else{
								propertyData.isUrbanMutationEnabled = false;
							}
							const assesmentNumber = cdma?.propertyID;															
							if (assesmentNumber && assesmentNumber !== 0) {
								const isMutationAccess = assesmentNumber.toString().substring(0, 4) === sroCheck[0].MUNI_CODE.toString();
								if (!isMutationAccess) {
									throw new Error("ULB code is not matching with the jurisdiction");
								}
							}
							const isUrbanMutationNeeded = await this.isUrbanMutationNeeded(propertyData)
							let parties = await partiesModel.find({applicationId: documentReqData.applicationId, partyCode:{$in: ["RE","AY","TE","CL","LE","ME","DE","OE","AP","SP","WI"] }});
							let partyOCI = parties.some(p => p.partyType === "OCI");
							if(isMutationEnabled && cdma?.propertyID !== 0 && propertyData.urban_selling_extent == "FULL" && isUrbanMutationNeeded === true && partyOCI === false){
								let urbanCreateResponse = await this.urbanService.createUrbanPropertySrvc(propertyData);
								//Logic 1 if there is owner details not updated on the create API.
								//propertyData.cdma_details = JSON.stringify(urbanCreateResponse);
								const mutationPaymentDue = {
									propertyDue: parseInt(urbanCreateResponse.propertyDue) < 0 ? 0 : parseInt(urbanCreateResponse.propertyDue) || 0,
									waterTaxDue: parseInt(urbanCreateResponse.waterTaxDue) < 0 ? 0 : parseInt(urbanCreateResponse.waterTaxDue) || 0,
									sewerageDue: parseInt(urbanCreateResponse.sewerageDue) < 0 ? 0 : parseInt(urbanCreateResponse.sewerageDue) || 0,
									mutationDues: parseInt(urbanCreateResponse.mutationDues) < 0 ? 0 : parseInt(urbanCreateResponse.mutationDues) || 0,
								};
								const totalDue = mutationPaymentDue.propertyDue + mutationPaymentDue.waterTaxDue + mutationPaymentDue.sewerageDue;
								propertyData.mutationPaymentDue = totalDue < 0 ? 0:totalDue;
								propertyData.mutationFee = mutationPaymentDue.mutationDues;
								cdma["applicationNumber"] = urbanCreateResponse.applicationNumber;
								cdma["mutationFee"] = urbanCreateResponse.mutationFee;
								cdma["documentvalue"] = urbanCreateResponse.documentvalue;
								let ownerNames = cdma.ownerNames;
								if (Array.isArray(ownerNames)) {
									for(let owner of ownerNames){
										owner.gender = owner.gender?owner.gender:"";
									}
								}else{
									ownerNames["gender"] = "";
								}
								cdma.ownerNames = ownerNames;
								propertyData.cdma_details = JSON.stringify(cdma);
							}else{
								propertyData.mutationPaymentDue =  0;
								propertyData.mutationFee = 0;
							}
							let Details = await this.propertyService.setPropertyDetails(propertyData);
							Details.PropDetails.mutationPaymentDue = propertyData.mutationPaymentDue;
							Details.PropDetails.mutationFee = propertyData.mutationFee;		
							await this.propertyDao.updateByFilters(filters,propertyData);		
						}
					}
				}		
			}
			await this.partiesService.presenterCheck(documentReqData)				
            var documentDbData = {};
			if(documentReqData && documentReqData?.docDownLoadedBy){
				documentDbData= {
					docDownLoadedBy: documentReqData.docDownLoadedBy
				};
			}else if(documentReqData.status){
				documentDbData= {
					status: documentReqData.status,
					noOfDocuments: documentReqData.noOfDocuments,
					tmarketValue:documentReqData.tmarketValue
				};
			}
			if(Object.keys(documentReqData).includes('GO')){
				delete documentReqData.applicationId;
				documentDbData.ConcessionDutyFeeData = {...documentReqData};
			}
			 else if( documentReqData?.uc_p || (documentReqData.tranMajCode == '08' && documentReqData.tranMinCode == '06')){
				documentDbData.dutyFeeData={
					rf_p:documentReqData?.rf_p,
					sd_p:documentReqData?.sd_p,
					td_p:documentReqData?.td_p,
					uc_p:documentReqData?.uc_p,
					pa_p:documentReqData?.pa_p
				}
			}
			if(documentReqData?.AttendanceDetails){
				documentDbData.AttendanceDetails = documentReqData?.AttendanceDetails
			}
			if(documentReqData?.amount){
				documentDbData.amount = documentReqData?.amount
			}
			if(documentReqData?.leasePropertyDetails){
				documentDbData.leasePropertyDetails = documentReqData?.leasePropertyDetails
			};			
            let documentDbResponse = await this.documentDetailsDao.updateOneByFilters(documentDbFilter, documentDbData);
			if(documentReqData.status!=="" && documentReqData.status==="SUBMITTED"){
				if(user?.loginMobile?.length==10){
					await this.villageService.sendSMSForApproveReject(user.loginMobile,"SUBMIT",documentDbFilter.documentId)
				}
			}
            console.log("DocumentService - updateDocument || Document Update Db Response : ",documentDbResponse );
			Logger.info(`DocumentService - updateDocument ===> ${JSON.stringify(documentDbResponse)}`);

            return documentDbResponse;
        } catch (error) {
			Logger.error(error.message);
            console.error("DocumentService - updateDocument ||  Error : ", error.message);
            throw constructPDEError(error);
        }
    }

	isUrbanMutationNeeded = async (propertyData)=>{
		let mutCode = await this.documentDetailsDao.getByFilters({documentId: propertyData.applicationId});
		let major_code = mutCode[0]?.documentSubType?.TRAN_MAJ_CODE;
		let minor_code = mutCode[0]?.documentSubType?.TRAN_MIN_CODE;
		const isMutationNeedMajor = checkCodes.URBAN_MUTATION_ACCEPT_MAJOR_CODES.includes(major_code);
		if(isMutationNeedMajor){
			return checkCodes.URBAN_MUTATION_ACCEPT_MINOR_CODES[major_code].includes(minor_code)
		}
		return false
	};

    getDocumentDetails = async (documentData) => {
        try {
			Logger.info(`DocumentService - getDocumentDetails ===> ${JSON.stringify(documentData)}`);
			const docIdExist = Object.keys(documentData).includes('documentId');
            var documentDbFilter = {...documentData};
			let documentDbResponse;
			let documentResponseList =[];
			if(docIdExist === true){
				documentDbResponse= await this.documentDetailsDao.getOneByFilters(documentDbFilter);
				if(documentDbResponse == null || documentDbResponse.length == 0){
					console.log("DocumentService - getDocumentDetails || No Document Present");
					throw new PDEError({name: NAMES.NOT_FOUND, err: "No Document Present"});
				}
				console.log("DocumentService - getDocumentDetails || Document Details Db Response : ",documentDbResponse );
				let partySaleService = new PartySaleService();
				let partiesDetails = await partySaleService.getPartySalesFromDocumentId(documentDbResponse.documentId);
				if (partiesDetails && Array.isArray(partiesDetails.executent) ) {
    			 	partiesDetails.executent.forEach((executant, index) => {
        				if (executant.aadhaar && executant.aadhaar.length > 12) {            				
							let decryptedData = Buffer.from(executant.aadhaar, 'base64').toString('utf-8');
    						decryptedData = decryptData(decryptedData);
            				executant.aadhaar = decryptedData;            				
        				}							
						if(executant.represent && Array.isArray(executant.represent)){
							executant.represent.forEach((reprs, index) => {
								if (reprs.aadhaar && reprs.aadhaar.length > 12) {									
									let decryptedData = Buffer.from(reprs.aadhaar, 'base64').toString('utf-8');
    								decryptedData = decryptData(decryptedData);
									reprs.aadhaar = decryptedData;									
								}
							});
						}
 
    				}); 			
				}
				if (partiesDetails && Array.isArray(partiesDetails.claimant)) {
    				partiesDetails.claimant.forEach((claimant, index) => {
						if (claimant.aadhaar && claimant.aadhaar.length > 12) {							
							let decryptedData = Buffer.from(claimant.aadhaar, 'base64').toString('utf-8');
    						decryptedData = decryptData(decryptedData);
							claimant.aadhaar = decryptedData;							
						}						
						if(claimant.represent && Array.isArray(claimant.represent)){
							claimant.represent.forEach((reprs, index) => {
								if (reprs.aadhaar && reprs.aadhaar.length > 12) {									
									let decryptedData = Buffer.from(reprs.aadhaar, 'base64').toString('utf-8');
    								decryptedData = decryptData(decryptedData);
									reprs.aadhaar = decryptedData;									
								}
							});
						}
					});
				}
				console.log(partiesDetails, "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
                let property_details = {
                    applicationId : documentDbResponse.documentId
                }
                partiesDetails.property= [];
                let propertyService = new PropertyService();
                partiesDetails.property = await propertyService.getProperties(property_details);
				partiesDetails.Section47= [];
                partiesDetails.Section47 = await propertyService.getSection47AData(property_details);
				partiesDetails.payment =[];
				let paymentService = new PaymentService();
				let payment = await paymentService.getPayment(documentDbResponse.documentId);
				partiesDetails.covanants ={};
				let covanantService = new CovanantService();
				partiesDetails.covanants = await covanantService.getCovanantsById(documentDbResponse.documentId)
				let documentDate;
				if(documentDbResponse && documentDbResponse.createdAt !== undefined){
					documentDate =  this.returnDate(documentDbResponse.createdAt);
				}
				let slot_details = {
					applicationId:documentDbResponse.documentId,sroOfcNum:documentDbResponse.sroCode
				}
				let slotService = new SlotService();

				let excuteDate = this.returnDate(documentDbResponse.executionDate);
				let stmpDate = this.returnDate(documentDbResponse.stampPurchaseDate);
				var documentResponse = {
					applicationId : documentDbResponse.documentId,
					registrationType : documentDbResponse.documentType,
					documentNature : documentDbResponse.documentSubType,
					status: documentDbResponse.status,
					sroOffice : documentDbResponse.sroOffice,
					sroCode: documentDbResponse.sroCode,
					district : documentDbResponse.district,
					mandal:documentDbResponse.mandal,
					mandalCode:documentDbResponse.mandalCode,
					village:documentDbResponse.village,
					villageCode:documentDbResponse.villageCode,
					regWith:documentDbResponse.regWith,
					docProcessType : documentDbResponse.docProcessType,
					dutyFeeData:documentDbResponse.dutyFeeData,
					tmarketValue:documentDbResponse.tmarketValue,
					stampPaperValue:documentDbResponse.stampPaperValue,
					noOfStampPapers:documentDbResponse.noOfStampPapers,
					nonJudicialStamps:documentDbResponse.nonJudicialStamps,
					docDownLoadedBy:documentDbResponse.docDownLoadedBy,
                    executionDate:excuteDate,
                    stampPurchaseDate:stmpDate,
                    amount: String(documentDbResponse.amount),
                    stampPaperValue: String(documentDbResponse.stampPaperValue),
					executent: partiesDetails.executent,
					claimant: partiesDetails.claimant,
					witness:partiesDetails.witness,
					Representative:partiesDetails.Representative,
					presenter: partiesDetails.presenter,
					property:partiesDetails.property,
					covanants:partiesDetails.covanants,
					date:documentDate,
					ConcessionDutyFeeData: documentDbResponse.ConcessionDutyFeeData,
					esignExecuted: documentDbResponse.esignExecuted,
					docsExcutedBy: documentDbResponse.docsExcutedBy,
					typeOfStamps:documentDbResponse.typeOfStamps,
					frankingId:documentDbResponse.frankingId,
					stockHoldingId:documentDbResponse.stockHoldingId,
					leasePropertyDetails: documentDbResponse.leasePropertyDetails,
					section47A:partiesDetails?.Section47 ? partiesDetails?.Section47 : partiesDetails?.Section47A6
				}
				let SlotDetails = await slotService.getSlotsOnDay(slot_details);
				// if(documentDbResponse.status === "SLOT BOOKED"){
				// // if(documentDbResponse.status === "SLOT BOOKED" || documentDbResponse.status === "DRAFT"){
				// 	let getSlots ={};
				// 	if(SlotDetails.length > 0){
				// 		SlotDetails.forEach( (e)=>{
				// 			getSlots.slotDate =  moment(e.dateForSlot).format("DD/MM/YYYY");
				// 			e.slots.map((slot)=>{
				// 				if(slot.applicationId == documentDbResponse.documentId){
				// 					getSlots.slotTime = slot.slotTime;
				// 				}
				// 			})
				// 		})
				// 		// SlotDetails.forEach((sl)=>{
				// 		// 	getSlots.slotTime = sl.slots.slotTime;
				// 		// 	getSlots.applicationId = sl.slots.applicationId;
				// 		// 	getSlots.slotDate=moment(sl.dateForSlot).format("DD/MM/YYYY");
				// 		// 	getSlots.sroOffice = sl.sroOffice;
				// 		// 	getSlots.sroNum = sl.sroOfcNum;

				// 		// })
				// 		documentResponse.slots = getSlots;
				// 	}
				// }
				// if(documentDbResponse.status === "SLOT BOOKED" || documentDbResponse.status === "DRAFT"){
					let getSlots ={};
					if(SlotDetails.length > 0){
						SlotDetails.forEach( (e)=>{
							getSlots.slotDate =  moment(e.dateForSlot).format("DD/MM/YYYY");
							// e.slots.map((slot)=>{
								if(e.applicationId == documentDbResponse.documentId){
									getSlots.slotTime = e.slotTime;
									getSlots.isAuthenticateThroughQr = e.isAuthenticateThroughQr ? e.isAuthenticateThroughQr : false;
								}
							// })
						})
						documentResponse.slots = getSlots;
					}
				// }
				documentResponse.payment  = payment != null || payment != undefined ? payment :[];
				return documentResponse;
			}else{
				documentDbResponse= await this.documentDetailsDao.getByFilters(documentDbFilter);
				if(documentDbResponse == null || documentDbResponse.length == 0){
					console.log("DocumentService - getDocumentDetails || No Document Present");
					// throw new PDEError({name: NAMES.NOT_FOUND, err: "No Document Present"});
                    return [];
				}
				let slotService = new SlotService();

				for(var i=0; i<documentDbResponse.length; i++){
					let documentDate;
					if(documentDbResponse[i] && documentDbResponse[i].createdAt !== undefined){
						documentDate = await this.returnDate(documentDbResponse[i].createdAt);
					}
					var documentResponse = {
						applicationId : documentDbResponse[i].documentId,
						registrationType : documentDbResponse[i].documentType,
						documentNature : documentDbResponse[i].documentSubType,
						docProcessType : documentDbResponse[i].docProcessType,
						status: documentDbResponse[i].status.toUpperCase(),
						sroDistrict: documentDbResponse[i].district,
						sroOffice : documentDbResponse[i].sroOffice,
						sroCode:documentDbResponse[i].sroCode,
                        executionDate:documentDbResponse[i].executionDate,
                        stampPurchaseDate:documentDbResponse[i].stampPurchaseDate,
                        amount: documentDbResponse[i].amount,
                        stampPaperValue: documentDbResponse[i].stampPaperValue,
						leasePropertyDetails: documentDbResponse[i].leasePropertyDetails,
						date:documentDate
					}
					let slot_details = {
						applicationId: documentDbResponse[i].documentId
						// applicationId:documentResponse.applicationId,sroOfcNum:documentResponse.sroCode
					}
					
					let SlotDetails = await slotService.getSlotsOnDay(slot_details);
					// let PropertyDetails = await propertyService.getProperties(slot_details);
					// console.log("::::::::::::::::::::::::::SLOTS::::::::::::::::::::::::::::::::::::::::",SlotDetails)
					// if(documentDbResponse[i].status === "SLOT BOOKED" && documentData.status === "SLOT BOOKED"){
						let getSlots ={};
						if(SlotDetails.length > 0){
							SlotDetails.forEach( (e)=>{
								getSlots.slotDate =  moment(e.dateForSlot).format("DD/MM/YYYY");
								// e.slots.map((slot)=>{
									if(e.applicationId == documentDbResponse[i].documentId){
										getSlots.slotTime = e.slotTime;
										getSlots.isAuthenticateThroughQr = e.isAuthenticateThroughQr ? e.isAuthenticateThroughQr : false
									}
								// })
							})
							documentResponse.slots = getSlots;
						}
					// }
					// if(documentDbResponse[i].status === "SLOT BOOKED" || documentDbResponse[i].status === "DRAFT"){
					// 	let getSlots ={};
					// 	if(SlotDetails.length > 0){
					// 		// SlotDetails.forEach( (e)=>{
					// 		// 	getSlots.slotDate =  moment(e.dateForSlot).format("DD/MM/YYYY");
					// 		// 	e.slots.map((slot)=>{
					// 		// 		if(slot.applicationId == documentDbResponse.documentId){
					// 		// 			getSlots.slotTime = slot.slotTime;
					// 		// 		}
					// 		// 	})
					// 		// })
					// 		SlotDetails.forEach((sl)=>{
					// 			getSlots.slotTime = sl.slots.slotTime;
					// 			getSlots.applicationId = sl.slots.applicationId;
					// 			getSlots.slotDate=moment(sl.dateForSlot).format("DD/MM/YYYY");
					// 			getSlots.sroOffice = sl.sroOffice;
					// 			getSlots.sroNum = sl.sroOfcNum;
	
					// 		})
					// 		documentResponse.slots = getSlots;
					// 	}
					// }
					// let matchingProperties = PropertyDetails.filter(p => p.applicationId === documentDbResponse[i].documentId);
					let propertyFilter = {sroCode:{$ne:documentDbResponse[i].sroCode},applicationId: documentDbResponse[i].documentId};
					let PropertyDetails = await this.documentDetailsDao.getPropertybyFilters(propertyFilter);
					if (PropertyDetails.length>0)
                     documentResponse.isAnyWhereDoc= true;
				    else
				      documentResponse.isAnyWhereDoc= false;
	 			    documentResponseList.push(documentResponse);

				}
				// console.log(documentResponseList,'@@@@@@@@@')
				return documentResponseList;
			}
        } catch (error) {
			Logger.error(error.message);
            console.error("DocumentService - getDocumentDetails ||  Error : ", error);
            throw constructPDEError(error);
        }
    }

    deleteDocument = async (documentId) => {
        try {
            let documentDbFilter = {
                documentId: documentId
            };
            let documentDbResponse = await this.documentDetailsDao.getOneByFilters(documentDbFilter);
            console.log("DocumentService - deleteDocument || Document Details Db Response : ",documentDbResponse );
			if(documentDbResponse && documentDbResponse.status ==="SYNCED"){
				console.log("DocumentService - deleteDocument || Synced Document");
				throw new PDEError({name: NAMES.BAD_REQUEST, err: "We cannot delete a synced document."});
			}
			if(documentDbResponse == null || documentDbResponse.length == 0 ){
				console.log("DocumentService - deleteDocument || No Document Present");
				throw new PDEError({name: NAMES.NOT_FOUND, err: "No Document Present"});
			}

			//statusHistory
			let user= await  this.user.userFindMethod({loginId:documentDbResponse.userId});
			let Object={
				currentStatus:documentDbResponse.status,
				api:"delete Documents along with Parties",
				userData:user[0]
			}
			let stausHistoryData= await StatusHistory.findOne({applicationId:documentDbResponse.documentId});
			if(!stausHistoryData){
				await StatusHistory.findOneAndUpdate({applicationId:documentDbResponse.documentId},{$set:Object},{upsert:true})
			}else if(stausHistoryData && stausHistoryData.currentStatus ==="SYNCED"){

                console.log("PartiesService - deleteDocument || Synced Document");
				throw new PDEError({name: NAMES.BAD_REQUEST, err: "We cannot delete a synced Document."});
            }else if(stausHistoryData && stausHistoryData.currentStatus ==="SYNCED IN PROGRESS"){

                console.log("PartiesService - deleteDocument || Synced Document");
				throw new PDEError({name: NAMES.BAD_REQUEST, err: "We cannot delete the Document."});
            }
            else{
                await StatusHistory.findOneAndUpdate({applicationId:documentDbResponse.documentId},{$set:Object},{upsert:true})
			}
			
            //Removed Status Check
            // if(documentDbResponse.status != "Draft"){
            //     console.log("DocumentService - deleteDocument || Docuement Status is not in Draft");
			// 	throw new PDEError({name: NAMES.BAD_REQUEST, err: "Docuement Status is not in Draft"});
            // }
            // Delete the document
            await this.documentDetailsDao.deleteOneByFilters(documentDbFilter);
            let partySaleDbFilter = {
                document_id: documentId
            };

            //Get Party Sale Details
            let partySaleDbResponse = await this.partySaleDetailsDao.getOneByFilters(partySaleDbFilter);
            console.log("DocumentService - deleteDocument || Party Sale Db Response : ",partySaleDbResponse );
            if(partySaleDbResponse == null || partySaleDbResponse.length == 0 ){
				return "success";
			}
            //Delete the party Sale
            await this.partySaleDetailsDao.deleteOneByFilters(partySaleDbFilter);

            let partyIds = [];
            //Get All PartyId's
            partyIds.push(partySaleDbResponse.executant_party_ids);
            partyIds.push(partySaleDbResponse.claimant_party_ids);
            if(partyIds.length == 0){
                return "success";
            }

            let partyDbFilter = {
                _id: {
                    $in: partyIds             
                }
            }

            let partyDbData = await this.partiesDao.getByFilters(partyDbFilter);
            console.log("DocumentService - deleteDocument || Party Db Response : ",partyDbData );
            //Check if anyone is having represents add it to the db
            for(var i=0; i<partyDbData.length; i++){
                if(partyDbData[i].represent != null && partyDbData[i].represent.length > 0){
                    partyIds.push(partyDbData[i].represent);
                }
            }

            partyDbFilter = {
                _id: {
                    $in: partyIds             
                }
            }
            console.log("DocumentService - deleteDocument || Party Db Filter : ",partyDbFilter );
            //Delete All the entites
            await this.partiesDao.deleteManyByFilters(partyDbFilter);
			//Properties Delete
			const properties = await propertiesModel.find({ applicationId: documentId });        	

        	for (let property of properties) {
				let cdmaDetails = property?.cdma_details;				

            	if (typeof cdmaDetails === "string" && cdmaDetails.trim().startsWith("{") && cdmaDetails.trim() !== "{}") {
                try {
                    cdmaDetails = JSON.parse(cdmaDetails);					
                } catch (e) {
                    console.error("Failed to parse cdma_details JSON string for property:", property._id);
                    continue;
                }
            }

				const assessmentNumber = cdmaDetails?.propertyID;				
				const cdmaApplicationNumber = cdmaDetails?.applicationNumber;				
            	if (cdmaApplicationNumber && assessmentNumber && assessmentNumber !== 0) {
					const ulbCodeFromAssessment = assessmentNumber.substring(0, 4);					
					const urbanReqData = {
						ulbCode: ulbCodeFromAssessment,
						assessmentNumber,
						applicationNumber: cdmaApplicationNumber
					};
					
                	try {
						const urbanDeleteResponse = await this.urbanService.deletePropertySrvc(urbanReqData);						
                	} catch (urbanError) {
                    	console.error("Error deleting urban property for property",urbanError.message);
                	}
            	}
        }
            return "success";

        } catch (error) {
			Logger.error(error.message);
            console.error("DocumentService - deleteDocument ||  Error : ", error.message);
            throw constructPDEError(error);
        }
    }



	uploadFile = async (reqData,reqFiles)=>{
		try {
			// let Url =req.protocol + "://" + req.get("host") + "/uploads"
			let tempObj= {
				fileName:reqData.fileName,
				filePath:reqFiles.image[0].path,
				downloadLink:reqFiles.image[0].mimetype === "application/pdf" ? `${reqData.documentId}/${reqData.fileName}.pdf` :`${reqData.documentId}/${reqData.fileName}.png`,
				timeStamp:new Date()
			}
			const query = {"documentId": reqData.documentId}
			const findUserDocs = await this.documentDetailsDao.getOneByFilters(query);
			if(findUserDocs?.documents?.length === 0){
				const emUser = await  this.documentDetailsDao.updateOneByFilters(query,{$push:{documents:tempObj}})
				return emUser;
			}else{
				const fileExist = findUserDocs.documents.some(doc => doc.fileName === reqData.fileName);
				if(fileExist) {
					const fileData =await this.documentDetailsDao.updateOneByFilters
					(
						{
							documentId:reqData.documentId,
							documents:{$elemMatch:{fileName:{$eq: reqData.fileName}}}
						},
						{
							$set:{"documents.$":tempObj}
						},
					);                      
					return fileData
				}else{
					const fileData =await this.documentDetailsDao.updateOneByFilters
					(
						{
							documentId:reqData.documentId,
							documents:{$elemMatch:{fileName:{$ne: reqData.fileName}}}
						},
						{
							$push:{"documents":tempObj}
						}
					);
					return fileData;
				}
			}
		} catch (ex) {
			Logger.error(ex.message);
			console.error("DocumentService - upload ||  Error : ", ex.message);
			throw constructPDEError(ex);
		}
	}
	getImages = async(reqData)=>{
		try{
			const query ={documentId:reqData.documentId};
			let getImages = await this.documentDetailsDao.getOneByFiltersByOption(query,{documents:1});
			if(getImages != null){
				return getImages
			}else{
				throw PDEError("No Images Found")
			}
		}catch(ex){
			console.error("DocumentService - getImages ||  Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}

	getDocDetails = async(reqData)=>{
		try{
			const query ={documentId:reqData.documentId};
			let fData = await this.documentDetailsDao.getOneByFilters(query);
			if(fData != null){
				const Obj ={
					docProcessType : fData.docProcessType,
					docProcessCode : fData.docProcessCode,
					regWith        : fData.regWith,
					regWithCode    : fData.regWithCode,
					docDownLoadedBy: fData.docDownLoadedBy,
					esignExecuted: fData.esignExecuted
				}
				return Obj;
			}else{
				throw new PDEError({name: NAMES.NOT_FOUND, err: "No Data Found"})
			}
		}catch(ex){
			console.error("DocumentService - getDocDetails ||  Error : ", ex);
            throw constructPDEError(ex);
		}
	}
	getSignedDocument = async(documentId)=>{
		try{
			let docDetails = await this.documentDetailsDao.getOneByFilters({ documentId : documentId });
			if(docDetails == null){
				throw new Error('Document Details not found');
			}
			let [type ,restData]= docDetails.documentType.TRAN_DESC.split(" ");
			let filePath = null;
			// let docDirectoryPath = path.join(__dirname, `../../../../../pdfs/${documentId}/`);
			let docDirectoryPath = path.join(
				`${documentId}/`
			);
			const engDocsPath = fileResolver.resolve(`${docDirectoryPath}signedEngDocs.pdf`);
			// if (fs.existsSync(`${docDirectoryPath}signedEngDocs.pdf`)) {
            //     filePath = `${docDirectoryPath}engDocs.pdf`;
            // }

			if(fs.existsSync(engDocsPath)) {
				filePath = fileResolver.resolve(`${docDirectoryPath}engDocs.pdf`);
			}

			const telDocsPath = fileResolver.resolve(`${docDirectoryPath}signed${type}Telugu.pdf`);

			// if (fs.existsSync(`${docDirectoryPath}signed${type}Telugu.pdf`)) {
            //     filePath = `${docDirectoryPath}signed${type}Telugu.pdf`;
            // }

			if(fs.existsSync(telDocsPath)) {
				filePath = telDocsPath;
			}
	
			if(filePath ==  null){
				throw new Error('File not found');
			}

			let bitmap = fs.readFileSync(filePath);
            let convertBase64 = bitmap.toString('base64');

			return {
				dataBase64: convertBase64
			}
			
		}catch(ex){
			console.error("DocumentService - getDocDetails ||  Error : ", ex);
            throw constructPDEError(ex);
		}
	}

	delImgesById = async(reqData)=>{
		try{
			const filters ={documentId:reqData.documentId,"documents":{$elemMatch: {"fileName": reqData.fileName}}};
			const update ={
				$pull: {
					documents: {
						fileName: reqData.fileName
					}
				}
			}
			let getImages = await this.documentDetailsDao.delImagesById(filters,update);
			if(getImages != null){
				return getImages
			}else{
				throw PDEError("No Images Found")
			}
		}catch(ex){
			Logger.error(ex.message);
			console.error("DocumentService - delImgesById ||  Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}


    generateDocumentId(sroCode) {
		let yr = new Date().getFullYear();
		yr = String(yr).substring(2,4)
		if(String(sroCode).length === 3){
			let srCode = "0" + String(sroCode);
			return yr+"" +srCode+ "" + Math.round(+new Date()/1000)
		}else{
			return yr+"" +sroCode+ "" + Math.round(+new Date()/1000)
		}
        // return "AP20221668621420609";
    }

	returnDate = (d1) => {
		let d = (new Date(`${d1}`) ).toISOString().slice(0, -1);
		let y = new Date(d);
		return `${y.getDate() > 9 ? y.getDate() : `0${y.getDate()}`}/${(y.getMonth() + 1) > 9 ? (y.getMonth() + 1) : `0${y.getMonth() + 1}`}/${y.getFullYear()}`
		
	}

	getDocsForEsign = async (userId) => {
		try {
			const filters1 = {'userId': userId, 'status': 'SYNCED', 'docProcessType': "PDEWD", '$or': [{'esignExecuted': false}, {'esignExecuted': {'$exists': false}}]};
			const lookUp = {
				"from": 'paymentreceipts',
				"localField": 'documentId',
				"foreignField": 'applicationNumber',
				"as": 'docs'
			};
			const filters2 = {
				'docs': {
					$elemMatch: {'transactionStatus': "Success"}
				}
			};
			const project = {
				"documentId": 1,
				'documentSubType': 1,
				"sroOffice": 1,
				"sroCode": 1,
				'status': 1,
				'docs': 1,
				'userId': 1,
				"documentType": 1,
				'docDownLoadedBy': 1
			};
			let results = await this.documentDetailsDao.getDataByJoin(filters1, lookUp, filters2, project);
			
			return results;
		} catch(ex){
			Logger.error(ex.message);
			console.error("DocumentService - getDocsForEsign ||  Error : ", ex.message);
			throw constructPDEError(ex);
		}
}
updateTdValue = async (docsData)=>{
	try{
		let filters ={
			documentId: docsData.applicationId
		}
		let updateData={$set:{tdAllocation : docsData.updateData}}
		let propertyDb = await documentModel.updateMany(filters,updateData)
		return  propertyDb;
	}catch(ex){
		Logger.error(ex.message);
		console.error("PropertyService - updateTdValue || Error : ", ex);
		throw constructPDEError(ex);
	}
}

getSimpleListOfDocs = async (query) => {
	try {
		let docs = await this.documentDetailsDao.getByFilters(query);
		return docs;
	} catch (ex) {
		Logger.error(ex.message);
		console.error("DocumentService - getDocsForEsign ||  Error : ", ex.message);
		throw constructPDEError(ex);
	}
}

statusUpdate =async (docId,sd) => {
	try {
		
		let documentDbResponse = await this.documentDetailsDao.getOneByFilters({documentId:docId});
		//statusHistory
		let user= await  this.user.userFindMethod({loginId:documentDbResponse.userId});
		let Object={
			currentStatus:sd ==="BS" ? "SYNCED IN PROGRESS" : "SYNCED",
				api:"Updated status as Synced while submitting the Application",
				userData:user[0]
		}
		let docsData = await StatusHistory.findOneAndUpdate({applicationId:docId},{$set:Object},{upsert:true})
		return docsData;
	} catch (ex) {
		Logger.error(ex.message);
		console.error("DocumentService - getDocsForEsign ||  Error : ", ex.message);
		throw constructPDEError(ex);
	}
}

documentPreviewSRVC = async (reqData) => {
    try {
    	// const filePath = `../../../../../pdfs/${reqData.documentId}/${reqData.fileName}`;
	   const filePath = path.join(`${reqData.documentId}`, reqData.fileName);
	   console.log("DocumentService - documentPreviewSRVC || filePath : ",filePath);
    	// const pdfPath = path.join(__dirname, filePath);
	   const pdfPath = await fileResolver.resolve(filePath);
	   console.log("DocumentService - documentPreviewSRVC || pdfPath : ",pdfPath);
      const pdfBuffer = await require('fs').promises.readFile(pdfPath);
      const base64Pdf = pdfBuffer.toString('base64');
      return base64Pdf;
    } catch (ex) {
      console.error("Error in PDFPreview:", ex);
      throw ex;
    }
  }
QrDocmentUpdate = async (reqData)=>{
	let update={}, docsData;
	if(reqData?.otpfrom =="mobile"){
		update ={slotOtp: decryptWithAESPassPhrase(reqData.otp,"123456")}
		docsData = await this.documentDetailsDao.updateOneByFilters({documentId:reqData.applicationId},update);
	}else{
		update = reqData.status ? {status:reqData.status,isAuthenticateThroughQr:true} : {isAuthenticateThroughQr:true};
		let slData =await SlotModel.findOneAndUpdate({applicationId:reqData.applicationId},{$set:update});
		if(!reqData.status){
			docsData = await this.documentDetailsDao.updateOneByFilters({documentId:reqData.applicationId},update);
		}else{
			docsData =slData;
		}
		
	}
	// let docsData = await this.documentDetailsDao.updateOneByFilters({documentId:reqData.applicationId},update);
	return docsData;
}
getDocs = async (reqData)=>{
	let docsData = await this.documentDetailsDao.getOneByFilters(reqData);
	return docsData;
}

getAnywhereDocStatusSrvc = async(reqData) => {
	try{
	//   let srcode= reqData.JURISDICTION
	  let query = `SELECT 
    schedule.ID,
    (SELECT sr_name FROM sr_master WHERE sr_cd = pec.SRO_LOCATION) AS SR_NAME,
    pec.SRO_LOCATION AS SR_CODE,
    (SELECT sr_name FROM sr_master WHERE sr_cd = schedule.jurisdiction) AS jurisdiction_name,
    schedule.jurisdiction,
    schedule.SCHEDULE_NO,
    schedule.juri_check_on,
    schedule.juri_status,
    schedule.PP_CHECK,
    schedule.MV_CHECK,
    schedule.pp_comments,
    schedule.mv_comments,                    
    schedule.reject_reason,
    CASE 
        WHEN schedule.juri_status = 'N' AND schedule.jurisdiction != 0 THEN 'PENDING'
        WHEN schedule.juri_status = 'Y' AND schedule.juri_check_on IS NOT NULL 
             AND schedule.mv_check = 'Y' 
             AND schedule.pp_check = 'Y' THEN 'ACCEPTED'
        WHEN schedule.juri_status = 'Y' AND schedule.juri_check_on IS NOT NULL 
             AND (schedule.mv_check = 'N' OR schedule.pp_check = 'N') THEN 'REJECTED'
    END AS status
FROM preregistration.schedule_entry schedule
JOIN preregistration.pre_registration_cca pec 
    ON pec.ID = schedule.ID
WHERE schedule.ID = :APP_ID
  AND pec.SRO_LOCATION != schedule.jurisdiction`;
	 
	  const bindparam = {
		APP_ID : reqData.documentid,
	  }    
	  let response = await this.odbDao.oDBQueryServiceWithBindParams(query, bindparam);
	  return response;
	} catch (ex) {
		Logger.error(ex.message);
		console.error("DocumentService - getDocsForEsign ||  Error : ", ex.message);
		throw constructPDEError(ex);
	}
	}

	frankIdExist = async (reqData) => {
		try{
			if (!reqData.frankingId || reqData.frankingId.trim() === '') {
				return true;
			}
			let checkId = await this.documentDetailsDao.getOneByFilters({frankingId:reqData.frankingId});			
			console.log("************************ ",checkId);
			if (checkId) {	
				throw new Error("Given Franking ID is already Used");
			}
			return true;
		}catch(ex){
			Logger.error(ex.message);
			console.error("DocumentService - frankIdExist ||  Error : ", ex.message);
			throw constructPDEError(ex);
		}
	}
	nonJudicialStampsValidationService = async (params) => {
		try {

			let query = `SELECT * FROM dist_stock_reg_sno  WHERE :serialNumber BETWEEN serial_no_from AND serial_no_to 
						AND sno_main = :mainSerialNumber 
						AND denomination = :value
						AND (FROM_OFFICE = 'VVVV' OR REGEXP_LIKE(FROM_OFFICE, '^[0-9]+$'))
						AND FROM_OFFICE != '9999'`

			//let query = `select * from dist_stock_reg_sno where :serialNumber between serial_no_from and serial_no_to and sno_main=:mainSerialNumber`
			let details = await this.odbDao.oDBQueryServiceWithBindParams(query, params)
			return details
		} catch (ex) {
			Logger.error(ex.message);
			console.error("Non judicial Stamp validation ||  Error : ", ex.message);
			throw constructPDEError(ex);
		}
	}
	isNonJudicialStampUtilized = async (params,isSingleData) => {
		let matchCondition;
		if (isSingleData) {
			matchCondition = {
				'nonJudicialStamps': { $exists: true },
				'nonJudicialStamps.mainSerialNumber': { $in: [params.mainSerialNumber] },
				'nonJudicialStamps.serialNumber': { $in: [params.serialNumber] },
				'nonJudicialStamps.value': parseInt(params.value),
				'status': { $in: ['SUBMITTED', 'SYNCED'] }
			}
		}else{
			const orConditions = params.map(s => ({
				mainSerialNumber: s.mainSerialNumber,
				serialNumber: s.serialNumber,
				value:s.value
			}));
			matchCondition = {
				status: { $in: ["SUBMITTED" ,"SYNCED"] },
				nonJudicialStamps: { $elemMatch: { $or: orConditions } }
			}
		}
		try {
			let utilizedStampDataArr = await this.documentDetailsDao.getByFilters(matchCondition);
			const docIds=utilizedStampDataArr.map(obj=>obj.documentId);
			 let query = `select APP_ID from srouser.pde_doc_status_cr WHERE APP_ID IN('${docIds.join("','")}')`;
			let alreadyUsedDocs = await this.odbDao.oDBQueryService(query); 
			return {alreadyUsedDocs,utilizedStampDataArr}
		} catch (ex) {
			Logger.error(ex.message);
			console.error("Non judicial Stamp validation ||  Error : ", ex.message);
			throw constructPDEError(ex);
		}
	}

	documentSchedulerSrvc = async () => {		
		try {			
			const start = new Date();
			const EndMoment = moment(start).subtract(90, 'days');
			const formattedEnd = EndMoment.format('YYYY-MM-DD');
			const filter = {
				status: 'DRAFT',				
				updatedAt:  { $lt: new Date(formattedEnd) }
			};			
			let documents = await this.documentDetailsDao.getByFilters(filter,5000);
			for (let doc of documents) {
				let appId = doc.documentId;
				let finalObj = {
					document: doc,
					parties: [],
					representatives: [],
					partySaleDetails: [],
					partiesEycExemptions: [],
					properties: [],
					structures: []
				};

				// let documentPath = process.env.FILE_UPLOAD + `Documents/${appId}`;
				// fs.mkdirSync(documentPath, { recursive: true });
				let documentPath = await fileResolver.readFile(`Documents/${appId}`);
				console.log("DocumentService - documentSchedulerSrvc || Document Path : ",documentPath);
				try {
					let partiesData = await this.partiesDao.getByFilters({ applicationId: appId });
					let partiesRepresentData = await this.partiesDao.getRepresntByFilters({ documentId: appId });
					let partiesSaleData = await this.partySaleDetailsDao.getByFilters({ document_id: appId });
					let partiesExcemptionData = await ekycExemptionStatusDb.find({ applicationId: appId })
					let propertyData = await this.propertyDao.getDataByAggregation({ applicationId: appId });

					if (partiesData && partiesData.length > 0) {
						finalObj.parties = partiesData;
					}

					if (partiesRepresentData && partiesRepresentData.length > 0) {
						finalObj.representatives = partiesRepresentData;
					}

					if (partiesSaleData && partiesSaleData.length > 0) {
						finalObj.partySaleDetails = partiesSaleData;
					}

					if (partiesExcemptionData && partiesExcemptionData.length > 0) {
						finalObj.partiesEycExemptions = partiesExcemptionData;
					}

					if (propertyData && propertyData.length > 0) {
						for (let property of propertyData) {
							let structure = await this.propertyStrDao.getOneByFilters({ propertyId: property.propertyId });
							finalObj.structures.push(structure);
							finalObj.properties.push(property);
						}
					}
					
					const filePath = path.join(documentPath, `${appId}.json`);
					fs.writeFileSync(filePath, JSON.stringify(finalObj, null, 2), "utf-8");
					// Delete the document from the database

					if (partiesData?.length) {
						await this.partiesDao.deleteManyByFilters({ applicationId: appId });						
					}
					if (partiesRepresentData?.length) {
						await this.partiesDao.deleteOneRepByFilters({ documentId: appId });						
					}
					if (partiesSaleData?.length) {
						await this.partySaleDetailsDao.deleteManyByFilters({ document_id: appId });						
					}
					if (partiesExcemptionData?.length) {
						await ekycExemptionStatusDb.deleteOne({ applicationId: appId });						
					}
					if (propertyData?.length) {
						let propertyStructureData = [];
						for (let property of propertyData) {
							propertyStructureData.push(property.propertyId);

							let cdmaDetails = property?.cdma_details;							

							if (typeof cdmaDetails === "string" && cdmaDetails.trim().startsWith("{") && cdmaDetails.trim() !== "{}") {
								try {
									cdmaDetails = JSON.parse(cdmaDetails);									
								} catch (e) {
									console.error("Failed to parse cdma_details JSON string for property:", property._id);
									continue;
								}
							}
							const assessmentNumber = cdmaDetails?.propertyID;							
							const cdmaApplicationNumber = cdmaDetails?.applicationNumber;							
							if (cdmaApplicationNumber && assessmentNumber && assessmentNumber !== 0) {
								const ulbCodeFromAssessment = assessmentNumber.substring(0, 4);								
								const urbanReqData = {
									ulbCode: ulbCodeFromAssessment,
									assessmentNumber,
									applicationNumber: cdmaApplicationNumber
								};
							
								try {
									const urbanDeleteResponse = await this.urbanService.deletePropertySrvc(urbanReqData);									
								} catch (urbanError) {
									console.error("Error deleting urban property for property",urbanError.message);
								}
							}
							
						}
						await this.propertyStrDao.deleteByFilters({ propertyId: {$in:propertyStructureData} });
						await this.propertyDao.deleteByFilters({ applicationId: appId });						
					}
					await this.documentDetailsDao.deleteOneByFilters({ documentId: appId });					
				} catch (err) {
					console.error(`Failed application ${appId}:`, err);
				}
			}
			return "Success"
		} catch (error) {
			console.error("DocumentService - documentSchedulerSrvc || Error:", error);
			return "Failed"
		}
	};
	validStamps = async (req) => {
		let stampSerialNumbers = await this.documentDetailsDao.getOneByFilters({ documentId: req.ID });
		if (!stampSerialNumbers || !stampSerialNumbers.nonJudicialStamps || stampSerialNumbers.nonJudicialStamps.length === 0) {
			console.log("No nonJudicialStamps found ::::::::::::: returning false");
			return false;  
		}
		const requiredParams = stampSerialNumbers.nonJudicialStamps.map(stamp => ({
			mainSerialNumber: stamp.mainSerialNumber,
			serialNumber: stamp.serialNumber,
			value: stamp.value
		}));
		let validate = await this.isNonJudicialStampUtilized(requiredParams,false);
		return validate;
	}

	urbanPropertySchedulerSrvc = async () => {
		try {
			const start = new Date();
			start.setHours(0, 0, 0, 0);
			const EndMoment = moment(start).subtract(1, 'days');
			const formattedEnd = EndMoment.format('YYYY-MM-DD');
			let documents = await documentModel.aggregate([
				{
					$match: {						
						status: { $in: [ 'SYNCED', 'SUBMITTED' ] },
						updatedAt:  { $lt: new Date(formattedEnd) }
					}
				},
				{
					$lookup: {
					from: "property_details",
					let: { docId: "$documentId" },
					pipeline: [
						{
						$match: {
							$expr: {
							$and: [
								{ $eq: ["$applicationId", "$$docId"] },
								{ $regexMatch: { input: "$propertyType", regex: "URBAN" } },
								{ $gt: ["$mutationFee", 0] }
							]
							}
						}
						}
					],
					as: "propertyDetails"
					}
				},
				{
					$match: {
						propertyDetails: { $ne: [] }
					}
				}
			]);
			for (let doc of documents) {
				let appId = doc.documentId;
				try {
					if (doc.propertyDetails?.length) {
						let propertiesData = await this.propertyDao.getDataByAggregation({ applicationId: appId, propertyType:{"$regex":"URBAN"}, urban_selling_extent:"FULL" });
						let isValidMutationCancel = false;
						if(propertiesData.length>0 ){
							for (let property1 of propertiesData) {
								let mutatefee = property1.mutationFee;
								mutatefee = mutatefee ? parseInt(mutatefee):0;
								let cdmaDetails = property1?.cdma_details;
								if (typeof cdmaDetails === "string" && cdmaDetails.trim().startsWith("{") && cdmaDetails.trim() !== "{}") {
									try {
										cdmaDetails = JSON.parse(cdmaDetails);
									} catch (e) {
										console.error("Failed to parse cdma_details JSON string for property:", property._id);
										continue;
									}
								}
								const assessmentNumber = cdmaDetails?.propertyID;
								const cdmaApplicationNumber = cdmaDetails?.applicationNumber;
								
								let urbanPropertyData = {
									assessmentNo: assessmentNumber,
									applicationId: property1.applicationId,
									propertyId: property1.propertyId
								}							
								let propertyDue = await this.urbanService.propertyTaxDueSrvc(urbanPropertyData);
								if(propertyDue.mutationFee==0 && assessmentNumber && cdmaApplicationNumber){
									isValidMutationCancel = true;
								}
							}
						}

						if(!isValidMutationCancel){
							for (let property of doc.propertyDetails) {
								let cdmaDetails = property?.cdma_details;
								if (typeof cdmaDetails === "string" && cdmaDetails.trim().startsWith("{") && cdmaDetails.trim() !== "{}") {
									try {
										cdmaDetails = JSON.parse(cdmaDetails);
									} catch (e) {
										console.error("Failed to parse cdma_details JSON string for property:", property._id);
										continue;
									}
								}
								const assessmentNumber = cdmaDetails?.propertyID;
								const cdmaApplicationNumber = cdmaDetails?.applicationNumber;
								let urbanPropertyData = {
									assessmentNo: assessmentNumber,
									applicationId: property.applicationId,
									propertyId: property.propertyId
								}							
								let propertyDue = await this.urbanService.propertyTaxDueSrvc(urbanPropertyData);
								let documentCheck = await this.odbDao.oDBQueryServiceWithBindParams(`select id from preregistration.slot_details where id=:id`,{id: appId});
								if(documentCheck.length > 0){
									console.log(`Already Slot booked for this application Id ${appId}`)
								}else{
									if (cdmaApplicationNumber && assessmentNumber && assessmentNumber !== 0 && propertyDue.mutationFee > 0) {
										const ulbCodeFromAssessment = assessmentNumber.substring(0, 4);
										const urbanReqData = {
											ulbCode: ulbCodeFromAssessment,
											assessmentNumber,
											applicationNumber: cdmaApplicationNumber
										};									
										try {
											const urbanDeleteResponse = await this.urbanService.deletePropertySrvc(urbanReqData);
											if (urbanDeleteResponse) {
												delete cdmaDetails.applicationNumber;											
												await this.propertyDao.updateByFilters({ propertyId: property.propertyId },{ cdma_details: JSON.stringify(cdmaDetails) });
											}
										} catch (urbanError) {
											console.error("Error deleting urban property for property",urbanError.message);
										}
										await this.documentDetailsDao.updateOneByFilters({ documentId: appId },{ status: 'DRAFT'});
										await this.odbDao.oDbUpdateWithBindParams(`update preregistration.pre_registration_cca set status='N' where id=:id`,{id: appId});
									}
								}
							}
						}
					}
				} catch (err) {
					console.error(`Failed application ${appId}:`, err);
				}
			}
			return "Success"
		} catch (error) {
			console.error("DocumentService - urbanPropertySchedulerSrvc || Error:", error);
			return "Failed"
		}
	};

	GoupdateDocument = async (documentReqData,user) => {
        try {

            var documentDbFilter = {
                documentId: documentReqData.applicationId
            };
			let documentDbData = {}
			if(Object.keys(documentReqData).includes('GO')){
				delete documentReqData.applicationId;
				documentDbData.ConcessionDutyFeeData = {...documentReqData};
			}
            let documentDbResponse = await this.documentDetailsDao.updateOneByFilters(documentDbFilter, documentDbData);
            return documentDbResponse;
        } catch (error) {
			Logger.error(error.message);
            console.error("DocumentService - updateDocument ||  Error : ", error.message);
            throw constructPDEError(error);
        }
    }

	getGODocument = async (applicationId) => {
    try {
        let documentDbFilter = {
            documentId: applicationId
        };
        let documentDbResponse = await this.documentDetailsDao.getOneByFilters(documentDbFilter);
        return documentDbResponse?.ConcessionDutyFeeData || {};

    } catch (error) {
        Logger.error(error.message);
        console.error("DocumentService - getGODocument || Error :", error.message);
        throw constructPDEError(error);
    }
};

}

module.exports = DocumentService;
