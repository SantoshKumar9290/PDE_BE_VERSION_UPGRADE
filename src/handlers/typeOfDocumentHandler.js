const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const TypeOfDocumentService = require("../services/typeOfDocumentService");
const { constructPDEError } = require("./errorHandler");

class TypeOfDocumentHandler {

    constructor(){
        this.typeOfDocumentService = new TypeOfDocumentService();
    }

    getNatureOfDocument = async (req, res) => {
        console.log("TypeOfDocumentHandler - getNatureOfDocument || In Get Nature of Document");
        try {
            let response = await this.typeOfDocumentService.getNatureOfDocument();
            res.status(200).send({typesOfDocument: response});
        } catch (error) {
            var pdeError = constructPDEError(error);
            console.error("TypeOfDocumentHandler - getNatureOfDocument || Error :", pdeError.message);
            res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send({error: pdeError.message})
            return;
        }
    }
}

module.exports = TypeOfDocumentHandler;