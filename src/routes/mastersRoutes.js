const express = require('express')
const masterhandler = require('../handlers/mastersHandler');
const {verifyjwt,roleAuthorization} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst');

const handler = new masterhandler();
const router = express.Router();
router.get('/getSroDetails',verifyjwt,  [handler.getSroDetailshndl]);
router.get('/generateDocumentId', verifyjwt, [handler.generateDocumentId]);
router.get('/stamptypelist', verifyjwt, [handler.stamptypelisthndlr]);
router.get('/denominationslist', verifyjwt, [handler.denominationslisthndl]);
router.get('/getstampavailablelist',verifyjwt, [handler.getstampavailablelisthndlr])
router.post('/create',verifyjwt,[handler.createStampIndent]);
router.get('/getReport',verifyjwt,[handler.stamIndentReport]);
router.put('/freezstamp',verifyjwt,[handler.freezstamphndlr]);
router.put('/Stamppaymentupdate',verifyjwt,[handler.Stamppaymentupdatehndlr]);
router.get('/verifyStampPayment',verifyjwt,[handler.verifyStampPaymenthndlr]);
router.get('/getstampindentdetails',verifyjwt,[handler.getstampindentdetailshndlr]);
router.delete('/deletestampdetails',verifyjwt,[handler.deletestampdetailshndlr]);
router.get('/unpaidrequestlist',verifyjwt,[handler.unpaidrequestlist]);
router.get('/stampindentverification',verifyjwt,[handler.stampindentverificationhndlr]);
router.get('/getSroDetailsData', [handler.getSroDetailshndl]);

// Aadhar Consent Confirmation
router.post('/saveaadhaarconaccept', [handler.saveAadhaarConsentAcceptanceDetailsHandler]);






module.exports = router;