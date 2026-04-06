const express = require('express')
const UserHandler = require('../handlers/userHandler');
const fileUpload = require('../common/fileUpload');
const jwt = require('../plugins/auth/authService');
const handler = new UserHandler();
const router = express.Router();

// exports.routesConfig = function (app) {
// 	app.post('/v1/verifyUser',[handler.verifyUser]);
// 	app.post('/v1/:otpType/signup',[handler.signUp]);
//     app.post('/v1/:type/sendOtp', [handler.sendOtp]); //type is aadhar,email,mobile
// 	app.post('/v1/:type/login', [handler.login]); //type is aadhar,email,mobile
// 	app.get('/v1/token/',[handler.refreshToken]);
// }


router.post('/verifyUser',[handler.verifyUser]);
router.post('/:otpType/signup',[handler.signUp]);
router.post('/:type/sendOtp', [handler.sendOtp]); //type is aadhar,email,mobile
router.post('/:type/login', [handler.login]); //type is aadhar,email,mobile
router.get('/token/',[handler.refreshToken]);
router.get('/logout',[handler.logout]);
router.post('/titdcoLogin', [handler.titdcoLogin])
router.post('/os/token',[handler.otherServicelogin]);
router.get('/list',jwt.verifyjwt,[handler.userDataHandler])
router.get('/ssoauthentication',[handler.ssoAuthentication])
router.post('/sendSMS',[handler.sendSMS])
router.get('/getvswslist',[handler.getVswsListHandler]);
router.get('/getvswsemplist',[handler.getVswsEmpListHandler]);
router.post('/mobile/vswssendOtp',[handler.VSWSLoginOTPHandler]);
router.post('/vswslogin',[handler.VSWSLoginHandler]);
router.post('/apcobLogin', [handler.apcobLogin])

router.post('/APIICLogin', [handler.APIICLogin])
router.get('/getApiicExc_data',jwt.verifyjwt,[handler.getApiicExc_data])
router.get('/getApiicExcPerData',jwt.verifyjwt,[handler.getApiicExcPerData])
router.post('/createExecMaster',[handler.createExecMaster])
router.get('/getapiicGovtInstitutions',jwt.verifyjwt,[handler.getapiicGovtInstitutions])
module.exports = router;