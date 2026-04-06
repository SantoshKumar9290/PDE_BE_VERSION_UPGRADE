const PDEError = require("../errors/customErrorClass");
const userModel = require("../model/userModel");
const otpModel = require('../model/otpModel');
class UsersInfoDao {
	
	create = async (userDetails) =>{
		if(!userDetails){
            console.error(" UsersInfoDao - create || user Details can't be empty")
            throw new Error("EMPTY USERDETAILS");
        };
		const newUserDetails = new userModel({...userDetails});
		try {
            const saveUserDetails = await newUserDetails.save();
            return saveUserDetails;
        } catch (error) {
            console.log("UsersInfoDao - create || Error : ", error.message);
            throw new PDEError({err: error.message});
        }
	}
	otpCreation = async (reqData)=>{
		if(!reqData){
			console.error(" UsersInfoDao - otpCreation || otp Details can't be empty")
            throw new Error("EMPTY OTPDETAILS");
		};
		try{
			const newOtpDetails  =  new otpModel({...reqData});
			const saveDetails = await newOtpDetails.save();
			return saveDetails;

		}catch(ex){
			console.log("UsersInfoDao - otpCreation || Error : ", ex.message);
            throw new PDEError({err: ex.message});
		}
	}

	otpfAndUpdate = async (identify,reqData) =>{
		if(!reqData){
			console.error(" UsersInfoDao - OtpfAndUpdate || reqData can't be empty")
            throw new Error("reqData invalid for Otp");
		};
		try{
			let updateData =await otpModel.findOneAndUpdate(identify,reqData,{upsert:true,returnOriginal:false})
			// await otpModel.findOneAndUpdate(otpData,{"status":false});
			return updateData;
		}catch(ex){
			console.log("UsersInfoDao - OtpfAndUpdate || Error : ", ex.message);
            throw new PDEError({err: ex.message});;
		}
	}
	otpfindOne = async (userData)=>{
		if(!userData){
			console.error(" UsersInfoDao - otpfindOne || reqData can't be empty")
            throw new Error("Invalid");
		};
		try{
			let existOrNot = await otpModel.findOne(userData);
			console.log("!!!!!!!!!!!DATA!!!",existOrNot);
			return existOrNot;
		}catch(ex){
			console.log("UsersInfoDao - otpfindOne || Error : ", ex.message);
            throw new PDEError({err: ex.message});;
		}
	}
	userFindMethod = async (userData)=>{
		
		if(!userData){
			console.error(" UsersInfoDao - userFindMethod || reqData can't be empty")
            throw new Error("Invalid");
		};
		try{
			let existOrNot = await userModel.find(userData)
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
			let existOrNot = await userModel.findOne(userData)
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
			let updateData =await userModel.findOneAndUpdate(identify,reqData)
			// await otpModel.findOneAndUpdate(otpData,{"status":false});
			return updateData;
		}catch(ex){
			console.log("UsersInfoDao - otpUpdate || Error : ", ex.message);
            throw new PDEError({err: ex.message});;
		}
	}
};
module.exports = UsersInfoDao;