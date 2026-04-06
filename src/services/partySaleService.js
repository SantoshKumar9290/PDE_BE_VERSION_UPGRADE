const MasterDataVillageDao = require("../dao/masterDataVillageDao");
const PartySaleDetailsDao = require("../dao/partySaleDetailsDao");
const PartiesDao = require('../dao/partiesDao');
const PropertiesDao = require('../dao/propertiesDao');
const PropertyStrDao = require('../dao/propertyStructureDao')
const { constructPDEError } = require("../handlers/errorHandler");
const { identity } = require("lodash");
const PropertyService = require("./propertyService");
const {Logger} = require('../../services/winston');
const {maskAadharNumber} = require('../utils/index')
class PartySaleService {

    constructor(){
        this.partySaleDetailsDao = new PartySaleDetailsDao();
        this.masterDataVillageDao = new MasterDataVillageDao();
		this.partiesDao = new PartiesDao();
		this.propertiesDao = new PropertiesDao();
		this.propertyStrDao = new PropertyStrDao();
    }

    getPartySalesFromDocumentId = async (documentId) => {

        try {

            var partySaleDetailsDbFilter = {
                document_id: documentId
            };
            let partySaleDetailsDbResponse = await this.partySaleDetailsDao.getOneByFilters(partySaleDetailsDbFilter);
            console.log("PartySaleService - getPartySalesFromDocumentId || Party Sale Details Db Response : ",partySaleDetailsDbResponse );

            let partiesDetails = {
                executent: [],
                // Representative: [],
                claimant: [],
                witness: [],
                // presenter: []
            }
    
            if(partySaleDetailsDbResponse != null && partySaleDetailsDbResponse.executant_party_ids != null && 
                partySaleDetailsDbResponse.executant_party_ids.length > 0){
                    let dbfilter = {
                        _id: {
                            $in: partySaleDetailsDbResponse.executant_party_ids             
                        }
                    }
                    partiesDetails.executent = await this.partiesDao.getByFilters(dbfilter);
                    if(partiesDetails.executent != null && Object.keys(partiesDetails.executent).length != 0 ){
                        for(let i=0; i< partiesDetails.executent.length; i++){
							let maskAdhar = maskAadharNumber(partiesDetails.executent[i].aadhaar);
							partiesDetails.executent[i].aadhaar =maskAdhar
                            let represents = [];
                            // Add Represents 
                            if(partiesDetails.executent[i].represent != null && partiesDetails.executent[i].represent.length > 0){
                                
                                    dbfilter = {
                                        _id: {
                                            $in: partiesDetails.executent[i].represent        
                                        }
                                    }
                                    let representsData = await this.partiesDao.getRepresntByFilters(dbfilter);
									// console.log("#############",representsData);
                                    // represents.push(representsData);
									partiesDetails.executent[i].represent = representsData;
                            }
                        }
                    }
            }
    
            if(partySaleDetailsDbResponse != null && partySaleDetailsDbResponse.claimant_party_ids != null && 
                partySaleDetailsDbResponse.claimant_party_ids.length > 0){
                    let dbfilter = {
                        _id: {
                            $in: partySaleDetailsDbResponse.claimant_party_ids             
                        }
                    }
                    partiesDetails.claimant = await this.partiesDao.getByFilters(dbfilter);
                    if(partiesDetails.claimant != null && Object.keys(partiesDetails.claimant).length != 0 ){
                        for(let i=0; i< partiesDetails.claimant.length; i++){
                            
                            if(partiesDetails.claimant[i].represent != null && partiesDetails.claimant[i].represent.length > 0){

                                    dbfilter = {
                                        _id: {
                                            $in: partiesDetails.claimant[i].represent         
                                        }
                                    }
                                    let representsData = await this.partiesDao.getRepresntByFilters(dbfilter);
                                    partiesDetails.claimant[i].represent = representsData;
                            }
                        }
                    }
            }

            // Witness
            if(partySaleDetailsDbResponse != null && partySaleDetailsDbResponse.witness_party_ids != null && 
                partySaleDetailsDbResponse.witness_party_ids.length > 0){
                    let dbfilter = {
                        _id: {
                            $in: partySaleDetailsDbResponse.witness_party_ids            
                        }
                    }
                    partiesDetails.witness = await this.partiesDao.getByFilters(dbfilter);
                    if(partiesDetails.witness != null && Object.keys(partiesDetails.witness).length != 0 ){
                        for(let i=0; i< partiesDetails.witness.length; i++){
							let maskAdhar = maskAadharNumber(partiesDetails.witness[i].aadhaar);
							partiesDetails.witness[i].aadhaar =maskAdhar
                            let represents = [];
                            // Add Represents 
                            if(partiesDetails.witness[i].represent != null && partiesDetails.witness[i].represent.length > 0){
                                
                                    dbfilter = {
                                        _id: {
                                            $in: partiesDetails.witness[i].represent        
                                        }
                                    }
                                    let representsData = await this.partiesDao.getRepresntByFilters(dbfilter);
									// console.log("#############",representsData);
                                    // represents.push(representsData);
									partiesDetails.witness[i].represent = representsData;
                            }
                        }
                    }
            }
    
            // if(partySaleDetailsDbResponse != null && partySaleDetailsDbResponse.executant_rep_party_ids != null && 
            //     partySaleDetailsDbResponse.executant_rep_party_ids.length > 0){
            //         let dbfilter = {
            //             _id: {
            //                 $in: partySaleDetailsDbResponse.executant_rep_party_ids             
            //             }
            //         }
            //         partiesDetails.Representative = await this.partiesDao.getByFilters(dbfilter);
            // }
    
            // if(partySaleDetailsDbResponse != null && partySaleDetailsDbResponse.claimant_rep_party_ids != null && 
            //     partySaleDetailsDbResponse.claimant_rep_party_ids.length > 0){
            //         let dbfilter = {
            //             _id: {
            //                 $in: partySaleDetailsDbResponse.claimant_rep_party_ids             
            //             }
            //         }
            //         const claimant_rep_party_data = await this.partiesDao.getByFilters(dbfilter);
            //         Array.prototype.push.apply(partiesDetails.Representative,claimant_rep_party_data); 
            // }
    
            if(partySaleDetailsDbResponse != null && partySaleDetailsDbResponse.presnt_party_ids != null && 
                partySaleDetailsDbResponse.presnt_party_ids.length > 0){
                    let dbfilter = {
                        _id: {
                            $in: partySaleDetailsDbResponse.presnt_party_ids             
                        }
                    }
                    partiesDetails.presenter = await this.partiesDao.getByFilters(dbfilter);
                    if(partiesDetails.presenter === null || partiesDetails.presenter.length === 0){
                        partiesDetails.presenter = await this.partiesDao.getRepresntByFilters(dbfilter);
                    }
            }
            // if(partySaleDetailsDbResponse != null && partySaleDetailsDbResponse.claimant_presnt_party_ids != null && 
            //     partySaleDetailsDbResponse.claimant_presnt_party_ids.length > 0){
            //         let dbfilter = {
            //             _id: {
            //                 $in: partySaleDetailsDbResponse.claimant_presnt_party_ids             
            //             }
            //         }
            //         const claimant_presnt_party_data = await this.partiesDao.getByFilters(dbfilter);
            //         Array.prototype.push.apply(partiesDetails.presenter,claimant_presnt_party_data); 
            // }

            console.log("PartySaleService - getPartySalesFromDocumentId ||  PartiesDetails : ",partiesDetails );

			if(partiesDetails && partiesDetails.executent && partiesDetails.executent.length >0){
				for(let i in partiesDetails.executent){
					if(partiesDetails.executent[i].represent && partiesDetails.executent[i].represent.length >0){
						for(let j in partiesDetails.executent[i].represent){
							let maskAdhar =maskAadharNumber(partiesDetails.executent[i].represent[j].aadhaar);
							let excutentRepParty={...partiesDetails.executent[i].represent[j],aadhaar:maskAdhar};
							excutentRepParty._doc.aadhaar =maskAdhar;
							partiesDetails.executent[i].represent[j] =excutentRepParty._doc
						}
					}
					let maskAdhar =maskAadharNumber(partiesDetails.executent[i].aadhaar)
					let excutentParty={...partiesDetails.executent[i],aadhaar:maskAdhar}
					excutentParty._doc.aadhaar =maskAdhar;
					partiesDetails.executent[i] =excutentParty._doc
				}
			}
			if(partiesDetails && partiesDetails.claimant && partiesDetails.claimant.length >0){
				for(let i in partiesDetails.claimant){
					if(partiesDetails.claimant[i].represent && partiesDetails.claimant[i].represent.length >0){
						for(let j in partiesDetails.claimant[i].represent){
							let maskAdhar =maskAadharNumber(partiesDetails.claimant[i].represent[j].aadhaar);
							let excutentRepParty={...partiesDetails.claimant[i].represent[j],aadhaar:maskAdhar};
							excutentRepParty._doc.aadhaar =maskAdhar;
							partiesDetails.claimant[i].represent[j] =excutentRepParty._doc
						}
					}
					let maskAdhar =maskAadharNumber(partiesDetails.claimant[i].aadhaar)
					let excutentParty={...partiesDetails.claimant[i],aadhaar:maskAdhar}
					excutentParty._doc.aadhaar =maskAdhar;
					partiesDetails.claimant[i] =excutentParty._doc
				}
			}
			if(partiesDetails.presenter && partiesDetails.presenter.length >0){
				for(let i in partiesDetails.presenter){
					let maskAdhar =maskAadharNumber(partiesDetails.presenter[i].aadhaar)
					let excutentParty={...partiesDetails.presenter[i],aadhaar:maskAdhar}
					excutentParty._doc.aadhaar =maskAdhar;
					partiesDetails.presenter[i] =excutentParty._doc
				}
			}

            // Witness
            if(partiesDetails && partiesDetails.witness && partiesDetails.witness.length >0){
				for(let i in partiesDetails.witness){
					if(partiesDetails.witness[i].represent && partiesDetails.witness[i].represent.length >0){
						for(let j in partiesDetails.witness[i].represent){
							let maskAdhar =maskAadharNumber(partiesDetails.witness[i].represent[j].aadhaar);
							let excutentRepParty={...partiesDetails.witness[i].represent[j],aadhaar:maskAdhar};
							excutentRepParty._doc.aadhaar =maskAdhar;
							partiesDetails.witness[i].represent[j] =excutentRepParty._doc
						}
					}
					let maskAdhar =maskAadharNumber(partiesDetails.witness[i].aadhaar)
					let excutentParty={...partiesDetails.witness[i],aadhaar:maskAdhar}
					excutentParty._doc.aadhaar =maskAdhar;
					partiesDetails.witness[i] =excutentParty._doc
				}
			}
            console.log(partiesDetails,"%%%%%%%%%%%%%%%%%%%%%%%%%%");
            return partiesDetails;

        } catch (error) {
			Logger.error(error.message);
            console.error("PartySaleService - getPartySalesFromDocumentId ||  Error : ", error.message);
            throw constructPDEError(error);
        }

    }
}

module.exports = PartySaleService;