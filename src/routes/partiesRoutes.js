const express = require('express')
const PartiesHandler = require('../handlers/partiesHandler');

const handler = new PartiesHandler();
const router = express.Router()
const {verifyjwt,roleAuthorization,validateThirdPartyAccess, validateDocumentStatusForUpdate} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst');
const { validateSchema } = require('../plugins/ajv');
const createPartiesSchema = require("../schemas/api-validation-schemas/parties/createPartiesSchema");
const updatePartiesSchema = require("../schemas/api-validation-schemas/parties/updatePartiesSchema");

router.post('/',verifyjwt, roleAuthorization([Roles.Role_User, Roles.Role_Sro,Roles.Role_CSC]), validateDocumentStatusForUpdate(), validateSchema(createPartiesSchema), [handler.createParties]);
router.put('/',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]), validateDocumentStatusForUpdate(), validateSchema(updatePartiesSchema), [handler.updateParties]);
router.put('/updatePresenter',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]), validateDocumentStatusForUpdate(), [handler.updatePresenter]);
router.delete('/representative/:documentId/:partyId/:parentPartyId',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]), validateDocumentStatusForUpdate(), [handler.deleteRepresentative]);
router.delete('/:applicationId/:id',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]), validateDocumentStatusForUpdate(), [handler.deleteParties]);
router.post('/representative',verifyjwt, roleAuthorization([Roles.Role_User, Roles.Role_Sro,Roles.Role_CSC]), validateDocumentStatusForUpdate(), [handler.createRepresentative]);
router.get('/', verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_CSC]), [handler.getPartiesByAppId]);
//EODB
router.get('/getdata',validateThirdPartyAccess,[handler.getPartiesData]);
router.get('/getMutationData',validateThirdPartyAccess,[handler.getMutationReportForEODB]);
router.put('/isPresenterData',[handler.getPresenterData]);

//Edit Index Esign Functionality.
router.post('/insertEditIndexData', [handler.createPartiesEditIndex]);
router.get('/getEditIndexDatabyID', [handler.getDocumentEditIndexbyID]);

// form60/61
router.post('/form60Report/:appid', verifyjwt, [handler.createForm60Report]);
router.post('/verifyEsignStatus', verifyjwt, [handler.verifyEsignStatus]);
router.post('/downloadForm60ById', [handler.downloadForm60ById]);
router.post('/panValiadation',verifyjwt, [handler.checkPANvalidation]);
router.get('/getPartyDetails/:id', [handler.getPartyDetailsDatabyId]);
router.get('/getSaleCumGPADetails', [handler.getSaleCumGPADetails]);
router.get('/getSEZRepresentativeList', [handler.getSEZRepresentativeList]);

router.put('/updatePartyNamesCard', validateThirdPartyAccess,[handler.updatePartyNamesCard]);

module.exports = router;