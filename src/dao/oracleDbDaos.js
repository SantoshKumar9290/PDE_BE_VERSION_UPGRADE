const PDEERROR = require("../errors/customErrorClass");
const oracleDb = require('oracledb');
oracleDb.autoCommit =true;
oracleDb.fetchAsBuffer=[oracleDb.BLOB];
const {doRelease,dbConfig,dbConfigCC,ReaddbConfig} = require('../plugins/database/oracleDbServices');

class OracleDao {
	oDBQueryService = async (query)=>{
		try{			
			let conn = await oracleDb.getConnection(dbConfig)
			let result = await conn.execute(query,{},{outFormat: oracleDb.OBJECT});
			doRelease(conn);
			return result.rows;
		}catch(ex){
			console.log("oracleCommonQueryService - oDBQueryService || Error : ", ex);
            throw new PDEERROR({err: ex.message});
		}
	};

	oDBQueryServiceCC = async(query) => {
		try{			
			let conn = await oracleDb.getConnection(dbConfigCC)
			let result = await conn.execute(query,{},{outFormat: oracleDb.OBJECT});
			doRelease(conn);
			return result.rows;
		}catch(ex){
			console.log("oracleCommonQueryService - oDBQueryService || Error : ", ex);
            throw new PDEERROR({err: ex.message});
		}
	}

	oDBQueryServiceCCWithBindParams = async(query, bindParams) => {
        let conn;
		try{			
			conn = await oracleDb.getConnection(dbConfigCC)
			let result = await conn.execute(query,bindParams,{outFormat: oracleDb.OBJECT});
            let resultList = result.rows;
            await doRelease(conn);
            conn = null;
            return resultList;
		}catch(ex){
			console.log("oracleCommonQueryService - oDBQueryServiceCCWithBindParams || Error : ", ex);
            throw new PDEERROR({err: ex.message});
        }finally{
			if(conn!=undefined && conn!=null)
				await doRelease(conn);
		}
    }

	getSProcedureODB = async (query, obj)=>{
		try{
			let conn = await oracleDb.getConnection(dbConfig);
			let result = await conn.execute(query,obj);
			doRelease(conn);
			return result.outBinds
		}catch(ex){
			console.log("oracleCommonQueryService - getSProcedureODB || Error : ", ex);
            throw new PDEERROR({err: (ex.message + ' ' + 'getSProcedureODB')});
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
			console.log("oDBQueryService - oDbUpdate || Error : ", ex);
            throw new PDEERROR({err: ex.message});
		}
	};

	oDbUpdateWithBindParams = async (query, bindParam)=>{
		try{			
			let conn = await oracleDb.getConnection(dbConfig)
			let result = await conn.execute(query, bindParam);
			doRelease(conn);
			console.log("Number of rows inserted:", result.rowsAffected);
			return result.rowsAffected;
		}catch(ex){
			console.log("oDBQueryService - oDbUpdateWithBindParams || Error : ", ex);
            throw new PDEERROR({err: ex.message});
		}
	};
	// oDbUpdateWithOutBreak = async (query)=>{
	// 	try{			
	// 		let conn = await oracleDb.getConnection(dbConfig)
	// 		let result = await conn.execute(query);
	// 		doRelease(conn);
	// 		console.log("Number of rows inserted:", result.rowsAffected);
	// 		return result.rowsAffected;
	// 	}catch(ex){
	// 		console.log("oDbUpdateWithOutBreak - oDbUpdate || Error : ", ex);
	// 		return ex;
	// 	}
	// };
	oDbDelete = async (query)=>{
		try{			
			let conn = await oracleDb.getConnection(dbConfig)
			let result = await conn.execute(query);
			doRelease(conn);
			console.log("Number of rows Deleted:", result.rowsAffected);
			return result.rowsAffected;
		}catch(ex){
			console.log("oDBQueryService - oDbDelete || Error : ", ex);
            throw new PDEERROR({err: ex.message});
		}
	};

	oDbInsertDocs = async (query, str="")=>{
		try{			
			let conn = await oracleDb.getConnection(dbConfig)
			let result = await conn.execute(query);
			doRelease(conn);
			console.log("Number of rows inserted:", result.rowsAffected);
			return result.rowsAffected;
		}catch(ex){
			console.log("oDBQueryService - oDBQueryService || Error : ", ex);
            throw new PDEERROR({err: ( ex.message + ' ' + str)});
		}
	};

	oDbInsertMultipleDocs = async (queryArr, str="")=>{
		try{			
			let conn = await oracleDb.getConnection(dbConfig);
			let result = 0;
			for(let i of queryArr){
				let r = await conn.execute(i);
				result = result + r.rowsAffected;
			}
			doRelease(conn);
			console.log("Number of rows inserted:", result);
			return result;
		}catch(ex){
			console.log("oDBQueryService - oDbInsertMultipleDocs || Error : ", ex);
            throw new PDEERROR({err: ( ex.message + ' ' + str)});
		}
	};

