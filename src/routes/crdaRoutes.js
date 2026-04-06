const express = require('express');
const CrdaHandler = require('../handlers/crdahandler');
const {verifyjwt,roleAuthorization} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst')
const handler = new CrdaHandler();
const router = express.Router()
// exports.routesConfig = function (app) {
//     app.post('/v1/covanants', [handler.createCovanants]);
// 	app.get('/v1/covanants/:docId',[handler.getCovanantsByDocId]);
// 	app.put('/v1/covanants/:docId/:id',[handler.updateCovanants]);
// }


router.get('/villages/:vgCode?',[handler.getVillages]);
router.put('/checkEmp',[handler.checkEmp])
module.exports = router;
