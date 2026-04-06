const orDbDao = require('../dao/oracleDbDaos')
const { Logger } = require('../../services/winston');
const { constructPDEError } = require("../handlers/errorHandler");
const { EncryptAdrwithPkcs,encryptUID, AadhardecryptData,AadharencryptData,maskAadhaar } = require("../utils");
const { cdmaAPIs, cdmaHostURL } = require('../constants/CDMAConstants')
const slotModel = require('../model/slotModel');
const moment = require('moment');
const villageServices = require('../services/villageService');
const axios =require('axios')
const EcCcService = require('../services/ecCcServices')
const lodash = require('lodash');

class CCServices {
    constructor() {
        this.orDao = new orDbDao();
        this.villageService = new villageServices()
        this.EcCcService = new EcCcService 
    }
    doctdetailsSrvc = async (reqData) => {
        try {
            const { DOCNO, SRCODE, RYEAR, BOOKNO } = reqData
            let DocDetails = [], ScheduleDetails = [], PartyDetails = [];
            let bindParams = {
                SRCODE: SRCODE,
                BOOKNO: BOOKNO,
                DOCNO: DOCNO,
                RYEAR: RYEAR
            };
        const isPrivilegedUser = reqData.USERNAME === process.env.APDTCP_USERNAME && reqData.PASSWORD === process.env.APDTCP_PASSWORD;
            const ryearInt = parseInt(RYEAR);
            if (ryearInt <= 1999) {                
                bindParams = {
                    SRCODE: SRCODE,
                    DOCNO: DOCNO,
                    RYEAR: RYEAR
                };
                const docQuery = `SELECT M.SR_CODE SRCODE, 'NA' BOOKNO, M.REG_YEAR RegYear, M.DOCT_NO RegDocNo,
      TO_CHAR(M.REGN_DT, 'dd/mm/yyyy') RegDate, S.TRAN_CODE1 TranMajCode, S.TRAN_DESC1 TranMajDesc,
      'NA' TranMinCode, 'NA' TranMinDesc
      FROM INDEX2A M, INDEX2B S
      WHERE M.SR_CODE = S.SR_CODE AND M.REG_YEAR = S.REG_YEAR AND M.DOCT_NO = S.DOCT_NO
      AND M.SCHEDULE_NO = S.SCHEDULE_NO
      AND M.SR_CODE = :SRCODE AND M.DOCT_NO = :DOCNO AND M.REG_YEAR = :RYEAR`;

                const schedQuery = `SELECT M.SCHEDULE_NO SchedNo, 'NA' SurveyNoDISTCD, 'NA' SurveyNoMANDCD,
      S.VILLAGE SurveyNoVILLCODE, M.SY1 SurveyNos, M.EXTENT1 SurveyExtent,
      ' ' SurveyExtentUnit, ' ' SchedExtent, ' ' SchedUnit
      FROM INDEX2A M, INDEX2B S
      WHERE M.SR_CODE = S.SR_CODE AND M.REG_YEAR = S.REG_YEAR AND M.DOCT_NO = S.DOCT_NO
      AND M.SCHEDULE_NO = S.SCHEDULE_NO
      AND M.SR_CODE = :SRCODE AND M.DOCT_NO = :DOCNO AND M.REG_YEAR = :RYEAR`;

                const partyQuery = `SELECT INDGP_CODE PartyCode, 'NA' PARTYDESC, INDGP_NAME PartyName,
      (CASE WHEN R_CODE IS NOT NULL THEN R_CODE || '/o ' || R_NAME ELSE '' END) AS RelationName,
      'NA' Address, 'NA' UIDNO
      FROM SROUSER.IND1
      WHERE SR_CODE = :SRCODE AND DOCT_NO = :DOCNO AND REG_YEAR = :RYEAR
      ORDER BY PartyCode`;
                DocDetails = await this.orDao.ReadoDBQueryServiceWithBindParams(docQuery, bindParams);
                ScheduleDetails = await this.orDao.ReadoDBQueryServiceWithBindParams(schedQuery, bindParams);
                PartyDetails = await this.orDao.ReadoDBQueryServiceWithBindParams(partyQuery, bindParams);
            } else {
                bindParams = {
                    SRCODE: SRCODE,
                    BOOKNO: BOOKNO,
                    DOCNO: DOCNO,
                    RYEAR: RYEAR
                };
                const mainDocQuery = `SELECT m.sr_Code as SRCODE, m.book_no as BOOKNO, m.ryear as RegYear,
      m.rdoct_no as RegDocNo, to_char(m.R_DATE,'dd/mm/yyyy') as RegDate, m.tran_maj_code as TranMajCode,
      (SELECT tran_desc FROM tran_dir d WHERE d.tran_maj_Code = m.tran_maj_code AND d.tran_min_code = '00') TranMajDesc,
      m.tran_min_code as TranMinCode,
      (SELECT tran_desc FROM tran_dir d WHERE d.tran_maj_Code = m.tran_maj_code AND d.tran_min_code = m.tran_min_code) TranMinDesc
      FROM tran_major m, img_base_cca i
      WHERE i.sro_code = m.sr_code AND i.doct_no = m.doct_no AND i.reg_year = m.REG_YEAR
      AND i.book_no = m.book_no AND m.sr_code = :SRCODE AND m.rdoct_no = :DOCNO AND m.ryear = :RYEAR AND m.book_no = :BOOKNO`;

     const fallbackDocQuery = `SELECT m.sr_Code AS SRCODE, m.book_no AS BOOKNO, m.ryear AS RegYear,
    m.rdoct_no AS RegDocNo, TO_CHAR(m.R_DATE, 'dd/mm/yyyy') AS RegDate,  m.tran_maj_code AS TranMajCode,
    (SELECT tran_desc FROM card.tran_dir d WHERE d.tran_maj_Code = m.tran_maj_code AND d.tran_min_code = '00') AS TranMajDesc,
    m.tran_min_code AS TranMinCode,
    (SELECT tran_desc FROM tran_dir d WHERE d.tran_maj_Code = m.tran_maj_code AND d.tran_min_code = m.tran_min_code) AS TranMinDesc
    FROM tran_major m
    WHERE m.sr_code = :SRCODE AND m.rdoct_no = :DOCNO AND m.ryear = :RYEAR AND m.book_no = :BOOKNO`;

     const partyQuery = `SELECT Code AS PartyCode,
      (SELECT PARTY1 FROM tran_dir WHERE party1_code = E.CODE AND ROWNUM = 1 AND PARTY1 IS NOT NULL
       UNION
       SELECT PARTY2 FROM tran_dir WHERE party2_code = E.CODE AND ROWNUM = 1 AND PARTY1 IS NOT NULL) PARTYDESC,
      e.name AS PartyName,
      R_code || '/o ' || NVL(e.R_NAME, (SELECT b.NAME FROM tran_ec_firms b WHERE b.sr_code = e.sr_code AND b.book_no = e.book_no AND b.doct_no = e.doct_no AND b.reg_year = e.reg_year AND b.code = e.code AND b.EC_NUMBER = e.EC_NUMBER AND ROWNUM = 1)) AS RelationName,
      NVL(e.ADDRESS1 || e.ADDRESS2, (SELECT b.ADDRESS1 || b.ADDRESS2 FROM tran_ec_firms b WHERE b.sr_code = e.sr_code AND b.book_no = e.book_no AND b.doct_no = e.doct_no AND b.reg_year = e.reg_year AND b.code = e.code AND b.EC_NUMBER = e.EC_NUMBER AND ROWNUM = 1)) AS Address,
      e.aadhar_encrpt AS AADHAR_ENCRPT
      FROM tran_ec e
      WHERE e.sr_code = :SRCODE AND e.rdoct_no = :DOCNO AND e.ryear = :RYEAR AND e.book_no = :BOOKNO
      ORDER BY partycode`;

            DocDetails = await this.orDao.ReadoDBQueryServiceWithBindParams(mainDocQuery, bindParams);
            if (!DocDetails.length) {
                DocDetails = await this.orDao.ReadoDBQueryServiceWithBindParams(fallbackDocQuery, bindParams);
            }


            const scheduleQuery = `SELECT TD.SCHEDULE_NO, SUBSTR(LPAD(TD.VILLAGE_CODE, 7, '0'), 1, 2) AS SURVEYNODISTCD, SUBSTR(LPAD(TD.VILLAGE_CODE, 7, '0'), 3, 2) AS SURVEYNOMANDCD,
                             TD.VILLAGE_CODE AS SURVEYNOVILLCODE,
                             CASE WHEN AD.S_LP_NO IS NOT NULL THEN TO_CHAR(AD.S_LP_NO)
                             WHEN TD.SURVEY_NO IS NOT NULL THEN NVL(TRIM(BOTH ',' FROM TO_CHAR(TD.SURVEY_NO)), ' ')
                             ELSE ' ' END AS SURVEYNOS,
                             CASE WHEN AD.TOTAL_EXTENT IS NOT NULL THEN TO_CHAR(AD.TOTAL_EXTENT)
                             WHEN TD.SURVEY_EXT IS NOT NULL THEN NVL(TRIM(BOTH ',' FROM TO_CHAR(TD.SURVEY_EXT)), ' ')
                             ELSE ' ' END AS SURVEYEXTENT,
                             CASE  WHEN AD.TOTAL_EXTENT IS NOT NULL THEN 'A'
                             WHEN TD.SURVEY_EXT_UNIT IS NOT NULL THEN NVL(TRIM(BOTH ',' FROM TO_CHAR(TD.SURVEY_EXT_UNIT)), ' ')
                             ELSE ' ' END AS SURVEYEXTENTUNIT,
                             CASE WHEN AD.SELLING_EXTENT IS NOT NULL THEN TO_CHAR(AD.SELLING_EXTENT)
                             WHEN TD.EXTENT IS NOT NULL THEN NVL(TO_CHAR(TD.EXTENT), ' ')
                             ELSE ' ' END AS SCHEDEXTENT,
                             CASE WHEN AD.SELLING_EXTENT IS NOT NULL THEN 'A'
                             WHEN TD.EXTENT IS NOT NULL THEN NVL(TRIM(BOTH ',' FROM TO_CHAR(TD.UNIT)), ' ')
                             ELSE ' ' END AS SCHEDUNIT,
                             NVL(TO_CHAR(TD.LP_NO), ' ') AS LPMNUMBER
                             FROM TRAN_SCHED TD
                             LEFT JOIN SROUSER.adangal_details AD  ON AD.SR_CODE = TD.SR_CODE AND AD.BOOK_NO = TD.BOOK_NO AND AD.DOCT_NO = TD.DOCT_NO AND AD.REG_YEAR = TD.REG_YEAR  AND AD.SCHEDULE_NO = TD.SCHEDULE_NO
                             WHERE TD.SR_CODE = :SRCODE AND TD.rDOCT_NO = :DOCNO AND TD.REG_YEAR = :RYEAR AND TD.BOOK_NO = :BOOKNO
                             ORDER BY TD.SCHEDULE_NO`;

            // Extra schedule query for privileged user (ryear > 1999)
            const scheduleQueryPrivileged = `SELECT  
    TD.SCHEDULE_NO,
    TD.VILLAGE_CODE                                         AS SURVEYNOVILLCODE,
    SUBSTR(LPAD(TD.VILLAGE_CODE, 7, '0'), 1, 2)            AS SURVEYNODISTCD,
    SUBSTR(LPAD(TD.VILLAGE_CODE, 7, '0'), 3, 2)            AS SURVEYNOMANDCD,
    TD.WARD_NO                                              AS WARD,
    TD.BLOCK_NO                                             AS BLOCK,
    TD.TOT_FLOOR                                            AS FLOOR_NUMBER,
 CASE 
    WHEN ST.PLINTH IS NOT NULL 
    THEN ST.PLINTH 
    ELSE NULL
END AS PLINTH_AREA,
ST.unit as plinth_unit ,
    TD.LOC_HAB_NAME,
    TD.MKT_VALUE                                            AS CURRENT_MARKET_VALUE,
    TD.CON_VALUE                                            AS Consideration_Value,
    AC.CLASS_DESC                                           AS CLASSIFICATION,
    NVL(TO_CHAR(TD.LP_NO), ' ')                            AS LPMNUMBER,
    TD.EAST,
    TD.WEST,
    TD.NORTH,
    TD.SOUTH,
    CASE 
        WHEN AD.S_LP_NO    IS NOT NULL THEN TO_CHAR(AD.S_LP_NO)
        WHEN TD.SURVEY_NO  IS NOT NULL THEN NVL(TRIM(BOTH ',' FROM TO_CHAR(TD.SURVEY_NO)), ' ')
        ELSE ' ' 
    END AS SURVEYNOS,
    CASE 
        WHEN AD.TOTAL_EXTENT   IS NOT NULL THEN TO_CHAR(AD.TOTAL_EXTENT)
        WHEN TD.SURVEY_EXT     IS NOT NULL THEN NVL(TRIM(BOTH ',' FROM TO_CHAR(TD.SURVEY_EXT)), ' ')
        ELSE ' ' 
    END AS SURVEYEXTENT,
    CASE 
        WHEN AD.TOTAL_EXTENT     IS NOT NULL THEN 'A'
        WHEN TD.SURVEY_EXT_UNIT  IS NOT NULL THEN NVL(TRIM(BOTH ',' FROM TO_CHAR(TD.SURVEY_EXT_UNIT)), ' ')
        ELSE ' ' 
    END AS SURVEYEXTENTUNIT,
    CASE 
        WHEN AD.SELLING_EXTENT IS NOT NULL THEN TO_CHAR(AD.SELLING_EXTENT)
        WHEN TD.EXTENT         IS NOT NULL THEN NVL(TO_CHAR(TD.EXTENT), ' ')
        ELSE ' ' 
    END AS SCHEDEXTENT,
    CASE 
        WHEN AD.SELLING_EXTENT IS NOT NULL THEN 'A'
        WHEN TD.EXTENT         IS NOT NULL THEN NVL(TRIM(BOTH ',' FROM TO_CHAR(TD.UNIT)), ' ')
        ELSE ' ' 
    END AS SCHEDUNIT
FROM srouser.TRAN_SCHED TD
LEFT JOIN SROUSER.ADANGAL_DETAILS AD
    ON  AD.SR_CODE    = TD.SR_CODE
    AND AD.BOOK_NO    = TD.BOOK_NO
    AND AD.DOCT_NO    = TD.DOCT_NO
    AND AD.REG_YEAR   = TD.REG_YEAR
    AND AD.SCHEDULE_NO = TD.SCHEDULE_NO
    LEFT JOIN (
    SELECT 
        SR_CODE,
        BOOK_NO,
        DOCT_NO,
        REG_YEAR,
        SCHEDULE_NO,
        SUM(NVL(PLINTH,0)) AS PLINTH,
        MAX(UNIT) AS UNIT
    FROM srouser.STRU_DET
    GROUP BY 
        SR_CODE,
        BOOK_NO,
        DOCT_NO,
        REG_YEAR,
        SCHEDULE_NO
) ST
    ON ST.SR_CODE     = TD.SR_CODE
    AND ST.BOOK_NO    = TD.BOOK_NO
    AND ST.DOCT_NO    = TD.DOCT_NO
    AND ST.REG_YEAR   = TD.REG_YEAR
    AND ST.SCHEDULE_NO = TD.SCHEDULE_NO
LEFT JOIN card.AREA_CLASS AC
    ON AC.CLASS_CODE = TD.NATURE_USE
    AND TD.NATURE_USE IS NOT NULL
WHERE 
    TD.SR_CODE   = :SRCODE
    AND TD.rDOCT_NO  = :DOCNO
    AND TD.REG_YEAR  = :RYEAR
    AND TD.BOOK_NO   = :BOOKNO
ORDER BY TD.SCHEDULE_NO `;

            if (isPrivilegedUser) {
                ScheduleDetails = await this.orDao.ReadoDBQueryServiceWithBindParams(scheduleQueryPrivileged, bindParams);
            } else {
                ScheduleDetails = await this.orDao.ReadoDBQueryServiceWithBindParams(scheduleQuery, bindParams);
            }

            PartyDetails = await this.orDao.ReadoDBQueryServiceWithBindParams(partyQuery, bindParams);
        }

        let pdfvalresponse = [];
        let valresponse = [];

        // Check for document in TIFF table (cardimages)
        bindParams["BOOKNO"] = BOOKNO;
        let valquery = `SELECT count(*) as COUNT FROM cardimages.digitally_sign_docs WHERE SR_CODE=${SRCODE} AND BOOK_NO=${BOOKNO} AND REG_YEAR = ${RYEAR} AND DOCT_NO=${DOCNO}`;
        valresponse = await this.orDao.oDBQueryServiceCC(valquery);

        // If not found in TIFF table, check in PDF table (img_base_cca)
        if (valresponse[0]?.COUNT === 0) {
            let pdfvalquery = `select count(*) as COUNT from img_base_cca WHERE sro_code = :SRCODE AND book_no = :BOOKNO AND ryear = :RYEAR AND rdoct_no = :DOCNO`;
            pdfvalresponse = await this.orDao.ReadoDBQueryServiceWithBindParams(pdfvalquery, bindParams);
        }

        if (pdfvalresponse[0]?.COUNT <= 0 && valresponse[0]?.COUNT <= 0) {
            return {
                status: false,
                message: "We couldn't locate the document details. Please verify the document details and try again.",
            };
        }

        let doct_type = valresponse[0]?.COUNT > 0 ? 'TIFF' : 'PDF';

        if (DocDetails && DocDetails.length > 0) {
            try {
                bindParams = {
                    SR_CODE: SRCODE,
                    BOOK_NO: BOOKNO,
                    DOCT_NO: DOCNO,
                    REG_YEAR: RYEAR
                };

                let REGDOCUMENTLINK = null;
                if (reqData.USERNAME != 'apdbms_igrs') {
                    let ccData = encodeURIComponent(JSON.stringify(bindParams));
                    ccData = EncryptAdrwithPkcs(ccData);

                    REGDOCUMENTLINK = `${process.env.PDE_UI}/CCdownloadPage?data=${ccData}`;

                    if (isPrivilegedUser) {
                        const result = await this.EcCcService.getDataSrvc(bindParams);
                        if (result && result.length > 0) {
                            if (result[0].IMAGE) {
                                REGDOCUMENTLINK = result[0].IMAGE.toString('base64');
                            }
                        }
                        if (result.dataBase64) {
                            REGDOCUMENTLINK = result.dataBase64;
                        }
                    }

                }

                DocDetails = {
                    ...DocDetails[0],
                    DOCTYPE: doct_type,
                    REGDOCUMENTLINK: REGDOCUMENTLINK
                };
                let requestLogQuery = `INSERT INTO SROUSER.CC_REQUEST_RECORD ( SR_CODE, BOOK_NO, DOCT_NO, REG_YEAR, REQUEST_BY, REQ_NO) VALUES ( :SR_CODE, :BOOK_NO, :DOCT_NO, :REG_YEAR, :REQUEST_BY, (SELECT NVL(MAX(REQ_NO), 0) + 1 FROM SROUSER.CC_REQUEST_RECORD) )`;
                bindParams.REQUEST_BY = reqData.USERNAME;
                let reuestlogResponse = await this.orDao.oDbInsertDocsWithBindParams(requestLogQuery, bindParams);
            } catch (err) {
                console.error("apiForothersServices - doctdetailsSrvc || Error parsing JSON:", err);
            }
        }

            return {
                DocDetails,
                ScheduleDetails,
                PartyDetails
            };
        } catch (ex) {
            Logger.error("apiForothersServices - doctdetailsSrvc || Error :", ex);
            console.error("apiForothersServices - doctdetailsSrvc || Error :", ex);
            throw constructPDEError(ex);
        }
    }
    DoctdetailsbyPANSrvc = async (reqData) => {
        try {
            let bindParams = {
                'PAN_NO': reqData.PAN_NO,                
                'AADHAR' : reqData.AADHAR? AadharencryptData(reqData.AADHAR) : ''
            }
            let query = `SELECT 
                dr.DR_NAME AS DISTRICT,
                md.MANDAL_NAME AS MANDAL,
                hv.VILLAGE_NAME AS VILLAGE,
                te_pan.sr_code AS SR_CODE,
                sr.SR_NAME,
                te_pan.DOCT_NO,
                te_pan.REG_YEAR,
                te_pan.BOOK_NO,
                tm.RDOCT_NO,
 TO_CHAR(tm.P_DATE, 'YYYY-MM-DD') AS P_DATE,
             TO_CHAR(tm.E_DATE, 'YYYY-MM-DD') AS E_DATE,
             TO_CHAR(tm.R_DATE, 'YYYY-MM-DD') AS R_DATE,
             td.TRAN_DESC,
             ta.CLASS_DESC,
             ts.SCHEDULE_NO,
              te_pan.NAME AS PAN_HOLDER_NAME,
             te_pan.CODE AS PAN_HOLDER_CODE,
                te_pan.AADHAR_ENCRPT,
                nvl((select party1 from tran_dir where upper(te.CODE)=upper(party1_code) and rownum=1),
                    (select party2 from tran_dir where upper(te.CODE)=upper(party2_code) and rownum=1)) as TYPE,
                te.CODE AS PARTY_CODE,
                te.NAME AS PARTY_NAME,
                te.ADDRESS1 AS PARTY_ADDRESS,
                te.EMAIL_ID AS PARTY_EMAIL,
                te.PHONE_NO AS PARTY_PHONE,
                ts.WARD_NO,
                ts.BLOCK_NO,
                ts.VILLAGE_CODE,
                ts.SURVEY_NO,
                ts.PLOT_NO,
                ts.NEW_HOUSE_NO,
                ts.EAST, 
                ts.WEST, 
                ts.NORTH, 
                ts.SOUTH,
                ts.EXTENT,
                ts.UNIT,
                ts.CON_VALUE,
                ts.MKT_VALUE
            FROM TRAN_SCHED ts
            JOIN TRAN_MAJOR tm 
              ON ts.sr_code = tm.sr_code 
             AND ts.book_no = tm.book_no 
             AND ts.reg_year = tm.reg_year 
             AND ts.doct_no = tm.doct_no
            JOIN TRAN_DIR td 
              ON tm.tran_maj_code = td.tran_maj_code 
             AND tm.tran_min_code = td.tran_min_code
            JOIN AREA_CLASS ta 
              ON ta.CLASS_CODE = ts.NATURE_USE
            JOIN CARD.MST_REVREGDIST dr 
              ON dr.DISTRICT_CODE = SUBSTR(LPAD(ts.VILLAGE_CODE, 7, '0'), 1, 2)
            JOIN CARD.MST_REVMANDAL md 
              ON md.DISTRICT_CODE = SUBSTR(LPAD(ts.VILLAGE_CODE, 7, '0'), 1, 2) 
             AND md.MANDAL_CODE = SUBSTR(LPAD(ts.VILLAGE_CODE, 7, '0'), 3, 2)
            JOIN HAB_CODE hv 
              ON hv.HAB_CODE = LPAD(ts.VILLAGE_CODE, 7, '0') || '01'
            JOIN SR_MASTER sr 
              ON sr.SR_CD = tm.sr_code
            LEFT JOIN TRAN_EC te_pan 
              ON te_pan.PAN_NO = :PAN_NO 
             AND te_pan.AADHAR_ENCRPT = :AADHAR
             AND te_pan.sr_code = tm.sr_code 
             AND te_pan.book_no = tm.book_no 
             AND te_pan.reg_year = tm.reg_year 
             AND te_pan.doct_no = tm.doct_no 
             AND ROWNUM = 1
            LEFT JOIN TRAN_EC te 
              ON te.sr_code = tm.sr_code 
             AND te.book_no = tm.book_no 
             AND te.reg_year = tm.reg_year 
             AND te.doct_no = tm.doct_no
            WHERE EXISTS (
                SELECT 1 
                FROM TRAN_EC te2 
                WHERE te2.PAN_NO = :PAN_NO 
                  AND te2.AADHAR_ENCRPT = :AADHAR
                  AND te2.sr_code = ts.sr_code
                  AND te2.book_no = ts.book_no
                  AND te2.reg_year = ts.reg_year
                  AND te2.doct_no = ts.doct_no
            )
            ORDER BY tm.R_DATE DESC
        `;

            let response = await this.orDao.oDBQueryServiceWithBindParams(query, bindParams);
            let groupedData = {};
            response.forEach(row => {
                let key = `${row.SR_CODE}_${row.BOOK_NO}_${row.REG_YEAR}_${row.DOCT_NO}`;
                if (!groupedData[key]) {
                    groupedData[key] = {
                        DISTRICT: row.DISTRICT,
                        MANDAL: row.MANDAL,
                        VILLAGE: row.VILLAGE,
                        SR_CODE: row.SR_CODE,
                        SR_NAME: row.SR_NAME,
                        DOCT_NO: row.DOCT_NO,
                        REG_YEAR: row.REG_YEAR,
                        BOOK_NO: row.BOOK_NO,
                        RDOCT_NO: row.RDOCT_NO,
                        P_DATE: row.P_DATE,
                        E_DATE: row.E_DATE,
                        R_DATE: row.R_DATE,
                        TRAN_DESC: row.TRAN_DESC,
                        CLASS_DESC: row.CLASS_DESC,
                        SCHEDULE_NO: row.SCHEDULE_NO,
                        PAN_HOLDER_NAME: row.PAN_HOLDER_NAME,
                        PAN_HOLDER_CODE: row.PAN_HOLDER_CODE,
                        UID: row.AADHAR_ENCRPT.length > 12 ?encryptUID(String(AadhardecryptData(row.AADHAR_ENCRPT))) : row.AADHAR_ENCRPT,
                        PARTIES: [],
                        WARD_NO: row.WARD_NO,
                        BLOCK_NO: row.BLOCK_NO,
                        VILLAGE_CODE: row.VILLAGE_CODE,
                        SURVEY_NO: row.SURVEY_NO,
                        PLOT_NO: row.PLOT_NO,
                        NEW_HOUSE_NO: row.NEW_HOUSE_NO,
                        EAST: row.EAST,
                        WEST: row.WEST,
                        NORTH: row.NORTH,
                        SOUTH: row.SOUTH,
                        EXTENT: row.EXTENT,
                        UNIT: row.UNIT,
                        CON_VALUE: row.CON_VALUE,
                        MKT_VALUE: row.MKT_VALUE
                    };
                }

                if (row.PARTY_CODE) {
                    groupedData[key].PARTIES.push({
                        TYPE: row.TYPE,
                        CODE: row.PARTY_CODE,
                        NAME: row.PARTY_NAME,
                        ADDRESS: row.PARTY_ADDRESS,
                        EMAIL: row.PARTY_EMAIL,
                        PHONE: row.PARTY_PHONE,
                    });
                }
            });
            return Object.values(groupedData);
        } catch (ex) {
            Logger.error("apiForothersServices - DoctdetailsbyPANSrvc || Error :", ex);
            console.error("apiForothersServices - DoctdetailsbyPANSrvc || Error :", ex);
            throw constructPDEError(ex);
        }
    }

