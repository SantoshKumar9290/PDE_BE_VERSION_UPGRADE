const PDEError = require("../errors/customErrorClass");
const orDbDao = require('../dao/oracleDbDaos')
const { Logger } = require('../../services/winston');
const path = require('path');
const fsone = require('fs');
const PaymentReceiptDetails = require("../model/paymentReceiptDetailsModel");
const { generatePDFFromHTML } = require("./generatePDFFromHTML");
const { encryptData } = require("../utils");

class Masters {
  constructor() {
    this.orDao = new orDbDao();
  }
  getSroDetailsSrvc = async () => {
    try {
      let bindparam = {};
      const query = `SELECT SR_CD, SR_NAME FROM CARD.sr_master WHERE STATE_CD = '01' ORDER BY SR_NAME`;
      let response = await this.orDao.oDBQueryService(query, bindparam)
      return response;
    }
    catch (ex) {
      Logger.error("mastersServices - getSroDetails || Error :", ex);
      console.error("mastersServices - getSroDetails || Error :", ex);
      throw new PDEError(ex);
    }
  };

  generateDocumentId = (sroCode) => {
    let yr = new Date().getFullYear();
    yr = String(yr).substring(2, 4)
    if (String(sroCode).length === 3) {
      let srCode = "0" + String(sroCode);
      return yr + "" + srCode + "" + Math.round(+new Date() / 1000)
    } else {
      return yr + "" + sroCode + "" + Math.round(+new Date() / 1000)
    }
    // return "AP20221668621420609";
  }

  stamptypelistsrvc = async (data) => {
    let sr_code;
    if (data.SR_CODE.toString().length <= 3) {
      sr_code = 0 + data.SR_CODE;
    }
    else{
      sr_code=data.SR_CODE;
    }
    try {
      let bindparam = { category: data.category };
      // const query = `select distinct name from stamp_name where category='${category}'`;
      const query = ` select distinct   b.code, b.name from cca_stock_reg  a
    join stamp_name b on a.STAMP_CODE= b.code
    where sr_code ='${sr_code}' and b.Category ='${data.category}' and a.balance>0`;
      let response = await this.orDao.oDBQueryService(query, bindparam)
      return response;
    }
    catch (ex) {
      Logger.error("mastersServices - stamptypelistsrvc || Error :", ex);
      console.error("mastersServices - stamptypelistsrvc || Error :", ex);
      throw new PDEError(ex);
    }
  }
  denominationslistsrvc = async (data) => {

    let sr_code;
    if (data.SR_CODE.toString().length <= 3) {
      sr_code = 0 + data.SR_CODE;
    }
    else{
      sr_code=data.SR_CODE;
    }    
    try {
      let bindparam = { stamp_type: data.stamp_type };
      // const query = `select DENOMINATION from stamp_name where NAME='${stamp_type}' order by DENOMINATION asc`;
      const query = `select distinct a.*, b.name, b.category  from cca_stock_reg  a
    join stamp_name b on a.STAMP_CODE= b.code
    where sr_code ='${sr_code}' and stamp_code=${data.stamp_type} and balance > 0 order by a.denomination asc`;
      let response = await this.orDao.oDBQueryService(query, bindparam)
      return response;
    }
    catch (ex) {
      Logger.error("mastersServices - denominationslistsrvc || Error :", ex);
      console.error("mastersServices - denominationslistsrvc || Error :", ex);
      throw new PDEError(ex);
    }
  }
  getstampavailablelistsrvc = async (sr_code) => {
    if (sr_code.toString().length <= 3) {
      sr_code = 0 + sr_code;
    }

    try {
      let bindparam = { sr_code: sr_code };
      const query = `select distinct a.*, b.name from cca_stock_reg  a
    join stamp_name b on a.STAMP_CODE= b.code
    where sr_code ='${sr_code}' and  a.balance>0 order by b.name , a.denomination asc `;
      let response = await this.orDao.oDBQueryService(query, bindparam)
      return response;
    }
    catch (ex) {
      Logger.error("mastersServices - getstampavailablelistsrvc || Error :", ex);
      console.error("mastersServices - getstampavailablelistsrvc || Error :", ex);
      throw new PDEError(ex);
    }
  }

