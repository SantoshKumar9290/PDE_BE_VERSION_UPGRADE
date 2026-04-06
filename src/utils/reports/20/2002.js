// const pdfDoc = require('pdfkit');
// const fs = require('fs');
// const { fontSize } = require('pdfkit');
// const {pdeStyle} = require('../../pdfStyles/engDocs')
// const PDEError = require('../../../errors/customErrorClass');
// const {covanantsData}= require('../../pdfStyles/covanants')
// const Path = require('path');

// const engGenarateDocs = async (data)=>{
//     try{
//         var [dd,m,yyyy] = data.executionDate.split("/");
//     // var dd = String(exDate.getDate()).padStart(2, '0');
//         var mm = new Date(`${yyyy}-${m}-${dd}`).toLocaleDateString('en-US',{month:'long'})
//         pdeStyle.content =[];
//          y = data.eStamp === "N" ? 400 : 550;
//         if(data.status == "DRAFT"){
//             pdeStyle.watermark.text ="DRAFT"
//         }
//         let covenantArr=[];
//         if(data?.covanants){
//             let sNo =1
//             data?.covanants?.covanants.map((covn)=>{
//                 let val = sNo ===1 ? `${sNo}.${covn.value}` : `\n${sNo}.${covn.value}`
//                 covenantArr = [...covenantArr,val];
//                 sNo =sNo+1;
//             })
//         };
//         let [subDesc,disc] = data.documentNature.TRAN_DESC.split("[");
//         let [TRAN_DESC,rest] = data.registrationType.TRAN_DESC ? data.registrationType.TRAN_DESC.split("[") :["",""];
//         pdeStyle.content.push({text:`DEED of ${subDesc}`.toUpperCase(),alignment: 'center',bold:true,decoration:'underline',margin:[10,y,0,0]});
//         pdeStyle.content.push(' ');
//         pdeStyle.content.push({text:`This DEED of ${subDesc.toUpperCase()}is made and executed on ${data.executionDate}, by :`, style:['p1sideHeaders']});
//         let party1Text,party2Text;
//         if(data?.executent && data?.executent.length >0){
//             for(var i=0;i<data.executent.length;i++){
//                 let address =data?.executent[i]?.address.replace(/\n/g, '');
//                 let name = data?.executent[i]?.name ? toTitleCase(data?.executent[i]?.name) :"............";
//                 let relationType = data?.executent[i]?.relationType ? data?.executent[i]?.relationType:"............";
//                 let relationName = data?.executent[i]?.relationName ? toTitleCase(data?.executent[i]?.relationName):"............";
//                 let age = data?.executent[i]?.age ? data?.executent[i]?.age:"............";
//                 if(data?.executent[i].partyType === "Public"){
//                     pdeStyle.content.push({
//                         text:`\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)} in good health and sound and disposing state of mind without any pressure or coercion from anyone.`,style:["p1Text"]
//                     })
//                 }else{
//                     pdeStyle.content.push({
//                         text:`M/s .${name}, ${address} is represented by`,style:["p1Text"]
//                     })
//                 }

//                 if(data.executent[i]?.represent && data.executent[i]?.represent.length >0){
//                     for(let j in data.executent[i]?.represent){
//                         let address =data?.executent[i]?.represent[j]?.address.replace(/\n/g, '');
//                         let name = data?.executent[i]?.represent[j]?.name ? toTitleCase(data?.executent[i]?.represent[j]?.name):"............";
//                         let relationType = data?.executent[i]?.represent[j]?.relationType ? data?.executent[i]?.represent[j]?.relationType:"............";
//                         let relationName = data?.executent[i]?.represent[j]?.relationName ? toTitleCase(data?.executent[i]?.represent[j]?.relationName):"............";
//                         let age = data?.executent[i]?.represent[j]?.age ? data?.executent[i]?.represent[j]?.age:"............";