    docTransDataByPan = async (reqData) => {
        try {
            let bindParams = {
                'PAN_NO': reqData.PAN_NO,
                'AADHAR' : reqData.AADHAR? AadharencryptData(reqData.AADHAR) : ''             
            }
        
        let query = `SELECT JSON_OBJECT(
            'DISTRICT' VALUE dr.DR_NAME,
            'MANDAL' VALUE md.MANDAL_NAME,
            'VILLAGE' VALUE hv.VILLAGE_NAME,
            'SR_CODE' VALUE te_pan.sr_code,
            'SR_NAME' VALUE sr.SR_NAME,
            'DOCT_NO' VALUE te_pan.DOCT_NO,
            'REG_YEAR' VALUE te_pan.REG_YEAR,
            'BOOK_NO' VALUE te_pan.BOOK_NO,
            'RDOCT_NO' VALUE tm.RDOCT_NO,
            'P_DATE' VALUE TO_CHAR(tm.P_DATE, 'YYYY-MM-DD'),
            'E_DATE' VALUE TO_CHAR(tm.E_DATE, 'YYYY-MM-DD'),
            'R_DATE' VALUE TO_CHAR(tm.R_DATE, 'YYYY-MM-DD'),
            'TRAN_DESC' VALUE td.TRAN_DESC,
            'CLASS_DESC' VALUE ta.CLASS_DESC,
            'SCHEDULE_NO' VALUE ts.SCHEDULE_NO,
            'PAN_HOLDER_NAME' VALUE te_pan.NAME,
            'PAN_HOLDER_CODE' VALUE te_pan.CODE,
            'UID' VALUE te_pan.AADHAR_ENCRPT,
            'PARTIES' VALUE (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'TYPE' VALUE  nvl((select party1 from tran_dir where upper(te.CODE)=upper(party1_code) and rownum=1),
                        (select party2 from tran_dir where upper(te.CODE)=upper(party2_code) and rownum=1)),
                        'CODE' VALUE te.CODE,
                        'NAME' VALUE te.NAME,
                        'ADDRESS' VALUE te.ADDRESS1,
                        'EMAIL' VALUE te.EMAIL_ID,
                        'PHONE' VALUE te.PHONE_NO
                    )
                ) 
                FROM TRAN_EC te 
                WHERE te.sr_code = tm.sr_code 
                  AND te.book_no = tm.book_no
                  AND te.reg_year = tm.reg_year 
                  AND te.doct_no = tm.doct_no
            ),
            'WARD_NO' VALUE ts.WARD_NO,
            'BLOCK_NO' VALUE ts.BLOCK_NO,
            'VILLAGE_CODE' VALUE ts.VILLAGE_CODE,
            'SURVEY_NO' VALUE ts.SURVEY_NO,
            'PLOT_NO' VALUE ts.PLOT_NO,
            'NEW_HOUSE_NO' VALUE ts.NEW_HOUSE_NO,
            'EAST' VALUE ts.EAST, 
            'WEST' VALUE ts.WEST, 
            'NORTH' VALUE ts.NORTH, 
            'SOUTH' VALUE ts.SOUTH,
            'EXTENT' VALUE ts.EXTENT,
            'UNIT' VALUE ts.UNIT,
            'CON_VALUE' VALUE ts.CON_VALUE,
            'MKT_VALUE' VALUE ts.MKT_VALUE
        ) AS JSON_RESULT
        FROM TRAN_SCHED ts
        JOIN TRAN_MAJOR tm ON ts.sr_code = tm.sr_code 
                           AND ts.book_no = tm.book_no 
                           AND ts.reg_year = tm.reg_year 
                           AND ts.doct_no = tm.doct_no
        JOIN TRAN_DIR td ON tm.tran_maj_code = td.tran_maj_code 
                         AND tm.tran_min_code = td.tran_min_code
        JOIN AREA_CLASS ta ON ta.CLASS_CODE = ts.NATURE_USE
        JOIN CARD.MST_REVREGDIST dr ON dr.DISTRICT_CODE = SUBSTR(LPAD(ts.VILLAGE_CODE, 7, '0'), 1, 2)
        JOIN CARD.MST_REVMANDAL md ON md.DISTRICT_CODE = SUBSTR(LPAD(ts.VILLAGE_CODE, 7, '0'), 1, 2) 
                                   AND md.MANDAL_CODE = SUBSTR(LPAD(ts.VILLAGE_CODE, 7, '0'), 3, 2)
        JOIN HAB_CODE hv ON hv.HAB_CODE = LPAD(ts.VILLAGE_CODE, 7, '0') || '01'
        JOIN SR_MASTER sr ON sr.SR_CD = tm.sr_code

        LEFT JOIN TRAN_EC te_pan ON te_pan.PAN_NO = :PAN_NO 
                                 AND te_pan.AADHAR_ENCRPT = :AADHAR
                                 AND te_pan.sr_code = tm.sr_code 
                                 AND te_pan.book_no = tm.book_no 
                                 AND te_pan.reg_year = tm.reg_year 
                                 AND te_pan.doct_no = tm.doct_no 
                                 AND ROWNUM = 1
        WHERE EXISTS  
            (SELECT 1 FROM TRAN_EC te 
             WHERE te.PAN_NO = :PAN_NO
                AND te.AADHAR_ENCRPT =:AADHAR
                AND te.doct_no = ts.doct_no
                AND te.reg_year = ts.reg_year
                AND te.book_no = ts.book_no
                AND te.sr_code = ts.sr_code
                AND te.code IN ('CL','DE', 'SP', 'RE', 'EX')) 
                AND NOT EXISTS (
                    SELECT 1 FROM recti re
                    WHERE re.L_SRCD = ts.sr_code 
                        AND re.L_BNO = ts.book_no 
                        AND re.L_DOCTNO = ts.RDOCT_NO 
                        AND re.L_regYEAR = ts.RYEAR
                    )
            ORDER BY tm.R_DATE DESC`
       
            let response = await this.orDao.oDBQueryServiceWithBindParams(query, bindParams);
            let formattedData = response.map(row => JSON.parse(row.JSON_RESULT));
            formattedData.forEach((item, index) => {            
                const uidStr = String((item.UID) ? AadhardecryptData(item.UID) : '');
                if (uidStr.length === 12) {
                    formattedData[index].UID = encryptUID(String(uidStr));
                } else {
                    formattedData[index].UID = item.AADHAR;
                }
            });
            return formattedData
        } catch (ex) {
            Logger.error("apiForothersServices - Document Transaction Data By Pan || Error :", ex);
            console.error("apiForothersServices - Document Transaction Data By Pan || Error :", ex);
            throw constructPDEError(ex);
        }
    }
    pdeDocStatusSrvc = async(reqData) => {
        try{
            let  bindparam={
                FROM_DATE:reqData.FROM_DATE,
                TO_DATE:reqData.TO_DATE
              }
    
        // let Query = `SELECT dr.DR_NAME,sm.SR_NAME,hv.VILLAGE_NAME,
        //              SUM(CASE WHEN p.APP_ID IS NOT NULL THEN 1 ELSE 0 END) AS closedcount,
        //              SUM(CASE WHEN p.APP_ID IS NULL THEN 1 ELSE 0 END) AS opencount
        //              FROM schedule_entry s
        //              LEFT JOIN pde_doc_status_cr p ON s.ID = p.APP_ID 
        //             JOIN CARD.MST_REVREGDIST dr ON dr.DISTRICT_CODE = SUBSTR(LPAD(s.VILLAGE_CODE, 7, '0'), 1, 2)
        //             JOIN CARD.SR_MASTER sm ON sm.sr_cd = SUBSTR(s.ID, 3, 4) 
        //             JOIN HAB_CODE hv ON hv.HAB_CODE = LPAD(s.VILLAGE_CODE, 7, '0') || '01'
        //             where S.entry_date BETWEEN to_date(:FROM_DATE,'dd-mm-yy') AND to_date(:TO_DATE,'dd-mm-yy')
        //             GROUP BY dr.DR_NAME,sm.SR_NAME,hv.VILLAGE_NAME order by 1,2`
        let Query =` SELECT dr.dr_name, sm.SR_NAME,
                    COUNT(DISTINCT s.ID) AS TOTAL_COUNT,
                    COUNT(DISTINCT CASE WHEN p.APP_ID IS NOT NULL THEN p.APP_ID END) AS CLOSED_COUNT,
                    COUNT(DISTINCT CASE WHEN p.APP_ID IS NULL THEN s.ID END) AS OPEN_COUNT
                    FROM preregistration.presentation s
                   JOIN CARD.SR_MASTER sm  ON sm.sr_cd = SUBSTR(s.ID, 3, 4)
                   LEFT JOIN pde_doc_status_cr p ON s.ID = p.APP_ID 
                   LEFT JOIN card.mst_revregdist dr ON dr.dr_code = sm.dr_cd
                   WHERE TRUNC(s.entry_date) BETWEEN TO_DATE(:FROM_DATE, 'dd-mm-yy') AND TO_DATE(:TO_DATE, 'dd-mm-yy')
                   GROUP BY dr.dr_name, sm.dr_cd,sm.SR_NAME 
                   ORDER BY sm.SR_NAME`

            let response = await this.orDao.oDBQueryServiceWithBindParams(Query, bindparam);
         return response;
        } catch (ex) {
            Logger.error(ex.message);
            console.error("apiForothersServices - pdeDocStatusSrvc ||  Error : ", ex.message);
            throw constructPDEError(ex);
        }
        }
        
