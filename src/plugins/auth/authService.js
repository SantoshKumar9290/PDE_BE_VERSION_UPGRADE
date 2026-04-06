var jwt = require('jsonwebtoken');
const userModel = require('../../model/userModel');
const officerModel = require('../../model/officerModel');
const docsModel = require("../../model/documentDetailsModel")
const {decryptWithAESPassPhrase, encryptWithAESPassPhrase} = require('../../utils/index');
const fs = require('fs');
const Path = require('path');
const { getDataFromCache } = require('../nodeCache/myCache');
const path = Path.join(__dirname,'../../../certificates/jwtRS256.key')
const RSA_PR_KEY = fs.readFileSync(path);
const crypto = require("crypto");
const verifyUser = (req, res) => {
    try {
        return new Promise(function (resolve, reject) {
            const Header = req.headers["authorization"];
            if (typeof Header !== "undefined") {
                try {
                    const verified = jwt.verify(Header, RSA_PR_KEY,{algorithms:'RS256'});

                    if (verified) {
                        resolve(verified);
                    } else {
                        reject('Invalid User');
                    }
                } catch (error) {
                    reject('Invalid User');
                }
            } else {
                reject('Invalid User');
            }
        })
    } catch (e) {
        logger.warn(e.message);
        res.status(403).send({
            success: false,
            message: e.message,
            data: {}
        });
    }
}

const authUser = (req, res, next) => {
    verifyUser(req, res).then(result => {
        req.userId = result.userId;
        req.userTypeId = result.userTypeId;
        next();
    }).catch(error => {
        res.status(401).send({
            status: false,
            message: error,
            data: {}
        });
    });
}

const authGenerator = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}



const getUserInfo = async (user)=>{
	const userInfo= {
		_id:user._id,
		userId:user._id,
		loginEmail: user.loginEmail,
		loginName:user.loginName,
		loginMobile: user.loginMobile,
		loginType:user.loginType,
        loginId:user.loginId
	}

	let userAadhaar = 0;
	if(user!=null && user!=undefined && user?.aadhar)
		userAadhaar = parseInt(user.aadhar);
	userInfo.aadhar = userAadhaar;
	if(user.loginType === "officer"){
		userInfo.sroDistrict = user.sroDistrict;
		userInfo.sroOffice = user.sroOffice;
		userInfo.sroNumber = user.sroNumber;
		userInfo.sroName = user.sroName;
	}
	return userInfo;
};

const createToken =async (user,refreshTokenUrl) => {

	let jwtSecretKey = RSA_PR_KEY;
	const expiresIn =process.env.JWT_EXP_IN;
	const token = jwt.sign(user,jwtSecretKey,{ expiresIn: expiresIn,algorithm:'RS256' });
	// await tokenModel.findOneAndUpdate({userId:user._id,loginType:user.loginType,status:false},{refreshToken:refreshTokenUrl,status:true},{upsert:true});
	return{
        token,
        expires: expiresIn,
		refreshTokenUrl
    };
}

/*Middleware for verifying the JWT Token. */
const verifyjwt = async function (req, res, next) {
	try {
		let tokenHeader = req.headers['authorization'];
		if (tokenHeader) {
			let token = await tokenHeader.split(" ");
			  let decoded = jwt.verify(token[1], RSA_PR_KEY,{algorithms:"RS256"});
			if (decoded) {
				let isTokenInvalid = getDataFromCache(token[1]);
				if(isTokenInvalid != null && isTokenInvalid == true){
					return res.status(401).json({ success: false, error: 'Unauthorized Token. User Token is not valid.' });
				}
				let user;
				req.user = decoded;
				let loginTypeVal = (decoded.loginType)
                if(decoded.loginMode =='VSWS'){
                return next();
                }
				if(loginTypeVal =='officer'){
					user = await officerModel.findOne({loginEmail:req.user.loginEmail,loginType:req.user.loginType});
				}else if(loginTypeVal =='USER' || loginTypeVal =='CSC'){
                    if(decoded.loginEmail == 'CRDA'){
                       loginTypeVal = 'CRDA'
                    }
					user = await userModel.findOne({loginEmail:req.user.loginEmail,loginType:loginTypeVal});
				}else if(loginTypeVal =='SERVICES'){
					user = await userModel.findOne({loginName:req.user.loginName,loginType:req.user.loginType});
				}
				if(user == undefined || user ==  null){
					return res.status(401).json({ success: false, error: 'Unauthorized Access.' })
				}
				let currentTime = (new Date().getTime())/1000;
				if(decoded.exp < currentTime)
					return res.status(401).json({ success: false, error: 'Token Validity Expired.' });
				else    
					return next();
				// return res.status(200).json({ success:decoded})
			}else{
				return res.status(401).json({ success: false, error: 'Unauthorized Token. User Token required.' });
			}      
		}else{
			return res.status(401).json({ success: false, error: "Unauthorized Token. User Token required." })
		}
	} catch (error) {
		console.log("error ::: ", error);
		return res.status(401).json({ success: false, error: 'JWT Token is expired.' })
	}
}