//                         if(data?.executent[i].partyType === "Public"){
//                             if(j === 0){
//                                 pdeStyle.content.push({
//                                     text:`Represented By :`,style:["p1Text"]
//                                 })
//                             };
//                             pdeStyle.content.push({
//                                 text:`\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}in good health and sound and disposing state of mind without any pressure or coercion from anyone.`,style:["p1Text"]
//                             });
//                         }else{
//                             pdeStyle.content.push({
//                                 text:`\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}in good health and sound and disposing state of mind without any pressure or coercion from anyone.`,style:["p1Text"]
//                             })
//                         }

//                     }
//                 }
//             }

//         }else{
//             pdeStyle.content.push({
//                 text:`\nMr/Mrs. ..............., ......................... , aged about ............ years,Presently residing at ................... in good health and sound and disposing state of mind without any pressure or coercion from anyone.`,style:["p1Text"]
//             });
//         }
//         if(data.covanants?.acquireCovenents && data.covanants?.acquireCovenents.length >0){
//             let aqCovanents=[]
//             //pdeStyle.content.push({text:`How the Property is Aquired :`,style:['p1Text_MR']})
//             let sNo=1;
//             data?.covanants.acquireCovenents.map((aqcv)=>{
//                 let val = sNo ===1 ? `${aqcv.value}` : `\n${aqcv.value}`
//                 aqCovanents = [...aqCovanents,val];
//             })
//             for(let i of aqCovanents){
//                 pdeStyle.content.push({text:`${i}`,style:['p1Text_MR']})
//             }
//         }
//             let sNo =1
//             let cvStaticArry =[];
//             covanantsData.will.map((cv)=>{
//                 if(cv.minDocNum == data.documentNature.TRAN_MIN_CODE){
//                     let val = sNo ===1 ? `${cv.value}` : `\n.${cv.value}`
//                     cvStaticArry = [...cvStaticArry,val];
//                     sNo =sNo+1;
//                 }
//                 if(covenantArr.length > 0){
//                     pdeStyle.content.push({
//                         text : 'Additonal Covanants:',style:["p1last_MRleft"]
//                     })

//                     }
//             });
//             pdeStyle.content.push({text:cvStaticArry,style:["covanants"]});
//             pdeStyle.content.push({text:covenantArr,style:["covanants"]});

//             //PropertyDetails**
//             pdeStyle.content.push({text:'',alignment: 'center',bold:true,decoration:'underline',margin:[10,10,0,5]});

//         pdeStyle.content.push({
//             text:'Having satisfied about the correctness of the contents of this deed, I have executed this deed of cancellation of will in the presence of the following witnesses. ',style:["p1Text"]
//         });
//         pdeStyle.content.push({text:`TESTATOR :`,style:['p1last_MRleft']})
//         if(data?.executent && data?.executent.length >0){
//             for(var i=0;i<data.executent.length;i++){

//                 let name = data?.executent[i]?.name ? toTitleCase(data?.executent[i]?.name) :"............";
//                 if(data?.executent[i].partyType === "Public"){
//                     pdeStyle.content.push({
//                         text:`\nMr/Mrs. ${name}`,style:["p1Text"]
//                     })
//                 }else{
//                     pdeStyle.content.push({
//                         text:`M/s .${name}`,style:["p1Text"]
//                     })
//                 }

//                 if(data.executent[i]?.represent && data.executent[i]?.represent.length >0){
//                     for(let j in data.executent[i]?.represent){
//                         let address =data?.executent[i]?.represent[j]?.address.replace(/\n/g, '');
//                         let name = data?.executent[i]?.represent[j]?.name ? toTitleCase(data?.executent[i]?.represent[j]?.name):"............";
//                         let relationType = data?.executent[i]?.represent[j]?.relationType ? data?.executent[i]?.represent[j]?.relationType:"............";
//                         let relationName = data?.executent[i]?.represent[j]?.relationName ? toTitleCase(data?.executent[i]?.represent[j]?.relationName):"............";
//                         let age = data?.executent[i]?.represent[j]?.age ? data?.executent[i]?.represent[j]?.age:"............";

