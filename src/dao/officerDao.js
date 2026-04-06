const PDEError = require("../errors/customErrorClass");
const officerModel = require("../model/officerModel");
const otpModel = require('../model/otpModel');
class OfficerDao {
	
	
	userFindMethod = async (userData)=>{
		
		if(!userData){
			console.error(" UsersInfoDao - userFindMethod || reqData can't be empty")
            throw new Error("Invalid");
		};
		try{
			let existOrNot = await officerModel.find(userData)
			return existOrNot;
		}catch(ex){
			console.log("UsersInfoDao - userFindMethod || Error : ", ex.message);
            throw new PDEError({err: ex.message});;
		}
	}
	findOne = async (userData)=>{
		
		if(!userData){
			console.error(" UsersInfoDao - findOne || reqData can't be empty")
            throw new Error("Invalid");
		};
		try{
			let existOrNot = await officerModel.findOne(userData)
			return existOrNot;
		}catch(ex){
			console.log("UsersInfoDao - findOne || Error : ", ex.message);
            throw new PDEError({err: ex.message});;
		}
	}
	fAndUpdate = async (identify,reqData) =>{
		if(!reqData){
			console.error(" UsersInfoDao - reqData || reqData can't be empty")
            throw new Error("reqData invalid for Otp");
		};
		try{
			let updateData =await officerModel.findOneAndUpdate(identify,reqData)
			// await otpModel.findOneAndUpdate(otpData,{"status":false});
			return updateData;
		}catch(ex){
			console.log("UsersInfoDao - otpUpdate || Error : ", ex.message);
            throw new PDEError({err: ex.message});;
		}
	}
	findAll = async ()=>{
		try{
			let SroList = await officerModel.find()
			return SroList;
		}catch(ex){
			console.log("UsersInfoDao - findOne || Error : ", ex.message);
            throw new PDEError({err: ex.message});;
		}
	}
};
module.exports = OfficerDao;