const Ajv = require("ajv");
const AjvKeywords = require("ajv-keywords");
const AjvErrors = require("ajv-errors");
const { getErrorResponse } = require("../../utils/response-parser");
const {
  customGetDocumentsValidator,
  customGetDocumentsByStatusValidator
} = require("./ajv-keywords");
const { NAMES } = require("../../constants/errors");
// const CardError = require("../../errors/custom-error-class");
// const { constructError } = require("../../handlers/error-handler");

const addCustomValidators = ajv => {
  AjvErrors(ajv);
  AjvKeywords(ajv, ["typeof", "instanceof"]);
  ajv.addKeyword("getDocumentsValidator", customGetDocumentsValidator);
  ajv.addKeyword(
    "getDocumentsByStatusValidator",
    customGetDocumentsByStatusValidator
  );
};

const validate = (schema, request) => {
  const ajv = new Ajv({ allErrors: true, jsPropertySyntax: true, useDefaults: true });

  const valid = {
    headers: true,
    params: true,
    body: true,
    query: true,
    error: null
  };

  // Ajv overwrite the error if you use same instance thats why theres return at each validation

  if (schema.headers && !ajv.validate(schema.headers, request.headers)) {
    valid.headers = false;
    return { ...valid, error: ajv.errors[0] };
  }

  if (schema.params && !ajv.validate(schema.params, request.params)) {
    valid.params = false;
    return { ...valid, error: ajv.errors[0] };
  }

  if (schema.query) {
    // addCustomValidators(ajv);
    if (!ajv.validate(schema.query, request.query)) {
      valid.query = false;
      return { ...valid, error: ajv.errors[0] };
    }
  }

  if (schema.body && !ajv.validate(schema.body, request.body)) {
    valid.body = false;
    return { ...valid, error: ajv.errors[0] };
  }

  return valid;
};

const parseError = ({ error, storeErrorData }) => {
  try {
    const variables = {};
    if (!error.dataPath || error.dataPath === "") {
      if (error.message) {
        variables.err = `${error.message}`;
      }
    } else if (error.message) {
      variables.err = `${error.dataPath} ${error.message}`;
    }
    return constructError(
      new CardError(
        { validation_error: error, ...variables },
        NAMES.VALIDATION_ERROR,
        "InValid Request Body"
      ),
      storeErrorData
    );
  } catch (e) {
    return constructError(e);
  }
};

exports.parseUpdateError = ({ error }) => ({
  success_response: false,
  message: error && `${error.dataPath} ${error.message}`
});

exports.validateSchema = schema => (request, reply, next) => {
  const { headers, params, body, query, error } = validate(schema, request);
  if (headers && params && query && body) {
    return next();
  }
  const storeErrorData = {};
  if (schema.storeValidationErrorInDB) {
    storeErrorData.req_data = request.body;
    storeErrorData.entity = schema.entity;
  }
  // const { code, msg, additionalInfo } = parseError({
  //   body: request.body,
  //   error,
  //   storeErrorData
  // });
  return reply.status(400).send(error);
};
