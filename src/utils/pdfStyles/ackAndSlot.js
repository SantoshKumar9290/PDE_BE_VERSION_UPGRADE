
const Path = require('path');

let ackAndSlotStyles = {
	watermark: {text: "", color: 'grey', opacity: 0.1, italics: false,fontSize: 70},
	content: [
		{
			columns:[
				{
					image:  Path.resolve(__dirname,'','../../../logos/ap_logo.jpg'),
					height: 70,
					width: 70,
					style:'header'
				},
				{text:'Government of Andhra Pradesh'+'\n'+'Registration and Stamps Department',style :'title'},

			],
			
		},
		{
			text:'Public Data Entry (PDE)',style:'title1'
		},
		{
			text:'ACKNOWLEDGEMENT SLIP',style:'title2'
		},
		{
			style: 'table1',
			table: {
				widths: [100],
				body: [

				]
			}
		},
	],
	styles:{
		header:{
			alignment: 'left',
			margin: [80, 20, 0, 0]
		},
		title:{
			alignment: 'center',
			fontSize: 15,
			fontFamily:'segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif;',
			bold:true,
			margin: [-10, 40, 0, 0]
		},
		title1:{
			alignment: 'center',
			fontSize: 15,
			fontFamily:'segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif;',
			bold:true,
			margin: [10, 20, 0, 0]
		},
		title2:{
			alignment: 'center',
			fontSize: 12,
			fontFamily:'segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif;',
			bold:true,
			margin: [10, 10, 0, 0]
		},
		table1:{
			margin:[50, 10, 30, 0]
		},
		

	}
};
module.exports ={ackAndSlotStyles};