    getDocumentRegistrationService = async (reqData) => {
        try {
            let query = '';
            let bindParams = {};
            if (reqData.from_date && reqData.to_date){
query =`SELECT
    f.dr_name,
    g.sr_name,
    h.village_name,
    COUNT(*) AS total_registrations,
    SUM(CASE WHEN a.DOC_DIGI_SIGN = 'Y' THEN 1 ELSE 0 END) AS closed_registrations,
    SUM(CASE WHEN a.DOC_DIGI_SIGN = 'N' THEN 1 ELSE 0 END) AS open_registrations
FROM
    pde_doc_status_cr a
JOIN tran_sched b
    ON a.sr_code = b.sr_code
    AND a.book_no = b.book_no
    AND a.doct_no = b.doct_no
    AND a.reg_year = b.reg_year
JOIN hab_match e 
    ON b.village_code || '01' = e.hab_code
JOIN hab_code h 
    ON e.hab_code = h.hab_code
JOIN card.mst_revregdist f 
    ON SUBSTR(e.webland_code, 1, 2) = f.district_code
JOIN sr_master g 
    ON f.dr_code = g.dr_cd
WHERE h.hab_code = nvl(:village_code,e.hab_code)
    AND TRUNC(a.time_stamp) BETWEEN TO_DATE(:from_date, 'DD-MM-YYYY') AND TO_DATE(:to_date, 'DD-MM-YYYY')
GROUP BY
    f.dr_name,
    g.sr_name,
    h.hab_code,
    h.village_name
ORDER BY
    f.dr_name,g.sr_name,h.village_name`;
    
                bindParams = {
                    from_date: reqData.from_date,
                    to_date: reqData.to_date,
                    village_code: reqData.village_code
                };
            }  
else {
                throw new Error("Invalid input: from_date and to_date are required");
            }
    console.log("getDocumentRegistrationService - query", query);
            const result = await this.orDao.oDBQueryServiceWithBindParams(query, bindParams);
            return result;
            
        } catch (ex) {
            Logger.error("apiForothersServices - getDocumentRegistrationService || Error:", ex);
            console.error("apiForothersServices - getDocumentRegistrationService || Error:", ex);
            throw ex;
        }
    };
    getDocumentECService = async (reqData) => {
        try {
            let query = '';
            let bindParams = {};
            if (reqData.from_date && reqData.to_date) {
                query = `select 
dm.dr_name,
sm.sr_name,
nvl(COUNT(CASE WHEN ec.status != 'E' THEN 1 END),0) AS open_requests,
nvl(COUNT(CASE WHEN ec.status = 'E' THEN 1 END),0) AS closed_requests
from 
card.mst_revregdist dm 
left join sr_master sm on sm.dr_cd = dm.dr_code
left join srouser.public_ec_status ec on sm.sr_cd = ec.sr_code 
and trunc(ec.time_stamp) between to_date(:FROM_DATE,'DD-MM-YYYY') and to_date(:TO_DATE,'DD-MM-YYYY')
where sm.state_cd = '01' and sm.sr_cd not in (9999,999) and dm.dr_code = nvl(:DR_CODE,dm.dr_code) 
group by dm.dr_name,sm.sr_name
order by 2`;
    
                bindParams = {
                    FROM_DATE: reqData.from_date,
                    TO_DATE: reqData.to_date,
                    DR_CODE: reqData.DR_CODE
                }
            } else {
                throw new Error("Invalid input: from_date and to_date are required");
            }

    const result = await this.orDao.oDBQueryServiceWithBindParams(query,bindParams);
    return result;
    
} catch (ex) {
    Logger.error("apiForothersServices - getDocumentECService || Error:", ex);
    console.error("apiForothersServices - getDocumentECService || Error:", ex);
    throw ex;
}
};
getDocumentCCService = async (reqData) => {
    try {
        let query = '';
        let bindParams = {};
         if (reqData.from_date && reqData.to_date) {
            query = `
                  select 
dm.dr_name,
sm.sr_name,
nvl(COUNT(CASE WHEN cc.status not in ('RD', 'DD') THEN 1 END),0) AS open_requests,
nvl(COUNT(CASE WHEN cc.status in ('RD', 'DD') THEN 1 END),0) AS closed_requests
from 
card.mst_revregdist dm 
left join sr_master sm on sm.dr_cd = dm.dr_code
left join srouser.public_cc_status cc on sm.sr_cd = cc.sr_code 
and trunc(cc.time_stamp) between to_date(:FROM_DATE,'DD-MM-YYYY') and to_date(:TO_DATE,'DD-MM-YYYY')
where sm.state_cd = '01' and sm.sr_cd not in (9999,999) and dm.dr_code = nvl(:DR_CODE,dm.dr_code) 
group by dm.dr_name,sm.sr_name
order by 2`;

            bindParams = {
                FROM_DATE: reqData.from_date,
                    TO_DATE: reqData.to_date,
                    DR_CODE: reqData.DR_CODE
            };
        } else {
            throw new Error("Invalid input: from_date and to_date are required");
        }

const result = await this.orDao.oDBQueryServiceWithBindParams(query, bindParams);
return result;

} catch (ex) {
Logger.error("apiForothersServices - getDocumentCCService || Error:", ex);
console.error("apiForothersServices - getDocumentCCService || Error:", ex);
throw ex;
}
};
  


DoctdetailsbyTAXSrvc = async (reqData) => {
        try {
            let bindParams = {
                'PAN_NO': reqData.PAN_NO,                
            }
            let query = `SELECT 
                dr.DR_NAME AS DISTRICT,
                md.MANDAL_NAME AS MANDAL,
                hv.VILLAGE_NAME AS VILLAGE,
                te_pan.sr_code AS SR_CODE,
                sr.SR_NAME,
                te_pan.DOCT_NO,
                te_pan.REG_YEAR,
                te_pan.BOOK_NO,
                tm.RDOCT_NO,
             TO_CHAR(tm.P_DATE, 'YYYY-MM-DD') AS P_DATE,
             TO_CHAR(tm.E_DATE, 'YYYY-MM-DD') AS E_DATE,
             TO_CHAR(tm.R_DATE, 'YYYY-MM-DD') AS R_DATE,
             td.TRAN_DESC,
             ta.CLASS_DESC,
             ts.SCHEDULE_NO,
              te_pan.NAME AS PAN_HOLDER_NAME,
             te_pan.CODE AS PAN_HOLDER_CODE,
                nvl((select party1 from tran_dir where upper(te.CODE)=upper(party1_code) and rownum=1),
                    (select party2 from tran_dir where upper(te.CODE)=upper(party2_code) and rownum=1)) as TYPE,
                te.CODE AS PARTY_CODE,
                te.NAME AS PARTY_NAME,
                te.ADDRESS1 AS PARTY_ADDRESS,
                te.EMAIL_ID AS PARTY_EMAIL,
                te.PHONE_NO AS PARTY_PHONE,
                ts.WARD_NO,
                ts.BLOCK_NO,
                ts.VILLAGE_CODE,
                ts.SURVEY_NO,
                ts.PLOT_NO,
                ts.NEW_HOUSE_NO,
                ts.EAST, 
                ts.WEST, 
                ts.NORTH, 
                ts.SOUTH,
                ts.EXTENT,
                ts.UNIT,
                ts.CON_VALUE,
                ts.MKT_VALUE
            FROM TRAN_SCHED ts
            JOIN TRAN_MAJOR tm 
              ON ts.sr_code = tm.sr_code 
             AND ts.book_no = tm.book_no 
             AND ts.reg_year = tm.reg_year 
             AND ts.doct_no = tm.doct_no
            JOIN TRAN_DIR td 
              ON tm.tran_maj_code = td.tran_maj_code 
             AND tm.tran_min_code = td.tran_min_code
            JOIN AREA_CLASS ta 
              ON ta.CLASS_CODE = ts.NATURE_USE
            JOIN CARD.MST_REVREGDIST dr 
              ON dr.DISTRICT_CODE = SUBSTR(LPAD(ts.VILLAGE_CODE, 7, '0'), 1, 2)
            JOIN CARD.MST_REVMANDAL md 
              ON md.DISTRICT_CODE = SUBSTR(LPAD(ts.VILLAGE_CODE, 7, '0'), 1, 2) 
             AND md.MANDAL_CODE = SUBSTR(LPAD(ts.VILLAGE_CODE, 7, '0'), 3, 2)
            JOIN HAB_CODE hv 
              ON hv.HAB_CODE = LPAD(ts.VILLAGE_CODE, 7, '0') || '01'
            JOIN SR_MASTER sr 
              ON sr.SR_CD = tm.sr_code
            LEFT JOIN TRAN_EC te_pan 
              ON te_pan.PAN_NO = :PAN_NO 
             AND te_pan.sr_code = tm.sr_code 
             AND te_pan.book_no = tm.book_no 
             AND te_pan.reg_year = tm.reg_year 
             AND te_pan.doct_no = tm.doct_no 
             AND ROWNUM = 1
            LEFT JOIN TRAN_EC te 
              ON te.sr_code = tm.sr_code 
             AND te.book_no = tm.book_no 
             AND te.reg_year = tm.reg_year 
             AND te.doct_no = tm.doct_no
            WHERE EXISTS (
                SELECT 1 
                FROM TRAN_EC te2 
                WHERE te2.PAN_NO = :PAN_NO 
                  AND te2.sr_code = ts.sr_code
                  AND te2.book_no = ts.book_no
                  AND te2.reg_year = ts.reg_year
                  AND te2.doct_no = ts.doct_no
            )
            ORDER BY tm.R_DATE DESC
        `;

            let response = await this.orDao.oDBQueryServiceWithBindParams(query, bindParams);
            let groupedData = {};
            response.forEach(row => {
                let key = `${row.SR_CODE}_${row.BOOK_NO}_${row.REG_YEAR}_${row.DOCT_NO}`;
                if (!groupedData[key]) {
                    groupedData[key] = {
                        DISTRICT: row.DISTRICT,
                        MANDAL: row.MANDAL,
                        VILLAGE: row.VILLAGE,
                        SR_CODE: row.SR_CODE,
                        SR_NAME: row.SR_NAME,
                        DOCT_NO: row.DOCT_NO,
                        REG_YEAR: row.REG_YEAR,
                        BOOK_NO: row.BOOK_NO,
                        RDOCT_NO: row.RDOCT_NO,
                        P_DATE: row.P_DATE,
                        E_DATE: row.E_DATE,
                        R_DATE: row.R_DATE,
                        TRAN_DESC: row.TRAN_DESC,
                        CLASS_DESC: row.CLASS_DESC,
                        SCHEDULE_NO: row.SCHEDULE_NO,
                        PAN_HOLDER_NAME: row.PAN_HOLDER_NAME,
                        PAN_HOLDER_CODE: row.PAN_HOLDER_CODE,
                        PARTIES: [],
                        WARD_NO: row.WARD_NO,
                        BLOCK_NO: row.BLOCK_NO,
                        VILLAGE_CODE: row.VILLAGE_CODE,
                        SURVEY_NO: row.SURVEY_NO,
                        PLOT_NO: row.PLOT_NO,
                        NEW_HOUSE_NO: row.NEW_HOUSE_NO,
                        EAST: row.EAST,
                        WEST: row.WEST,
                        NORTH: row.NORTH,
                        SOUTH: row.SOUTH,
                        EXTENT: row.EXTENT,
                        UNIT: row.UNIT,
                        CON_VALUE: row.CON_VALUE,
                        MKT_VALUE: row.MKT_VALUE
                    };
                }

                if (row.PARTY_CODE) {
                    groupedData[key].PARTIES.push({
                        TYPE: row.TYPE,
                        CODE: row.PARTY_CODE,
                        NAME: row.PARTY_NAME,
                        ADDRESS: row.PARTY_ADDRESS,
                        EMAIL: row.PARTY_EMAIL,
                        PHONE: row.PARTY_PHONE,
                    });
                }
            });
            return Object.values(groupedData);
        } catch (ex) {
            Logger.error("apiForothersServices - DoctdetailsbyTAXSrvc || Error :", ex);
            console.error("apiForothersServices - DoctdetailsbyTAXSrvc || Error :", ex);
            throw constructPDEError(ex);
        }
    }    
    
