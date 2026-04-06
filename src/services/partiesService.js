const { NAMES } = require("../constants/errors");
const PartiesDao = require("../dao/partiesDao");
const PartySaleDetailsDao = require("../dao/partySaleDetailsDao");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("../handlers/errorHandler");
const { Logger } = require('../../services/winston');
const DocumentDetailsDao = require("../dao/documentDetailsDao");
const { encryptWithAESPassPhrase, maskAadharNumber, encryptData,decryptData } = require('../utils/index')
const StatusHistory = require('../model/statusHistoryModel');
const User = require("../dao/userDao");
const orDbDao = require('../dao/oracleDbDaos')
const EditPartiesDao = require("../dao/editPartiesDoa");
const path = require('path');
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const axios = require('axios');
const EsignService = require("../services/esignService");
const mongoose = require("mongoose");
const fs = require('fs');
const pdfjsLib = require('pdfjs-dist');
const fsp = require('fs').promises;
const Parties = require('../model/partiesModel')
const ObjectId = mongoose.Types.ObjectId;

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

class PartiesService {

    constructor() {
        this.partiesDao = new PartiesDao();
        this.partySaleDetailsDao = new PartySaleDetailsDao();
        this.documentDetailsDao = new DocumentDetailsDao();
        this.user = new User();
        this.dbDao = new orDbDao();
        this.EditPartiesDao = new EditPartiesDao();
        this.esignService = new EsignService();
    }

    createParties = async (partiesData) => {
        try {
            // create parties
            partiesData.panNoOrForm60or61=encryptData(partiesData.panNoOrForm60or61)
             Logger.info(`PartiesService - createParties ===> ${JSON.stringify(partiesData)}`);
             partiesData.panNoOrForm60or61 = decryptData(partiesData.panNoOrForm60or61)
            let seqCount = await this.partiesDao.getByFilters({ applicationId: partiesData.applicationId, partyCode: partiesData.partyCode });
            partiesData.seqNumber = !seqCount ? 1 : seqCount.length + 1;
            let partyDbData = await this.partiesDao.create(partiesData);
            // update parties if he is representative
            if (partiesData.representType.toUpperCase() == "REPRESENTATIVE") {
                let parentData = await this.partiesDao.getByFilters({ _id: partiesData.parentPartyId });
                if (parentData == null || Object.keys(parentData).length == 0) {
                    console.log("PartiesService - createParties || No Parent Party Details Present");
                    throw new PDEError({ name: NAMES.NOT_FOUND, err: "No Parent Party Details Present" });
                }
                let representIds = [];
                if (parentData.represent != null && parentData.represent.length > 0) {
                    representIds = parentData.represent;
                }
                representIds.push(partyDbData._id);
                await this.partiesDao.updateOneByFilters({ _id: partiesData.parentPartyId }, { represent: representIds });
            }

            let partySaleDetailsDbFilters = {
                document_id: partiesData.applicationId
            };
            let partySaleDetailsDbResponse = await this.partySaleDetailsDao.getOneByFilters(partySaleDetailsDbFilters);
            console.log("PartiesService - createParties || partySale details db response ", partySaleDetailsDbResponse);
            if (partySaleDetailsDbResponse == null) {
                console.log("PartiesService - createParties || No Paty Sale Details Present");
                throw new PDEError({ name: NAMES.NOT_FOUND, err: "No Paty Sale Details Present" });
            }
            let partyIds = [];
            let partySaleDetailsDbUpdate = {};
            let partiesDbData = [];
            switch (partiesData.representType.toUpperCase()) {
                case 'EXECUTANT':
                    if (partySaleDetailsDbResponse.executant_party_ids != null || partySaleDetailsDbResponse.executant_party_ids.length > 0)
                        partyIds = partySaleDetailsDbResponse.executant_party_ids;
                    partiesDbData = await this.partiesDao.getByFilters(
                        {
                            _id: {
                                $in: partyIds
                            }
                        }
                    );
                    // for(let i=0; i < partiesDbData.length; i++){
                    //     if(partiesDbData[i].aadhaar == partiesData.aadhaar){
                    //         throw new PDEError({name: NAMES.DUPLICATE_ERROR, err: "Party Already Present"});
                    //     }
                    // }
                    partyIds.push(partyDbData._id);
                    partySaleDetailsDbUpdate.executant_party_ids = partyIds;
                    break;
                case 'CLAIMANT':
                    if (partySaleDetailsDbResponse.claimant_party_ids != null || partySaleDetailsDbResponse.claimant_party_ids.length > 0)
                        partyIds = partySaleDetailsDbResponse.claimant_party_ids;
                    partiesDbData = await this.partiesDao.getByFilters(
                        {
                            _id: {
                                $in: partyIds
                            }
                        }
                    );
                    // for(let i=0; i < partiesDbData.length; i++){
                    //     if(partiesDbData[i].aadhaar == partiesData.aadhaar){
                    //         throw new PDEError({name: NAMES.DUPLICATE_ERROR, err: "Party Already Present"});
                    //     }
                    // }
                    partyIds.push(partyDbData._id);
                    partySaleDetailsDbUpdate.claimant_party_ids = partyIds;
                    break;
                case 'WITNESS':
                    if (partySaleDetailsDbResponse.witness_party_ids != null || partySaleDetailsDbResponse.witness_party_ids.length > 0)
                        partyIds = partySaleDetailsDbResponse.witness_party_ids;
                    partiesDbData = await this.partiesDao.getByFilters(
                        {
                            _id: {
                                $in: partyIds
                            }
                        }
                    );
                    // for(let i=0; i < partiesDbData.length; i++){
                    //     if(partiesDbData[i].aadhaar == partiesData.aadhaar){
                    //         throw new PDEError({name: NAMES.DUPLICATE_ERROR, err: "Party Already Present"});
                    //     }
                    // }
                    partyIds.push(partyDbData._id);
                    partySaleDetailsDbUpdate.witness_party_ids = partyIds;
                    break;

            }


            await this.partySaleDetailsDao.updateOneByFilters(partySaleDetailsDbFilters, partySaleDetailsDbUpdate);
            let maskAdhar = maskAadharNumber(partyDbData.aadhaar);
            let fPartyData = { ...partyDbData, aadhaar: maskAdhar };
            fPartyData._doc.aadhaar = maskAdhar
            return fPartyData._doc;
        } catch (error) {
            Logger.error(error.message);
            console.error("PartiesService - createParties || Error : ", error.message);
            throw constructPDEError(error);
        }
    }

