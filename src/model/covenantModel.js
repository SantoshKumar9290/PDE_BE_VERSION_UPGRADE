const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
// var autoIncrement = require('mongoose-auto-increment');

var covenantsModel = new mongoose.Schema({
	documentId:{type:String},
	natureType:{type:String, required:true},
	covanantId:{type:String},
	covanants:[
		{value:{type:String}}
	],
	acquireCovenents:[
		{value:{type:String}}
	]
},{timestamps:true});

const covanantsDb = mongoose.model('covanant', covenantsModel,"covanant");


module.exports = covanantsDb;

