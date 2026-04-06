const express = require('express')
const section47Ahandler = require('../handlers/section47AHandler');
const {verifyjwt,roleAuthorization} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst');

const handler = new section47Ahandler();
const router = express.Router();
router.post('/Section47ApublicDoc',verifyjwt, [handler.Section47ApublicDochndlr]);
router.post('/generateForm2PDF47A',verifyjwt, [handler.generateForm2PDF47Ahndlr]);


module.exports = router;