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
    STATIC_COVNENTS_COUNT = 0;
    let englishHtmlFilePath = Path.join(
      __dirname,
      `../htmlFiles/05/04/english.hbs`
    );
    return await genarateDocsUsingHtml(data, path, englishHtmlFilePath);

    //     var [dd,m,yyyy] = data.executionDate.split("/");
    // // var dd = String(exDate.getDate()).padStart(2, '0');
    //     var mm = new Date(`${yyyy}-${m}-${dd}`).toLocaleDateString('en-US',{month:'long'})
    //     pdeStyle.content =[];
    //      y = data.eStamp === "N" ? 400 : 550;
    //     if(data.status == "DRAFT"){
    //         pdeStyle.watermark.text ="DRAFT"
    //     }
    //     let covenantArr=[];
    //     if(data?.covanants){
    //         let sNo =9
    //         data?.covanants?.covanants.map((covn)=>{
    //             let val = sNo ===9 ? `${sNo}.${covn.value}` : `\n${sNo}.${covn.value}`
    //             covenantArr = [...covenantArr,val];
    //             sNo =sNo+1;
    //         })
    //     };
    //     let [subDesc,disc] = data.documentNature.TRAN_DESC.split("[");
    //     let [TRAN_DESC,rest] = data.registrationType.TRAN_DESC ? data.registrationType.TRAN_DESC.split("[") :["",""];
    //     pdeStyle.content.push({text:`${subDesc}`.toUpperCase(),alignment: 'center',bold:true,decoration:'underline',margin:[10,y,0,0]});
    //     pdeStyle.content.push(' ');
    //     pdeStyle.content.push({text:`This ${subDesc.toUpperCase()} is made and executed on this ${dd} - ${mm} - ${yyyy}, by :`, style:['p1sideHeaders']});
    //     let party1Text,party2Text;
    //     if(data?.executent && data?.executent.length >0){
    //         for(var i=0;i<data.executent.length;i++){
    //             let address =data?.executent[i]?.address.replace(/\n/g, '');
    //             let name = data?.executent[i]?.name ? toTitleCase(data?.executent[i]?.name) :"............";
    //             let relationType = data?.executent[i]?.relationType ? data?.executent[i]?.relationType:"............";
    //             let relationName = data?.executent[i]?.relationName ? toTitleCase(data?.executent[i]?.relationName):"............";
    //             let age = data?.executent[i]?.age ? data?.executent[i]?.age:"............";
    //             if(data?.executent[i].partyType === "Public"){
    //                 pdeStyle.content.push({
    //                     text:`\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`,style:["p1Text"]
    //                 })
    //                 pdeStyle.content.push({ text: `(Hereinafter be referred to as ‘the RELEASOR’, which expression shall, unless repugnant to the context, mean and includes his heirs, assigns, executors and administrators).`, style: ['p1Text_MR'] })
    //             }else{
    //                 pdeStyle.content.push({
    //                     text:`M/s .${name}, ${address} is represented by`,style:["p1Text"]
    //                 })
    //             }

    //             if(data.executent[i]?.represent && data.executent[i]?.represent.length >0){
    //                 for(let j in data.executent[i]?.represent){
    //                     let address =data?.executent[i]?.represent[j]?.address.replace(/\n/g, '');
    //                     let name = data?.executent[i]?.represent[j]?.name ? toTitleCase(data?.executent[i]?.represent[j]?.name):"............";
    //                     let relationType = data?.executent[i]?.represent[j]?.relationType ? data?.executent[i]?.represent[j]?.relationType:"............";
    //                     let relationName = data?.executent[i]?.represent[j]?.relationName ? toTitleCase(data?.executent[i]?.represent[j]?.relationName):"............";
    //                     let age = data?.executent[i]?.represent[j]?.age ? data?.executent[i]?.represent[j]?.age:"............";

    //                     if(data?.executent[i].partyType === "Public"){
    //                         if(j === 0){
    //                             pdeStyle.content.push({
    //                                 text:`Represented By :`,style:["p1Text"]
    //                             })
    //                         };
    //                         pdeStyle.content.push({
    //                             text:`\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`,style:["p1Text"]
    //                         });

    //                     }else{
    //                         pdeStyle.content.push({
    //                             text:`\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`,style:["p1Text"]
    //                         })

    //                     }

    //                 }
    //             }
    //         }
    //     }else{
    //         pdeStyle.content.push({
    //             text:`\nMr/Mrs. ..............., ......................... , aged about ............ years,Presently residing at ...................`,style:["p1Text"]
    //         });
    //         pdeStyle.content.push({ text: `(Hereinafter be referred to as ‘the RELEASOR’, which expression shall, unless repugnant to the context, mean and includes his heirs, assigns, executors and administrators).`, style: ['p1Text_MR'] })
    //     }
    //     pdeStyle.content.push({text:'AND',alignment: 'center',bold:true,decoration:'underline',margin:[10,10,0,0]});
    //     if(data?.claimant && data?.claimant.length >0){
    //         for(var i=0;i<data.claimant.length;i++){
    //             let address =data?.claimant[i]?.address.replace(/\n/g, '');
    //             let name = data?.claimant[i]?.name ? toTitleCase(data?.claimant[i]?.name):"............";
    //             let relationType = data?.claimant[i]?.relationType ? data?.claimant[i]?.relationType:"............";
    //             let relationName = data?.claimant[i]?.relationName ? toTitleCase(data?.claimant[i]?.relationName):"............";
    //             let age = data?.claimant[i]?.age ? data?.claimant[i]?.age:"............";
    //             if(data?.claimant[i].partyType === "Public"){
    //                 pdeStyle.content.push({
    //                     text:`\nMr/Mrs. ${name}, ${relationType} ${relationName} , aged about ${age}  years, Presently residing at ${toTitleCase(address)}`,style:["p1Text"]
    //                 });
    //                 pdeStyle.content.push({ text: `(Hereinafter be referred to as ‘the RELEASEE’, which expression shall, unless repugnant to the context, mean and includes his heirs, assigns, executors and administrators).`, style: ['p1Text_MR'] })
    //             }else{
    //                 pdeStyle.content.push({
    //                     text:`M/s .${name}, ${address} is represented by`,style:["p1Text"]
    //                 })
    //                 pdeStyle.content.push({ text: `(Hereinafter be referred to as ‘the RELEASEE’, which expression shall, unless repugnant to the context, mean and includes his heirs, assigns, executors and administrators).`, style: ['p1Text_MR'] })
    //             }

    //             if(data.claimant[i]?.represent && data.claimant[i]?.represent.length >0){
    //                 for(let j in data.claimant[i]?.represent){
    //                     let address =data?.claimant[i]?.represent[j]?.address.replace(/\n/g, '');
    //                     let name = data?.claimant[i]?.represent[j]?.name ? toTitleCase(data?.claimant[i]?.represent[j]?.name):"............";
    //                     let relationType = data?.claimant[i]?.represent[j]?.relationType ? data?.claimant[i]?.represent[j]?.relationType:"............";
    //                     let relationName = data?.claimant[i]?.represent[j]?.relationName ?toTitleCase( data?.claimant[i]?.represent[j]?.relationName):"............";
    //                     let age = data?.claimant[i]?.represent[j]?.age ? data?.claimant[i]?.represent[j]?.age:"............";

    //                     if(data?.claimant[i].partyType === "Public"){
    //                         pdeStyle.content.push({
    //                             text:`Represented By :`,style:["p1Text"]
    //                         })
    //                         pdeStyle.content.push({
    //                             text:`\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`,style:["p1Text"]
    //                         })
    //                         pdeStyle.content.push({ text: `(Hereinafter be referred to as ‘the RELEASEE’, which expression shall, unless repugnant to the context, mean and includes his heirs, assigns, executors and administrators).`, style: ['p1Text_MR'] })
    //                     }else{
    //                         pdeStyle.content.push({
    //                             text:`\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`,style:["p1Text"]
    //                         })
    //                         pdeStyle.content.push({ text: `(Hereinafter be referred to as ‘the RELEASEE’, which expression shall, unless repugnant to the context, mean and includes his heirs, assigns, executors and administrators).`, style: ['p1Text_MR'] })
    //                     }
    //                 }
    //             }
    //         }
    //         // pdeStyle.content.push({text: `Herein after called the '${partyType2}' of the second part`,style:["p1Points"]});
    //     }else{
    //         pdeStyle.content.push({
    //             text:`\nMr/Mrs. ................, ......................... , aged about ............ years,Presently residing at ....................`,style:["p1Text"]
    //         });
    //         pdeStyle.content.push({ text: `(Hereinafter be referred to as ‘the RELEASEE’, which expression shall, unless repugnant to the context, mean and includes his heirs, assigns, executors and administrators).`, style: ['p1Text_MR'] })
    //     }

    //     if(data.covanants?.acquireCovenents && data.covanants?.acquireCovenents.length >0){
    //         let aqCovanents=[]
    //         // pdeStyle.content.push({text:`How the Property is Aquired :`,style:['p1Text_MR']})
    //         let sNo=1;
    //         data?.covanants.acquireCovenents.map((aqcv)=>{
    //             let val = sNo ===1 ? `\n${aqcv.value}` : `\n ${aqcv.value}`
    //             aqCovanents = [...aqCovanents,val];
    //         })
    //         for(let i of aqCovanents){
    //             pdeStyle.content.push({text:`${i}`,style:['p1Text_MR']})
    //         }
    //     }

    //     pdeStyle.content.push({
    //         text:`Whereas, the releasee has completely repaid the loan amount with interest and other expenses and requested the releasor to execute reconveyance deed. As there is no due from the release in respect of the aforementioned mortgage deed, this reconveyance deed is executed stating that the charge on the schedule mentioned property is cleared.`,style:["p1Text"]
    //     });
    //     // pdeStyle.content.push({
    //     //     text:`Whereas the schedule mentioned properties have been acquired by the parties through a ____________ deed registered in their favour as No.________ /_______ at SRO __________ . Since then the above parties are in peaceful possession and enjoyment of all the properties.`,style:["p1Text"]
    //     // });
    //     // pdeStyle.content.push({
    //     //     text:`WHEREAS, as it was not possible to jointly enjoy the schedule mentioned properties, the above parties have decided to divide the schedule mentioned properties among themselves. They have discussed, agreed and mutually decided to effect partition of the said properties between them in the manner hereinafter described in the presence of their elders and well wishers. `,style:["p1Text"]
    //     // });
    //     if(TRAN_DESC){
    //         // if(data?.property && data.property.length >0){
    //         //     for(let i in data?.property){
    //         //         let [landUse,rest] = data.property[i].landUse ? data.property[i].landUse.split("[") :["............",""];
    //         //         let [acr,cent] = data?.property[i]?.tExtent ? data.property[i].tExtent.split("."):["............","............"];
    //         //         if(cent == undefined){
    //         //             cent ="00"
    //         //         }
    //         //         let linkedText ;
    //         //         if(data?.property[i]?.LinkedDocDetails && data?.property[i]?.LinkedDocDetails?.length > 0){
    //         //             for(let j in data?.property[i]?.LinkedDocDetails){
    //         //                 let linkDocNo = data.property[i].LinkedDocDetails[j].linkDocNo ? data.property[i].LinkedDocDetails[j].linkDocNo : "............"
    //         //                 let year = data.property[i].LinkedDocDetails[j].regYear ? data.property[i].LinkedDocDetails[j].regYear : "............"
    //         //                 let bookNo = data.property[i].LinkedDocDetails[j].bookNo ? data.property[i].LinkedDocDetails[j].bookNo : "............"
    //         //                 linkedText =`virtue of registered document bearing the number ${linkDocNo} of ${year} of book ${bookNo}`
    //         //             }
    //         //         }else{
    //         //             linkedText = `inheritance`
    //         //         }
    //         //         let propType = data.property[i].propertyType.includes('RURAL') ? 'RURAL':'URBAN';
    // 		// 				let msA = propType ==='URBAN'?"Sq.Yards":'Acres';
    // 		// 				let msB = propType ==='URBAN'?"":'Cents';
    // 		// 				cent = propType ==='URBAN'?"":cent;
    //         //         let surveyNo = data.property[i].survayNo ? data.property[i].survayNo :"............";
    //         //         let habitation = data.property[i].habitation ? data.property[i].habitation :"............";
    //         //         let mandal = data.property[i].mandal ? data.property[i].mandal :"............";
    //         //         let district = data.property[i].district ? data.property[i].district :"............";
    //         //         pdeStyle.content.push({text:`Whereas the Parties herein is the absolute owner and possessor of ${toTitleCase(landUse)}  measuring ${acr} ${msA} ${cent} ${msB} forming part of Survey No ${surveyNo} situated at ${toTitleCase(habitation)} of ${toTitleCase(mandal)} Mandal, ${toTitleCase(district)} District , Whereas Parties has acquired the schedule property by ${linkedText} since then the parties is in possession and enjoyment of thesaid site with full and absolute rights free from all encumbrances.`,style:["p3Text1_main1"]})

    //         //     }
    //         // }
    //         let sNo =1
    //         let cvStaticArry =[];
    //         covanantsData.release.map((cv)=>{
    //             if(cv.minDocNum == data.documentNature.TRAN_MIN_CODE){
    //                 let val = sNo ===1 ? `${sNo}.${cv.value}` : `\n${sNo}.${cv.value}`
    //                 cvStaticArry = [...cvStaticArry,val];
    //                 sNo =sNo+1;
    //             }

    //         });
    //         pdeStyle.content.push({text:cvStaticArry,style:["covanants"]});
    //         pdeStyle.content.push({text:covenantArr,style:["covanants"]});

    //         //PropertyDetails**
    //         pdeStyle.content.push({text:'SCHEDULE OF PROPERTY',alignment: 'center',bold:true,decoration:'underline',margin:[10,10,0,5]});
    //         if(data.property && data.property.length >0){
    //             let propLangth = data.property.length;
    //             let tMValue=0;
    //             let dataI =0;

    //             for(var i=0;i<data.property.length;i++) {
    //                 dataI = dataI ===0 ? 1 : dataI + 1;
    //                 tMValue = tMValue + data.property[i].marketValue;
    //                     let [landUse,rest] = data.property[i].landUse.split("[");
    //                     let propType = data.property[i].propertyType.includes('RURAL') ? 'RURAL':'URBAN';
    //                     pdeStyle.content.push({text: [{text:`Schedule ${data.property[i].seqNumber}:`, style: ['f18']},{text:` ${landUse}`,fontSize:'12'}] });

    //                     pdeStyle.content.push({text:'Location of the Property',style:['sideHeaderNames']});
    //                     pdeStyle.content.push({ table:{
    //                         widths:[120,120,120,120],
    //                         body:[
    //                             [{text: 'Registration District', alignment: 'center',bold:true,width:'*', margin:[10,1,27,0]}, {text: 'Sub Registrar Office', bold:true, alignment: 'center',width:'*', margin:[10,1,27,0]}, {text: 'Village', bold:true, alignment: 'center',width:'*', margin:[20,1,27,0]},{text: 'Mandal', bold:true, alignment: 'center',width:'*', margin:[20,1,27,0]}],
    //                             [{text:`${toTitleCase(data?.property[i].district)}`,alignment:'center'}, {text:`${toTitleCase(data?.property[i].sroOffice)}`,alignment:'center'}, {text:`${toTitleCase(data?.property[i]?.village)}`,alignment:'center'}, {text: `${toTitleCase(data?.property[i]?.village)}`, alignment:'center'}]
    //                         ]
    //                     }});
    //                     pdeStyle.content.push(' ');
    //                     pdeStyle.content.push({ table:{
    //                         widths:[250,249],
    //                         body:[
    //                             [{text: 'Revenue District', alignment: 'center',bold:true }, {text: 'Local Body', bold:true, alignment: 'center', }],
    //                             [{text:`${toTitleCase(data?.property[i]?.district)}`,alignment:'center'}, {text:`${toTitleCase(data?.property[i]?.sroOffice)}`,alignment:'center'}]
    //                         ]
    //                     }});
    //                     pdeStyle.content.push({text:'Land Details',style:['sideHeaderNames']});
    //                     const locality = data?.property[i].locality !=""  ? toTitleCase(data?.property[i].locality) : toTitleCase(data?.property[i].habitation);
    //                     if(propType === "URBAN"){
    //                         pdeStyle.content.push({ table:{
    //                             widths:[90,30,35,40,50,50,70,80],
    //                             body:[
    //                                 [{text: 'Locality/Habitation', alignment: 'center',bold:true },
    //                                 {text: 'Ward', bold:true, alignment: 'center'},
    //                                 {text: 'Block', bold:true, alignment: 'center'},
    //                                 {text: 'Door\nNo', bold:true, alignment: 'center'},
    //                                 {text: 'Survey/\nTSurvey Number', bold:true, alignment: 'center'},
    //                                 {text: 'Total Extent\n(Sq.Yards)', alignment: 'center',bold:true},
    //                                 {text: 'Undivided \nShare(Sq.Yards)', alignment: 'center',bold:true},
    //                                 {text: 'Market value', alignment: 'center',bold:true}],
    //                                 [
    //                                     {text:`${toTitleCase(locality)}`,alignment:'center'},
    //                                     {text:`${data?.property[i].ward}`,alignment:'center'},
    //                                     {text:`${data?.property[i].block}`,alignment:'center'},
    //                                     {text: `${data?.property[i].doorNo}`, alignment:'center'},
    //                                     {text: `${data?.property[i].survayNo}`, alignment:'center'},
    //                                     {text: `${data?.property[i].extent}`, alignment:'center'}, //totalext
    //                                     {text: `${data?.property[i].undividedShare}`, alignment:'center'},
    //                                     {text:`${data?.property[i].marketValue}`, alignment:'center'}
    //                                 ]
    //                             ]

    //                         }});
    //                         pdeStyle.content.push({columns:[
    //                             {text:'Structure Details',style:['sideHeaderNames']},
    //                             {text:`Apartment Name :  ${data?.property[i].appartmentName.toUpperCase()}`,style:['sideHeaderNames']},
    //                             {text:`No of Floors : ${data?.property[i].totalFloors}`,style:['sideHeaderNamesright']}
    //                         ]
    //                         });
    //                         if(data?.property[i]?.structure?.length > 0){
    //                             for(var j=0;j<data?.property[i]?.structure.length;j++){
    //                                 let [strType,rest] = data?.property[i]?.structure[j].structureType.split("[");
    //                                 let [stage,rest2] = data?.property[i]?.structure[j].stageOfCons.split("[");
    //                                 pdeStyle.content.push({
    //                                     table:{
    //                                         body:[
    //                                             [
    //                                                 {text: 'Floor No', alignment: 'center',bold:true,width:'*', margin:[10,1,25,0]}, {text: 'Structure type', bold:true, alignment: 'center',width:'*', margin:[0,0,25,0]},{text: 'Plinth(sq feets) ', bold:true, alignment: 'center',width:'*', margin:[0,0,27,0]},{text: 'Stage of Cons.', bold:true, alignment: 'center',width:'*', margin:[0,0,25,0]},{text: 'Age', bold:true, alignment: 'center',width:'*', margin:[0,0,30,0]}],

    //                                             [
    //                                                 {text:`${data?.property[i]?.structure[j].floorNo}`,alignment:'center'},{text:`${strType}`,alignment:'center'}, {text:`${data?.property[i]?.structure[j].plinth}`,alignment:'center'},{text: `${stage}`, alignment:'center'},{text: `${data?.property[i]?.structure[j].age}`, alignment:'center'}
    //                                             ]
    //                                         ]
    //                                     }
    //                                 })
    //                             }

    //                         }
    //                         let [scProp,rest] = data?.property[i].schedulePropertyType.split('[');
    //                         scProp= scProp.trim();
    //                         if(scProp === 'FLAT'){
    //                             pdeStyle.content.push({text:'Flat Boundary Details',style:['sideHeaderNames']});
    //                             pdeStyle.content.push({table:{
    //                                 widths:[208,290],
    //                                 body:[
    //                                     [{text: 'East', alignment: 'left',width:'*', margin:[10,0,165,0]}, {text: `${toTitleCase(data?.property[i]?.flatEastBoundry.slice(0,20))}`,  alignment: 'left', margin:[10,0,200,0]}],
    //                                     [{text: 'West', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.flatWestBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
    //                                     [{text: 'North', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.flatNorthBoundry)}`, alignment: 'left', margin:[10,0,100,0]}],
    //                                     [{text: 'South', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.flatSouthBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
    //                                 ]
    //                             }});
    //                         };

    //                         if(propLangth === dataI){
    //                             pdeStyle.content.push({text:'Apartment Boundary Details',style:['sideHeaderNames']});
    //                             pdeStyle.content.push({table:{
    //                                 widths:[208,290],
    //                                 body:[
    //                                     [{text: 'East', alignment: 'left',width:'*', margin:[10,0,165,0]}, {text: `${toTitleCase(data?.property[i]?.eastBoundry.slice(0,20))}`,  alignment: 'left', margin:[10,0,200,0]}],
    //                                     [{text: 'West', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.westBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
    //                                     [{text: 'North', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.northBoundry)}`, alignment: 'left', margin:[10,0,100,0]}],
    //                                     [{text: 'South', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.southBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
    //                                 ]
    //                             }});
    //                             pdeStyle.content.push(' ');
    //                             pdeStyle.content.push({ table:{
    //                                 widths:[250,249],
    //                                 body:[
    //                                     [{text: 'Chargeable Value(Round to next 500/-)', alignment: 'left',width:'*', margin:[10,10,0,0]}, {text: `${tMValue}`,  alignment: 'left',width:'*', margin:[10,10,188,0]}]
    //                                 ]
    //                             }});
    //                         }else{
    //                             pdeStyle.content.push({text:'Apartment Boundary Details',style:['sideHeaderNames']});
    //                             pdeStyle.content.push({table:{
    //                                 widths:[208,290],
    //                                 body:[
    //                                     [{text: 'East', alignment: 'left',width:'*', margin:[10,0,165,0]}, {text: `${toTitleCase(data?.property[i]?.eastBoundry.slice(0,20))}`,  alignment: 'left', margin:[10,0,200,0]}],
    //                                     [{text: 'West', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.westBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
    //                                     [{text: 'North', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.northBoundry)}`, alignment: 'left', margin:[10,0,100,0]}],
    //                                     [{text: 'South', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.southBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
    //                                 ]
    //                             },pageBreak:"after"});
    //                         }
    //                     };

    //                     if(propType === "RURAL"){
    //                         pdeStyle.content.push({ table:{
    //                             widths:[120,100,120,140],
    //                             body:[
    //                                 [{text: 'Locality/Habitation', alignment: 'center',bold:true },
    //                                 {text: 'Survey/\nTSurvey Number', bold:true, alignment: 'center'},
    //                                 {text: 'conveyedExtent', bold:true, alignment: 'center'},
    //                                 {text: 'Market value', alignment: 'center',bold:true}],
    //                                 [
    //                                     {text:`${toTitleCase(locality)}`,alignment:'center'},
    //                                     {text: `${data?.property[i].survayNo}`, alignment:'center'},
    //                                     {text: `${data?.property[i].tExtent}`, alignment:'center'},
    //                                     {text:`${data?.property[i].marketValue}`, alignment:'center'}
    //                                 ]
    //                             ]
    //                         }});
    //                         pdeStyle.content.push({text:'Boundary Details',style:['sideHeaderNames']});
    //                         pdeStyle.content.push({text:'',style:['sideHeaderNames']});
    //                         pdeStyle.content.push({table:{
    //                             widths:[208,290],
    //                             body:[
    //                                 [{text: 'East', alignment: 'left',width:'*', margin:[10,0,165,0]}, {text: `${toTitleCase(data?.property[i]?.eastBoundry.slice(0,20))}`,  alignment: 'left', margin:[10,0,200,0]}],
    //                                 [{text: 'West', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.westBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
    //                                 [{text: 'North', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.northBoundry)}`, alignment: 'left', margin:[10,0,100,0]}],
    //                                 [{text: 'South', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.southBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
    //                             ]
    //                         },pageBreak:"after"})
    //                     }
    //                     pdeStyle.content.push(' ');
    //                 //}
    //             }
    //         }else{
    //                 pdeStyle.content.push({text: [{text:`Schedule ....:`, style: ['f18']},{text:`.........`,fontSize:'12'}] });
    //                 pdeStyle.content.push({text:'Location of the Property',style:['sideHeaderNames']});
    //                 pdeStyle.content.push({ table:{
    //                     widths:[120,120,120,120],
    //                     body:[
    //                         [{text: 'Registration District', alignment: 'center',bold:true,width:'*', margin:[10,1,27,0]}, {text: 'Sub Registrar Office', bold:true, alignment: 'center',width:'*', margin:[10,1,27,0]}, {text: 'Village', bold:true, alignment: 'center',width:'*', margin:[20,1,27,0]},{text: 'Mandal', bold:true, alignment: 'center',width:'*', margin:[20,1,27,0]}],
    //                         [{text:` `,alignment:'center'}, {text:` `,alignment:'center'}, {text:` `,alignment:'center'}, {text: ` `, alignment:'center'}]
    //                     ]
    //                 }});
    //                 pdeStyle.content.push(' ');
    //                 pdeStyle.content.push({ table:{
    //                     widths:[250,249],
    //                     body:[
    //                         [{text: 'Revenue District', alignment: 'center',bold:true }, {text: 'Local Body', bold:true, alignment: 'center', }],
    //                         [{text:` `,alignment:'center'}, {text:` `,alignment:'center'}]
    //                     ]
    //                 }});
    //                 pdeStyle.content.push({text:'Land Details',style:['sideHeaderNames']});

    //                 // if(propType === "RURAL"){
    //                     pdeStyle.content.push({ table:{
    //                         widths:[120,200,170],
    //                         body:[
    //                             [{text: 'Locality/Habitation', alignment: 'center',bold:true },
    //                             {text: 'Survey/\nTSurvey Number', bold:true, alignment: 'center'},
    //                             {text: 'Market value', alignment: 'center',bold:true}],
    //                             [
    //                                 {text:`    `,alignment:'center'},
    //                                 {text: `     `, alignment:'center'},
    //                                 {text:`      `, alignment:'center'}
    //                             ]
    //                         ]

    //                     }});
    //                 // }
    //                 pdeStyle.content.push(' ');
    //             // }else if(naturetype == "Mortgage"){
    //                 pdeStyle.content.push({text:`All that the piece and parcel of Agriculture Land bearing Survey No._________   admeasuring Ac. ______ / _______ Hectors, situated in ___________ Village ___________ Mandal _______, under the jurisdiction of Sub District _______  and  Registration District ________ `,style:['p1Text_MR']})
    //                 pdeStyle.content.push({text:`EAST       : `,style:['p1Text_MR1']})
    //                 pdeStyle.content.push({text:`WEST      : `,style:['p1Text_MR1']})
    //                 pdeStyle.content.push({text:`NORTH   : `,style:['p1Text_MR1']})
    //                 pdeStyle.content.push({text:`SOUTH   : `,style:['p1Text_MR1']})
    //             // }
    //         }

    //     }

    //    pdeStyle.content.push({text:`\nIn witness whereof the Releasor  have signed on this Release deed on the day, month & year mentioned above.`,style:['p1Text_MR']})

    //    pdeStyle.content.push({text:`\n\n\nReleasor :`,style:['p1last_MRleft']})
    //    if(data?.executent && data?.executent.length >0){
    //        let exNo =1
    //        for(let i of data.executent){
    //            let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0,8),"XXXX XXXX XXXX ") : "xxxx xxxx xxxx";
    //            pdeStyle.content.push({text:`${exNo})Name: ${toTitleCase(i.name)}`+'\n'+`Aadhar : ${aadhar}`,style:['p1last_MRleft']});
    //            exNo = exNo+1;
    //        }
    //    }

    //     pdeStyle.content.push({text:`WITNESSES :`,style:['p1last_MRleft']})

    //     pdeStyle.content.push({text:`1. `+`\n\n2.`,style:['p1Text_MR']})
    //     return pdeStyle;
  } catch (ex) {
    console.log("error ::", ex.message);
    throw new PDEError({ status: false, message: "Internal Server" });
  }
};