    updateParties = async (partiesData, reqUser) => {
        try {

            let validation = await this.validatePartyUpdateAccess(partiesData, reqUser);
            if (!validation) {
                throw new PDEError({ name: NAMES.UNAUTHORIZED, err: "Unauthorized access to update the party" });
            }

            let partyDbFilter = {
                _id: partiesData.partyId
            }
            let partyDbData = await this.partiesDao.updateOneByFilters(partyDbFilter, partiesData);
            console.log("PartiesService - updateParties || Parties Updated Reponse : ", partyDbData);
            Logger.info(`PartiesService - updateParties ===> ${JSON.stringify(partyDbData)}`);
            return partyDbData;
        } catch (error) {
            Logger.error(error.message);
            console.error("PartiesService - updateParties || Error : ", error.message);
            throw constructPDEError(error);
        }
    }
    createRepresenter = async (represntData) => {
        try {
            let parentData = await this.partiesDao.getByFilters({ _id: represntData.parentPartyId });
            if (parentData == null || Object.keys(parentData).length == 0) {
                console.log("PartiesService - createRepresenter || No Parent Party Details Present");
                throw new PDEError({ name: NAMES.NOT_FOUND, err: "No Parent Party Details Present" });
            }
            if(parentData && parentData[0]?.aadhaar ===  represntData.aadhaar) {
                throw new PDEError({ name: NAMES.DUPLICATE_ERROR});
            }
            let seqNumber = await this.partiesDao.getRepresntByFilters({ documentId: represntData.documentId, parentPartyId: represntData.parentPartyId });
            if (seqNumber == null) {
                represntData.seqNumber = 1
            } else {
                represntData.seqNumber = seqNumber.length + 1;
            }
            let response = await this.partiesDao.createRepresntive(represntData);
            let representIds = [];
            if (parentData.represent != null && parentData.represent.length > 0) {
                representIds = parentData.represent;
            }
            representIds.push(response._id);
            await this.partiesDao.updateFilters({ _id: represntData.parentPartyId }, { represent: response._id });
            let maskAdhar = maskAadharNumber(response.aadhaar);
            let fPartyData = { ...response, aadhaar: maskAdhar };
            fPartyData._doc.aadhaar = maskAdhar
            return fPartyData._doc;
        } catch (error) {
            Logger.error(error.message);
            console.error("PartiesService - createRepresenter || Error : ", error.message);
            throw constructPDEError(error);
        }
    }

    updatePresenter = async (partiesData) => {
        try {

            // let validation = await this.validatePartyUpdateAccess(partiesData);
            // if(!validation){
            //     throw new PDEError({name: NAMES.UNAUTHORIZED, err: "Unauthorized access to update the party"});
            // }

            let partyDbData = await this.partiesDao.getByFilters({ _id: partiesData.partyId });
            let representData;
            // condition check to see if party is found
            if (partyDbData == null || Object.keys(partyDbData).length == 0) {
                // if party not found, then find it in representatives table
                representData = await this.partiesDao.getOneRepresentByFilters({ _id: partiesData.partyId });
                // if even representative is not found, then throw error
                if (representData == null) {
                    throw new PDEError({ name: NAMES.NOT_FOUND, err: "No Party Details Present" });
                }
            }

            let partySaleDetailsDbFilters = {
                document_id: partiesData.applicationId
            };
            // find party sale details by document id
            let partySaleDetailsDbResponse = await this.partySaleDetailsDao.getOneByFilters(partySaleDetailsDbFilters);
            console.log("PartiesService - updatePresenter || partySale details db response ", partySaleDetailsDbResponse);
            // if sale details not found, then throw error
            if (partySaleDetailsDbResponse == null) {
                console.log("PartiesService - updatePresenter || No Party Sale Details Present");
                throw new PDEError({ name: NAMES.NOT_FOUND, err: "No Party Sale Details Present" });
            }
            // if sale details found, update presenter Id array 
            await this.partySaleDetailsDao.updateOneByFilters(partySaleDetailsDbFilters, { presnt_party_ids: [partiesData.partyId] });
            // if party is present, then make him/her as presenter by updating isPresenter flag to true
            partyDbData && partyDbData.length && await this.partiesDao.updateOneByFilters({ _id: partiesData.partyId }, { isPresenter: true });
            // if representer is found, then update isPresenter flag of him to true
            representData && await this.partiesDao.updateOneByFiltersForRepresentative({ _id: partiesData.partyId }, { isPresenter: true });
            let partyDbFilter = {};
            // the below if code is to make previous party/representative not as presenter
            if (partySaleDetailsDbResponse.presnt_party_ids != null && partySaleDetailsDbResponse.presnt_party_ids.length > 0) {
                partyDbFilter = {
                    _id: partySaleDetailsDbResponse.presnt_party_ids[0]
                }
                await this.partiesDao.updateOneByFilters(partyDbFilter, { isPresenter: false });
                await this.partiesDao.updateOneByFiltersForRepresentative(partyDbFilter, { isPresenter: false });
                console.log("PartiesService - updatePresenter || Parties Updated Reponse - 2 ");
            }
            console.log("PartiesService - updatePresenter || Parties Presenter Updated ");
            return partyDbData && partyDbData.length ? partyDbData : representData;
        } catch (error) {
            Logger.error(error.message);
            console.error("PartiesService - updatePresenter || Error : ", error.message);
            throw constructPDEError(error);
        }
    }

