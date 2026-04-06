
const mongoose = require('mongoose');


const changeLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  operation: { type: String, required: true }, // insert, update, delete, etc.
  collectionName: { type: String, required: true },
  referenceId:{type:String},
  changedFields:{type: mongoose.Schema.Types.Mixed},
  documentId: { type: mongoose.Schema.Types.Mixed },
  data: { type: Map, of: mongoose.Schema.Types.Mixed, required: true }
});


const changeLogsModel = mongoose.model('changes_log_model',changeLogSchema);
module.exports = changeLogsModel;