const PDEError = require("../errors/customErrorClass");
var PartiesSaleDetailsDb = require("../model/partySaleDetailsModel");

class PartySaleDetailsDao { 

    create = async (partySaleDetailsData)=>{

        if(!partySaleDetailsData){
            console.error("PartySaleDetailsDao - create || Party can't be empty")
            throw new Error("EMPTY PartySaleDetailsDao");
        }

        const partySaleDetails = new PartiesSaleDetailsDb({
            ...partySaleDetailsData
        })

        try {
            const partySaleDetailsDbResponse = await partySaleDetails.save(partySaleDetails);
            return partySaleDetailsDbResponse;
        } catch (error) {
            console.error("PartySaleDetailsDao - create ||  Error : ", error.message);
            throw new PDEError({err: error.message});
        }

    }

    getByFilters = async (filters) => {
        try {
            const partyDetailsData = await PartiesSaleDetailsDb.find(filters);
            return partyDetailsData;
        } catch (error) {
            console.log("PartySaleDetailsDao - getByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

    getOneByFilters = async (filters) => {
        try {
            const partyDetailsData = await PartiesSaleDetailsDb.findOne(filters);
            return partyDetailsData;
        } catch (error) {
            console.log("PartySaleDetailsDao - getByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

    updateOneByFilters = async (filters, updates) => {
        try {
            const partyDetailsData = await PartiesSaleDetailsDb.findOneAndUpdate(filters, updates);
            return partyDetailsData;
        } catch (error) {
            console.log("PartySaleDetailsDao - getByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

    deleteOneByFilters = async (filters) => {
        try {
            const partyDetailsData = await PartiesSaleDetailsDb.deleteOne(filters);
            return partyDetailsData;
        } catch (error) {
            console.log("PartySaleDetailsDao - deleteOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

    deleteManyByFilters = async (filters) => {
        try {
            const partyDetailsData = await PartiesSaleDetailsDb.deleteMany(filters);
            return partyDetailsData;
        } catch (error) {
            console.log("PartySaleDetailsDao - deleteManyByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

    
}

module.exports = PartySaleDetailsDao;