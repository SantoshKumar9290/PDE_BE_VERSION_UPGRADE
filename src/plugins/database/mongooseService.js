/* global mongodb;
 * FileName @mongoose.service
 * author @Criticl River
 * <summary>
 *  A service is used to connect database, check connection if failed to connect it will retry to connect again.
 *  <npm>
 *      @log4js {Used for logging debug,information and errors in mongoose module}
 *      @mongoose {Mongoose is a MongoDB object modeling tool designed to work in an asynchronous environment. Mongoose supports both promises and callbacks}
 *  </npm>
 * </summary>
 */

const mongoose = require('mongoose');
const env = require('dotenv');
env.config();
const changeLogsModel = require('../../model/changes_log_modal');
const {uniqueKeyInCollectionToStoreLogs} =require('../../utils/config')
// const uri = 'mongodb+srv://hmr_cruser:hmr_cruser%40123@hmrcluster.gz42my3.mongodb.net/PDE?retryWrites=true&w=majority';
let count = 0;

const options = {
    maxPoolSize: 50,
    wtimeoutMS: 2500,
    useNewUrlParser: true
};

const connectWithRetry = async () => {
    console.log('MongoDB connection with retry')
    try{
        mongoose.set('strictQuery', false);
        // mongodb connection string
        // const con = await mongoose.connect("mongodb://" + process.env.MONDODB_HOST + ":" + process.env.MONDODB_PORT + "/" + process.env.MONGODB_DB, {
        const con = await mongoose.connect(process.env.MONGO_DB_STAGE_URL);
        const collection = con.connection;
        const changeStream = collection.watch([{ $match: 
            { 'ns.coll': { $in: Object.keys(uniqueKeyInCollectionToStoreLogs)},
             operationType: { $in: ['update', 'delete']}} }], 
             {fullDocument: 'updateLookup',fullDocumentBeforeChange: 'whenAvailable' });
        changeStream.on('change', async(data) => {
                let changedFields = null;
                if (data.operationType === 'update') {
                    changedFields = data.updateDescription.updatedFields;
                }
            await changeLogsModel.create({
                operation:data.operationType,
                applicationId:data.operationType === 'delete'
                             ? data?.fullDocumentBeforeChange?.[uniqueKeyInCollectionToStoreLogs[data.ns.coll]]
                             : data?.fullDocument?.[uniqueKeyInCollectionToStoreLogs[data.ns.coll]],
                collectionName:data.ns.coll,
                documentId:data.documentKey["_id"],
                changedFields:changedFields,
                data:data.operationType=='delete'?data.fullDocumentBeforeChange:data?.fullDocument
            })
        });
        console.log(`MongoDB connected : ${process.env.MONGO_DB_STAGE_URL}`);
    }catch(err){
        console.log(err);
        console.log('MongoDB connection unsuccessful, retry after 5 seconds. ', ++count);
    }
};

connectWithRetry();

exports.mongoose = mongoose;