    deleteParties = async (partiesData) => {
        try {
            let partDbFilter = {
                _id: partiesData.id
            }
            let partyDbData = await this.partiesDao.getOneByFilters(partDbFilter);
            let documentDbResponse = await this.documentDetailsDao.getOneByFilters({ documentId: partiesData.applicationId });

            let user = await this.user.userFindMethod({ loginId: documentDbResponse.userId });
            //statusHistory
            let Object = {
                currentStatus: documentDbResponse.status,
                api: "delete Parties",
                userData: user[0]
            }
            let stausHistoryData = await StatusHistory.findOne({ applicationId: partiesData.applicationId });
            if (!stausHistoryData) {
                await StatusHistory.findOneAndUpdate({ applicationId: partiesData.applicationId }, { $set: Object }, { upsert: true })
            } else if (stausHistoryData && stausHistoryData.currentStatus === "SYNCED") {
                console.log("PartiesService - deleteDocument || Synced Document");
                throw new PDEError({ name: NAMES.BAD_REQUEST, err: "We cannot delete a synced document PartyDetails." });
            }
            else {
                await StatusHistory.findOneAndUpdate({ applicationId: partiesData.applicationId }, { $set: Object }, { upsert: true })
            }
            await this.partiesDao.deleteOneByFilters(partDbFilter);
            let setSequence = await this.partiesDao.getByFilters({ applicationId: partyDbData.applicationId, partyCode: partyDbData.partyCode });
            for (let i of setSequence) {
                if (i.seqNumber != 1 && i.seqNumber > partyDbData.seqNumber) {
                    let sqNumber = Number(i.seqNumber) - 1;
                    await this.partiesDao.updateOneByFilters({ _id: i._id }, { seqNumber: sqNumber });
                }
            }
            // if(partyDbData != null && partyDbData.length > 0 && partyDbData.represent)
            let partySaleDetailsDbFilters = {
                document_id: partiesData.applicationId
            };
            let partySaleDetailsDbResponse = await this.partySaleDetailsDao.getOneByFilters(partySaleDetailsDbFilters);
            console.log("PartiesService - deleteParties || partySale details db response ", partySaleDetailsDbResponse);
             Logger.info(`PartiesService - deleteParties ===> ${JSON.stringify(partySaleDetailsDbResponse)}`);
            if (partySaleDetailsDbResponse == null) {
                console.log("PartiesService - deleteParties || No Paty Sale Details Present");
                return partyDbData;
            }
            let partySaleDetailsDbUpdate = {};

            if ((partySaleDetailsDbResponse.executant_party_ids != null || partySaleDetailsDbResponse.executant_party_ids.length > 0) &&
                partySaleDetailsDbResponse.executant_party_ids.includes(partiesData.id) === true) {

                partySaleDetailsDbResponse.executant_party_ids.remove(partiesData.id);
                partySaleDetailsDbUpdate.executant_party_ids = partySaleDetailsDbResponse.executant_party_ids;

            } else if ((partySaleDetailsDbResponse.claimant_party_ids != null || partySaleDetailsDbResponse.claimant_party_ids.length > 0) &&
                partySaleDetailsDbResponse.claimant_party_ids.includes(partiesData.id) === true) {

                partySaleDetailsDbResponse.claimant_party_ids.remove(partiesData.id);
                partySaleDetailsDbUpdate.claimant_party_ids = partySaleDetailsDbResponse.claimant_party_ids;

            }
            await this.partySaleDetailsDao.updateOneByFilters(partySaleDetailsDbFilters, partySaleDetailsDbUpdate);
            return partyDbData;
        } catch (error) {
            Logger.error(error.message);
            console.error("PartiesService - createParties || Error : ", error.message);
            throw constructPDEError(error);
        }
    }

