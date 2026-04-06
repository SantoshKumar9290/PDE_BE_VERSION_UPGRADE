const PDEError = require("../errors/customErrorClass");
const orDbDao = require('../dao/oracleDbDaos')
const { Logger } = require('../../services/winston');
const { Error } = require("../handlers/errorHandler");
const { constructPDEError } = require("../handlers/errorHandler");
const PaymentReceiptDetails = require("../model/paymentReceiptDetailsModel");
const axios = require("axios");
const fs = require("fs");
const path = require('path');
const { PDFDocument } = require('pdf-lib')
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { generatePDFFromHTML } = require("./generatePDFFromHTML");
const { encryptWithAESPassPhrase,AadhardecryptData } = require('../utils');
const MvaDao = require("../dao/masterDataVillageDao");
const { DecryptAdrwithPkcs, EncryptAdrwithPkcs,encryptData,decryptData  } = require('../utils/index');
const handlebars = require('handlebars');
const https = require('https');
const fileResolver = require("../utils/fileResolver");

const otpGenerator = require('otp-generator');
const idGenerate = require("../model/idGenerate");
const _ = require('lodash');

const convertBase64ToPdf = async (base64String) => {
  const decodedBuffer = Buffer.from(base64String, 'base64');
  const pdfDoc = await PDFDocument.load(decodedBuffer)
  return pdfDoc.save();
}
const savePdfToFile = async (pdfBytes, filePath) => {
  fs.writeFileSync(filePath, pdfBytes);
  console.log(`PDF saved to ${filePath}`);
  return true;
};

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});
class mvService {
  constructor() {
    this.orDao = new orDbDao();
    this.MvaDao = new MvaDao();
  }


extractTextWithPositionsFromPDF = async (pdfBuffer) => {
    const uint8Array = pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfDocument = await loadingTask.promise;

    let textWithPositions = [];

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const content = await page.getTextContent();
      content.items.forEach(item => {
        textWithPositions.push({
          text: item.str,
          position: {
            x: item.transform[4],
            y: item.transform[5]
          },
          page: i
        });
      });
    }

