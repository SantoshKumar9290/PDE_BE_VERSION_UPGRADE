const express = require('express')
const Officerhandler = require('../handlers/officerHandler');
const jwt = require('../plugins/auth/authService');
const {verifyjwt,roleAuthorization} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst')
const handler = new Officerhandler();
const router = express.Router();

// exports.routesConfig = (app) => {
//     app.post('/api/officer/signup', [handler.signUp]);
//     app.post('/api/officer/login', [handler.login]);
// 	app.put('/api/officer/resetPassword',[handler.reset])
// }


// router.post('/signup', [handler.signUp]);
router.post('/login',[handler.login]);
router.get('/documents',verifyjwt, roleAuthorization(Roles.Role_Sro),[handler.getDocumentHandler]);
router.get('/list',[handler.officerListHandler])
// router.put('/resetPassword',[handler.reset])

module.exports= router;