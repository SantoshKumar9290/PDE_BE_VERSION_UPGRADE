const ApiHandler = require('../handlers/apiForOthersHandler');
const { verifyAPIKey, validateThirdPartyAccess,validateAPIkeyForISRI, validateAPIkey,verifyThirdPartyToken,validateAPIEODBkey,validateAPIkeyAPCTDP,validateAPIkeyAPCFSS,validateAPDTCPAccess ,validateAPIkeyWithHash,validateSignatureMiddleware, validateSSLRAccess,validateAPCOBAccess,validateAPIkeyone} = require('../plugins/auth/authService');
const express = require('express');

const handler = new ApiHandler();
const router = express.Router();

router.get('/doctdetails',verifyAPIKey,[handler.doctdetailsHndlr]);
router.get('/downloadCCgsws',[handler.downloadCCgswshndlr]);
router.get('/DoctdetailsbyPAN',validateThirdPartyAccess,[handler.DoctdetailsbyPANhndlr]);
router.get('/docTransDataByPan',validateThirdPartyAccess, [handler.docTransDataByPan]);
router.get('/pdeDocStatus', validateThirdPartyAccess,[handler.pdeDocStatushndl]);


router.post('/getDocumentRegistrationService',validateThirdPartyAccess, [handler.getDocumentRegistrationService])
router.post('/getDocumentECService',validateThirdPartyAccess, [handler.getDocumentECService])
router.post('/getDocumentCCService',validateThirdPartyAccess, [handler.getDocumentCCService])
router.get('/getHigherEducationData',validateThirdPartyAccess,[handler.getHigherEducationDataHndlr]);
router.get('/DoctdetailsbyTAX',validateThirdPartyAccess,[handler.DoctdetailsbyTAXhndlr]);
router.get('/getDocsDetails',validateThirdPartyAccess,[handler.getDocsDetails]);

//IVRS APIs
router.get('/getECdownloaddetails',validateAPIkey, [handler.getECdownloaddetails]);
router.get('/getCCdownloaddetails',validateAPIkey, [handler.getCCdownloaddetails]);
router.get('/GetSlotBookingStatistics',validateAPIkey,[handler.GetSlotBookingStatistics]);
router.get('/GetTotalregistartiondetails',validateAPIkey,[handler.GetTotalregistartiondetails]);

//VMC CC Download API
router.get('/certifyCopyVMC',verifyThirdPartyToken,[handler.downloadCCForVMC])

//APDBMS API
router.get('/getDocDetailsAPDPMS',validateAPIkey,[handler.getHigherEducationDataHndlr]);

//EODB API
router.get('/getmutationsuccesscount',validateAPIEODBkey,[handler.mutationsuccesscount]);
//UPDATE FIRMS
router.put('/mangooseddbtoorcaledb',[handler.MangoosedDbToOrcaleDB]);

//APDTCP API 
router.get('/getDocDetailsAPDTCP',validateAPIkeyAPCTDP,[handler.getAPDTCPdocumentsDataHndlr]);
//APDTCP VILLAGE WISE API 
router.get('/getDocDetailsAPDTCPBYRegistrationDeatils',validateAPIkeyAPCTDP,[handler.getAPDTCPbySurveyDocumentsDataHndlr]);

//APCFSS API 
router.get('/getDocDetailsAPCFSS',validateAPIkeyAPCFSS,[handler.getAPCFSSdocumentsDataHandler]);

//APCFSS VILLAGE WISE API 
router.get('/getDocDetailsAPCFSSBYRegistrationDeatils',validateAPIkeyAPCFSS,[handler.getAPCFSSbySurveyDocumentsDataHndlr]);
//CDMA MV API
router.post('/getMvUnitRate',validateThirdPartyAccess,[handler.getMvUnitRateService]);

router.post('/storethirdpartyapiresponse',[handler.storeThirdPartyAPIResponse])
//Commercial tax PAN
router.get('/doctransactiondatabypan',validateThirdPartyAccess, [handler.getdoctransactiondatabypan]);
//APDTCP PP Notify List
router.get('/pp-notify',validateAPDTCPAccess, [handler.getppnotify]);

// Urban Property Type
router.get('/geturbanpropertytype',validateAPIkeyForISRI, [handler.getUrbanPropertyType]);

// Rural Property Type
router.get('/getruralpropertytype',validateAPIkeyForISRI, [handler.getRuralPropertyType]);
//insert sadaBainama Deatils
router.post('/insertSadaBainamaDetails',validateAPIkeyWithHash,[handler.insertOtherDetailsHandler]);
router.post('/genereteHashKey',validateAPIkeyWithHash,[handler.genereteHashKeyHandler]);

router.get('/getProbhitedReport',validateThirdPartyAccess,validateSignatureMiddleware,[handler.getProbhitedReport]); 
router.get('/getSRODetails',validateThirdPartyAccess,validateSignatureMiddleware,[handler.getSRODetails]); 

// router.get('/getProbhitedUrbanReport',[handler.getProbhitedUrbanReport]); 
//SSLR API's
router.get('/sslr/getecdetails',validateSSLRAccess,[handler.getECDetailsforSSLR]);
router.get('/sslr/getdocsdetails',validateSSLRAccess,[handler.getDocDetailsforSSLR]);
router.get('/sslr/getmarketvaluedata',validateSSLRAccess,[handler.getMarketValueforSSLR]);

router.get('/sslr/getecdocsdetails',validateSSLRAccess,[handler.getECDocsDetailsforSSLR]);
router.get('/sslr/getlpmmarketvaluedata',validateSSLRAccess,[handler.getLpmMarketValueforSSLR]);

//APCOB
router.get('/apcob/getecsurveyListDocsdetails',validateAPCOBAccess,[handler.getECSurveyListDocsDetailsforAPCOB]);
router.get('/apcob/geteclpmdocsdetails',validateAPCOBAccess,[handler.getECLPMDocsDetailsforAPCOB]);

router.put('/UpdateForm13Status',validateAPIkeyone,[handler.UpdateForm13Status]);

module.exports = router;