  createStampIndent = async (reqData) => {
    try {
      // let query = `INSERT INTO srouser.stamp_indent (SR_CODE,STAMP_CATEGORY,STAMP_TYPE,STAMP_CODE,DENOMINATION,NO_STAMPS,AMOUNT,PURCHASER_NAME,PUR_RELATION,PUR_ADDRESS,RM_NAME,RM_RELATION,RM_ADDRESS,REQUEST_ID,PAYMENT_STATUS,TIME_STAMP)
      //           VALUES (, '${reqData.STAMP_CATEGORY}',(select distinct name from stamp_name where category='${reqData.STAMP_CATEGORY}' and code='${reqData.STAMP_TYPE}')  ,'${reqData.STAMP_TYPE}', ${reqData.DENOMINATION}, ${reqData.NO_STAMPS},${reqData.AMOUNT},'${reqData.PURCHASER_NAME}','${reqData.PUR_RELATION}',
      //           '${reqData.PUR_ADDRESS}','${reqData.RM_NAME}','${reqData.RM_RELATION}', '${reqData.RM_ADDRESS}','${reqData.REQUEST_ID}','${reqData.PAYMENT_STATUS}',SYSDATE)`;

    let  bindparam={ sr_code : reqData.SR_CODE,
    category:reqData.STAMP_CATEGORY,
    denomination :reqData.DENOMINATION,
    stampno : reqData.NO_STAMPS,
    stampcode :reqData.STAMP_TYPE,
    AMOUNT :reqData.AMOUNT, 
    PURCHASER_NAME : reqData.PURCHASER_NAME, 
    PUR_RELATION :reqData.PUR_RELATION, 
    PUR_ADDRESS :reqData.PUR_ADDRESS, 
    RM_NAME : reqData.RM_NAME, 
    RM_RELATION :reqData.RM_RELATION, 
    RM_ADDRESS :reqData.RM_ADDRESS, 
    REQUEST_ID :reqData.REQUEST_ID, 
    PAYMENT_STATUS :'Y', 
  AADHAR_ENCRPT:reqData.AADHAAR,
LoginId:reqData.LoginID}
let query =`MERGE INTO srouser.stamp_indent target
USING (SELECT :sr_code AS SR_CODE,
              :category AS CATEGORY,
              :denomination AS DENOMINATION,
              :stampno AS STAMPNO,
              :stampcode as STAMPCODE,
              :AMOUNT as amount, 
              :PURCHASER_NAME as PURCHASER_NAME , 
              :PUR_RELATION as PUR_RELATION, 
              :PUR_ADDRESS as PUR_ADDRESS, 
              :RM_NAME as RM_NAME, 
              :RM_RELATION as RM_RELATION, 
              :RM_ADDRESS as RM_ADDRESS, 
              :REQUEST_ID REQUEST_ID, 
              :PAYMENT_STATUS as PAYMENT_STATUS,
              :AADHAR_ENCRPT as AADHAR_ENCRPT,
              :LoginId as LoginId
         FROM dual) reqdata
ON (target.SR_CODE = reqdata.SR_CODE
    AND target.STAMP_CATEGORY = reqdata.CATEGORY
    AND target.STAMP_TYPE = (select distinct name from stamp_name where category='${reqData.STAMP_CATEGORY}' and code='${reqData.STAMP_TYPE}')
    AND target.DENOMINATION = reqdata.DENOMINATION
    AND target.REQUEST_ID = reqdata.REQUEST_ID
    )
WHEN MATCHED THEN
    UPDATE SET target.AMOUNT =reqdata.AMOUNT+target.AMOUNT, target.NO_STAMPS= target.NO_STAMPS+reqdata.STAMPNO
WHEN NOT MATCHED THEN
    INSERT (SR_CODE, STAMP_CATEGORY, STAMP_TYPE, DENOMINATION, NO_STAMPS, AMOUNT, PURCHASER_NAME, PUR_RELATION, PUR_ADDRESS, RM_NAME, RM_RELATION, RM_ADDRESS, TIME_STAMP, REQUEST_ID, PAYMENT_STATUS, STAMP_CODE, AADHAR_ENCRPT, LOGIN_ID)
    VALUES (reqdata.SR_CODE, reqdata.CATEGORY, (select distinct name from stamp_name where category='${reqData.STAMP_CATEGORY}' and code='${reqData.STAMP_TYPE}') , reqdata.DENOMINATION,reqdata.STAMPNO,reqdata.AMOUNT,reqdata.PURCHASER_NAME,reqdata.PUR_RELATION,reqdata.PUR_ADDRESS , reqdata.RM_NAME, reqdata.RM_RELATION, reqdata.RM_ADDRESS, SYSDATE, reqdata.REQUEST_ID,'N',STAMPCODE, reqdata.AADHAR_ENCRPT, reqdata.LoginId )`

      let result = await this.orDao.oDbUpdateWithBindParams(query, bindparam);
      return result
    } catch (ex) {
      Logger.error("mastersServices - createStampIndent || Error :", ex);
      console.log("mastersServices - createStampIndent || Error : ", ex.message);
      throw new PDEError({ err: ex.message });
    }
  }
  createStampIndentReport = async (reqData) => {
    try {
      const query = `SELECT * FROM srouser.stamp_indent WHERE sr_code=${reqData.SR_CODE} AND request_id='${reqData.REQUEST_ID}'`;
      const result = await this.orDao.oDBQueryService(query);
        const srquery=`select SR_NAME from sr_master where sr_cd=${reqData.SR_CODE}`
        const result1 = await this.orDao.oDBQueryService(srquery);

      if (result.length === 0) {
        throw new Error('No data found');
      }
      const payquery=`select challanno from scanuser.echallan_trans where depttransid='${reqData.REQUEST_ID}'`
      const result2 = await this.orDao.oDBQueryService(payquery);
      const imagePath = path.join(__dirname, `../../logos/ap_logo.jpg`);
      let Imagedatapath = fsone.readFileSync(imagePath, { encoding: 'base64' });

      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Registration Document</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 20px; }
          .header, .content { border: 1px solid black; margin-bottom: 10px; }
          .header table { width: 100%; border-collapse: collapse; }
          .header td { border: 1px solid black; padding: 5px; }
          .section-title { background-color: lightblue; padding: 5px; font-weight: bold; text-align: center; border-bottom: 1px solid black; }
          .section { padding: 10px; border-bottom: 1px solid black; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid black; padding: 5px; text-align: left; }
          .center { text-align: center; }
          .blue-background { background-color: blue; }
        </style>
      </head>
      <body>
        <div style="text-align: center;">
          <div style="display: inline-block;">
            <img src="data:image/jpeg;base64,${Imagedatapath}" alt="Header image" style="max-width:90px; height:90px; display: inline-block; vertical-align: middle;"/>
          </div>
          <div style="display: inline-block; text-align: left; vertical-align: middle;">
            <h3 style="margin-top: 15px; margin-bottom: 0; font-size:15px">REGISTRATIONS & STAMPS DEPARTMENT</h3>
            <h5 style="margin-top: 10px; margin-left: 37px">GOVERNMENT OF ANDHRA PRADESH</h5>
          </div>
        </div>
        <table>
          <tr rowspan="2">
            <th style="text-align: center; vertical-align: middle;" colspan="5">Indent Form for Stamps</th>
          </tr>

          <tr>
            <td colspan="1">SRO: ${result1[0].SR_NAME}-${result[0]?.SR_CODE}</td>
            <td colspan="2">Request ID: ${result[0]?.REQUEST_ID}</td>
            <td>Challan No.:${result2[0]?.CHALLANNO?result2[0]?.CHALLANNO:''}</td>
            <td colspan="1">Date: ${new Date(result[0]?.TIME_STAMP).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
          </tr>
          <tr style ="background-color: blue;">
            <th colspan="2">Name of the Purchaser</th>
            <th>Relation (S/o, D/o, W/o)</th>
            <th colspan="2">Purchaser Address</th>
          </tr>
          <tr>
            <td colspan="2">${result[0]?.PURCHASER_NAME}</td>
            <td>${result[0]?.PUR_RELATION}</td>
            <td colspan="2">${result[0]?.PUR_ADDRESS}</td>
          </tr>
          <tr>
            <th colspan="2">Stamps for Whom</th>
            <th>Relation (S/o, D/o, W/o)</th>
            <th colspan="2">Address</th>
          </tr>
          <tr>
            <td colspan="2">${result[0]?.RM_NAME}</td>
            <td>${result[0]?.RM_RELATION}</td>
            <td colspan="2">${result[0]?.RM_ADDRESS}</td>
          </tr>
          <tr>
            <th>Category of Stamps</th>
            <th>Stamp Type</th>
            <th>Denomination</th>
            <th>No of Stamps</th>
            <th>Total Amount</th>
          </tr>
        ${result.map((item, index) =>
      (
          `<tr key={index}>
            <td>${item?.STAMP_CATEGORY}</td>
            <td>${item?.STAMP_TYPE}</td>
            <td>${item?.DENOMINATION}</td>
            <td>${item?.NO_STAMPS}</td>
            <td>${item?.AMOUNT}</td>
          </tr>`
      ))}
      <tr>
      <td colspan="5" style="text-align: end;"> Grand Total : ${result.reduce((total, item) => total + parseFloat(item.AMOUNT), 0)}</td>

      </tr>
          <tr>
            <td colspan="5" style="text-align: end;">
              <span style ="font-weight:bold;">Payment Status: </span> ${result[0]?.PAYMENT_STATUS === 'Y' ? "Paid" : "To be Paid"}
            </td>
          </tr>
        </table >
      </body >
      </html > `;

    // let pdfBuffer = await generatePDFFromHTML(html, '');
    // const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
    // // const base64Pdf = pdfBuffer.toString('base64');
    // return base64Pdf;
    let pdfBuffer = await generatePDFFromHTML(html, '');
    // const base64Pdf = pdfBuffer.toString('base64');
    const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
    return base64Pdf;
  } catch (ex) {
    Logger.error("mastersServices - createStampIndentReport || Error :", ex);
    throw new PDEError({ err: ex.message });
  }
};

freezstampsrvc = async (reqbody) => {
    try {
      Logger.info(`mastersServices - freezstampsrvc ===> ${JSON.stringify(reqbody)}`);
      let stampdetquery = `select * from srouser.stamp_indent where request_id='${reqbody.reqid}'`;
      let reqData = await this.orDao.oDBQueryService(stampdetquery);
      
      for (let i = 0; i < reqData.length; i++) {
        let item = reqData[i];
      
        let query = `MERGE INTO srouser.cca_stock_reg_paid_block target
        USING (SELECT :sr_code AS SR_CODE,
                      :category AS CATEGORY,
                      :denomination AS DENOMINATION,
                      :stampno AS STAMPNO,
                      :stampcode as STAMPCODE,
                      :type as STAMPTYPE
                 FROM dual) reqdata
        ON (target.SR_CODE = reqdata.SR_CODE
            AND target.CATEGORY = reqdata.CATEGORY
            AND target.DENOMINATION = reqdata.DENOMINATION)
        WHEN MATCHED THEN
            UPDATE SET target.BALANCE = :stampno + target.BALANCE
        WHEN NOT MATCHED THEN
            INSERT (SR_CODE, CATEGORY, TYPE, DENOMINATION, BALANCE, AS_ON, STAMP_CODE)
            VALUES (reqdata.SR_CODE, reqdata.CATEGORY,
(  SELECT DISTINCT 
         CASE 
                WHEN type = 'IMPRESSIVE' THEN '2' 
                ELSE '1' 
            END 
        FROM stamp_name
        WHERE name = :type
          AND code = :stampcode
    ), reqdata.DENOMINATION, reqdata.STAMPNO, SYSDATE, reqdata.STAMPCODE)`;
      
        let bindParams = {
          denomination: item.DENOMINATION,
          type: `${item.STAMP_TYPE}`,
          category: item.STAMP_CATEGORY === 'NON_JUDICIAL STAMPS' ? '2' : '1',
          sr_code: item.SR_CODE.toString().length > 3 ? `${item.SR_CODE}` : '0'+item.SR_CODE,
          stampno: item.NO_STAMPS,
          stampcode: item.STAMP_CODE
        };
        let result = await this.orDao.oDbUpdateWithBindParams(query, bindParams);
        if (result <= 0) {
          throw new Error('Bad Request');
        } else {
           
        let bindParams1 = {
          denomination: item.DENOMINATION,
          type: item.STAMP_TYPE,
          category: item.STAMP_CATEGORY === 'NON_JUDICIAL STAMPS' ? '2' : '1',
          sr_code: item.SR_CODE.toString().length > 3 ? `${item.SR_CODE}` : '0'+item.SR_CODE,
          stampno: item.NO_STAMPS,
          stampcode: item.STAMP_CODE
        };
          let query1 = ` UPDATE srouser.cca_stock_reg
  SET BALANCE = BALANCE - :stampno
  WHERE SR_CODE = :sr_code 
    AND CATEGORY = :category 
    AND TYPE = (  SELECT DISTINCT 
         CASE 
                WHEN type = 'IMPRESSIVE' THEN '2' 
                ELSE '1' 
            END 
        FROM stamp_name
        WHERE name = :type
          AND code = :stampcode
    )
    AND DENOMINATION = :denomination 
    AND STAMP_CODE = :stampcode`;
      
          let result1 = await this.orDao.oDbUpdateWithBindParams(query1, bindParams1);
          if (result1 <= 0) {
            throw new Error('Bad Request');
          }
        }
      }
      
      return { status: true, message: 'Success' };
      
    } catch (ex) {
      console.error("updateMVRequest || Error:", ex.message);
      throw new PDEError({ err: ex.message });
    }
  };
  Stamppaymentupdatesrvc = async (reqData) => {
    try {
      Logger.info(`mastersServices - getstampindentdetailssrvc ===> ${JSON.stringify(reqData)}`);
      let query = `update srouser.stamp_indent set PAYMENT_STATUS = 'Y'  WHERE request_id =: req_id`;
      let bindParams = {
req_id:reqData.reqid
      };
      let result = await this.orDao.oDbUpdateWithBindParams(query, bindParams);
      if (result <= 0) {
        throw new Error('Bad Request');
      }
      return result;
    } catch (ex) {
      console.error("updateMVRequest || Error:", ex.message);
      Logger.error("Stamppaymentupdatesrvc || Error:", ex.message)
      throw new PDEError({ err: ex.message });
    }
  };
  verifyStampPaymentsrvc = async (reqdata, res) => {
    try {
     Logger.info(`mastersServices - verifyStampPaymentsrvc ===> ${JSON.stringify(reqdata)}`);
      let paymentDetailsList = await PaymentReceiptDetails.find({
        applicationNumber: reqdata.applicationNumber,
        transactionStatus: "Success"
      });
      if (!paymentDetailsList || paymentDetailsList.length === 0) {
        return {
          status: false,
          message: "Your payment is not yet completed. Please complete the payment process."
        };
      }
      let paymentDetails = paymentDetailsList[0];
      let Obj = {
        status: true,
        reqno: paymentDetails.applicationNumber,
        cfmsTransID: paymentDetails.cfmsTransID,
        deptTransID: paymentDetails.departmentTransID,
        paymentMode: paymentDetails.paymentMode,
        amount: paymentDetails.totalAmount
      };

      return Obj;
    } catch (ex) {
      console.error("masterServices - verifyStampPaymentsrvc || Error :", ex);
      Logger.error ("masterServices - verifyStampPaymentsrvc ===> || Error :", ex);
      throw ex;
    }
  }

  getstampindentdetailssrvc = async (reqData) => {
    try {
      console.log(reqData,':::::::reqData');
      let bindparam = {};
      const query = `select * from srouser.stamp_indent WHERE sr_code = '${reqData.SR_CODE}' AND request_id = '${reqData.REQUEST_ID}' and AADHAR_ENCRPT='${reqData.AADHAAR}'`;
      let bindParams = {
sr_code:parseInt(reqData.SR_CODE),
req_id:reqData.REQUEST_ID
      };
    const response = await this.orDao.oDBQueryService(query);
       reqData.AADHAAR=encryptData(reqData.AADHAAR)
       Logger.info(`mastersServices - getstampindentdetailssrvc ===> ${JSON.stringify(reqData)}`);
      return response;
    }
    catch (ex) {
      Logger.error("mastersServices - getstampindentdetailssrvc || Error :", ex);
      console.error("mastersServices - getstampindentdetailssrvc || Error :", ex);
      throw new PDEError(ex);
    }
  };
  deletestampdetailssrvc = async (reqData) => {
    try {
      Logger.info(`mastersServices - deletestampdetailssrvc ===> ${JSON.stringify(reqData)}`);
      let bindparam = {};
      const query = `DELETE FROM srouser.stamp_indent WHERE SR_CODE = ${ parseInt(reqData.srCode) }
  AND STAMP_CATEGORY = '${reqData.stampCategory}'
  AND STAMP_TYPE = '${reqData.stampType}'
  AND DENOMINATION = ${ parseInt(reqData.denomination) }
  AND NO_STAMPS = ${ parseInt(reqData.noStamps) }
  AND AMOUNT = ${ parseInt(reqData.amount) }
  AND REQUEST_ID = '${reqData.requestId}'
        `;
        const response = await this.orDao.oDbDelete(query);
      return response;
    }
    catch (ex) {
      Logger.error("mastersServices - getstampindentdetailssrvc || Error :", ex);
      console.error("mastersServices - getstampindentdetailssrvc || Error :", ex);
      throw new PDEError(ex);
    }
  };
  unpaidrequestlistsrvc = async (reqData) => {
    try {
      let bindparam = {};
      let statusquery;
      if(reqData.flag =='Y'){
        statusquery=''
      }
      else{
        statusquery=`and PAYMENT_STATUS='N'`
      }
      const query = `SELECT 
    request_id,
    sr_code,
    rm_name,
    payment_status,
    stamp_category,
       trunc(TIME_STAMP) AS TIME_STAMP,
    AADHAR_ENCRPT,
    stamp_type,
    SUM(no_stamps) AS total_stamps,
    SUM(amount) AS total_amount
FROM 
    srouser.stamp_indent WHERE LOGIN_ID='${reqData.LoginId}' ${statusquery}
GROUP BY 
    request_id, 
    stamp_category, 
        sr_code,
    rm_name,
    payment_status,
    stamp_type,
       trunc(TIME_STAMP),
    AADHAR_ENCRPT`;
      let bindParams = {
sr_code:parseInt(reqData.SR_CODE),
req_id:reqData.REQUEST_ID
      };
    const response = await this.orDao.oDBQueryService(query);
      return response;
    }
    catch (ex) {
      Logger.error("mastersServices - getstampindentdetailssrvc || Error :", ex);
      console.error("mastersServices - getstampindentdetailssrvc || Error :", ex);
      throw new PDEError(ex);
    }
  };
  stampindentverificationsrvc = async (reqData) => {
    try {
      let bindparam = {};
      const query = `SELECT SUM(NO_STAMPS) as NO_STAMPS, REQUEST_ID
FROM srouser.Stamp_indent 
WHERE sr_code = ${reqData.SR_CODE}
  AND STAMP_CODE = ${reqData.STAMP_TYPE} 
  AND denomination = ${reqData.DENOMINATION} 
  AND LOGIN_ID ='${reqData.LoginID}'
  AND TRUNC(TIME_STAMP) = TRUNC(SYSDATE) GROUP BY REQUEST_ID`;
    const response = await this.orDao.oDBQueryService(query);
      return response;
    }
    catch (ex) {
      Logger.error("mastersServices - getstampindentdetailssrvc || Error :", ex);
      console.error("mastersServices - getstampindentdetailssrvc || Error :", ex);
      throw new PDEError(ex);
    }
  };

  saveAadhaarConsentAcceptanceDetailsService = async (reqData) => {    
		try {
			const checkQuery = `INSERT INTO SROUSER.AADHAAR_CONSENT_LOG (APP_ID, PARTY_NAME, CONSENT_ACCEPT, PARTY_TYPE, TYPE, SOURCE_NAME, TIME_STAMP, AADHAR_CONSENT) 
						VALUES (:APP_ID, :PARTY_NAME, :CONSENT_ACCEPT, :PARTY_TYPE, :TYPE, :SOURCE_NAME, SYSDATE, :AADHAR_CONSENT)`;
			const bindParams = {
				APP_ID: reqData.APP_ID,
				PARTY_NAME: reqData.PARTY_NAME,
				CONSENT_ACCEPT: reqData.CONSENT_ACCEPT,
				PARTY_TYPE: reqData.PARTY_TYPE,
				TYPE: reqData.TYPE,
				SOURCE_NAME: reqData.SOURCE_NAME,
        AADHAR_CONSENT: reqData.AADHAR_CONSENT
			};

			const checkResult = await this.orDao.oDbInsertDocsWithBindParams(checkQuery, bindParams);
			return checkResult;

		} catch (ex) {
			Logger.error("mastersServices - saveEkycExemptionDetailsService || Error :", ex);
			console.error("mastersServices - saveEkycExemptionDetailsService || Error :", ex);
			throw new PDEError(ex);
		}
	};

}
module.exports = Masters;