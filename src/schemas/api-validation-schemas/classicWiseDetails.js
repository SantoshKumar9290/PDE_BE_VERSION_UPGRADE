module.exports = {
  description: "classic wise details schema",
  entity: "users",
  storeValidationErrorInDB: false,
  query: {
    type: "object",
    properties: {
        villageCode: {
            type: "string",
            pattern: "^[0-9]+$"
        },
        serveyNo: {
            type: "string",
            pattern: "^[0-9]+$"
        }
    },
    additionalProperties: false
  }
};
