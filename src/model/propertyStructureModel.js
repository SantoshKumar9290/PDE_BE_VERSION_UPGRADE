
const mongoose = require('mongoose');
var propertyStructureSchema = new mongoose.Schema({
	propertyId : {type:String,required:true},
	propertyType:{type:String},
	landUse:{type:String},
	ward: {type:String},
	biWard: {type:String},
	block: {type:String},
	biBlock: {type:String},
	doorNo: {type:String},
	plotNo: {type:String},
	survayNo: {type:String},
	ptinNo: {type:String},
	extent: {type:String},
	extentUnit: {type:String},
	schedulePropertyType: {type:String},
	layoutNo: {type:String},
	layoutName: {type:String},
	reraApprovalNo:{type:String},
	buildingApprovalNo:{type:String},
	totalFloors: {type:String},
	structure: [
		{
		  floorNo: { type:String },
		  structureType: { type:String },
		  plinth: { type:String },
		  plinthUnit: { type:String },
		  stageOfCons: { type:String },
		  age: { type:String }
		}
	],

	conveyedExtent:[
		{
			extent:{ type:String },
			unit:{ type:String }
		}
	],
	tExtent: {type:String},
	tUnits: {type:String},
	appartmentName:{ type:String },
	undividedShare: { type:String },
	undividedShareUnit: { type:String },
	flatNo: { type:String },
	flatNorthBoundry: { type:String },
	flatSouthBoundry: { type:String },
	flatEastBoundry: { type:String },
	flatWestBoundry: { type:String },
	northBoundry: { type:String },
	southBoundry: { type:String },
	eastBoundry: { type:String },
	westBoundry: { type:String },
	isLinkedDocDetails: { type:Boolean },
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
	]
},{timestamps:true});
const PropertyStructureSchemaDb = mongoose.model('property_structure_details', propertyStructureSchema);

module.exports = PropertyStructureSchemaDb;
	
