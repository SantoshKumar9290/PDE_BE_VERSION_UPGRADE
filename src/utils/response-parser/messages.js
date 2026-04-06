const { stringArrayToObject } = require("..");

const Messages = {
  VALIDATION_ERROR: "Validation error",
  DOCUMENT_ID_ALREADY_EXIST:
    "Document Id {{existingDocument}} already exists",
  INTERNAL_SERVER_ERROR: "Internal server error occurred.",
  STATUS_CAN_NOT_BE_CHANGED:
    "Cannot change status. Entity - {{entity}} - {{entityIds}} can not change status from {{currentStatus}} to {{toBeStatus}}",
  EXTERNAL_REQUEST_ERROR_RESPONSE: "{{&msg}}",
  INVALID_STATUS_UPDATE: "Invalid Status Update",
};

exports.TEMPLATES = Messages;

exports.messageCodes = stringArrayToObject(Object.keys(Messages));
