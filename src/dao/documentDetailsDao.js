const PDEError = require("../errors/customErrorClass");
var DocumentDetailsDb = require("../model/documentDetailsModel");
var PropertyDetailsDb = require("../model/propertyModel"); 

class DocumentDetailsDao {

    create = async (documentDetails)=>{

        if(!documentDetails){
            console.error(" DocumentDetailsDao - create || Document Details can't be empty")
            throw new Error("EMPTY DOCUMENT");
        }

        const document = new DocumentDetailsDb({
            ...documentDetails
        })

        try {
            const documentDetailsDbResponse = await document.save(document);
            return documentDetailsDbResponse;
        } catch (error) {
            console.log("DocumentDetailsDao - create || Error : ", error.message);
            throw new PDEError({err: error.message});
        }

    }

    getByFilters = async (filters, limt) => {
        try {
            let documentsData;
            if(limt!=undefined){
                documentsData = await DocumentDetailsDb.aggregate([{$match:filters}, {$limit: limt}]);
            }else{
                documentsData = await DocumentDetailsDb.aggregate([{$match:filters}]);
            }
            return documentsData;
        } catch (error) {
            console.log("DocumentDetailsDao - getByFilters || Error : ", error);
            throw new PDEError({err: error.message});
        }
    }

    getPropertybyFilters = async (filters) => {
        try {
            const documentsData = await PropertyDetailsDb.aggregate([{$match:filters}])
            return documentsData;
        } catch (error) {
            console.log("DocumentDetailsDao - getByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});
        }
    }

    getOneByFilters = async (filters) => {
        try {
            console.log("DocumentDetailsDao - getOneByFilters || Filter : ", filters);
            const documentsData = await DocumentDetailsDb.findOne(filters);
            return documentsData;
        } catch (error) {
            console.log("DocumentDetailsDao - getOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});
        }
    }
	getOneByFiltersByOption = async (filters,options) => {
        try {
            console.log("DocumentDetailsDao - getOneByFiltersByOption || Filter : ", filters);
            const documentsData = await DocumentDetailsDb.findOne(filters,options);
            return documentsData;
        } catch (error) {
            console.log("DocumentDetailsDao - getOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});
        }
    }

    updateOneByFilters = async (filters, updates) => {
        try {
            const documentUpdatedData = await DocumentDetailsDb.findOneAndUpdate(filters, updates);
            return documentUpdatedData;
        } catch (error) {
            console.log("DocumentDetailsDao - updateOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});
        }
    }

    deleteOneByFilters = async (filters) => {
        try {
            const deleteDocumentData = await DocumentDetailsDb.deleteOne(filters);
            return deleteDocumentData;
        } catch (error) {
            console.log("DocumentDetailsDao - deleteOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});
        }
    }
	delImagesById = async (filters,update)=>{
		try {
            const deleteDocumentData = await DocumentDetailsDb.updateOne(filters,update)
            return deleteDocumentData;
        } catch (error) {
            console.log("DocumentDetailsDao - deleteOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});
        }
	}
    getDataByJoin = async (filters, lookUp, filters2, project) => {
        try {
            const documentsData = await DocumentDetailsDb.aggregate([ {$match: filters}, 
                {$lookup: lookUp },
                {$match:filters2},
                {$project: project}
              ]);
            return documentsData;
        } catch (error){
            console.log("DocumentDetailsDao - getDataByJoin || Error : ", error.message);
            throw new PDEError({err: error.message});
        }
    }
}

module.exports = DocumentDetailsDao;
