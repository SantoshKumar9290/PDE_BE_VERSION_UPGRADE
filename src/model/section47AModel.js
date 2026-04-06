const mongoose = require('mongoose');

var section47ASchema = new mongoose.Schema({
    applicationId:{
        type:String,
        required: true,
        unique: true
    },
    sroCode:{
        type:Number
    },
    isSection47: {
        type: String
    },
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
    considerationValue:{
        type:Number
    },
    totalValue :{
        type:Number
    },
    differentialStampDuty:{
        type:Number
    },
    sectionType:{
        type:String
    },
},{timestamps:true},{strict:false})

const Section47Db = mongoose.model('Section47A_details', section47ASchema);

module.exports = Section47Db;
