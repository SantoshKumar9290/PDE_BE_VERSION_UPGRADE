const mongoose = require('mongoose');

var masterDataVillageModel = new mongoose.Schema({
    villageName : {
        type : String,
        required: true
    },
    villageCode : {
        type: String,
        required: true,
        unique: true
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
	habitationCode:{type:String}
});

//Indexing documentId
masterDataVillageModel.index({ villageCode: String }, { unique: true });
masterDataVillageModel.index({ mandalCode: String });
masterDataVillageModel.index({ revenueDistCode: String });

const MasterDataVillageModel = mongoose.model('master_data_village_d', masterDataVillageModel, 'master_data_village_d');

module.exports = MasterDataVillageModel;