const verifyAPIKey = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        // const authHeader = req.headers["authorization"];
 
        const APIKEY = req.headers["api-key"];
        console.log("APIKEY :::: ", APIKEY);
        if (APIKEY != undefined) {
            try {
                let verified;
                // let validAuthValue = 'Basic '+process.env.BASIC_AUTH_CODE;
                console.log("APIKEY :::: ", process.env.API_KEY);
 
                if(APIKEY == process.env.API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
            return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}

const validateThirdPartyAccess = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        const authHeader = req.headers["authorization"];
        const APIKEY = req.headers["api-key"];
        console.log("authHeader :::: ", authHeader);
        console.log("APIKEY :::: ", APIKEY);
        if (authHeader != undefined && APIKEY != undefined) {
            try {
                let verified;
                let validAuthValue = 'Basic '+process.env.BASIC_AUTH_CODE;
                console.log("validAuthValue :::: ", validAuthValue);
                console.log("APIKEY :::: ", process.env.EC_API_KEY);
 
                if(authHeader == validAuthValue && APIKEY == process.env.EC_API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
            return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}

const validateCDMAAccess = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        const authHeader = req.headers["authorization"];
        const APIKEY = req.headers["api-key"];
        console.log("authHeader :::: ", authHeader);
        console.log("APIKEY :::: ", APIKEY);
        if (authHeader != undefined && APIKEY != undefined) {
            try {
                let verified;
                let validAuthValue = 'Basic '+process.env.BASIC_AUTH_CODE;
                console.log("validAuthValue :::: ", validAuthValue);
                console.log("APIKEY :::: ", process.env.EC_API_KEY);
 
                if(authHeader == validAuthValue && APIKEY == process.env.EC_API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ 
                        status:"Failure",
                        code:'401',
                        error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ 
                    status: "Failure",
                    code: '401',
                    error: 'Unauthorized User Access.'
                });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ 
                    status: "Failure",
                    code: '401',
                    error: 'Unauthorized User Access.'
                });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
                return res.status(401).json({ 
                    status: "Failure",
                    code: '401',
                    error: 'Unauthorized User Access.'
                });
    }
}

const roleAuthorization = (roles, hashCheck = false)=>{
	return async (req,res,next)=>{
		// if(hashCheck){
		// 	if(req == null || req.body == null || req.body.hash == null){
		// 		return res.status(422).send({ error: 'Request Mismatch.' });
		// 		// next();
		// 	}
		// 	var origialText = decryptWithAESPassPhrase(req.body.hash.toString(), "123456");
		// 	const { ['hash']: hash, ...reqBodyWithoutHash } = req.body;
		// 	if(JSON.stringify(reqBodyWithoutHash) != origialText){
		// 		return res.status(422).send({ error: 'Request Mismatch.' });
		// 		// return next();
		// 	}

		// }
		let query;
		if(req.method === "DELETE"){
			query = req.params.documentId ? {documentId:req.params.documentId}:req.params.applicationId?{documentId:req.params.applicationId}:{documentId:req.params.docId};
		}else{
			query = req.body.documentId ?{documentId:req.body.documentId}:req.body.applicationId?{documentId:req.body.applicationId}:{documentId:req.body.document_id};
		}

		const documentData = await docsModel.findOne(query);
        const user = req.user;
        if(user.loginMode == "VSWS" ){
           return next();
		}
		if(user.loginType == "USER" && documentData && documentData.userId !== user.userId){
			return res.status(401).send({statusCode:401, error: `UnAuthorized` });
            next();
		}
        let findUser =await userModel.findById(user.userId);
		if(findUser == null){
			findUser = await officerModel.findOne({_id:user._id})
		}
        if(findUser){
            if(findUser.loginType == 'CRDA'){
                findUser.loginType = 'USER'
            }
        }
        if(!findUser){
            res.status(422).send({ error: 'No user found.' });
            return next();
        }
        else if(roles.indexOf(findUser.loginType) > -1){
            return next();
        }else{
            return res.status(401).send({statusCode:401, error: `As a ${roles},Your Not a authorized person to view this content` });
            next();
        }
    }
}


const validateAPIkey = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        const authHeader = req.headers["authorization"];
        const APIKEY = req.headers["api-key"];
        if (authHeader != undefined && APIKEY != undefined) {
            try {
                let verified;
                let validAuthValue = 'Basic '+process.env.IGRS_BASIC_AUTH_CODE;
                let validAPDBMSAuthValue = 'Basic '+process.env.APDBMS_BASIC_AUTH_CODE;                
                if( (authHeader == validAuthValue || authHeader == validAPDBMSAuthValue) && APIKEY == process.env.API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
            return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}

const verifyThirdPartyToken = async function(req, res, next)
    {
        try {
            let apiKey = req.headers['api-key'];
            let origin = req.headers['Origin'];
            if(origin==null)
            origin = "";
            if (apiKey && apiKey == process.env.API_KEY_VMC) {
                return next();
            } else {
                return res.status(401).json({ success: false, error: 'Unauthorized Access.' })
            }
        } catch (error) {
        console.log("error ::: ", error);
        return res.status(401).json({ success: false, error: 'Session Expired, Please Login' })
      }
    }
   const validateAPIEODBkey = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        const authHeader = req.headers["authorization"];
        const APIKEY = req.headers["api-key"];
        if (authHeader != undefined && APIKEY != undefined) {
            try {
                let verified;
                let validAuthValue = 'Basic '+process.env.IGRS_EODB_BASIC_AUTH_CODE;
                // let validAPDBMSAuthValue = 'Basic '+process.env.APDBMS_BASIC_AUTH_CODE;                
                if( (authHeader == validAuthValue ) && APIKEY == process.env.API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
            return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}
   
const validateAPIkeyAPCTDP = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        const authHeader = req.headers["authorization"];
        const APIKEY = req.headers["api-key"];
        if (authHeader != undefined && APIKEY != undefined) {
            try {
                let verified;
                let validAuthValue = 'Basic '+process.env.APDTCP_BASIC_AUTH_CODE;
                console.log(validAuthValue,"validAuthValue");
                console.log(authHeader,"authHeader");
                
                
                if( (authHeader == validAuthValue ) && APIKEY == process.env.API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
            return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}
const validateAPIkeyAPCFSS = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        const authHeader = req.headers["authorization"];
        const APIKEY = req.headers["api-key"];
        if (authHeader != undefined && APIKEY != undefined) {
            try {
                let verified;
                let validAuthValue = 'Basic '+process.env.APCFSS_BASIC_AUTH_CODE;
                
                if( (authHeader == validAuthValue ) && APIKEY == process.env.API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
            return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}

const validateDocumentStatusForUpdate = (submitCheck = true)=>{ 
    return async function (req, res, next) {
    try {
        let loginId = req.user.loginId;
        let docId;
        if(req.params){
            docId = req.params.applicationId ? req.params.applicationId:(req.params.documentId?req.params.documentId:req.params.id)
        }
        if(!docId && req.body){
            docId = req.body.applicationId ? req.body.applicationId:(req.body.documentId?req.body.documentId:req.body.id)
        }
        if(docId){
            let documentDbFilter = {userId: loginId,documentId:docId}
            const documentData = await docsModel.findOne(documentDbFilter);
            if(submitCheck && documentData && documentData.status!="SYNCED" && documentData.status!="SUBMITTED"){
                return next();
            }
            //Below condition is while syncing the document after submit.
            else if(!submitCheck && documentData && documentData.status!="SYNCED"){
                return next();
            }else{
                return res.status(400).send({
                    status:false,
                    message: "Unauthorized operation to process the data. Please do valid operation."
                })
            }
        }else{
             return next();
        }
        
    } catch (e) {
        console.log("End of validateDocumentStatusForUpdate :::: ");
        logger.warn(e.message);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}
}
const validateAPDTCPAccess = function (req, res, next) {
    try {
        console.log("Inside of validateAPDTCPAccess :::: ");
        const authHeader = req.headers["authorization"];
        const APIKEY = req.headers["api-key"];
        console.log("authHeader :::: ", authHeader);
        console.log("APIKEY :::: ", APIKEY);
        if (authHeader != undefined && APIKEY != undefined) {
            try {
                let verified;
                let validAuthValue = 'Basic '+process.env.DTCP_BASIC_AUTH_CODE;
                console.log("validAuthValue :::: ", validAuthValue);
                console.log("APIKEY :::: ", process.env.EC_API_KEY);
 
                if(authHeader == validAuthValue && APIKEY == process.env.EC_API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
            return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}
const validateAPIkeyForISRI = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        const authHeader = req.headers["authorization"];
        const APIKEY = req.headers["api-key"];
        if (authHeader != undefined && APIKEY != undefined) {
            try {
                let verified;
                let validAuthValue = 'Basic '+process.env.ISRI_AUTH_KEY;
                if( (authHeader == validAuthValue ) && APIKEY == process.env.ISRI_API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
            return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}
const generateHash = (data) => {
  const filteredData = { ...data };
  delete filteredData.HASHKEY; 
  const sortedData = Object.keys(filteredData)
    .sort()
    .reduce((acc, key) => {
      acc[key] = filteredData[key];
      return acc;
    }, {});
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(sortedData))
    .digest("hex");
};

const validateAPIkeyWithHash = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const apiKey = req.headers["api-key"];
    if (!authHeader || !apiKey) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized User Access"
      });
    }
    const validAuthValue = "Basic " + process.env.OTHERS_BASIC_AUTH_CODE;
    if ( authHeader !== validAuthValue || apiKey !== process.env.API_KEY) {
      return res.status(401).json({
        status: false,
        message: "Invalid Authorization or API Key"
      });
    }
    const { USERNAME, PASSWORD } = req.body;
    if (USERNAME !== process.env.OTHERS_USERNAME ||PASSWORD !== process.env.OTHERS_PASSWORD) {
      return res.status(401).json({
        status: false,
        message: "Invalid Username or Password"
      });
    }
    req.generatedHash = generateHash(req.body);
    req.isThirdParty = true;
    next();
  } catch (error) {
    console.error("validateAPIkeyWithHash Error:", error);
    return res.status(401).json({
      status: false,
      message: "Unauthorized User Access"
    });
  }
};
const validateAPIkeyone = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const apiKey = req.headers["api-key"];
    if (!authHeader || !apiKey) {
      return res.status(401).json({
        status: false,
        message: "Missing Authorization or API Key"
      });
    }
    const expectedAuth = "Basic " + process.env.OTHERS_BASIC_AUTH_CODE;
    if (authHeader !== expectedAuth) {
      return res.status(401).json({
        status: false,
        message: "Invalid Authorization"
      });
    }
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({
        status: false,
        message: "Invalid API Key"
      });
    }
    req.isTrusted = true;
    next();
  } catch (error) {
    console.error("validateAPIkey Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error"
    });
  }
};
const validateHashKey = (body) => {
  if (!body.HASHKEY) return false;
  const generatedHash = generateHash(body);
  return generatedHash === body.HASHKEY;
};
const validateSignatureMiddleware = (req, res, next) => {
    try {
        const timestamp = req.headers['x-timestamp'];
        const signature = req.headers['x-signature'];

        if (!signature || !timestamp) {
            return res.status(401).json({
                status: false,
                message: 'Missing signature or timestamp.'
            });
        }

        // Replay protection (5 minutes)
        const FIVE_MINUTES = 5 * 60 * 1000;
        if (Math.abs(Date.now() - Number(timestamp)) > FIVE_MINUTES) {
            return res.status(400).json({
                status: false,
                message: 'Request expired.'
            });
        }

        //  Take all query params dynamically
        const sortedQueryString = Object.keys(req.query)
            .sort() // alphabetical order
            .map(key => `${key}=${req.query[key] ?? ''}`)
            .join('&');

        const stringToSign = sortedQueryString
            ? `${sortedQueryString}&timestamp=${timestamp}`
            : `timestamp=${timestamp}`;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.HMAC_SECRET_KEY)
            .update(stringToSign)
            .digest('hex');

        if (expectedSignature !== signature) {
            return res.status(400).json({
                status: false,
                message: 'Invalid signature.'
            });
        }
        return next();
    } catch (error) {
        console.log("Error in validateSignatureMiddleware:", error);
        return res.status(401).json({
            status: false,
            message: 'Unauthorized request.'
        });
    }
};

const sslrGenerateHash = (data) => {
  const filteredData = { ...data };
  delete filteredData.HASHKEY; 
  const sortedData = Object.keys(filteredData)
    .sort()
    .reduce((acc, key) => {
      acc[key] = filteredData[key];
      return acc;
    }, {});
  return crypto
    .createHmac("sha256", process.env.SSLR_SECRET_KEY)
    .update(JSON.stringify(sortedData))
    .digest("hex").toUpperCase(); 
};

const validateSSLRAccess = async function (req, res, next) {
    try {
        const authHeader = req.headers["authorization"];
        let apiKey = req.headers['api-key'];
        if (!authHeader || !apiKey) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized User Access"
            });
        }
        const validAuthValue = "Basic " + process.env.SSLR_BASIC_AUTH_CODE;
        if (authHeader !== validAuthValue || apiKey !== process.env.API_KEY) {
            return res.status(401).json({
                status: false,
                message: "Invalid Authorization or API Key"
            });
        }
        const decodedToken = Buffer.from(authHeader.split(" ")[1], "base64").toString("utf-8").split(":")[0];
        req.user = decodedToken;
        return next();
    } catch (error) {
        console.log("error ::: ", error);
        return res.status(401).json({ success: false, error: 'Session Expired, Please Login' })
    }
}

const validateRTGSAccess = async function (req, res, next) {
    try {
        const authHeader = req.headers["authorization"];
        const apiKey = req.headers["api-key"];
        if (!authHeader || !apiKey) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized User Access"
            });
        }
        if (apiKey !== process.env.RTGS_API_KEY) {
            return res.status(401).json({
                status: false,
                message: "Invalid API Key"
            });
        }
        if (!authHeader.startsWith("Basic ")) {
            return res.status(401).json({
                status: false,
                message: "Invalid Authorization Format"
            });
        }
        const decoded = Buffer.from(authHeader.split(" ")[1], "base64").toString("utf8");
        const [username, password] = decoded.split(":");
        if (
            username !== process.env.RTGS_USERNAME ||
            password !== process.env.RTGS_PASSWORD
        ) {
            return res.status(401).json({
                status: false,
                message: "Invalid Username or Password"
            });
        }
        req.user = username;
        next();
    } catch (error) {
        console.log("RTGS Access Error ::: ", error);
        return res.status(401).json({
            success: false,
            message: "Authentication Failed"
        });
    }
};


