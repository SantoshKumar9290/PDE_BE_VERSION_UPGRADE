const express = require('express')
const EsignHandler = require('../handlers/esignHandler');

const handler = new EsignHandler();
const router = express.Router()
const {verifyjwt,roleAuthorization} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst');

router.post('/', verifyjwt, roleAuthorization([Roles.Role_User]), [handler.esignParty])
router.post('/status', verifyjwt, roleAuthorization([Roles.Role_User]), [handler.esignStatus])
router.post('/execute', verifyjwt, roleAuthorization([Roles.Role_User]), [handler.esignExecuted])
router.post('/remove', verifyjwt, roleAuthorization([Roles.Role_User]), [handler.esignRemove])

module.exports = router;