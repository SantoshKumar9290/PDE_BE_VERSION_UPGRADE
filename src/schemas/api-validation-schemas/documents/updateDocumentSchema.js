const { DOCUMENT_STATUS } = require("../../../constants/commonValues");

module.exports = {
    description: "update document schema",
    entity: "documents",
    storeValidationErrorInDB: false,
    body: {
        type: "object",
        properties: {
          applicationId: {
              type: "string",
              pattern: "^[0-9]+$"
          },
          status: {
              type: "string",
              enum: DOCUMENT_STATUS
          },
          rf_p: {
              type: "integer"
          },
          sd_p: {
              type: "integer"
          },
          td_p: {
              type: "integer",
          },
          uc_p: {
              type: "integer"
          }
        }
      }
  };
  