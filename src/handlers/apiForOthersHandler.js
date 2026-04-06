const APIService = require('../services/apiForOtherServices');
const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
// const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("./errorHandler");
const EcCcService = require('../services/ecCcServices')
const { DecryptAdrwithPkcs } = require("../utils");
const moment = require('moment');
const thirdPartyAPIResponseDao= require('../dao/thirdPartyAPIResponseDao');
const villageServices =require('../services/villageService')
const { validateHashKey ,generateHash, sslrGenerateHash} = require('../plugins/auth/authService');
class APIHandler {
    constructor() {
        this.apiHandlerService = new APIService();
        this.thirdPartyAPIDao = new thirdPartyAPIResponseDao();
        this.EcCcService = new EcCcService
        this.villageService = new villageServices()
    }

    doctdetailsHndlr = async (req, res) => {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
      dept_type:'VSWS'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
      if(scheduleTime.length>0){
 
         if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
          return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else{
     return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
              status: false,
              message: "Can no access the API"
            }
          );
    }
      const qParams = req.query;
      const requiredFields = [
        "SRCODE",
        "DOCNO",
        "RYEAR",
        "BOOKNO",
        "USERNAME",
        "PASSWORD"
    ];    
        for (let field of requiredFields) {
            if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
          res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
            {
              status: false,
              message: NAMES.VALIDATION_ERROR
            }
          );
          return;
        }
      }
        try {
            const currentYear = new Date().getFullYear();
            if(qParams.RYEAR >currentYear){

                return res.status(400).json({ status: false,
                    message: "Registration Year should be less than or equal to current year." });
            }
            if(qParams.USERNAME !='gsws_igrs' || qParams.PASSWORD != 'GswsIgrs@22'){
                return res.status(400).json({ status: false,
                    message: "Invalid Username or Password." });
            }
            else{
              if (qParams.USERNAME === 'gsws_igrs' && qParams.PASSWORD === 'GswsIgrs@22') {
                const isMutationCompleted = await this.apiHandlerService.checkAutoMutationGSWSSrvc(qParams);
                if (isMutationCompleted) {
                  return res.status(200).json({
                    status: true,
                    message: "For the given Document Number, Automutation is already completed."
                  });
                }
              }
          let response = await this.apiHandlerService.doctdetailsSrvc(qParams);
          let responseData = {
            status: true,
            message: "Success",
            code: "200",
            data: response
          };
          res.status(200).send({ ...responseData });
        }
        } catch (ex) {
          console.error("apiForOthersHandler - doctdetailsSrvc || Error :", ex);
          const pdeError = constructPDEError(ex);
          return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
              status: false,
              message: pdeError.message
            }
          );
        }
      }
      downloadCCgswshndlr = async (req,res) => {
        const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
      dept_type:'VSWS/Higer Education'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
      if(scheduleTime.length>0){
 
         if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
          return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else{
     return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
              status: false,
              message: "Can no access the API"
            }
          );
    }
        let reqQuery = req.query; 
        let decrypteddata = DecryptAdrwithPkcs(decodeURIComponent(reqQuery.data))        
        reqQuery = JSON.parse(decodeURIComponent(decrypteddata));   
        if (reqQuery?.SR_CODE == null || reqQuery?.BOOK_NO == null || reqQuery?.REG_YEAR == null || reqQuery?.DOCT_NO == null || reqQuery?.USER_ID == null) {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
		try{
            let response = await this.EcCcService.getDataSrvc(reqQuery);
            if(response.length === 0){
                res.status(404).send({
                    status: false,
                    message: "No data found",
                    code: "404"
                })
                return;
            }else{
			let responseData = {
				status:true, 
				message: "Success",
				code: "200",
				data: response
			};
            res.status(200).send({...responseData});
        }
		}catch(ex){
			console.error("CCHandler - getData || Error :", ex);
            let PDEError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[NAMES.INTERNAL_SERVER_ERROR]).send(
                {
                    status: false,
                    message: PDEError.message
                }
            );
		}
	
    }
    
    DoctdetailsbyPANhndlr = async (req, res) => {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
      dept_type:'Commercial TAX'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
      if(scheduleTime.length>0){
 
         if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
          return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else{
     return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
              status: false,
              message: "Can no access the API"
            }
          );
    }
      const qParams = req.query;       
      const requiredFields = [
        "PAN_NO",
        "AADHAR"
      ];    
        for (let field of requiredFields) {
      if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: `${field} is required`
          }
        );
        return;
      }
      }
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(qParams.PAN_NO)) {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send({
          status: false,
          message: 'Invalid PAN number format'
        });
        return;
      }
      
      if (qParams.AADHAR.toString().length !== 12) {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send({
          status: false,
          message: 'Invalid Aadhaar number length'
        });
        return;
      }
      try {
        let response = await this.apiHandlerService.DoctdetailsbyPANSrvc(qParams);
        let responseData = {
          status: true,
          message: "Success",
          code: "200",
          data: response
        };
        res.status(200).send({ ...responseData });
      } catch (ex) {
        console.error("apiForOthersHandler - DoctdetailsbyPANhndlr || Error :", ex);
        const pdeError = constructPDEError(ex);
        return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
          {
            status: false,
            message: pdeError.message
          }
        );
      }
    }

    docTransDataByPan = async (req, res) =>{
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
      dept_type:'Commercial TAX'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
      if(scheduleTime.length>0){
 
         if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
          return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else{
     return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
              status: false,
              message: "Can no access the API"
            }
          );
    }
      const qParams = req.query;        
      const requiredFields = [
        "PAN_NO",
        "AADHAR"
      ];    
        for (let field of requiredFields) {
      if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: `${field} is required`
          }
        );
        return;
      }
      }
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(qParams.PAN_NO)) {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send({
          status: false,
          message: 'Invalid PAN number format'
        });
        return;
      }
      
      if (qParams.AADHAR.toString().length !== 12) {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send({
          status: false,
          message: 'Invalid Aadhaar number length'
        });
        return;
      }
      try {
        let response = await this.apiHandlerService.docTransDataByPan(qParams);
        let responseData = {
          status: true,
          message: "Success",
          code: "200",
          data: response
        };
        res.status(200).send({ ...responseData });
      } catch (ex) {
        console.error("apiForOthersHandler - Document Transaction Data By Pan || Error :", ex);
        const pdeError = constructPDEError(ex);
        return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
          {
            status: false,
            message: pdeError.message
          }
        );
      }
    }

    pdeDocStatushndl = async (req, res) => {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
      dept_type:'RTGS'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
      if(scheduleTime.length>0){
 
         if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
          return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else{
     return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
              status: false,
              message: "Can no access the API"
            }
          );
    }
      const reqBody = req.query;
      
  const { FROM_DATE, TO_DATE } = req.query;
  const dateFormat = 'DD-MM-YY';
  if (!FROM_DATE || !TO_DATE) {
    return res.status(400).json({ status: false,
      message: "FROM_DATE and TO_DATE are required." });
  }
  if (!moment(FROM_DATE, dateFormat, true).isValid() || !moment(TO_DATE, dateFormat, true).isValid()) {
    return res.status(400).json({ status: false,
      message: `Dates must be in the format ${dateFormat}.` });
  }
  const fromDate = moment(FROM_DATE, dateFormat);
  const toDate = moment(TO_DATE, dateFormat);
  if (fromDate.isAfter(toDate)) {
    return res.status(400).json({ status: false,
      message: "FROM_DATE should be less than TO_DATE." });
  }
  const today = moment();
  if (fromDate.isAfter(today) || toDate.isAfter(today)) {
    return res.status(400).json({ 
        status: false,
    message: "Dates cannot be in the future." });
  }
      try {      
          let response = await this.apiHandlerService.pdeDocStatusSrvc(reqBody);
          let responseData = {
              status: true,
              message: "Success",
              code: "200",
              data: response
          };
          res.status(200).send({ ...responseData });
      }catch(ex){
    console.error("apiForOthersHandler - pdeDocStatushndl || Error :", ex);
          var pdeError = constructPDEError(ex);
          return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
              {
                  status: false,
                  message: NAMES.INTERNAL_SERVER_ERROR
              }
          );
  }
  }
  
  getDocumentRegistrationService = async (req,res) => {
    const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
      dept_type:'RTGS'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
      if(scheduleTime.length>0){
 
         if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
          return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else{
     return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
              status: false,
              message: "Can no access the API"
            }
          );
    }
    const reqParams = req.body;
    if (!reqParams.from_date || !reqParams.to_date) {
        return res.status(400).send({
            status: false,
            message: !reqParams.from_date ? "From Date is required" :  "To Date is required" 
        });
    }     
    const isFromDateValid = moment(reqParams.from_date, 'DD-MM-YYYY', true).isValid();
    const isToDateValid = moment(reqParams.to_date, 'DD-MM-YYYY', true).isValid();

    if (!isFromDateValid || !isToDateValid) {
      return res.status(400).send({
          status: false,
          message: "Dates must be in DD-MM-YYYY format"
      });
  }
  const fromDate = moment(reqParams.from_date, 'DD-MM-YYYY');
  const toDate = moment(reqParams.to_date, 'DD-MM-YYYY');

  if (fromDate.isAfter(toDate)) {
    return res.status(400).send({
        status: false,
        message: "From Date must be less than or equal to To Date"
    });
}           
try {
  let response = await this.apiHandlerService.getDocumentRegistrationService(reqParams);
  let responseData = {
    status: true,
    message: "Success",
    code: "200",
    data: response
  };
  res.status(200).send({ ...responseData });
} catch (ex) {
  console.error("apiForOthersHandler - getDocumentRegistrationService || Error :", ex);
  const pdeError = constructPDEError(ex);
  return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
    {
      status: false,
      message: pdeError.message
    }
  );
}
}
getDocumentECService = async (req,res) => {
  const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
      dept_type:'RTGS'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
      if(scheduleTime.length>0){
 
         if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
          return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else{
     return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
              status: false,
              message: "Can no access the API"
            }
          );
    }
  const reqParams = req.body;
  if (!reqParams.from_date || !reqParams.to_date) {
      return res.status(400).send({
          status: false,
          message: !reqParams.from_date ? "From Date is required" :  "To Date is required" 
      });
  }       
  const isFromDateValid = moment(reqParams.from_date, 'DD-MM-YYYY', true).isValid();
  const isToDateValid = moment(reqParams.to_date, 'DD-MM-YYYY', true).isValid();

  if (!isFromDateValid || !isToDateValid) {
    return res.status(400).send({
        status: false,
        message: "Dates must be in DD-MM-YYYY format"
    });
}
const fromDate = moment(reqParams.from_date, 'DD-MM-YYYY');
const toDate = moment(reqParams.to_date, 'DD-MM-YYYY');

