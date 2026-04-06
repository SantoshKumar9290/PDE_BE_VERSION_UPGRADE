const mongoose = require('mongoose');

var exemptionModel = new mongoose.Schema({
    exemption_id: {type: Number},
    tran_major: {type: String},
    tran_minor: {type: String},
    GO: {type: String},
    GO_details_1: {type: String},
    GO_details_2: {type: String},
    GO_details_3: {type: String},
    Stamp_Transfer: {type: String},
    registration_fee: {type: String},
    user_charges: {type: String}
},{timestamps:{type:Date,default:new Date().toISOString()}});

const exemptionsDb = mongoose.model('exemptions_masterdata', exemptionModel, 'exemptions_masterdata');

module.exports = exemptionsDb;