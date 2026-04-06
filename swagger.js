const swaggerAutogen = require('swagger-autogen')()

const doc = {}

const outputFile = './swagger.json'
const endpointsFiles = [ 
    './src/routes/villageRoutes.js', 
    './src/routes/partiesRoutes',
    './src/routes/userRoutes',
    './src/routes/officerRoutes',
    './src/routes/partiesRoutes',
    './src/routes/documentRoutes',
    './src/routes/villageRoutes',
    './src/routes/propertyRoutes',
    './src/routes/typeOfDocumentRoutes',
    './src/routes/slotRoutes'
]

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    require('./index')           // Your project's root file
})