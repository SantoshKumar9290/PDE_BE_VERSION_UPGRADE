const PDEError = require("../errors/customErrorClass");
const SlotModel = require('../model/slotModel');



class SlotsDao { 

	create = async (slotData) =>{
		
        if(!slotData){
            console.error("SlotsDao - Create || Slot Data can't be Empty")
            throw new Error("EMPTY SlotsDao");
        }

        const slots = new SlotModel({
            ...slotData
        })

        try {
            const slotsDb = await slots.save();
            return slotsDb;
        } catch (error) {
            console.error("SlotsDao - create ||  Error : ", error.message);
            throw new PDEError({err: error.message});
        }
	}
	getByFilters = async (filters)=>{
		try{
			const slotsData = await SlotModel.find(filters);
			return slotsData;
		}catch(ex){
			console.log("SlotsDao - getByFilters || Error : ", ex.message);
            throw new PDEError({err: ex.message});
		}
	}
	deletetheSlot = async (filters)=>{
		try{
			const slotsData = await SlotModel.findOneAndDelete(filters);
			console.log("::::::::::::::::::::delete.mmmmmmmm::::::::::",slotsData)
			return slotsData;
		}catch(ex){
			console.log("SlotsDao - getByFilters || Error : ", ex.message);
            throw new PDEError({err: ex.message});
		}
	}
	getOneByFilters = async (filters)=>{
		try{
			const slotsData = await SlotModel.aggregate([
				{$match:{applicationId:filters.applicationId}}]);
			//  {$match:{"slots":{$elemMatch:{applicationId:filters.applicationId}}}}]);
			return slotsData;
		}catch(ex){
			console.log("SlotsDao - getByFilters || Error : ", ex.message);
            throw new PDEError({err: ex.message});
		}
	}
	getOneSlotByUnwind = async (data)=>{
		try{
			const slotsData = await SlotModel.aggregate([
			{$match:{sroOfcNum:data.sroOfcNum,"applicationId":data.applicationId}}]);
			return slotsData;
		}catch(ex){
			console.log("SlotsDao - getByFilters || Error : ", ex.message);
            throw new PDEError({err: ex.message});
		}
	}
	fAndUpdate = async (filters,updates)=>{
		try{
			const response = await SlotModel.findOneAndUpdate(filters, updates,{upsert:true});
            return response;
		}catch(ex){
			console.log("SlotsDao - fAndUpdate || Error : ", ex.message);
            throw new PDEError({err: ex.message});
		}
	}
	getLookByFilters=async (filters, lookUp, filters2, project) => {
        try {
            const slotData = await SlotModel.aggregate([ {$match: filters}, 
                {$lookup: lookUp },
                {$match:filters2},
                {$project: project}
              ]);
            return slotData;
        } catch (error){
            console.log("DocumentDetailsDao - getDataByJoin || Error : ", error.message);
            throw new PDEError({err: error.message});
        }
	}

};
module.exports = SlotsDao;