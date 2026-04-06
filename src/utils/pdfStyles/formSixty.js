const Path = require('path');
// let formSixtyStyles = {
// 	watermark: {text: "", color: 'grey', opacity: 0.1, italics: false,fontSize: 70},
// 	content: [
// 		{
// 			text:'Income-tax Rules, 1962',style:'title'
// 		},
// 		{
// 			text:'FORM NO. 60',style:'title1'
// 		},
// 		{
// 			text:'[See second provison to rule 114B]',style:'title2'
// 		},
// 		{
// 			text:[
// 				{text:'Form for declaration to be filed by an individual or a person (not being a company or',fontSize:10},
// 				{text:'  \n   firm)  who does  not have a permanent account number and who enters into any\n',fontSize:10},
// 			],style:'text1'
// 		},
// 		{
// 			text:[
// 			{text:'transaction specified in rule',fontSize:10},{text:' 114B',fontSize:10,bold:true}
// 			],style:'text2'
// 		},
// 		{
// 			style: 'table1',
// 			table:{
// 				widths:[30,75,10,10,10,"*",10,10,10,10,10,10,10,10],//14
// 				body:[
// 					[
// 						{text:"1",rowSpan:3,fontSize:10,style:'text2'},
// 						{text:"First Name",style:'text2',alignment:"left",margin:[-3,0,0,0]},
// 						{text:"",colSpan:12,style:'text2',fillColor:"#ffffc8"}
// 					],
// 					[
// 						"",
// 						{text:"Middle Name",style:'text2',alignment:"left",margin:[-3,0,0,0]},
// 						{text:"",colSpan:12,style:'text2',fillColor:"#ffffc8"}
// 					],
// 					[
// 						"",
// 						{text:"Surname",style:'text2',alignment:"left",margin:[-3,0,0,0]},
// 						{text:"",colSpan:12,style:'text2',fillColor:"#ffffc8"}
// 					]
// 				]
// 			},
// 			table: {	//"", mid, 	""  "","","","","","","","","","",""
// 				widths: [30, 	75,  10,10,10,100,10,10,10,10,10,10,10,10],//14
// 				body: [
// 					[
// 						{text:"1",rowSpan:3,fontSize:10,style:'text2'},
// 						{text:"First Name",style:'text2',alignment:"left",margin:[-3,0,0,0]},
// 						{text:"",colSpan:12,style:'text2',fillColor:"#ffffc8"}
// 					],
// 					[
// 						"",
// 						{text:"Middle Name",style:'text2',alignment:"left",margin:[-3,0,0,0]},
// 						{text:"",colSpan:12,style:'text2',fillColor:"#ffffc8"}
// 					],
// 					[
// 						"",
// 						{text:"Surname",style:'text2',alignment:"left",margin:[-3,0,0,0]},
// 						{text:"",colSpan:12,style:'text2',fillColor:"#ffffc8"}
// 					],
// 					[
// 						{text:"2",fontSize:10,style:'text2'},
// 						{
// 							text:"Date of Birth/ Incorporation of declarant",colSpan:5,fontSize:11,style:'text2',alignment:"left",margin:[-3,0,0,0]
// 						},
// 						{text:"",style:'text2'},{text:"",style:'text2'},{text:"",style:'text2'},{text:"",style:'text2'},
// 						// {text:""},
// 						// {text:"D",fontSize:12,alignment:"right"},
// 						// {text:"D",fontSize:12,alignment:"right"},
// 						// {text:"M",fontSize:12,alignment:"right"},
// 						// {text:"M",fontSize:12,alignment:"right"},
// 						// {text:"Y",fontSize:12,alignment:"right"},
// 						// {text:"Y",fontSize:12,alignment:"right"},
// 						// {text:"Y",fontSize:12,alignment:"right"},
// 						// {text:"Y",fontSize:12,alignment:"right"}
// 					],
// 					// [	{text:"3",fontSize:10,style:'text2'},
// 					// 	{text:"Father’s Name (In Case of Individual) ",colSpan:13,style:'text2',alignment:"left",margin:[-3,0,0,0]}
// 					// ],
// 					// [	{text:"",fontSize:10,style:'text2'},
// 					// 	{text:"First Name",style:'text2',alignment:"left",margin:[-3,0,0,0]},
// 					// 	{text:"",colSpan:12,fontSize:10,style:'text2',fillColor:"#ffffc8"},
// 					// ],
// 					// [	{text:"",fontSize:10,style:'text2'},
// 					// 	{text:"Middle Name",style:'text2',alignment:"left",margin:[-3,0,0,0]},
// 					// 	{text:"",colSpan:12,fontSize:10,style:'text2',fillColor:"#ffffc8"},
// 					// ],
// 					// [	{text:"",fontSize:10,style:'text2'},
// 					// 	{text:"Surname",style:'text2',alignment:"left",margin:[-3,0,0,0]},
// 					// 	{text:"",colSpan:12,fontSize:10,style:'text2',fillColor:"#ffffc8"},
// 					// ],
// 					// [
// 					// 	{text:"4",fontSize:10,style:'text2'},
// 					// 	{text:"Flat / Room No.",colSpan:3,fontSize:10,style:'text2',alignment:"left",margin:[-3,0,0,0]},{text:""},{text:""},
// 					// 	{text:"5",fontSize:10,style:'text6',alignment:"left",margin:[-3,0,-1000,0]},
// 					// 	{text:"Floor No.",colSpan:9,fontSize:10,style:'text2',alignment:"left",margin:[-3,0,0,0],},"","","","","","","",""
// 					// ],
// 					// [
// 					// 	"",
// 					// 	{text:"",fontSize:10,style:'text2',colSpan:1,alignment:"left",fillColor:"#ffffc8",margin:[-3,15,0,0]},
// 					// 	"","",
// 					// 	{text:"",colSpan:9,fontSize:10,style:'text2',alignment:"left",margin:[-3,15,0,0],fillColor:"#ffffc8"},
// 					// ]
// 				]
// 			}
// 		},
// 	],
// 	styles:{
// 		// header:{
// 		// 	alignment: 'left',
// 		// 	margin: [80, 20, 0, 0]
// 		// },
// 		title:{
// 			alignment: 'center',
// 			fontSize: 11,
// 			fontFamily:'segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif;',
// 			margin: [10, 5, 0, 0]
// 		},
// 		title1:{
// 			alignment: 'center',
// 			fontSize: 12,
// 			fontFamily:'segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif;',
// 			bold:true,
// 			margin: [10, 3, 0, 0]
// 		},
// 		title2:{
// 			alignment: 'center',
// 			fontSize: 10,
// 			fontFamily:'segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif;',
// 			italics: true,
// 			margin: [10, 3, 0, 0]
// 		},
// 		text1:{
// 			alignment: 'left',
// 			margin: [70, 10, 0, 0]
// 		},
// 		text2:{
// 			alignment: 'center',
// 			fontFamily:'segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif;',
// 			margin: [10, 0, 0, 0]
// 		},
// 		text6:{
// 			alignment: 'left',
// 			margin: [0, 10, 0, 0]
// 		},
// 		table1:{
// 			margin:[55, 10, 10, 0]
// 		},
		

