const Status = require("http-status");

exports.NAMES = {
  VALIDATION_ERROR: "Validation Error",
  NOT_FOUND: "NOT Found",
  BAD_REQUEST: "Bad Request",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  EXTERNAL_REQUEST_ERROR: "External Request Error",
  DUPLICATE_ERROR: "Already Exists",
  UNKNOWN_ERROR: "Unknown Error",
  UNAUTHORIZED: "Unauthorized"
};

exports.NAMES_STATUS_MAPPINGS = {
  [this.NAMES.VALIDATION_ERROR]: Status.BAD_REQUEST,
  [this.NAMES.NOT_FOUND]: Status.BAD_REQUEST,
  [this.NAMES.BAD_REQUEST]: Status.BAD_REQUEST,
  [this.NAMES.INTERNAL_SERVER_ERROR]: Status.INTERNAL_SERVER_ERROR,
  [this.NAMES.EXTERNAL_REQUEST_ERROR]: Status.INTERNAL_SERVER_ERROR,
  [this.NAMES.DUPLICATE_ERROR]: Status.CONFLICT,
  [this.NAMES.UNKNOWN_ERROR]: Status.INTERNAL_SERVER_ERROR,
  [this.NAMES.UNAUTHORIZED]: Status.UNAUTHORIZED
};

exports.STATUS_TO_NAME_MAPPING = Object.keys(this.NAMES_STATUS_MAPPINGS).reduce(
  (acc, key) => {
    acc[this.NAMES_STATUS_MAPPINGS[key]] = key;
    return acc;
  },
  {}
);
