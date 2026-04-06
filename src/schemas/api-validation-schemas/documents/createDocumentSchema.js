const { RELATION_TYPES, REPRESENT_TYPES,REPRESENT_SUB_TYPES } = require("../../../constants/commonValues");

module.exports = {
    description: "create document schema",
    entity: "documents",
    storeValidationErrorInDB: false,
    required: [],
    body: {
      type: "object",
      properties: {
        district: {
            type: "string",
            pattern: "^[a-zA-Z0-9 . ( )]+$"
        },
        registrationType: {
            type: "object",
            properties: {
                TRAN_MAJ_CODE: {
                    type: "string",
                    pattern: "^[0-9]+$"
                },
                TRAN_MIN_CODE: {
                    type: "string",
                    pattern: "^[0-9]+$"
                },
                TRAN_DESC: {
                    type: "string"
                },
                PARTY1: {
                    type: "string",
                    pattern: "^[A-Za-z 0-9 /]+$"
                },
                // PARTY1_CODE: {
                //     type: "string",
                //     enum: REPRESENT_SUB_TYPES
                // },
                PARTY2: {
                    type: "string",
                    pattern: "^[A-Za-z 0-9 /]+$"
                },
                // PARTY2_CODE: {
                //     type: "string",
                //     enum: REPRESENT_SUB_TYPES
                // },
            }
        },
        documentNature: {
            type: "object",
            properties: {
                TRAN_MAJ_CODE: {
                    type: "string",
                    pattern: "^[0-9]+$"
                },
                TRAN_MIN_CODE: {
                    type: "string",
                    pattern: "^[0-9]+$"
                },
                TRAN_DESC: {
                    type: "string"
                }
            }
        },
        distCode: {
            type: "string",
            pattern: "^[0-9]+$"
        },
        mandal: {
            type: "string",
            pattern: "^[a-zA-Z0-9 . ( )]*$"
        },
        mandalCode: {
            type: "string",
            pattern: "^[0-9]*$"
        },
        village: {
            type: "string",
            pattern: "^[a-zA-Z0-9-.()@ ]*$"
        },
        villageCode: {
            type: "string",
            pattern: "^[0-9]+$"
        },
        sroOffice: {
            type: "string",
            pattern: "^[a-zA-Z0-9-.() ]*$"
        },
        // amount: {
        //     type: "string",
        //     pattern: "^[0-9.]+$"
        // },
        docProcessType: {
            type: "string",
            pattern: "^[A-Za-z ]+$"
        },
        executionDate: {
            type: "string",
            pattern: "^[0-9-]+$"
        },
        stampPaperValue: {
            type: "string",
            pattern: "^[0-9]+$"
        },
        noOfStampPapers: {
            type: "string",
            pattern: "^[0-9]+$"
        },
        stampPurchaseDate: {
            type: "string",
            pattern: "^[0-9-]+$"
        },
        leasePropertyDetails:{
            type: "object"
        }
      },
      additionalProperties: true
    }
  };
  