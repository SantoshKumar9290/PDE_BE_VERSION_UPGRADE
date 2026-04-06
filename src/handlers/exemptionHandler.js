const { NAMES_STATUS_MAPPINGS, NAMES } = require('../constants/errors');
const ExemptionDB = require('../model/exemptionModel');
const  EkycExemptionDB = require('../model/ekycExemptionModel')
const { constructPDEError } = require('./errorHandler');
const ekycExemptionStatusDb = require('../model/ekycExemptionStatusModel');


class ExemptionHandler {
    getList = async (req, res) => {
        try {
            let list = await ExemptionDB.find().sort({exemption_id: 1});
            let arr = list.map(l => {
                return [`${l.exemption_id}`, l.tran_major, l.tran_minor, l.GO, l.GO_details_1, l.GO_details_2, l.GO_details_3, l.Stamp_Transfer, l.registration_fee, l.user_charges]
            });
            return res.status(200).send({
                status: true,
                message: "Formatted exemptions list",
                data: arr
            })
        } catch (ex) {
            console.error("ExemptionHandler - getList || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }
    }
    getEkycExemptionData =async(req,res)=>{
        const {majorCode,minorCode}=req.query;
        if(majorCode == undefined || minorCode == undefined){
            return res.status(422).send({
                status: true,
                message: "Please provide both major and minor fields along with Id",
                data: {}
            })
        }
        try{
            let result = await EkycExemptionDB.findOne({
           
                $and :[
                {
                    major_code : majorCode
                },
                {
                    minor_code : minorCode
                }
            ]
            

            });
            if(result === null){
            return res.status(204).send({
                status: true,
                message: "Data not found with the provieded code",
                data: {}
            })
        }
        else{
            return res.status(200).send({
                status: true,
                message: "Fetched succesfully ekyc exemption data",
                data: result
            })
        }
        

        }
        catch(ex){
            console.error("ExemptionHandler - getEkycExeptionData || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }

    }
    updateEkycExemptionStatus=async(req,res)=>{
        const {applicationId,claimants,executants,witness}=req.body
        try{
        if((!applicationId)){
            return res.status(202).send({
                status: true,
                message: "Please provide document Id or document type",
            })
        }
        else{
        let result;
        let isIdPresent=await ekycExemptionStatusDb.findOne({applicationId:applicationId})
        
        if(isIdPresent){
            result=await ekycExemptionStatusDb.updateMany({applicationId:applicationId},
                {
                    $set:{
                        claimants:claimants,
                        executants:executants,
                        witness:witness
                    }
                }
                )
                    
        }
        else{
            result=await ekycExemptionStatusDb.insertMany({
                applicationId:applicationId,
                executants:executants,
                claimants:claimants,
                witness:witness
            })

        }

        return res.status(200).send({ 
            status: true,
            message: "Ekyc exemptions status updated successfully",
            data: result
        })
        
    }
    }
    catch(ex){
        console.error("ExemptionHandler - updateEkycExemptionStatus || Error :", ex.message);
        var pdeError = constructPDEError(ex);
        res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
            {
                status: false,
                message: NAMES.INTERNAL_SERVER_ERROR
            }
        )
    }
    }
    getExemptionStatus=async(req,res)=>{
        const {applicationId}=req.params;
        if(!applicationId){
            return res.status(202).send({
                status: true,
                message: "Please provide documentId",
            })
        }
        try{
            let result = await ekycExemptionStatusDb.findOne({applicationId:applicationId});
            if(result === null){
            return res.status(202).send({
                status: true,
                message: "Data not found with the provieded Id",
                data: {}
            })
        }
        else{
            return res.status(200).send({
                status: true,
                message: "Fetched succesfully ekyc exemption data",
                data: result
            })
        }
        

        }
        catch(ex){
            console.error("ExemptionHandler - getEkycExeptionStatus || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            )
        }
    }
}

module.exports = ExemptionHandler;