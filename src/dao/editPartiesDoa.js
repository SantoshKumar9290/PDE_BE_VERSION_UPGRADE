const PDEError = require("../errors/customErrorClass");
var RepresentativeDb = require('../model/representModel');
var DocumentDetailsDb = require("../model/documentDetailsModel");
var EditIndexPartiesdb = require("../model/editPartiesModal");

class PartiesDao { 

    create = async (partyData)=>{

        if(!partyData){
            console.error("PartiesDao - create || Party can't be empty")
            throw new Error("EMPTY PARTY");
        }

        const party = new EditIndexPartiesdb({
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
            const partiesData = await EditIndexPartiesdb.find(filters);
            return partiesData;
        } catch (error) {
            console.log("PartiesDao - getByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

    updateOneByFilters = async (filters, updates) => {
        try {
            const partyUpdatedData = await EditIndexPartiesdb.findOneAndUpdate(filters, updates);
            return partyUpdatedData;
        } catch (error) {
            console.log("PartiesDao - updateOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }
}

module.exports = PartiesDao;