const validateAPCOBAccess = async function (req, res, next) {
    try {
        const authHeader = req.headers["authorization"];
        const apiKey = req.headers["api-key"];
        if (!authHeader || !apiKey) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized User Access"
            });
        }
        if (apiKey !== process.env.APCOB_API_KEY) {
            return res.status(401).json({
                status: false,
                message: "Invalid API Key"
            });
        }
        if (!authHeader.startsWith("Basic ")) {
            return res.status(401).json({
                status: false,
                message: "Invalid Authorization Format"
            });
        }
        const decoded = Buffer.from(authHeader.split(" ")[1], "base64").toString("utf8");
        const [username, password] = decoded.split(":");
        if (
            username !== process.env.APCOB_USERNAME ||
            password !== process.env.APCOB_PASSWORD
        ) {
            return res.status(401).json({
                status: false,
                message: "Invalid Username or Password"
            });
        }
        req.user = username;
        next();
    } catch (error) {
        console.log("APCOB Access Error ::: ", error);
        return res.status(401).json({
            success: false,
            message: "Authentication Failed"
        });
    }
};

// exports.authUser = authUser;
// exports.authGenerator = authGenerator;
module.exports ={getUserInfo,createToken,validateAPIkeyForISRI,authUser,authGenerator,verifyjwt,roleAuthorization,validateCDMAAccess,validateThirdPartyAccess, verifyAPIKey, validateAPIkey, verifyThirdPartyToken,validateAPIEODBkey,validateAPIkeyAPCTDP,validateAPIkeyAPCFSS, validateDocumentStatusForUpdate,validateAPDTCPAccess ,validateAPIkeyWithHash ,validateHashKey ,generateHash,validateSignatureMiddleware,validateSSLRAccess, sslrGenerateHash, validateRTGSAccess,validateAPCOBAccess,validateAPIkeyone}