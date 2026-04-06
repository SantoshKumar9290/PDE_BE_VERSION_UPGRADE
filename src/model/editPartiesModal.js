const mongoose = require('mongoose');

var partiesSchema = new mongoose.Schema({
    referenceId: { type: String },
    documentId: { type: String },
    executent : {type : Array},
    claimant : {type : Array},
    property : {type : Array}
}, { timestamps: { type: Date, default: new Date().toISOString() } })

const PartiesDb = mongoose.model('edit_index_document_details', partiesSchema, 'edit_index_document_details');

module.exports = PartiesDb;