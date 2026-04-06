const express = require('express');
const router = express.Router();
const covanants = require('./covanantsRoutes');
const documents = require('./documentRoutes');
const officers = require('./officerRoutes');
const obd = require('./oracleDbroutes');
const parties = require('./partiesRoutes');
const payments = require('./paymentRoutes');
const properties = require('./propertyRoutes');
const reports = require('./reportRoutes');
const slots = require('./slotRoutes');
const users = require('./userRoutes');
const villages = require('./villageRoutes');
const esign = require('./esignRoutes');
const exemptions = require('./exemptionRoutes');
const crda = require('./crdaRoutes')
const Ec=require('./ecRoutes');
const Cc=require('./ccRoutes');
const  mv=require('./mvRoutes');
const masters=require('./mastersRoutes');
const section47A= require('./section47ARoutes')
const lpmbase= require('./lpmBaseRoutes')
const Apiforother =require('./apiForothersRoutes')
const urbanRoutes = require('./urbanRoutes')   

router.use('/v1/covanants',covanants);
router.use('/v1/documents',documents);
router.use('/v1/ob',obd);
router.use('/v1/officer',officers);
router.use('/v1/parties',parties);
router.use('/v1/payments',payments);
router.use('/v1/properties',properties);
router.use('/v1/reports',reports);
router.use('/v1/slots',slots);
router.use('/v1/users',users);
router.use('/v1/villages',villages);
router.use('/v1/esign',esign);
router.use('/v1/exemptions', exemptions);
router.use('/v1/ec', Ec);
router.use('/v1/cc', Cc);
router.use('/v1/mv', mv);
router.use('/v1/masters', masters);
router.use('/v1/crda',crda)
router.use('/v1/masters', masters);
router.use('/v1/section47A',section47A);
router.use('/v1/lpmBase',lpmbase);
router.use('/v1/apiforother',Apiforother);
router.use('/v1/urban',urbanRoutes)
router.use('/v1/ivrsAPI',Apiforother);

module.exports = router;