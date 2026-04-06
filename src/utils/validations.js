
var emaiPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
let regex = /(?=[A-Za-z ]+$).{2,}$/;
var mobilePattern = /^[0-9]{10}$/;
let payMode =['CASH','UPI','CHEQUE','NEFT/RTGS'];
const documentModel = require('../model/documentDetailsModel');
const paymentmodel = require('../model/paymentDetailsModel');
const PartyModel = require('../model/partiesModel');
const representModel = require('../model/representModel');
const slotModel = require('../model/slotModel');
const PropertyModel = require('../model/propertyModel');
const sysConstanst = require('./sysConstanst');
const userValidations = async (reqBody)=>{

	let DistList = [
        "SRIKAKULAM",
        "VIZIANAGARAM",
        "Parvatipuram Manyam",
		"MANYAM",
        "ANAKAPALLI",
        "ALLURI SITHARAMA RAJU",
        "VISAKHAPATNAM",
        "EAST GODAVARI",
        "KAKINADA",
        "KONASEEMA",
        "WEST GODAVARI",
        "ELURU",
        "KRISHNA",
        "NTR",
        "GUNTUR",
        "BAPATLA",
        "PALNADU",
        "PRAKASAM",
        "SRI POTTI SRIRAMULU NELLORE",
		"SPS NELLORE",
        "TIRUPATI",
        "CHITTOOR",
        "ANNAMAYYA",
        "YSR KADAPA",
		"YSR",
        "SRI SATHYA SAI",
        "ANANTAPUR",
        "KURNOOL",
        "NANDYAL"
    ];
	let result={};

}

const userCredsValidation = async (reqBody)=>{
	let result={};
	if(reqBody.loginEmail && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(reqBody.loginEmail)){
		result.err="Invalid Email Pattern";
		result.status = false;
	}else if(reqBody.loginName && !regex.test(reqBody.loginName)){
		result.err="Only Alphabets are allowed(loginName)";
		result.status = false;
	}else if(reqBody.loginMobile && !mobilePattern.test(reqBody.loginMobile)){
		result.err="Invalid MobileNumber";
		result.status = false;
	}else if(reqBody.aadhar && !/^[0-9]{12}$/.test(reqBody.aadhar)){
		result.err="Invalid Aadhar";
		result.status = false;
	}
	else{
		result.status = true;
	}
	return result;
};
const documentValidation = async (reqBody)=>{
	let result ={};
	if(new Date(reqBody.executionDate) < new Date().toISOString().slice(0, 10)){
		result.err=`ExecutionDate Date should not be less than Today`;
		result.status = false;
	}else if(new Date(reqBody.stampPurchaseDate) > new Date(reqBody.executionDate) ){
		result.err=`StampPurchase Date should not be greater  than ExcutionDay`;
		result.status = false;
	}else{
		result.status = true;
	}
	return result
}

