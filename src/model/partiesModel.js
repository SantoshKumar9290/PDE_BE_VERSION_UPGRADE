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

var partiesSchema = new mongoose.Schema({
    name: {
        type: String
    },
    relationType: {
        type: String
    },
    relationName: {
        type: String
    },
    representSubType: {
        type: String
    },
    represent: {
        type: Array
    },
    age: {
        type: Number,
        integer: true
    },
    panNoOrForm60or61: {
        type: String
    },
    sezParty: {
        type: Boolean
    },
    isSelectedPanOrForm60:{
        type: String
    },
    tan: {
        type: String
    },
    tin: {
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
    address: {
        type: String
    },
    passportNumber:{
        type:String
    },
    fileNo:{
        type:String
    },
    exExecutant: {
        type: Boolean
    },
    exExecutantData: {
        type: Object
    },
    dateOfBrith:{
        type:String
    },
    doi:{
        type:String
    },
     passportExpireDate:{
        type:String
    },
     placeOfIssue:{
        type:String
    },
    partyFile:{
        type:String
    },
    deceasedPartyFile: {
    name: { type: String },
    type: { type: String },
    base64: { type: String },
  },
    currentAddress: { type: String },
    partyCode: {
        type: String
    },
    isLinkedDocDetails: {
        type: Boolean
    },
    applicationId: { type: String },
    partyType: { type: String },
    isPresenter: {
        type: Boolean
    },
    seqNumber: {
        type: Number
    },
    jointOrNot:{
        type:String
    },
    aadharDetails:aadharDetailsSchemaObj,
    share: { type: String },
    wa: { type: String },
    esignStatus: { type: String },
    esignTxnId: { type: String },
    form60EsignStatus: { type: String },
    form60EsignTxnId: { type: String },
    form60EsignBy: { type: String },
    isRepresent:{type: Boolean},
    isRepChecked:{type: Boolean},
    nameTe: {type: String},
    relationNameTe: {type: String}
}, { timestamps: { type: Date, default: new Date().toISOString() } })

/*

//Initialise Auto Increment
autoIncrement.initialize(mongoose.connection);
partiesSchema.plugin(autoIncrement.plugin, 'id');

// Create Index for AutoIncrement Id
partiesSchema.index({ id: Integer }, { unique: true });

*/

const PartiesDb = mongoose.model('party_details', partiesSchema, 'party_details');

module.exports = PartiesDb;