const mongoose = require('mongoose');

var masterDataTypeOfDocument = new mongoose.Schema({
    majorCode : {
        type : String,
        required: true
    },
    minorCode : {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    }
});

//Indexingfields
masterDataTypeOfDocument.index({ description: String }, { unique: true });

const MasterDataTypeOfDocumentModel = mongoose.model('master_data_document_nature', masterDataTypeOfDocument, 'master_data_document_nature');

module.exports = MasterDataTypeOfDocumentModel;