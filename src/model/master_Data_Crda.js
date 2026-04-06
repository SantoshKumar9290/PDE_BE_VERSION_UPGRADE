const mongoose = require('mongoose');

var masterDataCrdaModel = new mongoose.Schema({
    villageName : {
        type : String,
        required: true
    },
    villageCode : {
        type: String,
        required: true,
        unique: true,
    },
    mandalCode: {
        type: String,
        required: true
    },
    mandalName: {
        type: String,
        required: true
    },
    revenueDistCode: {
        type: String,
        required: true
    },
    revenueDistName: {
        type: String,
        required: true
    },
    registrationDistCode: {
        type: String,
        required: true
    },
    registrationDistName: {
        type: String,
        required: true
    },
    srCode: {
        type: String,
        required: true
    },
    srName: {
        type: String,
        required: true
    },
	localBodyCode:{type:Number},
	localBodyName:{type:String},
	localbodyType:{type:String},
	habitationCode:{type:String},
    
},{strict :false});

//Indexing documentId
masterDataCrdaModel.clearIndexes({villageCode:String})
// masterDataCrdaModel.index({ villageCode: String }, { unique: true });
// masterDataCrdaModel.index({ mandalCode: String });
// masterDataCrdaModel.index({ revenueDistCode: String });

const MasterDataCRDAModel = mongoose.model('master_data_crda', masterDataCrdaModel, 'master_data_crda');

module.exports = MasterDataCRDAModel;