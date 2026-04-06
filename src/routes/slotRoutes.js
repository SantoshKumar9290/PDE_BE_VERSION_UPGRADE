const express = require('express')
const SlotHandler = require('../handlers/slotHandler');

const handler = new SlotHandler();
const router = express.Router();
const {verifyjwt,roleAuthorization,validateThirdPartyAccess} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst')
// exports.routesConfig = function (app) {
//     app.post('/v1/appointment', [handler.creatSlotBooking]);
// 	app.get('/v1/slotBooking/:sroOfcNum', [handler.getSlots]);
//     // app.put('/v1/parties', [handler.updateParties]);
//     // app.put('/v1/parties/updatePresenter', [handler.updateParties]);
//     // app.delete('/v1/parties/:applicationId/:id', [handler.deleteParties]);
// }


router.post('/appointment', verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro]),[handler.creatSlotBooking]);
router.get('/slotBooking/:sroOfcNum',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro]), [handler.getSlots]);
router.put('/delete',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro]), [handler.canceltheSlot]);
// router.get('/slotsByappId/:applicationId',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro]),[handler.getSlotsbyAppId])
//Slot Verification through QR
//router.post('/qrCode/generate',[handler.qrCodeGenerate])
router.get('/synced/:sroOfcNum', [handler.syncedSlots]);
router.post('/mobile/sendOtp',[handler.sendOtp]); //type is aadhar,email,mobile
router.post('/:type/verify', [handler.verifyOTP]); //type is aadhar,email,mobile
router.post('/Qr/appointment', [handler.createQrSlot]);
router.post('/statusUpdate', [handler.slotStatusUpdate]);
router.post('/appointment', verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),[handler.creatSlotBooking]);
router.get('/slotBooking/:sroOfcNum',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]), [handler.getSlots]);
router.get('/slotsByappId/:applicationId',[handler.getSlotsbyAppId])
router.get('/isSlotEnabledForSro/:sroOfcNum',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro]), [handler.isSlotEnabledForSro]);
router.get('/GetSlotBookingStatisticsForRtgs',validateThirdPartyAccess,[handler.GetSlotBookingStatisticsForRtgs]);
router.post('/mobile/mobilesendOtp',[handler.mobilesendOtp]); //type is aadhar,email,mobile
router.post('/:type/mobileverify', [handler.verifyMobileOtp]); //type is aadhar,email,mobile

module.exports = router;