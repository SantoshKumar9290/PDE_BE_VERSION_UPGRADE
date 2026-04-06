const mongoose = require("mongoose");
const { encryptData ,decryptData} = require('../utils/index');

const apiic_Exec_MasterData = new mongoose.Schema({
  Emple_Name: { type: String, required: true, unique: true },
  Father_Name: { type: String },
  Age: { type: Number },
  PAN_Number: { type: String },
  Aadhar_Number: { 
    type: String, 
    set: (val) => val ? encryptData(val.toString()) : val,   
    get: (val) => val ? decryptData(val) : val               
  },
  Email: { type: String },
  Empl_MobileNumber: { type: Number },
  Address: { type: String },
  Repregent_Deatils: {
    Emple_Name: { type: String },
    Father_Name: { type: String },
    Age: { type: Number },
    PAN_Number: { type: String },
    Aadhar_Number: { 
      type: String, 
      set: (val) => val ? encryptData(val.toString()) : val,  
      get: (val) => val ? decryptData(val) : val              
    },
    Email: { type: String },
    Empl_MobileNumber: { type: Number },
    Address: { type: String }
  }
}, { timestamps: true, strict: false });

module.exports = mongoose.model( "apiic_Exc_masterData_Modal", apiic_Exec_MasterData, "apiic_Exec_MasterData" );
  
