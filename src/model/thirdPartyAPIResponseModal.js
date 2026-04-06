
const mongoose = require('mongoose');
const moment = require('moment')

const thirdPartyAPIResponseSchema = new mongoose.Schema({
  timestamp: { type: Number, default:()=> moment(new Date()) },
  request:{
    method:{type:String},
    url:{type:String},
    headers:{type:mongoose.Schema.Types.Mixed},
    parameters:{type:mongoose.Schema.Types.Mixed}
  },
  userID:{type:String},
  source:{type:String},
  response:{type:mongoose.Schema.Types.Mixed,required:true},
  status:{type:String},
  module:{type:String}
});


const thirdPartyAPIResponseModal = mongoose.model('third_party_api_response',thirdPartyAPIResponseSchema);
module.exports = thirdPartyAPIResponseModal;