

const Path = require('path');

let checkSlipReport = {
	watermark: {text: "", color: 'grey', opacity: 0.1, italics: false,fontSize: 70},
	content: [
		// {
		// 	columns:[
		// 		{
		// 			image:  Path.resolve(__dirname,'','../../../logos/ap_logo.jpg'),
		// 			height: 70,
		// 			width: 70,
		// 			style:'header'
		// 		},
		// 		{text:'Government of Andhra Pradesh'+'\n'+'Registration and Stamps Department',style :'title'},

		// 	],
			
		// },
		// {
		// 	style: 'tableExample2',
		// 	table: {
		// 		widths: [100],
		// 		body: [

		// 		]
		// 	}
		// },
	],
	styles:{
		header:{
			alignment: 'left',
			margin: [80, -10, 0, 0]
		},
		title:{
			alignment: 'center',
			fontSize: 13,
			fontFamily:'segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif;',
			bold:true,
			margin: [-10, 10, 0, 0]
		},
		tableExample2:{
			margin:[30, 10, 30, 0]
		},
		insideTable1:{
			margin:[-3,-1,-3,-1]
		},
		insideTable2:{
			margin:[-3,-1,-30,-1]
		},
		insideTable3:{
			margin:[-3,-1,-30,-1]
		},
		insideTable4:{
			margin:[-3,-1,-30,-1]
		},
		insideTable5:{
			margin:[-3,-1,-30,-1]
		},
		insideTable6:{
			margin:[65,-1,20,-1]
		},
		insideTable7:{
			margin:[-3,-1,-30,-1]
		},
		insideTable8:{
			margin:[-3,-1,-3,-1]
		},
		insideTable9:{
			margin:[-3,-1,-3,-1]
		},
		insideTable10:{
			margin:[-3,-1,-3,-1]
		},
		insideTable11:{
			margin:[-3,-1,-3,-1]
		},
		insideTable12:{
			margin:[-3,-1,-3,-1]
		}

	}
};
module.exports ={checkSlipReport};