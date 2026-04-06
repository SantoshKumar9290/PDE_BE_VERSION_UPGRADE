const express = require('express')
const PropertyHandler = require('../handlers/propertyHandler');
const handler = new PropertyHandler();
const router = express.Router();
const {verifyjwt,roleAuthorization, validateDocumentStatusForUpdate} = require('../plugins/auth/authService');
const createPropertySchema = require("../schemas/api-validation-schemas/properties/createPropertySchema");
const { validateSchema } = require('../plugins/ajv');
const Roles = require('../utils/sysConstanst')
// exports.routesConfig = function (app) {
//     app.post('/v1/properties', [handler.createProperty]);
//     app.delete('/v1/properties/:applicationId/:propertyId', [handler.deleteProperty]);
//     // app.delete('/v1/parties/:applicationId/:id', [handler.deleteParties]);
// }


router.post('/',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]), validateDocumentStatusForUpdate(), [handler.createProperty]);
router.post('/section47a',verifyjwt,roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]), validateDocumentStatusForUpdate(), [handler.createSection47A]);
router.get('/:applicationId',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC],true),[handler.getPropertybyAppId])
router.put('/:applicationId/:propertyId',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC],true), validateDocumentStatusForUpdate(), [handler.editProperty])
router.delete('/:applicationId/:propertyId',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]), validateDocumentStatusForUpdate(), [handler.deleteProperty]);
router.post('/others',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro,Roles.Role_CSC]), validateDocumentStatusForUpdate(), [handler.othersPropCreation]);

module.exports = router;