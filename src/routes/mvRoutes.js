const express = require('express');
const mvHandler = require('../handlers/mvHandler');
const {verifyjwt,roleAuthorization, verifyAPIKey, validateRTGSAccess} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst')
const handler = new mvHandler();
const router = express.Router()

router.post('/mvAssitanceReport',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]),[handler.mvAssitanceReport]);
router.get('/getmvasrlist',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]),[handler.getmvasrlist]);
router.get('/getmvacoordinatesdata',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]),[handler.getmvacoordinatesdata]);
router.get('/pdfpreview',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]),[handler.pdfpreview]);
router.get("/pendingEsignList",verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]),[handler.pendingesignlist]);
router.put('/:type/mvamvCalculator',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]),[handler.mvamvCalculator]);
router.get('/verifyPayment',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]),[handler.verifyPayment])
router.post('/createMVRequest',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]),[handler.createMVRequest]);
router.put('/UpdatePaymentMVRequest',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]),[handler.UpdatePaymentMVRequest]);
router.get('/getMVRequestsData',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]),[handler.getMVRequestsData]);
router.get('/getMVRequestsDatabySRO',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]),[handler.getMVRequestsDatabySRO]);
router.get('/getcompletedMVRequestsDatabySRO',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]),[handler.getcompletedMVRequestsDatabySRO]);
router.put('/updateMVRequest',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]),[handler.updateMVRequest]);
//Routes for Website
router.get('/mvAssitanceReportforWebsite',verifyAPIKey,[handler.mvAssitanceReport]);
router.get('/getmvasrlistforWebsite',verifyAPIKey,[handler.getmvasrlist]);
router.get('/getmvacoordinatesdataforWebsite',verifyAPIKey,[handler.getmvacoordinatesdata]);
router.get('/pdfpreviewforWebsite',verifyAPIKey,[handler.pdfpreview]);
router.get("/pendingEsignListforWebsite",verifyAPIKey,[handler.pendingesignlist]);
router.put('/:type/mvamvCalculatorforWebsite',verifyAPIKey,[handler.mvamvCalculator]);
router.get('/verifyPaymentforWebsite',verifyAPIKey,[handler.verifyPayment])
router.post('/createMVRequestforWebsite',verifyAPIKey,[handler.createMVRequest]);
router.put('/UpdatePaymentMVRequestforWebsite',verifyAPIKey,[handler.UpdatePaymentMVRequest]);
router.get('/getMVRequestsDataforWebsite',verifyAPIKey,[handler.getMVRequestsData]);
router.get('/getMVRequestsDatabySROforWebsite',verifyAPIKey,[handler.getMVRequestsDatabySRO]);
router.get('/getcompletedMVRequestsDatabySROforWebsite',verifyAPIKey,[handler.getcompletedMVRequestsDatabySRO]);
router.put('/updateMVRequestforWebsite',verifyAPIKey,[handler.updateMVRequest]);
router.get('/getCRDAdetails',verifyAPIKey,[handler.getCRDAdetails]);
router.put('/:type/mvamvCalculatorforRtgs',validateRTGSAccess,[handler.mvamvCalculator]);




module.exports = router;
