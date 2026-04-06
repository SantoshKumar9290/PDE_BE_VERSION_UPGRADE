const express = require('express')
const DocumentHandler = require('../handlers/documentHandler');
const {verifyjwt,roleAuthorization,validateThirdPartyAccess, validateDocumentStatusForUpdate} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst')
const handler = new DocumentHandler();
const router = express.Router();
const  fileUpload = require('../common/fileUpload');
const { validateSchema } = require('../plugins/ajv');
const createDocumentScheme = require("../schemas/api-validation-schemas/documents/createDocumentSchema");
const documentByIdScheme = require("../schemas/api-validation-schemas/documents/documentByIdSchema");
const updateDocumentScheme = require("../schemas/api-validation-schemas/documents/updateDocumentSchema");
const cron = require('node-cron');

router.get('/verifypassportdetails',[handler.verifyPassportDetails]);
router.get('/verifynripandetails',[handler.verifyNRIPanDetails]);

router.get('/validateStamps',[handler.validateStamps]);
router.get('/validatenonjudicialstamppaper',verifyjwt,[handler.validateNonJudicialStampPaper]);
router.post('/validateutilizedstamps',verifyjwt,[handler.validateUtilizedStamps])
router.post('/',verifyjwt, roleAuthorization([Roles.Role_User, Roles.Role_CSC,Roles.Role_Sro]) , validateSchema(createDocumentScheme), [handler.createDocument]);
router.put('/',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro],true), validateDocumentStatusForUpdate(), [handler.updateDocument]);
router.delete('/:documentId',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]), validateDocumentStatusForUpdate(), validateSchema(documentByIdScheme), [handler.deleteDocument]);
router.get('/',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]), [handler.getDocumentDetailsByUserId]);
router.get('/signed/:documentId',[handler.getSignedDocumentByDocumentId]);
router.get('/:documentId',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]), validateSchema(documentByIdScheme), [handler.getDocumentDetailsByUserIdAndDocumentId]);

router.put('/uplods/:fileName/:documentId',fileUpload.uploadStore.fields([{name:'image'}]),[handler.fileUploadStore]);

router.get('/images/:documentId',[handler.getImagesbyId]);
router.get('/flags/:documentId',[handler.getAllFlagsById])
router.delete('/images/:fileName/:documentId', [handler.delImageById]);
router.post('/syncservice/:id', verifyjwt, validateDocumentStatusForUpdate(false), [handler.syncservice]);
router.get('/cfms/chalanDetails/:documentId',[handler.getChalanDetails]);

//SLOt VErify through Q
// router.put('/updateSlot',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_Sro]),[handler.updateQrSlot]);
router.put('/updateSlot',[handler.updateQrSlot]);
router.put('/getDocs',[handler.getDocsforSlot]);
// router.post('/:type/sendOtp', [handler.sendOtp]); //type is aadhar,email,mobile

router.get('/readyToEsign/list',verifyjwt,roleAuthorization([Roles.Role_User]), [handler.getDocsForEsign])
router.put('/lb/td/update',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro]),validateDocumentStatusForUpdate(),[handler.updateTdHandler])
router.put('/statushstr/:sd/:documentid',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_Sro]),validateDocumentStatusForUpdate(),[handler.updateStatusHstr]);
router.get('/documentPreview/:documentId/:fileName',verifyjwt,[handler.documentPreviewhndlr]);
router.get('/documentPreviewCARD/:documentId/:fileName',validateThirdPartyAccess,[handler.documentPreviewhndlr]);
router.get('/getAnywhereDocStatus/:documentid', [handler.getAnywhereDocStatus]);

//Frankin API
router.post('/frankId',verifyjwt,[handler.fetchFrankId]);

//verify stockholdingid
router.post('/verifyStockHoldingId', verifyjwt, [handler.verifyStockHoldingId]);

//Go examptions 
router.put('/GoExamptions',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_CSC,Roles.Role_Sro],true), [handler.GOupdateDocument]);
router.get('/GoExamptions/:applicationId',[handler.getGOupdateDocument]);
//Document Scheduler to store in NAS path
cron.schedule('0 0 0 * * *', async () => {
    console.log("Inside of cron job execution :::documentScheduler");    
    console.log("Before starting the process::::::::", new Date());
    let result = await handler.documentScheduler();
    console.log("After completing the process::::::::", new Date());
    console.log("End of cron job execution with status :::documentScheduler", result);
});

//Urban property Cancel logic within 24 hours document
cron.schedule('0 0 02 * * *', async () => {
    console.log("Inside of cron job execution :::urbanPropertyScheduler");
    console.log("Before starting urbanPropertyScheduler process::::::::", new Date());
    let response = await handler.urbanPropertyScheduler();
    console.log("After completing urbanPropertyScheduler process::::::::", new Date());
    console.log("End of cron job execution with status :::urbanPropertyScheduler", response);
});
    
module.exports = router;