    return textWithPositions;
  }

  getHTML =async(reqData) =>{
      let bindparam = {};
      const currentYear = new Date().getFullYear();
      try{

const query = `SELECT A.*,(SELECT TRAN_DESC FROM tran_dir b WHERE b.TRAN_MAJ_CODE = A.TRAN_MAJ_CODE AND b.TRAN_MIN_CODE = A.TRAN_MIN_CODE AND ROWNUM = 1) AS TRAN_DESC
               FROM srouser.mva_rur A WHERE REQ_NO   = :reqNo AND SR_CODE  = :srCode AND mva_year = :mvaYear`;
      const bindParams = {
        reqNo:  reqData.REQ_NO,
        srCode: reqData.SR_CODE,
        mvaYear: currentYear
        };
        let response = await this.orDao.oDBQueryServiceWithBindParams(query, bindParams);
      let UNIT_TYPE;
      if (response[0].UNIT === 'F') {
        UNIT_TYPE = "Sq. Feet";
      }
      if (response[0].UNIT === 'Y') {
        UNIT_TYPE = "Sq. Yards";
      }
      if (response[0].UNIT === 'A') {
        UNIT_TYPE = "Acres";

      }

      let masterquery = `SELECT a.sr_cd, a.sr_name, c.DR_NAME FROM sr_master a
      JOIN CARD.MST_REVREGDIST c ON a.dr_cd = c.dr_code WHERE a.sr_cd = :SR_CODE`;
      bindparam={SR_CODE:reqData.SR_CODE}
      let mastreresponse = await this.orDao.oDBQueryServiceWithBindParams(masterquery, bindparam);

      let proptypequery = `select * from area_class where CLASS_CODE=:NATURE_USE and CLASS_TYPE=:PROPERTY_TYPE`;
      bindparam={
        NATURE_USE:response[0].NATURE_USE,
        PROPERTY_TYPE:response[0].PROPERTY_TYPE
      }
      let proptyperesult = await this.orDao.oDBQueryServiceWithBindParams(
        proptypequery,
        bindparam
      );      
      if (response.length > 0) {
        const querysro = `select aadhar_encrypt, empl_name as name,(select sr_name from sr_master where sr_cd = :SR_CODE ) sr_name from employee_login_master where sr_code=:SR_CODE  and designation='Sub-Registrar'`;
        bindparam={SR_CODE:reqData.SR_CODE}
        let response1 = await this.orDao.oDBQueryServiceWithBindParams(querysro, bindparam);
        const imagePath = path.join(__dirname, `../../logos/ap_logo.jpg`);
        let Imagedatapath = fs.readFileSync(imagePath, { encoding: 'base64' });
        const templatePath = path.join(__dirname, '../utils/reports/mvassistance/mvAssistance.hbs');
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        handlebars.registerHelper('gte', function (a, b) {
          return a >= b;
        });
        handlebars.registerHelper('default', function (value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return value;
});
        const template = handlebars.compile(templateSource);
        const html = template({
          Imagedatapath,
          response,
          mastreresponse,
          proptyperesult: proptyperesult,
          reqData,
          DATE: new Date(response[0].ENT_DATE).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          generatedOn: new Date().toLocaleString("en-GB", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: true
          }),
          esignStatus: false,
          UNIT_TYPE,
          STRUCTURE:reqData.STRUCTURE ? JSON.parse(reqData.STRUCTURE) : response[0]?.STRUCTURE ?JSON.parse(response[0]?.STRUCTURE.toString('utf8')):[]

        });

        return { html: html, response1: response1 }
      }
    } catch (ex) {
      Logger.error("MISServices - getHTML || Error :", ex);
      console.error("MISServices - getHTML || Error :", ex);
      throw constructPDEError(ex);
    }
  }


  mvAssitanceReport = async (reqData) => {
    try {

      let htmldata = await this.getHTML(reqData);
      const currentYear = new Date().getFullYear();

      // Build relative folder path
      let relativeDir = path.join(
        'uploads',
        String(currentYear),
        String(reqData.SR_CODE),
        '1',
        String(reqData.REQ_NO)
      );

      // Get absolute new server path
      let mvAssitDirectiory = await fileResolver.getNewServerPath(relativeDir);
      console.log(mvAssitDirectiory, "mvAssitanceReport || mvAssitDirectiory");

      // Ensure full directory exists
      await fileResolver.ensureDirectoryExists(mvAssitDirectiory);

      const filename = path.join(mvAssitDirectiory, 'mvAssistanceReport.pdf');

      const pdfBuffer = await generatePDFFromHTML(htmldata.html, filename, []);
      const base64Pdf = pdfBuffer.toString("base64");

      let response1 = htmldata.response1;

      for (let i = 0; response1.length > i; i++) {

        let insertquery = `insert into SROUSER.MV_ASSISTANCE_ESIGN_STATUS_CR (
        SR_CODE,BOOK_NO,REQ_NO,PAGE_NO,COORDINATES,
        TIME_STAMP,
        AADHAR_ENCRPT,
        DN_QUALIFIER,
        NAME, MVA_YEAR,
        ESIGN_STATUS) values(${reqData.SR_CODE},1,${reqData.REQ_NO},'','',sysdate,'${response1[i].AADHAR_ENCRYPT}','','${response1[i].NAME}',${currentYear},'P')`;

        await this.orDao.oDbInsertDocs(insertquery);
      }

      return base64Pdf;

    } catch (ex) {
      Logger.error("MISServices - mvAssitanceReport || Error :", ex);
      console.error("MISServices - mvAssitanceReport || Error :", ex);
      throw constructPDEError(ex);
    }
  };

  getmvasrlist = async (reqData) => {
    try {
      const querysro = ` SELECT *
        from SROUSER.MV_ASSISTANCE_ESIGN_STATUS_CR where sr_code=${reqData.SR_CODE}  and REQ_NO=${reqData.REQ_NO} `;
      let response = await this.orDao.oDBQueryService(querysro);
      if (response.length > 0) {
        response.forEach(item => {
          item.AADHAR = item.AADHAR_ENCRPT
        });
      }
      return response
    }
    catch (ex) {
      Logger.error("MvServices - getmvasrlist || Error:", ex);
      console.error("MvServices - getmvasrlist || Error:", ex);
      throw constructPDEError(ex);
    }


  }
  pdfpreviewSrvc = async (reqData) => {
    try {

      const relativePath = path.join(
        'uploads',
        String(reqData.REG_YEAR),
        String(reqData.SR_CODE),
        '1',
        String(reqData.REQ_NO),
        'mvAssistanceReport.pdf'
      );

      const pdfPath = await fileResolver.resolve(relativePath, true);

      const pdfBuffer = fs.readFileSync(pdfPath);
      const base64Pdf = pdfBuffer.toString('base64');

      return base64Pdf;

    } catch (ex) {

      if (ex.message?.includes('File not found')) {
        let errormes = [];
        errormes.message = 'File not found.';
        throw constructPDEError(errormes);
      }

      throw constructPDEError(ex);
    }
  };

  igrsEsignAxiosCall = async (eSignUrl, eSignData) => {
    try {
      let data = JSON.stringify({
        "esignRequest": eSignData
      });
      let eSignConfig = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${eSignUrl}/storeAndProcessEsignRequest`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: data
      };
      let fileResponse = await instance.request(eSignConfig);
      if (fileResponse == null || fileResponse.data == null) {
        throw Error('IGRS Esign api error');
      }
      return fileResponse.data;
    } catch (ex) {
      console.error("ESignServices - igrsEsignAxiosCall || Error :", ex.message);
      throw constructPDEError(ex);
    }
  }

  getmvacoordinatesdata = async (reqData) => {

    let srocode = reqData.SR_CODE;
    let reqno = reqData.REQ_NO;
    let name = reqData.NAME;

    let result;
    try {
     const query = `
      SELECT t1.*, t2.sr_name
      from SROUSER.MV_ASSISTANCE_ESIGN_STATUS_CR t1
      join sr_master t2 on t1.sr_code = t2.sr_cd
        WHERE sr_code = ${srocode}
          AND book_no = 1
          AND req_no = ${reqno}
          AND name = '${name}'
      `;

      result = await this.orDao.oDBQueryService(query);
     let base64Pdf;
      // if (result.length > 0) {
      //   result.forEach(item => {
      //     item.AADHAR = item.AADHAR.length > 12 ? decryptData(item.AADHAR) : item.AADHAR;
      //   });
      // }
      if (result.length > 0) {
      reqData.esignStatus=true
      let htmldata =await this.getHTML(reqData)
      const currentYear = new Date().getFullYear();
      let pdfBuffer =await generatePDFFromHTML(htmldata.html, true, []);      
        const base64Pdf = pdfBuffer.toString("base64");
        
        const textWithPositions = await this.extractTextWithPositionsFromPDF(pdfBuffer);        
        const searchText = "Authorized Signatory";
        const signaturePosition = textWithPositions.find((item) =>
          item.text.includes(searchText)
        );

        if (signaturePosition) {
          const roundedPosition = {
            x: Math.round(signaturePosition.position.x),
            y: Math.round(signaturePosition.position.y),
            pageNo: signaturePosition.page,
          };          
        let transactionID = new Date().getTime();
        let eSignData = {
          rrn: transactionID,
          coordinates_location: "Top_Right",
          coordinates: `${roundedPosition.pageNo}-50,${roundedPosition.y},50,${roundedPosition.x-450};`,
          doctype: "PDF",
          uid: AadhardecryptData(result[0].AADHAR_ENCRPT),
          signername: result[0].NAME?.substring(0, 50),
          signerlocation: `${result[0].SR_NAME}`,
          filepassword: "",
          signreason: "MVeSignPDE",
          authmode: reqData.AUTH_MODE,
          webhookurl: `${reqData.url}`,
          file: base64Pdf
        };
        let esignUrlData = await this.orDao.oDBQueryService(`Select * from SROUSER.esign_urls`);
        if (esignUrlData == null || esignUrlData.length == 0) {
          throw Error('Esign Urls Not Found');
        }
        if (eSignData) {
          eSignData = eSignData;
          let queryupdate = `update SROUSER.MV_ASSISTANCE_ESIGN_STATUS_CR set DN_QUALIFIER = '${eSignData.rrn}' where sr_code = ${srocode}  and req_no = ${reqno} and book_no = 1 and name = '${eSignData.signername}'`;
          const resultupdate = await this.orDao.oDbUpdate(queryupdate);
        }
        let encryptedData1 = encryptWithAESPassPhrase(JSON.stringify(eSignData), "igrsSecretPhrase");
        let esignUrl = parseInt(srocode) % 2 == 0 ? esignUrlData[0].NSDL_URL : esignUrlData[0].EMUDHRA;
        // let eSignReponse = await this.igrsEsignAxiosCall('http://117.250.201.41:9080/igrs-esign-service', encryptedData1);
        let eSignReponse = await this.igrsEsignAxiosCall(esignUrl, encryptedData1);
        return { result: eSignData, data: eSignReponse }
      } else {
        Logger.error("MISServices - getmvacoordinatesdata || Error:", ex);
        console.error("MISServices - getmvacoordinatesdata || Error:", ex);
        throw constructPDEError(ex);
            }
      }
    } catch (ex) {
      Logger.error("MISServices - getcoordinatesdata || Error:", ex);
      console.error("MISServices - getcoordinatesdata || Error:", ex);
      throw constructPDEError(ex);
    }
  }

  pendingEsignList = async (reqBody) => {
    try {

      const { SR_CODE, REQ_NO, REG_YEAR, esignstatus } = reqBody;
      let esign_status;

      if (esignstatus != 'null') {

        const base64String = Buffer.from(esignstatus).toString('base64');

        const eSignConfig = {
          method: "post",
          maxBodyLength: Infinity,
          url: `${process.env.IGRS_ESIGN_URL}/downloadSignedDocTransID?transactionId=${base64String}`,
          headers: {
            "Content-Type": "application/json",
          },
        }

        let fileResponse = await instance.request(eSignConfig);

        if (!fileResponse || !fileResponse.data || fileResponse.data.data == undefined) {

          console.log('Pending Esign was not completed');
          esign_status = 0;
          return esign_status;

        } else {

          const base64Pdf = fileResponse.data.data;
          const pdfBytes = await convertBase64ToPdf(base64Pdf);

          const relativePath = path.join(
            'uploads',
            String(REG_YEAR),
            String(SR_CODE),
            '1',
            String(REQ_NO),
            'mvAssistanceReport.pdf'
          );

          const pdfPath = await fileResolver.getNewServerPath(relativePath);

          console.log(pdfPath, "pendingEsignList || pdfPath");

          await fileResolver.ensureDirectoryExists(
            path.dirname(pdfPath)
          );

          await savePdfToFile(pdfBytes, pdfPath);

          const query5 = `update SROUSER.MV_ASSISTANCE_ESIGN_STATUS_CR 
          set esign_status = 'Y' 
          where sr_code = ${SR_CODE} 
          and book_no = 1 
          and REQ_NO=${REQ_NO}`;

          esign_status = await this.orDao.oDbUpdate(query5);

          console.log('PDF saved successfully');
          return esign_status;
        }
      }

    } catch (ex) {
      console.error("MISServices - pendingEsignList || Error :", ex);
      throw ex;
    }
  };

  mvamvCalculator = async (reqData, reqParams) => {
    let uniqueId = await idGenerate.findOne();
    let unValue;
    if (uniqueId == null) {
      let Obj = { sequenceValue: 1 };
      const idgenarator = new idGenerate(Obj).save();
      unValue = 1;
    } else {
      unValue = uniqueId.sequenceValue + 1;
      await idGenerate.findOneAndUpdate({ sequenceValue: uniqueId.sequenceValue }, { $set: { sequenceValue: unValue } });
    }
    if (reqData.vill_cd && String(reqData.vill_cd).length === 6) {
      reqData.vill_cd = '0' + reqData.vill_cd;
    };
    if (reqData.floor_no && reqData.floor_no.length === 1) {
      reqData.floor_no = '0' + reqData.floor_no;
    }
    try {
      let query, query2, details;
      if (reqParams.type === "urban") {
        let queryTable = reqData.strType === "Industrial" ? 'cca_calculate_mv_v2_inds' : 'cca_calculate_mv_v2';
        // query = `DECLARE extent_rt NUMBER(10); charge_rt VARCHAR2(1000);land_ct NUMBER(10); 
        // structure_ct NUMBER(10); market_vl NUMBER(10); v_array stru_array; v_stru_record stru_record :=stru_record('${reqData.floor_no}', '${reqData.stru_type}', ${reqData.plinth}, '${reqData.plinth_unit}', ${reqData.stage}, ${reqData.age}); 
        // BEGIN v_array := stru_array(); v_array.extend; v_array(1):=v_stru_record; sromstr. cca_calculate_mv_v2 (${reqData.sroCode}, '${reqData.vill_cd}','${reqData.locality}',
        // '${reqData.habitation}',${reqData.wno},${reqData.bno},'${reqData.house_no}','${reqData.nearby_boundaries}' ,'${reqData.surveyno}','${reqData.nature_use}',${reqData.land_extent},'${reqData.land_unit}',${reqData.total_floor} ,'${reqData.property_type}', '${reqData.property_nature}', ${reqData.localbody}, 
        // v_array, extent_rt, charge_rt, land_ct, structure_ct, market_vl );Insert into srouser.MV_DATA_CR (MV_ID,EXT_RT,CHRGE_RT,LAND_CST,STRU_CST,MKT_VAL) values (${unValue},extent_rt,charge_rt,land_ct,structure_ct,market_vl);commit;END;`;

        query = `DECLARE extent_rt NUMBER(10); charge_rt VARCHAR2(1000);land_ct NUMBER(10); 
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
        query2 = `select * from srouser.MV_DATA_CR where MV_ID=${unValue} and rownum=1`;

      } else if (reqParams.type === "rural") {
        query = `DECLARE extent_rt NUMBER(10); charge_rt VARCHAR2(1000); land_ct NUMBER(10); structure_ct NUMBER(10); market_vl NUMBER(10); v_array stru_array; v_stru_record stru_record :=stru_record('${reqData.floor_no}','${reqData.stru_type}', '${reqData.plinth}', '${reqData.plinth_unit}', '${reqData.stage}', '${reqData.age}'); BEGIN v_array := stru_array(); v_array.extend; v_array(1):=v_stru_record; sromstr. cca_calculate_mv_v2 (${reqData.sroCode}, '${reqData.vill_cd}','${reqData.habitation}','${reqData.habCode}',${reqData.wno},${reqData.bno},'${reqData.house_no}','${reqData.nearby_boundaries}' ,'${reqData.surveyno}','${reqData.nature_use}',${reqData.land_extent},'${reqData.land_unit}', ${reqData.total_floor} ,${reqData.property_type}, '${reqData.property_nature}', ${reqData.localbody}, v_array, extent_rt, charge_rt, land_ct, structure_ct, market_vl );Insert into srouser.MV_DATA_CR (MV_ID,EXT_RT,CHRGE_RT,LAND_CST,STRU_CST,MKT_VAL) values (${unValue},extent_rt,charge_rt,land_ct,structure_ct,market_vl);commit;END;`
        query2 = `select * from srouser.MV_DATA_CR where MV_ID=${unValue} and rownum=1`;
      }
      details = await this.MvaDao.getMvaMvvalue(query, query2);
      return details;
    } catch (ex) {
      Logger.error(ex.message);
      console.error("mvService - mvamvCalculator || Error :", ex.message);
      let pdeError = constructPDEError(ex);
      throw pdeError;
    }
  }

  verifyPaymentByAppNumber = async (reqdata) => {
    try {
      let paymentDetailsList = await PaymentReceiptDetails.find({
        applicationNumber: reqdata.applicationNumber,
        totalAmount: 50,
        transactionStatus: "Success"
      });

      // paymentDetailsList[0].departmentTransID = encryptData(paymentDetailsList[0].departmentTransID);
      // paymentDetailsList[0].cfmsTransID = encryptData(paymentDetailsList[0].cfmsTransID);
      // Logger.info(`mvService - verifypayment ===> ${JSON.stringify(paymentDetailsList)}`);

      if (!paymentDetailsList || paymentDetailsList.length === 0) {
        return { status: false, message: "Your payment is not yet completed. Please complete the payment process." };
      }
      paymentDetailsList = paymentDetailsList.map(payment => payment.toObject());
      let srCode = reqdata.srCode;
      let matchedPayment = paymentDetailsList.find(payment => String(payment.paidTo).trim() === String(srCode).trim());

      if (!matchedPayment) {
        return { status: false, message: "Your payment is not yet completed. Please complete the payment process." };
      }
  
      return {
        reqno: matchedPayment.applicationNumber,
        cfmsTransID: matchedPayment.cfmsTransID,
        deptTransID: matchedPayment.departmentTransID,
        paymentMode: matchedPayment.paymentMode,
        amount: matchedPayment.totalAmount
      };
    } catch (ex) {
      console.error("verifyPaymentByAppNumber || Error:", ex);
      throw ex;
    }
  }

  createMVRequest = async (reqData) => {
    try {
       let countQuery = `SELECT COUNT(*) AS COUNT FROM SROUSER.PUBLIC_MV_STATUS WHERE GENERATED_BY = :generatedBy AND TRUNC(GENERATED_ON) = TRUNC(SYSDATE)`;

      let countParams = { generatedBy: reqData.GENERATED_BY };

      let countResult = await this.orDao.fetchDataByQuery(countQuery, countParams);

      if (countResult?.[0]?.count >= 5 || countResult?.[0]?.COUNT >= 5) {
        throw new PDEError({
          err: "Daily request limit of 5 reached. Please try again tomorrow."
        });
      }
      let query = `INSERT INTO SROUSER.PUBLIC_MV_STATUS ( REQ_NO, STATUS, SR_CODE, REG_YEAR,GENERATED_BY,GENERATED_ON)
          VALUES ( ${reqData.REQ_NO},'P','${reqData.SR_CODE}',${reqData.REG_YEAR},'${reqData.GENERATED_BY}',SYSDATE)
          `;
      let result = await this.orDao.oDbInsertDocs(query);
      if (result <= 0) {
        throw new Error('Bad Request')
      }
      return result
    } catch (ex) {
      console.log("mvaServices - createMVRequest || Error : ", ex.message);
      throw new PDEError({ err: ex.message });
    }
  }

  UpdatePaymentMVRequest = async (reqData) => {
    try {
      let query = `
      UPDATE SROUSER.PUBLIC_MV_STATUS
      SET DEPT_TRANS_ID = :DEPT_TRANS_ID,
      PAID_AMOUNT = :PAID_AMOUNT,
      PAID_ON = SYSDATE
      WHERE REQ_NO = :REQ_NO
      AND REG_YEAR = :REG_YEAR
      AND SR_CODE = :SR_CODE
      `;
      let bindParams = {
        DEPT_TRANS_ID: reqData.DEPT_TRANS_ID,
        PAID_AMOUNT: reqData.PAID_AMOUNT,
        REQ_NO: reqData.REQ_NO,
        REG_YEAR: reqData.REG_YEAR,
        SR_CODE: reqData.SR_CODE
      };
      let result = await this.orDao.oDbUpdateWithBindParams(query, bindParams);
      if (result <= 0) {
        throw new Error('Bad Request')
      }
      return result
    } catch (ex) {
      console.log("mvaServices - createMVRequest || Error : ", ex.message);
      throw new PDEError({ err: ex.message });
    }
  }

  getMVRequestsData = async (reqData) => {
    try {
      let query = `select a.*,b.* from srouser.public_mv_status a, srouser.mva_rur b where a.sr_code = b.sr_code and 
          a.req_no = b.req_no and a.reg_year = b.mva_year and a.generated_by = '${reqData.generated_by}' ORDER BY a.req_no ASC`;
      let result = await this.orDao.oDBQueryService(query);
      if (result <= 0) {
        throw new Error('Bad Request')
      }
      return result
    } catch (ex) {
      console.log("mvaServices - createMVRequest || Error : ", ex.message);
      throw new PDEError({ err: ex.message });
    }
  }


  getMVRequestsDataofSRO = async (reqData) => {
    try {
      let query;
      if (reqData.param === 'S') {

        query = `select a.* from srouser.mva_rur a where a.sr_code=:SR_CODE AND A.MVA_YEAR >= 2025
                 and not exists (select 1 from srouser.public_mv_status b where b.sr_code=:SR_CODE and b.REQ_NO = a.REQ_NO AND A.MVA_YEAR= B.REG_YEAR)
                 and not exists (select 1 from SROUSER.MV_ASSISTANCE_ESIGN_STATUS_CR b WHERE b.esign_status = 'Y' and b.sr_code=:SR_CODE and a.mva_year=b.mva_year and b.REQ_NO = a.REQ_NO)
                 ORDER BY MVA_YEAR DESC,req_no DESC`;
                 }
                 else {
                  query = `select a.*,b.* from srouser.public_mv_status a, srouser.mva_rur b
                  where a.sr_code = b.sr_code and a.req_no = b.req_no and a.reg_year = b.mva_year
                  and a.paid_amount is not null and a.status ='P' and a.sr_code =:SR_CODE 
                  ORDER BY b.MVA_YEAR DESC,b.req_no DESC `;
                  }
      let bindparam = {
        SR_CODE:reqData.sr_code
      }
      let result = await this.orDao.oDBQueryServiceWithBindParams(query, bindparam);
      if (reqData.param === 'S' && result.length > 0) {
        result.forEach(item => {
          item.AADHAR = item.AADHAR && item.AADHAR.length > 12 ? DecryptAdrwithPkcs(item.AADHAR) : item.AADHAR;
        });
      }
      return result
    }
    catch (ex) {
      Logger.error("MvServices - getMVRequestsDataofSRO || Error:", ex);
      console.error("MvServices - getMVRequestsDataofSRO || Error:", ex);
      throw constructPDEError(ex);
    }
  }

  getcompletedMVRequestsDataofSRO = async (reqData) => {
    try {
      let query;
      if (reqData.param === 'S') {
        query = `SELECT DISTINCT e.SR_CODE,e.BOOK_NO, e.REQ_NO, e.MVA_YEAR
                 FROM SROUSER.MV_ASSISTANCE_ESIGN_STATUS_CR e WHERE e.SR_CODE = ${reqData.sr_code}
                 AND e.DN_QUALIFIER IS NOT NULL AND e.ESIGN_STATUS = 'Y' AND EXISTS (
                 SELECT 1 FROM SROUSER.MVA_RUR r WHERE r.SR_CODE = e.SR_CODE AND r.REQ_NO = e.REQ_NO AND r.MVA_YEAR = e.MVA_YEAR )
                 AND NOT EXISTS (SELECT 1 FROM SROUSER.PUBLIC_MV_STATUS p WHERE p.SR_CODE = e.SR_CODE AND p.REQ_NO = e.REQ_NO AND p.REG_YEAR = e.MVA_YEAR )
                 ORDER BY e.MVA_YEAR DESC, e.REQ_NO DESC`;
      }
      else {
        query = `select a.*,b.* from srouser.public_mv_status a, srouser.mva_rur b
          where a.sr_code = b.sr_code and a.req_no = b.req_no and a.reg_year = b.mva_year 
          and a.paid_amount is not null and a.status ='E' and a.sr_code =${reqData.sr_code} ORDER BY b.MVA_YEAR DESC,b.req_no DESC`;
      }
      let result = await this.orDao.oDBQueryService(query);
      return result
    }
    catch (ex) {
      Logger.error("MvServices - getMVRequestsDataofSRO || Error:", ex);
      console.error("MvServices - getMVRequestsDataofSRO || Error:", ex);
      throw constructPDEError(ex);
    }
  }



  updateMVRequest = async (reqData) => {
    try {
      let query = `UPDATE srouser.public_mv_status 
                         SET status = 'E', 
                             esign_on = SYSDATE,
                             esign_trans_id = :esign_trans_id,
                             esign_by = :esign_by
                         WHERE (req_no, sr_code) IN (
                             SELECT req_no, sr_code
                             FROM SROUSER.MV_ASSISTANCE_ESIGN_STATUS_CR
                             WHERE ESIGN_STATUS = 'Y'
                         ) and req_no = :req_no and sr_code = :sr_code`;
      let bindParams = {
        esign_trans_id: reqData.esign_trans_id,
        esign_by: reqData.esign_by,
        req_no: reqData.req_no,
        sr_code: reqData.sr_code
      };
      let result = await this.orDao.oDbUpdateWithBindParams(query, bindParams);
      if (result <= 0) {
        throw new Error('Bad Request');
      }
      return result;
    } catch (ex) {
      console.error("updateMVRequest || Error:", ex.message);
      throw new PDEError({ err: ex.message });
    }
  };

  getCRDAdetails = async (reqData) => {
    try {
      let bindparam;
      let query = `SELECT DISTINCT ts.SR_CODE, (select sr_name from sr_master where sr_cd=ts.sr_code) as SR_NAME,
      ts.BOOK_NO, ts.DOCT_NO,ts.REG_YEAR, TO_CHAR(tm.R_DATE, 'YYYY-MM-DD') as R_DATE,te.CODE as EC_TYPE,te.name,r_code as RELATION,te.r_name,te.age,te.RDOCT_NO,ts.SCHEDULE_NO,ts.VILLAGE_CODE,  (select  VILLAGE_NAME from CARD.CRDA_VILLAGE where village_code=ts.VILLAGE_CODE) as VILLAGE_NAME,
      (SELECT mandal_name FROM card.mst_revmandal WHERE mandal_code = SUBSTR(ts.VILLAGE_CODE, 3, 2)  and district_code = SUBSTR(ts.VILLAGE_CODE, 1, 2) ) AS MANDAL,
      ts.SURVEY_NO,ts.EXTENT, ts.UNIT,
      (select tran_desc from tran_dir where TRAN_MAJ_CODE =tm.TRAN_MAJ_CODE and TRAN_MIN_CODE=tm.TRAN_MIN_CODE ) as TRANSATION,
      (select CLASS_DESC from card.area_class where CLASS_CODE=ts.NATURE_USE) as Property_Type,
      ts.PLOT_NO as PLOTCODE, 1 as statuscode,'success' as statusmessage
      FROM TRAN_SCHED ts
  JOIN
      TRAN_EC te ON ts.SR_CODE = te.SR_CODE AND ts.BOOK_NO = te.BOOK_NO AND ts.DOCT_NO = te.DOCT_NO AND ts.REG_YEAR = te.REG_YEAR
  JOIN
      TRAN_MAJOR tm ON ts.SR_CODE = tm.SR_CODE AND ts.BOOK_NO = tm.BOOK_NO AND ts.DOCT_NO = tm.DOCT_NO AND ts.REG_YEAR = tm.REG_YEAR
  WHERE TRUNC(tm.R_DATE) BETWEEN to_date(:FROM_DATE,'dd-mm-yy') AND to_date(:TO_DATE,'dd-mm-yy') and ts.VILLAGE_CODE in(select  VILLAGE_CODE from CARD.CRDA_VILLAGE where village_code=ts.VILLAGE_CODE)
      order by ts.sr_code, ts.doct_no`;
      bindparam={
      FROM_DATE:reqData.FROM_DATE,
      TO_DATE:reqData.TO_DATE
    }
      let result = await this.orDao.oDBQueryServiceWithBindParams(query, bindparam);
      return result
    }
    catch (ex) {
      Logger.error("MvServices - getCRDAdetails || Error:", ex);
      console.error("MvServices - getCRDAdetails || Error:", ex);
      throw constructPDEError(ex);
    }
  }

};


module.exports = mvService;