    deleteRepresentative = async (partiesData) => {
        try {
            let partDbFilter = {
                _id: partiesData.parentPartyId
            }

           // let partyDbData = await this.partiesDao.getOneByFilters(partDbFilter);
            //Checking is the represent really belonging to the same parent
            // if(partyDbData == null || partyDbData.length == 0 || partyDbData.represent == null || partyDbData.represent.length == 0 ||
            //     partyDbData.represent[0] != partiesData.partyId)
            // {
            //     console.log("PartiesService - deleteRepresentative || Parent party Id & Represent ID Mismatch");
            //     throw new PDEError({name: NAMES.BAD_REQUEST, err: "Parent party Id & Represent ID Mismatch"});
            // }
            let delDocument = {
                documentId: partiesData.documentId,
                _id: partiesData.partyId
            }
            let prRepData = await this.partiesDao.getOneRepresentByFilters(delDocument);
            let setSequence = await this.partiesDao.getRepresntByFilters({ parentPartyId: partiesData.parentPartyId, documentId: partiesData.documentId });
            for (let i of setSequence) {
                if (i.seqNumber != 1 && i.seqNumber > prRepData.seqNumber) {
                    let sqNumber = Number(i.seqNumber) - 1;
                    await this.partiesDao.updateOneByFiltersForRepresentative({ _id: i._id }, { seqNumber: sqNumber });
                }
            }
            partDbFilter = {
                _id: partiesData.partyId
            }
            const update = {
                $pull: {
                    represent: {
                        _id: partiesData.partyId
                    }
                }
            }
            await this.partiesDao.deleteOneRepByFilters(partDbFilter);

             let prDbFilter = {
                _id: partiesData.parentPartyId,
                form60EsignBy: "Represent"
            }
            let response = await this.partiesDao.updateOneByFilters(prDbFilter, { form60EsignStatus: null, form60EsignTxnId: null, form60EsignBy: null });

           prDbFilter = {
                _id: partiesData.parentPartyId
            }
            this.partiesDao.delOneRepByFilters(prDbFilter, update);
            console.log("PartiesService - deleteRepresentative || Represent Id deleted succesfully");
             Logger.info(`PartiesService - deleteRepresentative ===> ${JSON.stringify(prDbFilter)}`);
            return "success";

        } catch (error) {
            Logger.error(error.message);
            console.error("PartiesService - deleteRepresentative || Error : ", error.message);
            throw constructPDEError(error);
        }
    }


    validatePartyUpdateAccess = async (reqBody, reqUser) => {

        // Check Access
        let documentDbData = await this.documentDetailsDao.getOneByFilters({ documentId: reqBody.applicationId });
        if (reqUser.loginType == "officer") {
            if (documentDbData == null || documentDbData.sroCode !== reqUser?.sroNumber) {
                return false;
            }
        } else if (reqUser.loginType == "USER") {
            if (documentDbData == null || documentDbData.userId !== reqUser.userId) {
                return false;
            }
        } else {
            throw new PDEError({ name: NAMES.UNAUTHORIZED, err: "UnAuthorized Access" });
        }

        //Check wether the partyId is present or not
        let partySaleDbData = await this.partySaleDetailsDao.getOneByFilters({ document_id: reqBody.applicationId })
        if (partySaleDbData == null || partySaleDbData.length == 0)
            return false;
        // let partyIds = [];
        // partyIds.push(partySaleDbData.executant_party_ids);
        // partyIds.push(partySaleDbData.claimant_party_ids);
        // partyIds.push(partySaleDbData.presnt_party_ids);
        // console.log("$$$$$$$$$$$$$$$$$$$$$$$$$",partyIds)
        // if(!partyIds.includes(reqBody.partyId))
        //     return false;
        return true;
    }

    getParties = async (id) => {
        try {
            let filters = { 'applicationId': id };
            let lookup = {
                "from": 'party_represent_detail',
                "localField": "str_id",
                "foreignField": "parentPartyId",
                "as": 'represents'
            }
            let result = await this.partiesDao.getDataByJoin(filters, lookup);
            return result;
        } catch (error) {
            Logger.error(error.message);
            console.error("PartiesService - getParties || Error : ", error.message);
            throw constructPDEError(error);
        }
    }

    getFilePath = async (reqData) => {
        try {
            let bindParams = {
                'SR_CODE': reqData.SR_CODE,
                'BOOK_NO': reqData.BOOK_NO,
                'DOCT_NO': reqData.RDOCT_NO,
                'REG_YEAR': reqData.REG_YEAR
            };
            console.log(bindParams, "Binding parameters");
            let ccData = encodeURIComponent(JSON.stringify(bindParams));
            ccData = encryptData(ccData);
            let docLink = `${process.env.PDE_HOST}/PDE/CCdownloadPage?data=${ccData}`;
            console.log(docLink, "link")
            return docLink;
        } catch (ex) {
            Logger.error("PartiesService - getFilePath || Error :", ex.message);
            throw constructPDEError(ex);
        }
    };

