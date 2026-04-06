const express = require('express')
const ecCcHandler = require('../handlers/ecCcHandler');
const {verifyjwt,validateThirdPartyAccess} = require('../plugins/auth/authService');
const Roles = require('../utils/sysConstanst');
const cron = require('node-cron');


const handler = new ecCcHandler();
const router = express.Router();

router.post('/createCCRequest',verifyjwt,[handler.createCCRequest]);
router.put('/updtCCpaymentdetails',verifyjwt,[handler.updtCCpaymentdetails]);
router.get('/getAllCcdata',verifyjwt,[handler.getAllCCDataByLoginId]);
router.get('/downloadCC',[handler.getData])
router.post('/getCCCopyByDetails',validateThirdPartyAccess,[handler.getCCCopyByDetailsData])

//Old Certified Copy
router.get('/oldcertifycopy/validate',[handler.getOldCCValidate]);

// ----LPM Market value check-------//

router.get('/lpmMarketValueCheck',[handler.lpmMarketValueCheck]);

//cron job schedular

cron.schedule('0 0 */1 * * *', async () => {
    console.log("Inside of cron job execution ::: ");
    let result = await handler.updateUserCCPaymentDetailsIfAny();
    console.log("End of cron job execution with status ::: ", result);
 });


module.exports = router;