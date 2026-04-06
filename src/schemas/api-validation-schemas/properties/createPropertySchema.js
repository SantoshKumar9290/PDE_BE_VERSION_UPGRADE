const { RELATION_TYPES, REPRESENT_TYPES,REPRESENT_SUB_TYPES } = require("../../../constants/commonValues");

module.exports = {
    description: "create property schema",
    entity: "properties",
    storeValidationErrorInDB: false,
    required: [],
    body: {
      type: "object",
      required: ["applicationId"],
      properties:{
        type: "object",
        properties: {
          amount: {
            type: "string",
            pattern: "^[0-9.]*$"
          },
          executionDate: {
            type: "string",
            pattern: "^[0-9-]*$"
          },
          stampPaperValue: {
            type: "string",
            pattern: "^[0-9]*$"
          },
          stampPurchaseDate: {
            type: "string",
            pattern: "^[0-9-]*$"
          },
          localBodyType: {
            type: "string"
          },
          localBodyTitle: {
            type: "string"
          },
          localBodyName: {
            type: "string"
          },
          district: {
            type: "string",
            pattern: "^[a-zA-Z0-9 . ( )]+$"
          },
          sroOffice: {
            type: "string",
            pattern: "^[A-Z .( )]+$"
          },
          propertyType: {
            type: "string"
          },
          ExtentList: {
            type: "array",
            items: [
              {
                type: "object",
                properties: {
                  totalExtentAcers: {
                    type: "string",
                    pattern: "^[0-9.]+$"
                  },
                  totalExtentCents: {
                    type: "string",
                    pattern: "^[0-9.]+$"
                  },
                  conveyedExtentAcers: {
                    type: "string",
                    pattern: "^[0-9.]+$"
                  },
                  conveyedExtentCents: {
                    type: "string",
                    pattern: "^[0-9.]+$"
                  },
                  khataNumber: {
                    type: "integer"
                  },
                  survayNo: {
                    type: "string",
                    pattern: "^[0-9.]+$"
                  }
                }
              }
            ]
          },
          schedulePropertyType: {
            type: "string"
          },
          landUse: {
            type: "string"
          },
          village: {
            type: "string",
            pattern: "^[A-Z .( )]+$"
          },
          locality: {
            type: "string"
          },
          ward: {
            type: ["string", "integer"]
          },
          block: {
            type: ["string", "integer"]
          },
          doorNo: {
            type: "string"
          },
          plotNo: {
            type: "string"
          },
          survayNo: {
            type: "string",
            pattern: "^[A-Za-z0-9/ .]*$"
          },
          ptinNo: {
            type: "string"
          },
          extent: {
            type: "string"
          },
          extentUnit: {
            type: "string"
          },
          units: {
            type: "string"
          },
          layoutNo: {
            type: "string"
          },
          layoutName: {
            type: "string"
          },
          reraApprovalNo:{
            type: "string"
          },
	        buildingApprovalNo:{
            type: "string"
          },
          appartmentName: {
            type: "string"
          },
          undividedShare: {
            type: "string"
          },
          undividedShareUnit: {
            type: "string"
          },
          flatNo: {
            type: "string"
          },
          flatNorthBoundry: {
            type: "string"
          },
          flatSouthBoundry: {
            type: "string"
          },
          flatEastBoundry: {
            type: "string"
          },
          flatWestBoundry: {
            type: "string"
          },
          structure: {
            type: "array"
          },
          totalFloors: {
            type: "string"
          },
          northBoundry: {
            type: "string",
            pattern: "^[a-z]*$"
          },
          southBoundry: {
            type: "string",
            pattern: "^[a-z]*$"
          },
          eastBoundry: {
            type: "string",
            pattern: "^[a-z]*$"
          },
          westBoundry: {
            type: "string",
            pattern: "^[a-z]*$"
          },
          isDocDetailsLinked: {
            type: "string"
          },
          landtype: {
            type: "string"
          },
          isMarketValue: {
            type: "string"
          },
          mode: {
            type: "string"
          },
          mandalCode: {
            type: "string",
            pattern: "^[0-9]*$"
          },
          mandal: {
            type: "string",
            pattern: "^[a-zA-Z0-9-.() ]*$"
          },
          villageCode: {
            type: "string",
            pattern: "^[0-9]*$"
          },
          sroCode: {
            type: "string",
            pattern: "^[0-9]*$"
          },
          landUseCode: {
            type: ["integer","string"]
          },
          habitationCode: {
            type: "string",
            pattern: "^[0-9]*$"
          },
          habitation: {
            type: "string",
            pattern: "^[A-Z .]*$"
          },
          conveyedExtent: {
            type: "array",
            items: [
              {
                type: "object",
                properties: {
                  extent: {
                    type: "string",
                    pattern: "^[0-9.]*$"
                  },
                  unit: {
                    type: "string",
                    pattern: "^[A-Z]*$"
                  },
                  srvyNo: {
                    type: "string",
                    pattern: "^[0-9*]*$"
                  },
                  mvValue: {
                    type: "integer"
                  }
                },
              }
            ]
          },
          tExtent: {
            type: ["number", "string"]
          },
          localBodyCode: {
            type: "string",
            pattern: "^[0-9.]*$"
          },
          marketValue: {
            type: "integer"
          },
          isLinkedDocDetails: {
            type: "boolean"
          },
          applicationId: {
            type: "string",
            pattern: "^[0-9]+$"
          }
        }
      },
      additionalProperties: true
    }
  };
  