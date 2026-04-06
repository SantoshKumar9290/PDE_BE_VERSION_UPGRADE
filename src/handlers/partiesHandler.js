const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const PDEError = require("../errors/customErrorClass");
const PartiesService = require("../services/partiesService");
const { partyValidation } = require('../utils/validations');
const { constructPDEError } = require("./errorHandler");
const sysConstanst = require("../utils/sysConstanst");
const PartyDao = require('../dao/partiesDao');
const { encryptWithAESPassPhrase, maskAadharNumber, decryptWithAESPassPhrase,encryptData } = require('../utils/index');
const moment = require("moment");
const axios = require("axios");
const https = require("https");
const thirdPartyAPIResponseDao= require('../dao/thirdPartyAPIResponseDao');
const orDbDao = require('../dao/oracleDbDaos')
const {thirdPartyDepartments}=require('../utils/config')

class PartiesHandler {

    constructor() {
        this.partiesService = new PartiesService();
        this.PartyDao = new PartyDao()
        this.thirdPartyAPIDao = new thirdPartyAPIResponseDao();
        this.orDao = new orDbDao();
    }

    createParties = async (req, res) => {
        console.log("PartiesHandler - createParties || Request is ", req.body);
        let partiesData = {};
        if (req == null || req.body == null) {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        } else {
            partiesData = req.body;
            partiesData.isSelectedPanOrForm60 = req.body.objectType;
            if (!(partiesData.isLinkedDocument != null && partiesData.isLinkedDocument == true) && (partiesData.name == null || partiesData.representType == null || partiesData.email == null || partiesData.phone == null || partiesData.address == null ||
                partiesData.applicationId == null)) {
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
        }
        if (partiesData && partiesData.aadhaar) {            
            let encryptedData = encryptData(partiesData.aadhaar);
            encryptedData = Buffer.from(encryptedData).toString('base64');
            partiesData.aadhaar = encryptedData;
        }
        let validation = await partyValidation(partiesData, req.user, sysConstanst.REQ_METHOD_CREATE);
        if (validation && validation.status === false) {
            let codes = validation.code ? NAMES.UNAUTHORIZED : NAMES.VALIDATION_ERROR;
            res.status(NAMES_STATUS_MAPPINGS[codes]).send(
                {
                    status: false,
                    message: validation.err
                }
            );
            return;
        }
        try {
            if (partiesData.isPresenter == null)
                partiesData.isPresenter = false;
            let response = await this.partiesService.createParties(partiesData);
            res.status(200).send(
                {
                    status: true,
                    message: "Party Created Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("PartiesHandler - createParties || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }

    updateParties = async (req, res) => {
        console.log("PartiesHandler - updateParties || Request is ", req.body);
        let partiesData = {};
        if (req == null || req.body == null) {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        } else {
            partiesData = req.body;
            partiesData.isSelectedPanOrForm60 = req.body.objectType
            if (!(partiesData.isLinkedDocument != null && partiesData.isLinkedDocument == true) &&
                (partiesData.name == null || partiesData.email == null || partiesData.phone == null || partiesData.address == null ||
                    partiesData.applicationId == null || partiesData.partyId == null)) {
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
        }
        if (partiesData && partiesData.aadhaar) {
            let encryptedData = encryptData(partiesData.aadhaar);
            encryptedData = Buffer.from(encryptedData).toString('base64');
            partiesData.aadhaar = encryptedData;
        }
        try {
            let response = await this.partiesService.updateParties(partiesData, req?.user);
            if (response != null) {
                res.status(200).send(
                    {
                        status: true,
                        message: "Party Updated Successfully",
                        code: "200",
                    }
                );
            }
        } catch (error) {
            console.error("PartiesHandler - updateParties || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: error?.message != null ? error.message : NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }

    updatePresenter = async (req, res) => {
        console.log("PartiesHandler - updatePresenter || Request is ", req.body);
        let partiesData = {};
        if (req == null || req.body == null || req.body.partyId == null || req.body.applicationId == null) {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        try {
            partiesData = req.body;
            partiesData.isSelectedPanOrForm60 = req.body.objectType
            let response = await this.partiesService.updatePresenter(partiesData);
            res.status(200).send(
                {
                    status: true,
                    message: "Presenter Updated Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("PartiesHandler - updatePresenter || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }
    createRepresentative = async (req, res) => {
        console.log();
        console.log("PartiesHandler - createRepresentative || Request is ", req.body);
        let partiesData = {};
        if (req == null || req.body == null) {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        } else {
            partiesData = req.body;
            partiesData.isSelectedPanOrForm60 = req.body.objectType
            if (partiesData.name == null || partiesData.relationType == null || partiesData.relationName == null || partiesData.age == null || partiesData.panNoOrForm60or61 == null ||
                partiesData.aadhaar == null || partiesData.phone == null || partiesData.address == null || partiesData.documentId == null || partiesData.parentPartyId == null) {
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
        }
        if (partiesData && partiesData.aadhaar) {
            let encryptedData = encryptData(partiesData.aadhaar);
            encryptedData = Buffer.from(encryptedData).toString('base64');
            partiesData.aadhaar = encryptedData;
        }
        let validation = await partyValidation(partiesData, req.user, sysConstanst.REQ_METHOD_CREATE);
        if (validation && validation.status === false) {
            let codes = validation.code ? NAMES.UNAUTHORIZED : NAMES.VALIDATION_ERROR;
            res.status(NAMES_STATUS_MAPPINGS[codes]).send(
                {
                    status: false,
                    message: validation.err
                }
            );
            return;
        }
        try {
            let response = await this.partiesService.createRepresenter(partiesData);
            res.status(200).send(
                {
                    status: true,
                    message: "represent Created Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("PartiesHandler - createParties || Error :", error.message);
            var pdeError = constructPDEError(error);
            if(pdeError.name === NAMES.DUPLICATE_ERROR){
                return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                    {
                        status: false,
                        message: "Same Aadhaar not allowed for party and their representative"
                    }            
                )
            } else{
                res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                    {
                        status: false,
                        message: NAMES.INTERNAL_SERVER_ERROR
                    }
                );
            }
        }
    }
    deleteRepresentative = async (req, res) => {
        console.log("PartiesHandler - deleteRepresentative || Request is ", req.params);
        let partiesData = req.params;
        if (req == null || req.params == null || req.params.partyId == null || req.params.parentPartyId == null) {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        // documentId/:partyId/:parentPartyId
        let checkValidate = await this.PartyDao.getRepresntByFilters({ _id: partiesData.partyId, documentId: partiesData.documentId })
        if (checkValidate && checkValidate.length === 0) {
            return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: "MissMatch.."
                })
        }
        try {
            partiesData = req.params;
            let response = await this.partiesService.deleteRepresentative(partiesData);
            res.status(200).send(
                {
                    status: true,
                    message: "Presenter Deleted Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("PartiesHandler - deleteRepresentative || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }

    deleteParties = async (req, res) => {
        console.log("PartiesHandler - deleteParties || Request is ", req.body);
        let partiesData = req.params;
        let checkValidate = await this.PartyDao.getByFilters({ _id: partiesData.id, applicationId: partiesData.applicationId })
        if (checkValidate && checkValidate.length === 0) {
            return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: "MissMatch.."
                })
        }

        try {
            let response = await this.partiesService.deleteParties(partiesData);
            res.status(200).send(
                {
                    status: true,
                    message: "Party Deleted Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("PartiesHandler - deleteParties || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }

    getPartiesByAppId = async (req, res) => {
        try {
            let response = await this.partiesService.getParties(req.query.id);
            return res.status(200).send({
                status: true,
                response
            })
        } catch (error) {
            console.error("PartiesHandler - getPartiesByAppId || Error :", error.message);
            var pdeError = constructPDEError(error);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }
    getPresenterData = async (req, res) => {
        try {
            const reqData = req.body;
            let response = await this.partiesService.getIsPresenterData(reqData);
            if (response && response.length > 0) {
                let hash = encryptWithAESPassPhrase(JSON.stringify(response), sysConstanst.HASHING_PASSPHRASE);
                return res.status(200).send({
                    status: true,
                    hash
                })
            } else {
                return res.status(400).send({
                    status: false,
                    message: "No Presenter Data"
                })
            }

        } catch (error) {
            console.error("PartiesHandler - getPartiesByAppId || Error :", error.message);
            var pdeError = constructPDEError(error);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }

    getPartiesData = async (req, res) => {
        try {
            const { startDate, endDate, type } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).send({
                    status: false,
                    message: "Start date and end date are required."
                });
            }

            const startMoment = moment(startDate, 'YYYY-MM-DD', true);
            const endMoment = moment(endDate, 'YYYY-MM-DD', true);

            if (!startMoment.isValid() || !endMoment.isValid()) {
                return res.status(400).send({
                    status: false,
                    message: "Invalid date format. Use 'YYYY-MM-DD'."
                });
            }

            if (!endMoment.isAfter(startMoment)) {
                return res.status(400).send({
                    status: false,
                    message: "End date must be a future date compared to the start date."
                });
            }

            const response = await this.partiesService.getPartyData(startDate, endDate, type);

            if (!response || response.length === 0) {
                return res.status(404).send({
                    status: false,
                    message: "No Data Found"
                });
            }

            const filteredResponse = response.map(item => {
                const party = item._doc || item;
                return {
                    dapartmentName: "IGRS-AP",
                    ServiceName: party.partyType === "Firms/Company" ? "FIRMS - PDE-CARD" : "SOCIETIES - PDE-CARD",
                    applicationNumber: party.applicationId || null,
                    SocietyName: party.partyType || null,
                    applicantName: party.Partiesdb.name || null,
                    applicantMobile: party.Partiesdb.phone || null,
                    applicantEmail: party.Partiesdb.email || null,
                    applicantAddress: party.Partiesdb.address || null,
                    dateApplied: moment(party.updatedAt).format('DD-MM-YYYY') || null,
                    dateApproved: item.R_DATE ? moment(item.R_DATE).format('DD-MM-YYYY') : null,
                    currentStatus: item.filePath ? "Accepted" : "Pending",
                    feePaidNumber: item.TOTAL_AMOUNT || null,
                    feePaiddate: item.RECEIPT_DATE ? moment(item.RECEIPT_DATE).format('DD-MM-YYYY') : null,
                    approvalDocumentUrl: item.filePath || null
                };
            });

            return res.status(200).send({
                status: true,
                response: filteredResponse
            });
        } catch (error) {
            console.error("PartiesHandler - getPartiesData || Error :", error.message);
            const pdeError = constructPDEError(error);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name] || 500).send({
                status: false,
                message: NAMES.INTERNAL_SERVER_ERROR
            });
        }
    };


    getMutationReportForEODB = async (req, res) => {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).send({
                    status: false,
                    message: "Start date and end date are required."
                });
            }

            const startMoment = moment(startDate, 'DD-MM-YYYY', true);
            const endMoment = moment(endDate, 'DD-MM-YYYY', true);

            if (!startMoment.isValid() || !endMoment.isValid()) {
                return res.status(400).send({
                    status: false,
                    message: "Invalid date format. Use 'DD-MM-YYYY'."
                });
            }

            if (!endMoment.isAfter(startMoment)) {
                return res.status(400).send({
                    status: false,
                    message: "End date must be a future date compared to the start date."
                });
            }

            let response = await this.partiesService.getMutationDataForEODB(req.query);
            if (response.length === 0) {
                res.status(404).send({
                    status: false,
                    message: "No Data Found",
                    code: "404"
                })
                return;
            } else {
                let responseData = {
                    status: true,
                    message: "Success",
                    code: "200",
                    data: response
                };
                res.status(200).send({ ...responseData });
            }
        } catch (ex) {
            console.error("PartiesHandler - getMutationReportForEODB || Error :", error.message);
            const pdeError = constructPDEError(error);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name] || 500).send({
                status: false,
                message: NAMES.INTERNAL_SERVER_ERROR
            });
        }
    }

    // Edit Index Esign Functionality.
    createPartiesEditIndex = async (req, res) => {
        let partiesData = req.body;
        const requiredFields = ['referenceId', 'documentId', 'executent', 'claimant', 'property'];
        for (let field of requiredFields) {
            if (partiesData[field] === undefined || partiesData[field] === null || partiesData[field] === '') {
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json({
                    status: false,
                    message: `Validation Error: '${field}' is required`
                });
                return;
            }
        }
        try {
            let response = await this.partiesService.createPartiesEditIndex(partiesData);
            res.status(200).json(
                {
                    status: true,
                    message: "Party Created Successfully",
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("PartiesHandler - createParties || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).json(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }

    getDocumentEditIndexbyID = async (req, res) => {
        let partiesData = req.query;
        if (!partiesData.referenceId) {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).json(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        }
        try {
            let response = await this.partiesService.getDocumentEditIndexbyIDSrvc(partiesData);
            res.status(200).json(
                {
                    status: true,
                    code: "200",
                    data: response
                }
            );
        } catch (error) {
            console.error("PartiesHandler - getDocumentEditIndexbyID || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).json(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }

    // Form60-start
    createForm60Report = async (req, res) => {
        const reqBody = req.body;
        console.log("::::::::::::bodyyy from params", reqBody);
        let appId = req.params.appid;
        console.log("::::::::::::appId from params", appId);

        try {
            let response = await this.partiesService.createForm60ReportSrvc(reqBody, appId);
            console.log("::::::::::::createForm60Report response", response);
            if (response.status === 200) {
                return res.status(200).send({
                    status: true,
                    data: response.data
                });
            } else {
                return res.status(response.status).send({
                    status: false,
                    message: response.error
                });
            }
        } catch (error) {
            console.error("PartiesHandler - createForm60Report || Error:", error.message);
            var pdeError = constructPDEError(error);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send({
                status: false,
                message: NAMES.INTERNAL_SERVER_ERROR
            });
        }
    }


    verifyEsignStatus = async (req, res) => {
        const reqBody = req.body;
        try {
            console.log("reqBody ::::: ", reqBody);
            let response = await this.partiesService.verifyEsignStatus(reqBody);
            console.log("::::::::::::createForm60Report response", response);
            if (response) {
                return res.status(200).send({
                    status: true,
                    data: response
                });
            } else {
                return res.status(404).send({
                    status: false,
                    message: "Esign details not found"
                });
            }
        } catch (error) {
            console.error("PartiesHandler - verifyEsignStatus || Error:", error.message);
            var pdeError = constructPDEError(error);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send({
                status: false,
                message: NAMES.INTERNAL_SERVER_ERROR
            });
        }
    }

    downloadForm60ById = async (req, res) => {
        try {
            let requestData = req.body;
            console.log(":::requestData", requestData);
            let response = await this.partiesService.downloadForm60ByIdSrvc(requestData);
            if (response) {
                return res.status(200).send({
                    status: true,
                    data: response
                });
            } else {
                return res.status(404).send({
                    status: false,
                    message: "Data not found"
                });
            }
        } catch (error) {
            console.error("PartiesHandler - downloadForm60ById || Error :", error);
            this.processErrorResponse(res, error);
            return;
        }
    }

    


    checkPANvalidation = async (req, res) => {
    const reqBody = req.body;
    let panNumber = reqBody.pan; 
    panNumber = encryptWithAESPassPhrase(`${panNumber}`, "igrsSecretPhrase");
    const paramsToStoreThirdPartyData={
        source:thirdPartyDepartments.pan,
        userID: req?.user?.userId
    };
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        const url = `${process.env.PAN_VALIDATION_URL}`;
        const data = {
            pan: panNumber,
            name: reqBody.name,
            fathername: "",
            dob: reqBody.dob
        };
        paramsToStoreThirdPartyData.request={
            method:'post',
            url:url,
            headers: headers,
            parameters:data
        }
        let result = await axios({
            method: "POST",
            data: data,
            url: url,
            headers: headers,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            }),
            timeout: 0
        });
        paramsToStoreThirdPartyData.response=result.data;
		paramsToStoreThirdPartyData.status='success';
        let responseData = {
            status: true,
            message: "Success",
            statusCode: "200",
            data: result.data
        };
       return res.status(200).send(responseData);


    } catch (error) {
        console.error("PartiesHandler - checkPANvalidation || Error:", error);
        const pdeError = constructPDEError(error);
        paramsToStoreThirdPartyData.response=error.data?error.data:error.message;
		paramsToStoreThirdPartyData.status='failed';
        return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send({
            status: false,
            message: NAMES.INTERNAL_SERVER_ERROR
        });
    }finally{
            await this.thirdPartyAPIDao.create({...paramsToStoreThirdPartyData,module:'PDE'})
    }
};

getPartyDetailsDatabyId = async (req, res) => {        
        const reqParams = req.params        
        try {
            let response = await this.partiesService.getPartyDetailsdatByIdSrvc(reqParams);
            return res.status(200).send({
                status: true,
                response
            })
        } catch (error) {
            console.error("PartiesHandler - getPartyDetailsDatabyId || Error :", error.message);
            var pdeError = constructPDEError(error);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }
    // Form60-end

    getSaleCumGPADetails = async (req, res) => {  
        const queries = req.query
        console.log(queries.sr_code, "queryies")
        if(
            queries.sr_code == undefined || queries.book_no == undefined || queries.doct_no == undefined || queries.reg_year == undefined ||
            queries.sr_code == '' || queries.book_no == '' || queries.doct_no == '' || queries.reg_year == ''
        ){
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send({
                status: false,
                message: NAMES.VALIDATION_ERROR
            });
            return;
        } else {      
            try {
                let response = await this.partiesService.getSaleCumGPADetails(queries);
                return res.status(200).send({
                    status: true,
                    response
                })
            } catch (error) {
                console.error("PartiesHandler - getPartyDetailsDatabyId || Error :", error.message);
                var err= constructPDEError(error);
                return res.status(NAMES_STATUS_MAPPINGS[err.name]).send(
                    {
                        status: false,
                        message: NAMES.INTERNAL_SERVER_ERROR
                    }
                );
            }
        }
    }

    getSEZRepresentativeList = async (req, res) => {  
        try {
            let response = await this.partiesService.getSEZRepresentativeList();
            return res.status(200).send({
                status: true,
                response
            })
        } catch (error) {
            console.error("PartiesHandler - getSEZRepresentativeList || Error :", error.message);
            var err= constructPDEError(error);
            return res.status(NAMES_STATUS_MAPPINGS[err.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }

    updatePartyNamesCard = async (req, res) => {
        let partiesData = {};
        if (req == null || req.body == null) {
            res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                {
                    status: false,
                    message: NAMES.VALIDATION_ERROR
                }
            );
            return;
        } else {
            partiesData = req.body;
            const parties = ['PUBLIC','NRI'];
            if ((partiesData.nameTe == null || (partiesData.relationNameTe == null && parties.includes(partiesData.parties.toUpperCase())) || partiesData.applicationId == null || partiesData.seqNumber == null || partiesData.partyCode == null || partiesData.parties == null)) {
                res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
                    {
                        status: false,
                        message: NAMES.VALIDATION_ERROR
                    }
                );
                return;
            }
        }
        try {
            let response = await this.partiesService.updatePartyNamesCard(partiesData);
            if (response != null) {
                res.status(200).send(
                    {
                        status: true,
                        message: "Party Updated Successfully",
                        code: "200",
                    }
                );
            }
        } catch (error) {
            console.error("PartiesHandler - updatePartyNamesCard || Error :", error.message);
            var pdeError = constructPDEError(error);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: error?.message != null ? error.message : NAMES.INTERNAL_SERVER_ERROR
                }
            );
        }
    }
}

module.exports = PartiesHandler;