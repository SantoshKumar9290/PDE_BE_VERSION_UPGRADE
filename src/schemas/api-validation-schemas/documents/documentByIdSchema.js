module.exports = {
    description: "get/delete by document Id schema",
    entity: "documents",
    storeValidationErrorInDB: false,
    params: {
      type: "object",
      required: ["documentId"],
      properties: {
        documentId: {
              type: "string",
              pattern: "^[0-9]+$"
        }
      },
      additionalProperties: false
    }
  };
  