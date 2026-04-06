const mongoose = require('mongoose');



const nonJudicialStampsSchema= new mongoose.Schema({
	mainSerialNumber:{type:String},
	serialNumber:{type:String},
	value:{type:Number}
})
var documentDetailsModel = new mongoose.Schema({
    documentId : {
        type : String,
        required: true,
        unique: true
    },
    userId : {
        type : String,
        required: true,
    },
    documentType : {
        TRAN_MAJ_CODE:{type:String},
		TRAN_MIN_CODE:{type:String},
		TRAN_DESC:{type:String},
		PARTY1:{type:String},
		PARTY1_CODE:{type:String},
		PARTY2:{type:String},
		PARTY2_CODE:{type:String},
		PARTY3:{type:String},
		PARTY3_CODE:{type:String}
    },
    documentSubType : {
        TRAN_MAJ_CODE:{type:String},
		TRAN_MIN_CODE:{type:String},
		TRAN_DESC:{type:String}
    },
    executionDate: {
        type: Date
    },
    // presentationDate: {
    //     type: String
    // },
    presentantName : {
        type: String
    },
    sroOffice: {
        type: String,
        required: true
    },
	sroCode:{
		type:Number
	},
	district:{
		type:String,
		required:true
	},
	nonJudicialStamps:[nonJudicialStampsSchema],
	distCode:{type:Number},
	mandal:{
		type:String,
	},
	mandalCode:{type:Number},
	village:{
		type:String,
	},
	villageCode:{type:Number},
	noOfDocuments:{
		type:Number
	},
    status: {
        type: String,
        required: true
    },
	stampPurchaseDate :{type:Date},
	stampPaperValue : {type:Number},
	leasePropertyDetails:{type:Object},
    amount:{
		type:Number
	},
	tmarketValue:{type:Number},
	docProcessType: {type:String},
	docProcessCode:{type:String},
	dutyFeeData:{
		rf_p:{type:Number},
		sd_p:{type:Number},
		td_p:{type:Number},
		uc_p:{type:Number},
		pa_p:{type:Number}
	},
	AttendanceDetails:{
		id:{type:String},
		lat:{type:Number},
		lng:{type:Number},
		Reason:{type:String},
		attachfile:{type:String},
		location:{type:String}
	},
	noOfStampPapers:{type:Number},
	documents:[],
	tdAllocation:[
		{
			localBodyName:{type:String},
			tdValue:{type:Number},
			propertyIds:[]
		}
	],
	regWith:{type:String},
	regWithCode:{type:String},
	regWithValue:{type:Number},
	docDownLoadedBy:{type:String},
	hash:{type:String},
	esignExecuted: {type: Boolean},
	ConcessionDutyFeeData:{
		rf_p:{type:Number},
		sd_p:{type:Number},
		td_p:{type:Number},
		uc_p:{type:Number},
		GO: {type: String}
	},
	docsExcutedBy:{type:String},
	typeOfStamps:{type:String},
	frankingId:{type:String},
	stockHoldingId:{type:String},
	isAuthenticateThroughQr:{type:Boolean},
	slotOtp:{type:Number},
	goNumber:{type:String}
},{timestamps:{type:Date,default:new Date().toISOString()}});

//Indexing documentId
documentDetailsModel.index({ documentId: String }, { unique: true });

const DocumentDetailsDb = mongoose.model('document_details', documentDetailsModel);

module.exports = DocumentDetailsDb;