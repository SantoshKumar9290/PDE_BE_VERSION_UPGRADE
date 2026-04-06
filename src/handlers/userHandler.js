const CryptoJs = require('crypto-js')
const service = require('../services/userService');
const { Handler } = require('../common/requestHandler');
const {userCredsValidation} = require('../utils/validations')
const {createToken,getUserInfo} = require('../plugins/auth/authService')
const {decryptWithAES} = require('../utils/index');
const PDEError = require("../errors/customErrorClass");
const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const { constructPDEError } = require("./errorHandler");
const UserService = require('../services/userService');
const jwt = require('jsonwebtoken');
const otpModel = require('../model/otpModel');
const userModel = require('../model/userModel');
const NodeCache = require( "node-cache" );
const { addDataToCache } = require('../plugins/nodeCache/myCache');
const {encryptWithAESPassPhrase,decryptWithAESPassPhrase,encryptData} = require('../utils/index');
const sysConstanst = require("../utils/sysConstanst");
const axios = require('axios');
const { response } = require('express');
const gAuth = require('../plugins/auth/authService');
const orDbDao = require('../dao/oracleDbDaos');
const otpCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const otpGenerator = require('otp-generator');
// const qs = require('q')


//FORMAT:  exports.<action>=(req,res)=>Handler(req,res,service.<function>,<successMessage>,<failMessage>);

class UserHandler {
	constructor(){
        this.UserService = new UserService();
		this.orDao = new orDbDao();
    };

