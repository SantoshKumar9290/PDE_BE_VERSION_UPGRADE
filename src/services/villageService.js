const { set } = require("lodash");
const { NAMES } = require("../constants/errors");
const MasterDataVillageDao = require("../dao/masterDataVillageDao");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("../handlers/errorHandler");
const moment = require('moment');
const soap = require('soap');
const oracleDb = require('oracledb');
const axios = require('axios');
const idgenarator = require('../model/idGenerate');
//const xml2js = require('xml2js')
//const { XMLParser, XMLBuilder, XMLValidator} = require("fast-xml-parser");
const { xml2json } = require('xml-js');
const otpGenerator = require('otp-generator');
const idGenerate = require("../model/idGenerate");
const {Logger} = require('../../services/winston');
const qs = require('qs')
const {parseString}  = require('xml2js');
const MasterDataVillageModel = require("../model/masterDataVillageModel");
const FormData = require('form-data');
const oracleDbDaos= require('../dao/oracleDbDaos')
const orDbDao = require('../dao/oracleDbDaos');
const thirdPartyAPIResponseDao= require('../dao/thirdPartyAPIResponseDao')
const {thirdPartyDepartments}=require('../utils/config')
const https = require('https');
class VillageService {

    constructor(){
        this.masterDataVillageDao = new MasterDataVillageDao();
		this.oracleDbDaos= new oracleDbDaos();
		this.orDao = new orDbDao();
		this.thirdPartyAPIDao = new thirdPartyAPIResponseDao();
		
    }

