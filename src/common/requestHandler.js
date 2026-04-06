//This function is a RequestHandler which takes care of handler for ALL APIs. 
const Handler = (req, resp, Controller, successMessage, failedMessage) => {
    try {
        Controller(req).then((result) => {
            resp.status(200).send({
                status: true,
                message: successMessage,
                code: 200,
                data: result
            })
        }).catch((err) => {
            resp.status(200).send({
                status: false,
                message: err,
                code: 200,
                data: {}
            })
        });
    } catch (e) {
        resp.status(403).send({ 
            status: false, 
            message: failedMessage + '/Error=> ' + e.message, 
            code: 403,
            data: {} 
        });
    }
}
//sudhakar changes
const reqHandler = async (req, res, Controller)=>{
	const data=await Controller(req)
	return res.status(data.status).send(data);
}

module.exports = {Handler,reqHandler};
