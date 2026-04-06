const { NAMES } = require("../constants/errors");
const PropertyDao = require("../dao/propertiesDao");
const PropertyStrDao = require("../dao/propertyStructureDao");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("../handlers/errorHandler");



class PropertyStrService {
	constructor(){
        this.propertyDao = new PropertyDao();
        this.propertyStrDao = new PropertyStrDao();
    }
}