	// oDbInsertDocsWithOutBreak = async (query)=>{
	// 	try{			
	// 		let conn = await oracleDb.getConnection(dbConfig)
	// 		let result = await conn.execute(query);
	// 		doRelease(conn);
	// 		console.log("Number of rows inserted:", result.rowsAffected);
	// 		return result.rowsAffected;
	// 	}catch(ex){
	// 		console.log("oDbInsertDocsWithOutBreak - oDBQueryService || Error : ", ex);
    //         return ex;
	// 	}
	// };
	oDbInsertBlobDocs = async (query, bData, bData2 = '',bData3 = '')=>{
		try{			
			let conn = await oracleDb.getConnection(dbConfig);
			let setData = bData2 ? {blobData: { val: bData, type: oracleDb.BLOB }, blobData2: {val: bData2, type: oracleDb.BLOB}} : {blobData: { val: bData, type: oracleDb.BLOB }};
			if(bData3)
			setData.blobData3 = {val: bData3, type: oracleDb.BLOB};
			let result = await conn.execute(query,setData);
			doRelease(conn);
			console.log("Number of rows inserted:", result.rowsAffected);
			return result.rowsAffected;
		}catch(ex){

			console.log("oracleDbDaos - oDbInsertBlobDocs || Error : ", ex);
            throw new PDEERROR({err: ex.message});
		}
	};

	fetchDataByQuery = async (query, bindObj)=>{
		let conn;
		try{
            console.log("oracleDbDaos - Inside of fetchDataByQuery ");
			let conn = await oracleDb.getConnection(dbConfig);
			let resultSet = await conn.execute(query, bindObj);
			let metaData = resultSet.metaData;
			let dataList = resultSet.rows;
			let resultList = [];
			for(const rowData of dataList) {
				let resultData = {};
				for(let i=0;i<rowData.length;i++)
				{
					let keyName = (metaData[i].name).toLowerCase();
					keyName = keyName.replace(/_/g, '');
					resultData[keyName] = rowData[i];
				}
				resultList.push(resultData);
			}
			await doRelease(conn);
			conn = null;
            console.log("oracleDbDaos - End of fetchDataByQuery ");
            return resultList;
		}catch(error){
			console.log("oracleDbDaos - fetchDataByQuery || Error : ", error.message);
            throw error;
		}finally{
			if(conn!=undefined && conn!=null)
				await doRelease(conn);
		}
	}
	oDBQueryServiceWithBindParams = async (query, bindParams)=>{
        console.log("oracleDbDaos :: Inside of oDBQueryServiceWithBindParams method :::: ");
        let conn;
		try{			
			let conn = await oracleDb.getConnection(dbConfig);
			let result = await conn.execute(query, bindParams, {outFormat: oracleDb.OBJECT});
            let resultList = result.rows;
            await doRelease(conn);
            conn = null;
            console.log("oracleDbDaos :: End of oDBQueryServiceWithBindParams method :::: ");
            return resultList;
		}catch(ex){
			console.log("oracleDbDaos - oDBQueryServiceWithBindParams || Error : ", ex);
            throw new PDEERROR({err: ex.message});
		}finally{
			if(conn!=undefined && conn!=null)
				await doRelease(conn);
		}
	};

	oDbInsertDocsWithBindParams = async (query, bindParams)=>{
        let conn;
		try{			
			let conn = await oracleDb.getConnection(dbConfig)
			let result = await conn.execute(query, bindParams, {outFormat: oracleDb.OBJECT});
			console.log("Number of rows inserted:", result.rowsAffected);
            let resultList = result.rowsAffected;
            await doRelease(conn);
            conn = null;
            return resultList;
		}catch(ex){
			console.log("oracleCommonQueryService - oDBQueryService || Error : ", ex);
            throw new PDEERROR({err: ex.message});
		}finally{
			if(conn!=undefined && conn!=null)
				await doRelease(conn);
		}
	};

	executeClobQuery = async (query, bindParams) => {
		let conn;
		try {
			conn = await oracleDb.getConnection(dbConfig);
	
			const result = await conn.execute(
				query,
				bindParams,
				{
					outFormat: oracleDb.OUT_FORMAT_OBJECT,
					maxRows: 1
				}
			);
			const lob = result.rows[0]?.RESULT;
			if (!lob) {
				throw new Error('No CLOB result returned');
			}
			return await new Promise((resolve, reject) => {
				let clobData = '';
				lob.setEncoding('utf8');
				lob.on('data', (chunk) => {
					clobData += chunk;
				});
	
				lob.on('end', async () => {
					try {
						await doRelease(conn); 
						conn = null;
						resolve([{ RESULT: clobData }]);
					} catch (e) {
						reject(e);
					}
				});
	
				lob.on('error', async (err) => {
					console.error('CLOB stream error:', err);
					await doRelease(conn); 
					conn = null;
					reject(err);
				});
			});
	
		} catch (ex) {
			console.error('Error in executeClobQuery:', ex);
			console.log("oracleDbDaos - executeClobQuery || Error : ", ex);
            throw new PDEERROR({err: ex.message});
			throw err;
		} finally {
			if (conn) {
				try {
					await conn.close();
				} catch (ex) {
					console.log("oracleDbDaos - executeClobQuery || Error : ", ex);
            throw new PDEERROR({err: ex.message});
				}
			}
		}
	};

	ReadoDBQueryServiceWithBindParams = async (query, bindParams)=>{
        let conn;
		try{			
			let conn = await oracleDb.getConnection(ReaddbConfig);
			let result = await conn.execute(query, bindParams, {outFormat: oracleDb.OBJECT});
            let resultList = result.rows;
            await doRelease(conn);
            conn = null;
            return resultList;
		}catch(ex){
			console.log("oracleDbDaos - ReadoDBQueryServiceWithBindParams || Error : ", ex);
            throw new PDEERROR({err: ex.message});
		}finally{
			if(conn!=undefined && conn!=null)
				await doRelease(conn);
		}
	};
}
module.exports =  OracleDao;