    GetSlotBookingStatistics = async (reqData) => {
        try {
            const fromDate = new Date(moment(reqData.FROM_DATE, 'DD-MM-YYYY').format('YYYY-MM-DD'));
            const toDate = new Date(moment(reqData.TO_DATE, 'DD-MM-YYYY').format('YYYY-MM-DD'));
            const pipeline = [
                {
                    $match: {
                        dateForSlot: {
                            $gte: fromDate,
                            $lte: toDate
                        }
                    }
                },
                {
                    $lookup: {
                        from: "party_details",
                        let: { appId: "$applicationId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$applicationId", "$$appId"] },
                                            { $eq: ["$isPresenter", true] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "party_info"
                    }
                },
                {
                    $unwind: "$party_info"
                },
                {
                    $project: {
                        _id: 0,
                        applicationId: "$party_info.applicationId",
                        name: "$party_info.name",
                        phone: "$party_info.phone",
                        address: "$party_info.address",
                        currentAddress: "$party_info.currentAddress",
                        sroDistrict: 1,
                        sroOffice: 1,
                        dateForSlot: 1
                    }
                }
            ];

            let result = await slotModel.aggregate(pipeline);
            return result;
        } catch (ex) {
            Logger.error("apiForothersServices - GetSlotBookingStatistics || Error :", ex);
            console.error("apiForothersServices - GetSlotBookingStatistics || Error :", ex);
            throw constructPDEError(ex);
        }
    }
    getECdownloaddetails = async (reqData) => {
        try {
            let query = `select request_no as registration_id, certificate_no as certification_id, requested_by as applicatant_name,sro_name
                         from srouser.public_ec_status where status = 'E' and trunc(time_stamp) between to_date(:FROM_DATE,'DD-MM-YYYY') and to_date(:TO_DATE,'DD-MM-YYYY') and certificate_no is not null`;
            let bindParams = {
                FROM_DATE: reqData.FROM_DATE,
                TO_DATE: reqData.TO_DATE,
            };

            const result = await this.orDao.ReadoDBQueryServiceWithBindParams(query, bindParams);
            return result;
        } catch (ex) {
            Logger.error("apiForothersServices - getECdownloaddetails || Error :", ex);
            console.error("apiForothersServices - getECdownloaddetails || Error :", ex);
            throw constructPDEError(ex);
        }
    }
    getCCdownloaddetails = async (reqData) => {
        try {
            let query = `select (select sr_name from sr_master where sr_cd = sr_code) as sr_name,
            app_id as applicatant_id, requested_by as applicant_name
            from srouser.public_cc_status
            where trunc(time_stamp) between to_date(:FROM_DATE,'DD-MM-YYYY') and to_date(:TO_DATE,'DD-MM-YYYY') and status in ('RD', 'DD')
            order by (select sr_name from sr_master where sr_cd = sr_code)`;
            let bindParams = {
                FROM_DATE: reqData.FROM_DATE,
                TO_DATE: reqData.TO_DATE,
            };

            const result = await this.orDao.ReadoDBQueryServiceWithBindParams(query, bindParams);
            return result;
        } catch (ex) {
            Logger.error("apiForothersServices - getCCdownloaddetails || Error :", ex);
            console.error("apiForothersServices - getCCdownloaddetails || Error :", ex);
            throw constructPDEError(ex);
        }
    }   
    
        GetTotalregistartiondetails = async (reqData) => {
        try {
            let query = `SELECT DISTINCT a.app_id,(select sr_name from sr_master p where p.sr_cd=a.sr_code and rownum=1) as register_sr_name,
                         (select sr_name from sr_master l where l.sr_cd=d.jurisdiction and rownum=1) as Property_sr_name,
                         d.rdoct_no, d.ryear,b.p_name as Applicant_name,i.age,CASE WHEN UPPER(i.gender) = 'F' THEN 'Female' WHEN UPPER(i.gender) = 'M' THEN 'Male' ELSE 'Others' END AS gender,c.phone_no as contact_number, f.district_name,g.mandal_name, h.village_name
                         FROM pde_doc_status_cr a
                         JOIN tran_major b ON a.sr_code = b.sr_code  AND a.book_no = b.book_no AND a.doct_no = b.doct_no AND a.reg_year = b.reg_year
                         JOIN tran_ec c ON a.sr_code = c.sr_code AND a.book_no = c.book_no AND a.doct_no = c.doct_no AND a.reg_year = c.reg_year AND b.p_name=c.name and b.p_code=c.code
                         JOIN SROUSER.tran_ec_AADHAR_ESIGN i on a.sr_code = i.sr_code AND a.book_no = i.book_no AND a.doct_no = i.doct_no AND a.reg_year = i.reg_year AND b.p_name=i.A_NAME and b.p_code=substr(i.code,1,2)
                         JOIN tran_sched d ON a.sr_code = d.sr_code AND a.book_no = d.book_no AND a.doct_no = d.doct_no AND a.reg_year = d.reg_year
                         JOIN hab_match e ON d.village_code || '01' = e.hab_code
                         JOIN card.mst_revdist   f ON substr(e.webland_code, 1, 2) = f.district_code
                         JOIN card.mst_revmandal g ON substr(e.webland_code, 3, 2) = g.mandal_code AND g.district_code = f.district_code
                         JOIN hab_code h ON e.hab_code=h.hab_code
                         WHERE trunc(b.r_date) BETWEEN TO_DATE(:FROM_DATE, 'DD-MM-YYYY') AND TO_DATE(:TO_DATE, 'DD-MM-YYYY') and a.doc_assign='Y' and d.rdoct_no is not null`;
            let bindParams = {
                FROM_DATE: reqData.FROM_DATE,
                TO_DATE: reqData.TO_DATE,
            };

            const result = await this.orDao.ReadoDBQueryServiceWithBindParams(query, bindParams);
            return result;
        } catch (ex) {
            Logger.error("apiForothersServices - GetTotalregistartiondetails || Error :", ex);
            console.error("apiForothersServices - GetTotalregistartiondetails || Error :", ex);
            throw constructPDEError(ex);
        }
    }
    getScheuleTime = async (reqData) => {
        try {
            let query = '';
            let bindParams = {};
                query = `select * from card.api_access_time where dept_type=:dept_type`;
 
                bindParams = {
                    DEPT_TYPE: reqData.dept_type
                }
            const result = await this.orDao.oDBQueryServiceWithBindParams(query, bindParams);
            return result;
 
        } catch (ex) {
            Logger.error("apiForothersServices - getDocumentECService || Error:", ex);
            console.error("apiForothersServices - getDocumentECService || Error:", ex);
            throw ex;
        }
    }

