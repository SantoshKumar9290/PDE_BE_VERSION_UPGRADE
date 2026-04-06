const mongoose = require('mongoose');

const aadharDetailsSchemaObj = new mongoose.Schema({
    co: {type:String},
    country: {type:String},
    dist: {type:String},
    house: {type:String},
    pc: {type:String},
    po: {type:String},
    state: {type:String},
    street: {type:String},
    subdist: {type:String},
    vtc: {type:String},
    dob: {type:String},
    gender: {type:String},
    name: {type:String},
    encodedPhoto:{type:String},
    dnQualifier:{type:String}
})

var representSchema = new mongoose.Schema({
    name : {
        type : String
    },
	parentPartyId:{type:String},
	documentId:{type:String},
    relationType : {
        type: String
    },
    relationName : {
        type: String
    },
    age : {
        type: Number,
        integer: true
    },
    panNoOrForm60or61: {
        type: String
    },
    isSelectedPanOrForm60:{
        type: String
    },
    tan: {
        type: String
    },
    aadhaar: {
        type: String
    },
    email: {
        type: String
    },
    phone: {
        type: Number
    },
	currentAddress:{
		type:String
	},
    address: {
        type: String
    },
	seqNumber:{type:Number},
    aadharDetails:aadharDetailsSchemaObj,
    isPresenter: {
        type: Boolean
    },
    esignStatus: {type: String},
    esignTxnId: { type: String }
    
},{timestamps:{type:Date,default:new Date().toISOString()}})

/*

//Initialise Auto Increment
autoIncrement.initialize(mongoose.connection);
partiesSchema.plugin(autoIncrement.plugin, 'id');

// Create Index for AutoIncrement Id
partiesSchema.index({ id: Integer }, { unique: true });

*/

const PartiesDb = mongoose.model('party_represent_detail', representSchema, 'party_represent_detail');

module.exports = PartiesDb;