const PDEError = require("../errors/customErrorClass");

class ErrorHandler {
    static constructPDEError(err) {
        if (err instanceof PDEError) {
            return err;
          } else {
            var pdeError = new PDEError({err: err.message});
            return pdeError
        }
    }
}

module.exports = ErrorHandler;