const express = require('express');
const CovanantHandler = require('../handlers/covanantHandler');
const {verifyjwt,roleAuthorization} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst')
const handler = new CovanantHandler();
const router = express.Router()
// exports.routesConfig = function (app) {
//     app.post('/v1/covanants', [handler.createCovanants]);
// 	app.get('/v1/covanants/:docId',[handler.getCovanantsByDocId]);
// 	app.put('/v1/covanants/:docId/:id',[handler.updateCovanants]);
// }


router.post('/',verifyjwt, roleAuthorization([Roles.Role_User, Roles.Role_Sro]), [handler.createCovanants]);
router.get('/:docId',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro]),[handler.getCovanantsByDocId]);
router.put('/:docId/:id',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro]),[handler.updateCovanants]);
router.delete('/:type/:docId/:id',verifyjwt, roleAuthorization([Roles.Role_User,Roles.Role_Sro]),[handler.deleteCovenants])


module.exports = router;
