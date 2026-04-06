const mongoose = require('mongoose');

var propertySchema = new mongoose.Schema({
	propertyId: {
		type: String,
		required: true,
		unique: true
	},
	village:{
		type:String
	},
	villageCode:{type:String},
	locality:{type:String},
	habitation:{type:String},
	habitationOr:{type:String},
	habitationCode:{type:String},
	applicationId:{type:String,required:true},
	localBodyType : {type:String},
	mandal:{type:String},
	localBodyName:{type:String},
	localBodyCode:{type:String},
	district:{
		type:String
	},
	sroOffice : {type:String},
	sroCode:{type:Number},
	propertyType:{type:String},
	landUse:{type:String},
	landUseCode:{type:String},
	isLinkedDocDetails:{type:Boolean},
	LinkedDocDetails: [
		{
		  linkDocNo: { type:Number },
		  regYear: { type:String },
		  bookNo: { type:Number },
		  scheduleNo: { type:String },
		  district:{ type:String },
		  sroOffice:{ type:String },
		  sroCode:{type:String}
		}
	],
	// executionDate : {type:String},
	// stampPurchaseDate :{type:String},
	// stampPaperValue : {type:String},
	northBoundry:{type:String},
	southBoundry:{type:String},
	eastBoundry:{type:String},
	westBoundry:{type:String},
	conveyedExtent:[
		{
			extent:{ type:String },
			unit:{ type:String },
			mvValue:{type:Number},
			srvyNo:{type:String},
			isProhibited:{type:Boolean}
		}
	],
	ExtentList:[],
	tExtent: {type:String},
	totalExtent:{type:String},
	electionWard:{type:String},
    secratariatWard:{type:String},
	electionWardName:{type:String},
    secratariatWardName:{type:String},
	survayNo:{type:String},
	lpmNo:{type:String},
	tUnits: {type:String},
    // amount:{
	// 	type:String
	// },
	isExAsPattadhar:{type:String},
	ispresentExcutent:{type:String},
	seqNumber:{type:Number},
	marketValue:{type:Number},
	ext_Rate:{type:Number},
	partyNumber:{type:String},
	cashvalue:{type:String},
	isPropProhibited:{type:Boolean},
	isPrProhibitedSurveyNO:{type:String},
	isPrProhibitedDoorNO:{type:String},
	hash:{type:String},
	leaseDetails:{
		wef:{type:Date},
		adjOrNonAdj:{type:String},
		advance:{type:Number},
		lPeriod:{type:Number},
		muncipalTax:{type:Number},
		valueOfImp:{type:Number},
		rentalDetails:[]
	},
	urban_selling_extent: {type:String},
    cdma_details: {type:String},
	exchangeTo:{type:String},
	considarartionValue:{type:Number},
	webLandDetails:{
		landNature:{type: String},
		totalExtent:{type:Number},
		cultivated:{type:Number},
		nonCultivated:{type:Number},
		occupantExtent:{type:Number},
		classification:{type: String},
		waterResource:{type: String},
		occupantName:{type: String},
		fatherName:{type: String},
		survayNo:{type: String},
		occupantKhataNo:{type: String},
	},
	otherPropName:{type:String},
	typeOfProperty:{type:String},
	strType:{type:String},
	nearTodoorNo:{type:String},
	freeHoldLands:{type:String},
	jointOrNot:{
        type:String
    },
	conveyanceType:{
		type:String
	},
	companyShare:{type:String},
	conveyanceValue:{type:String},
	registeredState:{type:String},
	eleSrvcNo:{type:Number},
	mutationPaymentDue :{type:Number},
	mutationFee :{type:Number},
	payableMutationFee : {type:Number},
	isUrbanMutationEnabled : {type:Boolean, defult: false},
	Go134 : {
		// applicationId:{
		// 	type:String,
		// },
		// sroCode:{
		// 	type:Number
		// },
		// scheduleNo :{
		// 	type:Number
		// },
		stampDutyFeePayable: {
			type: Number
		},
		registrationFeePayable: {
			type: Number
		},
		transferDutyFeePayable: {
			type: Number
		},
		userCharges :{
			type:Number
		},
		marketValue: {
			type: Number
		},
		// considerationValue:{
		// 	type:Number
		// },
		// totalValue :{
		// 	type:Number
		// },
		// differentialStampDuty:{
		// 	type:Number
		// }
	},
	Go84 : {
		stampDutyFeePayable: {
			type: Number
		},
		registrationFeePayable: {
			type: Number
		},
		transferDutyFeePayable: {
			type: Number
		},
		userCharges :{
			type:Number
		},
		marketValue: {
			type: Number
		},
	}
	// cdma_details:{
	// 	propertyAddress:{type: String},
	// 	// localityName:{type: String},
	// 	// aadharNumber:{type:String},
	// 	ownerName:{type: Array},
	// 	// mobileNumber:{type: String},
	// 	// emailId:{type: String},
	// 	siteExtentUnit:{type: String},
	// 	taxDue:{type: String},
	// 	houseNo:{type: String},
	// 	propertyType: {type: String},
	// 	propertyID:{type:String}
	// }
},{timestamps:true},{strict:false})




const PropertyDb = mongoose.model('property_details', propertySchema);

module.exports = PropertyDb;
// R@v!T3jA#321