// 	}
// };

const TOTAL_COLS = 14;

function buildDynamicRow(totalCols, cells) {
  const row = [];

  cells.forEach(cell => {
    row.push(cell);

    if (cell && cell.colSpan) {
      for (let i = 1; i < cell.colSpan; i++) {
        row.push("");
      }
    }
  });

  while (row.length < totalCols) {
    row.push("");
  }

  return row;
}

const formSixtyStyles = {
  watermark: {
    text: "",
    color: "grey",
    opacity: 0.1,
    italics: false,
    fontSize: 70
  },

  content: [
    { text: "Income-tax Rules, 1962", style: "title" },
    { text: "FORM NO. 60", style: "title1" },
    { text: "[See second provison to rule 114B]", style: "title2" },

    {
      text: [
        {
          text:
            "Form for declaration to be filed by an individual or a person (not being a company or",
          fontSize: 10
        },
        {
          text:
            "\n   firm) who does not have a permanent account number and who enters into any\n",
          fontSize: 10
        }
      ],
      style: "text1"
    },

    {
      text: [
        { text: "transaction specified in rule", fontSize: 10 },
        { text: " 114B", fontSize: 10, bold: true }
      ],
      style: "text2"
    },

    {
      style: "table1",
      table: {
        widths: [
          30,
          75,
          10, 10, 10,
          "*",
          10, 10, 10, 10, 10, 10, 10, 10
        ],

        body: [
          // Row 1 - First Name
          buildDynamicRow(TOTAL_COLS, [
            { text: "1", rowSpan: 3, fontSize: 10, style: "text2" },
            {
              text: "First Name",
              style: "text2",
              alignment: "left",
              margin: [-3, 0, 0, 0]
            },
            {
              text: "",
              colSpan: 12,
              style: "text2",
              fillColor: "#ffffc8"
            }
          ]),

          // Row 2 - Middle Name
          buildDynamicRow(TOTAL_COLS, [
            "",
            {
              text: "Middle Name",
              style: "text2",
              alignment: "left",
              margin: [-3, 0, 0, 0]
            },
            {
              text: "",
              colSpan: 12,
              style: "text2",
              fillColor: "#ffffc8"
            }
          ]),

          // Row 3 - Surname
          buildDynamicRow(TOTAL_COLS, [
            "",
            {
              text: "Surname",
              style: "text2",
              alignment: "left",
              margin: [-3, 0, 0, 0]
            },
            {
              text: "",
              colSpan: 12,
              style: "text2",
              fillColor: "#ffffc8"
            }
          ]),

          // Row 4 - Date of Birth
          buildDynamicRow(TOTAL_COLS, [
            { text: "2", fontSize: 10, style: "text2" },
            {
              text: "Date of Birth / Incorporation of declarant",
              colSpan: 5,
              fontSize: 11,
              style: "text2",
              alignment: "left",
              margin: [-3, 0, 0, 0]
            },
            {
              text: "",
              colSpan: 8,
              style: "text2",
              fillColor: "#ffffc8"
            }
          ])
        ]
      }
    }
  ],

  styles: {
    title: {
      alignment: "center",
      fontSize: 11,
      margin: [10, 5, 0, 0]
    },

    title1: {
      alignment: "center",
      fontSize: 12,
      bold: true,
      margin: [10, 3, 0, 0]
    },

    title2: {
      alignment: "center",
      fontSize: 10,
      italics: true,
      margin: [10, 3, 0, 0]
    },

    text1: {
      alignment: "left",
      margin: [70, 10, 0, 0]
    },

    text2: {
      alignment: "center",
      margin: [10, 0, 0, 0]
    },

    text6: {
      alignment: "left",
      margin: [0, 10, 0, 0]
    },

    table1: {
      margin: [55, 10, 10, 0]
    }
  }
};

module.exports = { formSixtyStyles };
