const PDEError = require("../errors/customErrorClass");
const thirdPartyAPIResponseModal = require('../model/thirdPartyAPIResponseModal');

class ThirdPartyAPIResponseDao {

        create = async (params) =>{
            if(!params){
                console.error(" ThirdPartyAPIResponseDao - create || params can't be empty")
                throw new Error("EMPTY PARAMETERS TO STORE IN THIRDPARTYAPIRESPONSE");
            };
            const thirdPartyAPIDetails = new thirdPartyAPIResponseModal({...params});
            try {
                const saveThirdPartyAPIDetails = await thirdPartyAPIDetails.save();
                return saveThirdPartyAPIDetails;
            } catch (error) {
                console.log("ThirdPartyAPIResponseDao - create || Error : ", error.message);
                throw new PDEError({err: error.message});
            }
        }
}

module.exports = ThirdPartyAPIResponseDao;