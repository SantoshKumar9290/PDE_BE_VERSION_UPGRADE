const { parseString } = require("../utils");
const { NAMES, NAMES_STATUS_MAPPINGS } = require("../constants/errors");

class PDEError extends Error {
  /**
   * PDEError Constructor -
   * Generate custom Error object that use to create generic error response for Hydra Post-sales structure
   *
   * @param {*} data - Key value pair that bind with error message. (Should be taken from generic NAMES fields in src/app/constants/error file)
   * @param {String} name - Used to generate predefine error message
   * @param {String} err - Error message (Should be taken from generic TEMPLATES fields in src/app/utils/response-parser/messages file)
   *
   * @example
   *
   * const { NAMES } = require("/src/app/constants/errors");
   * const { TEMPLATES } = require("/src/app/utils/response-parser/messages");
   *
   * throw new PDEError( { "key": "value" }, NAMES.NOT_FOUND, TEMPLATES.ORDER_ITEMS_FOR_ORDER_NOT_FOUND);
   *
   */
  constructor({data = {}, name = NAMES.UNKNOWN_ERROR, err = ""}) {
    super(err);
    this.message = err;
    this.name = name;
    this.additionalInfo = data;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PDEError);
    }
  }
}

module.exports = PDEError;