    getPartyData = async (startDate, endDate, type) => {
        try {
            const result = await this.partiesDao.getPartyDataByDateRange(startDate, endDate, type);

            if (!result || result.length === 0) {
                return null;
            }

            const applicationIds = result.map(party => party.applicationId);

            const formattedStartDate = `TO_DATE('${startDate}', 'YYYY-MM-DD')`;
            const formattedEndDate = `TO_DATE('${endDate}', 'YYYY-MM-DD')`;

            let insertarray = []

            for (const appId of applicationIds) {
                const insertQuery = `
                    INSERT INTO srouser.eodb_Firms_data (STARTDATE, ENDDATE, APP_ID)
                    values(${formattedStartDate}, ${formattedEndDate}, '${appId}')
                `;
                insertarray.push(insertQuery)
            }
            await this.dbDao.oDbInsertMultipleDocs(insertarray, "insertdata");

            const query = `
                SELECT
                    t.sr_code,
                    t.reg_year,
                    t.doct_no,
                    t.rdoct_no,
                    t.book_no,
                    t.r_date,
                    p.app_id,
                    COALESCE(SUM(c.chargeable_value), 0) AS total_amount,
                    MAX(c.receipt_date) AS receipt_date
                FROM tran_major t
                JOIN pde_doc_status_cr p
                    ON t.sr_code = p.sr_code
                    AND t.doct_no = p.doct_no
                    AND t.reg_year = p.reg_year
                    AND t.book_no = p.book_no
                LEFT JOIN cash_det c
                    ON t.sr_code = c.sr_code
                    AND t.doct_no = c.doct_no
                    AND t.reg_year = c.reg_year
                WHERE t.rdoct_no IS NOT NULL
                AND p.doc_assign = 'Y'
                AND p.app_id IN (SELECT APP_ID FROM srouser.eodb_Firms_data 
                WHERE STARTDATE = ${formattedStartDate} AND ENDDATE = ${formattedEndDate})
                GROUP BY t.sr_code, t.reg_year, t.doct_no, t.rdoct_no, t.book_no, t.r_date, p.app_id
            `;

            const oracleResult = await this.dbDao.oDBQueryService(query);

            if (oracleResult.length === 0) {
                await this.dbDao.oDbDelete(`DELETE FROM srouser.eodb_Firms_data WHERE STARTDATE = ${formattedStartDate} AND ENDDATE = ${formattedEndDate}`);
                return null;
            }

            const resultMap = Object.fromEntries(result.map(party => [party.applicationId, party]));
            const mergedData = await Promise.all(
                oracleResult.map(async item => {
                    const filePath = await this.getFilePath(item);
                    return { ...resultMap[item.APP_ID], ...item, filePath };
                })
            );

            await this.dbDao.oDbDelete(`DELETE FROM srouser.eodb_Firms_data WHERE STARTDATE = ${formattedStartDate} AND ENDDATE = ${formattedEndDate}`);
            return mergedData;
        } catch (error) {
            Logger.error("PartiesService - getPartyData || Error :", error.message);
            throw constructPDEError(error);
        }
    };


    getMutationDataForEODB = async (reqData) => {
        try {
            let query = `SELECT DISTINCT
                         dc.PREREG_ID AS Application_ID,
                        TO_CHAR(se.ENTRY_DATE, 'DD-MM-YYYY') AS Application_Date,
                        TO_CHAR(dc.REG_DT, 'DD-MM-YYYY') AS Registered_Date,
                         0 AS fee,
                         0 AS total_fee
                        FROM doc_ack dc
                        JOIN SROUSER.WEBLAND_STATUS_SURV_CR wss
                        ON wss.sr_code = dc.sr_code
                        AND wss.Book_no = dc.Book_no
                        AND wss.Doct_no = dc.Doct_no
                        AND wss.Reg_year = dc.Reg_year
                        LEFT JOIN SROUSER.WEBLAND_STATUS_LPM_CR wsl
                        ON wsl.sr_code = dc.sr_code
                        AND wsl.Book_no = wss.Book_no
                        AND wsl.Doct_no = wss.Doct_no
                        AND wsl.Reg_year = wss.Reg_year
                        left join schedule_entry  se on se.id =  dc.PREREG_ID
                        AND TRUNC(se.ENTRY_DATE) BETWEEN TO_DATE(:startDate, 'DD-MM-YYYY')
                        AND TO_DATE(:endDate, 'DD-MM-YYYY')
                        WHERE  se.ENTRY_DATE  IS NOT NULL`;

            const bindparam = {
                startDate: reqData.startDate,
                endDate: reqData.endDate,
            };

            let result = await this.dbDao.oDBQueryServiceWithBindParams(query, bindparam);
            return result;
        } catch (ex) {
            Logger.error("PartiesService - getMutationDataForEODB || Error :", error.message);
            throw constructPDEError(error);
        }
    }