if (fromDate.isAfter(toDate)) {
  return res.status(400).send({
      status: false,
      message: "From Date must be less than or equal to To Date"
  });
}         
try {
let response = await this.apiHandlerService.getDocumentECService(reqParams);
let responseData = {
  status: true,
  message: "Success",
  code: "200",
  data: response
};
res.status(200).send({ ...responseData });
} catch (ex) {
console.error("apiForOthersHandler - getDocumentECService || Error :", ex);
const pdeError = constructPDEError(ex);
return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
  {
    status: false,
    message: pdeError.message
  }
);
}
}
getDocumentCCService = async (req,res) => {
  const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
      dept_type:'RTGS'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
      if(scheduleTime.length>0){
 
         if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
          return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else{
     return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
              status: false,
              message: "Can no access the API"
            }
          );
    }
const reqParams = req.body;
if (!reqParams.from_date || !reqParams.to_date) {
    return res.status(400).send({
        status: false,
        message: !reqParams.from_date ? "From Date is required" :  "To Date is required" 
    });
}      
const isFromDateValid = moment(reqParams.from_date, 'DD-MM-YYYY', true).isValid();
const isToDateValid = moment(reqParams.to_date, 'DD-MM-YYYY', true).isValid();

if (!isFromDateValid || !isToDateValid) {
  return res.status(400).send({
      status: false,
      message: "Dates must be in DD-MM-YYYY format"
  });
}
const fromDate = moment(reqParams.from_date, 'DD-MM-YYYY');
const toDate = moment(reqParams.to_date, 'DD-MM-YYYY');

if (fromDate.isAfter(toDate)) {
return res.status(400).send({
    status: false,
    message: "From Date must be less than or equal to To Date"
});
}          
try {
let response = await this.apiHandlerService.getDocumentCCService(reqParams);
let responseData = {
status: true,
message: "Success",
code: "200",
data: response
};
res.status(200).send({ ...responseData });
} catch (ex) {
console.error("apiForOthersHandler - getDocumentECService || Error :", ex);
const pdeError = constructPDEError(ex);
return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
{
  status: false,
  message: pdeError.message
}
);
}
}

 getHigherEducationDataHndlr = async (req, res) => {
    try {
  const currentTime = new Date();
      const currentHour = currentTime.getHours();
            const qParams = req.query;
      let reqData={
      dept_type: qParams.USERNAME === 'higher_education_igrs' ?'HigherEducation' : 'APDBMS'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
      if(scheduleTime.length>0){
 
         if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
          return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else{
     return res.status(400).send(
            {
              status: false,
              message: "Can not access the API"
            }
          );
    }
      const requiredFields = [
        "SRCODE",
        "DOCNO",
        "RYEAR",
        "BOOKNO",
        "USERNAME",
        "PASSWORD"
    ];    
        for (let field of requiredFields) {
            if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
          res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
            {
              status: false,
              message: NAMES.VALIDATION_ERROR
            }
          );
          return;
        }
      }
      
            const currentYear = new Date().getFullYear();
            if(qParams.RYEAR >currentYear){

                return res.status(400).json({ status: false,
                    message: "Registration Year should be less than or equal to current year." });
            }
          if (!((qParams.USERNAME === 'higher_education_igrs' && qParams.PASSWORD === 'HiEdu@23#') || (qParams.USERNAME === 'apdbms_igrs' && qParams.PASSWORD === 'ApDBms@25#')))  {
                return res.status(400).json({ status: false,
                    message: "Invalid Username or Password." });
            }
            else{
          let response = await this.apiHandlerService.doctdetailsSrvc(qParams);
          let responseData = {
            status: true,
            message: "Success",
            code: "200",
            data: response
          };
          res.status(200).send({ ...responseData });
        }
        } catch (ex) {
          console.error("apiForOthersHandler - doctdetailsSrvc || Error :", ex);
          const pdeError = constructPDEError(ex);
          return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
              status: false,
              message: pdeError.message
            }
          );
        }
      }
  

      DoctdetailsbyTAXhndlr = async (req, res) => {   
        const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
      dept_type:'Commercial TAX'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
      if(scheduleTime.length>0){
 
         if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
          return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else{
     return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
              status: false,
              message: "Can no access the API"
            }
          );
    }         
      const qParams = req.query;       
      const requiredFields = [
        "PAN_NO",
      ];    
        for (let field of requiredFields) {
      if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: `${field} is required`
          }
        );
        return;
      }
      }
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(qParams.PAN_NO)) {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send({
          status: false,
          message: 'Invalid PAN number format'
        });
        return;
      }

      try {
        let response = await this.apiHandlerService.DoctdetailsbyTAXSrvc(qParams);
        let responseData = {
          status: true,
          message: "Success",
          code: "200",
          data: response
        };
        res.status(200).send({ ...responseData });
      } catch (ex) {
        console.error("apiForOthersHandler - DoctdetailsbyPANhndlr || Error :", ex);
        const pdeError = constructPDEError(ex);
        return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
          {
            status: false,
            message: pdeError.message
          }
        );
      }
    }
 
  GetSlotBookingStatistics = async (req, res) => {
    const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
      dept_type:'IVRS'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
      if(scheduleTime.length>0){
 
         if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
          return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else{
     return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
              status: false,
              message: "Can no access the API"
            }
          );
    }
    const reqParams = req.query;
    if (!reqParams.FROM_DATE || !reqParams.TO_DATE) {
      return res.status(400).send({
        status: false,
        message: !reqParams.FROM_DATE ? "From Date is required" : "To Date is required"
      });
    }
    const isFromDateValid = moment(reqParams.FROM_DATE, 'DD-MM-YYYY', true).isValid();
    const isToDateValid = moment(reqParams.TO_DATE, 'DD-MM-YYYY', true).isValid();

    if (!isFromDateValid || !isToDateValid) {
      return res.status(400).send({
        status: false,
        message: "Dates must be in DD-MM-YYYY format"
      });
    }
    const fromDate = moment(reqParams.FROM_DATE, 'DD-MM-YYYY');
    const toDate = moment(reqParams.TO_DATE, 'DD-MM-YYYY');

    if (fromDate.isAfter(toDate)) {
      return res.status(400).send({
        status: false,
        message: "From Date must be less than or equal to To Date"
      });
    }
    try {
      let response = await this.apiHandlerService.GetSlotBookingStatistics(reqParams);
      let responseData = {
        status: true,
        message: "Success",
        code: "200",
        data: response
      };
      res.status(200).send({ ...responseData });
    } catch (ex) {
      console.error("apiForOthersHandler - GetSlotBookingStatistics || Error :", ex);
      const pdeError = constructPDEError(ex);
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
        {
          status: false,
          message: pdeError.message
        }
      );
    }
  }
  getECdownloaddetails = async (req,res) => {
    const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
      dept_type:'IVRS'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
      if(scheduleTime.length>0){
 
         if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
          return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else{
     return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
              status: false,
              message: "Can no access the API"
            }
          );
    }
  const reqParams = req.query;
  if (!reqParams.FROM_DATE || !reqParams.TO_DATE) {
      return res.status(400).send({
          status: false,
          message: !reqParams.FROM_DATE ? "From Date is required" :  "To Date is required" 
      });
  }       
  const isFromDateValid = moment(reqParams.FROM_DATE, 'DD-MM-YYYY', true).isValid();
  const isToDateValid = moment(reqParams.TO_DATE, 'DD-MM-YYYY', true).isValid();

  if (!isFromDateValid || !isToDateValid) {
    return res.status(400).send({
        status: false,
        message: "Dates must be in DD-MM-YYYY format"
    });
}
const fromDate = moment(reqParams.FROM_DATE, 'DD-MM-YYYY');
const toDate = moment(reqParams.TO_DATE, 'DD-MM-YYYY');

