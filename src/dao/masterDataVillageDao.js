const PDEError = require("../errors/customErrorClass");
const MasterDataVillageDb = require("../model/masterDataVillageModel")
const oracleDb = require('oracledb');
const {doRelease,dbConfig} = require('../plugins/database/oracleDbServices');
const OracleDB = require("oracledb");
class MasterDataVillageDao {

    create = async (villageDetails)=>{

        if(!villageDetails){
            console.error("MasterDataVillageDao - create || Village Details can't be empty")
            throw new Error("EMPTY VILLAGE DETAILS");
        }

        const village = new MasterDataVillageDb({
            ...villageDetails
        })

        try {
            const villageDetailsDbResponse = await village.save(village);
            return villageDetailsDbResponse;
        } catch (error) {
            console.log("MasterDataVillageDao - create ||  Error : ", error.message);
            throw new PDEError({err: error.message});;
        }

    }

    getByFilters = async (filters) => {
        try {
            const villageData = await MasterDataVillageDb.find(filters);
            return villageData;
        } catch (error) {
            console.log("MasterDataVillageDao - getByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

    getOneByFilters = async (filters) => {
        try {
            const villageData = await MasterDataVillageDb.findOne(filters);
            return villageData;
        } catch (error) {
            console.log("MasterDataVillageDao - getOneByFilters || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }

    getAll = async () => {
        try {
            const villageData = await MasterDataVillageDb.aggregate([
				{
					"$group": {
						"_id": "$revenueDistCode", 
						revenueDistName: { "$addToSet": "$revenueDistName" }
					 }
				},
				{ 
					"$project": {
						revenueDistCode: "$_id", 
						district: "$revenueDistName"
					}
				}

			]);
            return villageData;
        } catch (error) {
            console.log("MasterDataVillageDao - getAll || Error : ", error.message);
            throw new PDEError({err: error.message});;
        }
    }
	getfiltersFromODB = async (query)=>{
		try{
			
			let conn = await oracleDb.getConnection(dbConfig)
			let result = await conn.execute(query,{},{outFormat: oracleDb.OBJECT});
			doRelease(conn);
			return result.rows;
		}catch(ex){
			console.log("MasterDataVillageDao - getfiltersFromODB || Error : ", ex.message);
            throw new PDEError({err: ex.message});
		}
	}
	getpropertiesFromODB = async(query1,query2)=>{
		try{
			let result={};
			let conn = await oracleDb.getConnection(dbConfig);
			let property = await conn.execute(query1,{},{outFormat: oracleDb.OBJECT});
			let party= await conn.execute(query2,{},{outFormat: oracleDb.OBJECT});
			doRelease(conn);
			result.property = property.rows;
			result.party = party.rows;
			return result
		}catch(ex){
			console.log("MasterDataVillageDao - getpropertiesFromODB || Error : ", ex.message);
            throw new PDEError({err: ex.message});
		}
	};
	getSProcedureODB = async (query, obj)=>{
		try{
			let conn = await oracleDb.getConnection(dbConfig);
			let result = await conn.execute(query,obj);
			doRelease(conn);
			return result.outBinds
		}catch(ex){
			console.log("MasterDataVillageDao - getSProcedureODB || Error : ", ex.message);
            throw new PDEError({err: ex.message});
		}
	}

	getMvvalueFromOdb = async (query1,query2)=>{
		try{
			let conn = await oracleDb.getConnection(dbConfig);
			let result = await conn.execute(query1);
			let re2 = await conn.execute(query2);
			let Obj={};
			doRelease(conn);
			if(re2.rows.length >=1 && re2.rows[0].length >=1){
				Obj.marketValue= re2["rows"][0][0];
				Obj.ext_Rate = re2["rows"][0][1];
				console.log("::::::::::::::::::::OBJ",Obj)
				return Obj;
			}
		}catch(ex){
			console.log("MasterDataVillageDao - getSProcedureODB || Error : ", ex);
            throw new PDEError({err: ex.message});
		}
	}
	oDbUpdate = async (query)=>{
		try{			
			let conn = await oracleDb.getConnection(dbConfig)
			let result = await conn.execute(query);
			doRelease(conn);
			console.log("Number of rows inserted:", result.rowsAffected);
			return result.rowsAffected;
		}catch(ex){
			console.log("oracleCommonQueryService - oDbUpdate || Error : ", ex);
            throw new CARDError({err: ex.message});
		}
	};

	getMvaMvvalue = async (query1,query2)=>{
		try{
			let conn = await oracleDb.getConnection(dbConfig);
			let result = await conn.execute(query1);
			let re2 = await conn.execute(query2);
			let Obj={};
			doRelease(conn);
			if(re2.rows.length >=1 && re2.rows[0].length >=1){
				Obj.marketValue= re2["rows"][0][5];
				Obj.ext_Rate = re2["rows"][0][1];
				Obj.CHRGE_RT= re2["rows"][0][2];
				Obj.LAND_CST = re2["rows"][0][3];
				Obj.STRU_CST= re2["rows"][0][4];
				
			}
			return Obj;
		}catch(ex){
			console.log("MasterDataVillageDao - getSProcedureODB || Error : ", ex);
            throw new PDEError({err: ex.message});
		}
	}
};


module.exports = MasterDataVillageDao;