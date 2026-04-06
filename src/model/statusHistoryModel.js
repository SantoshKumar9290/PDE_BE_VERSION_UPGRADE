const mongoose = require('mongoose');
var statusHistory = new mongoose.Schema({
	currentStatus:{
		type:String,
		required:true
	},
	applicationId:{
		type:String,
		required:true
	},
    api:{
        type:String
    },
	userData:{
		type:Object,
	}
	

},{timestamps:true,strict:false},);


const StatusHistory = mongoose.model('status_history', statusHistory);

module.exports = StatusHistory;