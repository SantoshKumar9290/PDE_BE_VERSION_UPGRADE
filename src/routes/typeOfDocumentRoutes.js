const TypeOfDocumentHandler = require('../handlers/typeOfDocumentHandler');

const handler = new TypeOfDocumentHandler();
const {verifyjwt,roleAuthorization} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst')
exports.routesConfig = function (app) {
    app.get('/v1/typeOfDocument', [handler.getNatureOfDocument]);
}