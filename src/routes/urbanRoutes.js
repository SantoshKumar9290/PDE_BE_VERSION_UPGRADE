const express = require('express');
const urabnHandler = require('../handlers/urbanHandler');
const handler = new urabnHandler();
const router = express.Router();
const {verifyjwt,roleAuthorization,validateCDMAAccess} = require('../plugins/auth/authService');


// Need to implement third party token


router.get('/searchassessmentbydoornumber',[handler.searchAssessmentNumberByDoorNumber])
router.get('/slotenabled',[handler.slotEnabled])
router.get('/getpropertydetails',[handler.getPropertyDetails])
router.post('/taxDues',[handler.propertyTaxDue])
router.put('/updateassessmentmutationstatus',validateCDMAAccess,[handler.updateAssessmentMutationStatus])
router.get('/getsecratariatward',verifyjwt,[handler.getSecretariatWardbySro])
router.get('/getVillageEnabled',verifyjwt,[handler.getVillageStatus])

module.exports = router;