if (fromDate.isAfter(toDate)) {
  return res.status(400).send({
      status: false,
      message: "From Date must be less than or equal to To Date"
  });
}         
try {
let response = await this.apiHandlerService.getECdownloaddetails(reqParams);
let responseData = {
  status: true,
  message: "Success",
  code: "200",
  data: response
};
res.status(200).send({ ...responseData });
} catch (ex) {
console.error("apiForOthersHandler - getECdownloaddetails || Error :", ex);
const pdeError = constructPDEError(ex);
return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
  {
    status: false,
    message: pdeError.message
  }
);
}
}
  getCCdownloaddetails = async (req,res) => {
    const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
      dept_type:'IVRS'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
      if(scheduleTime.length>0){
 
         if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
          return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else{
     return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
              status: false,
              message: "Can no access the API"
            }
          );
    }
  const reqParams = req.query;
  if (!reqParams.FROM_DATE || !reqParams.TO_DATE) {
      return res.status(400).send({
          status: false,
          message: !reqParams.FROM_DATE ? "From Date is required" :  "To Date is required" 
      });
  }       
  const isFromDateValid = moment(reqParams.FROM_DATE, 'DD-MM-YYYY', true).isValid();
  const isToDateValid = moment(reqParams.TO_DATE, 'DD-MM-YYYY', true).isValid();

  if (!isFromDateValid || !isToDateValid) {
    return res.status(400).send({
        status: false,
        message: "Dates must be in DD-MM-YYYY format"
    });
}
const fromDate = moment(reqParams.FROM_DATE, 'DD-MM-YYYY');
const toDate = moment(reqParams.TO_DATE, 'DD-MM-YYYY');

if (fromDate.isAfter(toDate)) {
  return res.status(400).send({
      status: false,
      message: "From Date must be less than or equal to To Date"
  });
}         
try {
let response = await this.apiHandlerService.getCCdownloaddetails(reqParams);
let responseData = {
  status: true,
  message: "Success",
  code: "200",
  data: response
};
res.status(200).send({ ...responseData });
} catch (ex) {
console.error("apiForOthersHandler - getCCdownloaddetails || Error :", ex);
const pdeError = constructPDEError(ex);
return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
  {
    status: false,
    message: pdeError.message
  }
);
}
}

GetTotalregistartiondetails = async (req, res) => {
  const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
      dept_type:'IVRS'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
      if(scheduleTime.length>0){
 
         if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
          return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else{
     return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
              status: false,
              message: "Can no access the API"
            }
          );
    }
    const reqParams = req.query;
    if (!reqParams.FROM_DATE || !reqParams.TO_DATE) {
      return res.status(400).send({
        status: false,
        message: !reqParams.FROM_DATE ? "From Date is required" : "To Date is required"
      });
    }
    const isFromDateValid = moment(reqParams.FROM_DATE, 'DD-MM-YYYY', true).isValid();
    const isToDateValid = moment(reqParams.TO_DATE, 'DD-MM-YYYY', true).isValid();

    if (!isFromDateValid || !isToDateValid) {
      return res.status(400).send({
        status: false,
        message: "Dates must be in DD-MM-YYYY format"
      });
    }
    const fromDate = moment(reqParams.FROM_DATE, 'DD-MM-YYYY');
    const toDate = moment(reqParams.TO_DATE, 'DD-MM-YYYY');

    if (fromDate.isAfter(toDate)) {
      return res.status(400).send({
        status: false,
        message: "From Date must be less than or equal to To Date"
      });
    }
    try {
      let response = await this.apiHandlerService.GetTotalregistartiondetails(reqParams);
      let responseData = {
        status: true,
        message: "Success",
        code: "200",
        data: response
      };
      res.status(200).send({ ...responseData });
    } catch (ex) {
      console.error("apiForOthersHandler - GetSlotBookingStatistics || Error :", ex);
      const pdeError = constructPDEError(ex);
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
        {
          status: false,
          message: pdeError.message
        }
      );
    }
  }

  
  downloadCCForVMC = async (req, res) => {
    const reqQuery = req.query;
    if (reqQuery.srCode == null || reqQuery.srCode == undefined || reqQuery.bookNo == null || reqQuery.bookNo == undefined ||
      reqQuery.regYear == null || reqQuery.regYear == undefined || reqQuery.doctNo == null || reqQuery.doctNo == undefined) {
      return res.status(400).json({
        status: false,
        message: "Validation error: Missing required query parameters",
        code: 400
      });
    }
    const time = new Date().getHours();    
    try {
      //time indicates to execute the api between 8 pm to 8 am
      if (time >= 20 || time <= 8) {        
        let response = await this.apiHandlerService.getFileDownload(reqQuery);
        if (response.length === 0) {
          return res.status(404).json({
            status: false,
            message: "No data found",
            code: 404
          });
        }
        const responseData = {
          status: true,
          message: "Success",
          code: 200,
          data: response
        };
        return res.status(200).json(responseData);
      } else {
        throw new Error("Note: This service is available only between 8 pm to 8 am")
      }
    } catch (ex) {
      console.error("CCHandler - downloadCCForVMC || Error :", ex);
      const pdeError = constructPDEError(ex);
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
        {
          status: false,
          message: pdeError.message
        }
      );
    }
  }

