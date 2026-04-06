const { NAMES } = require("../constants/errors");
const MasterDataTypeOfDocumentDao = require("../dao/masterDataTypeOfDocumentDao");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("../handlers/errorHandler");

class TypeOfDocumentService {

    constructor(){
        this.MasterDataTypeOfDocumentDao = new MasterDataTypeOfDocumentDao();
    }

    getNatureOfDocument = async () => {
        try {
            const natureOfDocumentDbData = await this.MasterDataTypeOfDocumentDao.getAll();
            if(natureOfDocumentDbData == null || natureOfDocumentDbData.length == 0){
                console.log("TypeOfDocumentService - getNatureOfDocument || No Data Present");
                throw new PDEError({name: NAMES.NOT_FOUND, err: "No Data Present"});
            }
            let natureResponse = [];
            natureOfDocumentDbData.forEach(data => {
                natureResponse.push({
                        majorCode: data.majorCode,
                        minorCode: data.minorCode,
                        description: data.description
                    });
            });
            return natureResponse;
        } catch (error) {
            console.error("TypeOfDocumentService - getNatureOfDocument || Error :", error.message);
            let pdeError = constructPDEError(error);
            console.log("PDE ERROR IS ", pdeError);
            throw pdeError;
        }
    }
}

module.exports = TypeOfDocumentService;