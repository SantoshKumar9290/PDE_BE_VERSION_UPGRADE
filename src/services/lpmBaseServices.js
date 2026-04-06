const orDbDao = require('../dao/oracleDbDaos')
const { Logger } = require('../../services/winston');
const { constructPDEError } = require("../handlers/errorHandler");
const MvaDao = require("../dao/masterDataVillageDao");
const _ = require('lodash');

class lpmBaseService {
  constructor() {
    this.orDao = new orDbDao();
    this.MvaDao = new MvaDao();
  }
  form4Checksrvc = async (reqData) => {
    try {
      let bindparam = {};
    let lpmnos = reqData?.filter(item => item.RecordType === "LpmNo").map(item => `'${item["SurveyNo/LPMno"]}'`).join(", ");    
    let query =`SELECT survey_no FROM sromstr.mv_basic_rur_reg WHERE survey_no IN (${lpmnos}) AND SUB_SURVEY_NO = '/' AND REV_VILL_CODE = (SELECT substr(HAB_CODE, 1, 7) FROM hab_match WHERE webland_code = LPAD(TO_CHAR(${reqData[0].VillageCode}), 7, '0') || '01'  FETCH FIRST 1 ROW ONLY ) 
ORDER BY survey_no DESC 
FETCH FIRST 1 ROW ONLY`;
      let mastreresponse = await this.orDao.oDBQueryServiceWithBindParams(query, bindparam);     
        return mastreresponse;      
    } catch (ex) {
      Logger.error("lpmBaseServices - form4Checksrvc || Error :", ex);
      console.error("lpmBaseServices - form4Checksrvc || Error :", ex);
      throw constructPDEError(ex);
    }
  };
};

module.exports = lpmBaseService;