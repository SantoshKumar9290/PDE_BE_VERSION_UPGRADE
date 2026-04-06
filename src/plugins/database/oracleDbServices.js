// const oracleDb = require('oracledb');
const {decryptWithAESPassPhrase} = require('../../utils/index')
let dbConfig ={
	user:process.env.ORACLE_DB_USER,
	password:decryptWithAESPassPhrase(process.env.ORACLE_DB_PASSWORD,process.env.adhar_Secret_key),
	connectionString:process.env.ORACLE_DB_CON_STRING
};
let dbConfigCC ={
	user:process.env.ORACLE_OLDUSER,
	password:process.env.ORACLE_OLDPASSWORD,
	connectionString:process.env.ORACLE_OLDDB
};
let ReaddbConfig ={
	user:process.env.READ_ORACLE_DB_USER,
	password:decryptWithAESPassPhrase(process.env.READ_ORACLE_DB_PASSWORD,process.env.adhar_Secret_key),
	connectionString:process.env.READ_ORACLE_DB_CON_STRING
};
async function doRelease(connection) {
	connection.release( (err) => {
	  if (err) {
		console.error(err.message);
	  }
	});
}
// const conn = oracleDb.getConnection(dbConfig,async (err,connection)=>{
// 	if (err) {
// 		console.error(err.message);
// 		return;
// 	}else{
	
// 		console.log("OracleDb Connected Successfully");
// 		console.log("!!!!!!!!!!!");
// // 		select JSON_OBJECT('ID' is EMPLOYEE_ID , 'FirstName' is FIRST_NAME,'LastName' is LAST_NAME) from HR.EMPLOYEES;

// // JSON_OBJECT('ID'ISEMPLOYEE_ID,'FIRSTNAME'ISFIRST_NAME,'LASTNAME'ISLAST_NAME)
// 		 connection.execute(`SELECT * FROM sromstr.mv_basic_urb_reg`,[],(err,result)=>{
// 			if(err){
// 				console.error(err.message);
// 			}else{
// 				console.log('YYYYYYYYYYYYY',JSON.stringify(result.metaData)	);
// 			}

// 		})
		
// 	}
	
// });

module.exports = {doRelease,dbConfig,dbConfigCC,ReaddbConfig};