MangoosedDbToOrcaleDB = async (req, res) => {            
      const qParams = req.query;       
      const requiredFields = [
        "FROM_DATE",
        "TO_DATE"
      ];    
        for (let field of requiredFields) {
      if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: `${field} is required`
          }
        );
        return;
      }
      }
      try {
        let response = await this.apiHandlerService.MangoosedDbToOrcaleDBSrc(qParams);
        let responseData = {
          status: true,
          message: "Success",
          code: "200",
          data: response
        };
        res.status(200).send({ ...responseData });
      } catch (ex) {
        console.error("apiForOthersHandler - mongoDBtoOracle || Error :", ex);
        const pdeError = constructPDEError(ex);
        return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
          {
            status: false,
            message: pdeError.message
          }
        );
      }
    }

     mutationsuccesscount = async (req,res) => {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  let reqData = {
    dept_type: 'EODB'
  }
  let scheduleTime = await this.apiHandlerService.getScheuleTime(reqData);      
  if (scheduleTime.length > 0) { 
    if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME) {
      return res.status(400).json({
        status: false,
        message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
      });
    }
  }
  else {
    return res.status(400).send(
      {
        status: false,
        message: "Can not access the API"
      }
    );
  }
  const reqParams = req.query;
  if (!reqParams.FROM_DATE || !reqParams.TO_DATE) {
    return res.status(400).send({
      status: false,
      message: !reqParams.FROM_DATE ? "From Date is required" : "To Date is required" 
    });
  }       

  const isFromDateValid = moment(reqParams.FROM_DATE, 'DD-MM-YYYY', true).isValid();
  const isToDateValid = moment(reqParams.TO_DATE, 'DD-MM-YYYY', true).isValid();

  if (!isFromDateValid || !isToDateValid) {
    return res.status(400).send({
      status: false,
      message: "Dates must be in DD-MM-YYYY format"
    });
  }

  const fromDate = moment(reqParams.FROM_DATE, 'DD-MM-YYYY');
  const toDate = moment(reqParams.TO_DATE, 'DD-MM-YYYY');

  if (fromDate.isAfter(toDate)) {
    return res.status(400).send({
      status: false,
      message: "From Date must be less than or equal to To Date"
    });
  }         

  try {
    let response = await this.apiHandlerService.mutationsuccesscount(reqParams);
    let responseData = {
      status: true,
      message: "Success",
      code: "200",
      data: response
    };
    res.status(200).send({ ...responseData });
  } catch (ex) {
    console.error("apiForOthersHandler - getECdownloaddetails || Error :", ex);
    const pdeError = constructPDEError(ex);
    return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
      {
        status: false,
        message: pdeError.message
      }
    );
  }
}
getAPDTCPdocumentsDataHndlr = async (req, res) => {
  try {
const currentTime = new Date();
    const currentHour = currentTime.getHours();
          const qParams = req.query;
    let reqData={
    dept_type: 'APDTCP' 
    }
    let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
    if(scheduleTime.length>0){

       if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
        return res.status(400).json({
        status: false,
        message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
      });
    }
  }
  else{
   return res.status(400).send(
          {
            status: false,
            message: "Can not access the API"
          }
        );
  }
    const requiredFields = [
      "SRCODE",
      "DOCNO",
      "RYEAR",
      "BOOKNO",
      "USERNAME",
      "PASSWORD"
  ];    
      for (let field of requiredFields) {
          if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: NAMES.VALIDATION_ERROR
          }
        );
        return;
      }
    }
    
          const currentYear = new Date().getFullYear();
          if(qParams.RYEAR >currentYear){

              return res.status(400).json({ status: false,
                  message: "Registration Year should be less than or equal to current year." });
          }
        if (!(qParams.USERNAME === process.env.APDTCP_USERNAME && qParams.PASSWORD === process.env.APDTCP_PASSWORD))  {
              return res.status(400).json({ status: false,
                  message: "Invalid Username or Password." });
          }
          else{
        let response = await this.apiHandlerService.doctdetailsSrvc(qParams);
        let responseData = {
          status: true,
          message: "Success",
          code: "200",
          data: response
        };
        res.status(200).send({ ...responseData });
      }
      } catch (ex) {
        console.error("apiForOthersHandler - doctdetailsSrvc || Error :", ex);
        const pdeError = constructPDEError(ex);
        return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
          {
            status: false,
            message: pdeError.message
          }
        );
      }
    }

    getAPDTCPbySurveyDocumentsDataHndlr = async (req, res) => {
      try {
    const currentTime = new Date();
        const currentHour = currentTime.getHours();
              const qParams = req.query;
        let reqData={
        dept_type: 'APDTCP' 
        }
        let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);
       
              
        if(scheduleTime.length>0){
   
           if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
            return res.status(400).json({
            status: false,
            message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
          });
        }
      }
      else{
       return res.status(400).send(
              {
                status: false,
                message: "Can not access the API"
              }
            );
      }
        const requiredFields = [
          "VILLAGE_CODE",
          "SRO_CODE",
          "survey_no",
          "USERNAME",
          "PASSWORD"
      ];    
          for (let field of requiredFields) {
              if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
              {
                status: false,
                message: NAMES.VALIDATION_ERROR
              }
            );
            return;
          }
        }
        
            
            if (!(qParams.USERNAME === 'apdtcp_Ap_igrs' && qParams.PASSWORD === 'ApDTcpIgrs@25$'))  {
                  return res.status(400).json({ status: false,
                      message: "Invalid Username or Password." });
              }
              else{
            let response = await this.apiHandlerService.getDoctApdtcpSchedleDataSrc(qParams);
            let responseData = {
              status: true,
              message: "Success",
              code: "200",
              data: response
            };
            res.status(200).send({ ...responseData });
          }
          } catch (ex) {
            console.error("apiForOthersHandler - doctdetailsSrvc || Error :", ex);
            const pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
              {
                status: false,
                message: pdeError.message
              }
            );
          }
        }





    getDocsDetails = async (req, res) => {            
      const qParams = req.query;
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentYear = currentTime.getFullYear();
      let reqData={
        dept_type:'Commercial TAX'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
      if(scheduleTime.length > 0 && currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME){
        const fromTime = `${(scheduleTime[0].FROM_TIME % 12 === 0 ? 12 : scheduleTime[0].FROM_TIME % 12)}:00 ${scheduleTime[0].FROM_TIME >= 12 ? "PM" : "AM"}`;
        const toTime = `${(scheduleTime[0].TO_TIME % 12 === 0 ? 12 : scheduleTime[0].TO_TIME % 12)}:00 ${scheduleTime[0].TO_TIME >= 12 ? "PM" : "AM"}`;
        return res.status(400).json({
          status: false,
          message: `Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (${fromTime} to ${toTime}). Access will resume at ${fromTime}. Thank you for your patience!`
        });
      }       
      const requiredFields = [ "SRCODE", "DOCNO", "RYEAR", "BOOKNO"];    
      for (let field of requiredFields) {
        if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
          res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
            {
              status: false,
              message: `${field} is required`
            }
          );
          return;
        }
      }
      if(qParams.BOOKNO != '1' || parseInt(qParams.RYEAR) > currentYear) {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: qParams.BOOKNO != '1' ? `BOOK NO should be 1` : `Registration Year should be less than or equal to current year`
          }
        );  
        return;
      }
      const runningStatus = await this.apiHandlerService.getRunningStatus({DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getDocsDetails'});
      if(!runningStatus) {
        return res.status(400).json({
          status: false,
          message: "Only one service request will be processed at a time."
        });
      }
      try {
        let response = await this.apiHandlerService.getDocsDetailsSrvc(qParams);
        await this.apiHandlerService.updateProcessingData({DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getDocsDetails'});
        let responseData = {
          status: true,
          message: "Success",
          code: "200",
          data: response
        };
        res.status(200).send({ ...responseData });
      } catch (ex) {
        console.error("apiForOthersHandler - getDocsDetails || Error :", ex);
        const pdeError = constructPDEError(ex);
        await this.apiHandlerService.updateProcessingData({DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getDocsDetails'});
        return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
          {
            status: false,
            message: pdeError.message
          }
        );
      }
    }

    getAPCFSSdocumentsDataHandler = async (req, res) => {
      try {
    const currentTime = new Date();
        const currentHour = currentTime.getHours();
              const qParams = req.query;
        let reqData={
        dept_type: 'APCFSS' 
        }
        let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);      
        if(scheduleTime.length>0){
    
           if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
            return res.status(400).json({
            status: false,
            message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
          });
        }
      }
      else{
       return res.status(400).send(
              {
                status: false,
                message: "Can not access the API"
              }
            );
      }
        const requiredFields = [
          "SRCODE",
          "DOCNO",
          "RYEAR",
          "BOOKNO",
          "USERNAME",
          "PASSWORD"
      ];    
          for (let field of requiredFields) {
              if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
              {
                status: false,
                message: NAMES.VALIDATION_ERROR
              }
            );
            return;
          }
        }
        
              const currentYear = new Date().getFullYear();
              if(qParams.RYEAR >currentYear){
    
                  return res.status(400).json({ status: false,
                      message: "Registration Year should be less than or equal to current year." });
              }
            if (!(qParams.USERNAME === 'apcfss_igrs' && qParams.PASSWORD === '@PCf$SIgrs@25$'))  {
                  return res.status(400).json({ status: false,
                      message: "Invalid Username or Password." });
              }
              else{
            let response = await this.apiHandlerService.doctdetailsSrvc(qParams);
            let responseData = {
              status: true,
              message: "Success",
              code: "200",
              data: response
            };
            res.status(200).send({ ...responseData });
          }
          } catch (ex) {
            console.error("apiForOthersHandler - doctdetailsSrvc || Error :", ex);
            const pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
              {
                status: false,
                message: pdeError.message
              }
            );
          }
        }
        getAPCFSSbySurveyDocumentsDataHndlr = async (req, res) => {
          try {
   
            
        const currentTime = new Date();
            const currentHour = currentTime.getHours();
                  const qParams = req.query;
            let reqData={
            dept_type: 'APCFSS' 
            }
            let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);
           
                  
            if(scheduleTime.length>0){
       
               if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME ) {
                return res.status(400).json({
                status: false,
                message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
              });
            }
          }
          else{
           return res.status(400).send(
                  {
                    status: false,
                    message: "Can not access the API"
                  }
                );
          }
            const requiredFields = [
              "VILLAGE_CODE",
              "SRO_CODE",
              "survey_no",
              "USERNAME",
              "PASSWORD"
          ];    
              for (let field of requiredFields) {
                  if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                  {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                  }
                );
                return;
              }
            }
            
                
                if (!(qParams.USERNAME === 'apcfss_igrs' && qParams.PASSWORD === '@PCf$SIgrs@25$'))  {
                      return res.status(400).json({ status: false,
                          message: "Invalid Username or Password." });
                  }
                  else{
                let response = await this.apiHandlerService.getDoctApdtcpSchedleDataSrc(qParams);
                let responseData = {
                  status: true,
                  message: "Success",
                  code: "200",
                  data: response
                };
                res.status(200).send({ ...responseData });
              }
              } catch (ex) {
                console.error("apiForOthersHandler - doctdetailsSrvc || Error :", ex);
                const pdeError = constructPDEError(ex);
                return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                  {
                    status: false,
                    message: pdeError.message
                  }
                );
              }
            }
  storeThirdPartyAPIResponse = async (req, res) => {
    if (Object.keys(req.body).length < 1 || !req.body.response) {
      return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json({
        status: false,
        message: `response  is required`
      })
    }
    try {
      const paramsToStoreThirdPartyData={
        source:req.body.source,
        request:{
          method:req.body.method,
          url:req.body.url,
          headers:req.body.headers,
          parameters:req.body.parameters
        },
        response:req.body?.response,
        status:req.body.status,
        module:req.body.module,
        userID:req.body?.userID
      }
      await this.thirdPartyAPIDao.create({...paramsToStoreThirdPartyData})
      return res.status(200).send({
        status: true,
        message:"data stored successfully"
      })
    } catch (error) {
      console.error("api for others handler - store thirdparty || Error :", error.message);
      var pdeError = constructPDEError(error);
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
        {
          status: false,
          message: NAMES.INTERNAL_SERVER_ERROR
        }
      );
    }

  }

