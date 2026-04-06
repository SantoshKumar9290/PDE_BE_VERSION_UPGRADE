const PDEError = require("../errors/customErrorClass");
var Partiesdb = require("../model/partiesModel");
var RepresentativeDb = require('../model/representModel');
var DocumentDetailsDb = require("../model/documentDetailsModel");

class PartiesDao { 

    create = async (partyData)=>{

        if(!partyData){
            console.error("PartiesDao - create || Party can't be empty")
            throw new Error("EMPTY PARTY");
        }

        const party = new Partiesdb({
            ...partyData
        })

        try {
            const partyDb = await party.save(party);
            return partyDb;
        } catch (error) {
            console.error("PartiesDao - create ||  Error : ", error.message);
            throw new PDEError({err: error.message});
        }

    }

    getByFilters = async (filters) => {
        try {
            const partiesData = await Partiesdb.find(filters);
            return partiesData;
        } catch (error) {
            console.log("PartiesDao - getByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

    getOneByFilters = async (filters) => {
        try {
            const partiesData = await Partiesdb.findOne(filters);
            return partiesData;
        } catch (error) {
            console.log("PartiesDao - getOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

    updateOneByFilters = async (filters, updates) => {
        try {
            const partyUpdatedData = await Partiesdb.findOneAndUpdate(filters, updates);
            return partyUpdatedData;
        } catch (error) {
            console.log("PartiesDao - updateOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }
	updateFilters = async (filters, updates) => {
        try {
            const partyUpdatedData = await Partiesdb.updateMany(filters, {$push:updates});
            return partyUpdatedData;
        } catch (error) {
            console.log("PartiesDao - updateOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});
        }
    }

    updateOneByFiltersForRepresentative = async (filters, updates) => {
        try {
            const representUpdateData = await RepresentativeDb.findOneAndUpdate(filters, {$set: updates});
            return representUpdateData;
        } catch (err) {
            console.log("PartiesDao - updateOneByFiltersForRepresentative || Error : ", error.message);
            throw new PDEError({err: error.message});
        }
    }

    updateByFiltersForRepresentative = async (filters, updates) => {
        try {
            const representUpdateData = await RepresentativeDb.updateMany(filters, {$set: updates});
            return representUpdateData;
        } catch (err) {
            console.log("PartiesDao - updateOneByFiltersForRepresentative || Error : ", error.message);
            throw new PDEError({err: error.message});
        }
    }

    deleteOneByFilters = async (filters) => {
        try {
            const partiesData = await Partiesdb.deleteOne(filters);
            return partiesData;
        } catch (error) {
            console.log("PartiesDao - deleteOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }
	delOneRepByFilters = async (filters,updates) => {
        try {
            const partiesData = await Partiesdb.updateOne(filters,updates)
            return partiesData;
        } catch (error) {
            console.log("PartiesDao - delOneRepByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

    deleteManyByFilters = async (filters) => {
        try {
            const partiesData = await Partiesdb.deleteMany(filters);
            return partiesData;
        } catch (error) {
            console.log("PartiesDao - deleteManyByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    };

	createRepresntive = async (repData)=>{
		
        if(!repData){
            console.error("PartiesDao - createRepresntive || representative can't be empty")
            throw new Error("EMPTY PARTY");
        }

        const represent = new RepresentativeDb({
            ...repData
        })

        try {
            const represntDb = await represent.save();
            return represntDb;
        } catch (error) {
            console.error("PartiesDao - createRepresntive ||  Error : ", error.message);
            throw new PDEError({err: error.message});
        }
	}

	deleteOneRepByFilters = async (filters) => {
        try {
            const partiesData = await RepresentativeDb.deleteOne(filters);
            return partiesData;
        } catch (error) {
            console.log("PartiesDao - deleteOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }
	getOneRepresentByFilters = async (filters) => {
        try {
            const partiesData = await RepresentativeDb.findOne(filters);
            return partiesData;
        } catch (error) {
            console.log("PartiesDao - getOneRepresentByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

	getRepresntByFilters = async (filters) => {
        try {
            const representData = await RepresentativeDb.find(filters);
            return representData;
        } catch (error) {
            console.log("PartiesDao - getRepresntByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

    getDataByJoin = async (filters, lookUp) => {
        try {
            const partiesData = await Partiesdb.aggregate([ 
                { "$addFields": { "str_id": { "$toString": "$_id" }}},
                {$match: {...filters}}, 
                {$lookup: lookUp }
              ]);
            return partiesData;
        } catch (error){
            console.log("PartiesDao - getDataByJoin || Error : ", error.message);
            throw new PDEError({err: error.message});
        }
    }

    getPartyDataByDateRange = async (startDate, endDate, type) => {
        try {
            const filters = {
                updatedAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
            };
    
            if (type === "S") {
                filters.partyType = "Societies";
            } else if (type === "F") {
                filters.partyType = "Firms/Company";
            } else {
                filters.partyType = { $in: ["Firms/Company", "Societies"] };
            }
    
            const result = await Partiesdb.aggregate([
                { $match: filters }, 
                { 
                    $lookup: {  
                        from: DocumentDetailsDb.collection.name,
                        localField: "applicationId", 
                        foreignField: "documentId",
                        as: "documents"
                    }
                },
                { $unwind: "$documents" },
                { $match: { "documents.status": "SYNCED" } },
                { 
                    $project: {  
                        _id: 1,  
                        applicationId: 1,
                        partyType: 1,
                        updatedAt: 1,
                        "Partiesdb": "$$ROOT"
                    }  
                }
            ]);
            return result.length > 0 ? result : null;
    
        } catch (error) {
            console.log("PartiesDao - getPartyDataByDateRange || Error : ", error.message);
            throw new PDEError({ err: error.message });
        }
    };
    getLookSlotDataByJoin = async (filters, lookUp,filter2) => {
        try {
            const partiesData = await Partiesdb.aggregate([ 
                { "$addFields": { "str_id": { "$toString": "$_id" }}},
                {$match: {...filters}}, 
                {$lookup: lookUp },
                {$match: {...filter2}}, 
              ]);
            return partiesData;
        } catch (error){
            console.log("PartiesDao - getDataByJoin || Error : ", error.message);
            throw new PDEError({err: error.message});
        }
    }

    getPartiesAndRepresentJoin = async (query) => {
        try{
            const filters = await Partiesdb.aggregate(query).exec();
            return filters
        }catch(error){
            console.log("PartiesDao - getPartiesAndRepresentJoin || Error : ", error.message);
            throw new PDEError({err: error.message});
        }    
    }

}

module.exports = PartiesDao;