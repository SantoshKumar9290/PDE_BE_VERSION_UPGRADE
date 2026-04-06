const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const axios = require('axios');
const UrbanService = require("../services/urbanServices");
const { constructPDEError } = require("./errorHandler");
const { cdmaAPIs, cdmaHostURL } = require('../constants/CDMAConstants')
const VillageService = require('../services/villageService');
class urbanHandler {

    constructor() {
        this.urbanService = new UrbanService();
        this.VillageServices = new VillageService();
    }

    updateAssessmentMutationStatus = async ( req,res )=>{
        const requiredParams={
            assessmentNumber:req.body.assessmentNumber,
            applicationNumber:req.body.applicationNumber,
            status:req.body.status,
            updatedAssessmentNumber:req.body.updatedAssessmentNumber
        }
        for(let key in requiredParams){
            if(!requiredParams[key]){
                return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json({
                    status:"Failure", 
                    code:400, 
                    message:"Bad Request."
                })
            }
        }
        const statusArr=['APPROVED','REJECTED'];
        if(!statusArr.includes(requiredParams['status'])){
                return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json({
                    status:"Failure", 
                    code:400, 
                    message:"Bad Request."
                })
        }
        try{    
            const getAssessmentData = await this.urbanService.updateAssessmentMutationStatus(requiredParams)
            if(getAssessmentData.length < 1){
            return res.status(404).json({
                status:"Failure",
                code:404,
                message:`Data not found for the given details`,
            })

            }else{
            return res.status(200).json({
                status:"Success",
                code:200,
                message:`Mutation status updated successfully`,
            })
            }
        }catch(err){
                return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json({
                    status:"Failure", 
                    code:500, 
                    message:"Internal server issue. Please try again after sometime"
                })
        }


    }

    searchAssessmentNumberByDoorNumber = async (req, res) => {
        const requiredParams = {
            sroCode: req.query.sroCode,
            doorNo: req.query.doorNo
        }
        for (let key in requiredParams) {
            if (!requiredParams[key]) {
                return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
            }
        }
        const ulbData = await this.urbanService.getUlbCodeOfMuncipality(req.query.sroCode)
        if (ulbData.length < 1 || !(ulbData[0].MUNI_CODE)) {
            return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json(
                {
                    status: false,
                    message: `Ulb Code not available`
                }
            );
        }
        requiredParams['ulbCode'] = (ulbData[0].MUNI_CODE)
        const data = JSON.stringify(requiredParams)
        try {
            let token = await this.VillageServices.UrbanTokenGeneration({ flag: 1, ulbCode: requiredParams.ulbCode })
            console.log("token after call", token)
            if (typeof token !== 'string') {
                token = token.access_token
                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: `${cdmaHostURL}${cdmaAPIs.searchByDoorNumber}`,
                    headers: {
                        'Referer': `${process.env.URBAN_SERVER_IP}`,
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    data: data
                };
                let response = await axios.request(config);
                if (response?.data) {
                    let finalResponse = [];
                    if (response?.data.length > 0) {
                        finalResponse = response.data.filter(obj => obj.houseNo && obj.houseNo != "N/A")
                    }
                    return res.status(200).send({
                        status: true,
                        message: "Success",
                        code: "200",
                        data: finalResponse, // This will be an array or object — your frontend must handle it accordingly
                    });
                } else {
                    return res.status(404).json({
                        status: true,
                        message: "No data found",
                        data: [],
                    });
                }
            } else {
                return res.status(400).json(`Token Generation failed, ${token}`)
            }
        } catch (ex) {
            if (req.flag) {
                return ex.message
            } else {
                return res.status(400).json({
                    status: false,
                    message: ex.message
                })
            }
        }
    }

    slotEnabled = async (req,res) =>{
        const requiredParams={
            sroCode:req.query.sroCode
        }
        for(let key in requiredParams){
            if(!requiredParams[key]){
                return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: `${NAMES.VALIDATION_ERROR} ${key}`
                    }
                )
            }
        }
        const slotEnabled = await this.urbanService.getSlotEnabledForSRO(requiredParams.sroCode);
        if(slotEnabled.length > 0 && slotEnabled[0].URBAN_MUTATION_STATUS==='Y'){
            return res.status(200).json(
                {
                    status: true,
                    message: 'Data fetched successfully.',
                    data:true,
                    checked:slotEnabled[0].SEC_ENABLE === 'Y' ? true : false
                }
            )
        }else{
            return res.status(200).json({
                status:false,
                message:'Not enabled',
                data:false
            })
        }

    }
 
  
    getPropertyDetails = async (req, res) => {
        const requiredParams = {
            applicationId: req.query.applicationId
        }
        for (let key in requiredParams) {
            if (!requiredParams[key]) {
                return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
            }
        }
        try {
            const response = await this.urbanService.getPropertyDetailsService(requiredParams)
            return res.status(200).json({
                status: true,
                message: 'Data fetched successfully',
                data: response
            })
        } catch (err) {
            return res.status(400).json({
                status: false,
                message: err.message ? err.message : err
            })
        }
    }

    propertyTaxDue = async (req, res) => {
        try {
            const response = await this.urbanService.propertyTaxDueSrvc(req.body)    
            return res.status(200).json({
                status: true,
                message: 'Fetched successfully',
                data: response                
            })
        } catch (err) {
           console.error("UrbanHandler - propertyTaxDue || Error :", err.message);
            var pdeError = constructPDEError(err);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }

    getSecretariatWardbySro = async (req,res)=>{
         const requiredParams={
            sroCode:req.query.sroCode
        }
        for(let key in requiredParams){
            if(!requiredParams[key]){
                return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: `${NAMES.VALIDATION_ERROR} ${key}`
                    }
                )
            }
        }
        requiredParams.villageCode = req.query.villageCode;
        let ulbData;
        if(requiredParams.villageCode){
            ulbData = await this.urbanService.getUlbCodeOfMuncipalityFromMutationEnabled(requiredParams.villageCode)
            if(ulbData.length > 0 ){
                ulbData[0].MUNI_CODE=parseInt(ulbData[0].ULB_CODE)
            };
        }else{
            ulbData = await this.urbanService.getUlbCodeOfMuncipality(requiredParams.sroCode);
        }
        if(ulbData && ulbData.length > 0){
            const secretaritWard = await this.urbanService.getSecretariatWardBysroService(ulbData[0].MUNI_CODE);
            return res.status(200).json(
                {
                    status: true,
                    message: 'Data fetched successfully.',
                    data:secretaritWard
                }
            )
        }else{
            return res.status(404).json({
                status:false,
                message:'Ulb Code was not availble for this SRO',
            })
        }
    }

   getVillageStatus = async (req, res) => {
    try {
        const requiredParams = {
            villageCode: req.query.villageCode
        };

        for (let key in requiredParams) {
            if (!requiredParams[key]) {
                return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send({
                    status: false,
                    message: `${NAMES.VALIDATION_ERROR} ${key}`
                });
            }
        }

        const villageData = await this.urbanService.getUlbCodeOfMuncipalityFromMutationEnabled(requiredParams.villageCode)
        return res.status(200).json({
            status: true,
            message: 'Data fetched successfully.',
            data: villageData
        });

    } catch (error) {
        console.error('Error in getVillageStatus:', error);
        return res.status(500).json({
            status: false,
            message: 'Internal server error.',
            error: error.message || error
        });
    }
};

}

module.exports = urbanHandler;