    getIsPresenterData = async (reqData) => {
        try {
            let filters = { 'applicationId': reqData.applicationId };
            let lookup = {
                "from": 'party_represent_detail',
                "localField": "str_id",
                "foreignField": "parentPartyId",
                "as": 'represents'
            }
            let filter2 = {
                $or: [
                    { represents: { $elemMatch: { isPresenter: true } } },
                    { isPresenter: true }
                ]

            }
            let result = await this.partiesDao.getLookSlotDataByJoin(filters, lookup, filter2);
            if (result[0].isPresenter) {
                if (result[0].aadhaar && result[0].aadhaar.length > 12) {  
                    let decryptedData = Buffer.from(result[0].aadhaar, 'base64').toString('utf-8');
                    decryptedData = decryptData(decryptedData);
                    result[0].aadhaar = decryptedData;                
                }
            } else if (result[0].represents && result[0].represents.length > 0) {
                result[0].represents.map((rep) => {
                    if (rep.isPresenter && rep.aadhaar && rep.aadhaar.length > 12) {
                        let decryptedData = Buffer.from(rep.aadhaar, 'base64').toString('utf-8');
                        decryptedData = decryptData(decryptedData);
                        rep.aadhaar = decryptedData;
                    }
                });
            }
            return result;
        } catch (ex) {
            Logger.error(ex.message);
            console.error("PartiesService - getParties || Error : ", ex.message);
            throw constructPDEError(ex);
        }
    }

    // Edit Index Esign Functionality.
    createPartiesEditIndex = async (partiesData) => {
        try {
            // create parties
            let seqCount = await this.EditPartiesDao.getByFilters({ referenceId: partiesData.referenceId });
            let partyDbData;
            if (seqCount.length === 0) {
                partyDbData = await this.EditPartiesDao.create(partiesData);
            }
            else {
                partyDbData = await this.EditPartiesDao.updateOneByFilters({ referenceId: partiesData.referenceId }, partiesData);
            }
            // let maskAdhar = maskAadharNumber(partyDbData.aadhaar);
            // let fPartyData ={...partyDbData,aadhaar:maskAdhar};
            // fPartyData._doc.aadhaar =maskAdhar
            return partyDbData;
        } catch (error) {
            Logger.error(error.message);
            console.error("PartiesService - createPartiesEditIndex || Error : ", error.message);
            throw constructPDEError(error);
        }
    }

    getDocumentEditIndexbyIDSrvc = async (partiesData) => {
        try {
            // create parties
            let seqCount = await this.EditPartiesDao.getByFilters({ referenceId: partiesData.referenceId });
            return seqCount;
        } catch (error) {
            Logger.error(error.message);
            console.error("PartiesService - getDocumentEditIndexbyIDSrvc || Error : ", error.message);
            throw constructPDEError(error);
        }
    }

    //form60-start
    createForm60ReportSrvc = async (reqBody, documentId) => {
        try {
            const formData = { ...reqBody };
            if (documentId) {
                formData.applicationId = documentId;
            }
            const htmlPath = path.join(__dirname, '../html/index.html');
            let html = fs.readFileSync(htmlPath, 'utf-8');
            let signerName = formData.signerName;

            html = await this.updateDynamicValuesToHtml(formData, html, signerName);

            const outputDir = process.env.PDF_PATH;
            const fileName = `form60_${documentId}_${new Date().getTime()}.pdf`;
            const filePath = path.join(outputDir, fileName);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const browser = await puppeteer.launch({
                headless: true,
                //  headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                path: filePath,
                printBackground: true,
                format: 'A4',
                margin: { top: 30, right: 20, bottom: 30, left: 20 }
            });
            await browser.close();

            //   const textWithPositions = await this.extractTextWithPositionsFromPDF(filePath);
            //   console.log("textWithPositions :::::: ", textWithPositions);
            // let coOrdinatesData = "2-65,245,50,100;"
              let coOrdinatesData = "2-65,575,50,100;"
            var pdfBase64String = pdfBuffer.toString('base64');
            let transactionid = uuidv4();


            let eSignData = {
                "rrn": transactionid,
                "coordinates_location": "Top_Right",
                "coordinates": coOrdinatesData,
                "doctype": "PDF",
                "uid": formData.aadhaarNo,
                // "uid": '',
                "signername": signerName?.substring(0, 50),
                "signerlocation": formData.areaLocality,
                "filepassword": "",
                "signreason": "Form60 declaration",
                "authmode": 1,
                "webhookurl": process.env.ESIGN_REDIRECTION_URL_FORM60,
                "file": pdfBase64String
            };
            let esignUrl = process.env.IGRS_ESIGN_URL;
            let esignRequestData = encryptWithAESPassPhrase(JSON.stringify(eSignData), "igrsSecretPhrase");
            let eSignReponse = await this.esignService.igrsEsignAxiosCall(esignUrl, esignRequestData);
            if (eSignReponse.status == "Success") {
                return {
                    status: 200,
                    data: {
                        message: 'Application submitted successfully',
                        eSignData: eSignReponse,
                        transId: transactionid
                    }
                };
            } else {
                throw new Error("Esign service issue. Please try after sometime");
            }

        } catch (error) {
            console.error('Error creating form and generating PDF:', error);
            return {
                status: 500,
                error: 'Error generating PDF'
            };
        }
    };

    extractTextWithPositionsFromPDF = async (pdfFilePath) => {
        const data = new Uint8Array(fs.readFileSync(pdfFilePath));
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdfDocument = await loadingTask.promise;

        let textWithPositions = [];

        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const content = await page.getTextContent();
            content.items.forEach(item => {
                if ((item.str).includes("Signature of declarant")) {
                    textWithPositions.push({
                        text: item.str,
                        x: Math.floor(item.transform[4]),
                        y: Math.floor(item.transform[5]),
                        page: i
                    });
                }
            });
        }