getMvUnitRateService = async (req, res) => {
  const currentHour = new Date().getHours();
  try {
    // Check Schedule Time
    const scheduleTime = await this.apiHandlerService.getScheuleTime({ dept_type: 'CDMA' });
    if (!scheduleTime?.length) {
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send({
        status: false,
        message: "Cannot access the API"
      });
    }
    const { FROM_TIME, TO_TIME } = scheduleTime[0];
    // Block request during downtime
    if (currentHour >= FROM_TIME && currentHour < TO_TIME) {
      return res.status(400).json({
        status: false,
        message:
          "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
      });
    }
    // Validate required params
    const reqParams = req.body;
    const required = ['HABITATION', 'WARD', 'BLOCK', 'CLASSIFICATION'];

for (let f of required) {
  if (!reqParams[f]) {
    return res
      .status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR])
      .send({ status: false, message: `'${f}' is required` });
  }
}

// CLASSIFICATION VALIDATION & NORMALIZATION

let classification = reqParams.CLASSIFICATION;

if (classification === 'R') {
  reqParams.CLASSIFICATION = '01';        // Residential
} 
else if (classification === 'C') {
  reqParams.CLASSIFICATION = '02';        // Commercial
} 
else {
  return res
    .status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR])
    .send({ status: false, message: `Invalid CLASSIFICATION. Allowed values: R, C (R=RESIDENTIAL,C=COMMERCIAL)` });
}
// Main service call
const r = await this.apiHandlerService.getMvUnitRateService(reqParams);
    return res.status(r.success ? 200 : 404).send({
      status: r.success,
      code: r.success ? 200 : 404,
      message: r.message || "Success",
      data: r.data || []
    });

  } catch (ex) {
    const e = constructPDEError(ex);
    const s = NAMES_STATUS_MAPPINGS[e.name] || 500;

    return res.status(s).send({
      status: false,
      code: s,
      message: e.message || "Internal server error"
    });
  }
};
getdoctransactiondatabypan = async (req, res) => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    let reqData = {
      dept_type: 'Commercial TAX'
    }
    let scheduleTime = await this.apiHandlerService.getScheuleTime(reqData);
    if (scheduleTime.length > 0) {

      if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME) {
        return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else {
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
        {
          status: false,
          message: "Can no access the API"
        }
      );
    }
    const qParams = req.query;
    const requiredFields = [
      "PAN_NO"
    ];
    for (let field of requiredFields) {
      if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: `${field} is required`
          }
        );
        return;
      }
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(qParams.PAN_NO)) {
      res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send({
        status: false,
        message: 'Invalid PAN number format'
      });
      return;
    }
      try {
      let response = await this.apiHandlerService.getdoctransactiondatabypansrvc(qParams);
      let responseData = {
        status: true,
        message: "Success",
        code: "200",
        data: response
      };
      res.status(200).send({ ...responseData });
    } catch (ex) {
      console.error("apiForOthersHandler - Document Transaction Data By Pan || Error :", ex);
      const pdeError = constructPDEError(ex);
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
        {
          status: false,
          message: pdeError.message
        }
      );
    }
  }
  getppnotify = async (req, res) => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    let reqData = {
      dept_type: 'APDTCP'
    }
    let scheduleTime = await this.apiHandlerService.getScheuleTime(reqData);
    if (scheduleTime.length > 0) {

      if (currentHour >= scheduleTime[0].TO_TIME && currentHour < scheduleTime[0].FROM_TIME) {
        return res.status(400).json({
          status: false,
          message: "Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (8:00 AM to 8:00 PM). Access will resume at 8:00 PM. Thank you for your patience!"
        });
      }
    }
    else {
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
        {
          status: false,
          message: "Can no access the API"
        }
      );
    }
    const qParams = req.query;
    const requiredFields = [
      "VILLCODE"
    ];
    for (let field of requiredFields) {
      if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: `${field} is required`
          }
        );
        return;
      }
    }
    try {
      let response = await this.apiHandlerService.getppnotifysrvc(qParams);
      let responseData = {
        status: true,
        message: "Success",
        code: "200",
        data: response
      };
      res.status(200).send({ ...responseData });
    } catch (ex) {
      console.error("apiForOthersHandler - PP Notify data by vill code || Error :", ex);
      const pdeError = constructPDEError(ex);
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
        {
          status: false,
          message: pdeError.message
        }
      );
    }
  }

  getUrbanPropertyType = async (req, res) => {
    if (!req.query.doorNumber || !req.query.villageCode) {
      return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json({
        status: false,
        message: NAMES.VALIDATION_ERROR
      })
    }
    try {
      const villageCode = req.query.villageCode.length == 7 ? (req.query.villageCode).concat('01') : req.query.villageCode
      const getMuncipalityCodeDetails = await this.apiHandlerService.getMuncipalityCodeBasedOnVillageCode(villageCode)
      let token = await this.villageService.UrbanTokenGeneration({ flag: 1, ulbCode: getMuncipalityCodeDetails[0]?.MUNI_CODE });
      const finalData = await this.apiHandlerService.getSuggestedPropertyDetailsBasedOnDoorNumber({...getMuncipalityCodeDetails[0],...req.query})
      return res.json({
        ...finalData
      })

    } catch (ex) {
      console.error("apiForOthersHandler - getUrbanPropertyType || Error :", ex);
      const pdeError = constructPDEError(ex);
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
        {
          status: false,
          message: pdeError.message
        }
      );
    }

  }

  getRuralPropertyType = async (req, res) => {
    if (!req.query.surveyNumber || !req.query.villageCode) {
      return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json({
        status: false,
        message: NAMES.VALIDATION_ERROR 
      })
    }
    try {
      let response = await this.villageService.getCurrentPahaniDetailsSRO({sryno:req.query.surveyNumber,vgcode:req.query.villageCode});
      let finalResponse=[]
      if(response.length > 0){
        const nonDisputeLands = response?.filter(obj => obj.isAnyDispute.trim().toLowerCase() == 'no')
        finalResponse = nonDisputeLands.length > 0 ? await this.apiHandlerService.getLandClassificationService({...req.query},response):[]
      }
      let responseData = {
        status: true,
        message: "Success",
        code: "200",
        data: finalResponse
      };
      if(finalResponse.length<1){
        responseData.message='No data found',
        delete responseData.data
      }
      res.status(200).send({ ...responseData });
    } catch (ex) {
      console.error("apiForOthersHandler - getRuralPropertyType || Error :", ex);
      const pdeError = constructPDEError(ex);
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
        {
          status: false,
          message: pdeError.message
        }
      );
    }
  }

  insertOtherDetailsHandler = async (req, res) => {
  try {
    const body = req.body;
    const requiredFields = [
      "applicationNo",
      "oldSurveyNo",
      "newSurveyNo",
      "extent",
      // "stampDuty",
      // "marketValue",
      // "regFee",
      // "remarks",
      "District",
      "Village",
      "East",
      "West",
      "North",
      "South",
      "USERNAME",
      "PASSWORD",
    ];

    for (let field of requiredFields) {
      if (!body[field] || body[field].toString().trim() === "") {
        return res.status(400).json({
          status: false,
          message: `${field} is required`
        });
      }
    }
    const isValidHash = validateHashKey(body);
    if (!isValidHash) {
      return res.status(401).json({
        status: false,
        message: "Invalid Hash Key"
      });
    }
    const insertPayload = {
      application_no: body.applicationNo,
      old_survey_no: body.oldSurveyNo,
      new_survey_no: body.newSurveyNo,
      extent: body.extent,
      // stamp_duty: body.stampDuty,
      // market_value: body.marketValue,
      // reg_fee: body.regFee,
      // remarks: body.remarks,
      district: body.District,
      village: body.Village,
      east_boundary: body.East,
      west_boundary: body.West,
      north_boundary: body.North,
      south_boundary: body.South,
      created_by: body.USERNAME
    };

    const result = await this.apiHandlerService.insertOtherDetailsService(insertPayload);
    if (result?.duplicate) {
      return res.status(409).json({
        status: false,
        message: "Application Number already exists"
      });
    }
    return res.status(200).json({
      status: true,
      message: "Details inserted successfully",
      data: result
    });
  } catch (error) {
    console.error("insertOtherDetailsHandler Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error"
    });
  }
};

 genereteHashKeyHandler = async (req, res) => {
  try {
    const body = req.body;
   const requiredFields = [
      "applicationNo",
      "oldSurveyNo",
      "newSurveyNo",
      "extent",
      // "stampDuty",
      // "marketValue",
      // "regFee",
      // "remarks",
      "District",
      "Village",
      "East",
      "West",
      "North",
      "South",
      "USERNAME",
      "PASSWORD",
    ];

    for (let field of requiredFields) {
      if (!body[field] || body[field].toString().trim() === "") {
        return res.status(400).json({
          status: false,
          message: `${field} is required`
        });
      }
    }
    const hashKey = generateHash(body);
    return res.status(200).json({
      status: true,
      HASHKEY: hashKey
    });

  } catch (error) {
    console.error("generateOthersHashHandler Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error"
    });
  }
};

