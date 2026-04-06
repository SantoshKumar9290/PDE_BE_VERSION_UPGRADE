const { TOO_MANY_REQUESTS } = require('http-status');
const mongoose = require('mongoose');
// var autoIncrement = require('mongoose-auto-increment');

var ekycExemptionModel = new mongoose.Schema({
    id :{type : Number,required:true},
    nature_type : {
        type :   String,
        required :true 
    },
    major_code : {
        type :  String,
        required:true 
    },
    minor_code: {
        type : String,
        required : true
    },
    executants : {
        type : Boolean,
        required :true 
    },
    claimants : {
        type : Boolean,
        required :true 
    },
    witness :{
        type : Boolean,
        required :true 
    }},{timestamps:{type:Date,default:new Date().toISOString()}});

const ekycExemptionDb = mongoose.model('ekyc_exemption',ekycExemptionModel,'ekyc_exemption');

module.exports = ekycExemptionDb;

