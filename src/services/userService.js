const nodemailer = require("nodemailer");
const moment = require('moment');
const IP = require('ip');
const ObjectId = require('mongoose').Types.ObjectId;
const {decryptWithAES, encryptWithAESPassPhrase} = require('../utils/index')
const userModel = require('../model/userModel');
const officerModel = require('../model/officerModel');
const otpModel = require('../model/otpModel');
const gAuth = require('../plugins/auth/authService');
const helper = require('../utils/helper');
const sysConstants = require('../utils/sysConstanst');
const  {transportEmail,diffMinutes} = require('../utils/index');
const PDEError = require("../errors/customErrorClass");
const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const { constructPDEError } = require("../handlers/errorHandler");
const UsersInfoDao = require('../dao/userDao');
const DocmentDao = require('../dao/documentDetailsDao')
const {Logger} = require('../../services/winston');
const { identity } = require("lodash");
const { xml2json } = require('xml-js');
const soap = require('soap');
const otpGenerator = require('otp-generator');
const { constants } = require("buffer");
const sysConstanst = require("../utils/sysConstanst");
const axios =require('axios');
const orDbDao = require('../dao/oracleDbDaos');
const { log } = require("console");
const ApiicExcu = require("../model/apiic_Exc_masterData_Modal");
const { encryptData ,decryptData} = require('../utils/index');
const ApiicGovtInstitution = require("../model/apiic_Govtinstitution_Modal");

class UserService {
	constructor(){
		this.userInfoDao = new UsersInfoDao();
		this.documentDao = new DocmentDao()
		this.orDao = new orDbDao();

	}

