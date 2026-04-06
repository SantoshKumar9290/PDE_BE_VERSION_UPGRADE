const { update } = require("lodash");
const PDEError = require("../errors/customErrorClass");
var CovanantDb = require("../model/covenantModel");

class CovanantDao { 
	createandUpdate = async (covanantData)=>{
		if(!covanantData){
            console.error("CovanantDao - create || Covanant can't be empty")
            throw new Error("EMPTY Covenants");
        }
        try {
			let covanants = await CovanantDb.findOne({documentId:covanantData.documentId});
			let data;
			if(covanants){
                let query= covanantData.type=='acquation' ? {acquireCovenents:covanantData.acquireCovenents} : {covanants:covanantData.covanants};
				data = await CovanantDb.findOneAndUpdate({documentId:covanantData.documentId},{$set:query});
			}else{
				    const covanant = new CovanantDb({
            			...covanantData
        			})
					data = await covanant.save();
			}
            return data;
        } catch (error) {
            console.error("CovanantDao - create ||  Error : ", error.message);
            throw new PDEError({err: error.message});
        }
	}
	

    getOneByFilters = async (filters) => {
        try {
            const covanantsData = await CovanantDb.findOne(filters);
            return covanantsData;
        } catch (error) {
            console.log("CovanantDao - getOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }
	getByFilters = async (filters) => {
        try {
            const covanantsData = await CovanantDb.find(filters);
            return covanantsData;
        } catch (error) {
            console.log("CovanantDao - getByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

	
    updateOneByFilters = async (filters, updates) => {
        try {
            const updatedData = await CovanantDb.findOneAndUpdate(filters, updates);
            return updatedData;
        } catch (error) {
            console.log("CovanantDao - updateOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

    delOneByFilters = async (filters,updates) => {
        try {
            const covanantData = await CovanantDb.updateOne(filters,updates)
            return covanantData;
        } catch (error) {
            console.log("CovanantDao - delOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }
}

module.exports = CovanantDao;