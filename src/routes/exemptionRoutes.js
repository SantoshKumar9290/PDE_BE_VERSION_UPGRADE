const express = require('express')
const router = express.Router();
const exemptionHandler = require('../handlers/exemptionHandler');
const handler = new exemptionHandler();

router.get('/', [handler.getList])
router.get('/ekyc',[handler.getEkycExemptionData])
router.put('/ekyc/status',[handler.updateEkycExemptionStatus])
router.get('/status/:applicationId',[handler.getExemptionStatus])

module.exports = router;
