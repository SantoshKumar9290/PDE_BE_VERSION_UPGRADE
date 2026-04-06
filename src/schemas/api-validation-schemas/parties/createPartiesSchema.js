const { RELATION_TYPES, REPRESENT_TYPES,REPRESENT_SUB_TYPES } = require("../../../constants/commonValues");

module.exports = {
    description: "create parties schema",
    entity: "parties",
    storeValidationErrorInDB: false,
    body: {
      type: "object",
      required: ["applicationId", "representType"],
      properties: {
        // name: {
        //     type: "string",
        //     pattern: "^[A-Za-z .]*$"
        // },
        panNoOrForm60or61: {
            type: "string",
            pattern: "^[A-Za-z0-9]*$"
        },
        sezParty: {
            type: "boolean"
        },
        isSelectedPanOrForm60: {
            type: "string"
        },
        tan: {
            type: "string",
            pattern: "^[A-Za-z0-9]*$"
        },
        // aadhaar: {
        //     type: "string",
        //     pattern: "^[0-9]*$"
        // },
        representType: {
            type: "string",
            enum: REPRESENT_TYPES
        },
        email: {
            type: "string",
        },
        phone: {
            type: ["string","number"],
            pattern: "^[0-9]*$",
        },
        address: {
            type: "string",
        },
        // representSubType: {
        //     type: "string",
        //     enum: REPRESENT_SUB_TYPES
        // },
        operation: {
            type: "string",
        },
        partyId: {
            type: "string",
        },
        PartyType: {
            type: "string",
            enum: REPRESENT_TYPES
        },
        applicationId: {
            type: "string",
            pattern: "^[A-Za-z0-9]*$"
        },
        // partyCode: {
        //     type: "string",
        //     enum: REPRESENT_SUB_TYPES
        // },
        // objectType: {
        //     type: "string",
        //     pattern: "^[A-Za-z]*$"
        // },
        currentAddress: {
            type: "string",
        },
        partyType: {
            type: "string",
            pattern: "^[A-Za-z /]*$"
        },
        checkbox: {
            type: "boolean"
        },
        isRepChecked:{
            type: "boolean"
        }
      },
      additionalProperties: true
    }
};
  