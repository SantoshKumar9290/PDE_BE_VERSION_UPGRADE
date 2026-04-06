const idsModel = require("../model/idGenerate");
const mongoose = require("mongoose");
const moment = require('moment');
const {encryptWithAESPassPhrase} = require('../utils/index')
const getValueForNextSequence = async (sequenceOfName) => {
	let data={}
	if (sequenceOfName === "SR") {
		let srNo = await idsModel.findOne({
			sroNumber: sequenceOfName,year:new Date().getFullYear()
		});
		if (srNo === null) {
			data.year = new Date().getFullYear();
			data.sroNumber = sequenceOfName;
			data.sequenceValue= Number(1);
			const resultIds = new idsModel(data);
			await resultIds.save();
			return data.sequenceValue;
		} 
		else {
			const sNo = srNo.sequenceValue;
			const seqNo = Number(sNo) + 1;
			data = await idsModel.findOneAndUpdate(
			{ sroNumber: sequenceOfName },
			{ sequenceValue: seqNo }
			);
			return data.sequenceValue + 1
		}
	  
	}
};

const findOneMethod = async (collectionName, query)=>{
	try{

		const data =await mongoose.connection.db
		.collection(collectionName).
		findOne(query).then((err,fdata)=>{
			if(err){
				throw err
			}
			return fdata
		})
		return data;
	}catch(ex){
		return ex;
	}
}

const fAndUpdateMethod = async (clName,identify,query)=>{
	try{
	const data =await mongoose.connection.db
		.collection(clName).findOneAndUpdate(identify,{$set:query}).then((err,fData)=>{
			if(err){
				throw err;
			}
			return fData;
		})
		return data;
	}catch(ex){
		return ex;
	}
}

const dateFormat = async (date)=>{
	return moment(date,['YYYY/MM/DD','DD/MM/YYYY','YYYY-MM-DD','DD-MM-YYYY']).format('DD/MM/YYYY')
}

const InsertWordOnCerIntervel = async (data)=>{
	return data.flatMap((w,i) => (i+1) % 3 === 0 ? [w, "\n"] : w);
}
const drSurveyList = async (data)=>{
	let fData=""
	for(let j in data) {
		fData = fData =="" ? data[j] : data[j] === "\n"  ? fData + data[j]  : fData +"," + data[j];}
	return fData;
	
}
let fHash;
const hashGenerate = async (data)=>{
	let hash = encryptWithAESPassPhrase(data, "123456");
	if(String(hash).includes("/")){
		hashGenerate(data)
	}else{
		fHash = hash;
	}
	return fHash;
	
}

const isSameDay= (d1,d2)=> {
	d1 = new Date(d1); d2 = new Date(d2);
	return d1.getFullYear() === d2.getFullYear() &&
	  d1.getDate() === d2.getDate() &&
	  d1.getMonth() === d2.getMonth();
}

module.exports = { 
  getValueForNextSequence,fAndUpdateMethod,findOneMethod,dateFormat,InsertWordOnCerIntervel,drSurveyList,hashGenerate,isSameDay
};
