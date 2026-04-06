const express = require('express')
const VillageHandler = require('../handlers/villageHandler');
const handler = new VillageHandler();
const router = express.Router();
const {verifyjwt,roleAuthorization,verifyAPIKey} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst');
const { validateSchema } = require('../plugins/ajv');
const schemavalidation = require('../schemas/api-validation-schemas/sqlQeuryValidationSchema')

router.get('/districts', [handler.getDistricts]);
router.get('/mandals/:districtId',validateSchema(schemavalidation), [handler.getMandals]);
router.get('/link/dist/:districtId',validateSchema(schemavalidation), [handler.getlinkSroDetails]);
router.get('/sroDetails/:villageCode',validateSchema(schemavalidation), [handler.getSroDetails]);
router.get('/', [handler.getVillages]);
router.get('/CurrentPahaniDetailsSRO',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]), [handler.getCurrentPahaniDetailsSRO]);

router.post('/CDMAPropertyAssessmentDetails'
// ,verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro])
, [handler.getCDMAPropertyAssessmentDetails]);

router.get('/SingleCertificateDetails',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]), [handler.getSingleCertificateDetails]);
router.post('/sendSMS', [handler.sendSMS]);
router.get('/getLocalbodiesData/:habCode',validateSchema(schemavalidation),[handler.getLocalBodyHandler])
router.get('/pahaniDetails', [handler.getCurrentPahaniDetailsSRO]);
router.post('/getCDMADetails',verifyjwt, [handler.getCDMADetails]);
router.post('/sendSMSForApproveReject', [handler.sendSMSForApproveReject]);
router.post('/LpmDivision',verifyjwt, [handler.Lpmdivison]);
router.get('/survyeNoList',verifyjwt,[handler.surveyNoList])
router.get('/getReraProjectDetails',verifyjwt,[handler.getReraProjectDetails]);
router.get('/getBuildingApprovalNoDetails',verifyjwt,[handler.getBuildingApprovalNoDetails]);
router.get('/getSezJuriSRO',[handler.getSezJuriSRO]);
router.post('/LpmDivisionforwebsite',verifyAPIKey, [handler.Lpmdivison]);

module.exports = router;