    getFileDownload = async (reqData) =>{
        try {
            let valquery = `SELECT count(*) as COUNT FROM cardimages.digitally_sign_docs WHERE SR_CODE = :SR_CODE  AND BOOK_NO = :BOOK_NO  AND REG_YEAR = :REG_YEAR  AND DOCT_NO = :DOCT_NO`;
            let bindParamsFetch = {
                SR_CODE: reqData.srCode,
                BOOK_NO: reqData.bookNo,
                REG_YEAR: reqData.regYear,
                DOCT_NO: reqData.doctNo
            };
            let valresponse;
            let pdfvalresponse;
            valresponse = await this.orDao.ReadoDBQueryServiceWithBindParams(valquery, bindParamsFetch);
            let bindParams = {
                SR_CODE: reqData.srCode,
                BOOK_NO: reqData.bookNo,
                DOCT_NO: reqData.doctNo,
                REG_YEAR: reqData.regYear
            };
            if (valresponse[0]?.COUNT === 0) {
                let pdfvalquery = `select count(*) as COUNT from img_base_cca WHERE sro_code = :SR_CODE AND book_no = :BOOK_NO AND ryear = :REG_YEAR AND rdoct_no = :DOCT_NO`;
                pdfvalresponse = await this.orDao.ReadoDBQueryServiceWithBindParams(pdfvalquery, bindParams);
            }
            if (pdfvalresponse[0]?.COUNT <= 0 && valresponse[0]?.COUNT <= 0) {
                return {
                    status: false,
                    message: "We couldn't locate the document details. Please verify the document details and try again.",
                };
            }
            let ccData = encodeURIComponent(JSON.stringify(bindParams));
            ccData = EncryptAdrwithPkcs(ccData);
            let docLink = `${process.env.PDE_UI}/CCdownloadPage?data=${ccData}`;
            return docLink;
        } catch (ex) {
            Logger.error("apiForothersServices - getFileDownload || Error :", ex);
            console.error("apiForothersServices - getFileDownload || Error :", ex);
            throw constructPDEError(ex);
        }
    }
    MangoosedDbToOrcaleDBSrc = async (reqData) => {
        try {
            const fromDateParts = reqData.FROM_DATE.split("-");
            const toDateParts = reqData.TO_DATE.split("-");
            const fromDate = new Date(`${fromDateParts[2]}-${fromDateParts[1]}-${fromDateParts[0]}T00:00:00.000Z`);
            const toDate = new Date(`${toDateParts[2]}-${toDateParts[1]}-${toDateParts[0]}T23:59:59.999Z`);
            const pipeline = [
                {
                    $match: {
                        status: "SYNCED",
                        createdAt: {
                            $gte: fromDate,
                            $lte: toDate
                        }
                    }
                },
                {
                    $lookup: {
                        from: "party_details",
                        localField: "documentId",
                        foreignField: "applicationId",
                        as: "partyData"
                    }
                },
                { $unwind: "$partyData" },
                {
                    $match: {
                        "partyData.partyType": "Firms/Company"
                    }
                },
                {
                    $group: {
                        _id: "$documentId",
                        representSubTypes: { $addToSet: "$partyData.representSubType" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        documentId: "$_id",
                        representSubTypes: 1
                    }
                }
            ]
            const docs = await DocumentDetailsDb.aggregate(pipeline)
            let count = 0
            const submitToOracle = await docs.map(async (doc) => {
                let bindParams = {
                    id: doc.documentId,
                    code: (doc.representSubTypes && doc.representSubTypes[0]) || null,

                }
                let query = `UPDATE preregistration.executants_claimant SET parties = 'FIRMS' WHERE id = :id AND code = :code`
                let response = await this.orDao.oDbUpdateWithBindParams(query, bindParams);
                count = count + response
            });
            await Promise.all(submitToOracle)
            return count;
        } catch (ex) {
            Logger.error("apiForothersServices - DoctdetailsbyTAXSrvc || Error :", ex);
            console.error("apiForothersServices - DoctdetailsbyTAXSrvc || Error :", ex);
            throw constructPDEError(ex);
        }
    }

    mutationsuccesscount = async (reqData) => {
    try {
        let query = `SELECT DISTINCT 
               pds.app_id,
               ec.entry_date,
               CASE 
                 WHEN ms.time_stamp IS NOT NULL THEN ms.time_stamp
                 ELSE mu.time_stamp
               END AS approve_date,
               CASE 
                 WHEN ms.doct_no IS NOT NULL THEN 'RURAL'
                 WHEN mu.doct_no IS NOT NULL THEN 'URBAN'
               END AS property,
               ts.mkt_value
         FROM preregistration.executants_claimant ec
         JOIN pde_doc_status_cr pds
           ON ec.id = pds.app_id
         JOIN tran_major tm
           ON pds.sr_code  = tm.sr_code
          AND pds.book_no  = tm.book_no
          AND pds.doct_no  = tm.doct_no
          AND pds.reg_year = tm.reg_year
        LEFT JOIN srouser.mutation_sent_cr ms 
           ON pds.sr_code = ms.sr_code
          AND pds.book_no = ms.book_no
          AND pds.doct_no = ms.doct_no
          AND pds.reg_year = ms.reg_year
        LEFT JOIN srouser.mutation_sent_urban_cr mu 
           ON pds.sr_code = mu.sr_code
          AND pds.book_no = mu.book_no
          AND pds.doct_no = mu.doct_no
          AND pds.reg_year = mu.reg_year
        JOIN tran_ec te 
           ON pds.sr_code = te.sr_code
          AND pds.book_no = te.book_no
          AND pds.doct_no = te.doct_no
          AND pds.reg_year = te.reg_year
          join tran_sched ts on
        pds.sr_code = ts.sr_code and 
        pds.book_no = ts.book_no and
        pds.doct_no = ts.doct_no and
        pds.reg_year = ts.reg_year
        WHERE ec.parties = 'FIRMS'
          AND (mu.doct_no IS NOT NULL OR ms.doct_no IS NOT NULL)
          AND (
                (tm.tran_maj_code = '01' AND tm.tran_min_code IN ('01','04','05','06','08','14','15','16','17','19','27','28','29'))
             OR (tm.tran_maj_code = '03' AND tm.tran_min_code IN ('01','02','03','04','05','06','07','08','09'))
             OR (tm.tran_maj_code = '04' AND tm.tran_min_code IN ('01','02'))
             OR (tm.tran_maj_code = '05' AND tm.tran_min_code IN ('01','02'))
             OR (tm.tran_maj_code = '06' AND tm.tran_min_code ='01')
              )
          AND tm.r_date BETWEEN TO_DATE(:from_date, 'DD-MM-YYYY') 
                            AND TO_DATE(:to_date, 'DD-MM-YYYY')`;

        let bindParams = {
            FROM_DATE: reqData.FROM_DATE,
            TO_DATE: reqData.TO_DATE,
        };

        const result = await this.orDao.ReadoDBQueryServiceWithBindParams(query, bindParams);
        let finalResults = result.map(row => ({
            app_id: row.APP_ID,
            entry_date: row.ENTRY_DATE,
            mutation_date: row.APPROVE_DATE,
            property_type: row.PROPERTY,
            fees: row.MKT_VALUE,
            total_fees: 'null'
        }));

        return finalResults;

    } catch (ex) {
        Logger.error("apiForothersServices - mutationsuccesscount || Error :", ex);
        console.error("apiForothersServices - mutationsuccesscount || Error :", ex);
        throw constructPDEError(ex);
    }
}

    getDocsDetailsSrvc = async (reqData) => {
        try {
            let bindParams = {
                SR_CODE: reqData.SRCODE,
                BOOK_NO: reqData.BOOKNO,
                DOCT_NO: reqData.DOCNO,
                REG_YEAR: reqData.RYEAR            
            }
            let query = `SELECT 
                tm.sr_code AS SR_CODE,
                (select sr_name from sr_master where sr_cd = tm.sr_code) as SR_NAME,
                tm.BOOK_NO,
                tm.RDOCT_NO as doct_no,
                tm.RYEAR as reg_year,
            (select TRAN_DESC from tran_dir where tran_maj_code = tm.tran_maj_code AND tran_min_code = tm.tran_min_code) as TRAN_DESC
            FROM TRAN_MAJOR tm 
            WHERE SR_CODE = :SR_CODE AND RDOCT_NO = :DOCT_NO AND RYEAR = :REG_YEAR AND BOOK_NO = :BOOK_NO
            and tran_maj_code = '01' and tran_min_code in ('01', '03', '09', '10', '11') and trunc(r_date) >= to_date('2021','YYYY')
            ORDER BY tm.sr_code, tm.doct_no, tm.book_no, tm.reg_year
            `;
            const propertyQuery = `select 
                            ts.schedule_no,
                            dr.DR_NAME AS DISTRICT,
                                    md.MANDAL_NAME AS MANDAL,
                                    hv.VILLAGE_NAME AS VILLAGE,
                                    ts.WARD_NO,
                                    ts.BLOCK_NO,
                                    ts.SURVEY_NO,
                                    ts.LOC_HAB_NAME,
                                    ts.DOORNO,
                                    CASE WHEN ad.SELLING_EXTENT IS NOT NULL THEN TO_CHAR(ad.SELLING_EXTENT)
                                        WHEN ts.EXTENT IS NOT NULL THEN NVL(TO_CHAR(ts.EXTENT), ' ')
                                    ELSE ' ' END AS SITE_EXTENT,
                                    CASE WHEN ad.SELLING_EXTENT IS NOT NULL THEN 'A'
                                        WHEN ts.EXTENT IS NOT NULL THEN NVL(TRIM(BOTH ',' FROM TO_CHAR(ts.UNIT)), ' ')
                                    ELSE ' ' END AS SITE_UNIT,
                                    ts.EAST, 
                                    ts.WEST, 
                                    ts.NORTH, 
                                    ts.SOUTH,
                                    ts.MKT_VALUE as market_value,
                            (select CLASS_DESC from AREA_CLASS where CLASS_CODE = ts.NATURE_USE) as CLASS_DESC
                            from tran_sched ts
                            left JOIN CARD.MST_REVREGDIST dr 
                            ON dr.DISTRICT_CODE = SUBSTR(LPAD(ts.VILLAGE_CODE, 7, '0'), 1, 2)
                            left JOIN CARD.MST_REVMANDAL md 
                            ON md.DISTRICT_CODE = SUBSTR(LPAD(ts.VILLAGE_CODE, 7, '0'), 1, 2) 
                            AND md.MANDAL_CODE = SUBSTR(LPAD(ts.VILLAGE_CODE, 7, '0'), 3, 2)
                            left JOIN HAB_CODE hv 
                            ON hv.HAB_CODE = LPAD(ts.VILLAGE_CODE, 7, '0') || '01'
                            left join adangal_details ad on 
                                ad.sr_code = ts.sr_code and
                                ad.book_no = ts.book_no and
                                ad.doct_no = ts.doct_no and
                                ad.reg_year = ts.reg_year and
                                ad.schedule_no = ts.schedule_no
                            where ts.SR_CODE = :SR_CODE AND ts.RDOCT_NO = :DOCT_NO AND ts.RYEAR = :REG_YEAR AND ts.BOOK_NO = :BOOK_NO
                            order by ts.schedule_no`;
            const partyQuery = `select 
                nvl((select party1 from tran_dir where upper(CODE)=upper(party1_code) and rownum=1),
                (select party2 from tran_dir where upper(CODE)=upper(party2_code) and rownum=1)) as TYPE,
                CODE AS PARTY_CODE,
                NAME AS PARTY_NAME,
                ADDRESS1 AS PARTY_ADDRESS,
                EMAIL_ID AS PARTY_EMAIL,
                PHONE_NO AS PARTY_PHONE
                from tran_ec
                where SR_CODE = :SR_CODE AND RDOCT_NO = :DOCT_NO AND RYEAR = :REG_YEAR AND BOOK_NO = :BOOK_NO
                order by code, ec_number`;
            let response = await this.orDao.ReadoDBQueryServiceWithBindParams(query, bindParams);
            if(response.length == 0){
                throw new Error("No records found for the provided criteria.");
            }
            let propertyResponse = await this.orDao.ReadoDBQueryServiceWithBindParams(propertyQuery, bindParams);          
            let partyResponse = await this.orDao.ReadoDBQueryServiceWithBindParams(partyQuery, bindParams);
            let valquery = `SELECT count(*) as COUNT FROM cardimages.digitally_sign_docs WHERE SR_CODE=${reqData.SRCODE} AND BOOK_NO=${reqData.BOOKNO} AND REG_YEAR = ${reqData.RYEAR} AND DOCT_NO=${reqData.DOCNO}`;
            let valresponse, pdfvalresponse;
            valresponse = await this.orDao.oDBQueryServiceCC(valquery);
            // If not found in TIFF table, check in PDF table (img_base_cca)
            if (valresponse[0]?.COUNT === 0) {
                let pdfvalquery = `select count(*) as COUNT from img_base_cca WHERE sro_code = :SR_CODE AND RDOCT_NO = :DOCT_NO AND RYEAR = :REG_YEAR AND BOOK_NO = :BOOK_NO and location is not null`;
                pdfvalresponse = await this.orDao.ReadoDBQueryServiceWithBindParams(pdfvalquery, bindParams);
            }
            // if (pdfvalresponse[0]?.COUNT <= 0 && valresponse[0]?.COUNT <= 0) {
            // throw new Error("For this document, digital signature is not completed yet. Please try again later.");
            // }                
            // let ccData = encodeURIComponent(JSON.stringify(bindParams));
            // ccData = EncryptAdrwithPkcs(ccData);
            // const REGDOCUMENTLINK = `${process.env.PDE_UI}/CCdownloadPage?data=${ccData}`;
            const groupedData = {
                SR_CODE: response[0].SR_CODE,
                SR_NAME: response[0].SR_NAME,
                DOCT_NO: response[0].DOCT_NO,
                REG_YEAR: response[0].REG_YEAR,
                BOOK_NO: response[0].BOOK_NO,
                P_DATE: response[0].P_DATE,
                E_DATE: response[0].E_DATE,
                R_DATE: response[0].R_DATE,
                TRAN_DESC: response[0].TRAN_DESC,
                // REGDOCUMENTLINK: REGDOCUMENTLINK,
                PARTIES: partyResponse,
                SCHEDULES: propertyResponse
            }
            if(groupedData) {
                let requestLogQuery = `INSERT INTO SROUSER.CC_REQUEST_RECORD ( SR_CODE, BOOK_NO, DOCT_NO, REG_YEAR, REQUEST_BY, REQ_NO) VALUES ( :SR_CODE, :BOOK_NO, :DOCT_NO, :REG_YEAR, :REQUEST_BY, (SELECT NVL(MAX(REQ_NO), 0) + 1 FROM SROUSER.CC_REQUEST_RECORD) )`         
                await this.orDao.oDbInsertDocsWithBindParams(requestLogQuery, {...bindParams, REQUEST_BY : 'Commercial TAX'});
            }
            return groupedData;
        } catch (ex) {
            Logger.error("apiForothersServices - getDocsDetailsSrvc || Error :", ex);
            console.error("apiForothersServices - getDocsDetailsSrvc || Error :", ex);
            throw constructPDEError(ex);
        }
    }

    getRunningStatus = async (reqData) => {
        try {
            const statusQuery = `SELECT * FROM srouser.third_party_run_status WHERE DEPT_TYPE = :DEPT_TYPE and DATA_TYPE = :DATA_TYPE`;
            const bindParams = {
                DEPT_TYPE: reqData.DEPT_TYPE,
                DATA_TYPE: reqData.DATA_TYPE
            }
            const response = await this.orDao.ReadoDBQueryServiceWithBindParams(statusQuery, bindParams);
            if(response.length > 0 && response[0]?.STATUS === 'P') {
                return false;
            }
            let query = response.length > 0 ? 
                `update srouser.third_party_run_status set status = 'P', time_stamp = SYSTIMESTAMP WHERE DEPT_TYPE = :DEPT_TYPE and DATA_TYPE = :DATA_TYPE`
                :
                `insert into srouser.third_party_run_status (dept_type, data_type, status, time_stamp) values (:DEPT_TYPE, :DATA_TYPE, 'P', SYSTIMESTAMP)`;
            const result = await this.orDao.oDbInsertDocsWithBindParams(query, bindParams);
            return result;
        } catch (ex) {
            Logger.error("apiForothersServices - getRunningStatus || Error :", ex);
            console.error("apiForothersServices - getRunningStatus || Error :", ex);
            throw constructPDEError(ex);
        }
    }

    updateProcessingData = async (reqData) => {
        try {
            const bindParams = {
                DEPT_TYPE: reqData.DEPT_TYPE,
                DATA_TYPE: reqData.DATA_TYPE
            }
            const query = `update srouser.third_party_run_status set status = 'N', time_stamp = SYSTIMESTAMP WHERE DEPT_TYPE = :DEPT_TYPE and DATA_TYPE = :DATA_TYPE`;
            const result = await this.orDao.oDbInsertDocsWithBindParams(query, bindParams);
            return result;
        } catch (ex) {
            Logger.error("apiForothersServices - updateProcessingData || Error :", ex);
            console.error("apiForothersServices - updateProcessingData || Error :", ex);
            throw constructPDEError(ex);
        }
    }

    getDoctApdtcpSchedleDataSrc = async (reqData) => {

        try {
             let query = '';
              // let bindParams = {};
    
          let  bindParams = {
                survey_no: reqData.survey_no,
                SRO_CODE:reqData.SRO_CODE,
                VILLAGE_CODE:reqData.VILLAGE_CODE
            }
                query = `SELECT TD.SR_CODE ,TD.BOOK_NO ,TD.RDOCT_NO ,TD.REG_YEAR ,TD.SCHEDULE_NO,DR.DR_NAME AS SURVEYNODISTNAME,DM.NEW_MANDAL_NAME AS SURVEYNOMANDALNAME,HB.VILLAGE_NAME AS SURVEYNOVILLAGENAME,SUBSTR(LPAD(TD.VILLAGE_CODE, 7, '0'), 1, 2) AS SURVEYNODISTCD, SUBSTR(LPAD(TD.VILLAGE_CODE, 7, '0'), 3, 2) AS SURVEYNOMANDCD,
                             TD.VILLAGE_CODE AS SURVEYNOVILLCODE,
                             CASE WHEN AD.S_LP_NO IS NOT NULL THEN TO_CHAR(AD.S_LP_NO)
                             WHEN TD.SURVEY_NO IS NOT NULL THEN NVL(TRIM(BOTH ',' FROM TO_CHAR(TD.SURVEY_NO)), ' ')
                             ELSE ' ' END AS SURVEYNOS,
                             CASE WHEN AD.TOTAL_EXTENT IS NOT NULL THEN TO_CHAR(AD.TOTAL_EXTENT)
                             WHEN TD.SURVEY_EXT IS NOT NULL THEN NVL(TRIM(BOTH ',' FROM TO_CHAR(TD.SURVEY_EXT)), ' ')
                             ELSE ' ' END AS SURVEYEXTENT,
                             CASE  WHEN AD.TOTAL_EXTENT IS NOT NULL THEN 'A'
                             WHEN TD.SURVEY_EXT_UNIT IS NOT NULL THEN NVL(TRIM(BOTH ',' FROM TO_CHAR(TD.SURVEY_EXT_UNIT)), ' ')
                             ELSE ' ' END AS SURVEYEXTENTUNIT,
                             CASE WHEN AD.SELLING_EXTENT IS NOT NULL THEN TO_CHAR(AD.SELLING_EXTENT)
                             WHEN TD.EXTENT IS NOT NULL THEN NVL(TO_CHAR(TD.EXTENT), ' ')
                             ELSE ' ' END AS SCHEDEXTENT,
                             CASE WHEN AD.SELLING_EXTENT IS NOT NULL THEN 'A'
                             WHEN TD.EXTENT IS NOT NULL THEN NVL(TRIM(BOTH ',' FROM TO_CHAR(TD.UNIT)), ' ')
                             ELSE ' ' END AS SCHEDUNIT,
                             NVL(TO_CHAR(TD.LP_NO), ' ') AS LPMNUMBER
                             FROM TRAN_SCHED TD
                             LEFT JOIN SROUSER.adangal_details AD  ON AD.SR_CODE = TD.SR_CODE AND AD.BOOK_NO = TD.BOOK_NO AND AD.DOCT_NO = TD.DOCT_NO AND AD.REG_YEAR = TD.REG_YEAR  AND AD.SCHEDULE_NO = TD.SCHEDULE_NO
                             join CARD.MST_REVREGDIST DR  ON SUBSTR(LPAD(TD.VILLAGE_CODE, 7, '0'), 1, 2) = DR.DISTRICT_CODE
                             JOIN CARD.MST_DISTRICTS_MANDALS DM on SUBSTR(LPAD(TD.VILLAGE_CODE, 7, '0'), 1, 2) = DM.NEW_REVDISTRICT_CODE AND SUBSTR(LPAD(TD.VILLAGE_CODE, 7, '0'), 3, 2) = DM.NEW_MANDAL_CODE
                             JOIN HAB_CODE HB ON HB.HAB_CODE = TD.VILLAGE_CODE||'01'
    where td.VILLAGE_CODE = :VILLAGE_CODE   and td.JURISDICTION = :SRO_CODE AND (
       (',' || td.survey_no || ',') LIKE '%,' || :survey_no || ',%'
    OR (',' || ad.s_lp_no    || ',') LIKE '%,' || :survey_no || ',%'
    )                             ORDER BY TD.SCHEDULE_NO`;

            const result = await this.orDao.ReadoDBQueryServiceWithBindParams(query, bindParams);
 
            if (!result || result.length <= 0) {
                return {
                    message: "We couldn't locate the document details. Please verify the document details and try again.",
                };
    
            }
            let allDetails = [];
            for(const res of result){ 
            let bindParams2 = {
                SRCODE:res.SR_CODE,
                DOCNO:res.RDOCT_NO,
                RYEAR:res.REG_YEAR,
                BOOKNO:res.BOOK_NO
            }
           let  query2 = `SELECT Code AS PartyCode,
      (SELECT PARTY1 FROM tran_dir WHERE party1_code = E.CODE AND ROWNUM = 1 AND PARTY1 IS NOT NULL
       UNION
       SELECT PARTY2 FROM tran_dir WHERE party2_code = E.CODE AND ROWNUM = 1 AND PARTY1 IS NOT NULL) PARTYDESC,
      e.name AS PartyName,
      R_code || '/o ' || NVL(e.R_NAME, (SELECT b.NAME FROM tran_ec_firms b WHERE b.sr_code = e.sr_code AND b.book_no = e.book_no AND b.doct_no = e.doct_no AND b.reg_year = e.reg_year AND b.code = e.code AND b.EC_NUMBER = e.EC_NUMBER AND ROWNUM = 1)) AS RelationName,
      NVL(e.ADDRESS1 || e.ADDRESS2, (SELECT b.ADDRESS1 || b.ADDRESS2 FROM tran_ec_firms b WHERE b.sr_code = e.sr_code AND b.book_no = e.book_no AND b.doct_no = e.doct_no AND b.reg_year = e.reg_year AND b.code = e.code AND b.EC_NUMBER = e.EC_NUMBER AND ROWNUM = 1)) AS Address,
      e.aadhar_encrpt
      FROM tran_ec e
      WHERE e.sr_code = :SRCODE AND e.rdoct_no = :DOCNO AND e.ryear = :RYEAR AND e.book_no = :BOOKNO
      ORDER BY partycode`;
            const partyresult = await this.orDao.ReadoDBQueryServiceWithBindParams(query2, bindParams2);
           const sanitizedParties = partyresult.map(party => {
            let maskedAadhar = null;
                if (party.AADHAR_ENCRPT) {
                    try {
                       const decryptedAadhar = AadhardecryptData(party.AADHAR_ENCRPT);
                        maskedAadhar = maskAadhaar(decryptedAadhar);
                         } catch (error) {
                                         Logger.error("Error decrypting Aadhar number for party:",
                                                        party.PARTY_CODE,
                                                        error
                                                    );
                                                }
                                            }
                        const { AADHAR_ENCRPT, ...safeParty } = party;
                            return {
                                ...safeParty,
                                AADHAR: maskedAadhar
                            };
                    });

                            allDetails.push({
                                  Document: res,
                                  Parties: sanitizedParties
                            });
        }
            return {
                NoofRegistrations: result.length,
                DetailsofRegistrations: allDetails
    
              };
    
        } catch (ex) {
            Logger.error("apiForothersServices - getDocumentECService || Error:", ex);
            console.error("apiForothersServices - getDocumentECService || Error:", ex);
            throw ex;
    
        }
    
    }
getMvUnitRateService = async ({ HABITATION, WARD, BLOCK, DOORNO, LOCALITY, CLASSIFICATION }) => {
  try {
    const params = { WARD, BLOCK };
    // 1) Fetch HAB_CODE using WEBLAND_CODE
    const habCodeQuery = `
      SELECT SUBSTR(hab_code, 1, 7) || '01' AS HAB_CODE
      FROM hab_match 
      WHERE webland_code = :HABITATION 
        AND ROWNUM = 1
    `;
    let HabcodeResult = await this.orDao.oDBQueryServiceWithBindParams(
      habCodeQuery,
      { HABITATION }
    );
    let HABITATIONNew = null;
    if (HabcodeResult?.length) {
      HABITATIONNew = HabcodeResult[0].HAB_CODE;
    } else {
      return { success: false, message: "Invalid HABITATION code provided." };
    }
    // 1) FORM-2 (Door No)
    const form2Query = `
      SELECT a.habitation, a.ward_no, a.block_no,
             a.unit_rate, a.tr_door_no AS door_no,
             TO_CHAR(a.effective_date,'DD-MM-YYYY') AS effective_date
        FROM sromstr.mv_basic_urb_reg a
       WHERE a.habitation = :HABITATION
         AND a.ward_no   = :WARD
         AND a.block_no  = :BLOCK
         AND a.tr_door_no = :DOORNO
         AND ROWNUM = 1
    `;
    let result = await this.orDao.oDBQueryServiceWithBindParams(
      form2Query,
      { ...params, HABITATION: HABITATIONNew, DOORNO }
    );
    if (result?.length) return { success: true, data: result };
    // 2) FORM-1 (With LOCALITY)
    if (LOCALITY) {
      const form1LocalityQuery = `
        SELECT a.habitation, a.locality_street AS locality,
               a.ward_no, a.block_no,
               a.unit_rate_res AS unit_rate,
               (SELECT class_desc 
                  FROM area_class i 
                 WHERE i.class_code = a.classification 
                   AND ROWNUM = 1) AS type,
               TO_CHAR(a.effective_date,'DD-MM-YYYY') AS effective_date
          FROM sromstr.mv_urb_loc_reg a
         WHERE a.habitation = :HABITATION
           AND a.ward_no = :WARD
           AND a.block_no = :BLOCK
           AND a.locality_street = :LOCALITY
           AND a.classification = :CLASSIFICATION
         ORDER BY unit_rate_res DESC
         FETCH FIRST 1 ROW ONLY
      `;
      result = await this.orDao.oDBQueryServiceWithBindParams(
        form1LocalityQuery,
        { ...params, LOCALITY, CLASSIFICATION, HABITATION: HABITATIONNew }
      );
      if (result?.length) return { success: true, data: result };
    }
    // 3) FORM-1 (Fallback)
    const form1FallbackQuery = `
      SELECT a.habitation, a.ward_no, a.block_no,
             a.unit_rate_res AS unit_rate,
             (SELECT class_desc 
                FROM area_class i 
               WHERE i.class_code = a.classification 
                 AND ROWNUM = 1) AS type,
             TO_CHAR(a.effective_date,'DD-MM-YYYY') AS effective_date
        FROM sromstr.mv_urb_loc_reg a
       WHERE a.habitation = :HABITATION
         AND a.ward_no = :WARD
         AND a.block_no = :BLOCK
         AND a.classification = :CLASSIFICATION
       ORDER BY unit_rate_res DESC
       FETCH FIRST 1 ROW ONLY
    `;
    result = await this.orDao.oDBQueryServiceWithBindParams(
      form1FallbackQuery,
      { ...params, CLASSIFICATION, HABITATION: HABITATIONNew }
    );
    if (result?.length) return { success: true, data: result };
    // No data found anywhere
    return { success: false, message: "No unit rate found for the given inputs." };
  } catch (error) {
    Logger.error("getMvUnitRateService Error:", error);
    return {
      success: false,
      message: "Failed to fetch MV Unit Rate due to an internal error."
    };
  }
};
getdoctransactiondatabypansrvc = async (reqData) => {
        try {
            const bindParams = { PAN_NO: reqData.PAN_NO };
            const query = `SELECT 
            dr.DR_NAME AS DISTRICT,
            md.MANDAL_NAME AS MANDAL,
            hv.VILLAGE_NAME AS VILLAGE,
            te_pan.sr_code AS SR_CODE,
            sr.SR_NAME,
            te_pan.DOCT_NO,
            te_pan.REG_YEAR,
            te_pan.BOOK_NO,
            tm.RDOCT_NO,
            TO_CHAR(tm.P_DATE, 'YYYY-MM-DD') AS P_DATE,
            TO_CHAR(tm.E_DATE, 'YYYY-MM-DD') AS E_DATE,
            TO_CHAR(tm.R_DATE, 'YYYY-MM-DD') AS R_DATE,
            td.TRAN_DESC,
            ta.CLASS_DESC,
            ts.SCHEDULE_NO,
            te_pan.NAME AS PAN_HOLDER_NAME,
            te_pan.CODE AS PAN_HOLDER_CODE,
            NVL(
                (SELECT party1 FROM tran_dir WHERE UPPER(te.CODE)=UPPER(party1_code) AND ROWNUM=1),
                (SELECT party2 FROM tran_dir WHERE UPPER(te.CODE)=UPPER(party2_code) AND ROWNUM=1)
            ) AS PARTY_TYPE,
            te.CODE AS PARTY_CODE,
            te.NAME AS PARTY_NAME,
            te.ADDRESS1 AS PARTY_ADDRESS,
            te.EMAIL_ID AS PARTY_EMAIL,
            te.PHONE_NO AS PARTY_PHONE,
            ts.WARD_NO,
            ts.BLOCK_NO,
            ts.VILLAGE_CODE,
            ts.SURVEY_NO,
            ts.PLOT_NO,
            ts.NEW_HOUSE_NO,
            ts.EAST,
            ts.WEST,
            ts.NORTH,
            ts.SOUTH,
            ts.EXTENT,
            ts.UNIT,
            ts.CON_VALUE,
            ts.MKT_VALUE
        FROM TRAN_SCHED ts
        JOIN TRAN_MAJOR tm 
          ON ts.sr_code = tm.sr_code 
         AND ts.book_no = tm.book_no 
         AND ts.reg_year = tm.reg_year 
         AND ts.doct_no = tm.doct_no
        JOIN TRAN_DIR td 
          ON tm.tran_maj_code = td.tran_maj_code 
         AND tm.tran_min_code = td.tran_min_code
        JOIN AREA_CLASS ta 
          ON ta.CLASS_CODE = ts.NATURE_USE
          left join (
          SELECT hab_code, webland_code
                FROM (
                    SELECT hm.*, ROW_NUMBER() OVER (PARTITION BY hab_code ORDER BY webland_code) AS rn
                    FROM hab_match hm
                ) 
                WHERE rn = 1
        ) hm on hm.hab_code = ts.village_code || '01'
        JOIN CARD.MST_REVREGDIST dr 
            ON dr.DISTRICT_CODE = SUBSTR(LPAD(NVL(CASE WHEN hm.webland_code IS NOT NULL THEN SUBSTR(hm.webland_code, 1, LENGTH(hm.webland_code) - 2)END,ts.village_code), 7, '0'), 1, 2)
        JOIN CARD.MST_REVMANDAL md 
          ON md.DISTRICT_CODE = SUBSTR(LPAD(NVL(CASE WHEN hm.webland_code IS NOT NULL THEN SUBSTR(hm.webland_code, 1, LENGTH(hm.webland_code) - 2)END,ts.village_code), 7, '0'), 1, 2) 
         AND md.MANDAL_CODE = SUBSTR(LPAD(NVL(CASE WHEN hm.webland_code IS NOT NULL THEN SUBSTR(hm.webland_code, 1, LENGTH(hm.webland_code) - 2)END,ts.village_code), 7, '0'), 3, 2)
        JOIN HAB_CODE hv 
          ON hv.HAB_CODE = LPAD(ts.VILLAGE_CODE, 7, '0') || '01'
        JOIN SR_MASTER sr 
          ON sr.SR_CD = tm.sr_code
        LEFT JOIN (
          SELECT * FROM (
            SELECT te_pan.*,
                   ROW_NUMBER() OVER (
                     PARTITION BY te_pan.sr_code, te_pan.book_no, te_pan.reg_year, te_pan.doct_no
                     ORDER BY te_pan.code
                   ) rn
            FROM TRAN_EC te_pan
            WHERE te_pan.PAN_NO = :PAN_NO
          ) WHERE rn = 1
        ) te_pan 
          ON te_pan.sr_code = tm.sr_code 
         AND te_pan.book_no = tm.book_no 
         AND te_pan.reg_year = tm.reg_year 
         AND te_pan.doct_no = tm.doct_no
        LEFT JOIN TRAN_EC te 
          ON te.sr_code = tm.sr_code 
         AND te.book_no = tm.book_no 
         AND te.reg_year = tm.reg_year 
         AND te.doct_no = tm.doct_no
        WHERE EXISTS (
            SELECT 1 
            FROM TRAN_EC te2 
            WHERE te2.PAN_NO = :PAN_NO 
              AND te2.sr_code = ts.sr_code
              AND te2.book_no = ts.book_no
              AND te2.reg_year = ts.reg_year
              AND te2.doct_no = ts.doct_no
              AND te2.code IN ('RE','AY','TE','CL','LE','ME','DE','OE','AP','SP','WI')
        )
        AND NOT EXISTS (
            SELECT 1 FROM recti re
            WHERE re.L_SRCD = ts.sr_code 
              AND re.L_BNO = ts.book_no 
              AND re.L_DOCTNO = tm.RDOCT_NO 
              AND re.L_regYEAR = tm.reg_year
        )
        ORDER BY tm.R_DATE DESC`;
            const rows = await this.orDao.oDBQueryServiceWithBindParams(query, bindParams);
            if (!rows || !Array.isArray(rows) || rows.length === 0) {
                return {
                    status: true,
                    message: "Success",
                    code: "200",
                    data: []
                };
            }
            const grouped = new Map();

            for (const r of rows) {
                const sr = r.SR_CODE;
                const book = r.BOOK_NO;
                const regYear = r.REG_YEAR;
                const doct = r.DOCT_NO;
                const key = `${sr}|${book}|${regYear}|${doct}`;
                const party = {
                    TYPE: r.PARTY_TYPE === undefined ? null : r.PARTY_TYPE,
                    CODE: r.PARTY_CODE === undefined ? null : r.PARTY_CODE,
                    NAME: r.PARTY_NAME === undefined ? null : r.PARTY_NAME,
                    ADDRESS: r.PARTY_ADDRESS === undefined ? null : r.PARTY_ADDRESS,
                    EMAIL: r.PARTY_EMAIL === undefined ? null : r.PARTY_EMAIL,
                    PHONE: r.PARTY_PHONE === undefined ? null : r.PARTY_PHONE
                };

                if (!grouped.has(key)) {
                    grouped.set(key, {
                        DISTRICT: r.DISTRICT === undefined ? null : r.DISTRICT,
                        MANDAL: r.MANDAL === undefined ? null : r.MANDAL,
                        VILLAGE: r.VILLAGE === undefined ? null : r.VILLAGE,
                        SR_CODE: r.SR_CODE === undefined ? null : r.SR_CODE,
                        SR_NAME: r.SR_NAME === undefined ? null : r.SR_NAME,
                        DOCT_NO: r.DOCT_NO === undefined ? null : r.DOCT_NO,
                        REG_YEAR: r.REG_YEAR === undefined ? null : r.REG_YEAR,
                        BOOK_NO: r.BOOK_NO === undefined ? null : r.BOOK_NO,
                        RDOCT_NO: r.RDOCT_NO === undefined ? null : r.RDOCT_NO,
                        P_DATE: r.P_DATE === undefined ? null : r.P_DATE,
                        E_DATE: r.E_DATE === undefined ? null : r.E_DATE,
                        R_DATE: r.R_DATE === undefined ? null : r.R_DATE,
                        TRAN_DESC: r.TRAN_DESC === undefined ? null : r.TRAN_DESC,
                        CLASS_DESC: r.CLASS_DESC === undefined ? null : r.CLASS_DESC,
                        SCHEDULE_NO: r.SCHEDULE_NO === undefined ? null : r.SCHEDULE_NO,
                        PAN_HOLDER_NAME: r.PAN_HOLDER_NAME === undefined ? null : r.PAN_HOLDER_NAME,
                        PAN_HOLDER_CODE: r.PAN_HOLDER_CODE === undefined ? null : r.PAN_HOLDER_CODE,
                        PARTIES: [party],
                        WARD_NO: r.WARD_NO === undefined ? null : r.WARD_NO,
                        BLOCK_NO: r.BLOCK_NO === undefined ? null : r.BLOCK_NO,
                        VILLAGE_CODE: r.VILLAGE_CODE === undefined ? null : r.VILLAGE_CODE,
                        SURVEY_NO: r.SURVEY_NO === undefined ? null : r.SURVEY_NO,
                        PLOT_NO: r.PLOT_NO === undefined ? null : r.PLOT_NO,
                        NEW_HOUSE_NO: r.NEW_HOUSE_NO === undefined ? null : r.NEW_HOUSE_NO,
                        EAST: r.EAST === undefined ? null : r.EAST,
                        WEST: r.WEST === undefined ? null : r.WEST,
                        NORTH: r.NORTH === undefined ? null : r.NORTH,
                        SOUTH: r.SOUTH === undefined ? null : r.SOUTH,
                        EXTENT: r.EXTENT === undefined ? null : r.EXTENT,
                        UNIT: r.UNIT === undefined ? null : r.UNIT,
                        CON_VALUE: r.CON_VALUE === undefined ? null : r.CON_VALUE,
                        MKT_VALUE: r.MKT_VALUE === undefined ? null : r.MKT_VALUE
                    });
                } else {
                    const doc = grouped.get(key);
                    doc.PARTIES.push(party);
                }
            }
            const data = Array.from(grouped.values());
            return {
                status: true,
                message: "Success",
                code: "200",
                data: data
            };
        } catch (ex) {
            Logger.error("apiForothersServices - Document Transaction Data By Pan || Error :", ex);
            console.error("apiForothersServices - Document Transaction Data By Pan || Error :", ex);
            throw constructPDEError(ex);
        }
    }
    getppnotifysrvc = async (reqData) => {
        try {
            const bindParams = {
                VILLCODE: reqData.VILLCODE,
                WARD_NO: reqData.WARD_NO || null,
                BLOCK_NO: reqData.BLOCK_NO || null,
                DOOR_NO: reqData.DOOR_NO || null
            };
            const query = `
            SELECT
                NVL(a.door_no, '-') AS door_no,
                a.block_no AS block_no,
                a.ward_no AS ward_no,
                a.extent AS extent,
                NVL(a.noti_gaz_no, '-') AS noti_gaz_no,
                NVL(TO_CHAR(a.noti_gaz_dt, 'DD-MM-YYYY'), '-') AS noti_gaz_dt,
                NVL(a.oth_ref, '-') AS oth_ref,
                NVL(a.h_name, '-') AS h_name,
                NVL(a.village_code, '-') AS village_code,
                NVL((SELECT i.village_name FROM hab_code i WHERE i.hab_code = TO_NUMBER(a.village_code || '01') AND ROWNUM = 1), '-') AS village_name
                FROM prohb_hu a WHERE a.village_code = :villCode
                AND (:ward_no IS NULL OR a.ward_no = :ward_no)
                AND (:block_no IS NULL OR a.block_no = :block_no)
                AND (:door_no IS NULL OR a.door_no = :door_no)`;

            const rows = await this.orDao.oDBQueryServiceWithBindParams(query, bindParams);
            return {
                status: true,
                message: "Success",
                code: "200",
                data: rows
            };

        } catch (ex) {
            Logger.error(
                "apiForothersServices - PP Notify data by vill code || Error :",
                ex
            );
            console.error(
                "apiForothersServices - PP Notify data by vill code || Error :",
                ex
            );
            throw constructPDEError(ex);
        }
    };
    getLandClassificationService = async(req,data)=>{
        const nonDisputeLands = data.filter(obj => obj.isAnyDispute.trim().toLowerCase() == 'no')
        const landClassificationCodes = nonDisputeLands.map(ob => ob.LandClassification);
        const uniqueLandClassificationCodes = [...new Set(landClassificationCodes)];
        const query = `select * from card.class_mapping a join area_class b on a.reg_class_code=b.class_code where a.webland_class_code in (${uniqueLandClassificationCodes})`
        let response = await this.orDao.oDBQueryServiceWithBindParams(query, {});
        return {
            surveyNumber: req?.surveyNumber,
            villageCode: req?.villageCode,
            landClassDescription: response[0]?.CLASS_DESC
        }
    } 
    getMuncipalityCodeBasedOnVillageCode = async(villageCode)=>{
        const query=`select * from hab_match a join sromstr.municipality_codes b on  a.sr_code=b.sr_code where a.webland_code=:villageCode and rownum=1`
        let response = await this.orDao.oDBQueryServiceWithBindParams(query, {villageCode:villageCode});
        return response
    }
    getSuggestedPropertyDetailsBasedOnDoorNumber = async (params) => {
        try {
            let token = await this.villageService.UrbanTokenGeneration({ flag: 1, ulbCode: params.MUNI_CODE })
            if (typeof token !== 'string') {
                token = token.access_token
                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: `${cdmaHostURL}${cdmaAPIs.searchByDoorNumber}`,
                    headers: {
                        'Referer': `${process.env.URBAN_SERVER_IP}`,
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    data: { doorNo: params.doorNumber, ulbCode: params?.MUNI_CODE }
                };
                let response = await axios.request(config);
                if (response?.data) {
                    let finalResponse = [];
                    if (response?.data.length > 0) {
                        finalResponse = response.data.filter(obj => obj.houseNo == params.doorNumber)
                    }
                    if (finalResponse.length < 1) {
                        return {
                            status: true,
                            message: "No data found",
                            data: [],
                        }
                    }
                    //  Need to write the logic here that get the CDMA Details with the PTIN
                    const data= await this.villageService.getCDMAPropertyDetails(params.MUNI_CODE,finalResponse[0].assessmentNo,100,100);
                    return {
                        status: true,
                        message: "Success",
                        code: "200",
                        data: {
                            propertyType:data?.propertyDetails?.propertyType,
                            propertyUsage:data?.propertyDetails?.propertyUsage,
                            doorNumber:params.doorNumber,
                            assessmentNumber:finalResponse[0]?.assessmentNo
                        }
                    }
                } else {
                    return {
                        status: true,
                        message: "No data found",
                        data: [],
                    }
                }
            } else {
                return {
                    status: true,
                    message: `Token Generation failed, ${token}`,
                }
            }
        }
        catch (err) {
            Logger.error("apiForothersServices - doctdetailsSrvc || Error :", err.message);
            console.error("apiForothersServices - doctdetailsSrvc || Error :", err.message);
            throw constructPDEError(err);
        }
    }
    insertOtherDetailsService = async (payload) => {
        try {
            const { application_no, old_survey_no, new_survey_no, extent, stamp_duty, market_value, reg_fee, remarks, district, village, east_boundary, west_boundary, north_boundary, south_boundary, created_by } = payload;
            const bindParams = {
                APPLICATION_NO: application_no,
                OLD_SURVEY_NO: old_survey_no,
                NEW_SURVEY_NO: new_survey_no,
                EXTENT: extent,
                // STAMP_DUTY: stamp_duty,
                // MARKET_VALUE: market_value,
                // REG_FEE: reg_fee,
                // REMARKS: remarks,
                DISTRICT: district,
                VILLAGE: village,
                EAST: east_boundary,
                WEST: west_boundary,
                NORTH: north_boundary,
                SOUTH: south_boundary,
                CREATED_BY: created_by
            };
            const insertQuery = `INSERT INTO srouser.sadabainama_details ( APPLICATION_NO,OLD_SURVEY_NO,NEW_SURVEY_NO,EXTENT,DISTRICT,VILLAGE, EAST_BOUNDARY, WEST_BOUNDARY,NORTH_BOUNDARY,SOUTH_BOUNDARY,CREATED_BY,CREATED_DATE) VALUES (:APPLICATION_NO,
                             :OLD_SURVEY_NO,:NEW_SURVEY_NO,:EXTENT,:DISTRICT,:VILLAGE,:EAST,:WEST,:NORTH,:SOUTH,:CREATED_BY,SYSDATE)`;
            const dbResponse = await this.orDao.oDbInsertDocsWithBindParams(insertQuery, bindParams);
            return dbResponse
        } catch (ex) {
            Logger.error("apiForothersServices - doctdetailsSrvc || Error :", ex);
            console.error("apiForothersServices - doctdetailsSrvc || Error :", ex);
            if (ex?.message?.includes("ORA-00001")) {
                return {
                    status: false,
                    duplicate: true,
                    message: "Application already exists"
                };
            }
            throw constructPDEError(ex);
        }
    };

    getECDetailsforSSLRSrvc = async (reqData) => {
        try {
            let query, result = [];
            const habquery = `SELECT hab_code FROM hab_match WHERE webland_code = :VILLAGECODE || '01' AND ROWNUM = 1`;
            const habResult = await this.orDao.ReadoDBQueryServiceWithBindParams(habquery, { VILLAGECODE: reqData.VILLAGECODE });
            const bindParams = {
                VILLAGECODE: habResult?.length > 0 ? habResult[0].HAB_CODE : `${reqData.VILLAGECODE}01`,
                LPMNO : reqData.LPMNO,
                BOOKNO : 1
            }
            query = `SELECT DISTINCT sr_code, (select sr_name from sr_master where sr_cd = sr_code) as sr_name, book_no, rdoct_no, ryear
                    FROM tran_sched
                    WHERE hab_code = :VILLAGECODE and lp_no = :LPMNO and rdoct_no is not null and book_no = :BOOKNO
                    ORDER BY time_stamp DESC
                    FETCH FIRST 5 ROWS ONLY`;
            result = await this.orDao.ReadoDBQueryServiceWithBindParams(query, bindParams);
            return result;
        } catch (ex) {
            Logger.error("apiForothersServices - getECDetailsforSSLRSrvc || Error :", ex);
            console.error("apiForothersServices - getECDetailsforSSLRSrvc || Error :", ex);
            throw constructPDEError(ex);
        }
    }

    getMarketValueforSSLRSrvc = async (reqData) => {
        try {
            let query, bindParams, result, subQuery = false, propertyTypeValues = ['U', 'R'];
            const habquery = `SELECT hab_code FROM hab_match WHERE webland_code = :VILLAGECODE || '01' AND ROWNUM = 1`;
            const habResult = await this.orDao.ReadoDBQueryServiceWithBindParams(habquery, { VILLAGECODE: reqData.VILLAGECODE });
            const allBindParams = {
                VILLAGECODE: habResult?.length > 0 ? habResult[0].HAB_CODE : `${reqData.VILLAGECODE}01`,
                SURVEYNO: reqData.SURVEYNO ? reqData.SURVEYNO.match(/^(\d+)[^a-zA-Z0-9]+(.+)$/)?.[1] ?? reqData.SURVEYNO : '',
                SUBSURVEYNO: reqData.SURVEYNO ? reqData.SURVEYNO.match(/^(\d+)[^a-zA-Z0-9]+(.+)$/)?.[2] ?? '/' : '',
                CLASSIFICATION: reqData.CLASSIFICATION ?? '',
                DOORNO: reqData.DOORNO ?? '',
                WARDNO: reqData.WARDNO ?? '',
                BLOCKNO: reqData.BLOCKNO ?? ''
            }
            if (propertyTypeValues.indexOf(reqData.PROPERTYTYPE.toUpperCase()) === 0) {
                query = `select 
                            UNIT_RATE,
                            COMM_RATE,
                            COMP_FLOOR1,
                            COMP_FLOOR_OTH,
                            null as classification,
                            null as classification_name,
                            to_char(effective_date,'DD-MM-YYYY') as effective_date,
                            (select dr_name from card.mst_revregdist where district_code = SUBSTR(:VILLAGECODE,1,2) and rownum = 1) as district_name,
                            (select mandal_name from card.mst_revmandal where district_code = SUBSTR(:VILLAGECODE,1,2) and mandal_code = SUBSTR(:VILLAGECODE,3,2) and rownum = 1) as mandal_name,
                            (select village_name from hab_code where hab_code = SUBSTR(:VILLAGECODE,1,7)||'01' and rownum = 1) as village_name
                        from sromstr.mv_basic_urb_reg 
                        where habitation = :VILLAGECODE and ward_no = :WARDNO and block_no = :BLOCKNO AND DOOR_NO = :DOORNO and rownum = 1`;
                bindParams = lodash.pick(allBindParams, ['VILLAGECODE', 'WARDNO', 'BLOCKNO', 'DOORNO']);
                result = await this.orDao.ReadoDBQueryServiceWithBindParams(query, bindParams);
                if (result?.length === 0) {
                    query = `select 
                                unit_rate_res, 
                                unit_rate_com, 
                                comp_floor1, 
                                comp_floor_oth, 
                                classification, 
                                (select class_desc from area_class where class_code = classification and rownum = 1) as classification_name, 
                                to_char(effective_date,'DD-MM-YYYY') as effective_date,
                                (select dr_name from card.mst_revregdist where district_code = SUBSTR(:VILLAGECODE,1,2) and rownum = 1) as district_name,
                                (select mandal_name from card.mst_revmandal where district_code = SUBSTR(:VILLAGECODE,1,2) and mandal_code = SUBSTR(:VILLAGECODE,3,2) and rownum = 1) as mandal_name,
                                (select village_name from hab_code where hab_code = SUBSTR(:VILLAGECODE,1,7)||'01' and rownum = 1) as village_name
                            from sromstr.mv_urb_loc_reg 
                            where habitation = :VILLAGECODE and classification = :CLASSIFICATION and ward_no = :WARDNO and block_no = :BLOCKNO and rownum = 1`;
                    bindParams = lodash.pick(allBindParams, ['VILLAGECODE', 'CLASSIFICATION', 'WARDNO', 'BLOCKNO']);
                    subQuery = true;
                }
            } else if(propertyTypeValues.indexOf(reqData.PROPERTYTYPE.toUpperCase()) === 1) {
                query = `select 
                            unit_rate, 
                            classification, 
                            (select class_desc from area_class where class_code = classification and rownum = 1) as classification_name, 
                            to_char(effective_date,'DD-MM-YYYY') as effective_date,
                            (select dr_name from card.mst_revregdist where district_code = SUBSTR(:VILLAGECODE,1,2) and rownum = 1) as district_name,
                            (select mandal_name from card.mst_revmandal where district_code = SUBSTR(:VILLAGECODE,1,2) and mandal_code = SUBSTR(:VILLAGECODE,3,2) and rownum = 1) as mandal_name,
                            (select village_name from hab_code where hab_code = SUBSTR(:VILLAGECODE,1,7)||'01' and rownum = 1) as village_name
                            from sromstr.mv_basic_rur_reg 
                        where rev_vill_code = SUBSTR(:VILLAGECODE,1,7) and survey_no = :SURVEYNO and sub_survey_no = :SUBSURVEYNO and classification = :CLASSIFICATION and rownum = 1`;
                bindParams = lodash.pick(allBindParams, ['VILLAGECODE','SURVEYNO', 'SUBSURVEYNO', 'CLASSIFICATION']);
                result = await this.orDao.ReadoDBQueryServiceWithBindParams(query, bindParams);
                if (result?.length === 0) {
                    query = `select 
                                unit_rate, 
                                classification, 
                                (select class_desc from area_class where class_code = classification and rownum = 1) as classification_name, 
                                to_char(effective_date,'DD-MM-YYYY') as effective_date,
                                (select dr_name from card.mst_revregdist where district_code = SUBSTR(:VILLAGECODE,1,2) and rownum = 1) as district_name,
                                (select mandal_name from card.mst_revmandal where district_code = SUBSTR(:VILLAGECODE,1,2) and mandal_code = SUBSTR(:VILLAGECODE,3,2) and rownum = 1) as mandal_name,
                                (select village_name from hab_code where hab_code = SUBSTR(:VILLAGECODE,1,7)||'01' and rownum = 1) as village_name
                            from sromstr.mv_rur_hab_rate 
                            where rev_vill_code = SUBSTR(:VILLAGECODE,1,7) and classification = :CLASSIFICATION and rownum = 1`;
                    bindParams = lodash.pick(allBindParams, ['CLASSIFICATION', 'VILLAGECODE']);
                    subQuery = true;
                }
            } else {
                result = [];
            }
            if (result?.length === 0 && subQuery) {
                result = await this.orDao.ReadoDBQueryServiceWithBindParams(query, bindParams);
            }
            return result;
        } catch (ex) {
            Logger.error("apiForothersServices - getMarketValueforSSLRSrvc || Error :", ex);
            console.error("apiForothersServices - getMarketValueforSSLRSrvc || Error :", ex);
            throw constructPDEError(ex);
        }
    }

    getECDocsDetailsforSSLRSrvc = async (reqData) => {
        try {
            let query, result = [], docuData = [], merged = [];
            const habquery = `SELECT substr(hab_code,1,7) as hab_code FROM hab_match WHERE webland_code = :VILLAGECODE || '01' AND ROWNUM = 1`;
            const habResult = await this.orDao.ReadoDBQueryServiceWithBindParams(habquery, { VILLAGECODE: reqData.VILLAGECODE });
            const VILLAGECODE = habResult?.length > 0 ? habResult[0].HAB_CODE : reqData.VILLAGECODE;
            const lpm = await this.Lpmbasedetails(reqData);
            if (lpm && lpm.length > 0) {
                const lpNoRecords = lpm.filter(item => item.RecordType.toLowerCase() === 'lpmno');
                const syNoRecords = lpm.filter(item => item.RecordType.toLowerCase() === 'syno');
                let lpResult = [], syResult = [];
                if (lpNoRecords.length > 0) {
                    const lpNos = lpNoRecords.map(item => item['SurveyNo/LPMno']);
                    const lpBindKeys = lpNos.map((_, i) => `:lp${i}`).join(', ');
                    const lpBindParams = {};
                    lpNos.forEach((val, i) => { lpBindParams[`lp${i}`] = val; });
                    query = `SELECT DISTINCT sr_code, book_no, rdoct_no, ryear 
                         FROM tran_sched 
                         WHERE village_code = :VILLAGECODE 
                           AND lp_no IN (${lpBindKeys})
                           AND book_no = 1`;
                    lpResult = await this.orDao.ReadoDBQueryServiceWithBindParams(query, {
                        VILLAGECODE,
                        ...lpBindParams
                    });
                }
                if (syNoRecords.length > 0) {
                    const syNos = syNoRecords.flatMap(item =>
                        item['SurveyNo/LPMno'].split(',').map(s => s.trim()).filter(s => s)
                    );
                    const syBindKeys = syNos.map((_, i) => `:sy${i}`).join(', ');
                    const syBindParams = {};
                    syNos.forEach((val, i) => { syBindParams[`sy${i}`] = `,${val},`; });
                    const syQuery = `SELECT DISTINCT sr_code, book_no, rdoct_no, ryear 
                     FROM tran_sched 
                     WHERE village_code = :VILLAGECODE 
                       AND book_no = 1
                       AND survey_no IN (${syBindKeys})`;
                    syResult = await this.orDao.ReadoDBQueryServiceWithBindParams(syQuery, {
                        VILLAGECODE,
                        ...syBindParams
                    });
                }
                merged = [...lpResult, ...syResult];
            }
            else {
                query = `SELECT DISTINCT sr_code, book_no, rdoct_no, ryear 
                         FROM tran_sched 
                         WHERE village_code = :VILLAGECODE 
                           AND lp_no = :LPMNO
                           AND book_no = 1`;
                merged = await this.orDao.ReadoDBQueryServiceWithBindParams(query, { VILLAGECODE, LPMNO });
            }
            result = [...new Map(merged.map(row => [`${row.SR_CODE}_${row.RDOCT_NO}_${row.RYEAR}_${row.BOOK_NO}`, row])).values()];
            if (result && result.length > 0) {
                docuData = await Promise.all(
                    result.map(async (row) => {
                        const docDetails = await this.doctdetailsSrvc({
                            SRCODE: String(row.SR_CODE),
                            BOOKNO: String(row.BOOK_NO),
                            DOCNO: String(row.RDOCT_NO),
                            RYEAR: String(row.RYEAR),
                            USERNAME: reqData.USERNAME
                        });
                        delete docDetails?.DocDetails?.REGDOCUMENTLINK;
                        delete docDetails?.DocDetails?.DOCTYPE;
                        return docDetails;
                    })
                );
                return docuData;
            }
            return docuData;
        } catch (ex) {
            Logger.error("apiForothersServices - getECDocsDetailsforSSLRSrvc || Error :", ex);
            console.error("apiForothersServices - getECDocsDetailsforSSLRSrvc || Error :", ex);
            throw constructPDEError(ex);
        }
    };


    getECSurveyListDocsDetailsforAPCOBSrvc = async (reqData) => {
        try {
            let result = [], docuData = [];
            const habquery = `SELECT substr(hab_code,1,7) as hab_code FROM hab_match WHERE webland_code = :VILLAGECODE || '01' AND ROWNUM = 1`;
            const habResult = await this.orDao.ReadoDBQueryServiceWithBindParams(
                habquery,
                { VILLAGECODE: reqData.VILLAGECODE }
            );

            const VILLAGECODE = habResult?.length > 0 ? habResult[0].HAB_CODE : reqData.VILLAGECODE;

            const syQuery = `SELECT DISTINCT sr_code, book_no, rdoct_no, ryear FROM tran_sched WHERE village_code = :VILLAGECODE AND nature_use IN ('21', '22', '26', '44', '45', '46', '30') AND book_no = 1 AND survey_no = :SURVYNO`;

            const syResult = await this.orDao.ReadoDBQueryServiceWithBindParams(syQuery, { VILLAGECODE, SURVYNO: `,${reqData.SURVYNO},` });

            result = [
                ...new Map(
                    syResult.map((row) => [
                        `${row.SR_CODE}_${row.RDOCT_NO}_${row.RYEAR}_${row.BOOK_NO}`,
                        row
                    ])
                ).values()
            ];

            if (result.length > 0) {
                docuData = await Promise.all(
                    result.map(async (row) => {
                        const docDetails = await this.doctdetailsSrvc({
                            SRCODE: String(row.SR_CODE),
                            BOOKNO: String(row.BOOK_NO),
                            DOCNO: String(row.RDOCT_NO),
                            RYEAR: String(row.RYEAR),
                            USERNAME: reqData.USERNAME
                        });
                        if (docDetails?.DocDetails) {
                            delete docDetails.DocDetails.REGDOCUMENTLINK;
                            delete docDetails.DocDetails.DOCTYPE;
                        }
                        return docDetails;
                    })
                );
            }
            return docuData;

        } catch (ex) {
            Logger.error("apiForothersServices - getECSurveyListDocsDetailsforAPCOBSrvc || Error :", ex);
            console.error("apiForothersServices - getECSurveyListDocsDetailsforAPCOBSrvc || Error :", ex);
            throw constructPDEError(ex);
        }
    };

    getECLPMDocsDetailsforAPCOBSrvc = async (reqData) => {
        try {
            let query, result = [], docuData = [], merged = [];
            const habquery = `SELECT substr(hab_code,1,7) as hab_code FROM hab_match WHERE webland_code = :VILLAGECODE || '01' AND ROWNUM = 1`;
            const habResult = await this.orDao.ReadoDBQueryServiceWithBindParams(habquery, { VILLAGECODE: reqData.VILLAGECODE });
            const VILLAGECODE = habResult?.length > 0 ? habResult[0].HAB_CODE : reqData.VILLAGECODE;
            const lpm = await this.Lpmbasedetails(reqData);
            if (lpm && lpm.length > 0) {
                const lpNoRecords = lpm.filter(item => item.RecordType.toLowerCase() === 'lpmno');
                const syNoRecords = lpm.filter(item => item.RecordType.toLowerCase() === 'syno');
                let lpResult = [], syResult = [];
                if (lpNoRecords.length > 0) {
                    const lpNos = lpNoRecords.map(item => item['SurveyNo/LPMno']);
                    const lpBindKeys = lpNos.map((_, i) => `:lp${i}`).join(', ');
                    const lpBindParams = {};
                    lpNos.forEach((val, i) => { lpBindParams[`lp${i}`] = val; });
                    query = `SELECT DISTINCT sr_code, book_no, rdoct_no, ryear 
                         FROM tran_sched 
                         WHERE village_code = :VILLAGECODE 
                           AND lp_no IN (${lpBindKeys})
                           AND book_no = 1`;
                    lpResult = await this.orDao.ReadoDBQueryServiceWithBindParams(query, {
                        VILLAGECODE,
                        ...lpBindParams
                    });
                }
                if (syNoRecords.length > 0) {
                    const syNos = syNoRecords.flatMap(item =>
                        item['SurveyNo/LPMno'].split(',').map(s => s.trim()).filter(s => s)
                    );
                    const syBindKeys = syNos.map((_, i) => `:sy${i}`).join(', ');
                    const syBindParams = {};
                    syNos.forEach((val, i) => { syBindParams[`sy${i}`] = `,${val},`; });
                    const syQuery = `SELECT DISTINCT sr_code, book_no, rdoct_no, ryear 
                     FROM tran_sched 
                     WHERE village_code = :VILLAGECODE 
                       AND book_no = 1
                       AND survey_no IN (${syBindKeys})`;
                    syResult = await this.orDao.ReadoDBQueryServiceWithBindParams(syQuery, {
                        VILLAGECODE,
                        ...syBindParams
                    });
                }
                merged = [...lpResult, ...syResult];
            }
            else {
                query = `SELECT DISTINCT sr_code, book_no, rdoct_no, ryear 
                         FROM tran_sched 
                         WHERE village_code = :VILLAGECODE 
                           AND lp_no = :LPMNO
                           AND book_no = 1`;
                merged = await this.orDao.ReadoDBQueryServiceWithBindParams(query, { VILLAGECODE, LPMNO });
            }
            result = [...new Map(merged.map(row => [`${row.SR_CODE}_${row.RDOCT_NO}_${row.RYEAR}_${row.BOOK_NO}`, row])).values()];
            if (result && result.length > 0) {
                docuData = await Promise.all(
                    result.map(async (row) => {
                        const docDetails = await this.doctdetailsSrvc({
                            SRCODE: String(row.SR_CODE),
                            BOOKNO: String(row.BOOK_NO),
                            DOCNO: String(row.RDOCT_NO),
                            RYEAR: String(row.RYEAR),
                            USERNAME: reqData.USERNAME
                        });
                        delete docDetails?.DocDetails?.REGDOCUMENTLINK;
                        delete docDetails?.DocDetails?.DOCTYPE;
                        return docDetails;
                    })
                );
                return docuData;
            }
            return docuData;
        } catch (ex) {
            Logger.error("apiForothersServices - getECLPMDocsDetailsforAPCOBSrvc || Error :", ex);
            console.error("apiForothersServices - getECLPMDocsDetailsforAPCOBSrvc || Error :", ex);
            throw constructPDEError(ex);
        }
    };
    
    getLpmMarketValueforSSLRSrvc = async (reqData) => {
        try {
            let query, bindParams, result, subQuery = false;
            const habquery = `SELECT hab_code FROM hab_match WHERE webland_code = :VILLAGECODE || '01' AND ROWNUM = 1`;
            const habResult = await this.orDao.ReadoDBQueryServiceWithBindParams(habquery, { VILLAGECODE: reqData.VILLAGECODE });
            const allBindParams = {
                VILLAGECODE: habResult?.length > 0 ? habResult[0].HAB_CODE : `${reqData.VILLAGECODE}01`,
                LPMNO: reqData.LPMNO,
                CLASSIFICATION: reqData.CLASSIFICATION ?? ''
            }
            const gsstatus = `select * from gs_srcode where village_code = substr(:VILLAGECODE,1,7)`
            const lpmcheckResult = await this.orDao.ReadoDBQueryServiceWithBindParams(gsstatus, lodash.pick(allBindParams, ['VILLAGECODE']));
            query = `select 
                            unit_rate, 
                            classification, 
                            (select class_desc from area_class where class_code = classification and rownum = 1) as classification_name, 
                            to_char(effective_date,'DD-MM-YYYY') as effective_date,
                            (select dr_name from card.mst_revregdist where district_code = SUBSTR(:VILLAGECODE,1,2) and rownum = 1) as district_name,
                            (select mandal_name from card.mst_revmandal where district_code = SUBSTR(:VILLAGECODE,1,2) and mandal_code = SUBSTR(:VILLAGECODE,3,2) and rownum = 1) as mandal_name,
                            (select village_name from hab_code where hab_code = SUBSTR(:VILLAGECODE,1,7)||'01' and rownum = 1) as village_name
                            from sromstr.mv_basic_rur_reg 
                        where rev_vill_code = SUBSTR(:VILLAGECODE,1,7) and survey_no = :LPMNO and sub_survey_no = '/' and classification = :CLASSIFICATION and rownum = 1`;
            bindParams = lodash.pick(allBindParams, ['VILLAGECODE', 'LPMNO', 'CLASSIFICATION']);
            if (lpmcheckResult.length > 0) {
                const lpm = await this.Lpmbasedetails({ VILLAGECODE: reqData.VILLAGECODE, LPMNO: allBindParams.LPMNO });
                if (lpm && lpm.length > 0) {
                    const lpNoRecords = lpm.filter(item => item.RecordType.toLowerCase() === 'lpmno')
                        .sort((a, b) => b['SurveyNo/LPMno'] - a['SurveyNo/LPMno']);
                    for (let row of lpNoRecords) {
                        result = await this.orDao.ReadoDBQueryServiceWithBindParams(query, { ...bindParams, LPMNO: row['SurveyNo/LPMno']});
                        if (result.length > 0) {
                            break;
                        }
                    }
                }
            }
            else {
                throw new Error("Re-Survey is not completed for the given village code.");
            }
            if (result?.length === 0) {
                query = `select 
                                unit_rate, 
                                classification, 
                                (select class_desc from area_class where class_code = classification and rownum = 1) as classification_name, 
                                to_char(effective_date,'DD-MM-YYYY') as effective_date,
                                (select dr_name from card.mst_revregdist where district_code = SUBSTR(:VILLAGECODE,1,2) and rownum = 1) as district_name,
                                (select mandal_name from card.mst_revmandal where district_code = SUBSTR(:VILLAGECODE,1,2) and mandal_code = SUBSTR(:VILLAGECODE,3,2) and rownum = 1) as mandal_name,
                                (select village_name from hab_code where hab_code = SUBSTR(:VILLAGECODE,1,7)||'01' and rownum = 1) as village_name
                            from sromstr.mv_rur_hab_rate 
                            where rev_vill_code = SUBSTR(:VILLAGECODE,1,7) and classification = :CLASSIFICATION and rownum = 1`;
                bindParams = lodash.pick(allBindParams, ['CLASSIFICATION', 'VILLAGECODE']);
                subQuery = true;
            }
            if (result?.length === 0 && subQuery) {
                result = await this.orDao.ReadoDBQueryServiceWithBindParams(query, bindParams);
            }
            return result;
        } catch (ex) {
            Logger.error("apiForothersServices - getLpmMarketValueforSSLRSrvc || Error :", ex);
            console.error("apiForothersServices - getLpmMarketValueforSSLRSrvc || Error :", ex);
            throw constructPDEError(ex);
        }
    }
    Lpmbasedetails = async (reqData) => {
        try {
            const data = JSON.stringify({
                "UN": process.env.LPM_BASE_UNAME,
                "UP": process.env.LPM_BASE_PASSWORD
            });
            let url = process.env.LPM_WEB_LAND;
            var config = {
                method: 'post',
                url: `${url}/Token`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: data
            };
            let tokenData = await axios(config);
            if (tokenData?.data?.Data) {
                let rData = {
                    "VillageCode": reqData.VILLAGECODE,
                    "LPM_no": reqData.LPMNO
                };
                const headers = {
                    'Authorization': `Bearer ${tokenData?.data?.Data}`
                };
                let dataResponse = await axios.post(`${url}/RegistrationService/SubdivLpmsList`, rData, { headers });
                let SubdivLpms = dataResponse.data.Data
                if (SubdivLpms == undefined) {
                    let errorData = dataResponse.data;
                    throw new Error(errorData?.Message ?? "Base LPM CCLA API data fetch failed")
                } else if (SubdivLpms && SubdivLpms.length === 1 && SubdivLpms[0].Code === "101") {
                    throw new Error(errorData?.Message ?? "Data Failed")
                }
                return SubdivLpms;
            }
        } catch (ex) {
            Logger.error("apiForothersServices - Lpmbasedetails || Error :", ex);
            console.error("apiForothersServices - Lpmbasedetails || Error :", ex);
            throw constructPDEError(ex);
        }
    };

    checkAutoMutationGSWSSrvc = async (reqData) => {
        try {
            const { SRCODE, BOOKNO, RYEAR, DOCNO } = reqData;
            let bindParams = {
                SR_CODE: SRCODE,
                BOOK_NO: BOOKNO,
                REG_YEAR: RYEAR,
                DOCT_NO: DOCNO
            };
            const ruralMutationQuery = `SELECT COUNT(*) AS COUNT FROM srouser.mutation_sent_cr m
            JOIN tran_major t ON m.SR_CODE = t.SR_CODE AND m.BOOK_NO = t.BOOK_NO AND m.REG_YEAR = t.REG_YEAR AND m.DOCT_NO = t.DOCT_NO
            WHERE m.TYPE <> 'DUMMY' AND t.SR_CODE = :SR_CODE AND t.BOOK_NO = :BOOK_NO AND t.RYEAR = :REG_YEAR AND t.RDOCT_NO = :DOCT_NO`;
            const urbanMutationQuery = `SELECT COUNT(*) AS COUNT FROM srouser.mutation_sent_urban_cr u
            JOIN tran_major t ON u.SR_CODE = t.SR_CODE AND u.BOOK_NO = t.BOOK_NO AND u.REG_YEAR = t.REG_YEAR AND u.DOCT_NO = t.DOCT_NO
            WHERE t.SR_CODE = :SR_CODE AND t.BOOK_NO = :BOOK_NO AND t.RYEAR = :REG_YEAR AND t.RDOCT_NO = :DOCT_NO`;
            const ruralResult = await this.orDao.ReadoDBQueryServiceWithBindParams(ruralMutationQuery, bindParams);
            if (ruralResult[0]?.COUNT > 0) {
                return true;
            }
            const urbanResult = await this.orDao.ReadoDBQueryServiceWithBindParams(urbanMutationQuery, bindParams);
            if (urbanResult[0]?.COUNT > 0) {
                return true;
            }
            return false;
        } catch (ex) {
            Logger.error("apiForothersServices - checkAutoMutationGSWSSrvc || Error :", ex);
            console.error("apiForothersServices - checkAutoMutationGSWSSrvc || Error :", ex);
            throw constructPDEError(ex);
        }
    };
   updateForm13Status = async (reqData) => {
    try {
        const applicationId = reqData.Application_ID?.trim();
        let form13Value = reqData.Form13_Generated?.toUpperCase();
        if (!applicationId) {
            throw new Error("Invalid Application ID");
        }
        if (!["Y", "N"].includes(form13Value)) {
            throw new Error("FORM13_GENERATED must be Y or N");
        }
        const query = `
            UPDATE SROUSER.SADABAINAMA_DETAILS
            SET FORM13_GENERATED = :form13Value,
                FORM13_UPDATED_ON = SYSDATE
            WHERE APPLICATION_NO = :applicationId
        `;
        const bindParams = {
            applicationId,
            form13Value
        };
        const result = await this.orDao.oDbUpdateWithBindParams(query, bindParams);
        if (result === 0) {
            throw new Error("Application not found");
        }
        return result;
    } catch (ex) {
        console.error("Service Error:", ex);
        throw new Error(ex.message);
    }
};

}

module.exports = CCServices;