        return textWithPositions;
    }


    updateDynamicValuesToHtml = async (documentRequested, html, signerName) => {

   

        console.log("ECSearchService - Inside of updateDynamicValuesToHtml ");
        html = html.replace(/{fName}/g, documentRequested.fName ?? '');
        html = html.replace("{mName}", documentRequested.mName ?? '');
        html = html.replace(/{sName}/g, documentRequested.sName ?? '');
        html = html.replace("{dateOfBirth}", documentRequested.fDate ?? '');
        html = html.replace("{fatherFName}", documentRequested.ffName ?? '');
        html = html.replace("{fatherMName}", documentRequested.fmName ?? '');
        html = html.replace("{fatherSName}", documentRequested.fsName ?? '');
        html = html.replace("{flatNum}", documentRequested.flatNo ?? '');
        html = html.replace("{floorNum}", documentRequested.floorNo ?? '');
        html = html.replace("{premises}", documentRequested.namePremises ?? '');
        html = html.replace("{blockNum}", documentRequested.blackName ?? '');
        html = html.replace("{roadStreet}", documentRequested.roadStreet ?? '');
        html = html.replace(/{locality}/g, documentRequested.areaLocality ?? '');
        html = html.replace("{town}", documentRequested.townCity ?? '');
        html = html.replace("{district}", documentRequested.district ?? '');
        html = html.replace("{state}", documentRequested.state ?? '');
        html = html.replace("{pincode}", documentRequested.pinCode ?? '');
        html = html.replace("{telNum}", documentRequested.telNo ?? '');
        html = html.replace("{phoneNum}", documentRequested.mobileNo ?? '');
        html = html.replace("{tranAmount}", documentRequested.transAmount ?? '');
        html = html.replace("{tranDate}", documentRequested.transDate ?? '');
        html = html.replace("{jointPersNum}", documentRequested.jointName ?? '');
        html = html.replace("{aadhaarNum}", documentRequested.aadhaarNo ?? '');
        html = html.replace("{dateAndAckNum}", documentRequested.ackdate ?? '');
        html = html.replace("{AckNum}", documentRequested.ackNo ?? '');
        html = html.replace("{agriIncome}", documentRequested.agrIncome ?? '');
        html = html.replace("{signerName}", signerName ?? '');
        html = html.replace("{otherThanAgriIncome}", documentRequested.nonagrIncome ?? '');
        // html = html.replace("{docIdentityCode}", selectedCode ?? '');
        html = html.replace("{modeOfTransaction}", documentRequested.modeOfTransaction ?? '');
        let identityDocType = documentRequested.identityDocType;
        if(identityDocType!=null && identityDocType!=undefined){
            identityDocType = identityDocType.split("-")[0];
        }

        let addressDocType = documentRequested.addressDocType;
        if(addressDocType!=null && addressDocType!=undefined){
            addressDocType = addressDocType.split("-")[0];
        }
        html = html.replace("{identityDocType}", identityDocType ?? '');
        html = html.replace("{identityDocID}", documentRequested.identityDocID ?? '');
        html = html.replace("{identityDocAuthority}", documentRequested.identityDocAuthority ?? '');
        html = html.replace("{addressDocType}", addressDocType ?? '');
        html = html.replace("{addressDocID}", documentRequested.addressDocID ?? '');
        html = html.replace("{addressDocAuthority}", documentRequested.addressDocAuthority ?? '');

        let dateObj = new Date();
        html = html.replace("{date}", dateObj.getDate());
        html = html.replace("{monthYear}", (months[dateObj.getMonth()] + " " + dateObj.getFullYear()));

        console.log("PartiesService - End of updateDynamicValuesToHtml ");
        return html;
    }

    verifyEsignStatus = async (reqData) => {
        try {
            let statusResponse = await this.esignService.igrsEsignStatusAxiosCall(reqData.txnId);
            if (statusResponse != null && statusResponse.status == "Success") {
                let response = await this.partiesDao.updateOneByFilters({ _id: ObjectId(reqData.partyId), applicationId: reqData.appId }, { form60EsignStatus: 'Y', form60EsignTxnId: reqData.txnId, form60EsignBy: reqData.partyType });
                console.log(":::::responform60EsignByse:::::",response);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error creating form and generating PDF:', error);
            return false;
        }
    };


    downloadForm60ByIdSrvc = async (reqData) => {
        try {
            return await this.esignService.igrsEsignStatusAxiosCall(reqData.txnId);
        } catch (error) {
            console.log("PartiesService - ddownloadForm60ByIdSrvc || Error :", error.message);
            throw error;
        }
    }

     getPartyDetailsdatByIdSrvc = async (id) => {
        try {
            const applicationId = typeof id === 'object' && id.id ? id.id.replace(/^id=/, '') : id;

            const query = [
                        {
                            $match: {
                            applicationId: applicationId,
                            isSelectedPanOrForm60: "form60",
                            form60EsignStatus: "Y"
                            }
                        },
                        {
                            $project: {
                            partyName: "$name",
                            partyCode: 1,
                            str_id: { $toString: "$_id" },
                            isForm60: "$isSelectedPanOrForm60",
                            txnId: "$form60EsignTxnId",
                            eSignStatus: "$form60EsignStatus",
                                isForm60Approved: {
                                    $cond: [
                                        { $and: [ { $eq: ["$isSelectedPanOrForm60", "form60"] }, { $eq: ["$form60EsignStatus", "Y"] } ] },
                                        true,
                                        false
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'party_represent_detail',
                                let: { partyId: "$str_id" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ["$parentPartyId", "$$partyId"]
                                            }
                                        }
                                    }
                                ],
                                as: 'represents'
                            }
                        }
                    ];

            let result = await this.partiesDao.getPartiesAndRepresentJoin(query);
            return result;
        } catch (error) {
            Logger.error(error.message);
            console.error("PartiesService - getPartyDetailsdatByIdSrvc || Error : ", error.message);
            throw constructPDEError(error);
        }
    }

    //form60-end
    //isPresenter check
    presenterCheck = async (documentReqData) =>{
        try {
            let partySaleDetails = await this.partySaleDetailsDao.getByFilters({"document_id":documentReqData.applicationId});            
            if(partySaleDetails){
                let presenterId = (partySaleDetails[0].presnt_party_ids)[0];                
                let filters = {'applicationId': documentReqData.applicationId};                                    
                let lookup = {
                    "from": 'party_represent_detail',
                    "localField": "str_id",
                    "foreignField": "parentPartyId",
                    "as": 'represents'
                }
                let filter2 = {
                    $or: [
                        {
                        $and: [
                            { represents: { $elemMatch: { isPresenter: false } } },
                            { represents: { $elemMatch: { _id: new ObjectId(presenterId) } } }
                        ]
                        },
                        {
                        $and: [
                            { isPresenter: false },
                            { _id: new ObjectId(presenterId) }
                        ]
                        }
                    ]
                };                
                let parties = await this.partiesDao.getByFilters({'applicationId': documentReqData.applicationId});                
                let partiesData = await Parties.aggregate([
                    { "$addFields": { "str_id": { "$toString": "$_id" }}},
                    {$match: {...filters}},
                    {$lookup: lookup },
                    {$match: {...filter2}},
                ]);                
                for(let partyData of partiesData){
                    if(partyData.isPresenter==false && partyData._id.toString()==presenterId){
                        await Parties.updateOne(
                        { _id: partyData._id },
                        { $set: { isPresenter: true } }
                    );
                    break;
                    }
                    let representData = partyData.represents;
                    if(representData && representData[0]?.isPresenter==false && representData[0]?._id.toString()==presenterId){
                        await Parties.updateOne(
                            { _id: representData[0]._id },
                            { $set: { isPresenter: true } }
                        );
                    break;
                    }
                }
            }
            else{
                console.log("No Presenter details found")
            }
        } catch (error) {
            console.log("Error:::::::::::::::::::",error)
            return false;
        }
    }

    getSaleCumGPADetails = async (data) =>{
        try {   
            const query = `SELECT 
                                A.*,
                                C.TRAN_DESC, C.TRAN_MAJ_CODE, C.TRAN_MIN_CODE
                            FROM 
                                TRAN_EC A
                            INNER JOIN 
                                TRAN_MAJOR B 
                                ON A.SR_CODE   = B.SR_CODE
                            AND A.RDOCT_NO   = B.RDOCT_NO
                            AND A.RYEAR  = B.RYEAR
                            AND A.BOOK_NO   = B.BOOK_NO
                            INNER JOIN 
                                TRAN_DIR C  
                                ON B.TRAN_MAJ_CODE = C.TRAN_MAJ_CODE
                            AND B.TRAN_MIN_CODE = C.TRAN_MIN_CODE
                            WHERE 
                                A.SR_CODE = :SR_CODE
                            AND A.RDOCT_NO = :DOCT_NO
                            AND A.RYEAR = :REG_YEAR
                            AND A.BOOK_NO  = :BOOK_NO
                            AND CODE IN (
                                    'EX', 'MR', 'DR', 'RR', 'FP', 'LR', 'PL', 
                                    'TR', 'NP', 'DC', 'OR', 'HS', 'PA', 'AR', 'E'
                                )`;
            const values = {
                "SR_CODE" : data.sr_code,
                "DOCT_NO": data.doct_no,
                "REG_YEAR": data.reg_year,
                "BOOK_NO": data.book_no
            }
            const response = await this.dbDao.oDBQueryServiceWithBindParams(query, values);
            return response;
        } catch (ex){
            console.error("partiesService - getSaleCumGPADetails || Error :", ex);
            throw ex;
        }
    }
    getSEZRepresentativeList = async() =>{
        try {   
            const query = `select * from card.sez_representative`;
            const response = await this.dbDao.oDBQueryService(query);
            return response;
        } catch (ex){
            console.error("partiesService - getSEZRepresentativeList || Error :", ex);
            throw ex;
        }
    }

    updatePartyNamesCard = async (partiesData) => {
        try {
            let partyDbFilter = {
                applicationId: partiesData.applicationId,
                partyCode: partiesData.partyCode,
                seqNumber: partiesData.seqNumber
            }
            let partyDbData = await this.partiesDao.updateOneByFilters(partyDbFilter, partiesData);
            return partyDbData;
        } catch (error) {
            console.error("PartiesService - updateParties || Error : ", error.message);
            throw constructPDEError(error);
        }
    }

}

module.exports = PartiesService;