getProbhitedReport = async (req, res) => {
    try {
      const { VILL_CODE, PROPERTY_TYPE } = req.query;

      // Mandatory Validation
      if (!VILL_CODE || !PROPERTY_TYPE) {
        return res.status(400).json({
          status: false,
          message: "VILL_CODE and PROPERTY_TYPE are mandatory."
        });
      }

      const propertyType = PROPERTY_TYPE.toUpperCase();

      if (!['R', 'U'].includes(propertyType)) {
        return res.status(400).json({
          status: false,
          message: "PROPERTY_TYPE must be 'R' or 'U'."
        });
      }

      const response = await this.villageService.getProbhitedReport({...req.query,PROPERTY_TYPE: propertyType });
      return res.status(200).json({
        status: true,
        message: "Prohibited report fetched successfully.",
        data: response ?? []
      });

    } catch (error) {
      console.error("apiForOthersHandler Controller Error:", error);
      const pdeError = constructPDEError(error);
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name] || 500).json({
        status: false,
        message: pdeError.message || "Internal Server Error"
      });
    }
  };
    getSRODetails = async (req, res) => {
              const { VILL_CODE } = req.query;
        if (!VILL_CODE ) {
        return res.status(400).json({
          status: false,
          message: "VILL_CODE is mandatory."
        });
      }
        try {
            let response = await this.villageService.getSRODetails({...req.query});
            let responseData = {
				          status:true, 
				          message: "Success",
				          code: "200",
				          data: response
			  };
            res.status(200).send({...responseData});
        } catch (ex) {
            console.error("apiForOthersHandler - getSRODetails || Error :", ex);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            );
        }
    }