    getDistricts = async () => {
        try {
            const villageDbData = await this.masterDataVillageDao.getAll();
            if(villageDbData == null || villageDbData.length == 0){
                console.log("VillageService - getDistricts || No Districts Present");
                throw new PDEError({name: NAMES.NOT_FOUND, err: "No Districts Present"});
            }
            let districtsresponse = [];
            let districtIds = [];
            villageDbData.forEach(villageData => {
                if(districtIds.indexOf(villageData.revenueDistCode) == -1){
                    districtsresponse.push({
                        id: villageData.revenueDistCode,
                        name: villageData.district[0].toUpperCase()
                    })
                    districtIds.push(villageData.revenueDistCode);
                }
            });
            return districtsresponse;
        } catch (error) {
			Logger.error(error.message);
            console.error("VillageService - getDistricts || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    }

    getMandals = async (districtId) => {
        try {
            let dbFilter = {
                revenueDistCode: districtId
            }
            const villageDbData = await this.masterDataVillageDao.getByFilters(dbFilter);
            if(villageDbData == null || villageDbData.length == 0){
                console.log("VillageService - getMandals || No Mandals Present");
                throw new PDEError({name: NAMES.NOT_FOUND, err: "No Mandals Present"});
            }
            let mandalsresponse = [];
            let mandalIds = [];
            villageDbData.forEach(villageData => {
                if(mandalIds.indexOf(villageData.mandalCode) == -1){
                    mandalsresponse.push({
                        id: villageData.mandalCode,
                        name: villageData.mandalName
                    });
                    mandalIds.push(villageData.mandalCode);
                }
            });
            return mandalsresponse;
        } catch (error) {
            console.error("VillageService - getMandals || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    }

	getSroDetails = async (vgId) => {
        try {
            let dbFilter = {
                villageCode: vgId
            }
            const villageDbData = await this.masterDataVillageDao.getByFilters(dbFilter);
            if(villageDbData == null || villageDbData.length == 0){
                console.log("VillageService - getSroDetails || No SRO Present");
                throw new PDEError({name: NAMES.NOT_FOUND, err: "No SRO Present"});
            }
            let srosResponse = [];
            let sroIds = [];
            villageDbData.forEach(villageData => {
                if(sroIds.indexOf(villageData.srCode) == -1){
                    srosResponse.push({
                        id: villageData.srCode,
                        name: villageData.srName
                    });
                    sroIds.push(villageData.srCode);
                }
            });
            return srosResponse;
        } catch (error) {
			Logger.error(error.message);
            console.error("VillageService - getSroDetails || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    }
	getLinkSrDetails = async (distid)=>{
		try {
            let dbFilter = {
                revenueDistCode: distid
            }
            const villageDbData = await this.masterDataVillageDao.getByFilters(dbFilter);
            if(villageDbData == null || villageDbData.length == 0){
                console.log("VillageService - getSroDetails || No SRO Present");
                throw new PDEError({name: NAMES.NOT_FOUND, err: "No SRO Present"});
            }
            let srosResponse = [];
            let sroIds = [];
            villageDbData.forEach(villageData => {
                if(sroIds.indexOf(villageData.srCode) == -1){
                    srosResponse.push({
                        id: villageData.srCode,
                        name: villageData.srName
                    });
                    sroIds.push(villageData.srCode);
                }
            });
            return srosResponse;
        } catch (error) {
			Logger.error(error.message);
            console.error("VillageService - getSroDetails || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
	}

    getVillages = async (districtId, mandalId,sroCode) => {
        try {
            let dbFilter = {}
            if(districtId != null)
                dbFilter.revenueDistCode = districtId;
            if(mandalId != null)
                dbFilter.mandalCode = mandalId;
			if(sroCode != null)
				dbFilter.srCode = sroCode;
			if(districtId != null && mandalId != null)
				dbFilter ={
					revenueDistCode : districtId,
					mandalCode : mandalId
				}
            const villageDbData = await this.masterDataVillageDao.getByFilters(dbFilter);
            if(villageDbData == null || villageDbData.length == 0){
                console.log("VillageService - getVillages || No Villages Present");
                throw new PDEError({name: NAMES.NOT_FOUND, err: "No Villages Present"});
            }
            let villagesresponse = [];
            villageDbData.forEach(villageData => {
                    villagesresponse.push({
                        id: villageData.villageCode,
                        name: villageData.villageName,
						mandalCode :villageData.mandalCode,
						mandalName: villageData.mandalName,
						distCode:villageData.revenueDistCode,
						distName:villageData.revenueDistName,
						sroName :villageData.srName
                    })
            });
			var uniq = {};
			villagesresponse = villagesresponse.filter(obj => !uniq[obj.id] && (uniq[obj.id] = true));
            return villagesresponse;
        } catch (error) {
			Logger.error(error.message);
            console.error("VillageService - getVillages || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    }

    getCurrentPahaniDetailsSRO = async (reqData) => {
		let paramsToStoreThirdPartyData={}
        try {
			//vgcode, sryno
			let url = reqData.sryno ? process.env.WEB_LAND_WSDL : process.env.LPM_WEB_LAND;
			if(reqData.vgcode && reqData.vgcode.length === 6){
				reqData.vgcode = '0'+reqData.vgcode;
			};
			let  pahaniResults;
			let Pahaniresponse = [];
			const funcName = reqData.sryno? 'GetCurrentPahaniDetails_SRO':'Pahani';
			if(reqData.sryno){
					//const url = process.env.WEB_LAND_WSDL; //'https://webland.ap.gov.in/GetCurrentPahaniDetailssro.asmx?wsdl'
				const firstTwoChars = reqData.vgcode.slice(0, 2);
				const nextTwoChars = reqData.vgcode.slice(2, 4);  
				// var data = qs.stringify({
				// 	'Dcode':firstTwoChars,
				// 	'Mcode':nextTwoChars,         
				// 	'VCode':reqData.vgcode,
				// 	'sur_No':reqData.sryno,
				// 	'year':moment().year(),
				// 	'uid':'ws_land',
				// 	'pwd':'en9rgy5tar' 
				// });
				var data = `<?xml version="1.0" encoding="utf-8"?>
				<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
				  <soap:Body>
					<GetCurrentPahaniDetails_SRO xmlns="http://tempuri.org/">
					  <Dcode>${reqData.vgcode.substring(0, 2)}</Dcode>
					  <Mcode>${reqData.vgcode.substring(2, 4)}</Mcode>
					  <VCode>${reqData.vgcode}</VCode>
					  <sur_No>${reqData.sryno}</sur_No>
					  <year>${moment().year()}</year>
					  <uid>ws_land</uid>
					  <pwd>en9rgy5tar</pwd>
					</GetCurrentPahaniDetails_SRO>
				  </soap:Body>
				</soap:Envelope>`;
				var config = {
					method: 'post',
					url: url,
					headers: { 
					  'Content-Type': 'text/xml;charset=UTF-8', 
					},
					data : data
				};
				paramsToStoreThirdPartyData={
					request:{
						method:config.method,
						url:config.url,
						headers:config.headers,
						parameters:config.data
					}
				}
				pahaniResults = await axios.request(config);
				parseString(pahaniResults.data, { explicitArray: false }, function (err, result) {
					if (err) {
						throw new PDEError({name: NAMES.NOT_FOUND, err: "Village Pahani Details Not Found"});
						
					} else {
						// if(result.ArrayOfPahani.pahani && result.ArrayOfPahani.pahani.length === 0){
							if(result && result['soap:Envelope'] && result['soap:Envelope']['soap:Body'] && result['soap:Envelope']['soap:Body']['GetCurrentPahaniDetails_SROResponse'] && result['soap:Envelope']['soap:Body']['GetCurrentPahaniDetails_SROResponse']['GetCurrentPahaniDetails_SROResult'] && result['soap:Envelope']['soap:Body']['GetCurrentPahaniDetails_SROResponse']['GetCurrentPahaniDetails_SROResult']['pahanisro'] && result['soap:Envelope']['soap:Body']['GetCurrentPahaniDetails_SROResponse']['GetCurrentPahaniDetails_SROResult']['pahanisro']){
								pahaniResults=  result['soap:Envelope']['soap:Body']['GetCurrentPahaniDetails_SROResponse']['GetCurrentPahaniDetails_SROResult']['pahanisro'];
							} else {
							throw new PDEError({name: NAMES.NOT_FOUND, err: "Village Pahani Details Not Found"});
						}
					}
				 });
				if(typeof pahaniResults === 'object' && !Array.isArray(pahaniResults) && pahaniResults.pTotal_Extent == "0" && pahaniResults.pPattadar_Name =="No Records Found"){
					throw new PDEError({name: NAMES.NOT_FOUND, err: "Village Pahani Details Not Found"});
				}
				let regSurveyNum = reqData.sryno;

				if(typeof pahaniResults === 'object' && !Array.isArray(pahaniResults)){
					const mathcedSurveyVal = regSurveyNum.match(pahaniResults.pSurvey_no.trim());
					if(mathcedSurveyVal || pahaniResults.pTotal_Extent == "0"){
						Pahaniresponse.push({
							landNature: pahaniResults.pLand_Nature ,
							totalExtent:  pahaniResults.pTotal_Extent ,
							cultivated: pahaniResults.pCultivatable_Land,
							nonCultivated: pahaniResults.pUncultivated_Land,
							occupantExtent: pahaniResults.pOccupant_Extent ,
							classification: pahaniResults.pLand_Classification ,
							waterResource: pahaniResults.pWater_Resource ,
							occupantName: pahaniResults.pOccupant_Name ,
							isAnyDispute:pahaniResults.pDelete_Flag,
							fatherName: pahaniResults.pOccupant_Father_Name ,
							occupantKhataNo: pahaniResults.pKhata_Number,
							LandClassification: pahaniResults.LandClassification,
							SingleJoint: pahaniResults.SingleJoint,
							surveyNumber: pahaniResults.pSurvey_no.trim(),
						})
					}
				}else if(typeof pahaniResults === 'object' && Array.isArray(pahaniResults)){
					pahaniResults.forEach((pahaniObj) => {
						const doesKathaExist = Pahaniresponse.find(obj => pahaniObj.pKhata_Number == obj.occupantKhataNo);
						if (doesKathaExist) {
							let occupantTotalExtent = parseFloat(doesKathaExist.occupantExtent) + parseFloat(pahaniObj.pOccupant_Extent);
							occupantTotalExtent = parseFloat(occupantTotalExtent.toFixed(4));
							doesKathaExist.occupantExtent = occupantTotalExtent;
						} else {
							const mathcedSurveyVal = regSurveyNum.match(pahaniObj.pSurvey_no.trim());
							if(mathcedSurveyVal || pahaniObj.pTotal_Extent == "0"){
								Pahaniresponse.push({
									landNature: pahaniObj.pLand_Nature,
									totalExtent: pahaniObj.pTotal_Extent,
									cultivated: pahaniObj.pCultivatable_Land,
									nonCultivated: pahaniObj.pUncultivated_Land,
									occupantExtent: pahaniObj.pOccupant_Extent,
									classification: pahaniObj.pLand_Classification,
									waterResource: pahaniObj.pWater_Resource,
									occupantName: pahaniObj.pOccupant_Name,
									fatherName: pahaniObj.pOccupant_Father_Name,
									occupantKhataNo: pahaniObj.pKhata_Number,
									LandClassification: pahaniObj.LandClassification,
									SingleJoint: pahaniObj.SingleJoint,
									isAnyDispute: pahaniObj.pDelete_Flag,
									surveyNumber: pahaniObj.pSurvey_no.trim(),
								})
							}
						}
					})
				}
				paramsToStoreThirdPartyData.response=pahaniResults;
				paramsToStoreThirdPartyData.status='success'

			}else if(reqData.lpmNo){
				const data = JSON.stringify({
					"un": process.env.LPM_UNAME,
					"up": process.env.LPM_PASSWORD
				});
				var config = {
					method: 'post',
					url: `${url}/Token`,
					headers: { 
					  'Content-Type': 'application/json'
					},
					data : data
				  };
				
				let tokenData = await axios(config);
				let rData ={
					"Ptype": "CS",
					"VillageCode": reqData.vgcode,
					"LPM_Number": reqData.lpmNo,
					"UserName": process.env.LPM_UNAME,
					"Upassword": process.env.LPM_PASSWORD
				}
				const headers = {
					'Authorization': `Bearer ${tokenData.data.Data}`
				};
				paramsToStoreThirdPartyData={
					request:{
						method:config.method,
						url:`${url}/RegistrationService/RS`,
						headers:headers,
						parameters:rData
					}
				}
				let dataResponse = await axios.post(`${url}/RegistrationService/RS`,rData,{ headers });
					if(["No Data Found", "Record is a Joint Khata"].includes(dataResponse.data.Message)){
						throw new PDEError({name: NAMES.NOT_FOUND, err: dataResponse.data.Message});
					}
					pahaniResults= dataResponse.data.Data;
					if(pahaniResults && pahaniResults.length === 1 && pahaniResults[0].Code ==="101"){
						throw new PDEError({name: NAMES.BAD_REQUEST, err: pahaniResults[0].Info,message:pahaniResults[0].Info});
					}
					paramsToStoreThirdPartyData.response=pahaniResults;
					paramsToStoreThirdPartyData.status='success';
					pahaniResults.forEach(pahaniData => {
						Pahaniresponse.push({
							landNature: pahaniData.BroadCategory_LandNature,
							totalExtent:  pahaniData.TotalExtent =="" ? pahaniData.LPM_Extent : pahaniData.TotalExtent,
							cultivated: pahaniData.pCultivatable_Land,
							nonCultivated: pahaniData.pUncultivated_Land,
							occupantExtent:  pahaniData.PattadarExtent,
							classification: pahaniData.BroadCategory_LandCalssification,
							waterResource: pahaniData.Source_Of_Irrigation,
							occupantName: pahaniData.Pattadhar_Name,
							fatherName: pahaniData.Pattadhar_Father_Name,
							occupantKhataNo:  pahaniData.KhataNo,
							// survayNo:pahaniData.WL_Survey_No,
							survayNo:pahaniData.OldSurveyNo,
							Mobile:pahaniData.Mobile,
							AadhaarNo:pahaniData.AadhaarNo,
							DistCodeWithClassificationCode: pahaniData.DistCodeWithClassificationCode,
							SingleJoint: "Single"
						})
					})
			}  
			// || (pahaniResults.length == 1 && pahaniResults[0].pSerialNo >= 1 && pahaniResults[0].pSurvey_no == 'No Records Found')
            if(!pahaniResults || pahaniResults.length == 0 )
            {                
                throw new PDEError({name: NAMES.NOT_FOUND, err: "Village Pahani Details Not Found"});
            }
            return Pahaniresponse;            
        } catch (error) {
			Logger.error(error.message);
            console.error("VillageService - getVillages || Error :", error);
			paramsToStoreThirdPartyData.response=error.message??{};
			paramsToStoreThirdPartyData.status='failed';
            let pdeError = constructPDEError(error);
            throw pdeError;
        }finally{
			await this.thirdPartyAPIDao.create({
                request: paramsToStoreThirdPartyData.request,
                response: paramsToStoreThirdPartyData.response,
                userID: reqData?.user?.userId,
				module:"PDE",
                source: thirdPartyDepartments.webland,
                status: paramsToStoreThirdPartyData.status
            })
		}
    };

	getVillagesFromODB = async (sroCode)=>{
		try{
			sroCode = parseInt(sroCode)
			let query =`select  VILLAGE_CODE, VILLAGE_NAME FROM srouser.JURI_AG_HU a, SROMSTR.hab_code  b where a.VILLAGE_CODE ||'01'= b.HAB_CODE and  a.SRO_CODE=${sroCode}`
			const villageData = await this.masterDataVillageDao.getfiltersFromODB(query);
			return villageData;
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - getVillagesFromODB || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}
   getHabitationsFromODB = async (reqData)=>{
         try{
            let query ;
            if(reqData.villageCode && reqData.villageCode.length === 6){
                reqData.villageCode = '0'+reqData.villageCode;
            };
            let habQuery = `select substr(hab_code,1,7) villcd from hab_match where webland_code='${reqData.villageCode}'||'01' and rownum=1`;
            let details = await this.masterDataVillageDao.getfiltersFromODB(habQuery);

            let vgCode = details && details.length >0 ? details[0].VILLCD : reqData.villageCode;
            //reqData.villageCode = parseInt(reqData.villageCode);
            if(reqData.type=='rural'){
                //query = `select HABITATION,LOCAL_BODY_NAME,HAB_NAME FROM sromstr.mv_rur_hab_rate a,SROMSTR.hab_code b where a.HABITATION = b.HAB_CODE and a.REV_VILL_CODE='${vgCode}'`
                query = `SELECT
                sro_code,
                HABITATION,
                LOCAL_BODY_NAME,
                HAB_NAME,
                EFFECTIVE_DATE
            FROM
                sromstr.mv_rur_hab_rate a
            JOIN
                SROMSTR.hab_code b
            ON
                a.HABITATION = b.HAB_CODE
            WHERE
                (
                    (a.sro_code NOT IN ('714', '733', '734', '735')
                    and a.rev_vill_code not in (select village_code from card.crda_village)
                     AND TRUNC(a.EFFECTIVE_DATE) >= TO_DATE('01-02-2025', 'DD-MM-YYYY'))
                    OR a.sro_code IN ('714', '733', '734', '735')
                    or  a.rev_vill_code in (select village_code from card.crda_village)
                )
                AND a.rev_vill_code = '${vgCode}'
            ORDER BY
                a.sro_code DESC`
                // `select HABITATION,LOCAL_BODY_NAME,HAB_NAME FROM sromstr.mv_rur_hab_rate a,SROMSTR.hab_code b where a.HABITATION = b.HAB_CODE and a.REV_VILL_CODE=${reqData.villageCode}`
            }else if(reqData.type=='urban'){
                //query =`select distinct  HABITATION,WARD_NO,BI_WARD,BLOCK_NO,BI_BLOCK,LOCALITY_STREET||'('||ward_no||'-'||BLOCK_NO||')'||'*'||nvl2(to_char(a.FR_DOOR_NO),
                //RTRIM ('#' || TO_CHAR (a.FR_DOOR_NO) || ' to '|| TO_CHAR (a.TO_DOOR_NO)),'') || '-'|| classification LOCALITY_STREET,a.FR_DOOR_NO,SUBSTR (a.LOCALITY_STREET, 1, 45)|| RTRIM ('-' || TO_CHAR (a.LSR_NO), '-0') || nvl2(to_char(a.FR_DOOR_NO),RTRIM ('#' || TO_CHAR (a.FR_DOOR_NO) || ' to '|| TO_CHAR (a.TO_DOOR_NO)),'') loc, classification FROM sromstr.mv_urb_loc_reg a, srouser.JURI_AG_HU  b where a.SRO_CODE = b.SRO_CODE and b.VILLAGE_CODE='${vgCode}' and substr(habitation,1,7)='${vgCode}' order by WARD_NO,BLOCK_NO`
                query = `SELECT DISTINCT  
                EFFECTIVE_DATE,
                HABITATION,
                WARD_NO,RTRIM(LTRIM(BI_WARD)) AS BI_WARD,
                BLOCK_NO,RTRIM(LTRIM(BI_BLOCK)) AS BI_BLOCK,
                LOCALITY_STREET || '(' || WARD_NO || '-' || BLOCK_NO || ')' || '*' ||
                NVL2(TO_CHAR(a.FR_DOOR_NO), RTRIM('#' || TO_CHAR(a.FR_DOOR_NO) || ' to ' || TO_CHAR(a.TO_DOOR_NO)), '')
                || '-' || a.classification AS LOCALITY_STREET,
				LOCALITY_STREET || '(' || WARD_NO || '-' || BLOCK_NO || ')' || '*' ||
                NVL2(TO_CHAR(a.FR_DOOR_NO), RTRIM('#' || TO_CHAR(a.FR_DOOR_NO) || ' to ' || TO_CHAR(a.TO_DOOR_NO)), '')
                || '-' || a.classification || NVL2(WARD_NO || BLOCK_NO || BI_WARD || BI_BLOCK,
						'(' || 
							NVL(WARD_NO, '') 
							|| CASE WHEN WARD_NO IS NOT NULL AND BLOCK_NO IS NOT NULL THEN '-' ELSE '' END 
							|| NVL(BLOCK_NO, '') 
							|| CASE WHEN (WARD_NO IS NOT NULL OR BLOCK_NO IS NOT NULL) 
									AND (BI_WARD IS NOT NULL OR BI_BLOCK IS NOT NULL) 
								THEN '-' ELSE '' END 
							|| NVL(RTRIM(LTRIM(BI_WARD)), '') 
							|| CASE WHEN BI_WARD IS NOT NULL AND BI_BLOCK IS NOT NULL THEN '-' ELSE '' END 
							|| NVL(RTRIM(LTRIM(BI_BLOCK)), '') 
						|| ')', 
						''
				) AS LOCALITY_STREET_KEY,
                a.FR_DOOR_NO,
                SUBSTR(a.LOCALITY_STREET, 1, 45) || RTRIM('-' || TO_CHAR(a.LSR_NO), '-0') ||
                NVL2(TO_CHAR(a.FR_DOOR_NO), RTRIM('#' || TO_CHAR(a.FR_DOOR_NO) || ' to ' || TO_CHAR(a.TO_DOOR_NO)), '')
                AS loc,
                a.classification
            FROM
                sromstr.mv_urb_loc_reg a
            JOIN
                srouser.JURI_AG_HU b
            ON
                a.SRO_CODE = b.SRO_CODE
            WHERE
                b.VILLAGE_CODE = '${vgCode}'
                AND SUBSTR(a.HABITATION, 1, 7) = '${vgCode}'
                AND  (
                    (a.SRO_CODE NOT IN ('714', '733', '734', '735')
                    and SUBSTR(a.HABITATION, 1, 7) not in (select village_code from card.crda_village)
                     AND TRUNC(a.EFFECTIVE_DATE) >= TO_DATE('01-02-2025', 'DD-MM-YYYY'))
                    OR a.SRO_CODE IN ('714', '733', '734', '735')
                    or SUBSTR(a.HABITATION, 1, 7) in (select village_code from card.crda_village)
                )  
            ORDER BY
                a.WARD_NO,
                a.BLOCK_NO`
                //  `select distinct  HABITATION,WARD_NO,BLOCK_NO,LOCALITY_STREET||'('||ward_no||'-'||BLOCK_NO||')'  LOCALITY_STREET,SUBSTR (a.LOCALITY_STREET, 1, 45)|| RTRIM ('-' || TO_CHAR (a.LSR_NO), '-0') || RTRIM ('#' || TO_CHAR (a.FR_DOOR_NO) || ' to '|| TO_CHAR (a.TO_DOOR_NO)) loc FROM sromstr.urb_loc_rate_reg a, srouser.JURI_AG_HU  b where a.SRO_CODE = b.SRO_CODE and b.VILLAGE_CODE='${vgCode}' and substr(habitation,1,7)='${vgCode}' order by WARD_NO,BLOCK_NO`
                // `select distinct  HABITATION,WARD_NO,BLOCK_NO,LOCALITY_STREET||'('||ward_no||'-'||BLOCK_NO||')'  LOCALITY_STREET FROM sromstr.urb_loc_rate_reg a, srouser.JURI_AG_HU  b where a.SRO_CODE = b.SRO_CODE and b.VILLAGE_CODE='${vgCode}' and substr(habitation,1,7)='${vgCode}' order by WARD_NO,BLOCK_NO`;
            }
            const habitationData = await this.masterDataVillageDao.getfiltersFromODB(query);
            let fResults=[]
            habitationData.forEach(x => {
                if(!fResults.some(y => JSON.stringify(y) === JSON.stringify(x))){
                    fResults.push(x)
                }
              })
            return fResults;
        }catch(ex){
            Logger.error(ex.message);
            console.error("VillageService - getHabitationsFromODB || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
        }
    };	
	getPartyAndPropertyFromODB = async (reqData)=>{
		try{
			reqData.sroCode = parseInt(reqData.sroCode);
			reqData.documentId = parseInt(reqData.documentId);
			reqData.regYear = parseInt(reqData.regYear);
			let query1 = `select * from srouser.INDEX2VU_cr where sr_Code=${reqData.sroCode} and doct_no=${reqData.documentId} and reg_year=${reqData.regYear}`;
			let query2 = `select * from srouser.ind1v_n_cr where sr_Code=${reqData.sroCode} and doct_no=${reqData.documentId} and reg_year=${reqData.regYear}`;
			let details = await this.masterDataVillageDao.getpropertiesFromODB(query1,query2);
			return details
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - getPartyAndPropertyFromODB || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}

	getMarketValueService = async (reqData)=>{
		try{
			let query;
			if(reqData.type =='urban'){
				query = `SELECT * FROM sromstr.mv_urb_loc_reg where HABITATION=${reqData.villageCode}01`;
			}else if(reqData.type =='rural'){
				query = `select rev_vill_Code,habitation,hab_name,unit_rate,effective_date,classification,class_desc from sromstr.mv_rur_hab_rate a ,AREA_CLASS b, hab_code c where REV_VILL_CODE=${reqData.villageCode} and class_code=classification and hab_Code=habitation`;
			};
			let details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - getMarketValueService || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	};
	getDrDetailsService = async (reqData)=>{
		try{
			let query = `SELECT * FROM sromstr.mv_basic_urb_reg where WARD_NO=${reqData.wardNo} and BLOCK_NO=${reqData.blockNo} and HABITATION=${reqData.habitation}`;
			let details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details;

		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - getDrDetailsService || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}
	getDetailsServiceByClassic = async (reqData)=>{
		try{
			let query;
			if(reqData.villageCode && !reqData.serveyNo){
				query = `SELECT distinct SURVEY_NO FROM sromstr.mv_basic_rur_reg where REV_VILL_CODE=${reqData.villageCode}`;
			}else if(reqData.villageCode && reqData.serveyNo){
				query = `SELECT * FROM sromstr.mv_basic_rur_reg where REV_VILL_CODE=${reqData.villageCode} and SURVEY_NO=${reqData.serveyNo}`;
			}

			let details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details;

		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - getDrDetailsService || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}
	getProhibitedDetailsService = async (reqData,reqParams)=>{
		try{
			let query;
			if(reqData.villageCode && reqData.villageCode.length === 6){
				reqData.villageCode = '0'+reqData.villageCode;
			};
			if(reqParams.type == "rural" && reqData.proField == "A_SNO"){
				reqData.ward = null;
				reqData.block = null;
				reqData.dNo = null;
				query = `select SROUSER.pp_check_pde(${parseInt(reqData.sroCode)},'${reqData.villageCode}',${reqData.ward},${reqData.block},'${reqData.serveyNo}','${reqData.proField}') from dual`;
				
			}else if(reqParams.type === 'urban'){
				if(reqData.serveyNo != null && reqData.proField == "R_SNO"){
					reqData.ward = null;
					reqData.block = null;
					reqData.dNo = null;
					query = `select SROUSER.pp_check_pde(${parseInt(reqData.sroCode)},'${reqData.villageCode}',${reqData.ward},${reqData.block},'${reqData.serveyNo}','${reqData.proField}') from dual`;
				}else if(reqData.serveyNo == null && reqData.proField == "R_DNO"){

					query = `select SROUSER.pp_check_pde(${parseInt(reqData.sroCode)},'${reqData.villageCode}',${reqData.ward},${reqData.block},'${reqData.dNo}','R_DNO') from dual`;
					// query = `select SROUSER.pp_check_pde(115,'0119027','7','1','7-1-22','R_DNO') from dual`;
				}
			}
			let details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details;

		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - getProhibitedDetailsService || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	};

	dutyService = async (reqData)=>{
		try{
			let details;
			if(reqData.tmaj_code === '04' && reqData.tmin_code === '04'){
				details = {
					sd_p: Number(reqData.finalTaxbleValue) <= 1000000 ?  100 :  1000,
					td_p: 0,
					rf_p: 1000
				}
			} else if (reqData.tmaj_code === '07' && reqData.tmin_code === '06'){
				details = {
					sd_p: 30,
					td_p: 0,
					rf_p: 1000
				}
			}
			else {
				let query = `begin srouser.cca_duty_calc(:tmaj_code,:tmin_code,:local_body,:flat_nonflat,:final_taxable_value,:con_value,:adv_amount, :sd_p,:td_p,:rf_p); end;`;
				let obj ={
					tmaj_code:reqData.tmaj_code,
					tmin_code:reqData.tmin_code,
					local_body:reqData.local_body,
					flat_nonflat:reqData.flat_nonflat,
					final_taxable_value:reqData.finalTaxbleValue,
					con_value:reqData.con_value,
					adv_amount:reqData.adv_amount,
					sd_p: { type: oracleDb.NUMBER, dir: oracleDb.BIND_OUT },
					td_p: { type: oracleDb.NUMBER, dir: oracleDb.BIND_OUT },
					rf_p: { type: oracleDb.NUMBER, dir: oracleDb.BIND_OUT }
				}
				details = await this.masterDataVillageDao.getSProcedureODB(query,obj);
			}
			return details;
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - dutyService || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	};
	vacantLandService = async (reqData)=>{
		try{
			let query = `select UNIT_RATE from sromstr.mv_basic_rur_reg where rev_vill_code='${reqData.vgCode}' and rtrim( survey_no||'/'||sub_survey_no,'/')='${reqData.surveyNo}'`;
			let details = await this.oracleDbDaos.oDBQueryService(query)
			return details;
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - vacantLandService || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	};

	mvadatapost = async (reqdata)=>{
		try{
			const currentYear = new Date().getFullYear();
			let reqnoquery=`SELECT 
			COALESCE(MAX(req_no), 0) + 1 AS ReqNo 
		FROM 
			srouser.mva_rur 
		WHERE 
			sr_code = '${reqdata.SR_CODE}' and mva_year=${currentYear}`;
			let reqnoresult=await this.oracleDbDaos.oDBQueryService(reqnoquery);
			let REQ_NO= reqnoresult[0].REQNO;
			let  PROPERTY_TYPE=  reqdata.PROPERTY_TYPE.toString().length
			let proptypequery=`select * from area_class where CLASS_CODE='${PROPERTY_TYPE>1 ? reqdata.PROPERTY_TYPE : '0'+reqdata.PROPERTY_TYPE }' `;
			let proptyperesult=await this.oracleDbDaos.oDBQueryService(proptypequery);
			let query = `INSERT INTO srouser.mva_rur (
				REQ_NO,
				SR_CODE,
				TRAN_MAJ_CODE,
				TRAN_MIN_CODE,
				LOCAL_BODY,
				WARD_NO,
				BLOCK_NO,
				LOC_CODE,
				LOC_HAB_NAME,
				ROAD_CODE,
				NEW_HOUSE_NO,
				OLD_HOUSE_NO,
				VILLAGE_CODE,
				HAB_CODE,
				SURVEY_NO,
				FLAT_NONFLAT,
				TOT_FLOOR,
				EXTENT,
				UNIT,
				NATURE_USE,
				MARKET_VALUE,
				SD,
				TD,
				RF,
				LEASE_DATE,
				LEASE_PERIOD,
				LEASE_ADV,
				TYPE_OF_ADV,
				LEASE_IMP,
				LEASE_TAX,
				TOT_RENT,
				AVG_ANN_RENT,
				LAND_COST,
				STRU_COST,
				EXTENT_RATE,
				ENT_DATE,
				EAST,
				WEST,
				NORTH,
				SOUTH,
				CHARG_ITEM_CD,
				PLOT_NO,
				VILLAGE_NAME,
				AG_NAME,
				COPY_NO,
				FEE,
				NEW_OLD,
				MVA_YEAR,
				CONS_VALUE,
				JURISDICTION,
				PROPERTY_BASED,
				OPERATOR,
				PROPERTY_TYPE,
				BI_WARD,
				BI_BLOCK,
				PROHIBITED_PROPERTY,
				STRUCTURE
			) 
			VALUES (
				'${REQ_NO}',
				'${reqdata.SR_CODE}',
				'${reqdata.TRAN_MAJ_CODE}',
				'${reqdata.TRAN_MIN_CODE}',
				'${reqdata.LOCAL_BODY}',
				'${reqdata.WARD_NO}',
				'${reqdata.BLOCK_NO}',
				'${reqdata.LOC_CODE}',
				'${reqdata.LOC_HAB_NAME}',
				'${reqdata.ROAD_CODE}',
				'${reqdata.NEW_HOUSE_NO}',
				'${reqdata.OLD_HOUSE_NO}',
				'${reqdata.VILLAGE_CODE}',
				'${reqdata.HAB_CODE}',
				'${reqdata.SURVEY_NO}',
				'${reqdata.FLAT_NONFLAT}',
				'${reqdata.TOT_FLOOR}',
				${reqdata.EXTENT_VALUE},
				'${reqdata.UNIT}',
				'${proptyperesult[0].CLASS_CODE}',
				${reqdata.MARKET_VALUE},
				'${reqdata.SD}',
				'${reqdata.TD}',
				'${reqdata.RF}',
				TO_DATE('${reqdata.LEASE_DATE}', 'YYYY-MM-DD'),
				'${reqdata.LEASE_PERIOD}',
				'${reqdata.LEASE_ADV}',
				'${reqdata.TYPE_OF_ADV}',
				'${reqdata.LEASE_IMP}',
				'${reqdata.LEASE_TAX}',
				'${reqdata.TOT_RENT}',
				'${reqdata.AVG_ANN_RENT}',
				${reqdata.LAND_COST},
				${reqdata.STRU_COST},
				${reqdata.EXTENT_RATE},
				SYSDATE,
				'${reqdata.EAST}',
				'${reqdata.WEST}',
				'${reqdata.NORTH}',
				'${reqdata.SOUTH}',
				'${reqdata.CHARG_ITEM_CD}',
				'${reqdata.PLOT_NO}',
				'${reqdata.VILLAGE_NAME}',
				'${reqdata.AG_NAME}',
				'${reqdata.COPY_NO}',
				'${reqdata.FEE}',
				'${reqdata.NEW_OLD}',
				'${currentYear}',
				'${reqdata.CONS_VALUE}',
				'${reqdata.JURISDICTION}',
				'${reqdata.PROPERTY_BASED}',
				'${reqdata.OPERATOR}',
				'${proptyperesult[0].CLASS_TYPE}',
				'${reqdata.BI_WARD}',
				'${reqdata.BI_BLOCK}',
				'${reqdata.PROHIBITED_PROPERTY}',
				:blobdata
			)`;
			let STRUCTURE = reqdata.STRUCTURE ? Buffer.from(reqdata.STRUCTURE, 'utf8'): null ;
            let details = await this.oracleDbDaos.oDbInsertBlobDocs(query,STRUCTURE);
			return {details:details, REQ_NO:REQ_NO};
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - mvadatapost || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	};


	dutyFeeforLeaseDocs = async (reqData)=>{
		try{
			if(reqData.tmin_code != '06'){
				let query = `BEGIN SROUSER.cca_duty_calc_lease(:tmaj_code,:tmin_code,:tot_rent,:avg_ann_rent,:nature,:rentperiod,:rent,:sd_p, :rf_p,:td_p); END;`
				let obj ={
					tmaj_code:reqData.tmaj_code,
					tmin_code:reqData.tmin_code,
					tot_rent:reqData.tot_rent,
					avg_ann_rent:reqData.avg_ann_rent,
					nature:reqData.nature,
					rentperiod:reqData.rentperiod,
					sd_p: { type: oracleDb.NUMBER, dir: oracleDb.BIND_OUT },
					rent: { type: oracleDb.NUMBER, dir: oracleDb.BIND_OUT },
					rf_p: { type: oracleDb.NUMBER, dir: oracleDb.BIND_OUT },
					td_p: { type: oracleDb.NUMBER, dir: oracleDb.BIND_OUT }
				}
				let details = await this.masterDataVillageDao.getSProcedureODB(query,obj);
				return details;
			}else{
				let query = `SELECT 
    							sd_val AS "sd_p", 
								rf_val AS "rf_p", 
								0 AS "rent", 
								0 AS "td_p" 
							FROM card.cca_duty_master_lease_new 
							WHERE tran_maj_code = :tmaj_code 
							AND tran_min_code = :tmin_code`;
				let bindparam = {
					tmaj_code:reqData.tmaj_code,
					tmin_code:reqData.tmin_code,
				};
				let details = await this.oracleDbDaos.oDBQueryServiceWithBindParams(query,bindparam);
				return details[0];
			}
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - dutyFeeforLeaseDocs || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}
 


	localBodyService = async (reqData)=>{
		try{
			
			// let response = await MasterDataVillageModel.find({habitationCode:reqData.habCode},{habitationCode:1,localBodyCode:1,localBodyName:1,localbodyType:1})
			// return response;
			let query = `SELECT * FROM card.hab_local_body WHERE HAB_CODE=${reqData.habCode}`;
			let details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details;
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - localBodyService || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}
	structureDetails = async (reqData)=>{
		try{
			let query = `select * from stru_det where sr_code=${reqData.sroCode} and rdoct_no=${reqData.linkDoc_No} and ryear=${reqData.regYear} and book_no=1`;
			let details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details;
		}catch(ex){
			console.error("VillageService - structureDetails || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}

	
	mvCalcService = async (reqData,reqParams) =>{
		let uniqueId = await idGenerate.findOne();
		let unValue ;
		if(uniqueId == null){
			let Obj ={sequenceValue:1};
			const idgenarator = new idGenerate(Obj).save();
			unValue =1;
		}else{
			unValue = uniqueId.sequenceValue + 1;
			await idGenerate.findOneAndUpdate({sequenceValue:uniqueId.sequenceValue},{$set:{sequenceValue:unValue}});
		}
		if(reqData.vill_cd && String(reqData.vill_cd).length === 6){
			reqData.vill_cd = '0'+reqData.vill_cd;
		};
		if(reqData.floor_no && reqData.floor_no.length ===1){
			reqData.floor_no = '0'+reqData.floor_no;
		}
		try{
			let query,query2,details;
			if(reqParams.type ==="urban"){
				let queryTable = reqData.strType === "Industrial" ? 'cca_calculate_mv_v2_inds' : 'cca_calculate_mv_v2';
				// query = `DECLARE extent_rt NUMBER(10); charge_rt VARCHAR2(1000);land_ct NUMBER(10); 
				// structure_ct NUMBER(10); market_vl NUMBER(10); v_array stru_array; v_stru_record stru_record :=stru_record('${reqData.floor_no}', '${reqData.stru_type}', ${reqData.plinth}, '${reqData.plinth_unit}', ${reqData.stage}, ${reqData.age}); 
				// BEGIN v_array := stru_array(); v_array.extend; v_array(1):=v_stru_record; sromstr. cca_calculate_mv_v2 (${reqData.sroCode}, '${reqData.vill_cd}','${reqData.locality}',
				// '${reqData.habitation}',${reqData.wno},${reqData.bno},'${reqData.house_no}','${reqData.nearby_boundaries}' ,'${reqData.surveyno}','${reqData.nature_use}',${reqData.land_extent},'${reqData.land_unit}',${reqData.total_floor} ,'${reqData.property_type}', '${reqData.property_nature}', ${reqData.localbody}, 
				// v_array, extent_rt, charge_rt, land_ct, structure_ct, market_vl );Insert into srouser.MV_DATA_CR (MV_ID,EXT_RT,CHRGE_RT,LAND_CST,STRU_CST,MKT_VAL) values (${unValue},extent_rt,charge_rt,land_ct,structure_ct,market_vl);commit;END;`;
				
				query =`DECLARE extent_rt NUMBER(10); charge_rt VARCHAR2(1000);land_ct NUMBER(10); 
				structure_ct NUMBER(10); market_vl NUMBER(10); v_array stru_array; v_stru_temp VARCHAR2(3000) := nvl('${reqData.str_type}','#');
				v_stru_record stru_record;
				v_cnt         NUMBER;
				v_sngl        VARCHAR2(3000);
				v_floor_no    VARCHAR2(2);
				v_stru_type   VARCHAR2(2);
				v_plinth      NUMBER(12);
				v_plinth_unit CHAR(1);
				v_stage       NUMBER(1);
				v_age         NUMBER(3);
				BEGIN v_array := stru_array(); SELECT regexp_count(v_stru_temp, '#', 1) regexp_count INTO v_cnt FROM dual;
				FOR i IN 1..v_cnt LOOP v_array.extend; v_sngl := regexp_substr(v_stru_temp, '[^#]+', 1, i); SELECT regexp_substr(v_sngl, '[^,]+', 1, 1),
				regexp_substr(v_sngl, '[^,]+', 1, 2),
				regexp_substr(v_sngl, '[^,]+', 1, 3),
				regexp_substr(v_sngl, '[^,]+', 1, 4),
				regexp_substr(v_sngl, '[^,]+', 1, 5),
				regexp_substr(v_sngl, '[^,]+', 1, 6)
				INTO
				v_floor_no,
				v_stru_type,
				v_plinth,
				v_plinth_unit,
				v_stage,
				v_age
				FROM dual;
				v_stru_record := stru_record(v_floor_no, v_stru_type, v_plinth, v_plinth_unit, v_stage,
				v_age);
				v_array(i) := v_stru_record;
				END LOOP; sromstr.${queryTable} (${reqData.sroCode}, '${reqData.vill_cd}','${reqData.locality}',
				'${reqData.habitation}','${reqData.wno}','${reqData.bno}','${reqData.house_no}','${reqData.nearby_boundaries}' ,'${reqData.surveyno}','${reqData.nature_use}',${reqData.land_extent},'${reqData.land_unit}',${reqData.total_floor} ,'${reqData.property_type}', '${reqData.property_nature}', ${reqData.localbody}, 
				v_array, extent_rt, charge_rt, land_ct, structure_ct, market_vl );Insert into srouser.MV_DATA_CR (MV_ID,EXT_RT,CHRGE_RT,LAND_CST,STRU_CST,MKT_VAL) values (${unValue},extent_rt,charge_rt,land_ct,structure_ct,market_vl);commit;END;`;
				query2 =`select MKT_VAL,EXT_RT from srouser.MV_DATA_CR where MV_ID=${unValue} and rownum=1`;
				
			}else if(reqParams.type ==="rural"){
				query=`DECLARE extent_rt NUMBER(10); charge_rt VARCHAR2(1000); land_ct NUMBER(10); structure_ct NUMBER(10); market_vl NUMBER(10); v_array stru_array; v_stru_record stru_record :=stru_record('${reqData.floor_no}','${reqData.stru_type}', '${reqData.plinth}', '${reqData.plinth_unit}', '${reqData.stage}', '${reqData.age}'); BEGIN v_array := stru_array(); v_array.extend; v_array(1):=v_stru_record; sromstr. cca_calculate_mv_v2 (${reqData.sroCode}, '${reqData.vill_cd}','${reqData.habitation}','${reqData.habCode}',${reqData.wno},${reqData.bno},'${reqData.house_no}','${reqData.nearby_boundaries}' ,'${reqData.surveyno}','${reqData.nature_use}',${reqData.land_extent},'${reqData.land_unit}', ${reqData.total_floor} ,${reqData.property_type}, '${reqData.property_nature}', ${reqData.localbody}, v_array, extent_rt, charge_rt, land_ct, structure_ct, market_vl );Insert into srouser.MV_DATA_CR (MV_ID,EXT_RT,CHRGE_RT,LAND_CST,STRU_CST,MKT_VAL) values (${unValue},extent_rt,charge_rt,land_ct,structure_ct,market_vl);commit;END;`
				query2 =`select MKT_VAL,EXT_RT from srouser.MV_DATA_CR where MV_ID=${unValue} and rownum=1`;
			}
			console.log("######################################",query)
			details = await this.masterDataVillageDao.getMvvalueFromOdb(query,query2);
			return details;
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - mvCalcService || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}

	eChalanService = async (reqData)=>{
		try{
			let query = `select * from scanuser.echallan_Trans where depttransid=${reqData.deptTransId}`;
			let details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details;
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - eChalanService || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}

	wgCodeOfVgService = async (reqData)=>{
		try{
			let srvey = String(reqData.surveyNo).includes("/") ? String(reqData.surveyNo).split("/")[0] : String(reqData.surveyNo).split("-")[0];
			let query = `select substr(webland_code,1,7) as wb from srouser.hab_webland_cd where hab_code= '${reqData.habCode}' and ${srvey} between from_Sno and to_sno`;
			let details = await this.oracleDbDaos.oDBQueryService(query)
			return details;
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - vacantLandService || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	};

    getCDMAPropertyAssessmentDetails = async (ulbCode, assessmentNo, registrationValue, marketValue) => {
        try {
            const url = process.env.CDMA_Property_Assessment_URL; 
            const params = {
                          'ulbCode':ulbCode,
                          'assessmentNo':assessmentNo,         
                          'registrationValue':registrationValue,
                          'marketValue': (marketValue == undefined || marketValue == '') ? 0 : marketValue
            }
            const headers = {
				'Content-Type':'application/json',
				'Accept':'application/json',
                'Referer': '164.100.132.65'
            }
			const httpsAgent = new https.Agent({ rejectUnauthorized:false});
            const assDetResponse = await axios.post(url, params,{headers: headers, httpsAgent: httpsAgent});
            
            if(assDetResponse.status == 200)
                return assDetResponse.data;                    
            else
                return {};     

        } catch (error) {
            Logger.error(error.message);
            console.error("VillageService - getVillages || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    };

    getSingleCertificateDetails = async (certificateId, certIssueDate) => {
        try {
            const url = process.env.SHCIL_WSDL;
            const params = {}
            params.arg0 = {
                          'userId':process.env.SHCIL_USER_ID,
                          'password':process.env.SHCIL_PASSWORD,         
                          'certificateId':certificateId,
                          'certIssueDate':certIssueDate
                        }
            const funcName = 'getSingleCertificateDetails';
    
            let client = await soap.createClientAsync(url);
            let dataResponse = await client.getSingleCertificateDetailsAsync(params)

            if(!dataResponse || dataResponse.length == 0 || Object.keys(dataResponse[0].return.result).length <= 0)
            {                
                throw new PDEError({name: NAMES.NOT_FOUND, err: "Single Certificate Details Not Found"});
            }

            const certificateResponse = JSON.parse(xml2json(dataResponse[0].return.result, { spaces: 4, compact: true }));
            const certRes = certificateResponse.eStampCertificate;

            let certificateResults = {
                    "StateName": certRes.StateName._text,
                    "CertStatus": certRes.CertStatus._text,
                    "LinkedCertificates": Object.keys(certRes.LinkedCertificates).length <= 0?'': certRes.LinkedCertificates._text,
                    "CertificatesDetails": {
                        "CertificateNo": certRes.CertificatesDetails.CertificateNo._text,
                        "CertificateIssuedDate": certRes.CertificatesDetails.CertificateIssuedDate._text,
                        "AccountReference": certRes.CertificatesDetails.AccountReference._text,
                        "UniqueDocReference": certRes.CertificatesDetails.UniqueDocReference._text,
                        "Purchasedby": certRes.CertificatesDetails.Purchasedby._text,
                        "DescriptionofDocument": certRes.CertificatesDetails.DescriptionofDocument._text,
                        "PropertyDescription": certRes.CertificatesDetails.PropertyDescription._text,
                        "ConsiderationPriceRs": certRes.CertificatesDetails.ConsiderationPriceRs._text,
                        "FirstParty": certRes.CertificatesDetails.FirstParty._text,
                        "SecondParty": certRes.CertificatesDetails.SecondParty._text,
                        "PaidByForWhom": certRes.CertificatesDetails.PaidByForWhom._text,
                        "StampDutyAmountRs": certRes.CertificatesDetails.StampDutyAmountRs._text,
                        "DDOCode": certRes.CertificatesDetails.DDOCode._text,
                    }
                };
                      
            return certificateResults;            
    
        } catch (error) {
			Logger.error(error.message)
            console.error("Single Certificate Details - getSingleCertificateDetails || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    };

    sendSMS = async (number) => {
        try {
            const otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false });
            const url = process.env.SMS_GATEWAY_WSDL;
            const params = {
                        'phoneNo':number,
                        'content':'Your OTP to access Registration and Stamps Govt of AP Portal is ' + otp,         
                        'templateId': '1007176258326536442'
                        }

            let client = await soap.createClientAsync(url);
            let dataResponse = await client.sendSms_NewAsync(params)

            if(!dataResponse || dataResponse.length == 0 || Object.keys(dataResponse[0].return).length <= 0)
            {                
                throw new PDEError({name: NAMES.NOT_FOUND, err: "SMS not sent"});
            }   
            const logInsert = await this.orDao.oDbInsertDocsWithBindParams(
              `INSERT INTO  srouser.sms_logs (application_id, template_id, type, status, time_stamp)
        		VALUES (:application_id, :template_id, :type, :status, SYSDATE)`,
               {
    				application_id: null,   
     				template_id: templateId,
       				type: 'Registration Portal',
        			status: 'accepted'
   	  		}
          );
		  	console.log("SMS Log Inserted:", logInsert);
		  
            return otp;           
    
        } catch (error) {
			Logger.error(error.message)
            console.error("SMS Details - sendSms_New || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    };

	lpmCheckSrvc = async (reqData)=>{
		try{
			let query = `select count (*) cnt from card.gs_srcode where village_code=${reqData.villageCode}`;
			let details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details;
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - lpmCheckSrvc || Error :", ex.message);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}
	getVgSrvce = async (reqData)=>{
		try{
			let details;
			reqData.vgCodes = reqData.vgCodes.split(",");
			let codes = reqData.vgCodes.map((m)=>{
				let v = m.length ===6 ? '0'+ m +'01':m +'01';
				return "\'"+v+"\'";
			})
			codes = codes.join(",")
			let query
			// let query = `select substr(hab_code,1,7) villcd from hab_match where webland_code in (${codes}) and rownum=1`;
			// details = await this.masterDataVillageDao.getfiltersFromODB(query);
			// console.log("!!!!!!!!!!!!!!!!!!!!!!11",details);
			if(reqData.type =="vsw"){
				query = `select a.village_Code,a.village_name,webland_code,bifurcated_srcd,bifurcated_srname from card.gs_srcode a ,hab_match b where a.village_code=substr(b.hab_code,1,7) and webland_Code in (${codes})`;
				details = await this.masterDataVillageDao.getfiltersFromODB(query);
			}else{
				query = `select substr(hab_code,1,7) villcd from hab_match where webland_code in (${codes}) and rownum=1`;
				details = await this.masterDataVillageDao.getfiltersFromODB(query);
			}
			return details;
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - lpmCheckSrvc || Error :", ex);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}

	mvCalcOtherService = async(reqBody)=>{
		try{
			let vgCode = String(reqBody.vgCode).length === 6 ? '0'+reqBody.vgCode : reqBody.vgCode;
			let data={vgCodes:vgCode};
			let vgFromwebLand = await this.getVgSrvce(data);
			let vgFromWeb=vgFromwebLand[0].VILLCD;
			let query = `select sromstr.F_get_mktval ('${vgFromWeb}','${reqBody.surveyNum}') AS MV_VAL from dual`;
			let details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details[0]
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - mvCalcOtherService || Error :", ex);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}
	mvCalcwithClassificationService = async(reqBody)=>{
		try{
			let vgCode = String(reqBody.vgCode).length === 6 ? '0'+reqBody.vgCode : reqBody.vgCode;
			let data={vgCodes:vgCode};
			let vgFromwebLand = await this.getVgSrvce(data);
			let vgFromWeb=vgFromwebLand[0].VILLCD;
			let query = `select sromstr.F_get_mktval_class ('${vgFromWeb}','${reqBody.surveyNum}','${reqBody.clasification}') AS MV_VAL from dual`;
			let details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details[0]
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - mvCalcOtherService || Error :", ex);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}
	lpmService  = async(reqBody)=>{
		try{
			let vgCode = String(reqBody.vgCode).length === 6 ? '0'+reqBody.vgCode : reqBody.vgCode;
			let data={vgCodes:vgCode};
			let vgFromwebLand = await this.getVgSrvce(data);
			let vgFromWeb=vgFromwebLand[0].VILLCD;
			let query = `select sr_code,book_no,rdoct_no,ryear from tran_major where (sr_code,book_no,doct_no,reg_year) in (select sr_code,book_no,doct_no,reg_year from tran_sched where 
				village_code='${vgFromWeb}' and rtrim(ltrim(lp_no,','),',')='${reqBody.lpmNo}') and tran_maj_code='02' and rdoct_no is not null`;
			let details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details[0]
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - lpmSrvcService || Error :", ex);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}
	habitationforCCLA = async(reqData)=>{
		try{
			let vgCode = String(reqData.vgCode).length === 6 ? '0'+reqData.vgCode : reqData.vgCode;
			let query = `select max(hab_code)+1 from hab_code where hab_Code like '${vgCode}%'`;
			let details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details[0]
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - habitationforCCLA || Error :", ex);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}
	unitRateForCCLA = async(reqData)=>{
		try{
			let vgCode = String(reqData.vgCode).length === 6 ? '0'+reqData.vgCode : reqData.vgCode;
			let query = `select unit_rate from sromstr.mv_pai where vill_Code=(select substr(hab_code,1,7) from hab_match
			where substr(webland_Code,1,7)='${vgCode}' and rownum=1);'`;
			let details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details[0]
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - habitationforCCLA || Error :", ex);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}
	ecLinkedData = async(reqData)=>{
		try{
			let query = `select * from (select * from sub_index_sno where hab_code='${reqData.habCode}' and survey_no='${reqData.surveyNum}' order by reg_year desc) where rownum<4`;
			let details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details;
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - ecLinkedData || Error :", ex);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}
	adharvalidate = async(aadharNo)=>{
		try{
			let query = `select aadhar_validate('${aadharNo}') as aadhar_validate from dual`;
			let details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details;
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - adharvalidate || Error :", ex);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}

	UrbanTokenGeneration = async (req, res) => {
        try {
        console.log("villageservice:::::::::::::::UrbanTokenGeneration");
			let data = new FormData();
            data.append('grant_type', 'password');
            data.append('username', process.env.URBAN_USERNAME);
            data.append('password', process.env.URBAN_PASSWORD);
			const credentials = `${process.env.URBAN_AUTH_USERNAME}:${process.env.URBAN_AUTH_PASSWORD}`;
            const base64Credentials = Buffer.from(credentials).toString('base64');
			const httpsAgent = new https.Agent({  rejectUnauthorized:false});
            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: process.env.URBAN_BASE_URL + '/oauth/token?ulbCode=' + req.ulbCode,
                headers: {
                    'Referer': `${process.env.URBAN_SERVER_IP}`,
                    'Authorization': `Basic ${base64Credentials}`,
                    'Cookie': 'SESSIONID=20f60982-759e-4548-b57e-f327492ecedb'
                },
				httpsAgent:httpsAgent,
                data: data
            };
            console.log("config::::::::::::::::",config)
            let response = await axios(config);
            console.log("CDMA-API-RESPONSE:::::::::::::::::",response);
            if (req.flag) {
                return response.data
            } else {
                return res.status(200).send(response.data);
            }
        } catch (ex) {
            console.log("erroforcdmatoken::::::::::::::::::",ex)
            if (req.flag) {
                return ex.message
            } else {
                return res.status(400).send({
                    status: false,
                    message: ex.message
                })
            }
        }
    }

	getCDMAPropertyDetails = async (ulbCode, assessmentNo, registrationValue, marketValue,req) => {
		let paramsToStoreThirdPartyData={}
		try {
			let token = await this.UrbanTokenGeneration({ flag: 1, ulbCode });
            if (typeof token !== 'string') {
                token = token.access_token;
                let data = JSON.stringify({
                    "ulbCode": ulbCode,
                    "assessmentNo": assessmentNo,
                    "marketValue": registrationValue,
                    "partyValue": registrationValue
                  });
                 const httpsAgent = new https.Agent({ rejectUnauthorized:false});
                  let config = {
                    method: 'get',
                    maxBodyLength: Infinity,
                    url: process.env.URBAN_BASE_URL + '/v1.0/property/automutation/assessmentdetails',
                    headers: {
                      'Referer': `${process.env.URBAN_SERVER_IP}`,
                      'Content-Type': 'application/json',
                      'Authorization': 'Bearer ' + token,
                    },
					httpsAgent: httpsAgent,
                    data : data
                  };
				paramsToStoreThirdPartyData.request = { ...config, parameters: config.data };
				delete paramsToStoreThirdPartyData.request.data;
                let result = await axios.request(config);
				paramsToStoreThirdPartyData.response=result.data;
				paramsToStoreThirdPartyData.status="success";
                if(result.data.errorDetails.errorCode === 'PTIS-REST-0' || result.data.errorDetails.errorCode === null){
					return result.data;
                 }
				 else {
                    return result.data.errorDetails.errorMessage;
                 }
            } else {
                return `Token Generation Failed. ${token}`
            }
		} catch (ex){
			Logger.error(ex.message);
			paramsToStoreThirdPartyData.response=ex;
			paramsToStoreThirdPartyData.status="failed";
			console.error("VillageService - ecLinkedData || Error :", ex);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}finally{
			this.thirdPartyAPIDao.create({
				request: paramsToStoreThirdPartyData.request,
				response: paramsToStoreThirdPartyData.response,
				userID: req?.user?.userId,
				module:"PDE",
				source: thirdPartyDepartments.muncipal,
				Status: paramsToStoreThirdPartyData.status
			})
		}
	}

	checkUlbJurisdiction = async (sroCode, ulbCode)=>{
		try{
			let query = `select * from sromstr.municipality_codes where sr_code=${sroCode} and muni_code=${ulbCode}`;
			let	details = await this.masterDataVillageDao.getfiltersFromODB(query);
			return details;
		}catch(ex){
			Logger.error(ex.message);
			console.error("VillageService - checkUlbJurisdiction || Error :", ex);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	}
	
	sendSMSForApproveReject = async (number,type,data) => {
        try {   
			let url="";
			let peId = '1001016721376697626'; 
			let templateId;
			if(type=="SLOT"){
				templateId = '1007120881937246588';
				url=`https://converge-now.com:1011/Sendsms/?user=LH_IGRSH&password=Igrs@12&sender=APIGRS&dest=91${number}&messagetype=T&smsmessage=Your%20slot%20for%20registration%20against%20application%20no.%20${data.applicationId}%20is%20booked%20for%20${moment(data.slotDate).format("DD-MM-YYYY")}%2C%20${data.slotTime.split('-')[0]}%20HRS.%20Please%20visit%20the%20SRO%2015min%20before%20the%20slot%20with%20all%20the%20necessary%20documents.Thank%20You%2CIGRS.&peid=${peId}&deliveryreport=yes&templateid=${templateId}`
			}
			else if(type="SUBMIT"){
				templateId = '1007836624644304967';
				url=`https://converge-now.com:1011/Sendsms/?user=LH_IGRSH&password=Igrs@12&sender=APIGRS&dest=91${number}&messagetype=T&smsmessage=Dear%20User%2CYour%20application%20no.%20${data}%20has%20been%20submitted.%20Please%20make%20the%20payment%20to%20ease%20the%20registration%20process.Thank%20you%2CIGRS.&peid=${peId}&deliveryreport=yes&templateid=${templateId}`
			}
			let response = await axios({
                url:url,
                method: 'GET'
            })
        const applicationId = type === "SLOT" ? data.applicationId : data;

        const logInsert = await this.orDao.oDbInsertDocsWithBindParams(
            `INSERT INTO  srouser.sms_logs (application_id, template_id, type, status, time_stamp)
             VALUES (:app_id, :template_id, :type, :status, SYSDATE)`,
            {
                app_id: applicationId || null,
                template_id: templateId,
                type: type ? type : "FinalSubmitPDE",
                status: 'accepted',
            }
        );

        console.log("logInsert", logInsert);
        return true;

    
        } catch (error) {
			Logger.error(error.message)
            console.error("SMS Details - sendSms_New || Error :", error.message);
            let pdeError = constructPDEError(error);
            throw pdeError;
        }
    };

	getPanchayatDetails = async(assessmentNo) => {
		try {
			let config = {
				method: 'get',
				maxBodyLength: Infinity,
				url: process.env.URBAN_PANCHAYATH_BASE_URL + '/ppn-data/'+assessmentNo,
				headers: { 
				  'Content-Type': 'application/json', 
				  'SVAMITVA-API-KEY': `${process.env.URBAN_PANCHAYATH_API_KEY}`
				}
			  };
			  const httpsAgent = new https.Agent({ rejectUnauthorized:false});			  config.httpsAgent = httpsAgent;
			  let data = await axios.request(config);
			  return data.data;
		} catch (ex){
			Logger.error(ex.message);
			console.error("VillageService - getPanchayatDetails || Error :", ex);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}
	};

	getDetailsByPanchayathCode=async(panchayathCode,villageCode)=>{
		
			try {
				const villageDbData = await this.masterDataVillageDao.getByFilters({gramaPanchayatCode: `${panchayathCode}`});
				let val;
				if(villageDbData == null || villageDbData.length == 0){
					return val=false
				}
				
				villageDbData.filter(v=>{
					if(v._doc.villageCode==villageCode){
						val=true
					}})
				return val;
			} catch (error) {
				console.error("VillageService - getMandals || Error :", error.message);
				let pdeError = constructPDEError(error);
				throw pdeError;
			}
		}
         
	getVillageSurveynos = async (villageCode, surveyNo) => {
		try {
			let districtId = villageCode?.length < 7  ? '0' + villageCode.substring(0, 1) : villageCode?.substring(0, 2);
			const url = process.env.WEB_LAND_WSDL;
			const soapBody = `<?xml version="1.0" encoding="utf-8"?>
			<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
							xmlns:xsd="http://www.w3.org/2001/XMLSchema"
							xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
				<soap:Body>
				<SurveyNoList xmlns="http://tempuri.org/">
					<Dcode>${districtId}</Dcode> 
					<Vcode>${villageCode}</Vcode> 
					<SurveyNo>${surveyNo}</SurveyNo>
					<uid>ws_land</uid>
					<pwd>en9rgy5tar</pwd>
				</SurveyNoList>
				</soap:Body>
			</soap:Envelope>`;
			const config = {
				method: "post",
				url: url,
				headers: {
					"Content-Type": "text/xml;charset=UTF-8",
					"SOAPAction": "http://tempuri.org/SurveyNoList",
				},
				data: soapBody,
			};
			let surveynoResults = await axios.request(config);
			parseString(surveynoResults.data, { explicitArray: false }, (err, result) => {
				if (err) {
					return reject(new PDEError({ name: NAMES.NOT_FOUND, err: "Village Pahani Details Not Found" }));
				}
				const surveyNos = result?.["soap:Envelope"]?.["soap:Body"]?.SurveyNoListResponse?.SurveyNoListResult?.SurveNos || [];
				 if (typeof surveyNos === "string" &&surveyNos.toLowerCase().includes("exception")) {
					 surveynoResults = []; 
                     return;
				}
                 if (typeof surveyNos?.SurveyNo === "string" &&surveyNos.SurveyNo.toLowerCase().includes("exception")) {
                 surveynoResults = []; // treat as no data
                  return;
                  }
				if (Array.isArray(surveyNos)) {
					surveynoResults = surveyNos.map(item => String(item?.SurveyNo).trim()).filter(Boolean);
				} 
				else{
					surveynoResults = [String(surveyNos.SurveyNo).trim()];
				}
			});
			return surveynoResults;
		} catch (error) {
			let pdeError = constructPDEError(error);
			throw pdeError;
		}
	};

	getReraProjectDetails = async (projectId,req) =>{
		let paramsToStoreThirdPartyData={};
		try {
			paramsToStoreThirdPartyData.request = {
				method: "GET",
				url: `${process.env.RERA_URL}?ProjectID=${projectId}`,
				headers: {
					'Content-Type': 'application/json',
					'Userid': process.env.RERA_USER_ID,
					'Password': process.env.RERA_PASSWORD
				},
				parameters: `ProjectID:${projectId}`
			};
			let response = await axios({
				method: 'GET',
				url: `${process.env.RERA_URL}?ProjectID=${projectId}`,
				headers: { 
				  'Content-Type': 'application/json', 
				  'Userid' :process.env.RERA_USER_ID,
				  'Password' :process.env.RERA_PASSWORD
				},
			});
			paramsToStoreThirdPartyData.response=response.data;
			paramsToStoreThirdPartyData.status='success';
			return response.data;
		} catch (ex){
			Logger.error(ex.message);
			paramsToStoreThirdPartyData.response=ex;
			paramsToStoreThirdPartyData.status='failed';
			console.error("VillageService - getReraProjectDetails || Error :", ex);
            let pdeError = constructPDEError(ex);
            throw pdeError;
		}finally{
			await this.thirdPartyAPIDao.create({
				request:paramsToStoreThirdPartyData.request,
				userID: req?.user?.userId,
				module:"PDE",
				source: thirdPartyDepartments.rera,
				response: paramsToStoreThirdPartyData.response,
				status:paramsToStoreThirdPartyData.status
			})
		}
	}

	getBuildingApprovalNoDetails = async (req) =>{
		let paramsToStoreThirdPartyData = {};
		try {
			const { FileNo } = req.query;
			paramsToStoreThirdPartyData.request = {
				method: "POST",
				url: process.env.APDPMS_TOKEN_URL,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				data: new URLSearchParams({
					client_id: process.env.APDPMS_CLIENT_ID,
					client_secret: process.env.APDPMS_CLIENT_SECRET,
					grant_type: "client_credentials"
				}),
				parameters: `FileNo:${FileNo}`
			};
			let tokenResponse = await axios({
				method: 'POST',
				url: process.env.APDPMS_TOKEN_URL,
				headers: {
    				"Content-Type": "application/x-www-form-urlencoded",
  				},
				data : new URLSearchParams({
					client_id: process.env.APDPMS_CLIENT_ID,
					client_secret: process.env.APDPMS_CLIENT_SECRET,
					grant_type: "client_credentials"
				})
			});
			const accessToken = tokenResponse.data?.access_token;

			if (!accessToken) {
				throw new Error("Access token not received from APDPMS");
			}
			const queryPayload = {
				variables: [
					{
						sql: "F3625529-1BAC-44B5-B026-33A61F88C001",
						params: {
							FileNo
						}
					}
				]
			};
			const queryResponse = await axios({
				method: "POST",
				url: process.env.APDPMS_QUERY_URL,
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${accessToken}`,
					"CivilAuthorization": `Bearer ${accessToken}`,
					"Accept": "application/json"
				},
				data: queryPayload
			});
			paramsToStoreThirdPartyData.response = queryResponse.data;
			paramsToStoreThirdPartyData.status = "success";
			return queryResponse.data;
		} catch (ex) {
			Logger.error(ex.message);
			console.error("getBuildingApprovalNoDetails || Error :", ex);
			paramsToStoreThirdPartyData.response = ex?.response?.data || ex.message || "Failed while fetching Building Approval No Details";
			paramsToStoreThirdPartyData.status = "failed";
			let pdeError = constructPDEError(ex);
			throw pdeError;
		} finally {
			await this.thirdPartyAPIDao.create({
				request: paramsToStoreThirdPartyData.request,
				userID: req?.user?.userId,
				module: "PDE",
				source: thirdPartyDepartments.buildingApprovalNo,
				status: paramsToStoreThirdPartyData.status,
				response: paramsToStoreThirdPartyData.response
			});
		}
	}

	getSezJuriSRO = async(req) =>{
		try {   
			let query = "";
			let value = {};
			if(req.hab != ""){
				query=`SELECT HAB_CODE AS "hab_code" FROM SROUSER.SEZ_JURI_SRO`;
			}else if (req.village != "" ) {
				query = `SELECT DISTINCT SRO_CODE AS "id", SRO AS "name" FROM SROUSER.SEZ_JURI_SRO WHERE VILLAGE_CODE = :village`;
				value = { 
					village: req.village 
				};
			} else if (req.district != ""  && req.mandal != "" ) {
				query = `SELECT DISTINCT VILLAGE_CODE AS "id", VILLAGE AS "name" FROM SROUSER.SEZ_JURI_SRO WHERE DIST_CODE = :district AND MANDAL_CODE = :mandal`;
				value = { 
					district: req.district, 
					mandal: req.mandal 
				};
			} else if (req.district != "" ) {
				query = `SELECT DISTINCT MANDAL_CODE AS "id", MANDAL AS "name" FROM SROUSER.SEZ_JURI_SRO WHERE DIST_CODE = :district`;
				value = { 
					district: req.district 
				};
			} else {
				query = `SELECT DISTINCT DIST_CODE AS "id", DISTRICT AS "name" FROM SROUSER.SEZ_JURI_SRO`;
			}
            const response = await this.orDao.oDBQueryServiceWithBindParams(query, value);
            return response;
        } catch (ex){
            console.error("partiesService - getSezJuriSRO || Error :", ex);
            throw ex;
        }
	}

	getProbhitedReport = async (reqData) => {
    try {
        let query;
        let baseQuery;
        const bindParams = {
            villCode: reqData.VILL_CODE
        };
        if (reqData.PROPERTY_TYPE === 'R' ) {
            baseQuery = `
                SELECT
                    NVL(TO_CHAR(a.survey_no), '-') AS survey_no,
                    a.SUB_SURVEY_NO,
                    a.EXTENT,
                    NVL(a.noti_gaz_no, '-') AS noti_gaz_no,
                    NVL(TO_CHAR(a.noti_gaz_dt, 'DD-MM-YYYY'), '-') AS noti_gaz_dt,
                    NVL(a.oth_ref, '-') AS oth_ref,
                    NVL(a.h_name, '-') AS h_name,
                    NVL(a.village_code, '-') AS village_code,
                    NVL((
                        SELECT i.village_name
                        FROM hab_code i
                        WHERE i.hab_code = TO_NUMBER(a.village_code || '01')
                        AND ROWNUM = 1
                    ), '-') AS village_name
                FROM prohb_ag a
                WHERE a.village_code = :villCode
            `;

            if (reqData.SURVEY_NO && reqData.SUB_SURVEY_NO) {
                bindParams.surveyNo = String(reqData.SURVEY_NO);
                bindParams.subSurveyNo = String(reqData.SUB_SURVEY_NO);

                query = `${baseQuery}
                    AND TO_CHAR(a.survey_no) = :surveyNo
                    AND a.SUB_SURVEY_NO = :subSurveyNo
                    ORDER BY a.survey_no`;

            } else if (reqData.SURVEY_NO) {
                bindParams.surveyNo = String(reqData.SURVEY_NO);

                query = `${baseQuery}
                    AND TO_CHAR(a.survey_no) = :surveyNo
                    ORDER BY a.survey_no`;

            } else {
                query = `${baseQuery} ORDER BY a.survey_no`;
            }

        } else if (reqData.PROPERTY_TYPE === 'U') {

            baseQuery = `
                SELECT
                    NVL(a.door_no,'-') AS door_no,
                    a.EXTENT,
                    NVL(a.noti_gaz_no, '-') AS noti_gaz_no,
                    NVL(TO_CHAR(a.noti_gaz_dt, 'DD-MM-YYYY'), '-') AS noti_gaz_dt,
                    NVL(a.oth_ref, '-') AS oth_ref,
                    NVL(a.h_name, '-') AS h_name,
                    NVL(a.village_code, '-') AS village_code,
                    NVL((
                        SELECT i.village_name
                        FROM hab_code i
                        WHERE i.hab_code = TO_NUMBER(a.village_code || '01')
                        AND ROWNUM = 1
                    ), '-') AS village_name
                FROM prohb_hu a
                WHERE a.village_code = :villCode
            `;

            if (reqData.DOOR_NO) {
                bindParams.doorNo = String(reqData.DOOR_NO);

                query = `${baseQuery}
                    AND a.DOOR_NO = :doorNo
                    ORDER BY a.door_no`;

            } else {
                query = `${baseQuery} ORDER BY a.door_no`;
            }

        } else {
            throw new Error("Invalid PROPERTY_TYPE. Must be 'R' or 'U'");
        }
        const response = await this.orDao.oDBQueryServiceWithBindParams(query, bindParams);
        return response;
    } catch (ex) {
        Logger.error("ApiForOtherServices - getProhibitedReport || Error :", ex);
        console.error("ApiForOtherServices - getProhibitedReport || Error :", ex);
        throw constructPDEError(ex);
    }
};

  getSRODetails = async (reqData) => {
        try {
            let query;
            query = `select b.* from hab_match a, card.srcode1 b where a.hab_code = :VILLAGE_CODE and a.sr_code = b.sr_code and rownum=1`
            const bindParams = {
            VILLAGE_CODE:reqData.VILL_CODE + "01"
            };
            let response = await this.orDao.oDBQueryServiceWithBindParams(query, bindParams);
            return response;
        } catch (ex) {
            Logger.error("ApiForOtherServices - getSRODetails || Error :", ex);
            console.error("ApiForOtherServices - getSRODetails || Error :", ex);
            throw constructPDEError(ex);
        }
    }

}

module.exports = VillageService;