const telGenarateDocs = async (data, path) => {
  try {
    STATIC_COVNENTS_COUNT = 0;
    let teluguHtmlFilePath = Path.join(
      __dirname,
      `../htmlFiles/05/04/telugu.hbs`
    );
    return await genarateDocsUsingHtml(data, path, teluguHtmlFilePath);

    // return new Promise( async (resolve, reject) => {
    //     let [naturetype ,rest]= data.registrationType.TRAN_DESC.split(" ");
    // 	let DocNum = data.documentNature.TRAN_MAJ_CODE;
    // 	let [rest2,disc] = data.documentNature.TRAN_DESC.split("[");
    // 	let [subDesc,rest3]=disc.split("]");
    //     var [dd,m,yyyy] = data.executionDate.split("/");
    // 	// var dd = String(exDate.getDate()).padStart(2, '0');
    // 	var mm = new Date(`${yyyy}-${m}-${dd}`).toLocaleDateString('en-US',{month:'long'})
    // 	let covenantArr=[];
    // 	if(data?.covanants){
    // 		let sNo =DocNum ==="01" ? 6 : DocNum ==="02"? 8 : DocNum ==="03"? 4: DocNum ==="07" ? 12: DocNum === "05"? 9: DocNum === "06"?  9: DocNum === "04"? 8: DocNum == "09"? 10: 7;
    // 		data?.covanants?.covanants.map((covn)=>{
    // 			let val = sNo ===6 || sNo ===8|| sNo ===7 ? `${sNo}. ${covn.value}` : `\n${sNo}. ${covn.value}`
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
    //     // pdfDocs.fontSize('13').text(`రూ ${data.amount} రూపాయలు విలువగల స్థిరాస్తి ${subDesc}.`,{align:'center'});
    //     pdfDocs.fontSize('13').text(`ఈ రీకన్వేయన్స్ పత్రం(ఇతరులు) ${yyyy} వ సంవత్సరం ${mm} నెల ${dd} వ తేదీన వ్రాయబడింది.`,{align:'center'});
    //     pdfDocs.fontSize('15').text(`వ్రాయించియిచ్చినవారు :`,{align:'left'});
    //     if(data.executent && data.executent.length >0){
    //         for(let i of data.executent){
    //             let add = i.address.split("\n").join("")
    //             add= add.split(" ").join("");
    //         pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. ${toTitleCase(i.name)}, ${i.relationType}.${toTitleCase(i.relationName)}, వయస్సు ${i.age} సంవత్సరాలు, ప్రస్తుతం ${toTitleCase(add)} లో నివాసము`,{align:'justify',lineGap:0});
    //         pdfDocs.moveDown();
    //         }
    //         pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “రిలీజర్“ ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{align:'justify',lineGap:0});
    //         pdfDocs.moveDown()
    //     }else{
    //         pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. .......,S/O. .........,వయస్సు ........ సంవత్సరాలు,ప్రస్తుతం......... లో నివాసము`,{align:'justify',lineGap:0});
    //         pdfDocs.moveDown();
    //         pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “రిలీజర్“ ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{align:'justify',lineGap:0})
    //         pdfDocs.moveDown();
    //     }
    //     pdfDocs.fontSize('15').text(`మరియు`,{align:'center',underline:true});
    //     pdfDocs.fontSize('13').text(`వ్రాయించుకున్నవారు :`,{align:'left'});
    //     if(data.claimant && data.claimant.length >0){
    //         for(let i of data.claimant){
    //             let add = i.address.split("\n").join("")
    //             add= add.split(" ").join("");
    //         pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. ${toTitleCase(i.name)}, ${i.relationType}.${toTitleCase(i.relationName)}, వయస్సు ${i.age} సంవత్సరాలు, ప్రస్తుతం ${toTitleCase(add)}  నివాసము`,{align:'justify',lineGap:0});
    //         pdfDocs.moveDown();
    //         }
    //         pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “రిలీసీ “ గా ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{align:'justify',lineGap:0})
    //     }else{
    //         pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. .......,S/O. .........,వయస్సు ........ సంవత్సరాలు,ప్రస్తుతం......... లో నివాసము`,{align:'justify',lineGap:0});
    //         pdfDocs.moveDown();
    //         pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “రిలీసీ “ గా ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{align:'justify',lineGap:0})
    //     }

    //     if (data.covanants?.acquireCovenents && data.covanants?.acquireCovenents.length > 0) {
    //         let aqCovanents = []
    //         // pdfDocs.fontSize('13').text('How the Property is Aquired',{align:'justify'})
    //         let sNo = 1;
    //         data?.covanants.acquireCovenents.map((aqcv) => {
    //             let val = sNo === 1 ? `\n${aqcv.value}` : `\n${aqcv.value}`
    //             aqCovanents = [...aqCovanents, val];
    //             sNo = sNo + 1;
    //         })
    //         for (let i of aqCovanents) {
    //             pdfDocs.fontSize('13').text(`${i}`, { align: 'justify', lineGap: 1 });
    //         }
    //     }

    //     pdfDocs.fontSize('13').text(`అయితే సదరు దస్తావేజు తాలూకా వృద్దులు చెల్లిపోగా నిలిచియున్న అసలు సొమ్ము రిలీజీ యీ దిగువ సాక్షులు సమక్షములో రిలీజర్ కు యిచ్చినందున సొమ్ము పూర్తిగా ముట్టినది. కావున యీ రీకన్వేయన్స్ డీడును వ్రాయించి యివ్వడమైనది. \n\n`,{align:'justify',lineGap:0})
    //     // let linkedText ="";
    //     // if(data.property && data.property.length >0){
    //     //     let linkedFlag=false;
    //     //     for(let i of data.property){
    //     //         if(i?.LinkedDocDetails && i?.LinkedDocDetails?.length > 0){
    //     //             for(let j in i?.LinkedDocDetails){
    //     //                 let linkDocNo = i.LinkedDocDetails[j].linkDocNo ? i.LinkedDocDetails[j].linkDocNo : "............"
    //     //                 let year = i.LinkedDocDetails[j].regYear ? i.LinkedDocDetails[j].regYear : "............"
    //     //                 let bookNo = i.LinkedDocDetails[j].bookNo ? i.LinkedDocDetails[j].bookNo : "............"
    //     //                 linkedText =`మా పేరున ${linkDocNo}/${year} దస్తావేజు ${toTitleCase(i.sroOffice)} సబ్ రిజిస్ట్రార్ కార్యాలయములో ${bookNo} వ పుస్తకము లో రిజిస్టర్ కాబడిన రీత్యా మాకు సంక్రమించబడిన ఈ దిగువ షెడ్యూలు దాఖలా స్థిరాస్తిని మా స్వాధీనములో సర్వ సంపూర్ణ  నిర్వివాద  యాజమాన్య హక్కు భుక్తములతో అనుభవించుచున్నాము`
    //     //                 //`virtue of registered document bearing the number ${linkDocNo} of ${year} of book ${bookNo}`
    //     //             }
    //     //         }else{
    //     //             linkedFlag = true;
    //     //         }
    //     //         pdfDocs.addPage();
    //     //         pdfDocs.fontSize('13').text(`${linkedText}`,{align:'justify',lineGap:0});
    //     //     }
    //     //     if(linkedFlag === true){
    //     //         linkedText = `దిగువ షెడ్యూలు దాఖలా ఆస్తి మాకు పూర్వార్జితపు ఆస్థి గా సంక్రమించి దాన వినిమయ విక్రయాధికార సర్వ సంపూర్ణ హక్కు భుక్తములతో అనుభవించుచున్నాము.`
    //     //         pdfDocs.fontSize('13').text(`${linkedText}`,{align:'justify',lineGap:0});
    //     //     }
    //     // }else{
    //     //     pdfDocs.addPage();
    //     //     linkedText = `దిగువ షెడ్యూలు దాఖలా ఆస్తి మాకు పూర్వార్జితపు ఆస్థి గా సంక్రమించి దాన వినిమయ విక్రయాధికార సర్వ సంపూర్ణ హక్కు భుక్తములతో అనుభవించుచున్నాము.`
    //     //     pdfDocs.fontSize('13').text(`${linkedText}`,{align:'justify',lineGap:0});
    //     //     pdfDocs.fontSize('13').text(`.......జిల్లా, ....... మండలం, ......గ్రామంలోని సర్వే నెంబర్...... నందలి ఎకరములు .... విస్తీర్ణం గల., దిగువ షెడ్యూలు దాఖలా ఆస్తి అమ్మకందారుకు పూర్వార్జితపు ఆస్థి గా సంక్రమించి దాన వినిమయ విక్రయాధికార సర్వ సంపూర్ణ హక్కు భుక్తములతో అనుభవించుచున్నారు.`,{align:'justify',lineGap:0});
    //     // }

    //     if(covenantArr && covenantArr.length >0){
    //         for(let i of covenantArr){
    //             pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
    //         }
    //     }

    //     pdfDocs.addPage();
    //     //property
    //     if(data?.property && data.property?.length >0){
    //         let propLangth = data.property.length;
    //         let tMValue=0;
    //         let dataI =0;
    //         pdfDocs.fontSize('13').text(`షెడ్యూలు ఆస్తి వివరము`,{align:'center',lineGap:0,underline:true});
    //         pdfDocs.moveDown();
    //         for(let i of data.property){

    //             dataI = dataI ===0 ? 1 : dataI + 1;
    //             tMValue = tMValue + i.marketValue
    //             x1=40,y1=180;
    //             let [landUse,rest1] =i.landUse.split('[')
    //             pdfDocs.fontSize('13').text(`షెడ్యూల్ ${i.seqNumber} : ${toTitleCase(landUse)}`,x1,130,{align:'left',lineGap:0});
    //             pdfDocs.fontSize('13').text(`ఆస్తి యుండు ప్రదేశము`,x1,160,{align:'left',lineGap:0});
    //             pdfDocs.moveDown();
    //             let header1='రిజిస్ట్రేషన్ జిల్లా';
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
    //             pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,20).moveTo(150,180).lineTo(150,200).moveDown(0.1)
    //             .text(header1,x1+2,y1+2,{indent:5, align:'left',fontSize:'16'}).moveTo(300,180).lineTo(300,200)
    //             .text(`సబ్ రిజిస్ట్రార్ కార్యాలయము`,x1+112,y1+2,{indent:5, align:'left',fontSize:'16'})
    //             .moveTo(430,180).lineTo(430,200)
    //             .text(`రెవెన్యూ గ్రామము`,x1+262,y1+2,{indent:5, align:'left',fontSize:'16'})
    //             .text(`మండలము`,x1+392,y1+2,{indent:5, align:'left',fontSize:'16'})
    //             .moveTo(150,180).lineTo(150,220)
    //             .text(`${Dist}`,x1+2,y1+22,{indent:5, align:'left',fontSize:'16'})
    //             .moveTo(300,200).lineTo(300,220)
    //             .text(`${sroOffice}`,x1+112,y1+22,{width:140,indent:5, align:'left',fontSize:'16'})
    //             .moveTo(430,200).lineTo(430,220)
    //             .text(`${village}`,x1+259,y1+22,{width:120,indent:5, align:'left',fontSize:'16'})
    //             .text(`${mandal}`,x1+388,y1+22,{width:122,indent:5, align:'left',fontSize:'16'})
    //             .lineWidth(1).stroke();
    //             x1= 40;y1=187;
    //             // pdfDocs.text('jsshggssf',x1,y1+40)
    //             pdfDocs.moveDown()
    //             let lBD =""
    //             if(String(i.localBodyType).includes('[')){
    //                 let [rest,localbody]= i.localBodyType.split('[');
    //                 let [localbody2,rest2] = localbody.split(']');
    //                 lBD=localbody2;
    //             }

    //             pdfDocs.rect(x1,y1+40,500,20).rect(40,y1+60,500,20).moveTo(300,y1+40).lineTo(300,y1+60)
    //             .text(`రెవెన్యూ జిల్లా`,42,y1+42,{indent:5, align:'left',fontSize:'16'})
    //             .text(`స్థానిక సంస్థ / పంచాయతీ`,300,y1+42,{indent:5, align:'left',fontSize:'16'})
    //             .moveTo(300,y1+60).lineTo(300,y1+80)
    //             .text(`${toTitleCase(i.district)}`,42,y1+62,{indent:5, align:'left',fontSize:'16'})
    //             .text(`${toTitleCase(lBD)}`,300,y1+62,{indent:5, align:'left',fontSize:'16'})
    //             .lineWidth(1).stroke();
    //             x1=40;y1=262+10;
    //             pdfDocs.fontSize('13').text(`ఆస్థి సర్వే విస్తీర్ణము మరియు విలువలు వివరములు (రూల్-3 స్టేటుమెంటు):`,x1,y1);

    //             let locality = i.locality != "" ? toTitleCase(locality) : toTitleCase(i.habitation);
    //             let propType = i.propertyType.includes('RURAL') ? 'RURAL':'URBAN';
    //             y1=y1+20;
    //             pdfDocs.fontSize('13').text(`Locality : ${locality}`,x1,y1);
    //             if(propType === "URBAN"){
    //                 pdfDocs.rect(x1,y1+20,500,20).rect(x1,y1+40,500,20).moveTo(x1+55,y1+20).lineTo(x1+55,y1+60)
    //                 .text(`Ward`,x1+2,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(134,y1+20).lineTo(134,y1+60)
    //                 .text(`Block`,x1+57,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(182,y1+20).lineTo(182,y1+60)
    //                 .text(`Door`,x1+100,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(250,y1+20).lineTo(250,y1+60)
    //                 .text(`Survey No`,x1+140,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(330,y1+20).lineTo(330,y1+60)
    //                 .text(`Total Extent`,x1+207,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(400,y1+20).lineTo(400,y1+60)
    //                 .text(`Undivided`,x1+286,y1+22,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`Market value`,x1+366,y1+22,{indent:5, align:'left',fontSize:'16'})
    //                 // .text(`Market value`,x1+400,y1+42,{indent:5, align:'left',fontSize:'16'}).moveTo(440,y1+40).lineTo(440,y1+80)

    //                 .text(`${i.ward}`,42,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${i.block}`,x1+57,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${i.doorNo}`,x1+102,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${i.survayNo}`,x1+145,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${i.extent}`,x1+208,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${i.undividedShare}`,330,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${i.marketValue}`,400,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                 //.text(`${i.marketValue}`,x1+402,y1+62,{indent:5, align:'left',fontSize:'16'})
    //                 .lineWidth(1).stroke();
    //                 let [scProp,rest] = i.schedulePropertyType.split('[');
    //                 scProp= scProp.trim();
    //                 if(scProp =="FLAT" || scProp =="HOUSE"){
    //                     pdfDocs.text(`Structure Details :`,40,y1+60,{align:'left'});
    //                 }
    //                 if(scProp =="FLAT"){
    //                     pdfDocs.text(`Apartment Name : ${toTitleCase(i.appartmentName)}`,40,y1+80,{align:'left'});
    //                     pdfDocs.text(`No of Floors : ${i.totalFloors}`,110,y1+80,{align:'right'});
    //                 }
    //                 pdfDocs.moveDown();

    //                 // pdfDocs.text('sudhakar',x1,y1)
    //                 if(i.structure && i.structure.length >0){
    //                     x1=40, y1=y1+95;
    //                     for(let j in i.structure){
    //                         let [strType,rest] = i.structure[j].structureType.split('[');
    //                         let [stageOfCons,rest2] = i.structure[j].stageOfCons.split('[');
    //                         let rowHeight = String(stageOfCons).length >16 ?40 :20;
    //                         let rowLine = String(stageOfCons).length >16 ? 60:40
    //                         pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,rowHeight).moveTo(x1+85,y1).lineTo(x1+85,y1+rowLine)
    //                         .text(`floorNo`,x1+2,y1+2,{indent:5, align:'left',fontSize:'16'}).moveTo(x1+230,y1).lineTo(x1+230,y1+rowLine)
    //                         .text(`Structure type`,x1+105,y1+2,{indent:5, align:'left',fontSize:'16'}).moveTo(x1+303,y1).lineTo(x1+303,y1+rowLine)
    //                         .text(`Plinth`,x1+235,y1+2,{indent:5, align:'left',fontSize:'16'}).moveTo(x1+462,y1).lineTo(x1+462,y1+rowLine)
    //                         .text(`Stage of Cons`,x1+304,y1+2,{indent:5, align:'left',fontSize:'16'})
    //                         .text(`Age`,x1+464,y1+2,{indent:5, align:'left',fontSize:'16'})
    //                         .text(`${i.structure[j].floorNo}`,x1+2,y1+22,{indent:5, align:'left',fontSize:'16'})
    //                         .text(`${toTitleCase(strType)}`,x1+85,y1+22,{width:150,indent:5, align:'left',fontSize:'16'})
    //                         .text(`${i.structure[j].plinth}`,x1+235,y1+22,{indent:5, align:'left',fontSize:'16'})
    //                         .text(`${toTitleCase(stageOfCons)}` ,x1+304,y1+22,{width:200,indent:5, align:'left',fontSize:'16'})
    //                         .text(`${i.structure[j].age}`,x1+464,y1+22,{indent:5, align:'left',fontSize:'16'})
    //                         .lineWidth(1).stroke();
    //                         // pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,40).moveTo(x1+85,y1).lineTo(x1+85,y1+40)
    //                         // .lineWidth(1).stroke();
    //                     }
    //                 }

    //                 if(scProp == "FLAT"){
    //                     x1=40,y1=y1+22+60;
    //                     pdfDocs.text(`Flat Boundary Details :`,x1,y1);
    //                     x1=40,y1=y1+20;
    //                     let east = await  toTitleCase(i.flatEastBoundry)
    //                     let west = await  toTitleCase(i.flatWestBoundry)
    //                     let north = await  toTitleCase(i.flatNorthBoundry)
    //                     let south = await  toTitleCase(i.flatSouthBoundry)
    //                     pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,20).rect(x1,y1+40,500,20).rect(x1,y1+60,500,20).moveTo(x1+100,y1).lineTo(x1+100,y1+80)
    //                     .text(`EAST`,x1+2,y1+2,{indent:5, align:'left',fontSize:'16'})
    //                     .text(`WEST`,x1+2,y1+22,{indent:5, align:'left',fontSize:'16'})
    //                     .text(`NORTH`,x1+2,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                     .text(`SOUTH`,x1+2,y1+62,{indent:5, align:'left',fontSize:'16'})
    //                     .text(`${east}`,x1+102,y1+2,{indent:5, align:'left',fontSize:'16'})
    //                     .text(`${west}`,x1+102,y1+22,{indent:5, align:'left',fontSize:'16'})
    //                     .text(`${north}`,x1+102,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                     .text(`${south}`,x1+102,y1+62,{indent:5, align:'left',fontSize:'16'})
    //                     .lineWidth(1).stroke();
    //                 }

    //                 x1=40,y1=y1+62+20;
    //                 pdfDocs.text(`Apartment Boundary Details :`,x1,y1);
    //                 x1=40,y1=y1+20;
    //                 // pdfDocs.rect(x1,y1)
    //                 let eastBry = await  toTitleCase(i.eastBoundry);
    //                 let westBry = await  toTitleCase(i.westBoundry);
    //                 let northBry = await  toTitleCase(i.northBoundry);
    //                 let southBry = await  toTitleCase(i.southBoundry);
    //                 pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,20).rect(x1,y1+40,500,20).rect(x1,y1+60,500,20).moveTo(x1+100,y1).lineTo(x1+100,y1+80)
    //                 .text(`EAST`,x1+2,y1+2,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`WEST`,x1+2,y1+22,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`NORTH`,x1+2,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`SOUTH`,x1+2,y1+62,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${eastBry}`,x1+102,y1+2,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${westBry}`,x1+102,y1+22,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${northBry}`,x1+102,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${southBry}`,x1+102,y1+62,{indent:5, align:'left',fontSize:'16'})
    //                 .lineWidth(1).stroke();
    //                 pdfDocs.addPage();
    //             }else if(propType === "RURAL"){
    //                 pdfDocs.rect(x1,y1+40,500,20).rect(x1,y1+60,500,20).moveTo(150,y1+40).lineTo(150,y1+80)
    //                 .text(`సర్వే/సబ్ నెంబర్. లు`,x1+2,y1+42,{indent:5, align:'left',fontSize:'16'}).moveTo(300,y1+40).lineTo(300,y1+80)
    //                 .text(`బదలాయించు విస్తీర్ణము`,x1+112,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`మార్కెట్ విలువ`,x1+262,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${i.survayNo}`,42,y1+62,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${i.tExtent}`,152,y1+62,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${i.marketValue}`,302,y1+62,{indent:5, align:'left',fontSize:'16'})
    //                 .lineWidth(1).stroke();
    //                 x1=40;y1=y1+62+40;

    //                 pdfDocs.rect(x1,y1,500,20).rect(40,y1+20,500,20).rect(40,y1+40,500,20).rect(40,y1+60,500,20).moveTo(150,y1).lineTo(150,y1+80)
    //                 .text(`తూర్పు`,42,y1+2,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`పడమర`,42,y1+22,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`ఉత్తరం`,42,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`దక్షణం`,42,y1+62,{indent:5, align:'left',fontSize:'16'})

    //                 .text(`${toTitleCase(i.eastBoundry)}`,152,y1+2,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${toTitleCase(i.westBoundry)}`,152,y1+22,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${toTitleCase(i.northBoundry)}`,152,y1+42,{indent:5, align:'left',fontSize:'16'})
    //                 .text(`${toTitleCase(i.southBoundry)}`,152,y1+62,{indent:5, align:'left',fontSize:'16'})
    //                 .lineWidth(1).stroke();
    //                 if(propLangth === dataI){
    //                     x1=40;y1=y1+62+20;
    //                     pdfDocs.fontSize('12').text(`సుంకం నిర్ధారణ నిమిత్తం :`,x1+2,y1,{align:'left'});
    //                     x1=40;y1=y1+40;
    //                     pdfDocs.rect(x1,y1,500,20).moveTo(320,y1).lineTo(320,y1+20)
    //                     .text(`ఛార్జ్ చేయదగిన విలువ (తదుపరి 500/- వరకు)`,42,y1+2,{indent:5, align:'left',fontSize:'16'})
    //                     .text(`${tMValue}`,320,y1+2,{indent:5, align:'left',fontSize:'16'})
    //                     .lineWidth(1).stroke();
    //                 }
    //                 pdfDocs.addPage();
    //             }
    //             // x1=40;y1=y1+62+40;

    //             // if(y1 === 300){
    //             // 	pdfDocs.addPage();
    //             // }
    //         }
    //     }

    //     pdfDocs.fontSize('13').text(`రిలీజరు\n`, { align: 'left', lineGap: 0 ,underline:true})
    //     if (data?.executent && data?.executent.length > 0) {
    //         let exNo = 1
    //         for (let i of data.executent) {
    //             let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0, 8), "XXXX XXXX XXXX ") : "xxxx xxxx xxxx";

    //             pdfDocs.fontSize('12').text(`${exNo})పేరు: ${toTitleCase(i.name)}` + '\n' + `ఆధార్ నెంబర్ : ${aadhar}`, { align: 'left' });
    //             exNo = exNo + 1;
    //         }
    //     }

    //     pdfDocs.fontSize('13').text(`\nయిందుకు  సాక్షులు :`,{align:'left',lineGap:0,underline:true});
    //     pdfDocs.fontSize('13').text(`1. `,{align:'left',lineGap:0});
    //     pdfDocs.fontSize('13').text(`2. `,{align:'left',lineGap:0});
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
