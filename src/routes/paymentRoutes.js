const express = require('express')
const PaymentHandler = require('../handlers/paymentHandler');

const handler = new PaymentHandler();
const router = express.Router()
const {verifyjwt,roleAuthorization, validateThirdPartyAccess} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst')
// exports.routesConfig = function (app) {
//     app.post('/v1/:type/payments', [handler.createPayment]);
// 	app.put('/v1/payments/:id',[handler.editPayment]);
// 	app.delete('/v1/payments/:id',[handler.deletePayment]);
// }


router.post('/:type/create',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]), [handler.createPayment]);
router.put('/update/:id',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),[handler.editPayment]);
router.put('/updatePayment/:id',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),[handler.updatePaymentDetails]);
router.delete('/delete/:documentId/:id',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),[handler.deletePayment]);
router.get('/status/:id', verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]),[handler.getPaymentStatus])
router.get('/ccstatus/:id/:srcode', verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]),[handler.getCCPaymentStatus])
router.post('/paymentStatus', validateThirdPartyAccess, [handler.getCSCPaymentStatus])
router.post('/cscPaymentCheck', verifyjwt, roleAuthorization([Roles.Role_CSC]),[handler.cscPaymentCheck])
router.post('/paymentCheck/:id', [handler.getPaymentCheck]);

module.exports = router;
