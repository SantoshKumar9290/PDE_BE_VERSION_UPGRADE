const mongoose = require('mongoose');

var partySaleDetailsModelSchema = new mongoose.Schema({
    sale_id: {
        type: String,
        required: true,
        unique: true
    },
    document_id : {
        type: String,
        required: true
    },
    executant_party_ids : {
        type: Array
    },
    claimant_party_ids : {
        type: Array
    },
    witness_party_ids : {
        type: Array
    },
	presnt_party_ids:{
		type:Array
	},
    
},{timestamps:{type:Date,default:new Date().toISOString()}})


// Create Index
partySaleDetailsModelSchema.index({ document_id: String }, { unique: true });
partySaleDetailsModelSchema.index({ sale_id: String }, { unique: true });


const PartySaleDetailsDb = mongoose.model('party_sale_details', partySaleDetailsModelSchema, 'party_sale_details');

module.exports = PartySaleDetailsDb;