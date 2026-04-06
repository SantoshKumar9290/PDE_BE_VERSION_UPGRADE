const PDEError = require("../errors/customErrorClass");
var Partiesdb = require("../model/partiesModel");
var PropertyModel = require("../model/propertyModel");
var PropertyStrModel = require("../model/propertyStructureModel");


class PropertyStrDao { 
	create = async (propertyData)=>{

        if(!propertyData){
            console.error("PropertyStrDao - create || Property can't be empty")
            throw new Error("EMPTY Properties");
        }

        const propertyStr = new PropertyStrModel({
            ...propertyData
        })

        try {
            const propertyStrDb = await propertyStr.save();
            return propertyStrDb;
        } catch (error) {
            console.error("PropertyStrDao - create ||  Error : ", error.message);
            throw new PDEError({err: error.message});
        }

    };

	getOneByFilters  =  async (filters) =>{
		try{
			const propertyData = await PropertyStrModel.findOne(filters);
			return propertyData;
		}catch(ex){
			console.log("PropertyStrDao - getOneByFilters || Error : ", ex.message);
            throw new PDEError({err: ex.message});;
		}
	}

    deleteByFilters  =  async (filters) =>{
		try{
			const propertyData = await PropertyStrModel.deleteMany(filters);
			return propertyData;
		}catch(ex){
			console.log("PropertyStrDao - deleteByFilters || Error : ", ex.message);
            throw new PDEError({err: ex.message});;
		}
	};
	updateProperty = async (reqData,propertyData)=>{
		try{
			let filters ={
				propertyId: reqData.propertyId
			}
			// let propertyDb = await this.propertyDao.updateByFilters(filters,propertyData);
			let propertyDb = await PropertyStrModel.findOneAndUpdate(filters,{$set:propertyData})
			return  propertyDb;
		}catch(ex){
			console.error("PropertyService - createProperty || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	}
};
module.exports = PropertyStrDao;