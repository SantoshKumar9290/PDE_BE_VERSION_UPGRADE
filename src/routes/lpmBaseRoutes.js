const express = require('express')
const lpmBasehandler = require('../handlers/lpmBaseHandler');
const {verifyjwt,verifyAPIKey} = require('../plugins/auth/authService');

const handler = new lpmBasehandler();
const router = express.Router();
router.post('/form4check',verifyjwt, [handler.form4Checkhndlr]);
router.post('/form4checkforwebsite',verifyAPIKey, [handler.form4Checkhndlr]);
module.exports = router;