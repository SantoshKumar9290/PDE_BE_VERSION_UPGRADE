const mongoose = require('mongoose');


var electionAndSecratariatMasterDataModel = new mongoose.Schema({
    ulbCode:{type:Number,required:true},
    ulbName:{type:String,required:true},
    secretariatWardCode:{type:String,required:true},
    secretariatWardName:{type:String,required:true},
    electionWardCode:{type:String,required:true},
    electionWardName:{type:String,required:true},
    isActive:{type:Boolean,default:true},

});

const DocumentDetailsDb = mongoose.model('election_secretariat_cdma_details', electionAndSecratariatMasterDataModel);
module.exports = DocumentDetailsDb;