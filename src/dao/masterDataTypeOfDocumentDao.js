const PDEError = require("../errors/customErrorClass");
const MasterDataTypeOfDocumentDb = require("../model/masterDataTypeOfDocument");

class MasterDataTypeOfDocumentDao {

    getAll = async () => {
        try {
            const typeOfDocumentData = await MasterDataTypeOfDocumentDb.find({});
            console.log(typeOfDocumentData);
            return typeOfDocumentData;
        } catch (error) {
            console.log("MasterDataTypeOfDocumentDao - getAll || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }
}

module.exports = MasterDataTypeOfDocumentDao;