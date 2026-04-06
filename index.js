const express = require('express');
const app = express();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const env = require('dotenv');
env.config();
const bodyParser = require('body-parser');
const path = require("path");
const morgan = require('morgan');
const winston = require('./services/winston');
const routes = require('./src/routes/index')
const cors = require('cors');
const helmet = require('helmet')
const swaggerUi = require('swagger-ui-express');
swaggerDocument = require('./swagger.json');
// require('./src/plugins/database/mongooseService');
require('./src/plugins/database/oracleDbServices');

const ContentSecurityPolicy = `
    default-src 'self' 'unsafe-inline' http://cardprimme.rs.ap.gov.in https://registration.ap.gov.in https://cardprimme.rs.ap.gov.in;
    script-src 'self' 'unsafe-inline' http://cardprimme.rs.ap.gov.in https://registration.ap.gov.in https://cardprimme.rs.ap.gov.in;    
    child-src 'self' 'unsafe-inline' http://cardprimme.rs.ap.gov.in https://registration.ap.gov.in https://cardprimme.rs.ap.gov.in;
    style-src 'self' 'unsafe-inline' http://cardprimme.rs.ap.gov.in https://registration.ap.gov.in https://fonts.googleapis.com https://www.gstatic.com https://cardprimme.rs.ap.gov.in;
    font-src 'self' 'unsafe-inline' https://fonts.gstatic.com https://registration.ap.gov.in;
    img-src * 'self' data: http:;
  `
// const allowedOrigins = ['https://cardprimme.rs.ap.gov.in', 'https://registration.ap.gov.in'];
const allowedOrigins = ['http://cardprimme.rs.ap.gov.in', 'https://cardprimme.rs.ap.gov.in', 'https://registration.ap.gov.in', 'http://10.96.47.93:5005', 'http://10.96.47.66:3000','http://10.96.47.65:3000','http://10.96.47.68:5005', 'http://localhost:3000', 'https://card2.rs.ap.gov.in', 'http://primme.rs.ap.gov.in', 'https://primme.rs.ap.gov.in', 'http://card2.rs.ap.gov.in:5006', 'https://card2.rs.ap.gov.in:5006',
			'https://esign.rs.ap.gov.in','https://10.96.47.93:5005', 'http://10.96.47.22:3000', 'https://10.96.47.68:5005', 'http://localhost:4009' , 'http://localhost:4009' , 'https://localhost:3000', 'https://10.96.47.68:5008', 'http://10.96.47.68:5007', 'http://10.96.47.68:5008', 'http://10.96.47.232','https://10.96.47.69:5005','http://10.96.47.69:5005', 'http://localhost:5005'];

const allowedMethods = ['GET','HEAD','PUT','PATCH','POST','DELETE'];

app.use(cors({
   origin: allowedOrigins
}));
app.use(helmet());
app.disable('x-powered-by');
app.disable('etag');

app.use((req, res, next) => {
    const origin = req.headers.origin;
    //if (allowedOrigins.includes(origin) ) {
      // 	res.setHeader('Access-Control-Allow-Origin', origin);
    //}
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header("X-FRAME-OPTIONS", "SAMEORIGIN")
    res.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.header('Content-Security-Policy', ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim());
    res.removeHeader("X-Powered-By");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }else if(!allowedMethods.includes(req.method)){
		return res.end(405, false);
	}
	 else {
        return next();
    }
});

app.use(morgan('combined', { stream: winston.stream }));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/pdeapi/files", express.static(path.join(__dirname, "../../../pdfs/public/uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use('/pdeapi/pdfs', express.static('../../../pdfs'))
 
app.use('/pdeapi/api/hello', (req, res) => {
    // if (req.method === 'POST') {
        res.writeHead(301, {
            'Location': `${process.env.UI_URL}/EsignStatus`
        }).end();
    // }
})

app.use(
    '/api-docs',
    swaggerUi.serve, 
    swaggerUi.setup(swaggerDocument)
);
app.use('/pdeapi',routes);
// Capture 500 erors
app.use((err,req,res,next) => {
	res.status(500).send(err);
	winston.error(`${err.status || 500} - ${res.statusMessage} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,);
})

	
// Capture 404 erors
app.use((err,req,res,next) => {
	res.status(404).send(err);
	winston.info(`400 || ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`)
})

app.listen(process.env.PORT, () => { 
    console.log('Server is listening at ' + process.env.IP_ADDRESS +':%s', process.env.PORT); 
    // console.log(`Server is listening at port http://localhost:${process.env.PORT}`);
});
