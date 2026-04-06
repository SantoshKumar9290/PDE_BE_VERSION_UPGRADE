const express = require('express');
const router = express.Router();
const VillageHandler = require('../handlers/villageHandler');
const handler = new VillageHandler();
const {verifyjwt,roleAuthorization, verifyAPIKey, validateRTGSAccess} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst');
const { validate } = require('../model/masterDataVillageModel');
const { validateSchema } = require('../plugins/ajv');
const classicWiseDetailsSchema = require("../schemas/api-validation-schemas/classicWiseDetails");
const oDbSchemavalidation = require('../schemas/api-validation-schemas/sqlQeuryValidationSchema');

router.get('/villagesbyODb/:sroCode',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),validateSchema(oDbSchemavalidation),[handler.villagesbyODb]);
router.get('/habitation/:type/:villageCode',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),validateSchema(oDbSchemavalidation),[handler.habitationsByVillageCode]); // type is rural/urban
router.get('/partyOrProperty',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),[handler.partyAndPropertyDetails]);
router.get('/marketValue/:type/:villageCode',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),validateSchema(oDbSchemavalidation),[handler.getMarketHandler]); //type is rural/urban
router.get('/marketValue/doorWiseDetails',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),[handler.getDoorDetailsHandlerByUrban]);
// app.get('/v1/ob/marketValue/classicWiseDetails',[handler.getDetailsByClassic]);
router.get('/marketValue/classicWiseDetails',verifyjwt, validateSchema(classicWiseDetailsSchema), roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),[handler.getDetailsByClassic]);
router.put('/pp_check/:type',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),[handler.getProhibitedDetails]);
router.put('/dutyCalculator',[handler.dutyCalculaterHandler]);
router.put('/structureDetails',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC],true),validateSchema(oDbSchemavalidation),[handler.structureDetails]);
router.get('/echalan',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),[handler.eChallanHandler]);
router.put('/:type/mvCalculator',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),[handler.mvCalculator]);
router.get ('/checkLpm/:villageCode',[handler.lpmCheck]);
router.get('/getwebVgCode/:type/:vgCodes',[handler.getWLVgCode]);
router.post('/mv',verifyjwt,[handler.mvHandler])
router.post('/mvCalbyClassification',verifyjwt,[handler.mvClassHandler])
router.get('/eclinked/list',verifyjwt,[handler.ecLinkedList]);
router.get('/checkUlbJurisdiction', verifyjwt, [handler.checkUlbJurisdiction]);
router.put('/adhar/validate',[handler.adharvalidate]);
router.post('/lpmData',verifyjwt,[handler.lpmHandler]);
router.put('/habforCcla',[handler.habitationForPAI]);
router.get('/unitRate',[handler.getunitRateByVg]);
router.put('/dutyCalculatorforCCla',[handler.dutyCalculaterHandler]);
router.put('/vcanLandRCheckMv',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),[handler.vacantLandHandler]);

router.post('/mvadatapost',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),[handler.mvadatapost]);
router.put('/dutyLease',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),[handler.dutyFeeforLeaseDocs]);

router.get('/villagesbyODbforWebsite/:sroCode',verifyAPIKey,[handler.villagesbyODb]);
router.get('/habitationforWebsite/:type/:villageCode',verifyAPIKey,[handler.habitationsByVillageCode]);
router.put('/:type/mvCalculatorforWebsite',verifyAPIKey,[handler.mvCalculator]);
router.put('/dutyCalculatorforWebsite',verifyAPIKey,[handler.dutyCalculaterHandler]);
router.put('/pp_checkforWebsite/:type',verifyAPIKey,[handler.getProhibitedDetails]);
router.put('/vgforWebland',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro]),[handler.wgCodeOfVg])
router.post('/mvadatapostforWebsite',verifyAPIKey,[handler.mvadatapost]);
//Market value calculation by classification for DTCP
router.post('/mvcalbyclassificationDTCP',verifyjwt,[handler.mvClassHandler])
router.put('/dutyCalculatorForRTGS',validateRTGSAccess,[handler.dutyCalculaterHandler]);


module.exports = router;