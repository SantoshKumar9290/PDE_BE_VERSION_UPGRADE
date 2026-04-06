const express = require('express')
const ReportHandler = require('../handlers/reportHandler');
const fileUpload = require('../common/fileUpload');
const { route } = require('./covanantsRoutes');
const handler = new ReportHandler();
const router = express.Router()
const {verifyjwt,roleAuthorization, verifyAPIKey} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst')


// exports.routesConfig = function (app) {
//     app.get('/v1/report/:type/:documentId' ,[handler.getCheckSlip]);//checkSlip,acknowledgement,slotBookingSlip,formSixty
// 	app.get('/v1/telugu/reports/:type/:docid',[handler.getTeluguReports]);
// }


router.get('/:type/:stamp/:documentId',[handler.getCheckSlip]);//checkSlip,acknowledgement,slotBookingSlip,formSixty
router.put('/merge/:documentId',[handler.mergePdf])
router.get('/telugu/:stamp/pdf/:documentId',[handler.getTeluguReports]);
router.get('/:documentId',verifyAPIKey,[handler.getCheckSlipdata]);

module.exports = router;