	verifyUserService = async (reqData)=>{
		try{
			let query;
			if(Object.getOwnPropertyNames(reqData).length ===2){
				query = reqData.hasOwnProperty("loginMobile")? {loginMobile:reqData.loginMobile}:reqData.hasOwnProperty("loginEmail") ?{loginEmail:reqData.loginEmail} : {aadhar:parseInt(reqData.aadhar)};
			}else{
				let ob =[];
				["loginEmail", "loginMobile","aadhar"].forEach(i => {
					if(reqData[i]){
						ob[ob.length] = i === "aadhar" ? {[i] : parseInt(reqData[i])} : {[i] : reqData[i]}
					}
				});
				query  = {"$or": [...ob]};
			}
			const verify = await this.userInfoDao.findOne(query);
			const otpExist = await otpModel.findOne(query);
			if(otpExist){
				await otpModel.findOneAndUpdate(query,reqData);
			}
			if(verify === null){
				let userQuery = await this.verifyUserQuery(reqData,otpExist);
				if(otpExist && otpExist?.isSendingCount <= 1){
					let min = new Date().getMinutes() - new Date(otpExist.sTStamp).getMinutes();
					let minCount = 15 - min;
					if(new Date().getMinutes() - new Date(otpExist.sTStamp).getMinutes() >= 15){
						userQuery.uQuery.isSendingCount = 5;
					}else{
						throw new PDEError({name: NAMES.BAD_REQUEST, err: `You have exceeded OTP request.Try after ${minCount}min`});
					}
				}
				
				let updateData = await this.userInfoDao.otpfAndUpdate(userQuery.identify,userQuery.uQuery);
				if(updateData != null){
					return;
				}else{
					throw new PDEError({name: NAMES.BAD_REQUEST, err: "Invalid"});
				}
			}else{
				throw new PDEError({name: NAMES.BAD_REQUEST, err: "Invalid"});
			}
		}catch(ex){
			Logger.error(ex.message)
			console.error("userService - verifyUserService || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}

	signUpService = async (reqParams,reqBody,query) =>{
		const User = await this.userInfoDao.userFindMethod(query);
		if(User.length >0){
			throw new PDEError({name: NAMES.BAD_REQUEST, err: "Invalid"});
		}
		try{
			let ob=[];
		
			["loginEmail", "loginMobile","aadhar"].forEach(i => {
				if(reqBody[i]){
					ob[ob.length] = {[i] : reqBody[i]}
				}
			})
			const query2  = {"$or": [...ob]}
			query2.$or.forEach((j)=>{j.otpType = sysConstants.VERIFY_USER});
			let user = await this.userInfoDao.otpfindOne(query2);
			let updateQuery={};
			let getuser=true
			if(user && reqBody?.loginMobile){
				let date = new Date()
				let now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
                date.getUTCDate(), date.getUTCHours(),
                date.getUTCMinutes(), date.getUTCSeconds());
				let CurrentDate=new Date(now_utc)
				let old_utc = Date.UTC(user.updatedAt.getUTCFullYear(), user.updatedAt.getUTCMonth(),
                user.updatedAt.getUTCDate(), user.updatedAt.getUTCHours(),
                user.updatedAt.getUTCMinutes(), user.updatedAt.getUTCSeconds());
				let oldDate=new Date(old_utc)
				let diff = (CurrentDate - oldDate) / 600000;
				if (diff < 1) {
					getuser=true
				}
				else{
					getuser=false
					throw new PDEError({name: NAMES.BAD_REQUEST, err: `OTP Incorrect`});
				}
			}
			if(user && getuser){
				let validateCount = user.isValidateCount - 1;
				if(user.isValidateCount < 1){
					updateQuery={status:false};
					await otpModel.findOneAndUpdate(query,updateQuery);
					throw new PDEError({name: NAMES.BAD_REQUEST, err: `Invalid, Please Resend OTP`});
				}else{
					let query3  = {"$or": [...ob]};
					query3.$or.forEach((k)=>{k.otpType=sysConstants.VERIFY_USER,k.loginOtp=reqBody.loginOtp,k.status=true});
					let fUser =await otpModel.findOne(query3);
					if(fUser != null && user.isSendingCount >1){
						updateQuery={status:false};
						let updateQuery2 = {isValidateCount:5, isSendingCount:5}
						await otpModel.findOneAndUpdate(query,updateQuery2);
						reqBody.loginType="USER";
						let saveUser = await this.userInfoDao.create(reqBody);
						updateQuery ={
							isValidateCount:validateCount,
							loginMobile : reqBody?.loginMobile ? reqBody?.loginMobile : '',
							loginEmail : reqBody?.loginEmail ? reqBody?.loginEmail : '',
							aadhar :reqBody?.aadhar ? reqBody?.aadhar : 0
						};
						await otpModel.findOneAndUpdate(query,updateQuery);
						return saveUser;
					}else{
						updateQuery.isValidateCount =  user.isValidateCount - 1;
						await otpModel.findOneAndUpdate(query,updateQuery);
						throw new PDEError({name: NAMES.BAD_REQUEST, err: "OTP Incorrect"});
					}
				}
			}else {
				throw new PDEError({name: NAMES.BAD_REQUEST, err: `OTP Incorrect`});
			};
		}catch(ex){
			Logger.error(ex.message)
			console.error("userService - signUpService || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}
	sOTPService = async (reqData,reqParams)=>{
  try{
    let query;
	//if(Object.getOwnPropertyNames(reqData).length ===2){
        query = reqData.hasOwnProperty("loginMobile") && reqParams.type ==sysConstanst.MOBILE ? {loginMobile:reqData.loginMobile,loginType:'USER'}:reqData.hasOwnProperty("loginEmail") && reqParams.type ==sysConstanst.EMAIL ?{loginEmail:reqData.loginEmail} :reqData.hasOwnProperty("loginCRDA") && reqParams.type ==sysConstanst.MOBILE ? {loginMobile: reqData.loginCRDA,loginType:'CRDA'} : {aadhar:reqData.aadhar};
		if(query.aadhar){
        let aadharNo =0
        aadharNo = decryptWithAES(reqData.aadhar);
        reqData.aadhar = aadharNo;
        query ={aadhar:parseInt(aadharNo)};
    }
    let findUser = await this.userInfoDao.findOne(query);
	console.log("findUser :: ", findUser, query);
	delete query.loginType;
    let otpData  = await otpModel.findOne(query);
	console.log("otpData :: ", otpData);
    if(!findUser || !otpData){
      let type =  reqParams.type === sysConstanst.EMAIL ?`Email ID.`: reqParams.type === sysConstanst.MOBILE ? `Mobile No.`:`Aadhar No.`;
      throw new PDEError({name: NAMES.BAD_REQUEST, err: `Please Enter Valid ${type}` });
    }else{

    let userQuery;
    if(otpData && otpData.isSendingCount <= 1 && otpData.otpType == 'loginOtp'){
      let timeDiff =  diffMinutes(String(otpData.updatedAt));
      if(timeDiff >=15){
        userQuery = await this.setQueryMethod(reqParams.type,reqData,otpData);
        userQuery.updateQuery.isSendingCount = 5;
      }else{
        throw new PDEError({name: NAMES.BAD_REQUEST, err: `You have exceeded OTP request.Try after 15min`});
      }
    }else{
      userQuery = await this.setQueryMethod(reqParams.type,reqData,otpData);
      userQuery.updateQuery.isSendingCount = otpData.isSendingCount - 1;
    }
    userQuery.updateQuery.isValidateCount = 5;
    userQuery.updateQuery.otpType ="loginOtp"
    userQuery.updateQuery.status = true;
				// userQuery.updateQuery.sTStamp =new Date().toISOString();
    let updateData = await otpModel.findOneAndUpdate(userQuery.identify,userQuery.updateQuery);
    if(updateData != null){
      return;
    }else{
      throw new PDEError({name: NAMES.BAD_REQUEST, err: "Invalid"});
	}
    }
  }catch(ex){
			Logger.error(ex.message)
			console.error("userService - verifyAndsignUp || Error : ", ex);
    throw constructPDEError(ex);
  }
};
	userLogin = async (reqData,reqParams,requrl)=>{
		try{
			let otpvalidateQuery,query;
			switch(reqParams.type){
				case sysConstanst.EMAIL:
					//mobiletest
					if(reqData.loginTest ==="test"){
						otpvalidateQuery ={loginEmail:reqData?.loginEmail,loginOtp:reqData.loginOtp};
						query={loginEmail:reqData?.loginEmail};
					}else{
						otpvalidateQuery ={loginEmail:reqData?.loginEmail,loginOtp:reqData.loginOtp,status:true};
						query={loginEmail:reqData?.loginEmail};
					}
					break;
				case sysConstanst.MOBILE:
					otpvalidateQuery ={loginMobile:reqData?.loginMobile ?reqData?.loginMobile:reqData?.loginCRDA,loginOtp:reqData.loginOtp,status:true};
					query={loginMobile:reqData?.loginMobile ?reqData?.loginMobile:reqData?.loginCRDA,loginType:reqData?.loginMobile ?'USER':'CRDA'};
					break;
				case sysConstanst.AADHAR:
					let adharNo = decryptWithAES(reqData.aadhar);
					reqData.aadhar = adharNo;
					query ={aadhar:parseInt(adharNo)};
					otpvalidateQuery=query;
					break;
				default:
					break;
			}
			let userValidateFromOtp = await otpModel.findOne(otpvalidateQuery);
			let getuser=true
			if(userValidateFromOtp && reqData?.loginMobile){
				let date = new Date()
				let now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
                date.getUTCDate(), date.getUTCHours(),
                date.getUTCMinutes(), date.getUTCSeconds());
				let CurrentDate=new Date(now_utc)
				let old_utc = Date.UTC(userValidateFromOtp.updatedAt.getUTCFullYear(), userValidateFromOtp.updatedAt.getUTCMonth(),
                userValidateFromOtp.updatedAt.getUTCDate(), userValidateFromOtp.updatedAt.getUTCHours(),
                userValidateFromOtp.updatedAt.getUTCMinutes(), userValidateFromOtp.updatedAt.getUTCSeconds());
				let oldDate=new Date(old_utc)
				let diff = (CurrentDate - oldDate) / 600000;
				if (diff < 1) {
					getuser=true
				}
				else{
					getuser=false
					throw new PDEError({name: NAMES.BAD_REQUEST, err: `OTP Incorrect`});
				}
			}
			if(userValidateFromOtp &&  userValidateFromOtp.isSendingCount >= 1 && userValidateFromOtp.isValidateCount > 1 && userValidateFromOtp.status === true &&getuser){
				let User = await userModel.findOne(query);
				if(User && User?.loginId == ""){
					await userModel.findOneAndUpdate({_id:User._id},{$set:{loginId:User._id}});
				}
				var date = new Date();
				var dateStr =
				("00" + date.getDate()).slice(-2) + "-" +
				("00" + (date.getMonth() + 1)).slice(-2) + "-" +
				date.getFullYear() + " " +
				("00" + date.getHours()).slice(-2) + ":" +
				("00" + date.getMinutes()).slice(-2) + ":" +
				("00" + date.getSeconds()).slice(-2);
				await userModel.findOneAndUpdate({_id:User._id},{$set:{lastLogin:dateStr}});
				if (User.loginType === 'CRDA'){
					User.loginType = 'USER';
				}
				const userDetails = await gAuth.getUserInfo(User);
				userDetails.token= await gAuth.createToken(userDetails,requrl);
				let update ={status:false,isSendingCount :5};
				otpvalidateQuery.status =true;
				//mobile test
				if(!reqData.loginTest){
					await otpModel.findOneAndUpdate(otpvalidateQuery,update);
				}
				
				if(userDetails.aadhar !== null){
					userDetails.aadhar = encryptWithAESPassPhrase(String(userDetails.aadhar), process.env.adhar_Secret_key);
				}
				userDetails.lastLogin = User && User.lastLogin != null ? User.lastLogin: dateStr;
				return userDetails;
				//let updateOtp = await otpModel.findOneAndUpdate(query,{$set:{isValidateCount : Obj.isValidateCount-1}});
			}else{
				let update,errMsg,errName;
				let Obj =await otpModel.findOne(query);
				let valCount = Obj.isValidateCount - 1;
				if(Obj && Obj.isValidateCount <= 1){
					update = {isSendingCount:0};
					errMsg =`You have exceeded OTP verification attempts. Try with resend OTP.`;
					errName =NAMES.VALIDATION_ERROR;
				}else{
					update = {isValidateCount:valCount};
					errMsg = `OTP Incorrect`;
					errName =NAMES.BAD_REQUEST;
				}
					await otpModel.findOneAndUpdate(query,update);
					throw new PDEError({name: errName, err: errMsg});
			}
		}catch(ex){
			Logger.error(ex.message)
			console.error("userService - userLogin || Error : ", ex);
            throw constructPDEError(ex);
		}
	};
	setQueryMethod = async(reqParams,reqData,userInfo)=>{
		let fResult={}, identify,updateQuery
		if(reqParams =="email"){
			let otp = Math.floor(1000 + Math.random() * 9000);const mailOptions = {
				from: `"IGRS" <${process.env.SMTP_EMAIL}>`,
				to: reqData.loginEmail, 
				subject: "Email verification",
				text: `Dear Sir / Madam ,`+'\n'+`OTP(One Time Password) to verify the email ${otp}`+'\n'+'\n'+`Thanks`+'\n'+`IGRS -AP`,
			};
			const mail = await transportEmail.sendMail(mailOptions);
			console.log("MAIL ::",mail);
			identify = {loginEmail:reqData.loginEmail};
			updateQuery = {loginOtp:otp,loginAs:sysConstanst.EMAIL,otpFrom:sysConstanst.EMAIL};
		}else if(reqParams =="mobile"){
			identify = {loginMobile:reqData.loginMobile ?reqData.loginMobile:reqData.loginCRDA}; 
			let mbOtp = await this.sendSMS(reqData.loginMobile?reqData.loginMobile:reqData.loginCRDA,'');
			updateQuery = {loginOtp:mbOtp,loginAs:sysConstanst.MOBILE,otpFrom:sysConstanst.MOBILE}; 
		}
		 else if(reqParams =="aadhar"){
			identify = {aadhar:parseInt(reqData.aadhar)}
			updateQuery = {loginAs:sysConstanst.AADHAR,otpFrom:sysConstanst.AADHAR}
		}
		fResult.identify = identify;
		fResult.updateQuery = updateQuery;
		return fResult;
	}

	verifyUserQuery = async (reqData, otpData)=>{
		let fResult={};
		let identify;
		if(reqData.loginEmail){
			let otp = Math.floor(1000 + Math.random() * 9000);
			const mailOptions = {
				from: `"IGRS" <${process.env.SMTP_EMAIL}>`,
				to: reqData.loginEmail, 
				subject: "Email verification",
				text: `Dear Sir / Madam ,`+'\n'+`OTP(One Time Password) to verify the email ${otp}`+'\n'+'\n'+`Thanks`+'\n'+`IGRS -AP`,
			};
			const mail = await transportEmail.sendMail(mailOptions);
			console.log("MAIL ::",mail);
			identify = {loginEmail:reqData.loginEmail};
			reqData.otpFrom ="EMAIL";
			reqData.loginOtp =otp;
			reqData.status=true
	
		}else if(!reqData?.loginEmail && reqData.loginMobile && reqData.aadhar){
			identify = {aadhar:parseInt(reqData.aadhar),loginMobile:reqData.loginMobile};
			// updateQuery = {otpFrom:"AADHAR"};
			reqData.otpFrom ="AADHAR";
		}else if(!reqData?.loginEmail && !reqData.loginMobile && reqData.aadhar){
			identify = {aadhar:parseInt(reqData.aadhar)};
			// updateQuery = {otpFrom:"AADHAR"};
			reqData.otpFrom ="AADHAR";
		}
		else if(!reqData?.loginEmail && reqData.loginMobile && !reqData.aadhar){
			identify = {loginMobile:reqData.loginMobile};
			let mbOtp = await this.sendSMS(reqData.loginMobile,"Register");
			// updateQuery = {loginOtp:"123456",otpFrom:"MOBILE"};
			reqData.otpFrom ="MOBILE";
			reqData.loginOtp=mbOtp;
			reqData.status=true
		}

		reqData["otpType"] = "verifyUser";
		reqData["sTStamp"] =new Date().toISOString();
		reqData["status"]=true;
		reqData["isSendingCount"] = otpData  && otpData?.isSendingCount > 1 && otpData.status === true ? otpData?.isSendingCount - 1 : 5
		reqData["isValidateCount"] = 5;
		fResult["uQuery"] = reqData;
		fResult["identify"] = identify;
		return fResult;
	}


	sendSMS = async (number,type) => {
        try {
            const otp = otpGenerator.generate(6, { digits: true,lowerCaseAlphabets:false, upperCaseAlphabets: false, specialChars: false });
			let peId = '1001016721376697626'; 
			let templateId;
			let url="";

			if(type === 'Register'){
				templateId = '1007508288489952512';
				url = `https://converge-now.com:1011/Sendsms/?user=LH_IGRSH&password=Igrs@12&sender=APIGRS&dest=91${number}&messagetype=T&smsmessage=Dear%20User%2C%20Your%20OTP%20to%20complete%20the%20registration%20process%20is%20${otp}.%20%28Valid%20for%2010%20Minutes%29.%20Kindly%20ignore%20if%20not%20initiated%20by%20you.Thank%20You%2CIGRS.&peid=${peId}&deliveryreport=yes&templateid=${templateId}`;
			}
			else{
				templateId = '1007805820563243988';
				url=`https://converge-now.com:1011/Sendsms/?user=LH_IGRSH&password=Igrs@12&sender=APIGRS&dest=91${number}&messagetype=T&smsmessage=Dear%20User%2CYour%20OTP%20to%20login%20to%20PDE%20is%20${otp}.%20%28Valid%20for%2010%20Minutes%29.%20Kindly%20ignore%20if%20not%20initiated%20by%20you.Thank%20You%2CIGRS.&peid=${peId}&deliveryreport=yes&templateid=${templateId}`
			}


			let response = await axios({
                url:url,
                method: 'GET'
            })
              const logInsert = await this.orDao.oDbInsertDocsWithBindParams(
              `INSERT INTO srouser.sms_logs (application_id, template_id, type, status, time_stamp)
        		VALUES (:application_id, :template_id, :type, :status, SYSDATE)`,
               {
    				application_id: null,   
     				template_id: templateId,
       				type: type? type :'LoginOTP',
        			status: 'accepted'
   	  		}
          );
           console.log("SMS Log Inserted:", logInsert);
            return otp;
            //res.status(200).send(
            //    {
            //        status:true,
            //        code: "200",
            //    }
            //);
    
        } catch (error) {
            console.error("SMS Details - sendSms_New || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    };

	revertFunc = async(json)=>{
		let [rest,password]= json[0].elements[0].elements[0].elements[1].elements[0].text.substring(json[0].elements[0].elements[0].elements[1].elements[0].text.lastIndexOf("is")).split(" ");
		return password;
	};

	titdcoLogin = async(password, requrl) => {
		try {
			let errMsg, errName;
			if(!password){
				errMsg = `Password Incorrect`;
				errName =NAMES.BAD_REQUEST;
			} else {
				let user = await userModel.findOne({loginPassword: password, loginEmail: "Titdco"});
				if(user){
					const userDetails = await gAuth.getUserInfo(user);
					userDetails.token= await gAuth.createToken(userDetails,requrl);
					return userDetails
				} else {
					errMsg = `Password Incorrect`;
					errName =NAMES.BAD_REQUEST;
					throw new PDEError({name: errName, err: errMsg})
				}
			}
		} catch(error){
			let pdeError = constructPDEError(error);
			throw pdeError;
		}
	}
	apcobLogin = async (password, requrl) => {
		try {
			let errMsg, errName;
			if (!password) {
				errMsg = `Password Incorrect`;
				errName = NAMES.BAD_REQUEST;
			} else {
				console.log("APCOB Login Attempt with Password	:", password);
				console.log("APCOB Login Attempt with requrl	:", requrl);
				let user = await userModel.findOne({ loginPassword: password, loginEmail: "APCOB" });
				console.log("APCOB Login Attempt Result	:", user);
				if (user) {
					const userDetails = await gAuth.getUserInfo(user);
					userDetails.token = await gAuth.createToken(userDetails, requrl);
					return userDetails
				} else {
					errMsg = `Password Incorrect`;
					errName = NAMES.BAD_REQUEST;
					throw new PDEError({ name: errName, err: errMsg })
				}
			}
		} catch (error) {
			let pdeError = constructPDEError(error);
			throw pdeError;
		}
	}
	getUserData = async (user)=>{
		try{
			let query = {userId:user.userId}
			let userData = await this.documentDao.getByFilters(query);
			return userData;
		}catch(ex){
			Logger.error(ex.message)
			console.error("userService - getUserData || Error : ", ex);
            throw constructPDEError(ex);
		}
	}

	sendMobileSMS = async (reqData) => {
		try {
			const peId = '1001016721376697626';
			// const templateId = '1007413280044925001';
			
			// const query = `SELECT * FROM tran_ec WHERE sr_code = :sr_code and phone_no = :phone_no AND code = 'EX' and doct_no = :DOCT_NO`;
			// const binds = { phone_no: reqData.phone_no, sr_code: reqData.sr_code, doct_no: reqData.DOCT_NO};
	
			// console.log("Executing Query:", query);
			// console.log("Bind Values:", binds);
	
			// const result = await this.orDao.oDBQueryServiceWithBindParams(query, binds);
	        // console.log(result,"jastiiiiiiiiiiiiiiiiiii");

			// if (result.length > 0) {
			    let templateId = reqData.templateId;
				let phoneNo = reqData.phoneNos; 
				let smsMessage = reqData.smsMessage;
				if(templateId == null || templateId == undefined || templateId.trim().length==0 || 
                     phoneNo == null || phoneNo == undefined || phoneNo.trim().length==0 || 
                     smsMessage == null || smsMessage == undefined || smsMessage.trim().length==0 ){
	                 throw new Error('Bad Request to send sms.');
                }
				// let message= `APIGRS - Your document is registered as No. ${result[0].DOCT_NO}  at SRO-${result[0].SR_CODE} and ready for delivery.`
	            smsMessage= encodeURIComponent(smsMessage);
				
				const url = `https://converge-now.com:1011/Sendsms/?user=LH_IGRSH&password=Igrs@12&sender=APIGRS&dest=${phoneNo}&messagetype=T&smsmessage=${smsMessage}&peid=${peId}&deliveryreport=yes&templateid=${templateId}`;
	
				try {
					let response = await axios.get(url);
					console.log("Content Sharing SMS Sent Successfully:", response.data);
                const logInsert = await this.orDao.oDbInsertDocsWithBindParams(
              `INSERT INTO srouser.sms_logs (application_id, template_id, type, status, time_stamp)
        		VALUES (:application_id, :template_id, :type, :status, SYSDATE)`,
               {
    				application_id: reqData.appId,   
     				template_id: templateId,
       				type: reqData.statusName,
        			status: 'accepted'
   	  		}
          );
           console.log("SMS Log Inserted:", logInsert);
				} catch (apiError) {
					throw new Error(`Failed to send SMS: ${apiError.message}`);
				}
			// }
		} catch(ex){
			Logger.error(ex.message)
			console.error("userService - CARDOTPService || Error : ", ex);
            throw constructPDEError(ex);
		}
	};

	getVswsListService = async (reqData) => {		
		try {
			let query = `Select * From Card.Vsws_Master Where Bifurcated_Srcd = :SR_CD ORDER BY VILLAGE_NAME`;
			let bindParam = {
				SR_CD: reqData.SR_CD
			}
			let response = await this.orDao.oDBQueryServiceWithBindParams(query, bindParam);
			return response;
		} catch (ex) {
			Logger.error("userService - getVswsListService || Error :", ex);
			console.error("userService - getVswsListService || Error :", ex);
			throw constructPDEError(ex);
		}
	};
	getVswsEmpListService = async (reqData) => {
		try {
			let query = `Select * From Card.Employee_Login_Master em Left Join Hab_Match hm On Substr(hm.Hab_Code,1,7) = em.Vill_Code Where em.Vill_Code = :Vill_CD and UPPER(em.Designation) = 'PANCHYAT SECRETARY'`;
			let bindParam = {
			    Vill_CD: reqData.Vill_CD
		    }
			let response = await this.orDao.oDBQueryServiceWithBindParams(query, bindParam);
			return response;
		} catch (ex) {
			Logger.error("userService - getVswsEmpListService || Error :", ex);
			console.error("userService - getVswsEmpListService || Error :", ex);
			throw constructPDEError(ex);
		}
	};

	APIICLoginSrc = async(password, requrl) => {
		try {
			let errMsg, errName;
			if(!password){
				errMsg = `Password Incorrect`;
				errName =NAMES.BAD_REQUEST;
			} else {
				let user = await userModel.findOne({loginPassword: password, loginEmail: "APIIC"});
				if(user){
					const userDetails = await gAuth.getUserInfo(user);
					userDetails.token= await gAuth.createToken(userDetails,requrl);
					console.log(userDetails,"userDetails");
					
					return userDetails
				} else {
					errMsg = `Password Incorrect`;
					errName =NAMES.BAD_REQUEST;
					throw new PDEError({name: errName, err: errMsg})
				}
			}
		} catch(error){
			let pdeError = constructPDEError(error);
			throw pdeError;
		}
	}
	getApiicExc_dataSrc = async()=>{
		try{
		
			let userData = await ApiicExcu.find();
			let formatted = userData.map(u => ({
				name: u.Repregent_Deatils.Emple_Name
			  }));
			return formatted;
		}catch(ex){
			Logger.error(ex.message)
			console.error("userService - getUserData || Error : ", ex);
            throw constructPDEError(ex);
		}
	}
	getApiicExcPerDataSrc = async(reqBody)=>{
		try{
			console.log(reqBody,"reqBody");
			let query = { "Repregent_Deatils.Emple_Name": reqBody.emplname };
			let userData = await ApiicExcu.findOne(query);
			if (!userData) {
				return null;
			  }
			  let userObj = userData.toObject();
			  if (userObj.Aadhar_Number) {
				userObj.Aadhar_Number = decryptData(userObj.Aadhar_Number);
			  }
		  
			 
			  if (userObj.Repregent_Deatils?.Aadhar_Number) {
				userObj.Repregent_Deatils.Aadhar_Number = decryptData(userObj.Repregent_Deatils.Aadhar_Number);
			  }
		  
			  return userObj;
		}catch(ex){
			Logger.error(ex.message)
			console.error("userService - getUserData || Error : ", ex);
            throw constructPDEError(ex);
		}
	}
	getApiicGovtInstitutionData = async()=>{
		try{
		
			let userData = await ApiicGovtInstitution.find();
			return userData;
		}catch(ex){
			Logger.error(ex.message)
			console.error("userService - getUserData || Error : ", ex);
            throw constructPDEError(ex);
		}
	}
	 createExecMaster = async (data) => {
		return await ApiicExcu.create(data);
	  };
};




module.exports = UserService;