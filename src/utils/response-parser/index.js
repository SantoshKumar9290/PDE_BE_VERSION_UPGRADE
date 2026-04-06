/**
 * Return object with error message and additional attributes.
 * @param {String} data - Error message
 * @param {Object} additionalInformation
 * @returns {Object}
 *
 * @example
 * const message = "Some internal exception occurred.";
 * const additionalInformation = {userId: "12341234124"};
 * const res = getErrorResponse(data, additionalInformation);
 * console.log(res);
 * -----------------
 * {
 *  success_response: false,
 *  message: "Some internal exception occurred.",
 *  userId: "12341234124"
 * }
 */
const getErrorResponse = (message, additionalInformation = {}) => {
  return {
    success_response: false,
    message,
    ...additionalInformation
  };
};

/**
 * Return object with success message and additional attributes.
 * @param {any} data - Success message
 * @param {Object} additionalInformation
 * @returns {Object}
 *
 * @example
 * const data = "User has been saved successfully.";
 * const additionalInformation = {userId: "12341234124"};
 * const res = getSuccessResponse(data, additionalInformation);
 * console.log(res);
 * -----------------
 * {
 *  success_response: true,
 *  message: "User has been saved successfully.",
 *  userId: "12341234124"
 * }
 */
const getSuccessResponse = (data, additionalInformation = {}) => {
  const response = {
    success_response: true,
    ...additionalInformation
  };
  if (data) {
    response.message = data;
  }
  return response;
};

module.exports = {
  getErrorResponse,
  getSuccessResponse
};