//                         if(data?.executent[i].partyType === "Public"){
//                             if(j === 0){
//                                 pdeStyle.content.push({
//                                     text:`Represented By :`,style:["p1Text"]
//                                 })
//                             };
//                             pdeStyle.content.push({
//                                 text:`\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}in good health and sound and disposing state of mind without any pressure or coercion from anyone.`,style:["p1Text"]
//                             });
//                         }else{
//                             pdeStyle.content.push({
//                                 text:`\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}in good health and sound and disposing state of mind without any pressure or coercion from anyone.`,style:["p1Text"]
//                             })
//                         }

//                     }
//                 }
//             }
//         }

//         pdeStyle.content.push({text:`WITNESSES :`,style:['p1last_MRleft']})

//         pdeStyle.content.push({text:`1. `+`\n\n2.`,style:['p1Text_MR']})
//         return pdeStyle;

//     }catch(ex){
//         console.log("error ::",ex.message)
// 		throw new PDEError({status:false,message:"Internal Server"});
//     }

// }

// const telGenarateDocs = async(data,path)=>{
//     try{
//         return new Promise( async (resolve, reject) => {
//             let [naturetype ,rest]= data.registrationType.TRAN_DESC.split(" ");
// 			let DocNum = data.documentNature.TRAN_MAJ_CODE;
// 			let [rest2,disc] = data.documentNature.TRAN_DESC.split("[");
// 			let [subDesc,rest3]=disc.split("]");
//             var [dd,m,yyyy] = data.executionDate.split("/");
// 			// var dd = String(exDate.getDate()).padStart(2, '0');
// 			var mm = new Date(`${yyyy}-${m}-${dd}`).toLocaleDateString('en-US',{month:'long'})
// 			let covenantArr=[];
// 			if(data?.covanants){
// 				let sNo =DocNum ==="01" ? 6 : DocNum ==="02"? 8 : DocNum ==="03"? 4: DocNum ==="07" ? 12: DocNum === "05"? 9: DocNum === "06"?  9: DocNum === "04"? 8: DocNum == "09"? 10: 1;
// 				data?.covanants?.covanants.map((covn)=>{
// 					// let val = sNo ===6 || sNo ===8|| sNo ===7 ? `${sNo}. ${covn.value}` : `\n${sNo}. ${covn.value}`
//                     let val = sNo === 1 ? `${sNo}. ${covn.value}` : `\n${sNo}. ${covn.value}`
// 					covenantArr = [...covenantArr,val];
// 					sNo =sNo+1;
// 				})
// 			};
//             let y = data.eStamp === "N" ? 400 : 500;
// 			let pdfDocs = new pdfDoc();
// 			let createFileData;
// 			pdfDocs.pipe(createFileData = fs.createWriteStream(path));
// 			pdfDocs.font(Path.join(__dirname,'../../../../fonts','telugu.ttf'));
//             pdfDocs.fontSize('18').text(`${subDesc}`,40,y,{align:'center',underline:true});
//             //pdfDocs.fontSize('13').text(`రూ ${data.amount} రూపాయలు విలువగల స్థిరాస్తి ${subDesc}.`,{align:'center'});
//             pdfDocs.fontSize('13').text(`ఈ వీలునామా రద్దు పత్రం   ${yyyy} వ సంవత్సరం ${mm} నెల ${dd} వతేదీన వ్రాయబడింది.`,{align:'center'});
//             pdfDocs.fontSize('13').text(`వ్రాయించి ఇచ్చినవారు `,{align:'left',underline:true});
//             if(data.executent && data.executent.length >0){
//                 for(let i of data.executent){
//                     let add = i.address.split("\n").join("")
//                     add= add.split(" ").join("");
//                 pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. ${toTitleCase(i.name)}, ${i.relationType}.${toTitleCase(i.relationName)}, వయస్సు ${i.age} సంవత్సరాలు, ప్రస్తుతం ${toTitleCase(add)} లో నివాసము`,{align:'justify',lineGap:0});
//                 pdfDocs.moveDown();
//                 }
//                 pdfDocs.fontSize('13').text(`నేను స్వస్ధ చిత్తముతోను, నిండు మనస్సుతోను, పూర్తి ఆరోగ్యం కలిగి సంపూర్ణ వ్యవహారిక జ్ఞానంతోను హాజరు భోగాపురంలో వ్రాయించియిచ్చిన వీలునామా రద్దు.`,{align:'left',lineGap:0})
//                 // pdfDocs.fontSize('13').text(`నాకు సుమారు ${i.age} సం..లు వయస్సు కలదు జీవితము అశాశ్వతము అనియు మరియు ఎప్పుడు ఎట్లుండునో అని, నా తదనంతరం నాఆస్తిని గూర్చి ఎవ్వరూ ఎట్టి తగవులు పడకుండ ఉండగలందులకు గానూ నాఆస్ధిని గురించి జరగవలసిన ఏర్పాట్లకు ఇప్పుడే మనస్పూర్తిగా నిర్ణయించి యీవీలునామా నాసమ్మతితో   వ్రాయించడమైనది.`,{align:'left',lineGap:0})
//             }else{
//                 pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. .......,S/O. .........,వయస్సు ........ సంవత్సరాలు,ప్రస్తుతం......... లో నివాసము`,{align:'justify',lineGap:0});
//                 pdfDocs.moveDown();
//             }
//             if(data.covanants?.acquireCovenents && data.covanants?.acquireCovenents.length >0){
//                 let aqCovanents=[]
//                // pdfDocs.fontSize('13').text('How the Property is Aquired',{align:'justify'})
//                 let sNo=1;
//                 data?.covanants.acquireCovenents.map((aqcv)=>{
//                     let val = sNo ===1 ? ` ${aqcv.value}` : `\n${sNo}. ${aqcv.value}`
// 					aqCovanents = [...aqCovanents,val];

