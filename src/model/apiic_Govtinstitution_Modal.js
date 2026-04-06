const mongoose = require("mongoose");

const ApiicGovtInstitutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    match: [/^[6-9]\d{9}$/, "Please enter a valid mobile number"], 
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, "Please enter a valid email address"],
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  tin: {
    type: String,
    default: ""
  },
  tan: {
    type: String,
    default: ""
  },
  pan: {
    type: String,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Please enter a valid PAN number"], 
  }
}, { timestamps: true });

module.exports = mongoose.model("ApiicGovtInstitution", ApiicGovtInstitutionSchema,"apiic_GovtInstitution_data");
