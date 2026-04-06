const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("./errorHandler");
const SlotServices = require('../services/slotService');
const {slotBookingValidation} = require('../utils/validations');
const {encryptWithAESPassPhrase, decryptWithAES,decryptWithAESPassPhrase} = require('../utils/index');
const {hashGenerate, isSameDay} = require('../utils/helper');
const DocumentModel = require('../model/documentDetailsModel')
const slotModel = require('../model/slotModel')
const otpModel = require('../model/otpModel');
const moment = require('moment');
//const QRCode = require('qrcode');
const otpGenerator = require('otp-generator');
const axios =require('axios');
const orDbDao = require('../dao/oracleDbDaos');
const { logger } = require("handlebars");
const mobileOtpStore = {};
const APIService = require('../services/apiForOtherServices');class  SlotHandler {
	constructor(){
        this.slotServices = new SlotServices();
		this.apiHandlerService = new APIService();

		this.orDao = new orDbDao();
    }
	creatSlotBooking = async (req,res)=>{
		console.log("SlotHandler - CreatSlotBooking || Request is ", req.body);
		let slotBooking = {};
		slotBooking = req?.body;
		if( slotBooking.sroDistrict == null || slotBooking.sroOffice == null || slotBooking.dateForSlot == null || slotBooking.sroOfcNum== null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
            {
                status: false,
                message: NAMES.VALIDATION_ERROR
            });
		}
		let validations = await slotBookingValidation(slotBooking);
		if(validations && validations.status === false){
			let codes = validations.code ? NAMES.UNAUTHORIZED : NAMES.VALIDATION_ERROR;
			res.status(NAMES_STATUS_MAPPINGS[codes]).send(
                {
                    status: false,
                    message: validations.err
                }
            );
            return;
		}
		try{
			let response = await this.slotServices.createBooking(slotBooking,req.user);
			if(response){
				return res.status(200).send(
					{
						status:true, 
						message: "Your Slot Was Booked Successfully",
						code: "200",
						data: response
					}
				);
			}
			

		}catch(ex){
			console.error("SlotHandler - CreatSlotBooking || Error :", error.message);
            var pdeError = constructPDEError(error);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
	canceltheSlot = async (req,res)=>{
		let reqParams = req.body;
		if(reqParams.slotTime == null || reqParams.dateForSlot == null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				});
		}
		try{
			let dateSlot =await this.returnDate(reqParams.dateForSlot);
			let reqData={slotTime:reqParams.slotTime,dateForSlot:dateSlot,applicationId:reqParams.applicationId,type:"delete"}
			let response = await this.slotServices.deletetheSlot(reqData)
			if(response){
				res.status(200).send(
					{
						status:true,
						code: "200",
						message:"Slot Delete Successfully"
					}
				);
			}else{
				res.status(400).send(
					{
						status:false,
						code: "400",
						message:"Something went Wrong"
					}
				);
			}
			
		}catch(ex){
			console.error("SlotHandler - canceltheslot || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
	getSlots = async (req,res) =>{
		let reqParams = req.params
		let queryParams = req?.query;
		if(reqParams.sroOfcNum == null || queryParams.dateForSlot == null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				});
		}
		try{
			let dateSlot =await this.returnDate(queryParams.dateForSlot);
			let reqData={sroOfcNum:reqParams.sroOfcNum,dateForSlot:dateSlot}
			let response = await this.slotServices.getSlotsOnDay(reqData);
			res.status(200).send(
                {
                    status:true,
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("SlotHandler - GetSlots || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
	getSlotsbyAppId = async (req,res)=>{
		let reqParams = req.params
		if( reqParams.applicationId == null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				});
		}
		try{
			let response = await this.slotServices.getSlotsByAppIdService(reqParams);
			res.status(200).send(
                {
                    status:true,
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("SlotHandler - getSlotsbyAppId || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}

	//qrScanning
	syncedSlots = async(req,res)=>{
		let reqParams = req.params
		let queryParams = req?.query;
		if(reqParams.sroOfcNum == null || queryParams.dateForSlot == null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				});
		}
		try{
			let dateSlot =await this.returnDate(queryParams.dateForSlot);
			let reqData={sroOfcNum:reqParams.sroOfcNum,dateForSlot:dateSlot}
			let response = await this.slotServices.getSyncedSlotsOnDay(reqData);
			res.status(200).send(
                {
                    status:true,
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("SlotHandler - GetSlots || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}

	/*
	qrCodeGenerate = async (req,res)=>{
		const reqBody = req.body;
		if( reqBody.sroCode == null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				});
		}
		try{
			const today = new Date();
			const yyyy = today.getFullYear();
			let mm = today.getMonth() + 1; // Months start at 0!
			let dd = today.getDate();

			if (dd < 10) dd = '0' + dd;
			if (mm < 10) mm = '0' + mm;

			const formattedToday = dd + '/' + mm + '/' + yyyy;
			// let hash = encryptWithAESPassPhrase(reqBody.sroCode+","+`${formattedToday}`, "123456");
			let hash =await hashGenerate(reqBody.sroCode+","+`${formattedToday}`)
			console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh",hash)
			//const url = `http://localhost:3000/PDE/QrSlot/${hash}`;
			//const qrCodeImage = await QRCode.toDataURL(url);
			res.send(`<img src="" alt="QR Code"/>`);

		}catch(ex){
			console.error("SlotHandler - qrCodeGenerate || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            );
		}
	}
*/

    sendOtp = async(req,res)=>{
        try{
            const reqBody = req.body;
            console.log(reqBody,":::::::::::::::::::")
            const otp = otpGenerator.generate(6, { digits: true,lowerCaseAlphabets:false, upperCaseAlphabets: false, specialChars: false });
            let peId = '1001016721376697626';
            let templateId = '1007335578072924692';
            let templateMessage = `Dear User,Your OTP to complete the user registration process is ${otp}. (Valid for 10 minutes.)Kindly ignore if not initiated by you.Thank you,IGRS`;
            templateMessage = encodeURIComponent(templateMessage)
 
			let url=`https://converge-now.com:1011/Sendsms/?user=LH_IGRSH&password=Igrs@12&sender=APIGRS&dest=91${reqBody.mobile}&messagetype=T&smsmessage=${templateMessage}&peid=${peId}&deliveryreport=yes&templateid=${templateId}`; 
            console.log("::::::::::::::::::",url);
            // let url=`https://converge-now.com:1011/Sendsms/?user=LH_IGRSH&password=Igrs@12&sender=APIGRS&dest=91${reqBody.mobile}&messagetype=T&smsmessage=Dear%20User%2CYour%20OTP%20to%20login%20to%20PDE%20is%20${otp}.%20%28Valid%20for%2010%20Minutes%29.%20Kindly%20ignore%20if%20not%20initiated%20by%20you.Thank%20You%2CIGRS.&peid=${peId}&deliveryreport=yes&templateid=${templateId}`;
            let response = await axios({
                url:url,
                method: 'GET'
            })
			console.log("????????????????:",response);
			const resultupdate = await this.orDao.oDbUpdateWithBindParams(`update preregistration.slot_details set otp = :otp where id = :app_id`, { otp : otp, app_id : reqBody.applicationId});
            const logInsert = await this.orDao.oDbUpdateWithBindParams(
            `INSERT INTO srouser.sms_logs (application_id, template_id, type, status, time_stamp)
             VALUES (:app_id, :template_id, :type, :status, SYSDATE )`,
            {
                app_id: reqBody.applicationId || null,
                template_id: templateId,
                type: 'SLOT VERIFY',
                status: 'accepted'
            }
        );
		console.log("logInsert",logInsert);
		
 			console.log(resultupdate);
 			if(resultupdate > 0 && logInsert > 0) {
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
					code: "200",
				}
			);
		}

   
        } catch (ex) {
            console.error("SlotHandler - sendOtp || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            );
        }
    }
 
 
 



	verifyOTP = async (req,res)=>{
		const reqBody = req.body;
				console.log("::::::::::::::::::::::::::",reqBody);
		try{
			// console.log("::::::::::::::::::::::::::",reqBody);
			reqBody.slotOtp =  decryptWithAESPassPhrase(reqBody.slotOtp,'123456')
			let response = await DocumentModel.findOne(reqBody);
			console.log("::::::::::::::::::::::::::",response);

			if(response){
				return res.status(200).send(
					{
						status:true, 
						message: "OTP Verified",
						code: "200",
					}
				);
			}else{
				return res.status(400).send(
					{
						status:false, 
						message: "Provided OTP is Wrong",
						code: "400",
					}
				);
			}
		}catch(ex){
			console.error("DocuemntHandler - verifyOTP || Error :", ex);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
	createQrSlot = async (req,res)=>{
		console.log("SlotHandler - CreatSlotBooking || Request is ", req.body);
		let slotBooking = {};
		slotBooking = req?.body;
		if( slotBooking.sroDistrict == null || slotBooking.sroOffice == null || slotBooking.dateForSlot == null || slotBooking.sroOfcNum== null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
            {
                status: false,
                message: NAMES.VALIDATION_ERROR
            });
		}
		let validCheck = await slotModel.aggregate([{$match:{applicationId:slotBooking.applicationId}}]);
		if(validCheck && validCheck.length>0 && isSameDay(validCheck[0].dateForSlot,slotBooking.dateForSlot)){
				return res.status(400).send(
				    {
				        status:false, 
				        message: `Slot already booked for this ApplictionId`,
				        code: "400",
				    }
				);
		}
		try{
			let response = await this.slotServices.createBooking(slotBooking,req.user);
			res.status(200).send(
                {
                    status:true, 
                    message: "Your Slot Was Booked Successfully",
                    code: "200",
                    data: response
                }
            );

		}catch(ex){
			console.error("SlotHandler - CreatSlotBooking || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}


	slotStatusUpdate = async (req,res)=>{
		console.log("SlotHandler - slotStatusUpdate || Request is ", req.body);
		let slotBooking = {};
		slotBooking = req?.body;
		if( slotBooking.applicationId == null || slotBooking.status == null || slotBooking.sroOfcNum== null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
            {
                status: false,
                message: NAMES.VALIDATION_ERROR
            });
		}
	
		try{
			let response = await this.slotServices.slotStatusUpdate(slotBooking);
			res.status(200).send(
                {
                    status:true, 
                    message: "Your Slot Status Updated Successfully",
                    code: "200",
                    data: response
                }
            );

		}catch(ex){
			console.error("SlotHandler - slotStatusUpdate || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
	isSlotEnabledForSro = async (req,res) =>{
		let reqParams = req.params
		if(reqParams.sroOfcNum == null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
				{
					status: false,
					message: NAMES.VALIDATION_ERROR
				});
		}
		try{
			
			let response = await this.slotServices.isSlotEnabledForSro(reqParams.sroOfcNum);
			res.status(200).send(
                {
                    status:true,
                    code: "200",
                    data: response
                }
            );
		}catch(ex){
			console.error("SlotHandler - GetSlots || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}



	returnDate =async (d1) => {
		let d = (new Date(d1)).toISOString().slice(0, -1);
		let y = new Date(d);
		return `${y.getFullYear()}-${(y.getMonth() + 1) > 9 ? (y.getMonth() + 1) : `0${y.getMonth() + 1}`}-${y.getDate() > 9 ? y.getDate() : `0${y.getDate()}`}`;
	}

	GetSlotBookingStatisticsForRtgs = async (req, res) => {
		const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let reqData={
      dept_type:'HigherEducation'
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
		try {
			const { startdate, enddate } = req.query;
	
			if (!startdate || !enddate) {
				return res.status(400).json({
					message: !startdate ? "Start date is required" : "End date is required",
				});
			}
	
			const startDateMoment = moment(startdate, 'DD-MM-YYYY', true);
			const endDateMoment = moment(enddate, 'DD-MM-YYYY', true);
	
			if (!startDateMoment.isValid() || !endDateMoment.isValid()) {
				return res.status(400).json({
					message: "Date format must be DD-MM-YYYY",
				});
			}
	
			if (endDateMoment.isBefore(startDateMoment)) {
				return res.status(400).json({
					message: "End date should be equal to or after Start date",
				});
			}
	
			const startDateObj = startDateMoment.toDate();
			const endDateObj = endDateMoment.endOf('day').toDate();
	
			const query = {
				dateForSlot: { $gte: startDateObj, $lte: endDateObj },
			};
	
			const data = await slotModel.aggregate([
				{ $match: query },
				{
					$project: {
						sroDistrict: 1,
						sroOffice: 1,
						status: 1,
						opening: {
							$cond: [{ $eq: ["$status", "BOOKED"] }, 1, 0]
						},
						closed: {
							$cond: [{ $eq: ["$status", "VERIFIED"] }, 1, 0]
						}
					}
				},
				{
					$group: {
						_id: {
							district: "$sroDistrict",
							sroOffice: "$sroOffice"
						},
						openingCount: { $sum: "$opening" },
						closedCount: { $sum: "$closed" }
					}
				},
				{
					$addFields: {
						totalCount: { $add: ["$openingCount", "$closedCount"] }
					}
				},
				{
					$project: {
						_id: 0,
						district: "$_id.district",
						sroOffice: "$_id.sroOffice",
						openingCount: 1,
						closedCount: 1,
						totalCount: 1
					}
				},
				{
					$sort: {
						district: 1,
						sroOffice: 1
					}
				}
			]);
	
			res.status(200).json({
				message: "Data fetched successfully",
				data: data
			});
		} catch (err) {
			console.error("Error fetching data:", err);
			res.status(500).json({
				message: "Internal Server Error",
				error: err.message
			});
		}
	};
	mobilesendOtp = async (req, res) => {
		try {
			const reqBody = req.body;
			if (!reqBody.mobile || reqBody.mobile.length !== 10 || !/^\d+$/.test(reqBody.mobile)) {
				return res.status(400).send({
					status: false,
					message: "Invalid mobile number provided."
				});
			}

			const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
			// const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
			const userQuery = {
					otpType: "Claimant",
					claimentOtp: otp,
					applicationId: reqBody.App_id,
					claimantMobile: reqBody.mobile,
					createdAt:new Date(),
					updatedAt:new Date()
			};
			let partyData = await otpModel.findOne({ applicationId: reqBody.App_id, claimantMobile: reqBody.mobile,  otpType: "Claimant"});
			let partyOtp;
			console.log(partyData, 'partyData')
			if (!partyData) {
				partyOtp = await otpModel.create(userQuery);
			}
			else {
				partyOtp = await otpModel.updateOne(
				{ applicationId: reqBody.App_id, claimantMobile: reqBody.mobile, otpType: "Claimant" },
				{ $set: userQuery }
				);
			}			
        let peId = '1001016721376697626';
        let templateId = '1007335578072924692';
        let templateMessage = `Dear User,Your OTP to complete the user registration process is ${otp}. (Valid for 10 minutes.)Kindly ignore if not initiated by you.Thank you,IGRS`;
        templateMessage = encodeURIComponent(templateMessage);

        let url = `https://converge-now.com:1011/Sendsms/?user=LH_IGRSH&password=Igrs@12&sender=APIGRS&dest=91${reqBody.mobile}&messagetype=T&smsmessage=${templateMessage}&peid=${peId}&deliveryreport=yes&templateid=${templateId}`;
        console.log("SMS URL:", url);

        let response = await axios({
            url: url,
            method: 'GET'
        });
		 if (response.data) {
            const logInsert = await this.orDao.oDbInsertDocsWithBindParams(
                `INSERT INTO srouser.sms_logs (application_id, template_id, type, status, time_stamp)
                 VALUES (:app_id, :template_id, :type, :status, SYSDATE)`,
                {
                    app_id: reqBody.App_id || null,
                    template_id: templateId,
                    type: 'Claimant OTP',
                    status: 'accepted'
                }
            );
            console.log("logInsert", logInsert);

            res.status(200).send({
                status: true,
                code: "200",
                message: "OTP sent successfully."
            });
        } else {
            res.status(200).send({
                status: false,
                code: "200",
                message: "Failed to send OTP via SMS gateway."
            });
        }

		} catch (ex) {
			console.error("SlotHandler - mobilesendOtp || Error :", ex.message);
			var pdeError = constructPDEError(ex);
			return res.status(NAMES_STATUS_MAPPINGS[pdeError.name] || 500).send({
				status: false,
				message: pdeError.message || "An unexpected error occurred while sending OTP."
			});
		}
	};
	verifyMobileOtp = async (req, res) => {
		try {
			const reqBody = req.body;
			const { mobile, otp } = reqBody;
			if (!mobile || !otp) {
				return res.status(400).send({
					status: false,
					message: "Mobile number and OTP are required for verification."
				});
			}
			if (otp.length !== 6) {
				return res.status(400).send({
					status: false,
					message: "Invalid OTP format. OTP must be 6 digits."
				});
			}
			const selectDoc = await otpModel.findOne({ applicationId: reqBody.App_id, claimantMobile: reqBody.mobile,otpType:'Claimant' });
			if (String(selectDoc.claimentOtp) === otp) {
				return res.status(200).send({
					status: true,
					message: "Mobile OTP verified successfully!"
				});
			} else {
				return res.status(400).send({
					status: false,
					message: "Provided OTP is wrong. Please Enter correct OTP."
				});
			}
	           } catch (ex) {
			     console.error("SlotHandler - verifyMobileOtp || Error :", ex.message);
			     var pdeError = constructPDEError(ex);
			    return res.status(NAMES_STATUS_MAPPINGS[pdeError.name] || 500).send({
				status: false,
				message: pdeError.message || "An unexpected error occurred during OTP verification."
			});
		}
	};
};
module.exports = SlotHandler;
