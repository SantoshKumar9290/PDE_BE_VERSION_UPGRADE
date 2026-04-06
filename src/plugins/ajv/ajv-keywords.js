const moment = require("moment");
const DEFAULT_PAGINATION_LIMIT  = 10;

const numberChecker = (validationSchemaObject, key) =>
  validationSchemaObject[key] &&
  +validationSchemaObject[key] !== 0 &&
  !+validationSchemaObject[key];
const maxValueChecker = (validationSchemaObject, key) =>
  validationSchemaObject[key] &&
  validationSchemaObject[key] > DEFAULT_PAGINATION_LIMIT;
const isValidDate = (validationSchemaObject, key) =>
  validationSchemaObject[key] &&
  moment(validationSchemaObject[key], "YYYY-MM-DD HH:mm:ss", true).isValid();

const isFutureDate = (validationSchemaObject, key) =>
  validationSchemaObject[key] &&
  moment(validationSchemaObject[key]).isValid() &&
  moment(validationSchemaObject[key]).isAfter(moment());

exports.customGetDocumentsValidator = {
  schema: false,
  errors: true,
  validate: function getDocumentsValidator(data, validationData, schema) {
    getDocumentsValidator.errors = [];
    if (validationData === "/limit") {
      if (numberChecker(schema, "limit")) {
        getDocumentsValidator.errors.push({
          keyword: "limit",
          message: "value must be a number",
          params: {
            keyword: "limit"
          }
        });
        return false;
      }
      if (maxValueChecker(schema, "limit")) {
        getDocumentsValidator.errors.push({
          keyword: "limit",
          message: `maximum limit allowed is ${DEFAULT_PAGINATION_LIMIT}`,
          params: {
            keyword: "limit"
          }
        });
        return false;
      }
    }
    if (validationData === "/offset") {
      if (numberChecker(schema, "offset")) {
        getDocumentsValidator.errors.push({
          keyword: "offset",
          message: "value must be a number",
          params: {
            keyword: "offset"
          }
        });
        return false;
      }
    }
    if (validationData === "/fromDateTime") {
      if (
        !isValidDate(schema, "fromDateTime") ||
        isFutureDate(schema, "fromDateTime")
      ) {
        getDocumentsValidator.errors.push({
          keyword: "fromDateTime",
          message: "fromDateTime must be a valid date",
          params: {
            keyword: "fromDateTime"
          }
        });
        return false;
      }
    }
    return true;
  }
};

exports.customGetDocumentsByStatusValidator = {
  schema: false,
  errors: true,
  validate: function getDocumentsByStatusValidator(data, validationData, schema) {
    getDocumentsByStatusValidator.errors = [];
    if (validationData === "/fromUpdatedTime") {
      if (schema.fromUpdatedTime) {
        if (
          !isValidDate(schema, "fromUpdatedTime") ||
          isFutureDate(schema, "fromUpdatedTime")
        ) {
          getDocumentsByStatusValidator.errors.push({
            keyword: "fromUpdatedTime",
            message: "fromUpdatedTime must be a valid date",
            params: {
              keyword: "fromUpdatedTime"
            }
          });
          return false;
        }
      }
    }
    if (validationData === "/offset") {
      if (numberChecker(schema, "offset")) {
        getDocumentsByStatusValidator.errors.push({
          keyword: "offset",
          message: "value must be a number",
          params: {
            keyword: "offset"
          }
        });
        return false;
      }
    }
    if (validationData === "/limit") {
      if (maxValueChecker(schema, "limit")) {
        getDocumentsByStatusValidator.errors.push({
          keyword: "limit",
          message: `maximum limit allowed is ${DEFAULT_PAGINATION_LIMIT}`,
          params: {
            keyword: "limit"
          }
        });
        return false;
      }
      if (numberChecker(schema, "limit")) {
        getDocumentsByStatusValidator.errors.push({
          keyword: "limit",
          message: "value must be a number",
          params: {
            keyword: "limit"
          }
        });
        return false;
      }
    }
    return true;
  }
};