//                 })
//                 for(let i of aqCovanents){
//                     pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
//                 }
//             }
//             pdfDocs.fontSize('13').text(``,{align:'left',lineGap:0})
//             if(covenantArr && covenantArr.length >0){
//                 for(let i of covenantArr){
//                     pdfDocs.fontSize('13').text(`Additional Covanants`,{align:'justify',lineGap:1,fontWeight:900,underline:true});
//                 }
//             }
//             if(covenantArr && covenantArr.length >0){
//                 for(let i of covenantArr){
//                     pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
//                 }
//             }
//             // pdfDocs.fontSize('13').text(`షెడ్యూల్ ఆస్తి అసైన్ మెంటు భూమి గాని,  ప్రభుత్వం వారి భూమి గాని, ఎండోమెంట్ బోర్డు వారికి గాని, వక్ఫ్ బోర్డు వారికి గాని సంబందము లేనటువంటి నిర్వివాద నిష్పేచ్చి ఆస్తి అయివున్నది. మరియు సదరుభూమిలో మామిడి,కొబ్బరి,జీడి,తమలపాకు తోటలుగానీ లేవు. ఒక వేళ అట్టి వాస్తవములు ఈ దస్తావేజు ద్వారా మున్ముందు వెలువడిన యెడల స్టాంపు ఆక్ట్ సెక్షన్  27 , 64 ప్రకారము చటరీత్యా మీరు జరుపుయావత్తు చర్యలకు భాధ్యత వహించగలవారము .`,{align:'left',lineGap:0})
//             pdfDocs.moveDown();
//             //pdfDocs.fontSize('15').text(`డిక్లరేషన్`,{align:'center',underline:true})
//             pdfDocs.fontSize('13').text(`ఇది నా పూర్తి సమ్మతిన వ్రాయించిన వీలునామా రద్దు పత్రము. ఈ వీలునామా రద్దు పత్రమును లేఖరి చదవగా విన్నాను. సరిగ్గా యున్నoదున . క్రింది సాక్షుల ఎదుట సంతకములు చేయడమైనది.`,{align:'left',lineGap:0})
//             //property
//             pdfDocs.fontSize('13').text(`వీలునామా వ్రాసినవారు.`,{align:'center',lineGap:0});
//            // pdfDocs.fontSize('13').text(`యిందుకు సాక్షులు`,{align:'left',lineGap:0});
//         //    for(let i of data.claimant){
//         //     pdfDocs.fontSize('13').text(`${i+1} వ పార్టీ : ${toTitleCase(i.name)}`,{align:'left',lineGap:0});
//         //    }

