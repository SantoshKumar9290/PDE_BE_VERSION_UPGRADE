const express = require('express')
const ecCcHandler = require('../handlers/ecCcHandler');
const {verifyjwt,roleAuthorization} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst');

const handler = new ecCcHandler();
const router = express.Router();
router.get('/getAllUserECRequests', verifyjwt, [handler.getAllECRequestsByUserId]);
router.get('/checkDailyRequestLimit', verifyjwt, [handler.checkDailyRequestLimit]);
router.post('/paystatus', verifyjwt, [handler.paystatus]);
router.post('/updateECRequestsPaymentData', verifyjwt, [handler.updateECRequestsPaymentData]);

module.exports = router;