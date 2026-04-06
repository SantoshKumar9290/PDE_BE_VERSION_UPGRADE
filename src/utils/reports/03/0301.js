const pdfDoc = require("pdfkit");
const fs = require("fs");
const { fontSize } = require("pdfkit");
const { pdeStyle } = require("../../pdfStyles/engDocs");
const PDEError = require("../../../errors/customErrorClass");
const { covanantsData } = require("../../pdfStyles/covanants");
const Path = require("path");
const puppeteer = require("puppeteer");
const hbs = require("handlebars");

const engGenarateDocs = async (data, path) => {
  try {
    STATIC_COVNENTS_COUNT = 7;
    let englishHtmlFilePath = Path.join(
      __dirname,
      `../htmlFiles/03/01/english.hbs`
    );
    return await genarateDocsUsingHtml(data, path, englishHtmlFilePath);
  } catch (ex) {
    console.log("ERROR ::", ex.message);
    throw new PDEError(ex.message);
  }
};

const telGenarateDocs = async (data, path) => {
  try {
    STATIC_COVNENTS_COUNT = 1;
    let teluguHtmlFilePath = Path.join(
      __dirname,
      `../htmlFiles/03/01/telugu.hbs`
    );
    return await genarateDocsUsingHtml(data, path, teluguHtmlFilePath);
    // return new Promise( async (resolve, reject) => {
    //     let [naturetype ,rest]= data.registrationType.TRAN_DESC.split(" ");
    // 	let DocNum = data.documentNature.TRAN_MAJ_CODE;
    // 	let [rest2,disc] = data.documentNature.TRAN_DESC.split("[");
    // 	let [subDesc,rest3]=disc.split("]");
    //     var [dd,m,yyyy] = data.executionDate.split("/");
    //    // var dd = String(exDate.getDate()).padStart(2, '0');
    // 	var mm = new Date(`${yyyy}-${m}-${dd}`).toLocaleDateString('en-US',{month:'long'})
    // 	let covenantArr=[];
    // 	if(data?.covanants){
    // 		let sNo =DocNum ==="01" ? 6 : DocNum ==="02"? 8 : DocNum ==="03"? 4: DocNum ==="07" ? 12: DocNum === "05"? 9: DocNum === "06"?  9: DocNum === "04"? 8: DocNum == "09"? 10: 7;
    // 		data?.covanants?.covanants.map((covn)=>{
    // 			let val = sNo ===6 || sNo ===8|| sNo ===7 ? `${covn.value}` : `\n${covn.value}`
    // 			covenantArr = [...covenantArr,val];
    // 			sNo =sNo+1;
    // 		})
    // 	};
    //     let y = data.eStamp === "N" ? 400 : 500;
    // 	let pdfDocs = new pdfDoc();
    // 	let createFileData;
    // 	pdfDocs.pipe(createFileData = fs.createWriteStream(path));
    // 	pdfDocs.font(Path.join(__dirname,'../../../../fonts','telugu.ttf'));
    //     pdfDocs.fontSize('18').text(`${subDesc}`,40,y,{align:'center',underline:true});
    //     //pdfDocs.fontSize('13').text(`రూ ${data.amount} రూపాయలు విలువగల స్థిరాస్తి ${subDesc}.`,{align:'center'});
    //     pdfDocs.fontSize('13').text(`ఈ ${subDesc} ${yyyy} వ సంవత్సరం ${mm} నెల ${dd} వ తేదీన వ్రాయబడింది.`,{align:'center'});
    //     pdfDocs.fontSize('15').text(`వ్రాయించిఇచ్చువారు :`,{align:'left',underline:true});
    //     if(data.executent && data.executent.length >0){
    //         for(let i of data.executent){
    //             let add = i.address.split("\n").join("")
    //             add= add.split(" ").join("");
    //         pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. ${toTitleCase(i.name)}, ${i.relationType}.${toTitleCase(i.relationName)}, వయస్సు ${i.age} సంవత్సరాలు, ప్రస్తుతం ${toTitleCase(add)} లో నివాసము`,{align:'justify',lineGap:0});
    //         pdfDocs.moveDown();
    //         pdfDocs.fontSize('13').text('(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “దాతలు “ గా ఈ దస్తావేజునందు పరిగణించబడుదురు).',{align:'justify',lineGap:0});
    //         }
    //     }else{
    //         pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. .......,S/O. .........,వయస్సు ........ సంవత్సరాలు,ప్రస్తుతం......... లో నివాసము`,{align:'justify',lineGap:0});
    //         pdfDocs.fontSize('13').text('(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “దాతలు “ గా ఈ దస్తావేజునందు పరిగణించబడుదురు).',{align:'justify',lineGap:0});
    //         pdfDocs.moveDown();
    //     }
    //     pdfDocs.fontSize('15').text(`మరియు`,{align:'center',underline:true});
    //     pdfDocs.fontSize('13').text(`వ్రాయించుకున్నవారు`,{align:'left',underline:true});
    //     if(data.claimant && data.claimant.length >0){
    //         for(let i of data.claimant){
    //             let add = i.address.split("\n").join("")
    //             add= add.split(" ").join("");
    //         pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. ${toTitleCase(i.name)}, ${i.relationType}.${toTitleCase(i.relationName)}, వయస్సు ${i.age} సంవత్సరాలు, ప్రస్తుతం ${toTitleCase(add)}  నివాసము`,{align:'justify',lineGap:0});
    //         pdfDocs.moveDown();
    //         }
    //     }else{
    //         pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. .......,S/O. .........,వయస్సు ........ సంవత్సరాలు,ప్రస్తుతం......... లో నివాసము`,{align:'justify',lineGap:0});
    //         pdfDocs.moveDown();
    //     }
    //     pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “దాన స్వీకర్తలు”గా ఈ దస్తావేజునందు పరిగణించబడుదురు).\n \n `,{align:'justify',lineGap:0})
    //     if(data.covanants?.acquireCovenents && data.covanants?.acquireCovenents.length >0){
    //         let aqCovanents=[]
    //         //pdfDocs.fontSize('13').text('How the Property is Aquired',{align:'justify'})
    //         let sNo=1;
    //         data?.covanants.acquireCovenents.map((aqcv)=>{
    //             let val = sNo ===1 ? ` ${aqcv.value}` : `\n ${aqcv.value}`
    // 			aqCovanents = [...aqCovanents,val];

    //         })
    //         for(let i of aqCovanents){
    //             pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
    //         }
    //     }

    //     pdfDocs.fontSize('13').text(`\n \n దాన స్వీకర్తల యందు దాతలకు గల సహజ ప్రేమాభిమానముల చేతనూ, దాన స్వీకర్తలకు కొంత స్థిరోపాధి కల్పించే ఉద్దేశ్యము చేత, దాన స్వీకర్త దాత పై ఆధారపడి యుండుట చేతనూ, ప్రేమయే ప్రతిఫలంగా యెంచి ఉచితముగా షెడ్యూలు ఆస్థిని యీ వెంటనే దఖలు పర్చి దాన స్వీకర్తకు స్వాధీన పర్చడమైనది. యింతటి నుండి సదరు ఆస్థిని దాన స్వీకర్త స్థానిక సంస్థల మరియు యితర ప్రభుత్వ లెక్కలలో దాన స్వీకర్త పేరున నమోదు చేయించుకొని, సదరు ఆస్థికి చెల్లించవలసిన పన్నులు వగైరాలు చెల్లించుకుంటూ, పుత్ర, పౌత్ర వంశపారంపర్యంగా  ఋణ, దాన విక్రయాధికారపు సమస్త సంపూర్ణ హక్కులతోను, యీజిమెంటు రహదారి హక్కులతోను, దాన స్వీకర్త యిష్టానుసారం శాశ్వతముగా, స్వేచ్ఛగా, సుఖాన అనుభవించవలెను. `,{align:'justify',lineGap:1});

    //     if(covenantArr && covenantArr.length >0){
    //         for(let i of covenantArr){
    //           //  pdfDocs.fontSize('13').text(`Additional Covanants:`,{align:'justify',lineGap:1});
    //         }
    //     }
    //     if(covenantArr && covenantArr.length >0){
    //         for(let i of covenantArr){
    //             pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
    //         }
    //     }

    //     //property
    //     if (data?.property && data.property?.length > 0) {
    //         pdfDocs.addPage();
    //         let x1 = 40, y1 = 180;
    //         let propLangth = data.property.length;
    //         let tMValue = 0;
    //         let dataI = 0;
    //         pdfDocs.fontSize('13').text(`షెడ్యూలు ఆస్తి వివరము`, { align: 'center', lineGap: 0, underline: true });
    //         pdfDocs.moveDown();
    //         for (let i of data.property) {

    //             dataI = dataI === 0 ? 1 : dataI + 1;
    //             tMValue = tMValue + i.marketValue
    //             x1 = 40, y1 = 180;
    //             let [landUse, rest1] = i.landUse.split('[')
    //             pdfDocs.fontSize('13').text(`షెడ్యూల్ ${i.seqNumber} : ${toTitleCase(landUse)}`, x1, 130, { align: 'left', lineGap: 0 });
    //             pdfDocs.fontSize('13').text(`ఆస్తి యుండు ప్రదేశము`, x1, 160, { align: 'left', lineGap: 0 });
    //             pdfDocs.moveDown();
    //             let header1 = 'రిజిస్ట్రేషన్ జిల్లా';
    //             // i.sroOffice ="YYYYYYYYYYYYYY"
    //             // i.mandal= "tripuranthakam"
    //             // console.log("&&&&&&&&&&&&&&&&&&&&&&&&",String(i.sroOffice).length,String(i.village).length,String(i.mandal).length)
    //             // let rowHeight ;
    //             // let vgHeight,mdHight,sroHight;
    //             // vgHeight =String(i.village).length;
    //             // mdHight = String(i.mandal).length;
    //             // sroHight = String(i.mandal).length;
    //             let Dist = await toTitleCase(i.district);
    //             let sroOffice = await toTitleCase(i.sroOffice);
    //             let village = await toTitleCase(i.village);
    //             let mandal = await toTitleCase(i.mandal);
    //             pdfDocs.rect(x1, y1, 500, 20).rect(x1, y1 + 20, 500, 20).moveTo(150, 180).lineTo(150, 200).moveDown(0.1)
    //                 .text(header1, x1 + 2, y1 + 2, { indent: 5, align: 'left', fontSize: '16' }).moveTo(300, 180).lineTo(300, 200)
    //                 .text(`సబ్ రిజిస్ట్రార్ కార్యాలయము`, x1 + 112, y1 + 2, { indent: 5, align: 'left', fontSize: '16' })
    //                 .moveTo(430, 180).lineTo(430, 200)
    //                 .text(`రెవెన్యూ గ్రామము`, x1 + 262, y1 + 2, { indent: 5, align: 'left', fontSize: '16' })
    //                 .text(`మండలము`, x1 + 392, y1 + 2, { indent: 5, align: 'left', fontSize: '16' })
    //                 .moveTo(150, 180).lineTo(150, 220)
    //                 .text(`${Dist}`, x1 + 2, y1 + 22, { indent: 5, align: 'left', fontSize: '16' })
    //                 .moveTo(300, 200).lineTo(300, 220)
    //                 .text(`${sroOffice}`, x1 + 112, y1 + 22, { width: 140, indent: 5, align: 'left', fontSize: '16' })
    //                 .moveTo(430, 200).lineTo(430, 220)
    //                 .text(`${village}`, x1 + 259, y1 + 22, { width: 120, indent: 5, align: 'left', fontSize: '16' })
    //                 .text(`${mandal}`, x1 + 388, y1 + 22, { width: 122, indent: 5, align: 'left', fontSize: '16' })
    //                 .lineWidth(1).stroke();
    //             x1 = 40; y1 = 187;
    //             // pdfDocs.text('jsshggssf',x1,y1+40)
    //             pdfDocs.moveDown()
    //             let lBD = ""
    //             if (String(i.localBodyType).includes('[')) {
    //                 let [rest, localbody] = i.localBodyType.split('[');
    //                 let [localbody2, rest2] = localbody.split(']');
    //                 lBD = localbody2;
    //             }

    //             pdfDocs.rect(x1, y1 + 40, 500, 20).rect(40, y1 + 60, 500, 20).moveTo(300, y1 + 40).lineTo(300, y1 + 60)
    //                 .text(`రెవెన్యూ జిల్లా`, 42, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                 .text(`స్థానిక సంస్థ / పంచాయతీ`, 300, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                 .moveTo(300, y1 + 60).lineTo(300, y1 + 80)
    //                 .text(`${toTitleCase(i.district)}`, 42, y1 + 62, { indent: 5, align: 'left', fontSize: '16' })
    //                 .text(`${toTitleCase(lBD)}`, 300, y1 + 62, { indent: 5, align: 'left', fontSize: '16' })
    //                 .lineWidth(1).stroke();
    //             x1 = 40; y1 = 262 + 10;
    //             pdfDocs.fontSize('13').text(`ఆస్థి సర్వే విస్తీర్ణము మరియు విలువలు వివరములు (రూల్-3 స్టేటుమెంటు):`, x1, y1);

    //             let locality = i.locality != "" ? toTitleCase(locality) : toTitleCase(i.habitation);
    //             let propType = i.propertyType.includes('RURAL') ? 'RURAL' : 'URBAN';
    //             y1 = y1 + 20;
    //             pdfDocs.fontSize('13').text(`Locality : ${locality}`, x1, y1);
    //             if (propType === "URBAN") {
    //                 let srList = i.survayNo.split(","),drList = i.doorNo.split(","),plotList =i.plotNo.split(",");
    //                 let sryLength = srList.length /3,drLength =drList.length/3,plotLength =plotList.length/3;
    //                 let highValue = Math.max(sryLength,drLength,plotLength);
    //                 let hg = 20 * highValue;
    //                 let rowHeight = highValue > 1 ? 40 + hg : 40;
    //                 let rowLine = highValue > 1 ? 60 + hg : 60;
    //                 if(srList.length >3) srList = await InsertWordOnCerIntervel(srList);
    //                 if(drList.length >3)  drList = await InsertWordOnCerIntervel(drList);
    //                 if(plotList.length >3) plotList = await InsertWordOnCerIntervel(plotList);
    //                 let fSrNos = await drSurveyList(srList);
    //                 let fDrNos = await drSurveyList(drList);
    //                 let fplots = await drSurveyList(plotList);
    //                 let msA = propType ==='URBAN'? i.propertyType.tUnits === 'Y' ? "Sq.Yards" : 'Sq.Feet' :'Acres';
    //                 pdfDocs.rect(x1, y1 + 20, 500, 20).rect(x1, y1 + 20, 500, rowHeight).moveTo(x1 + 41, y1 + 20).lineTo(x1 + 41, y1 + rowLine)
    //                     .text(`Ward`, x1 + 2, y1 + 22, { indent: 5, align: 'left', fontSize: '16' }).moveTo(125, y1 + 20).lineTo(125, y1 + rowLine)
    //                     .text(`Block`, x1 + 42, y1 + 22, { indent: 5, align: 'left', fontSize: '16' }).moveTo(182, y1 + 20).lineTo(182, y1 + rowLine)
    //                     .text(`Door`, x1 + 100, y1 + 22, { indent: 5, align: 'left', fontSize: '16' }).moveTo(250, y1 + 20).lineTo(250, y1 + rowLine)
    //                     .text(`Survey No`, x1 + 140, y1 + 22, { indent: 5, align: 'left', fontSize: '16' }).moveTo(330, y1 + 20).lineTo(330, y1 + rowLine)
    //                     .text(`T.Ext(Sq.yd)`, x1 + 207, y1 + 22, { indent: 5, align: 'left', fontSize: '16' }).moveTo(390, y1 + 20).lineTo(390, y1 + rowLine)
    //                     .text(`plot`,x1+286,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(460,y1+20).lineTo(460,y1+rowLine)
    //                     .text(`Undivided`, x1 + 345, y1 + 22, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`Marketvalue`, x1 + 415, y1 + 22, { indent: 5, align: 'left', fontSize: '16' })

    //                     .text(`${i.ward}`, 42, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${i.block}`, x1 + 57, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${fDrNos}`, x1 + 85, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${fSrNos}`, x1 + 140, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${i.extent}`, x1 + 208, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${fplots}`,x1+288,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                     .text(`${i.undividedShare}`,x1 + 356, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${i.marketValue}`, x1 + 415, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                     .lineWidth(1).stroke();
    //                 pdfDocs.moveDown();
    //                 let [scProp, rest] = i.schedulePropertyType.split('[');
    //                 scProp = scProp.trim();
    //                 if (scProp == "FLAT" || scProp == "HOUSE") {
    //                     y1= y1+rowLine;
    //                     pdfDocs.text(`Structure Details :`, 40, y1, { align: 'left' });
    //                 }
    //                 if (scProp == "FLAT") {
    //                     y1= y1+20;
    //                     pdfDocs.text(`Apartment Name : ${toTitleCase(i.appartmentName)}`, 40, y1, { align: 'left' });
    //                     pdfDocs.text(`No of Floors : ${i.totalFloors}`, 110, y1, { align: 'right' });
    //                 }
    //                 pdfDocs.moveDown();

    //                 // pdfDocs.text('sudhakar',x1,y1)
    //                 if (i.structure && i.structure.length > 0) {
    //                     x1 = 40, y1 = y1 + 20;
    //                     for (let j in i.structure) {
    //                         let [strType, rest] = i.structure[j].structureType.split('[');
    //                         let [stageOfCons, rest2] = i.structure[j].stageOfCons.split('[');
    //                         let rowHeight = String(stageOfCons).length > 16 ? 40 : 20;
    //                         let rowLine = String(stageOfCons).length > 16 ? 60 : 40
    //                         pdfDocs.rect(x1, y1, 500, 20).rect(x1, y1 + 20, 500, rowHeight).moveTo(x1 + 85, y1).lineTo(x1 + 85, y1 + rowLine)
    //                             .text(`floorNo`, x1 + 2, y1 + 2, { indent: 5, align: 'left', fontSize: '16' }).moveTo(x1 + 230, y1).lineTo(x1 + 230, y1 + rowLine)
    //                             .text(`Structure type`, x1 + 105, y1 + 2, { indent: 5, align: 'left', fontSize: '16' }).moveTo(x1 + 312, y1).lineTo(x1 + 312, y1 + rowLine)
    //                             .text(`Plinth(Sq.ft)`, x1 + 235, y1 + 2, { indent: 5, align: 'left', fontSize: '16' }).moveTo(x1 + 462, y1).lineTo(x1 + 462, y1 + rowLine)
    //                             .text(`Stage of Cons`, x1 + 312, y1 + 2, { indent: 5, align: 'left', fontSize: '16' })
    //                             .text(`Age`, x1 + 464, y1 + 2, { indent: 5, align: 'left', fontSize: '16' })
    //                             .text(`${i.structure[j].floorNo}`, x1 + 2, y1 + 22, { indent: 5, align: 'left', fontSize: '16' })
    //                             .text(`${toTitleCase(strType)}`, x1 + 85, y1 + 22, { width: 150, indent: 5, align: 'left', fontSize: '16' })
    //                             .text(`${i.structure[j].plinth}`, x1 + 235, y1 + 22, { indent: 5, align: 'left', fontSize: '16' })
    //                             .text(`${toTitleCase(stageOfCons)}`, x1 + 312, y1 + 22, { width: 200, indent: 5, align: 'left', fontSize: '16' })
    //                             .text(`${i.structure[j].age}`, x1 + 464, y1 + 22, { indent: 5, align: 'left', fontSize: '16' })
    //                             .lineWidth(1).stroke();
    //                         // pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,40).moveTo(x1+85,y1).lineTo(x1+85,y1+40)
    //                         // .lineWidth(1).stroke();
    //                     }
    //                 }

    //                 if (scProp == "FLAT") {
    //                     x1 = 40, y1 = y1 + 22 + 60;
    //                     pdfDocs.text(`Flat Boundary Details :`, x1, y1);
    //                     x1 = 40, y1 = y1 + 20;
    //                     let east = await toTitleCase(i.flatEastBoundry)
    //                     let west = await toTitleCase(i.flatWestBoundry)
    //                     let north = await toTitleCase(i.flatNorthBoundry)
    //                     let south = await toTitleCase(i.flatSouthBoundry)
    //                     pdfDocs.rect(x1, y1, 500, 20).rect(x1, y1 + 20, 500, 20).rect(x1, y1 + 40, 500, 20).rect(x1, y1 + 60, 500, 20).moveTo(x1 + 100, y1).lineTo(x1 + 100, y1 + 80)
    //                         .text(`EAST`, x1 + 2, y1 + 2, { indent: 5, align: 'left', fontSize: '16' })
    //                         .text(`WEST`, x1 + 2, y1 + 22, { indent: 5, align: 'left', fontSize: '16' })
    //                         .text(`NORTH`, x1 + 2, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                         .text(`SOUTH`, x1 + 2, y1 + 62, { indent: 5, align: 'left', fontSize: '16' })
    //                         .text(`${east}`, x1 + 102, y1 + 2, { indent: 5, align: 'left', fontSize: '16' })
    //                         .text(`${west}`, x1 + 102, y1 + 22, { indent: 5, align: 'left', fontSize: '16' })
    //                         .text(`${north}`, x1 + 102, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                         .text(`${south}`, x1 + 102, y1 + 62, { indent: 5, align: 'left', fontSize: '16' })
    //                         .lineWidth(1).stroke();
    //                 }

    //                 x1 = 40, y1 = y1 + 62 + 20;
    //                 pdfDocs.text(`Boundary Details :`, x1, y1);
    //                 x1 = 40, y1 = y1 + 20;
    //                 // pdfDocs.rect(x1,y1)
    //                 let eastBry = await toTitleCase(i.eastBoundry);
    //                 let westBry = await toTitleCase(i.westBoundry);
    //                 let northBry = await toTitleCase(i.northBoundry);
    //                 let southBry = await toTitleCase(i.southBoundry);
    //                 pdfDocs.rect(x1, y1, 500, 20).rect(x1, y1 + 20, 500, 20).rect(x1, y1 + 40, 500, 20).rect(x1, y1 + 60, 500, 20).moveTo(x1 + 100, y1).lineTo(x1 + 100, y1 + 80)
    //                     .text(`EAST`, x1 + 2, y1 + 2, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`WEST`, x1 + 2, y1 + 22, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`NORTH`, x1 + 2, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`SOUTH`, x1 + 2, y1 + 62, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${eastBry}`, x1 + 102, y1 + 2, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${westBry}`, x1 + 102, y1 + 22, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${northBry}`, x1 + 102, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${southBry}`, x1 + 102, y1 + 62, { indent: 5, align: 'left', fontSize: '16' })
    //                     .lineWidth(1).stroke();
    //                 pdfDocs.addPage();
    //             } else if (propType === "RURAL") {
    //                 pdfDocs.rect(x1, y1 + 40, 500, 20).rect(x1, y1 + 60, 500, 20).moveTo(150, y1 + 40).lineTo(150, y1 + 80)
    //                     .text(`సర్వే/సబ్ నెంబర్. లు`, x1 + 2, y1 + 42, { indent: 5, align: 'left', fontSize: '16' }).moveTo(300, y1 + 40).lineTo(300, y1 + 80)
    //                     .text(`బదలాయించు విస్తీర్ణము`, x1 + 112, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`మార్కెట్ విలువ`, x1 + 262, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${i.survayNo}`, 42, y1 + 62, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${i.tExtent}(Acres)`, 152, y1 + 62, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${i.marketValue}`, 302, y1 + 62, { indent: 5, align: 'left', fontSize: '16' })
    //                     .lineWidth(1).stroke();
    //                 x1 = 40; y1 = y1 + 62 + 40;

    //                 pdfDocs.rect(x1, y1, 500, 20).rect(40, y1 + 20, 500, 20).rect(40, y1 + 40, 500, 20).rect(40, y1 + 60, 500, 20).moveTo(150, y1).lineTo(150, y1 + 80)
    //                     .text(`తూర్పు`, 42, y1 + 2, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`పడమర`, 42, y1 + 22, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`ఉత్తరం`, 42, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`దక్షణం`, 42, y1 + 62, { indent: 5, align: 'left', fontSize: '16' })

    //                     .text(`${toTitleCase(i.eastBoundry)}`, 152, y1 + 2, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${toTitleCase(i.westBoundry)}`, 152, y1 + 22, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${toTitleCase(i.northBoundry)}`, 152, y1 + 42, { indent: 5, align: 'left', fontSize: '16' })
    //                     .text(`${toTitleCase(i.southBoundry)}`, 152, y1 + 62, { indent: 5, align: 'left', fontSize: '16' })
    //                     .lineWidth(1).stroke();
    //                 if (propLangth === dataI) {
    //                     const chargeableValue = Math.max(data.amount, tMValue);
    //                     x1 = 40; y1 = y1 + 62 + 20;
    //                     pdfDocs.fontSize('12').text(`సుంకం నిర్ధారణ నిమిత్తం :`, x1 + 2, y1, { align: 'left' });
    //                     x1 = 40; y1 = y1 + 40;
    //                     pdfDocs.rect(x1, y1, 500, 20).moveTo(320, y1).lineTo(320, y1 + 20)
    //                         .text(`ఛార్జ్ చేయదగిన విలువ (తదుపరి 500/- వరకు)`, 42, y1 + 2, { indent: 5, align: 'left', fontSize: '16' })
    //                         .text(`${chargeableValue}/`, 320, y1 + 2, { indent: 5, align: 'left', fontSize: '16' })
    //                         .lineWidth(1).stroke();
    //                 }
    //                 pdfDocs.addPage();
    //             }
    //             // x1=40;y1=y1+62+40;

    //             // if(y1 === 300){
    //             // 	pdfDocs.addPage();
    //             // }
    //         }

    //     }
    //     pdfDocs.fontSize('13').text('రిజిస్ట్రేషన్ చట్టము, 1908 నందలి సెక్షన్ 22-B ననుసరించి చేయు ప్రకటన  ',{align:'center',underline:true,lineGap:0});
    //     pdfDocs.fontSize('13').text(`షెడ్యూలు దాఖలా ఆస్తిని గాని అందలి కొంత భాగమును గాని ఈ దస్తావేజునందలి బదిలీ దారులు స్వయంగా గాని రెప్రెసెంటేటివ్ లు, అస్సయినీలు, ఏజెంట్ల ద్వారా గాని మరి ఏ ఇతరలకు రిజిస్టరైన దస్తావేజు ద్వారా  బదలాయించలేదని ఇందు మూలము గా ప్రకటించడమైనది.  ఈ ఆస్తి ఏ దస్తావేజు ద్వారా బదిలీ దారులకు సంక్రమించి యున్నదో ఆ దస్తావేజు ఏ న్యాయస్థానము యొక్క ఉత్తర్వుల ద్వారా రద్దు చేయబడలేదని ప్రకటించడమైనది. ఈ ప్రకటన అవాస్తవమని నిరూపించబడిన యెడల చట్ట ప్రకారము మాపై తీసుకొనబడు చర్యలకు బద్దులమై ఉండుటయే కాక బదిలీదారులకు వాటిల్లిన నష్టమును భర్తీ చేయగలవారమని ప్రకటించడమైనది. \n`,{align:'left',lineGap:0});
    //     pdfDocs.fontSize('13').text(` షెడ్యూలు దాఖలా ఆస్తి ప్రభుత్వ ఆస్తి గాని అస్సయిండ్ ఆస్తి గాని వక్ఫ్ బోర్డ్ కు చెందిన ఆస్తి గాని దేవాదాయ శాఖకు చెందిన ఆస్తి గాని కాదని ఇందు మూలము గా ప్రకటించడమైనది.  `
    //     ,{align:'left',lineGap:0});
    //     //pdfDocs.fontSize('13').text(`\nరిజిస్టర్డ్ డాక్యుమెంట్ ద్వారా షెడ్యూల్ ప్రాపర్టీని ఏ ఇతర వ్యక్తికి, సంస్థకు శాశ్వతంగా  బదలాయించుట  జరగలేదని మరియు భారతీయ రిజిస్ట్రేషన్ సెక్షన్-22బి కింద గౌరవనీయమైన కోర్టు ఆదేశం ద్వారా మునుపటి రిజిస్టర్డ్ డాక్యుమెంట్ రద్దు చేయబడలేదని దాతలు ఇందుమూలంగా ప్రకటించుచున్నారు. భవిష్యత్ లో ఏదైనా వాస్తవాలను కప్పిపుచ్చినట్లు వెల్లడి అయిన యెడల దాతలు దాన స్వీకర్తలకు వాటిల్లిన నష్టాన్ని భర్తీచేయడమే కాకుండా చట్టం ప్రకారం తీసుకొనబడే చర్యలకు బాధ్యత వహించ గలమని దాతలు ఇందుమూలంగా ప్రకటిస్తున్నారు. `,{align:'left',lineGap:0});
    //     // pdfDocs.fontSize('13').text(`పైన పేర్కొన్న  తేదీన దాతలు మరియు దాన స్వీకర్తలు  ఈ దాన దస్తావేజు పై ఈ క్రింది సాక్షుల సమక్షంలో సంతకములు చేయడమైనది.`,{align:'left',lineGap:0});
    //     pdfDocs.moveDown();
    //     pdfDocs.fontSize('13').text(`దాతలు:`,{align:'left',lineGap:0});

    //     if(data?.executent && data?.executent.length >0){

    //         for(let i of data.executent){
    //             let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0,8),"XXXX XXXX  ") : "xxxx xxxx ";
    //             pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: ${toTitleCase(i.name)}`+'\n'+`ఆధార్ నెంబర్ : ${aadhar}`,{align:'left'});

    //         }
    //         // pdfDocs.fontSize('13').text(`నాకు సుమారు ${i.age} సం..లు వయస్సు కలదు జీవితము అశాశ్వతము అనియు మరియు ఎప్పుడు ఎట్లుండునో అని, నా తదనంతరం నాఆస్తిని గూర్చి ఎవ్వరూ ఎట్టి తగవులు పడకుండ ఉండగలందులకు గానూ నాఆస్ధిని గురించి జరగవలసిన ఏర్పాట్లకు ఇప్పుడే మనస్పూర్తిగా నిర్ణయించి యీవీలునామా నాసమ్మతితో   వ్రాయించడమైనది.`,{align:'left',lineGap:0})
    //     }else{
    //         pdfDocs.fontSize('13').text(`1. వ పార్టీ : .....................`,{align:'left',lineGap:0});
    //         pdfDocs.moveDown();
    //     }
    //     pdfDocs.fontSize('13').text(`యిందుకు సాక్షులు`,{align:'left',lineGap:0,underline:true});
    //     pdfDocs.fontSize('13').text(`1.                                                    `,{align:'left',lineGap:0});
    //     pdfDocs.fontSize('13').text(`2.                                                    `,{align:'left',lineGap:0});
    //     pdfDocs.end();
    //     createFileData.on('finish', resolve);

    // })
  } catch (ex) {
    console.log("ERROR ::", ex.message);
    throw new PDEError(ex.message);
  }
};
const genarateDocsUsingHtml = async (data, path, htmlFilePath) => {
  try {
    console.log("FINAL DATA IS ", JSON.parse(JSON.stringify(data)));
    let [naturetype, rest] = data.registrationType.TRAN_DESC.split(" ");
    let DocNum = data.documentNature.TRAN_MAJ_CODE;
    let [rest2, disc] = data.documentNature.TRAN_DESC.split("[");
    let [subDesc, rest3] = disc.split("]");
    var [dd, m, yyyy] = data.executionDate.split("/");
    let documentDataValues = {
      date: dd,
      month: m,
      year: yyyy,
    };
    let count = 1;

    if (data.executent && data.executent.length > 0) {
      data.executent.map((executantDetails) => {
        executantDetails.index = count;
        let add = executantDetails.address.split("\n").join("");
        add = add.split(" ").join("");
        executantDetails.stringAddress = add;
        count = count + 1;
      });
    } else {
      data.executent = [];
    }

    count = 1;

    if (data.claimant && data.claimant.length > 0) {
      data.claimant.map((claimantDetails) => {
        claimantDetails.index = count;
        let add = claimantDetails.address.split("\n").join("");
        add = add.split(" ").join("");
        claimantDetails.stringAddress = add;
        count = count + 1;
      });
    } else {
      data.claimant = [];
    }

    count = 1;

    if (data.payment && data.payment.length > 0) {
      data.payment = JSON.parse(JSON.stringify(data.payment));
      data.payment.map(async (paymentDetails) => {
        paymentDetails.index = count;
        let paymentInWords = NumToWord(paymentDetails.payAmount);
        let paymentDateInFormat = new Date(
          paymentDetails?.dateOfPayment
        ).toLocaleDateString();
        paymentDetails.paymentInWords = paymentInWords;
        paymentDetails.paymentDateInFormat = paymentDateInFormat;
        count = count + 1;
      });
    } else {
      data.payment = [];
    }

    landAmount = data.amount;

    let aquiredCovanents = [];

    if (
      data.covanants?.acquireCovenents &&
      data.covanants?.acquireCovenents.length > 0
    ) {
      // pdfDocs.fontSize('13').text('How the Property is Aquired',{align:'justify'})
      let sNo = 1;
      data?.covanants.acquireCovenents.map((aqcv) => {
        let val = sNo === 1 ? `${aqcv.value}` : `${aqcv.value}`;
        aquiredCovanents = [...aquiredCovanents, val];
        sNo = sNo + 1;
      });
    }

    let additionalCovenants = [];
    if (data?.covanants) {
      count = STATIC_COVNENTS_COUNT + 1;
      data?.covanants?.covanants.map((covn) => {
        additionalCovenants.push({
          index: count,
          value: covn.value,
        });
        count = count + 1;
      });
    }

    let totalMarketValue = 0;
    let isSchedsPresent = [1];

    if (data.property == null || data.property.length == 0) {
      isSchedsPresent = [];
    }

    let propCount = 1;

    // Property Related Information
    data.property?.map((propertyDetails) => {
      propertyDetails.serialNo = propCount;
      propCount = propCount + 1;
      totalMarketValue = totalMarketValue + propertyDetails.marketValue;
      propertyDetails.showLinkedData = [];
      if (
        propertyDetails.LinkedDocDetails != null &&
        propertyDetails.LinkedDocDetails.length > 0
      ) {
        propertyDetails.showLinkedData = [1];
      }
      propertyDetails.isRural = [];
      propertyDetails.isUrbanProperty = [];
      propertyDetails.isUrbanApartmentSingleWithCellar = [];
      propertyDetails.isUrbanApartmentMultipleWithCellar = [];
      propertyDetails.isUrbanApartmentSingleWithoutCellar = [];
      propertyDetails.isUrbanApartmentMultipleWithoutCellar = [];
      propertyDetails.isUrbanHouseSingleWithCellar = [];
      propertyDetails.isUrbanHouseMultipleWithCellar = [];
      propertyDetails.isUrbanHouseSingleWithoutCellar = [];
      propertyDetails.isUrbanHouseMultipleWithoutCellar = [];
      propertyDetails.isUrbanSite = [];
      let propertyType = "";
      propertyDetails.propertyType.includes("RURAL")
        ? (propertyType = "RURAL")
        : (propertyType = "URBAN");
      if (propertyType == "RURAL") {
        propertyDetails.isRural.push(1);
      } else {
        let [scProp, rest] = propertyDetails.schedulePropertyType.split("[");
        if (scProp == "FLAT ") {
          propertyDetails.isUrbanSite.push(1);
          propertyDetails.isUrbanProperty.push(1);
          let floorPlinth = 0;
          let cellarPlinth = 0;
          let isCellar = false;
          let newStructureDetails = [];
          console.log(
            "TOTAL STRUCTURE DETAILS",
            JSON.stringify(propertyDetails.structure)
          );
          if (
            propertyDetails.structure != null &&
            propertyDetails.structure.length > 0
          ) {
            for (index in propertyDetails.structure) {
              if (propertyDetails.structure[index]["floorNo"] == "Cellar") {
                cellarPlinth = propertyDetails.structure[index]["plinth"];
                isCellar = true;
              } else {
                newStructureDetails.push(
                  JSON.parse(JSON.stringify(propertyDetails.structure[index]))
                );
                floorPlinth =
                  floorPlinth + propertyDetails.structure[index]["plinth"];
              }
            }
          }
          if (newStructureDetails.length > 1) {
            isCellar
              ? propertyDetails.isUrbanApartmentMultipleWithCellar.push(1)
              : propertyDetails.isUrbanApartmentMultipleWithoutCellar.push(1);
          } else {
            isCellar
              ? propertyDetails.isUrbanApartmentSingleWithCellar.push(1)
              : propertyDetails.isUrbanApartmentSingleWithoutCellar.push(1);
          }
          propertyDetails.newStructureDetails = newStructureDetails;
          propertyDetails.floorPlinth = floorPlinth;
          propertyDetails.cellarPlinth = cellarPlinth;
        } else if (scProp == "HOUSE ") {
          propertyDetails.isUrbanProperty.push(1);
          let floorPlinth = 0;
          let cellarPlinth = 0;
          let isCellar = false;
          let newStructureDetails = [];
          console.log(
            "TOTAL STRUCTURE DETAILS",
            JSON.stringify(propertyDetails.structure)
          );
          if (
            propertyDetails.structure != null &&
            propertyDetails.structure.length > 0
          ) {
            for (index in propertyDetails.structure) {
              if (propertyDetails.structure[index]["floorNo"] == "Cellar") {
                cellarPlinth = propertyDetails.structure[index]["plinth"];
                isCellar = true;
              } else {
                newStructureDetails.push(
                  JSON.parse(JSON.stringify(propertyDetails.structure[index]))
                );
                floorPlinth =
                  floorPlinth + propertyDetails.structure[index]["plinth"];
              }
            }
          }
          if (newStructureDetails.length > 1) {
            isCellar
              ? propertyDetails.isUrbanHouseMultipleWithCellar.push(1)
              : propertyDetails.isUrbanHouseMultipleWithoutCellar.push(1);
          } else {
            isCellar
              ? propertyDetails.isUrbanHouseSingleWithCellar.push(1)
              : propertyDetails.isUrbanHouseSingleWithoutCellar.push(1);
            newStructureDetails = newStructureDetails[0];
          }
          propertyDetails.newStructureDetails = newStructureDetails;
          propertyDetails.floorPlinth = floorPlinth;
          propertyDetails.cellarPlinth = cellarPlinth;
        }
      }

      let linkedCount = 1;
      propertyDetails.LinkedDocDetails?.map((linkedDocument) => {
        linkedDocument.sroOfficeName = linkedDocument.sroOffice;
        linkedDocument.sNo = linkedCount;
        linkedDocument.registeredYear = linkedDocument.regYear;
        linkedDocument.bookNumber = linkedDocument.bookNo;
        linkedDocument.linkDocuNo = linkedDocument.linkDocNo;
        linkedCount = linkedCount + 1;
      });
      // let propType =  propertyDetails.propertyType.includes('RURAL') ? 'RURAL':'URBAN';
      // 			let msA = propType ==='URBAN'?"Sq.Yds":'Acres';
      totalExtent = parseFloat(propertyDetails.tExtent);
      propertyDetails.acres = parseInt(totalExtent / 1);
      propertyDetails.cents = (totalExtent * 100) % 100;
      propertyDetails.calculatedValue = (
        propertyDetails.marketValue / totalExtent
      ).toFixed(2);
    });

    let dynamicData = {
      documentDataValues: documentDataValues,
      aquiredCovanents: aquiredCovanents,
      additionalCovenants: additionalCovenants,
      paymentDetails: data.payment,
      isSchedsPresent,
      propertyDetails: data.property.length > 0 ? data.property : [],
      landAmount: landAmount,
      chargableValue:
        totalMarketValue > landAmount ? totalMarketValue : landAmount,
      executantDetails: data.executent,
      claimantDetails: data.claimant,
    };

    console.log("DYNAMIC DATA IS ", dynamicData);

    let browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    let page = await browser.newPage();
    let files = [htmlFilePath];

    let html = "";
    files.forEach((file) => {
      html += fs.readFileSync(`${file}`, "utf-8");
    });

    await page.setContent(hbs.compile(html)(dynamicData));
    await page.pdf({
      path: path,
      printBackground: true,
      format: "A4",
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    });
    console.log("Done Pdf printing!!", path);
    await browser.close();
    return;
  } catch (ex) {
    console.log("ERROR ::", ex.message);
    throw new PDEError(ex.message);
  }
};

const toTitleCase = (phrase) => {
  phrase = phrase.replace(/ +/g, " ");
  return phrase
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

module.exports = { engGenarateDocs, telGenarateDocs };