//         if(data?.executent && data?.executent.length >0){
//             let exNo =1
//             for(let i of data.executent){
//                 let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0,8),"XXXX XXXX XXXX ") : "xxxx xxxx xxxx";
//                 //let panOrTanOrForm60Header = i.panNoOrForm60or61 ? "PAN/Form60" :i.panNoOrForm60or61 ==="" && i.tan ==="" ? "PAN/Form60" :"TAN";
//                 //let panOrTanOrForm60Value = i.panNoOrForm60or61 ? i.panNoOrForm60or61 : i.tan;

//                 pdfDocs.fontSize('12').text(`${exNo}`,{align:'left'});

//                 pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: ${toTitleCase(i.name)}`+'\n'+`ఆధార్ నెంబర్ : ${aadhar}`,{align:'left'});
//                 exNo = exNo+1;

//             }

//         }else{
//             pdfDocs.fontSize('13').text(`1. వ పార్టీ : .....................`,{align:'left',lineGap:0});
//             pdfDocs.moveDown();
//         }
// 			pdfDocs.fontSize('13').text(`\n\n\nయిందుకు సాక్షులు`,{align:'left',lineGap:0});
// 			pdfDocs.fontSize('13').text(`1.                                                         `,{align:'left',lineGap:0});
// 			pdfDocs.fontSize('13').text(`2.                                                         `,{align:'left',lineGap:0});
//             pdfDocs.end();
//             createFileData.on('finish', resolve);

//         })

//     }catch(ex){
//         console.log("ERROR ::",ex.message);
// 		throw new PDEError(ex.message);
//     }

// }
// const toTitleCase = (phrase) => {
// 	phrase = phrase.replace( / +/g, ' ');
// 	return phrase
// 	  .toLowerCase()
// 	  .split(' ')
// 	  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
// 	  .join(' ');
//   };

// module.exports ={engGenarateDocs,telGenarateDocs};

const pdfDoc = require("pdfkit");
const fs = require("fs");
const { fontSize } = require("pdfkit");
const { pdeStyle } = require("../../pdfStyles/engDocs");
const PDEError = require("../../../errors/customErrorClass");
const { covanantsData } = require("../../pdfStyles/covanants");
const Path = require("path");
const puppeteer = require("puppeteer");
const hbs = require("handlebars");

let STATIC_COVNENTS_COUNT = 0;

const engGenarateDocs = async (data, path) => {
  try {
    STATIC_COVNENTS_COUNT = 0;
    let englishHtmlFilePath = Path.join(
      __dirname,
      `../htmlFiles/20/02/english.hbs`
    );
    return await genarateDocsUsingHtml(data, path, englishHtmlFilePath);
  } catch (ex) {
    console.log("ERROR ::", ex.message);
    throw new PDEError(ex.message);
  }
};