getECDetailsforSSLR = async (req, res) => {            
      const qParams = req.query;
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
        dept_type:'SSLR'
      }
      let scheduleTime=await this.apiHandlerService.getScheuleTime(reqData);
      if(scheduleTime.length > 0 && (currentHour >= scheduleTime[0].TO_TIME || currentHour < scheduleTime[0].FROM_TIME)){
        const fromTime = `${(scheduleTime[0].FROM_TIME % 12 === 0 ? 12 : scheduleTime[0].FROM_TIME % 12)}:00 ${scheduleTime[0].FROM_TIME >= 12 ? "PM" : "AM"}`;
        const toTime = `${(scheduleTime[0].TO_TIME % 12 === 0 ? 12 : scheduleTime[0].TO_TIME % 12)}:00 ${scheduleTime[0].TO_TIME >= 12 ? "PM" : "AM"}`;
        return res.status(400).json({
          status: false,
          message: `Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (${fromTime} to ${toTime}). Access will resume at ${fromTime}. Thank you for your patience!`
        });
      }      
      const requiredFields = [ "LPMNO", "VILLAGECODE", "HASHKEY"];    
      for (let field of requiredFields) {
        if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
          res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
            {
              status: false,
              message: `${field} is required`
            }
          );
          return;
        }
      }
      const hashKey = await sslrGenerateHash(qParams);  
      if (hashKey !== qParams.HASHKEY) {
        return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json({
          status: false,
          message: "Invalid HASHKEY"
        });
      }
      const runningStatus = await this.apiHandlerService.getRunningStatus({DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getECDetailsforSSLR'});
      if(!runningStatus) {
        return res.status(400).json({
          status: false,
          message: "Only one service request will be processed at a time."
        });
      }
      try {
        let response = await this.apiHandlerService.getECDetailsforSSLRSrvc(qParams);
        await this.apiHandlerService.updateProcessingData({DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getECDetailsforSSLR'});
        let responseData = {
          status: true,
          message: "Success",
          code: "200",
          data: response
        };
        res.status(200).send({ ...responseData });
      } catch (ex) {
        console.error("apiForOthersHandler - getECDetailsforSSLR || Error :", ex);
        const pdeError = constructPDEError(ex);
        await this.apiHandlerService.updateProcessingData({DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getECDetailsforSSLR'});
        return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
          {
            status: false,
            message: pdeError.message
          }
        );
      }
    }

    getDocDetailsforSSLR = async (req, res) => {            
      const qParams = req.query;
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentYear = currentTime.getFullYear();
      let reqData={
        dept_type:'SSLR'
      }
      let scheduleTime = await this.apiHandlerService.getScheuleTime(reqData);
      if(scheduleTime.length > 0 && (currentHour >= scheduleTime[0].TO_TIME || currentHour < scheduleTime[0].FROM_TIME)){
        const fromTime = `${(scheduleTime[0].FROM_TIME % 12 === 0 ? 12 : scheduleTime[0].FROM_TIME % 12)}:00 ${scheduleTime[0].FROM_TIME >= 12 ? "PM" : "AM"}`;
        const toTime = `${(scheduleTime[0].TO_TIME % 12 === 0 ? 12 : scheduleTime[0].TO_TIME % 12)}:00 ${scheduleTime[0].TO_TIME >= 12 ? "PM" : "AM"}`;
        return res.status(400).json({
          status: false,
          message: `Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (${fromTime} to ${toTime}). Access will resume at ${fromTime}. Thank you for your patience!`
        });
      }      
      const requiredFields = [ "SRCODE", "DOCTNO", "RYEAR", "HASHKEY"];    
      for (let field of requiredFields) {
        if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
          res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
            {
              status: false,
              message: `${field} is required`
            }
          );
          return;
        }
      }
      const hashKey = await sslrGenerateHash(qParams);
      if (hashKey !== qParams.HASHKEY) {
        return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json({
          status: false,
          message: "Invalid HASHKEY"
        });
      }
      if(parseInt(qParams.RYEAR) > currentYear) {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: `Registration Year should be less than or equal to current year`
          }
        );  
        return;
      }
      const runningStatus = await this.apiHandlerService.getRunningStatus({DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getDocDetailsforSSLR'});
      if(!runningStatus) {
        return res.status(400).json({
          status: false,
          message: "Only one service request will be processed at a time."
        });
      }
      try {
        qParams.DOCNO = qParams.DOCTNO;
        qParams.BOOKNO = 1;
        qParams.USERNAME = req.user;
        let response = await this.apiHandlerService.doctdetailsSrvc(qParams);
        await this.apiHandlerService.updateProcessingData({DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getDocDetailsforSSLR'});
        let responseData = {
          status: true,
          message: "Success",
          code: "200",
          data: response
        };
        res.status(200).send({ ...responseData });
      } catch (ex) {
        console.error("apiForOthersHandler - getDocDetailsforSSLR || Error :", ex);
        const pdeError = constructPDEError(ex);
        await this.apiHandlerService.updateProcessingData({DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getDocDetailsforSSLR'});
        return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
          {
            status: false,
            message: pdeError.message
          }
        );
      }
    }

    getMarketValueforSSLR = async (req, res) => {            
      const qParams = req.query;
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
        dept_type:'SSLR'
      }
      let scheduleTime = await this.apiHandlerService.getScheuleTime(reqData);
      if(scheduleTime.length > 0 && (currentHour >= scheduleTime[0].TO_TIME || currentHour < scheduleTime[0].FROM_TIME)){
        const fromTime = `${(scheduleTime[0].FROM_TIME % 12 === 0 ? 12 : scheduleTime[0].FROM_TIME % 12)}:00 ${scheduleTime[0].FROM_TIME >= 12 ? "PM" : "AM"}`;
        const toTime = `${(scheduleTime[0].TO_TIME % 12 === 0 ? 12 : scheduleTime[0].TO_TIME % 12)}:00 ${scheduleTime[0].TO_TIME >= 12 ? "PM" : "AM"}`;
        return res.status(400).json({
          status: false,
          message: `Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (${fromTime} to ${toTime}). Access will resume at ${fromTime}. Thank you for your patience!`
        });
      }      
      const requiredFields = [ "VILLAGECODE", "CLASSIFICATION", "PROPERTYTYPE", "HASHKEY"]; 
      for (let field of requiredFields) {
        if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
          res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
            {
              status: false,
              message: `${field} is required`
            }
          );
          return;
        }
        else if(field === 'PROPERTYTYPE') {
          const allowedValues = ['U', 'R'];
          if (!allowedValues.includes(qParams[field].toUpperCase())) {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
              {
                status: false,
                message: `Invalid value for ${field}. Allowed values are: ${allowedValues.join(', ')}`
              }
            );
            return;
          }
          else {
            if(allowedValues.indexOf(qParams[field].toUpperCase()) === 0) {
              requiredFields.push("DOORNO", "WARDNO", "BLOCKNO");
            }
            else if(allowedValues.indexOf(qParams[field].toUpperCase()) === 1) {
              requiredFields.push("SURVEYNO");
            }
          }
        }
      }
      const hashKey = await sslrGenerateHash(qParams);
      if (hashKey !== qParams.HASHKEY) {
        return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json({
          status: false,
          message: "Invalid HASHKEY"
        });
      }
      const runningStatus = await this.apiHandlerService.getRunningStatus({ DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getMarketValueforSSLR' });
      if (!runningStatus) {
        return res.status(400).json({
          status: false,
          message: "Only one service request will be processed at a time."
        });
      }
      try {
        let response = await this.apiHandlerService.getMarketValueforSSLRSrvc(qParams);
        await this.apiHandlerService.updateProcessingData({DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getMarketValueforSSLR'});
        let responseData = {
          status: true,
          message: "Success",
          code: "200",
          data: response
        };
        res.status(200).send({ ...responseData });
      } catch (ex) {
        console.error("apiForOthersHandler - getMarketValueforSSLR || Error :", ex);
        const pdeError = constructPDEError(ex);
        await this.apiHandlerService.updateProcessingData({DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getMarketValueforSSLR'});
        return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
          {
            status: false,
            message: pdeError.message
          }
        );
      }
    }

  getECDocsDetailsforSSLR = async (req, res) => {
    const qParams = req.query;
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    let reqData = {
      dept_type: 'SSLR'
    }
    let scheduleTime = await this.apiHandlerService.getScheuleTime(reqData);
    if (scheduleTime.length > 0 && (currentHour >= scheduleTime[0].TO_TIME || currentHour < scheduleTime[0].FROM_TIME)) {
      const fromTime = `${(scheduleTime[0].FROM_TIME % 12 === 0 ? 12 : scheduleTime[0].FROM_TIME % 12)}:00 ${scheduleTime[0].FROM_TIME >= 12 ? "PM" : "AM"}`;
      const toTime = `${(scheduleTime[0].TO_TIME % 12 === 0 ? 12 : scheduleTime[0].TO_TIME % 12)}:00 ${scheduleTime[0].TO_TIME >= 12 ? "PM" : "AM"}`;
      return res.status(400).json({
        status: false,
        message: `Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (${fromTime} to ${toTime}). Access will resume at ${fromTime}. Thank you for your patience!`
      });
    }
    const requiredFields = ["LPMNO", "VILLAGECODE", "HASHKEY"];
    const numericFields = ["VILLAGECODE", "LPMNO"];
    for (let field of requiredFields) {
      if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: `${field} is required`
          }
        );
        return;
      }
      if ((!Number.isInteger(Number(qParams[field])) || qParams[field] <= 0) && numericFields.includes(field)) {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: `${field} must be numeric value.`
          }
        );
        return;
      }
    }
    const hashKey = await sslrGenerateHash(qParams);
    if (hashKey !== qParams.HASHKEY) {
      return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json({
        status: false,
        message: "Invalid HASHKEY"
      });
    }
    const runningStatus = await this.apiHandlerService.getRunningStatus({ DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getECDocsDetailsforSSLR' });
    if (!runningStatus) {
      return res.status(400).json({
        status: false,
        message: "Only one service request will be processed at a time."
      });
    }
    try {
      let response = await this.apiHandlerService.getECDocsDetailsforSSLRSrvc(qParams);
      await this.apiHandlerService.updateProcessingData({ DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getECDocsDetailsforSSLR' });
      let responseData = {
        status: true,
        message: "Success",
        code: "200",
        data: response
      };
      res.status(200).send({ ...responseData });
    } catch (ex) {
      console.error("apiForOthersHandler - getECDocsDetailsforSSLR || Error :", ex);
      const pdeError = constructPDEError(ex);
      await this.apiHandlerService.updateProcessingData({ DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getECDocsDetailsforSSLR' });
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
        {
          status: false,
          message: pdeError.message
        }
      );
    }
  }


   getECSurveyListDocsDetailsforAPCOB = async (req, res) => {
    const qParams = req.query;
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    let reqData = {
      dept_type: 'APCOB'
    }
    let scheduleTime = await this.apiHandlerService.getScheuleTime(reqData);
    if (scheduleTime.length > 0 && (currentHour >= scheduleTime[0].TO_TIME || currentHour < scheduleTime[0].FROM_TIME)) {
      const fromTime = `${(scheduleTime[0].FROM_TIME % 12 === 0 ? 12 : scheduleTime[0].FROM_TIME % 12)}:00 ${scheduleTime[0].FROM_TIME >= 12 ? "PM" : "AM"}`;
      const toTime = `${(scheduleTime[0].TO_TIME % 12 === 0 ? 12 : scheduleTime[0].TO_TIME % 12)}:00 ${scheduleTime[0].TO_TIME >= 12 ? "PM" : "AM"}`;
      return res.status(400).json({
        status: false,
        message: `Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (${fromTime} to ${toTime}). Access will resume at ${fromTime}. Thank you for your patience!`
      });
    }
    const requiredFields = ["SURVYNO", "VILLAGECODE", "HASHKEY"];
    for (let field of requiredFields) {
      if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: `${field} is required`
          }
        );
        return;
      }
    }

    const hashKey = await sslrGenerateHash(qParams);
    if (hashKey !== qParams.HASHKEY) {
      return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json({
        status: false,
        message: "Invalid HASHKEY"
      });
    }
  
    const runningStatus = await this.apiHandlerService.getRunningStatus({ DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getECSurveyListDocsDetailsforAPCOB' });
    if (!runningStatus) {
      return res.status(400).json({
        status: false,
        message: "Only one service request will be processed at a time."
      });
    }
    try {
      let response = await this.apiHandlerService.getECSurveyListDocsDetailsforAPCOBSrvc(qParams);
      await this.apiHandlerService.updateProcessingData({ DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getECSurveyListDocsDetailsforAPCOB' });
      let responseData = {
        status: true,
        message: "Success",
        code: "200",
        data: response
      };
      res.status(200).send({ ...responseData });
    } catch (ex) {
      console.error("apiForOthersHandler - getECSurveyListDocsDetailsforAPCOB || Error :", ex);
      const pdeError = constructPDEError(ex);
      await this.apiHandlerService.updateProcessingData({ DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getECSurveyListDocsDetailsforAPCOB' });
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
        {
          status: false,
          message: pdeError.message
        }
      );
    }
  }

  getECLPMDocsDetailsforAPCOB = async (req, res) => {
    const qParams = req.query;
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    let reqData = {
      dept_type: 'APCOB'
    }
    let scheduleTime = await this.apiHandlerService.getScheuleTime(reqData);
    if (scheduleTime.length > 0 && (currentHour >= scheduleTime[0].TO_TIME || currentHour < scheduleTime[0].FROM_TIME)) {
      const fromTime = `${(scheduleTime[0].FROM_TIME % 12 === 0 ? 12 : scheduleTime[0].FROM_TIME % 12)}:00 ${scheduleTime[0].FROM_TIME >= 12 ? "PM" : "AM"}`;
      const toTime = `${(scheduleTime[0].TO_TIME % 12 === 0 ? 12 : scheduleTime[0].TO_TIME % 12)}:00 ${scheduleTime[0].TO_TIME >= 12 ? "PM" : "AM"}`;
      return res.status(400).json({
        status: false,
        message: `Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (${fromTime} to ${toTime}). Access will resume at ${fromTime}. Thank you for your patience!`
      });
    }
    const requiredFields = ["LPMNO", "VILLAGECODE", "HASHKEY"];
    const numericFields = ["VILLAGECODE", "LPMNO"];
    for (let field of requiredFields) {
      if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: `${field} is required`
          }
        );
        return;
      }
      if ((!Number.isInteger(Number(qParams[field])) || qParams[field] <= 0) && numericFields.includes(field)) {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: `${field} must be numeric value.`
          }
        );
        return;
      }
    }
    const hashKey = await sslrGenerateHash(qParams);
    console.log("::::::::hashKey:::::",hashKey)
    if (hashKey !== qParams.HASHKEY) {
      return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json({
        status: false,
        message: "Invalid HASHKEY"
      });
    }
    const runningStatus = await this.apiHandlerService.getRunningStatus({ DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getECLPMDocsDetailsforAPCOB' });
    if (!runningStatus) {
      return res.status(400).json({
        status: false,
        message: "Only one service request will be processed at a time."
      });
    }
    try {
      let response = await this.apiHandlerService.getECLPMDocsDetailsforAPCOBSrvc(qParams);
      await this.apiHandlerService.updateProcessingData({ DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getECLPMDocsDetailsforAPCOB' });
      let responseData = {
        status: true,
        message: "Success",
        code: "200",
        data: response
      };
      res.status(200).send({ ...responseData });
    } catch (ex) {
      console.error("apiForOthersHandler - getECLPMDocsDetailsforAPCOB || Error :", ex);
      const pdeError = constructPDEError(ex);
      await this.apiHandlerService.updateProcessingData({ DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getECLPMDocsDetailsforAPCOB' });
      return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
        {
          status: false,
          message: pdeError.message
        }
      );
    }
  }

  

  getLpmMarketValueforSSLR = async (req, res) => {
    const qParams = req.query;
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    let reqData = {
      dept_type: 'SSLR'
    }
    let scheduleTime = await this.apiHandlerService.getScheuleTime(reqData);
    if (scheduleTime.length > 0 && (currentHour >= scheduleTime[0].TO_TIME || currentHour < scheduleTime[0].FROM_TIME)) {
      const fromTime = `${(scheduleTime[0].FROM_TIME % 12 === 0 ? 12 : scheduleTime[0].FROM_TIME % 12)}:00 ${scheduleTime[0].FROM_TIME >= 12 ? "PM" : "AM"}`;
      const toTime = `${(scheduleTime[0].TO_TIME % 12 === 0 ? 12 : scheduleTime[0].TO_TIME % 12)}:00 ${scheduleTime[0].TO_TIME >= 12 ? "PM" : "AM"}`;
      return res.status(400).json({
        status: false,
        message: `Notice: IGRS API is currently unavailable due to scheduled downtime during peak hours (${fromTime} to ${toTime}). Access will resume at ${fromTime}. Thank you for your patience!`
      });
    }
    const requiredFields = ["VILLAGECODE", "CLASSIFICATION", "LPMNO", "HASHKEY"];
    const numericFields = ["VILLAGECODE", "CLASSIFICATION", "LPMNO"];
    for (let field of requiredFields) {
      if (qParams[field] === undefined || qParams[field] === null || qParams[field].trim() === '') {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: `${field} is required`
          }
        );
        return;
      }
      if ((!Number.isInteger(Number(qParams[field])) || qParams[field] <= 0) && numericFields.includes(field)) {
        res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
          {
            status: false,
            message: `${field} must be numeric value.`
          }
        );
        return;
      }
    }
    const hashKey = await sslrGenerateHash(qParams);
    if (hashKey !== qParams.HASHKEY) {
      return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json({
        status: false,
        message: "Invalid HASHKEY"
      });
    }
    const runningStatus = await this.apiHandlerService.getRunningStatus({ DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getLpmMarketValueforSSLRSrvc' });
    if (!runningStatus) {
      return res.status(400).json({
        status: false,
        message: "Only one service request will be processed at a time."
      });
    }
    try {
      let response = await this.apiHandlerService.getLpmMarketValueforSSLRSrvc(qParams);
      await this.apiHandlerService.updateProcessingData({ DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getLpmMarketValueforSSLRSrvc' });
      let responseData = {
        status: true,
        message: "Success",
        code: "200",
        data: response
      };
      res.status(200).send({ ...responseData });
    } catch (ex) {
      console.error("apiForOthersHandler - getLpmMarketValueforSSLRSrvc || Error :", ex);
      const pdeError = constructPDEError(ex);
      await this.apiHandlerService.updateProcessingData({ DEPT_TYPE: reqData.dept_type, DATA_TYPE: 'getLpmMarketValueforSSLRSrvc' });
        return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
          {
            status: false,
            message: pdeError.message
          }
        );
      }
    }

    UpdateForm13Status = async (req, res) => {
    const reqBody = req.body;
    try {
        if (
            reqBody.Application_ID === undefined ||
            reqBody.Application_ID === null ||
            reqBody.Application_ID === "" ||  !reqBody.Form13_Generated
        ) {
            return res.status(400).send({
                status: false,
                message: "Invalid request"
            });
        }
        await this.apiHandlerService.updateForm13Status(reqBody);
        return res.status(200).send({
            status: true,
            message: "Form13 status updated successfully",
            code: "200"
        });
    } catch (ex) {
        console.error("updateForm13Status || Error:", ex);
        let PDEError = constructPDEError(ex);
        return res.status(NAMES_STATUS_MAPPINGS[PDEError.name]).send({
            status: false,
            message: PDEError.message
        });
    }
};
}
module.exports = APIHandler;