const paymentValidations = async (reqBody,reqMethod)=>{
	let result ={};
	let docData = await documentModel.findOne({documentId:reqBody.documentId});
	let payementdata = await paymentmodel.find({documentId:reqBody.documentId});
	let value =0;
	if(reqMethod === sysConstanst.REQ_METHOD_CREATE){
		for(let i in payementdata){
			value = Number(value) + Number(payementdata[i].payAmount);
		}
	}else if(reqMethod === sysConstanst.REQ_METHOD_EDIT){
		for(let i in payementdata){
			if(payementdata[i].id !== reqBody.id){
				value = Number(value) + Number(payementdata[i].payAmount);
			}
		}
	}
	
	let totalValue = Number(value) + Number(reqBody.payAmount);
	if(reqBody.paymentMode && !payMode.includes(reqBody?.paymentMode)){
		result.err="Invalid paymentMode";
		result.status = false;
	}else if(reqBody.payAmount === "0"){
		result.err="Amount should Not be Zero";
		result.status = false;
	}
	else if(totalValue > docData.amount){
		result.err="Total Payment amount Should be Equal to Consideration Value";
		result.status = false;
	}else if(new Date(reqBody.dateOfPayment) > new Date()){
		result.err=`Payment Date Should not be Greater than Today`;
		result.status = false;
	}else if(Number(reqBody.payAmount) < 0){
		result.err=`Payamount should not less than Zero`;
		result.status = false;
	}else{
		result.status =true
	}
	return result;
}
const partyValidation = async(reqBody,reqUser,reqMethod,type)=>{
	let result ={};
	if(reqMethod ==="Create"){
		let documentData = await documentModel.findOne({documentId:reqBody.applicationId});
		let representData= await representModel.find({documentId:reqBody.applicationId,aadhaar:reqBody.aadhaar})
		let partyData =[];
		if(reqBody.partyType ==="Public"){
			partyData = await PartyModel.find({applicationId:reqBody.applicationId,aadhaar:reqBody.aadhaar});
		}
		if(documentData == null){
			result.err=`No Document Present for this id`;
			result.status = false;
		}
		// else if(reqUser.userId !== documentData.userId){
		// 	result.err=`UnAuthorized`;
		// 	result.code="401",
		// 	result.status = false;
		// }
		// /else if(reqBody.partyType ==="Public" && partyData && partyData.length>0){
		// 	result.err= "Duplicate Aadhar card Entry Not allowed"
		// 	result.status = false;
		// }
		// else if(representData && representData.length >0){
		// 	result.err= "Duplicate Aadhar card Entry Not allowed";
		// 	result.status = false;
		// }
		else if(documentData.documentId !== reqBody.applicationId ){
			result.err=`DocumentId is Not Valid`;
			result.status = false;
		}else{
			return true;
		}
	}
	return result;
}
const covenantValidations = async(reqBody,reqUser,type)=>{
	let result ={};
	let documentData = await documentModel.findOne({documentId:reqBody.documentId});
	if(type ==="Create"){
		if(documentData == null){
			result.err=`No Document Present for this id`;
			result.status = false;
		}else if(reqUser.userId !== documentData.userId){
			result.err=`UnAuthorized`;
			result.code="401",
			result.status = false;
		}
		else if(documentData.documentId !== reqBody.documentId){
			result.err=`DocumentId is Not Valid`;
			result.status = false;
		}else if(documentData.documentType && documentData.documentType.TRAN_DESC !== reqBody.natureType){
			result.err=`natureType is Not valid`;
			result.status = false;
		}else{
			return true;
		}
	}
	if(type ==="Edit"){
		if(reqUser.userId !== documentData.userId){
			result.err=`UnAuthorized`;
			result.code="401",
			result.status = false;
		}
		else if(documentData.documentId !== reqBody.documentId){
			result.err=`DocumentId is Not Valid`;
			result.status = false;
		}else{
			return true;
		}
	}
	return result;
}
const slotBookingValidation = async (reqBody)=>{
	let result ={};
	const fifteenDaysFromToday = new Date();
	fifteenDaysFromToday.setDate(new Date().getDate() + 15);
	let documentData = await documentModel.findOne({documentId:reqBody.applicationId});
	let slotTimes = await slotModel.findOne({dateForSlot:new Date(reqBody.dateForSlot),sroOfcNum:reqBody.sroOfcNum})
	let slt = await slotModel.find({slots:{$elemMatch:{applicationId:reqBody.applicationId}}});
	let appId=[],cSlotTime=[];
	if(slotTimes && slotTimes.slots){
		slotTimes.slots.find((x)=>{
			if(x.applicationId === reqBody.applicationId)
				appId.push(x.applicationId)
			if(x.slotTime === reqBody.slotTime)
				cSlotTime.push(x.slotTime)
		});
	}
	// db.test.find({list: {$elemMatch: {a: 1}}}, {'list.$': 1})
	let [date,rest] = String(reqBody.dateForSlot).split("T");
	if(new Date(date) < new Date()){
		result.err=`Slot Date Should be Greater than Today`;
		result.status = false;
	}
	else if(appId.includes(reqBody.applicationId) || slt && slt.length >0){
		result.err=`The slot has been booked for this applicationId.`;
		result.status = false;
	}else if(cSlotTime.includes(reqBody.slotTime)){
		result.err=`The slot time is not available on this day.`;
		result.status = false;
	}
	else if(isSecondSaturday(date) === true){
		result.err=`SlotBooking Date Is Invalid(Second Saturday)`;
		result.status = false;
	}else if(isSunday(date) === true){
		result.err=`SlotBooking Date Is Invalid(SunDay)`;
		result.status = false;
	}else if(documentData.sroOffice.toUpperCase() !== reqBody.sroOffice.toUpperCase()){
		result.err=`sroOffice is Invalid`;
		result.status = false;
	}else if(Number(documentData.sroCode) !== Number(reqBody.sroOfcNum)){
		result.err=`sroOfcNum is Invalid`;
		result.status = false;
	}else if(documentData.district.toUpperCase() !== reqBody.sroDistrict.toUpperCase()){
		result.err=`sroDistrict is Invalid`;
		result.status = false;
	}else if(new Date(reqBody.dateForSlot) > fifteenDaysFromToday){
		result.err=`The given date is more than 15 days from today.`;
		result.status = false;
	}
	else{
		return true;
	}
	return result;
}
function isSecondSaturday(date) {
	const dayOfWeek = new Date(date).getDay();
	const dayOfMonth = new Date(date).getDate();
	
	if (dayOfWeek === 6 && dayOfMonth >= 8 && dayOfMonth <= 14) {
	  return true;
	} else {
	  return false;
	}
}
function isSunday(date) {
	const dayOfWeek = new Date(date).getDay();
	if (dayOfWeek === 0) {
	  return true;
	} else {
	  return false;
	}
}
const PropertyValidation = async(reqBody)=>{
	let result ={};
	let propValidation = await PropertyModel.find({applicationId:reqBody.applicationId,villageCode:reqBody.villageCode,habitationCode:reqBody.habitationCode});
	let ExtentCheck=false;
	if(propValidation && propValidation){
		
			if(String(propValidation.sroCode) === String(reqBody.sroCode) && String(propValidation.habitationCode) ===String(reqBody.habitationCode) && String(propValidation.villageCode) ===String(reqBody.villageCode) && String(propValidation.survayNo) === String(reqBody.survayNo) ){
				ExtentCheck= true;
			}
	}

	if(ExtentCheck === true){

		result.err=`Property Existing with this ApplicationId`;
		result.status = false;
	}else{
		result.status = true
	};
	return result;
}



module.exports ={userValidations, userCredsValidation,paymentValidations,covenantValidations,slotBookingValidation,partyValidation, documentValidation,PropertyValidation}