const telGenarateDocs = async (data, path) => {
  try {
    let teluguHtmlFilePath = Path.join(
      __dirname,
      `../htmlFiles/20/02/telugu.hbs`
    );
    return await genarateDocsUsingHtml(data, path, teluguHtmlFilePath);
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
    // data.property?.map(propertyDetails => {
    //     propertyDetails.serialNo = propCount;
    //     propCount = propCount + 1;
    //     totalMarketValue = totalMarketValue + propertyDetails.marketValue;
    //     propertyDetails.showLinkedData = [];
    //     if(propertyDetails.LinkedDocDetails != null && propertyDetails.LinkedDocDetails.length > 0){
    //         propertyDetails.showLinkedData = [1]
    //     }
    //     propertyDetails.isRural = [];
    //     propertyDetails.isUrbanProperty = [];
    //     propertyDetails.isUrbanApartmentSingleWithCellar = [];
    //     propertyDetails.isUrbanApartmentMultipleWithCellar = [];
    //     propertyDetails.isUrbanApartmentSingleWithoutCellar = [];
    //     propertyDetails.isUrbanApartmentMultipleWithoutCellar = [];
    //     propertyDetails.isUrbanHouseSingleWithCellar = [];
    //     propertyDetails.isUrbanHouseMultipleWithCellar = [];
    //     propertyDetails.isUrbanHouseSingleWithoutCellar = [];
    //     propertyDetails.isUrbanHouseMultipleWithoutCellar = [];
    //     propertyDetails.isUrbanSite = [];
    //     let propertyType = "";
    //     propertyDetails.propertyType.includes('RURAL') ? propertyType = 'RURAL' : propertyType = 'URBAN';
    //     if(propertyType == 'RURAL'){
    //         propertyDetails.isRural.push(1);
    //     }
    //     else {

    //         let [scProp,rest] = propertyDetails.schedulePropertyType.split('[');
    //         if(scProp == "FLAT "){
    //             propertyDetails.isUrbanSite.push(1);
    //             propertyDetails.isUrbanProperty.push(1);
    //             let floorPlinth = 0;
    //             let cellarPlinth = 0;
    //             let isCellar = false;
    //             let newStructureDetails = [];
    //             console.log("TOTAL STRUCTURE DETAILS", JSON.stringify(propertyDetails.structure))
    //             if(propertyDetails.structure != null && propertyDetails.structure.length > 0){
    //                 for(index in propertyDetails.structure){
    //                     if(propertyDetails.structure[index]["floorNo"] == "Cellar"){
    //                         cellarPlinth = propertyDetails.structure[index]["plinth"];
    //                         isCellar = true;
    //                     } else {
    //                         newStructureDetails.push(JSON.parse(JSON.stringify(propertyDetails.structure[index])));
    //                         floorPlinth = floorPlinth + propertyDetails.structure[index]["plinth"]
    //                     }
    //                 }
    //             }
    //             if(newStructureDetails.length > 1){
    //                 isCellar ? propertyDetails.isUrbanApartmentMultipleWithCellar.push(1) : propertyDetails.isUrbanApartmentMultipleWithoutCellar.push(1)
    //             } else {
    //                 isCellar ? propertyDetails.isUrbanApartmentSingleWithCellar.push(1) : propertyDetails.isUrbanApartmentSingleWithoutCellar.push(1);
    //             }
    //             propertyDetails.newStructureDetails = newStructureDetails;
    //             propertyDetails.floorPlinth = floorPlinth;
    //             propertyDetails.cellarPlinth = cellarPlinth;
    //         } else if(scProp == "HOUSE "){
    //             propertyDetails.isUrbanProperty.push(1);
    //             let floorPlinth = 0;
    //             let cellarPlinth = 0;
    //             let isCellar = false;
    //             let newStructureDetails = [];
    //             console.log("TOTAL STRUCTURE DETAILS", JSON.stringify(propertyDetails.structure))
    //             if(propertyDetails.structure != null && propertyDetails.structure.length > 0){
    //                 for(index in propertyDetails.structure){
    //                     if(propertyDetails.structure[index]["floorNo"] == "Cellar"){
    //                         cellarPlinth = propertyDetails.structure[index]["plinth"];
    //                         isCellar = true;
    //                     } else {
    //                         newStructureDetails.push(JSON.parse(JSON.stringify(propertyDetails.structure[index])));
    //                         floorPlinth = floorPlinth + propertyDetails.structure[index]["plinth"]
    //                     }
    //                 }
    //             }
    //             if(newStructureDetails.length > 1){
    //                 isCellar ? propertyDetails.isUrbanHouseMultipleWithCellar.push(1) : propertyDetails.isUrbanHouseMultipleWithoutCellar.push(1)
    //             } else {
    //                 isCellar ? propertyDetails.isUrbanHouseSingleWithCellar.push(1) : propertyDetails.isUrbanHouseSingleWithoutCellar.push(1);
    //                 newStructureDetails = newStructureDetails[0];
    //             }
    //             propertyDetails.newStructureDetails = newStructureDetails;
    //             propertyDetails.floorPlinth = floorPlinth;
    //             propertyDetails.cellarPlinth = cellarPlinth;
    //         }
    //     }

    //     let linkedCount = 1;
    //     propertyDetails.LinkedDocDetails?.map(linkedDocument => {
    //         linkedDocument.sroOfficeName = linkedDocument.sroOffice;
    //         linkedDocument.sNo = linkedCount;
    //         linkedDocument.registeredYear = linkedDocument.regYear;
    //         linkedDocument.bookNumber = linkedDocument.bookNo;
    //         linkedDocument.linkDocuNo = linkedDocument.linkDocNo;
    //         linkedCount = linkedCount + 1;
    //     })

    //     totalExtent = parseFloat(propertyDetails.tExtent);
    //     propertyDetails.acres = parseInt(totalExtent/1);
    //     propertyDetails.cents = (totalExtent * 100) % 100;
    //     propertyDetails.calculatedValue = ((propertyDetails.marketValue)/(totalExtent)).toFixed(2);

    // })

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

// function NumToWord(amount) {
//     var str = new String(amount)
//     var splt = str.split("");
//     var rev = splt.reverse();
//     var once = ['Zero', ' One', ' Two', ' Three', ' Four', ' Five', ' Six', ' Seven', ' Eight', ' Nine'];
//     var twos = ['Ten', ' Eleven', ' Twelve', ' Thirteen', ' Fourteen', ' Fifteen', ' Sixteen', ' Seventeen', ' Eighteen', ' Nineteen'];
//     var tens = ['', 'Ten', ' Twenty', ' Thirty', ' Forty', ' Fifty', ' Sixty', ' Seventy', ' Eighty', ' Ninety'];

//     numLength = rev.length;
//     var word = new Array();
//     var j = 0;

//     for (i = 0; i < numLength; i++) {
//         switch (i) {

//             case 0:
//                 if ((rev[i] == 0) || (rev[i + 1] == 1)) {
//                     word[j] = '';
//                 }
//                 else {
//                     word[j] = '' + once[rev[i]];
//                 }
//                 word[j] = word[j];
//                 break;

//             case 1:
//                 aboveTens();
//                 break;

//             case 2:
//                 if (rev[i] == 0) {
//                     word[j] = '';
//                 }
//                 else if ((rev[i - 1] == 0) || (rev[i - 2] == 0)) {
//                     word[j] = once[rev[i]] + " Hundred ";
//                 }
//                 else {
//                     word[j] = once[rev[i]] + " Hundred and";
//                 }
//                 break;

//             case 3:
//                 if (rev[i] == 0 || rev[i + 1] == 1) {
//                     word[j] = '';
//                 }
//                 else {
//                     word[j] = once[rev[i]];
//                 }
//                 if ((rev[i + 1] != 0) || (rev[i] > 0)) {
//                     word[j] = word[j] + " Thousand";
//                 }
//                 break;

//             case 4:
//                 aboveTens();
//                 break;

//             case 5:
//                 if ((rev[i] == 0) || (rev[i + 1] == 1)) {
//                     word[j] = '';
//                 }
//                 else {
//                     word[j] = once[rev[i]];
//                 }
//                 if (rev[i + 1] !== '0' || rev[i] > '0') {
//                     word[j] = word[j] + " Lakh";
//                 }

//                 break;

//             case 6:
//                 aboveTens();
//                 break;

//             case 7:
//                 if ((rev[i] == 0) || (rev[i + 1] == 1)) {
//                     word[j] = '';
//                 }
//                 else {
//                     word[j] = once[rev[i]];
//                 }
//                 if (rev[i + 1] !== '0' || rev[i] > '0') {
//                     word[j] = word[j] + " Crore";
//                 }
//                 break;

//             case 8:
//                 aboveTens();
//                 break;

//             default: break;
//         }
//         j++;
//     }

//     function aboveTens() {
//         if (rev[i] == 0) { word[j] = ''; }
//         else if (rev[i] == 1) { word[j] = twos[rev[i - 1]]; }
//         else { word[j] = tens[rev[i]]; }
//     }

//     word.reverse();
//     var finalOutput = '';
//     for (i = 0; i < numLength; i++) {
//         finalOutput = finalOutput + word[i];
//     }
// 	return finalOutput;
// }

module.exports = { engGenarateDocs, telGenarateDocs };
