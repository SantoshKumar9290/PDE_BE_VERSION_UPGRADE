const PDEError = require("../errors/customErrorClass");
var Partiesdb = require("../model/partiesModel");
var PropertyModel = require("../model/propertyModel");
var section47AModel = require("../model/section47AModel");
var PropertyStrModel = require("../model/propertyStructureModel");
// var go134Model = require ("../model/go134Model")


class PropertiesDao { 
	create = async (propertyData)=>{

        if(!propertyData){
            console.error("PropertiesDao - create || Property can't be empty")
            throw new Error("EMPTY Properties");
        }

        const property = new PropertyModel({
            ...propertyData
        })

        try {
            const propertyDb = await property.save();
            return propertyDb;
        } catch (error) {
            console.error("PropertiesDao - create ||  Error : ", error.message);
            throw new PDEError({err: error.message});
        }

    }
	getOneByFilters = async (filters) => {
        try {
            const propertyData = await PropertyModel.findOne(filters);
            return propertyData;
        } catch (error) {
            console.log("PropertiesDao - getOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

	getByFilters = async (filters) =>{
		try{
			const propertyData = await PropertyModel.find(filters);
			return propertyData;
		}catch(ex){
			console.log("PropertiesDao - getByFilters || Error : ", ex.message);
            throw new PDEError({err: ex.message});
		}
		
	}
	
    updateByFilters = async (filters,update) =>{
		try{
			const propertyData = await PropertyModel.findOneAndUpdate(filters,{$set:update});
			return propertyData;
		}catch(ex){
			console.log("PropertiesDao - updateByFilters || Error : ", ex.message);
            throw new PDEError({err: ex.message});
		}
		
	}
	updateOneByFilters = async (filters, updates) => {
        try {
            const partyUpdatedData = await PropertyModel.findOneAndUpdate(filters, updates);
            return partyUpdatedData;
        } catch (error) {
            console.log("PropertiesDao - updateOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }
    deleteByFilters = async (filters) =>{
		try{
			const propertyData = await PropertyModel.deleteMany(filters);
			return propertyData;
		}catch(ex){
			console.log("PropertiesDao - deleteByFilters || Error : ", ex.message);
            throw new PDEError({err: ex.message});
		}
		
	}
    getOneByFilterssection47 = async (filters) => {
        try {
            const propertyData = await section47AModel.findOne(filters);
            return propertyData;
        } catch (error) {
            console.log("PropertiesDao - getOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }
    getDataByAggregation = async(filterQueryObj)=>{
        try{
            const propertyData = await PropertyModel.aggregate([{$match:filterQueryObj}])
            return propertyData;
        }catch(ex){
            console.log("PropertiesDao - getDataByAggregation || Error : ", ex.message);
            throw new PDEError({err: ex.message});
        }
    }
    bulkUpdate = async (updatedData)=>{
        try {            
            const partyUpdatedData = await PropertyModel.bulkWrite(updatedData);
            return partyUpdatedData;
        } catch (error) {
            console.log("PropertiesDao - updateManyByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }
};
module.exports = PropertiesDao;