const mongoose = require("../plugins/database/mongooseService").mongoose;
const Schema = mongoose.Schema;

const crdaEmpList = new Schema({
    // appNo: { type: String , default: Date.now(), unique : true},
    empName: { type: String },
    empEmail: { type: String },
    empMobile: { type: String },
    empAdhar: { type: Number },
},{timestamps:true});

module.exports = mongoose.model("crda_Emp_List", crdaEmpList, "crda_Emp_List");
