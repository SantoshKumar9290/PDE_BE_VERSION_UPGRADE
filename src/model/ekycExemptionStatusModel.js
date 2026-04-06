const mongoose=require('mongoose'); 

var ekycExemptionStatusModel=new mongoose.Schema({
    id:{
        type:String
    },
    applicationId:{
        type : Number,
        required : true, 
        unique : true 
    }, 
    executants : {
        type : Boolean,
        required : true,

    }, 
    claimants : {
        type : Boolean, 
        required :true, 

    },
    witness : {
        type : Boolean, 
        required : true 
    }
},{timestamps:{type:Date,default:new Date().toISOString()}})



const ekycExemptionStatusDb= mongoose.model('ekyc_exemption_status',ekycExemptionStatusModel,'ekyc_exemption_status');

// ekycExemptionStatusDb.insertMany({
//     id:1,
//     applicationId : 43435345476587,
//     executants:true,
//     claimants:false,
//     witness:true 
// })

module.exports=ekycExemptionStatusDb;