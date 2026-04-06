const PDEError = require("../errors/customErrorClass");
const MatserCrda = require("../model/master_Data_Crda");
const CrdaEmpList = require("../model/crdaEmpList")
const oracleDb = require('oracledb');
const {doRelease,dbConfig} = require('../plugins/database/oracleDbServices');


class CrdaDao {
    constructor(){
        this.crdaMaster = new MatserCrda();
    }

    getData = async (payLoad)=>{
        try{
            let pipeline = [...payLoad];
            let resp = await MatserCrda.aggregate(pipeline);
            return resp;
        }catch(ex){
            console.log("MasterDataVillageDao - create ||  Error : ", ex);
            throw new PDEError(ex.message);;
        }
    }

    getEmpData = async (payLoad)=>{
        try{
            // let pipeline = [...payLoad];
            let resp = await CrdaEmpList.find(payLoad);
            return resp;
        }catch(ex){
            console.log("MasterDataVillageDao - create ||  Error : ", ex);
            throw new PDEError(ex.message);;
        }
    }
}

module.exports = CrdaDao;