	verifyUser  =  async (req,res)=>{
		const reqBody = req.body;
		if(reqBody == null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
		}
		if(reqBody.aadhar){
			let adharDecrypt = decryptWithAES(reqBody.aadhar);
			reqBody.aadhar = adharDecrypt;
		}
		let validations = await userCredsValidation(reqBody);
		if(validations && validations.status == false){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: validations.err,
                }
            );
		}
		try{
			let response = await this.UserService.verifyUserService(reqBody);
			return res.status(200).send(
                {
                    status:true, 
                    message: "Otp Sent Successfully",
                    code: "200",
                }
            );
		}catch(ex){
			console.error("UserHandler - verifyUser || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            )
		}
	}


	signUp = async (req,res)=>{
		const reqBody = req.body;
		const reqParams = req.params;
		if(reqBody== null || reqBody?.loginOtp == null || reqBody.loginName == null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
		}
		if(reqBody.aadhar){
			reqBody.aadhar = decryptWithAES(reqBody.aadhar);
			// reqBody.aadhar = adharDecrypt;
		}
		let validations = await userCredsValidation(reqBody);
		if(validations && validations.status == false){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: validations.err
                }
            );
		}
		let ob=[];
		["loginEmail", "loginMobile","aadhar"].forEach(i => {
			if(reqBody[i]){
				ob[ob.length] = {[i] : reqBody[i]}
			}
		})
		let query  = {"$or": [...ob]};
		//let query = {"$or": [{"loginEmail": reqBody?.loginEmail}, {"loginMobile": reqBody.loginMobile},{"aadhar":reqBody.aadhar}]};
		try{
			let response = await this.UserService.signUpService(reqParams,reqBody,query);
			res.status(200).send(
                {
                    status:true, 
                    message: "User Saved Successfully",
                    code: "200",
                }
            );
		}catch(ex){
			console.error("UserHandler - signUp || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            )
		}
	}
	sendOtp = async (req,res)=>{
		const reqBody = req.body;
		const reqParams = req.params;
		try{
			let response = await this.UserService.sOTPService(reqBody,reqParams);
			res.status(200).send(
                {
                    status:true, 
                    message: "OTP Send Successfully",
                    code: "200",
                }
            );
		}catch(ex){
			console.error("UserHandler - signUp || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            )
		}
	}

	login = async (req,res)=>{
		const reqBody = req.body;
		const reqParams = req.params;
		const requrl = req.protocol + "://" + req.get("host") + "/v1/token/";

		if(reqBody.loginOtp == null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
		}
		let data={}
		if(reqBody.type ==="mobile"){
			data.loginMobile = reqBody.loginMobile ? reqBody.loginMobile : reqBody.loginCRDA ;
		}else if(reqBody.type ==="email"){
			data.loginEmail = reqBody.loginEmail;
		}else{
			let adharNo = decryptWithAES(reqBody.aadhar);
			data.aadhar = parseInt(adharNo)
			
		}
		let verifyCheck = await userModel.findOne(data);
		if(verifyCheck == null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: "OTP Incorrect"
                }
            );
		}
		try{

			let response = await this.UserService.userLogin(reqBody,reqParams,requrl)
			res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("UserHandler - login || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            )
		}
	}
	refreshToken = async(req,res)=>{
		try{
			const reqParams = req.params;
			let tokenHeader = req.headers['authorization']
			if (tokenHeader) {
				let token = await tokenHeader.split(" ");
	
				let decoded = jwt.decode(token[1], process.env.JWT_SECRET_KEY);
				console.log(" decoded :: ", decoded);
				if (decoded) {
					let loginTypeVal = (decoded.loginType);
					let currentTime = (new Date().getTime())/1000;
	
					let expiredVal = decoded.exp;
					const expiresIn = parseInt(process.env.JWT_RESET_EXP_IN.replace("m",""));
					expiredVal = expiredVal+expiresIn*60;
					if(expiredVal < currentTime)
						return res.status(400).json({ success: false, error: 'Token Validity Expired.' });
					else
					{
						delete decoded.exp;
						delete decoded.iat;
						let tokenUrl = req.protocol + "://" + req.get("host") + "/v1/users/token/";
						const token = await createToken(decoded, tokenUrl);
						return res.status(200).send(
						{	success:true,
							data:token
						}
						);
					}
				}else {
					return res.status(400).json({ success: false, error: 'Unauthorized Token' })
				}
			}else{
				return res.status(400).json({ success: false, error: 'Unauthorized Access' })
			}
	
		}catch(ex){
			return res.status(500).send({
				success: false,
				error: ex.message
			});
		}
	}

	logout = async(req,res)=>{
		try{
			const reqParams = req.params;
			let tokenHeader = req.headers['authorization']
			if (tokenHeader) {
				let token = await tokenHeader.split(" ");

	
				let decoded = jwt.decode(token[1], process.env.JWT_SECRET_KEY);
				console.log(" decoded :: ", decoded);
				if (decoded) {
					//jwt.invalidate(token[1]);
					addDataToCache(token[1], true, 1800);
					return res.status(200).send(
						{	
							success:true
						}
					);
				}else {
					return res.status(400).json({ success: false, error: 'Unauthorized Token' })
				}
			}else{
				return res.status(400).json({ success: false, error: 'Unauthorized Access' })
			}
	
		}catch(ex){
			return res.status(500).send({
				success: false,
				error: ex.message
			});
		}
	}

	titdcoLogin = async (req, res) => {
		try {
			const {loginPassword} = req.body;
			const requrl = req.protocol + "://" + req.get("host") + "/v1/token/";
			const result = await this.UserService.titdcoLogin(loginPassword, requrl);
			res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: result
                }
            );

		} catch(ex) {
			return res.status(500).send({
				status: false,
				message: ex.message
			})
		}
	}
	otherServicelogin = async(req,res)=>{
		const reqQuery = req.query;
		const requiredFields = [
            "uName",
            "uPwd"
        ];
        for (let field of requiredFields) {
		if(reqQuery[field] === undefined || reqQuery[field] === null || reqQuery[field].trim() === '') {
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
			}
		}
		try{
			const query ={loginName:reqQuery.uName,loginPassword:reqQuery.uPwd}
			const userInfo = await userModel.findOne(query);
			if(userInfo == null){
				return res.status(NAMES_STATUS_MAPPINGS[NAMES.BAD_REQUEST]).send(
					{
						Success: false,
						message: 'Check your Credentials'
					}
				);
			}else{
				const userDetails = await getUserInfo(userInfo);
				let Obj = {
					userId:userDetails.userId,
					loginName:userDetails.loginName,
					loginPassword:encryptData(userInfo.loginPassword),
					loginType:userDetails.loginType
				}
				Obj.token= await createToken(Obj,"");
				res.status(200).send({
					Status:200,
					Success:true,
					token:Obj.token['token']
				})
			}
		}catch(ex){
			return res.status(500).send({
				Success: false,
				message: ex
			})
		}
	}
	userDataHandler = async(req,res)=>{
		const reqUser = req.user;
		if( reqUser.userId === null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
		}
		try{
			let userData =await this.UserService.getUserData(reqUser);
			return res.status(200).send({
				status:true,
				data:userData
			})

		}catch(ex){
			console.error("UserHandler - userDataHandler || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}
	}
	ssoAuthentication  = async (req,res)=>{
		const reqQueryParams =req.query;
		try{
			let  Url = `${process.env.CONNECT_SERVER_URI}/token`;
            
            let data ={
                code :reqQueryParams.code,
                redirect_uri : encodeURIComponent(process.env.CLIENT_CALLBACK_URI),
                grant_type:'authorization_code',
                client_id : process.env.CLIENT_ID,
                client_secret : process.env.FORMATTED_CLIENT_SECRET
            }
			console.log()
            const options = {
                method: 'POST',
				url: `${process.env.CONNECT_SERVER_URI}/token`,
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: data,
				httpsAgent: new https.Agent({  
				   rejectUnauthorized: false
				})
              };
			let responseData;
           try{
			let fileResponse = await axios.request(options);
			responseData = fileResponse.data;
		   }catch(e){
			responseData =e.response.data;
		   }
		   if(responseData.access_token){
				const fOptions = {
					method: 'POST',
					url: `${process.env.CONNECT_SERVER_URI}/resource`,
					headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					},
					data: {"access_token":responseData.access_token},
					httpsAgent: new https.Agent({  
						rejectUnauthorized: false
					 })
				};
				let fResponse = await axios.request(fOptions);
				let resp;
				if(fResponse.status == 200 && fResponse.data){
					const reqData = fResponse.data.User;
					let query ={loginId:reqData.csc_id}
					let User = await userModel.findOne(query);
					let UserData ={
						loginName : reqData.username,
						loginEmail:reqData.email,
						loginId: reqData.csc_id,
						loginType:"CSC",
						cscInfo :{
							fullname :reqData.fullname,
							state_code:reqData.state_code,
							lg_state_code:reqData.lg_state_code,
							lg_district_code:reqData.lg_district_code,
							user_type:reqData.user_type,
							RAP:reqData.RAP,
							POS:reqData.POS
						}
					}
					var date = new Date();
					var dateStr =
					("00" + date.getDate()).slice(-2) + "-" +
					("00" + (date.getMonth() + 1)).slice(-2) + "-" +
					date.getFullYear() + " " +
					("00" + date.getHours()).slice(-2) + ":" +
					("00" + date.getMinutes()).slice(-2) + ":" +
					("00" + date.getSeconds()).slice(-2);
					UserData.lastLogin =dateStr;
					if(User == null){
						User = await userModel.findOneAndUpdate(query,{$set:UserData},{upsert:true});
					}
					if(User && User?.loginId == ""){
						await userModel.findOneAndUpdate({_id:User._id},{$set:{loginId:User._id}});
					}
					const userDetails = await gAuth.getUserInfo(User);
					userDetails.token= await gAuth.createToken(userDetails,"");
					userDetails.lastLogin = User && User.lastLogin != null ? User.lastLogin: dateStr;
					if(userDetails && userDetails.token){
						let hash =encryptWithAESPassPhrase(JSON.stringify(userDetails), "123456");
						res.writeHead(301, { 'Location': `${process.env.ClIENT_URL}/SSO/sso?${hash}&${reqQueryParams.state}`} ).end();
					}
			  	}else{
					res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
						{
							status: false,
							message: "Session timeout , Please try Again"
						}
					)
			  	}
		   }
		}catch(ex){
			console.error("UserHandler - userDataHandler || Error :", ex);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}
	}

	sendSMS = async (req,res)=>{
        const reqQuery = req.body
		try{
			let response = await this.UserService.sendMobileSMS(reqQuery);
			let responseData = {
				status:true, 
				message: "Success",
				code: "200",
				data: response
			};
			// let hash = encryptWithAESPassPhrase(JSON.stringify(responseData), process.env.HASH_ENCRYPTION_KEY);
			// responseData.hash = hash;
			res.status(200).send({...responseData});	
		}catch(ex){
			console.error("UserHandler - userDataHandler || Error :", ex);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}
	}
	APIICLogin = async (req, res) => {
		try {
			const {loginPassword} = req.body;
			const requrl = req.protocol + "://" + req.get("host") + "/v1/token/";
			const result = await this.UserService.APIICLoginSrc(loginPassword, requrl);
			res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: result
                }
            );

		} catch(ex) {
			return res.status(500).send({
				status: false,
				message: ex.message
			})
		}
	}
	getApiicExc_data = async(req,res)=>{

		try{
			let userData =await this.UserService.getApiicExc_dataSrc();
			return res.status(200).send({
				status:true,
				data:userData
			})

		}catch(ex){
			console.error("UserHandler - userDataHandler || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}
	}
	getApiicExcPerData = async(req,res)=>{
     let reqData= req.query;
	 
		try{

			let userData =await this.UserService.getApiicExcPerDataSrc(reqData);
			return res.status(200).send({
				status:true,
				data:userData
			})

		}catch(ex){
			console.error("UserHandler - userDataHandler || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}
	}
	getapiicGovtInstitutions = async(req,res)=>{

		try{
			let userData =await this.UserService.getApiicGovtInstitutionData();
			return res.status(200).send({
				status:true,
				data:userData
			})

		}catch(ex){
			console.error("UserHandler - userDataHandler || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
		}
	}
	createExecMaster = async (req, res) => {
		try {
		  const data = await this.UserService.createExecMaster(req.body);
		  res.status(201).json({ success: true, message: "Created successfully", data });
		} catch (err) {
		  res.status(500).json({ success: false, message: err.message });
		}
	  };

	getVswsListHandler = async (req, res) => {
        const qParams = req.query;		
        if (qParams.SR_CD === null) {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        try {
            let response = await this.UserService.getVswsListService(qParams);
            let responseData = {
                status:true,
                message: "Success",
                code: "200",
                data: response
            };
            res.status(200).send({...responseData}); 
        } catch (ex) {
            console.error("UserHandler - getVswsListHandler || Error :", ex);
            const pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            );
        }
    };

    getVswsEmpListHandler = async (req, res) => {
        const qParams = req.query;
        if (qParams.Vill_CD === null) {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        try {
            let response = await this.UserService.getVswsEmpListService(qParams);
            let responseData = {
                status:true,
                message: "Success",
                code: "200",
                data: response
            };
            res.status(200).send({...responseData}); 
        } catch (ex) {
            console.error("UserHandler - getVswsEmpListHandler || Error :", ex);
            const pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            );
        }
    }

	VSWSLoginOTPHandler = async (req,res) => {
		try{
			const reqBody = req.body;
			const otp = otpGenerator.generate(6, { digits: true,lowerCaseAlphabets:false, upperCaseAlphabets: false, specialChars: false });
			let peId = '1001016721376697626';
			let templateId = '1007805820563243988'; 
			let url=`https://converge-now.com:1011/Sendsms/?user=LH_IGRSH&password=Igrs@12&sender=APIGRS&dest=91${reqBody.mobile}&messagetype=T&smsmessage=Dear%20User%2CYour%20OTP%20to%20login%20to%20PDE%20is%20${otp}.%20%28Valid%20for%2010%20Minutes%29.%20Kindly%20ignore%20if%20not%20initiated%20by%20you.Thank%20You%2CIGRS.&peid=${peId}&deliveryreport=yes&templateid=${templateId}`; 
			let response = await axios({
				url:url,
				method: 'GET'
			});
			otpCache.set(String(reqBody.mobile), otp, 600);			
			const logInsert = await this.orDao.oDbUpdateWithBindParams(
				`INSERT INTO srouser.sms_logs (application_id, template_id, type, status, time_stamp)
				VALUES (:app_id, :template_id, :type, :status, SYSDATE )`,
				{
					app_id: null,
					template_id: templateId,
					type: 'LoginOTP',
					status: 'accepted'
				}
		    );
			if(logInsert > 0) {
				res.status(200).send(
					{
						status:true,
						code: "200",
					}
				);
			}
			else {
				res.status(200).send(
					{
						status:false,
						code: "400",
					}
				);
			}
		} catch (ex) {
			console.error("UserHandler - VSWSLoginOTPHandler || Error :", ex.message);
			var pdeError = constructPDEError(ex);
			return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
				{
					status: false,
					message: pdeError.message
				}
			);
		}
	};

	VSWSLoginHandler = async (req, res) => {
		try {
			const reqBody = req.body;
			const mobile = String(reqBody.loginMobile);
			let cachedOTP = String(otpCache.get(mobile));
			const requrl = req.protocol + "://" + req.get("host") + "/v1/token/";			
			if (cachedOTP === reqBody.loginOtp) {
				otpCache.del(mobile);
				let userDetails = {
					loginName:reqBody.loginName,
					loginMobile: reqBody.loginMobile,
					loginType:'USER',
					loginId:reqBody.loginId,
					loginMode: reqBody.loginMode,
					loginSro: reqBody.loginSro,
					userId:String(reqBody.loginId),
					villCode:reqBody.villCode,
					webCode:reqBody.webCode
				}
				// const userDetails = await gAuth.getUserInfo(reqBody.loginMobile);
				userDetails.token = await gAuth.createToken(userDetails,requrl);
				res.status(200).send({
                status: true,
                message: "Login successful",
                code: "200",
                data: userDetails  
            });
				// return userDetails;
			} else {
				throw new Error("Invalid or expired OTP");
			}
		} catch (ex) {
			console.error("UserHandler - VSWSLoginHandler || Error :", ex.message);
			var pdeError = constructPDEError(ex);
			return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
				{
					status: false,
					message: pdeError.message
				}
			);
		}
	};

	apcobLogin = async (req, res) => {
		try {
			const { loginPassword } = req.body;
			const requrl = req.protocol + "://" + req.get("host") + "/v1/token/";
			const result = await this.UserService.apcobLogin(loginPassword, requrl);
			res.status(200).send(
				{
					status: true,
					code: "200",
					data: result
				}
			);

		} catch (ex) {
			return res.status(500).send({
				status: false,
				message: ex.message
			})
		}
	}
}
module.exports = UserHandler;






