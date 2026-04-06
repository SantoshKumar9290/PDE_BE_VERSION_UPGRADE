const pdfDoc = require('pdfkit');
const fs = require('fs');
const { fontSize } = require('pdfkit');
const {pdeStyle} = require('../../pdfStyles/engDocs')
const PDEError = require('../../../errors/customErrorClass');
const {covanantsData}= require('../../pdfStyles/covanants')
const Path = require('path');



const engGenarateDocs = async (data)=>{
    try{
        var [dd,m,yyyy] = data.executionDate.split("/");
    // var dd = String(exDate.getDate()).padStart(2, '0');
        var mm = new Date(`${yyyy}-${m}-${dd}`).toLocaleDateString('en-US',{month:'long'})
        pdeStyle.content =[];
         y = data.eStamp === "N" ? 400 : 550;
        if(data.status == "DRAFT"){
            pdeStyle.watermark.text ="DRAFT"
        }
        let covenantArr=[];
        if(data?.covanants){
            let sNo =9
            data?.covanants?.covanants.map((covn)=>{
                let val = sNo ===9 ? `${sNo}.${covn.value}` : `\n${sNo}.${covn.value}`
                covenantArr = [...covenantArr,val];
                sNo =sNo+1;
            })
        };
        let [subDesc,disc] = data.documentNature.TRAN_DESC.split("[");
        let [TRAN_DESC,rest] = data.registrationType.TRAN_DESC ? data.registrationType.TRAN_DESC.split("[") :["",""];
        pdeStyle.content.push({text:`${subDesc}`.toUpperCase(),alignment: 'center',bold:true,decoration:'underline',margin:[10,y,0,0]});
        pdeStyle.content.push(' ');
        pdeStyle.content.push({text:`This ${subDesc.toUpperCase()} is made and executed on this ${data.executionDate}, by :`, style:['p1sideHeaders']});
        let party1Text,party2Text;
        if(data?.executent && data?.executent.length >0){
            for(var i=0;i<data.executent.length;i++){
                let address =data?.executent[i]?.address.replace(/\n/g, '');
                let name = data?.executent[i]?.name ? toTitleCase(data?.executent[i]?.name) :"............";
                let relationType = data?.executent[i]?.relationType ? data?.executent[i]?.relationType:"............";
                let relationName = data?.executent[i]?.relationName ? toTitleCase(data?.executent[i]?.relationName):"............";
                let age = data?.executent[i]?.age ? data?.executent[i]?.age:"............";
                if(data?.executent[i].partyType === "Public"){
                    pdeStyle.content.push({
                        text:`\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`,style:["p1Text"]
                    })
                    pdeStyle.content.push({
                        text:`\n(Hereinafter called the VENDORS which expression shall be deemed to include their heirs, successors, representatives and assignees.)`
                    })
                    
                }else{
                    pdeStyle.content.push({
                        text:`M/s .${name}, ${address} is represented by`,style:["p1Text"]
                    })
                }
                
                if(data.executent[i]?.represent && data.executent[i]?.represent.length >0){
                    for(let j in data.executent[i]?.represent){
                        let address =data?.executent[i]?.represent[j]?.address.replace(/\n/g, '');
                        let name = data?.executent[i]?.represent[j]?.name ? toTitleCase(data?.executent[i]?.represent[j]?.name):"............";
                        let relationType = data?.executent[i]?.represent[j]?.relationType ? data?.executent[i]?.represent[j]?.relationType:"............";
                        let relationName = data?.executent[i]?.represent[j]?.relationName ? toTitleCase(data?.executent[i]?.represent[j]?.relationName):"............";
                        let age = data?.executent[i]?.represent[j]?.age ? data?.executent[i]?.represent[j]?.age:"............";

                        if(data?.executent[i].partyType === "Public"){
                            if(j === 0){
                                pdeStyle.content.push({
                                    text:`Represented By :`,style:["p1Text"]
                                })
                            };
                            pdeStyle.content.push({
                                text:`\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`,style:["p1Text"]
                            });
                        }else{
                            pdeStyle.content.push({
                                text:`\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`,style:["p1Text"]
                            })
                        }

                    }
                }
            }
        }else{
            pdeStyle.content.push({
                text:`\nMr/Mrs. ..............., ......................... , aged about ............ years,Presently residing at ...................`,style:["p1Text"]
            });
            pdeStyle.content.push({
                text:`\n(Hereinafter called the VENDORS which expression shall be deemed to include their heirs, successors, representatives and assignees.)`
            })
        }
        pdeStyle.content.push({text:'IN FAVOUR OF',alignment: 'center',bold:true,decoration:'underline',margin:[10,10,0,0]});
        if(data?.claimant && data?.claimant.length >0){
            for(var i=0;i<data.claimant.length;i++){
                let address =data?.claimant[i]?.address.replace(/\n/g, '');
                let name = data?.claimant[i]?.name ? toTitleCase(data?.claimant[i]?.name):"............";
                let relationType = data?.claimant[i]?.relationType ? data?.claimant[i]?.relationType:"............";
                let relationName = data?.claimant[i]?.relationName ? toTitleCase(data?.claimant[i]?.relationName):"............";
                let age = data?.claimant[i]?.age ? data?.claimant[i]?.age:"............";
                if(data?.claimant[i].partyType === "Public"){
                    pdeStyle.content.push({
                        text:`\nMr/Mrs. ${name}, ${relationType} ${relationName} , aged about ${age}  years, Presently residing at ${toTitleCase(address)}`,style:["p1Text"]
                    });
                    pdeStyle.content.push({
                        text:`\n(Hereinafter called the VENDEES which expression shall be deemed to include their heirs, successors, representatives and assignees.)\n`
                     });
                }else{
                    pdeStyle.content.push({
                        text:`M/s .${name}, ${address} is represented by`,style:["p1Text"]
                    })
                }

                if(data.claimant[i]?.represent && data.claimant[i]?.represent.length >0){
                    for(let j in data.claimant[i]?.represent){
                        let address =data?.claimant[i]?.represent[j]?.address.replace(/\n/g, '');
                        let name = data?.claimant[i]?.represent[j]?.name ? toTitleCase(data?.claimant[i]?.represent[j]?.name):"............";
                        let relationType = data?.claimant[i]?.represent[j]?.relationType ? data?.claimant[i]?.represent[j]?.relationType:"............";
                        let relationName = data?.claimant[i]?.represent[j]?.relationName ?toTitleCase( data?.claimant[i]?.represent[j]?.relationName):"............";
                        let age = data?.claimant[i]?.represent[j]?.age ? data?.claimant[i]?.represent[j]?.age:"............";

                        if(data?.claimant[i].partyType === "Public"){
                            pdeStyle.content.push({
                                text:`Represented By :`,style:["p1Text"]
                            })
                            pdeStyle.content.push({
                                text:`\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`,style:["p1Text"]
                            })
                        }else{
                            pdeStyle.content.push({
                                text:`\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`,style:["p1Text"]
                            })
                        }
                    }
                }
            }
        }else{
            pdeStyle.content.push({
                text:`\nMr/Mrs. ................, ......................... , aged about ............ years,Presently residing at ....................`,style:["p1Text"]
            });
            pdeStyle.content.push({
                text:`\n(Hereinafter called the VENDEES which expression shall be deemed to include their heirs, successors, representatives and assignees.)\n`
             });
        }
        if(data.covanants?.acquireCovenents && data.covanants?.acquireCovenents.length >0){
            let aqCovanents=[]
            // pdeStyle.content.push({text:`How the Property is Acquired :`,bold:true,decoration:'underline'})
            let sNo=1;
            data?.covanants.acquireCovenents.map((aqcv)=>{
                let val = sNo ===1 ? `\n${aqcv.value}` : `\n ${aqcv.value}`
                aqCovanents = [...aqCovanents,val];
            })
            for(let i of aqCovanents){
                pdeStyle.content.push({text:`${i}`,style:['p1Text_MR']})
            }
        }

        pdeStyle.content.push({text:`\nWhereas the vendors herein wanted to sell the schedule mentioned property to meet their financial requirements. The vendee herein, had offered to purchase the land for a consideration of Rs.${data.amount}/- . The vendors have accepted the offer of the vendee as they deemed it appropriate and in agreement with the prevailing market value as on that day and have agreed to sell the schedule mentioned property to the vendees.\n`})
        // pdeStyle.content.push({
        //     text:`WHEREAS, as it was not possible to jointly enjoy the schedule mentioned properties, the above parties have decided to divide the schedule mentioned properties among themselves. They have discussed, agreed and mutually decided to effect partition of the said properties between them in the manner hereinafter described in the presence of their elders and well wishers. `,style:["p1Text"]
        // });
        if(TRAN_DESC){
            // if(data?.property && data.property.length >0){
            //     for(let i in data?.property){
            //         let [landUse,rest] = data.property[i].landUse ? data.property[i].landUse.split("[") :["............",""];
            //         let [acr,cent] = data?.property[i]?.tExtent ? data.property[i].tExtent.split("."):["............","............"];
            //         if(cent == undefined){
            //             cent ="00"
            //         }
            //         let linkedText ;
            //         if(data?.property[i]?.LinkedDocDetails && data?.property[i]?.LinkedDocDetails?.length > 0){
            //             for(let j in data?.property[i]?.LinkedDocDetails){
            //                 let linkDocNo = data.property[i].LinkedDocDetails[j].linkDocNo ? data.property[i].LinkedDocDetails[j].linkDocNo : "............"
            //                 let year = data.property[i].LinkedDocDetails[j].regYear ? data.property[i].LinkedDocDetails[j].regYear : "............"
            //                 let bookNo = data.property[i].LinkedDocDetails[j].bookNo ? data.property[i].LinkedDocDetails[j].bookNo : "............"
            //                 linkedText =`virtue of registered document bearing the number ${linkDocNo} of ${year} of book ${bookNo}`
            //             }
            //         }else{
            //             linkedText = `inheritance`
            //         }
            //         let propType = data.property[i].propertyType.includes('RURAL') ? 'RURAL':'URBAN';
			// 				let msA = propType ==='URBAN'?"Sq.Yards":'Acres';
			// 				let msB = propType ==='URBAN'?"":'Cents';
			// 				cent = propType ==='URBAN'?"":cent;
            //         let surveyNo = data.property[i].survayNo ? data.property[i].survayNo :"............";
            //         let habitation = data.property[i].habitation ? data.property[i].habitation :"............";
            //         let mandal = data.property[i].mandal ? data.property[i].mandal :"............";
            //         let district = data.property[i].district ? data.property[i].district :"............";
            //         pdeStyle.content.push({text:`Whereas the Parties herein is the absolute owner and possessor of ${toTitleCase(landUse)}  measuring ${acr} ${msA} ${cent} ${msB} forming part of Survey No ${surveyNo} situated at ${toTitleCase(habitation)} of ${toTitleCase(mandal)} Mandal, ${toTitleCase(district)} District , Whereas Parties has acquired the schedule property by ${linkedText} since then the parties is in possession and enjoyment of thesaid site with full and absolute rights free from all encumbrances.`,style:["p3Text1_main1"]})
                                    
            //     }
            // }
            pdeStyle.content.push({text:`\nNOW THIS DEED OF ${subDesc} WITNESSETH AS FOLLOWS :\n`,alignment:'center',bold:true})
            let amountInWords =await NumToWord(data.amount);
            pdeStyle.content.push({text:`\n         In consideration of the said offer the vendee has paid the entire sale consideration of Rs.${data.amount}/-${amountInWords}to the vendors earlier in the following manner. 
            `})
            if(data?.payment && data?.payment.length >0){
                                
                let payNo = 0;
                for(let i in data?.payment){
                    let payinword = await NumToWord(data?.payment[i]?.payAmount);
                    let payDate = new Date(data?.payment[i]?.dateOfPayment).toLocaleDateString();
                    payNo = payNo +1;
                    if(payNo ==1){
                        pdeStyle.content.push({text:`${payNo}. Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} Dated ${payDate}.`,style:["p3text1_pay"]})
                    }else{
                        pdeStyle.content.push({text:`${payNo}. Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} Dated ${payDate}.`,style:["p3text1_pay"]})
                    }
                }
                pdeStyle.content.push({text:`\n\nAnd the VENDOR hereby admits and acknowledges the same.`,style:["p3text1_pay"]});
                
            };

            let sNo =1
            let cvStaticArry =[];        
            covanantsData.sale.map((cv)=>{
                if(cv.minDocNum == data.documentNature.TRAN_MIN_CODE){
                    let val = sNo ===1 ? `${sNo}.${cv.value}` : `\n${sNo}.${cv.value}`
                    cvStaticArry = [...cvStaticArry,val];
                    sNo =sNo+1;
                }

            });
            pdeStyle.content.push({text:cvStaticArry,style:["covanants"]});
            pdeStyle.content.push({text:covenantArr,style:["covanants"]});





            //PropertyDetails**
            pdeStyle.content.push({text:'SCHEDULE OF PROPERTY',alignment: 'center',bold:true,decoration:'underline',margin:[10,10,0,5]});
            if(data.property && data.property.length >0){
                let propLangth = data.property.length;
                let tMValue=0;
                let dataI =0;

                for(var i=0;i<data.property.length;i++) {
                    dataI = dataI ===0 ? 1 : dataI + 1;
                    tMValue = tMValue + data.property[i].marketValue;
                        let [landUse,rest] = data.property[i].landUse.split("[");
                        let propType = data.property[i].propertyType.includes('RURAL') ? 'RURAL':'URBAN';
                        pdeStyle.content.push({text: [{text:`Schedule ${data.property[i].seqNumber}:`, style: ['f18']},{text:` ${landUse}`,fontSize:'12'}] });

                        pdeStyle.content.push({text:'',style:['sideHeaderNames']});
                        pdeStyle.content.push({ table:{
                            widths:[120,120,120,120],
                            body:[
                                [{text: 'Registration District', alignment: 'center',bold:true,width:'*', margin:[10,1,27,0]}, {text: 'Sub Registrar Office', bold:true, alignment: 'center',width:'*', margin:[10,1,27,0]}, {text: 'Village', bold:true, alignment: 'center',width:'*', margin:[20,1,27,0]},{text: 'Mandal', bold:true, alignment: 'center',width:'*', margin:[20,1,27,0]}],
                                [{text:`${toTitleCase(data?.property[i].district)}`,alignment:'center'}, {text:`${toTitleCase(data?.property[i].sroOffice)}`,alignment:'center'}, {text:`${toTitleCase(data?.property[i]?.village)}`,alignment:'center'}, {text: `${toTitleCase(data?.property[i]?.village)}`, alignment:'center'}]
                            ]
                        }});
                        pdeStyle.content.push(' ');
                        pdeStyle.content.push({ table:{
                            widths:[250,249],
                            body:[
                                [{text: 'Revenue District', alignment: 'center',bold:true }, {text: 'Local Body', bold:true, alignment: 'center', }],
                                [{text:`${toTitleCase(data?.property[i]?.district)}`,alignment:'center'}, {text:`${toTitleCase(data?.property[i]?.sroOffice)}`,alignment:'center'}]
                            ]
                        }});
                        pdeStyle.content.push({text:'',style:['sideHeaderNames']});
                        const locality = data?.property[i].locality !=""  ? toTitleCase(data?.property[i].locality) : toTitleCase(data?.property[i].habitation);	
                        if(propType === "URBAN"){
                            //let propType = data.property[i].propertyType.includes('RURAL') ? 'RURAL':'URBAN';
                           // let msA = propType ==='URBAN'? i.tUnits === 'Y' ? "Sq.YARDS" : 'Sq.FEET' :'Acres'
                            pdeStyle.content.push({ table:{
                                widths:[80,30,35,30,45,40,55,55,65],
                                body:[
                                    [{text: 'Locality/Habitation', alignment: 'center',bold:true }, 
                                    {text: 'Ward', bold:true, alignment: 'center'}, 
                                    {text: 'Block', bold:true, alignment: 'center'},
                                    {text: 'Door\nNo', bold:true, alignment: 'center'},
                                    {text: 'Survey/\nTSurvey Number', bold:true, alignment: 'center'},
                                    {text: 'Total Extent\n(Sq.Yards)', alignment: 'center',bold:true},
                                    {text: 'Undivided \nShare(Sq.Yards)', alignment: 'center',bold:true},
                                    {text: 'Plot', alignment: 'center',bold:true},
                                    {text: 'Market value', alignment: 'center',bold:true},
                                
                                ],
                                    [
                                        {text:`${toTitleCase(locality)}`,alignment:'center'},
                                        {text:`${data?.property[i].ward}`,alignment:'center'}, 
                                        {text:`${data?.property[i].block}`,alignment:'center'}, 
                                        {text: `${data?.property[i].doorNo}`, alignment:'center'},
                                        {text: `${data?.property[i].survayNo}`, alignment:'center'},
                                        {text: `${data?.property[i].extent}`, alignment:'center'}, //totalext
                                        {text: `${data?.property[i].undividedShare}`, alignment:'center'},
                                        {text: `${data?.property[i].plotNo}`, alignment:'center'},
                                        {text:`${data?.property[i].marketValue}`, alignment:'center'}
                                    ]
                                ]
                                
                            }});
                            pdeStyle.content.push({columns:[
                                {text:'Structure Details',style:['sideHeaderNames']},
                                {text:`Apartment Name :  ${data?.property[i].appartmentName.toUpperCase()}`,style:['sideHeaderNames']},
                                {text:`No of Floors : ${data?.property[i].totalFloors}`,style:['sideHeaderNamesright']}
                            ]
                            });
                            if(data?.property[i]?.structure?.length > 0){
                                for(var j=0;j<data?.property[i]?.structure.length;j++){
                                    let [strType,rest] = data?.property[i]?.structure[j].structureType.split("[");
                                    let [stage,rest2] = data?.property[i]?.structure[j].stageOfCons.split("[");
                                    pdeStyle.content.push({
                                        table:{
                                            body:[
                                                [
                                                    {text: 'Floor No', alignment: 'center',bold:true,width:'*', margin:[10,1,25,0]}, {text: 'Structure type', bold:true, alignment: 'center',width:'*', margin:[0,0,25,0]},{text: 'Plinth(sq feet) ', bold:true, alignment: 'center',width:'*', margin:[0,0,27,0]},{text: 'Stage of Cons.', bold:true, alignment: 'center',width:'*', margin:[0,0,25,0]},{text: 'Age', bold:true, alignment: 'center',width:'*', margin:[0,0,30,0]}],
                                                    
                                                [
                                                    {text:`${data?.property[i]?.structure[j].floorNo}`,alignment:'center'},{text:`${strType}`,alignment:'center'}, {text:`${data?.property[i]?.structure[j].plinth}`,alignment:'center'},{text: `${stage}`, alignment:'center'},{text: `${data?.property[i]?.structure[j].age}`, alignment:'center'}
                                                ]
                                            ]
                                        }
                                    })
                                }

                            }
                            let [scProp,rest] = data?.property[i].schedulePropertyType.split('[');
                            scProp= scProp.trim();
                            if(scProp === 'FLAT'){
                                pdeStyle.content.push({text:'Flat Boundary Details',style:['sideHeaderNames']});
                                pdeStyle.content.push({table:{
                                    widths:[208,290],
                                    body:[
                                        [{text: 'East', alignment: 'left',width:'*', margin:[10,0,165,0]}, {text: `${toTitleCase(data?.property[i]?.flatEastBoundry.slice(0,20))}`,  alignment: 'left', margin:[10,0,200,0]}],
                                        [{text: 'West', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.flatWestBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
                                        [{text: 'North', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.flatNorthBoundry)}`, alignment: 'left', margin:[10,0,100,0]}],
                                        [{text: 'South', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.flatSouthBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
                                    ]
                                }});
                            };

                            if(propLangth === dataI){
                                pdeStyle.content.push({text:' Boundary Details',style:['sideHeaderNames']});
                                pdeStyle.content.push({table:{
                                    widths:[208,290],
                                    body:[
                                        [{text: 'East', alignment: 'left',width:'*', margin:[10,0,165,0]}, {text: `${toTitleCase(data?.property[i]?.eastBoundry.slice(0,20))}`,  alignment: 'left', margin:[10,0,200,0]}],
                                        [{text: 'West', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.westBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
                                        [{text: 'North', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.northBoundry)}`, alignment: 'left', margin:[10,0,100,0]}],
                                        [{text: 'South', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.southBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
                                    ]
                                }});
                                pdeStyle.content.push(' ');
                                pdeStyle.content.push({ table:{
                                    widths:[250,249],
                                    body:[
                                        [{text: 'Chargeable Value(Round to next 500/-)', alignment: 'left',width:'*', margin:[10,10,0,0]}, {text: `${data.amount}`,  alignment: 'left',width:'*', margin:[10,10,188,0]}]
                                    ]
                                }});
                            }else{
                                pdeStyle.content.push({text:'Boundary Details',style:['sideHeaderNames']});
                                pdeStyle.content.push({table:{
                                    widths:[208,290],
                                    body:[
                                        [{text: 'East', alignment: 'left',width:'*', margin:[10,0,165,0]}, {text: `${toTitleCase(data?.property[i]?.eastBoundry.slice(0,20))}`,  alignment: 'left', margin:[10,0,200,0]}],
                                        [{text: 'West', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.westBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
                                        [{text: 'North', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.northBoundry)}`, alignment: 'left', margin:[10,0,100,0]}],
                                        [{text: 'South', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.southBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
                                    ]
                                },pageBreak:"after"});
                            }
                        };
                        
                        if(propType === "RURAL"){
                            //let propType = data.property[i].propertyType.includes('URBAN') ? 'URBAN':'RURAL';
                            //let msA = propType ==='RURAL'? 'ACRES':'Sq-Yards';
                            pdeStyle.content.push({ table:{
                                widths:[120,100,120,140],
                                body:[
                                    [{text: 'Locality/Habitation', alignment: 'center',bold:true },
                                    {text: 'Survey/\nTSurvey Number', bold:true, alignment: 'center'},
                                    {text: 'conveyedExtent (Acres)', bold:true, alignment: 'center'},
                                    {text: 'Market value', alignment: 'center',bold:true}],
                                    [
                                        {text:`${toTitleCase(locality)}`,alignment:'center'},
                                        {text: `${data?.property[i].survayNo}`, alignment:'center'},
                                        {text: `${data?.property[i].tExtent}`, alignment:'center'},
                                        {text:`${data?.property[i].marketValue}`, alignment:'center'}
                                    ]
                                ]
                            }});
                            pdeStyle.content.push({text:'Boundary Details',style:['sideHeaderNames']});
                            pdeStyle.content.push({text:'',style:['sideHeaderNames']});
                            pdeStyle.content.push({table:{
                                widths:[208,290],
                                body:[
                                    [{text: 'East', alignment: 'left',width:'*', margin:[10,0,165,0]}, {text: `${toTitleCase(data?.property[i]?.eastBoundry.slice(0,20))}`,  alignment: 'left', margin:[10,0,200,0]}],
                                    [{text: 'West', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.westBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
                                    [{text: 'North', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.northBoundry)}`, alignment: 'left', margin:[10,0,100,0]}],
                                    [{text: 'South', alignment: 'left',width:'*', margin:[10,0,154,0]}, {text: `${toTitleCase(data?.property[i]?.southBoundry)}`,  alignment: 'left', margin:[10,0,100,0]}],
                                ]
                            },pageBreak:"after"})
                        }
                        pdeStyle.content.push(' ');
                    //}
                }
            }else{
                    pdeStyle.content.push({text: [{text:`Schedule ....:`, style: ['f18']},{text:`.........`,fontSize:'12'}] });
                    pdeStyle.content.push({text:'',style:['sideHeaderNames']});
                    pdeStyle.content.push({ table:{
                        widths:[120,120,120,120],
                        body:[
                            [{text: 'Registration District', alignment: 'center',bold:true,width:'*', margin:[10,1,27,0]}, {text: 'Sub Registrar Office', bold:true, alignment: 'center',width:'*', margin:[10,1,27,0]}, {text: 'Village', bold:true, alignment: 'center',width:'*', margin:[20,1,27,0]},{text: 'Mandal', bold:true, alignment: 'center',width:'*', margin:[20,1,27,0]}],
                            [{text:` `,alignment:'center'}, {text:` `,alignment:'center'}, {text:` `,alignment:'center'}, {text: ` `, alignment:'center'}]
                        ]
                    }});
                    pdeStyle.content.push(' ');
                    pdeStyle.content.push({ table:{
                        widths:[250,249],
                        body:[
                            [{text: 'Revenue District', alignment: 'center',bold:true }, {text: 'Local Body', bold:true, alignment: 'center', }],
                            [{text:` `,alignment:'center'}, {text:` `,alignment:'center'}]
                        ]
                    }});
                    pdeStyle.content.push({text:'',style:['sideHeaderNames']});

                    // if(propType === "RURAL"){
                        pdeStyle.content.push({ table:{
                            widths:[120,200,170],
                            body:[
                                [{text: 'Locality/Habitation', alignment: 'center',bold:true },
                                {text: 'Survey/\nTSurvey Number', bold:true, alignment: 'center'},
                                {text: 'Market value', alignment: 'center',bold:true}],
                                [
                                    {text:`    `,alignment:'center'},
                                    {text: `     `, alignment:'center'},
                                    {text:`      `, alignment:'center'}
                                ]
                            ]
                            
                        }});
                    // }
                    pdeStyle.content.push(' ');
                // }else if(naturetype == "Mortgage"){
                    pdeStyle.content.push({text:`All that the piece and parcel of Agriculture Land bearing Survey No._________   admeasuring Ac. ______ / _______ Hectors, situated in ___________ Village ___________ Mandal _______, under the jurisdiction of Sub District _______  and  Registration District ________ `,style:['p1Text_MR']})
                    pdeStyle.content.push({text:`EAST       : `,style:['p1Text_MR1']})
                    pdeStyle.content.push({text:`WEST      : `,style:['p1Text_MR1']})
                    pdeStyle.content.push({text:`NORTH   : `,style:['p1Text_MR1']})
                    pdeStyle.content.push({text:`SOUTH   : `,style:['p1Text_MR1']})
                // }
            }
            
        }
        pdeStyle.content.push({text:'\n\nDECLARATION U/S 22-B OF THE REGISTRATION ACT, 1908',alignment: 'center',bold:true,decoration:'underline'})
        pdeStyle.content.push({text:`\n\nIt is hereby declared that the Schedule mentioned property or part thereof has not been conveyed or permanently alienated by the Executants herein or their representatives, assignees or agents in favour of any other persons by a registered document.  It is further declared the document through which the property was acquired previously is not cancelled by order of a Court of Law.  If is found in future that this declaration is false, the Transferors agree to abide by any action taken against them as per law and to make good the loss suffered by the Transferees.\n`})
        pdeStyle.content.push({text:`\nThe Schedule mentioned property is not a Government Land nor an Assigned land nor a property belonging to Wakf Board nor a property belonging to Endowments Department.`})
        pdeStyle.content.push({text:`\n\nIn witness whereof the vendors have signed on this Deed of sale on the day, month & year mentioned above.`})
        pdeStyle.content.push({text:`\n\n\nVendors :`,style:['p1last_MRleft']})
        if(data?.executent && data?.executent.length >0){
            let exNo =1
            for(let i of data.executent){
                let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0,8),"XXXX XXXX XXXX ") : "xxxx xxxx xxxx";
                pdeStyle.content.push({text:`${exNo})Name: ${toTitleCase(i.name)}`+'\n'+`Aadhar : ${aadhar}`,style:['p1last_MRleft']});
                exNo = exNo+1;
            }
        }
        
        pdeStyle.content.push({text:`WITNESSES :`,style:['p1last_MRleft']})

        pdeStyle.content.push({text:`1. `+`\n\n2.`,style:['p1Text_MR']})
        return pdeStyle;

    }catch(ex){
        console.log("error ::",ex.message)
		throw new PDEError({status:false,message:"Internal Server"});
    }
    
}

const telGenarateDocs = async (data, path) => {
    try {
        return new Promise(async (resolve, reject) => {
            let [naturetype, rest] = data.registrationType.TRAN_DESC.split(" ");
            let DocNum = data.documentNature.TRAN_MAJ_CODE;
            let [rest2, disc] = data.documentNature.TRAN_DESC.split("[");
            let [subDesc, rest3] = disc.split("]");
            var [dd, m, yyyy] = data.executionDate.split("/");
            // var dd = String(exDate.getDate()).padStart(2, '0');
            var mm = new Date(`${yyyy}-${m}-${dd}`).toLocaleDateString('en-US', { month: 'long' })
            let covenantArr = [];
            if (data?.covanants) {
                let sNo = DocNum === "01" ? 6 : DocNum === "02" ? 8 : DocNum === "03" ? 4 : DocNum === "07" ? 12 : DocNum === "05" ? 9 : DocNum === "06" ? 9 : DocNum === "04" ? 8 : DocNum == "09" ? 10 : 7;
                data?.covanants?.covanants.map((covn) => {
                    let val = sNo === 6 || sNo === 8 || sNo === 7 ? `${covn.value}` : `\n ${covn.value}`
                    covenantArr = [...covenantArr, val];
                    sNo = sNo + 1;
                })
            };
            let y = data.eStamp === "N" ? 400 : 500;
            let pdfDocs = new pdfDoc();
            let createFileData;
            pdfDocs.pipe(createFileData = fs.createWriteStream(path));
            pdfDocs.font(Path.join(__dirname, '../../../../fonts', 'telugu.ttf'));
            pdfDocs.fontSize('18').text(`${subDesc}`, 40, y, { align: 'center', underline: true });
            pdfDocs.fontSize('13').text(`రూ ${data.amount} రూపాయలు విలువగల స్థిరాస్తి ${subDesc}.`, { align: 'center' });
            pdfDocs.fontSize('13').text(`ఈ ${subDesc} ${yyyy} వ సంవత్సరం ${mm} నెల ${dd} వ తేదీన వ్రాయబడింది.`, { align: 'center' });
            pdfDocs.fontSize('15').text(`వ్రాయించియిచ్చినవారు :`, { align: 'left', underline: true });
            if (data.executent && data.executent.length > 0) {
                for (let i of data.executent) {
                    let add = i.address.split("\n").join("")
                    add = add.split(" ").join("");
                    pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. ${toTitleCase(i.name)}, ${i.relationType}.${toTitleCase(i.relationName)}, వయస్సు ${i.age} సంవత్సరాలు, ప్రస్తుతం ${toTitleCase(add)} లో నివాసము`, { align: 'justify', lineGap: 0 });
                    pdfDocs.moveDown();
                }
                pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “విక్రయదారులుగా “ ఈ దస్తావేజునందు పరిగణించబడుదురు).`, { align: 'left', lineGap: 0 });
                pdfDocs.moveDown()
            } else {
                pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. .......,S/O. .........,వయస్సు ........ సంవత్సరాలు,ప్రస్తుతం......... లో నివాసము`, { align: 'justify', lineGap: 0 });
                pdfDocs.moveDown();
                pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “విక్రయదారులుగా “ ఈ దస్తావేజునందు పరిగణించబడుదురు).`, { align: 'left', lineGap: 0 })
                pdfDocs.moveDown();
            }
            pdfDocs.fontSize('15').text(`మరియు`, { align: 'center', underline: true });
            pdfDocs.fontSize('13').text(`వ్రాయించుకున్నవారు :`, { align: 'left', underline: true });
            if (data.claimant && data.claimant.length > 0) {
                for (let i of data.claimant) {
                    let add = i.address.split("\n").join("")
                    add = add.split(" ").join("");
                    pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. ${toTitleCase(i.name)}, ${i.relationType}.${toTitleCase(i.relationName)}, వయస్సు ${i.age} సంవత్సరాలు, ప్రస్తుతం ${toTitleCase(add)}  నివాసము`, { align: 'justify', lineGap: 0 });
                    pdfDocs.moveDown();
                }
                pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “కొనుగోలుదారులుగా“ ఈ దస్తావేజునందు పరిగణించబడుదురు).`, { align: 'left', lineGap: 0 })
            } else {
                pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. .......,S/O. .........,వయస్సు ........ సంవత్సరాలు,ప్రస్తుతం......... లో నివాసము`, { align: 'justify', lineGap: 0 });
                pdfDocs.moveDown();
                pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “కొనుగోలుదారులుగా“ ఈ దస్తావేజునందు పరిగణించబడుదురు).`, { align: 'left', lineGap: 0 })
            }
           
            if(data.covanants?.acquireCovenents && data.covanants?.acquireCovenents.length >0){
                let aqCovanents=[]
                pdfDocs.fontSize('13').text('How the Property is Aquired',{align:'justify'})
                let sNo=1;
                data?.covanants.acquireCovenents.map((aqcv)=>{
                    let val = sNo ===1 ? `\n${aqcv.value}` : `\n${aqcv.value}`
					aqCovanents = [...aqCovanents,val];
					sNo =sNo+1;
                })
                for(let i of aqCovanents){
                    pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
                }
            }
            
            pdfDocs.fontSize('13').text(`విక్రయదారులు తమ ఆర్థిక అవసరాలు తీర్చుకొనే నిమిత్తం షెడ్యూల్ ఆస్థిని విక్రయించదలిచారని తెలుసుకొని కొనుగోలుదారులు  షెడ్యూల్ ఆస్థిని రూపాయలు  ${data.amount}/- కు కొనుగోలు చేయడానికి ప్రతిపాదించారు. విక్రయదారులు కొనుగోలుదారుల ప్రతిపాదన ప్రస్తుత మార్కెట్ విలువకు దగ్గరగా వున్నందున సముచితంగా భావించి షెడ్యూల్ ఆస్థిని విక్రయించడానికి అంగీకరించారు.`,{ align: 'justify', lineGap: 0 })
            pdfDocs.fontSize('13').text(`ఈ క్రింది విషయములను ఈ విక్రయ దస్తావేజు ధ్రువపరుచుచున్నది :`,{align:'left',underline:true,lineGap:0})
            pdfDocs.fontSize('13').text(`పైన చెప్పబడిన ప్రతిపాదనను పరిగణనలోకి తీసుకొని కొనుగోలుదారులు విక్రయాదారులకు పూర్తి క్రయ ప్రతిఫలము రూపాయలు ${data.amount} ఈ క్రింది విధముగా అందజేసియున్నారు:`,{ align: 'justify', lineGap: 0 })
            if(data?.payment && data?.payment.length >0){			
                let payNo = 0;
                for(let i in data?.payment){
                    let payinword = await NumToWord(data?.payment[i]?.payAmount);
                    let payDate = new Date(data?.payment[i]?.dateOfPayment).toLocaleDateString();
                    payNo = payNo +1;
                    if(payNo ==1){
                        
                        switch (data.payment[i].paymentMode) {
                            case "CASH":
                                pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} Dated ${payDate}.`,{align:"left"})
                                break;
                            case "UPI":
                                pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} ,transactionNo:${data.payment[i].transactionNo}, Dated ${payDate}.`,{align:"right",marginLeft:'30'})
                                break;
                            case "CHEQUE":
                                pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode},checkNo ${data.payment[i].checkNo},branch:${data.payment[i].bankName},${data.payment[i].branchName} Dated ${payDate}.`)
                                break;
                            case "NEFT/RTGS":
                                pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode},branch:${data.payment[i].bankName},utrNo:${data.payment[i].utrNumber} Dated ${payDate}.`)
                                break;
                            default:
                                break;
                        }
                        // pdfDocs.fontSize('13').text(`${payNo}. Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} Dated ${payDate}.`)
                    }else{
                        // pdfDocs.fontSize('13').text(`${payNo}. Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} Dated ${payDate}.`)
                        switch (data.payment[i].paymentMode) {
                            case "CASH":
                                pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} Dated ${payDate}.`)
                                break;
                            case "UPI":
                                pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} ,transactionNo:${data.payment[i].transactionNo}, Dated ${payDate}.`)
                                break;
                            case "CHEQUE":
                                pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode},checkNo ${data.payment[i].checkNo},branch:${data.payment[i].bankName},${data.payment[i].branchName} Dated ${payDate}.`)
                                break;
                            case "NEFT/RTGS":
                                pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode},branch:${data.payment[i].bankName},utrNo:${data.payment[i].utrNumber} Dated ${payDate}.`)
                                break;
                            default:
                                break;
                        }
                    }
                }
                pdfDocs.fontSize('13').text(`మరియు ఈ చెల్లింపు ను అమ్మినవారు పుచ్చుకొన్నట్లు అంగీకరించారు`)
                
            };
            pdfDocs.fontSize('13').text(`           విక్రయదారులు పై విధంగా చెల్లించబడిన క్రయ ప్రతిఫలం పూర్తిగా అందినదని ధృవీకరించుచూ షెడ్యూల్ ఆస్థి పై వారికి గల హక్కులు, టైటిల్ మరియు ఆసక్తి, క్లెయిమ్ మరియు డిమాండ్‌ను అన్నింటిని యీజ్ మెంట్ హక్కులతో ఈ విక్రయ దస్తావేజు ద్వారా  బదిలీ చేయడం మరియు కేటాయించడం జరిగింది. షెడ్యూల్‌లో పేర్కొన్న ఆస్థిని ఈ రోజున కొనుగోలుదారులకు స్వాధీనము చేయడ మైనది. ఇంతటి నుండి కొనుగోలుదారులు  షెడ్యూల్ ఆస్థిని సుఖాన స్వేఛ్చగా  సంపూర్ణ హక్కులతో అనుభవించుటకు నిర్ణయము.\n`,{ align: 'left', lineGap: 0 })
            pdfDocs.fontSize('13').text(`2).  షెడ్యూలు ఆస్థి పై ఏవిధమైన తనఖాలు, ఛార్జీలు, విక్రయ ఒప్పందాలు, కోర్టు వ్యాజ్యాలు మరియు ఇతర ఛార్జీలు లేవని విక్రయదారులు కొనుగోలుదారులకు హామీ ఇస్తున్నారు.\n`,{align:'left',lineGap:1});
            pdfDocs.fontSize('13').text(`3).  తెలిసి గాని తెలియకగాని షెడ్యూలు ఆస్తిపై ఎటువంటి ఋణ భారములను కలిగియుండలేదని విక్రయదారులు కొనుగోలుదారులకు హామీ ఇస్తున్నారు.\n`,{align:'left',lineGap:1});
            pdfDocs.fontSize('13').text(`4).  విక్రయదారులు షెడ్యూలు ఆస్థికి స్పష్టమైన, ప్రభావవంతమైన, విక్రయించదగిన హక్కులు కలిగియున్నారనియు  మరియు విక్రయించడానికి సంపూర్ణ అధికారం కలదని  కొనుగోలుదారులకు భరోసా ఇస్తున్నారు.\n`,{align:'left',lineGap:1});
            pdfDocs.fontSize('13').text(`5).  షెడ్యూలు ఆస్థికి సంబంధించి ఏదైనా బహిర్గతం కాని మరియు విడుదల చేయని తాకట్టు మిగిలి ఉంటే, దానిని క్లియర్ చేసి, కొనుగోలుదారులను దాని నుండి విముక్తి చేయగలవారమని విక్రయదారులు హామీ ఇస్తున్నారు.\n`,{align:'left',lineGap:1});
            pdfDocs.fontSize('13').text(`6).  ఈ అమ్మకానికి సంబంధించి ఎవరైనా ఎప్పుడైనా ఏదైనా క్లెయిమ్ లేదా వివాదాన్ని లేవనెత్తినట్లయితే, విక్రయదారులు వాటిని తమ స్వంత బాధ్యతపై నివారించి తమ స్వంత ఖర్చుతో దానిని పరిష్కరించి ఈ క్రయం అమలు చేయగలమని విక్రయదారులు కొనుగోలుదారులకు హామీ ఇస్తున్నారు.\n`,{align:'left',lineGap:1});
            pdfDocs.fontSize('13').text(`7).  ఈ రోజు వరకు మునిసిపల్ కార్పొరేషన్ లేదా ఇతర ప్రభుత్వ సంస్థలు లేదా చట్ట పరమైన అధికారులకు షెడ్యూలు ఆస్థికి పన్ను బకాయిలు ఉంటే, విక్రయదారులు దానిని క్లియర్ చేయగలవారమని కొనుగోలుదారులకు  హామీ ఇస్తున్నారు. ఒక వేళ పన్ను బకాయిలు కొనుగోలుదారులు చెల్లించినట్లైతే  విక్రయదారులు దానిని తిరిగి చెల్లించగలమని హామీ ఇస్తున్నారు\n`,{align:'left',lineGap:1});
            pdfDocs.fontSize('13').text(`8).  కొనుగోలుదారులు మరియు వారి వారసులు విక్రయాదారుల ద్వారా అనుమతి  పొందిన ఏ వ్యక్తి నుండి ఆటంకం లేకుండా షెడ్యూలు ఆస్థిని శాంతియుతంగా మరియు సంపూర్ణ హక్కులతో అనుభవించుటకు అర్హులు అని విక్రయదారులు హామీ ఇస్తున్నారు\n`,{align:'left',lineGap:1});
            pdfDocs.fontSize('13').text(`9).  షెడ్యూలు ఆస్థిని అన్ని స్థానిక సంస్థల రికార్డులు మరియు ఇతర రెవెన్యూ రికార్డులలో కొనుగోలుదారుల పేరు మీద బదిలీ చేయించుకొని ఎప్పటికీ సంపూర్ణ హక్కులతో అనుభవించుటకు అర్హులు అని విక్రయదారులు భరోసా ఇస్తున్నారు.\n`,{align:'left',lineGap:1});
            if (covenantArr && covenantArr.length > 0) {
                for (let i of covenantArr) {
                    pdfDocs.fontSize('13').text(`${i}`, { align: 'justify', lineGap: 1 });
                }
            }
            pdfDocs.addPage();
            //property
            if(data?.property && data.property?.length >0){
                let propLangth = data.property.length;
                let tMValue=0;
                let dataI =0;
                pdfDocs.fontSize('13').text(`షెడ్యూలు ఆస్తి వివరము`,{align:'center',lineGap:0,underline:true});
                pdfDocs.moveDown();
                for(let i of data.property){
                    
                    dataI = dataI ===0 ? 1 : dataI + 1;
                    tMValue = tMValue + i.marketValue
                    x1=40,y1=180;
                    let [landUse,rest1] =i.landUse.split('[')
                    pdfDocs.fontSize('13').text(`షెడ్యూల్ ${i.seqNumber} : ${toTitleCase(landUse)}`,x1,130,{align:'left',lineGap:0});
                    pdfDocs.fontSize('13').text(`ఆస్తి యుండు ప్రదేశము`,x1,160,{align:'left',lineGap:0});
                    pdfDocs.moveDown();
                    let header1='రిజిస్ట్రేషన్ జిల్లా';
                    // i.sroOffice ="YYYYYYYYYYYYYY"
                    // i.mandal= "tripuranthakam"
                    // console.log("&&&&&&&&&&&&&&&&&&&&&&&&",String(i.sroOffice).length,String(i.village).length,String(i.mandal).length)
                    // let rowHeight ;
                    // let vgHeight,mdHight,sroHight;
                    // vgHeight =String(i.village).length;
                    // mdHight = String(i.mandal).length;
                    // sroHight = String(i.mandal).length;
                    let Dist = await toTitleCase(i.district);
                    let sroOffice = await toTitleCase(i.sroOffice);
                    let village = await toTitleCase(i.village);
                    let mandal = await toTitleCase(i.mandal);
                    pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,20).moveTo(150,180).lineTo(150,200).moveDown(0.1)
                    .text(header1,x1+2,y1+2,{indent:5, align:'left',fontSize:'16'}).moveTo(300,180).lineTo(300,200)
                    .text(`సబ్ రిజిస్ట్రార్ కార్యాలయము`,x1+112,y1+2,{indent:5, align:'left',fontSize:'16'})
                    .moveTo(430,180).lineTo(430,200)
                    .text(`రెవెన్యూ గ్రామము`,x1+262,y1+2,{indent:5, align:'left',fontSize:'16'})
                    .text(`మండలము`,x1+392,y1+2,{indent:5, align:'left',fontSize:'16'})
                    .moveTo(150,180).lineTo(150,220)
                    .text(`${Dist}`,x1+2,y1+22,{indent:5, align:'left',fontSize:'16'})
                    .moveTo(300,200).lineTo(300,220)
                    .text(`${sroOffice}`,x1+112,y1+22,{width:140,indent:5, align:'left',fontSize:'16'})
                    .moveTo(430,200).lineTo(430,220)
                    .text(`${village}`,x1+259,y1+22,{width:120,indent:5, align:'left',fontSize:'16'})
                    .text(`${mandal}`,x1+388,y1+22,{width:122,indent:5, align:'left',fontSize:'16'})
                    .lineWidth(1).stroke();
                    x1= 40;y1=187;
                    // pdfDocs.text('jsshggssf',x1,y1+40)
                    pdfDocs.moveDown()
                    let lBD =""
                    if(String(i.localBodyType).includes('[')){
                        let [rest,localbody]= i.localBodyType.split('[');
                        let [localbody2,rest2] = localbody.split(']');
                        lBD=localbody2;
                    }

                    pdfDocs.rect(x1,y1+40,500,20).rect(40,y1+60,500,20).moveTo(300,y1+40).lineTo(300,y1+60)
                    .text(`రెవెన్యూ జిల్లా`,42,y1+42,{indent:5, align:'left',fontSize:'16'})
                    .text(`స్థానిక సంస్థ / పంచాయతీ`,300,y1+42,{indent:5, align:'left',fontSize:'16'})
                    .moveTo(300,y1+60).lineTo(300,y1+80)
                    .text(`${toTitleCase(i.district)}`,42,y1+62,{indent:5, align:'left',fontSize:'16'})
                    .text(`${toTitleCase(lBD)}`,300,y1+62,{indent:5, align:'left',fontSize:'16'})
                    .lineWidth(1).stroke();
                    x1=40;y1=262+10;
                    pdfDocs.fontSize('13').text(`ఆస్థి సర్వే విస్తీర్ణము మరియు విలువలు వివరములు (రూల్-3 స్టేటుమెంటు):`,x1,y1);

                    let locality = i.locality != "" ? toTitleCase(locality) : toTitleCase(i.habitation);
                    let propType = i.propertyType.includes('RURAL') ? 'RURAL':'URBAN';
                    y1=y1+20;
                    pdfDocs.fontSize('13').text(`Locality : ${locality}`,x1,y1);
                    if(propType === "URBAN"){
                        pdfDocs.rect(x1,y1+20,500,20).rect(x1,y1+40,500,20).moveTo(x1+55,y1+20).lineTo(x1+55,y1+60)
                        .text(`Ward`,x1+2,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(134,y1+20).lineTo(134,y1+60)
                        .text(`Block`,x1+57,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(182,y1+20).lineTo(182,y1+60)
                        .text(`Door`,x1+100,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(250,y1+20).lineTo(250,y1+60)
                        .text(`Survey No`,x1+140,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(330,y1+20).lineTo(330,y1+60)
                        .text(`Total Extent`,x1+207,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(400,y1+20).lineTo(400,y1+60)
                        .text(`Undivided`,x1+286,y1+22,{indent:5, align:'left',fontSize:'16'})
                        .text(`Market value`,x1+366,y1+22,{indent:5, align:'left',fontSize:'16'})
                        // .text(`Market value`,x1+400,y1+42,{indent:5, align:'left',fontSize:'16'}).moveTo(440,y1+40).lineTo(440,y1+80)

                        .text(`${i.ward}`,42,y1+42,{indent:5, align:'left',fontSize:'16'})
                        .text(`${i.block}`,x1+57,y1+42,{indent:5, align:'left',fontSize:'16'})
                        .text(`${i.doorNo}`,x1+102,y1+42,{indent:5, align:'left',fontSize:'16'})
                        .text(`${i.survayNo}`,x1+145,y1+42,{indent:5, align:'left',fontSize:'16'})
                        .text(`${i.extent}`,x1+208,y1+42,{indent:5, align:'left',fontSize:'16'})
                        .text(`${i.undividedShare}`,330,y1+42,{indent:5, align:'left',fontSize:'16'})
                        .text(`${i.marketValue}`,400,y1+42,{indent:5, align:'left',fontSize:'16'})
                        //.text(`${i.marketValue}`,x1+402,y1+62,{indent:5, align:'left',fontSize:'16'})
                        .lineWidth(1).stroke();
                        let [scProp,rest] = i.schedulePropertyType.split('[');
                        scProp= scProp.trim();
                        if(scProp =="FLAT" || scProp =="HOUSE"){
                            pdfDocs.text(`Structure Details :`,40,y1+60,{align:'left'});
                        }
                        if(scProp =="FLAT"){
                            pdfDocs.text(`Apartment Name : ${toTitleCase(i.appartmentName)}`,40,y1+80,{align:'left'});
                            pdfDocs.text(`No of Floors : ${i.totalFloors}`,110,y1+80,{align:'right'});
                        }
                        pdfDocs.moveDown();
                        
                        // pdfDocs.text('sudhakar',x1,y1)
                        if(i.structure && i.structure.length >0){
                            x1=40, y1=y1+95;
                            for(let j in i.structure){
                                let [strType,rest] = i.structure[j].structureType.split('[');
                                let [stageOfCons,rest2] = i.structure[j].stageOfCons.split('[');
                                let rowHeight = String(stageOfCons).length >16 ?40 :20;
                                let rowLine = String(stageOfCons).length >16 ? 60:40
                                pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,rowHeight).moveTo(x1+85,y1).lineTo(x1+85,y1+rowLine)
                                .text(`floorNo`,x1+2,y1+2,{indent:5, align:'left',fontSize:'16'}).moveTo(x1+230,y1).lineTo(x1+230,y1+rowLine)
                                .text(`Structure type`,x1+105,y1+2,{indent:5, align:'left',fontSize:'16'}).moveTo(x1+303,y1).lineTo(x1+303,y1+rowLine)
                                .text(`Plinth`,x1+235,y1+2,{indent:5, align:'left',fontSize:'16'}).moveTo(x1+462,y1).lineTo(x1+462,y1+rowLine)
                                .text(`Stage of Cons`,x1+304,y1+2,{indent:5, align:'left',fontSize:'16'})
                                .text(`Age`,x1+464,y1+2,{indent:5, align:'left',fontSize:'16'})
                                .text(`${i.structure[j].floorNo}`,x1+2,y1+22,{indent:5, align:'left',fontSize:'16'})
                                .text(`${toTitleCase(strType)}`,x1+85,y1+22,{width:150,indent:5, align:'left',fontSize:'16'})
                                .text(`${i.structure[j].plinth}`,x1+235,y1+22,{indent:5, align:'left',fontSize:'16'})
                                .text(`${toTitleCase(stageOfCons)}` ,x1+304,y1+22,{width:200,indent:5, align:'left',fontSize:'16'})
                                .text(`${i.structure[j].age}`,x1+464,y1+22,{indent:5, align:'left',fontSize:'16'})
                                .lineWidth(1).stroke();
                                // pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,40).moveTo(x1+85,y1).lineTo(x1+85,y1+40)
                                // .lineWidth(1).stroke();
                            }
                        }


                        if(scProp == "FLAT"){
                            x1=40,y1=y1+22+60;
                            pdfDocs.text(`Flat Boundary Details :`,x1,y1);
                            x1=40,y1=y1+20;
                            let east = await  toTitleCase(i.flatEastBoundry)
                            let west = await  toTitleCase(i.flatWestBoundry)
                            let north = await  toTitleCase(i.flatNorthBoundry)
                            let south = await  toTitleCase(i.flatSouthBoundry)
                            pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,20).rect(x1,y1+40,500,20).rect(x1,y1+60,500,20).moveTo(x1+100,y1).lineTo(x1+100,y1+80)
                            .text(`EAST`,x1+2,y1+2,{indent:5, align:'left',fontSize:'16'})
                            .text(`WEST`,x1+2,y1+22,{indent:5, align:'left',fontSize:'16'})
                            .text(`NORTH`,x1+2,y1+42,{indent:5, align:'left',fontSize:'16'})
                            .text(`SOUTH`,x1+2,y1+62,{indent:5, align:'left',fontSize:'16'})
                            .text(`${east}`,x1+102,y1+2,{indent:5, align:'left',fontSize:'16'})
                            .text(`${west}`,x1+102,y1+22,{indent:5, align:'left',fontSize:'16'})
                            .text(`${north}`,x1+102,y1+42,{indent:5, align:'left',fontSize:'16'})
                            .text(`${south}`,x1+102,y1+62,{indent:5, align:'left',fontSize:'16'})
                            .lineWidth(1).stroke();
                        }

                        
                        x1=40,y1=y1+62+20;
                        pdfDocs.text(`Apartment Boundary Details :`,x1,y1);
                        x1=40,y1=y1+20;
                        // pdfDocs.rect(x1,y1)
                        let eastBry = await  toTitleCase(i.eastBoundry);
                        let westBry = await  toTitleCase(i.westBoundry);
                        let northBry = await  toTitleCase(i.northBoundry);
                        let southBry = await  toTitleCase(i.southBoundry);
                        pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,20).rect(x1,y1+40,500,20).rect(x1,y1+60,500,20).moveTo(x1+100,y1).lineTo(x1+100,y1+80)
                        .text(`EAST`,x1+2,y1+2,{indent:5, align:'left',fontSize:'16'})
                        .text(`WEST`,x1+2,y1+22,{indent:5, align:'left',fontSize:'16'})
                        .text(`NORTH`,x1+2,y1+42,{indent:5, align:'left',fontSize:'16'})
                        .text(`SOUTH`,x1+2,y1+62,{indent:5, align:'left',fontSize:'16'})
                        .text(`${eastBry}`,x1+102,y1+2,{indent:5, align:'left',fontSize:'16'})
                        .text(`${westBry}`,x1+102,y1+22,{indent:5, align:'left',fontSize:'16'})
                        .text(`${northBry}`,x1+102,y1+42,{indent:5, align:'left',fontSize:'16'})
                        .text(`${southBry}`,x1+102,y1+62,{indent:5, align:'left',fontSize:'16'})
                        .lineWidth(1).stroke();
                        pdfDocs.addPage();
                    }else if(propType === "RURAL"){
                        pdfDocs.rect(x1,y1+40,500,20).rect(x1,y1+60,500,20).moveTo(150,y1+40).lineTo(150,y1+80)
                        .text(`సర్వే/సబ్ నెంబర్. లు`,x1+2,y1+42,{indent:5, align:'left',fontSize:'16'}).moveTo(300,y1+40).lineTo(300,y1+80)
                        .text(`బదలాయించు విస్తీర్ణము`,x1+112,y1+42,{indent:5, align:'left',fontSize:'16'})
                        .text(`మార్కెట్ విలువ`,x1+262,y1+42,{indent:5, align:'left',fontSize:'16'})
                        .text(`${i.survayNo}`,42,y1+62,{indent:5, align:'left',fontSize:'16'})
                        .text(`${i.tExtent}`,152,y1+62,{indent:5, align:'left',fontSize:'16'})
                        .text(`${i.marketValue}`,302,y1+62,{indent:5, align:'left',fontSize:'16'})
                        .lineWidth(1).stroke();
                        x1=40;y1=y1+62+40;

                        pdfDocs.rect(x1,y1,500,20).rect(40,y1+20,500,20).rect(40,y1+40,500,20).rect(40,y1+60,500,20).moveTo(150,y1).lineTo(150,y1+80)
                        .text(`తూర్పు`,42,y1+2,{indent:5, align:'left',fontSize:'16'})
                        .text(`పడమర`,42,y1+22,{indent:5, align:'left',fontSize:'16'})
                        .text(`ఉత్తరం`,42,y1+42,{indent:5, align:'left',fontSize:'16'})
                        .text(`దక్షణం`,42,y1+62,{indent:5, align:'left',fontSize:'16'})
                
                        .text(`${toTitleCase(i.eastBoundry)}`,152,y1+2,{indent:5, align:'left',fontSize:'16'})
                        .text(`${toTitleCase(i.westBoundry)}`,152,y1+22,{indent:5, align:'left',fontSize:'16'})
                        .text(`${toTitleCase(i.northBoundry)}`,152,y1+42,{indent:5, align:'left',fontSize:'16'})
                        .text(`${toTitleCase(i.southBoundry)}`,152,y1+62,{indent:5, align:'left',fontSize:'16'})
                        .lineWidth(1).stroke();
                        if(propLangth === dataI){
                            x1=40;y1=y1+62+20;
                            pdfDocs.fontSize('12').text(`సుంకం నిర్ధారణ నిమిత్తం :`,x1+2,y1,{align:'left'});
                            x1=40;y1=y1+40;
                            pdfDocs.rect(x1,y1,500,20).moveTo(320,y1).lineTo(320,y1+20)
                            .text(`ఛార్జ్ చేయదగిన విలువ (తదుపరి 500/- వరకు)`,42,y1+2,{indent:5, align:'left',fontSize:'16'})
                            .text(`${tMValue}`,320,y1+2,{indent:5, align:'left',fontSize:'16'})
                            .lineWidth(1).stroke();
                        }
                        pdfDocs.addPage();
                    }
                    // x1=40;y1=y1+62+40;

                    // if(y1 === 300){
                    // 	pdfDocs.addPage();
                    // }
                }
            }
            pdfDocs.fontSize(16).text(`రిజిస్ట్రేషన్ చట్టము, 1908 నందలి సెక్షన్ 22-B ననుసరించి చేయు ప్రకటన :\n`,{align:'center',underline:true});
			pdfDocs.fontSize(13).text(`షెడ్యూలు దాఖలా ఆస్తిని గాని అందలి కొంత భాగమును గాని ఈ దస్తావేజునందలి బదిలీ దారులు స్వయంగా గాని రెప్రెసెంటేటివ్ లు, అస్సయినీలు, ఏజెంట్ల ద్వారా గాని మరి ఏ ఇతరలకు రిజిస్టరైన దస్తావేజు ద్వారా  బదలాయించలేదని ఇందు మూలము గా ప్రకటించడమైనది.  ఈ ఆస్తి ఏ దస్తావేజు ద్వారా బదిలీ దారులకు సంక్రమించి యున్నదో ఆ దస్తావేజు ఏ న్యాయస్థానము యొక్క ఉత్తర్వుల ద్వారా రద్దు చేయబడలేదని ప్రకటించడమైనది. ఈ ప్రకటన అవాస్తవమని నిరూపించబడిన యెడల చట్ట ప్రకారము మాపై తీసుకొనబడు చర్యలకు బద్దులమై ఉండుటయే కాక బదిలీదారులకు వాటిల్లిన నష్టమును భర్తీ చేయగలవారమని ప్రకటించడమైనది.`,{align:'left'});
			pdfDocs.moveDown();
			pdfDocs.fontSize(13).text(`షెడ్యూలు దాఖలా ఆస్తి ప్రభుత్వ ఆస్తి గాని అస్సయిండ్ ఆస్తి గాని వక్ఫ్ బోర్డ్ కు చెందిన ఆస్తి గాని దేవాదాయ శాఖకు చెందిన ఆస్తి గాని కాదని ఇందు మూలము గా ప్రకటించడమైనది.`,{align:'left'});  
            pdfDocs.addPage()
            x1=40;y1=20;
            pdfDocs.fontSize('13').text(`అమలు వివరాలు`,x1,y1,{align:'left',lineGap:0,underline:true});
            x1=40;y1=y1+20;
            pdfDocs.fontSize('13').text(`ఈ దస్తావేజు లోని అన్ని విషయములను క్షుణ్ణముగా అర్ధము చేసుకొని సంతృప్తి చెంది సంపూర్ణ అంగీకారముతో ఈ దిగువ సాక్షుల సమక్షమున సంతకములు చేయడమైనది.`,x1,y1,{align:'left',lineGap:0});
            x1=40;y1=y1+60;
            pdfDocs.fontSize('15').text(`అమ్మినవారు :`,40,y1,{align:'left'});
            if(data?.executent && data?.executent.length >0){
                let exNo =1
                for(let i of data.executent){
                    let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0,8),"XXXX XXXX XXXX ") : "xxxx xxxx xxxx";
                    let panOrTanOrForm60Header = i.panNoOrForm60or61 ? "PAN/Form60" :i.panNoOrForm60or61 ==="" && i.tan ==="" ? "PAN/Form60" :"TAN";
                    let panOrTanOrForm60Value = i.panNoOrForm60or61 ? i.panNoOrForm60or61 : i.tan;
                    if(y1 >= 580){
                        pdfDocs.addPage();
                        y1 =100+50;
                    }
                    y1= y1+30;
                    pdfDocs.fontSize('12').text(`${exNo}`,60,y1,{align:'left'});
                    y1= y1+30;
                    pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: ${toTitleCase(i.name)}`+'\n'+`ఆధార్ నెంబర్ : ${aadhar}`+'\n'+`${panOrTanOrForm60Header} : ${panOrTanOrForm60Value}`,80,y1,{align:'left'});
                    exNo = exNo+1;
                    y1 =y1+50;
                }
            }else{
                y1= y1+30;
                pdfDocs.fontSize('12').text(`${"1"}`,60,y1+30,{align:'left'});
                y1= y1+30;
                pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: XXXXXXX`+'\n'+`ఆధార్ నెంబర్ :XXXXXX`+'\n'+'FORM60',80,y1,{align:'left'});;
                y1= y1+30;
            }
            y1 = y1+50;
            pdfDocs.fontSize('15').text(`కొనుగోలుదారు :`,40,y1,{align:'left'});
            let exNo =1
            if(data?.claimant && data?.claimant.length >0){
                for(let i of data?.claimant){
                    let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0,8),"XXXX XXXX XXXX ") : "xxxx xxxx xxxx";
                    let panOrTanOrForm60Header = i.panNoOrForm60or61 ? "PAN/Form60" :i.panNoOrForm60or61 ==="" && i.tan ==="" ? "PAN/Form60" :"TAN";
                    let panOrTanOrForm60Value = i.panNoOrForm60or61 ? i.panNoOrForm60or61 : i.tan;
                    y1= y1+30;
                    pdfDocs.fontSize('12').text(`${exNo}`,60,y1,{align:'left'});
                    let name = i.name ? toTitleCase(i.name) :"";
                    let adhar = i.aadhaar ? i.aadhaar :""
                    y1= y1+30;
                    pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: ${toTitleCase(i.name)}`+'\n'+`ఆధార్ నెంబర్ : ${aadhar}`+'\n'+`${panOrTanOrForm60Header} : ${panOrTanOrForm60Value}`,80,y1,{align:'left'});
                    exNo = exNo+1;
                    y1 =y1+50;
                }
            pdfDocs.moveDown();
            pdfDocs.fontSize('13').text(`యిందుకు సాక్షులు`,{align:'left',lineGap:0});
            pdfDocs.fontSize('13').text(`1. `,{align:'left',lineGap:0});
            pdfDocs.fontSize('13').text(`2. `,{align:'left',lineGap:0});
                
            }else{
                y1= y1+30;
                pdfDocs.fontSize('12').text(`${"1"}`,60,y1+30,{align:'left'});
                y1= y1+30;
                pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: XXXXXXX`+'\n'+`ఆధార్ నెంబర్ :XXXXXX`+'\n'+'FORM60',80,y1,{align:'left'});
                y1= y1+30;
            pdfDocs.moveDown();
            pdfDocs.fontSize('13').text(`యిందుకు సాక్షులు`,{align:'left',lineGap:0});
            pdfDocs.fontSize('13').text(`1. `,{align:'left',lineGap:0});
            pdfDocs.fontSize('13').text(`2. `,{align:'left',lineGap:0});
            }
            pdfDocs.end();
            createFileData.on('finish', resolve);

        })

    } catch (ex) {
        console.log("ERROR ::", ex.message);
        throw new PDEError(ex.message);
    }

}

const toTitleCase = (phrase) => {
	phrase = phrase.replace( / +/g, ' ');
	return phrase
	  .toLowerCase()
	  .split(' ')
	  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
	  .join(' ');
};

function NumToWord(amount) {
    var str = new String(amount)
    var splt = str.split("");
    var rev = splt.reverse();
    var once = ['Zero', ' One', ' Two', ' Three', ' Four', ' Five', ' Six', ' Seven', ' Eight', ' Nine'];
    var twos = ['Ten', ' Eleven', ' Twelve', ' Thirteen', ' Fourteen', ' Fifteen', ' Sixteen', ' Seventeen', ' Eighteen', ' Nineteen'];
    var tens = ['', 'Ten', ' Twenty', ' Thirty', ' Forty', ' Fifty', ' Sixty', ' Seventy', ' Eighty', ' Ninety'];

    numLength = rev.length;
    var word = new Array();
    var j = 0;

    for (i = 0; i < numLength; i++) {
        switch (i) {

            case 0:
                if ((rev[i] == 0) || (rev[i + 1] == 1)) {
                    word[j] = '';
                }
                else {
                    word[j] = '' + once[rev[i]];
                }
                word[j] = word[j];
                break;

            case 1:
                aboveTens();
                break;

            case 2:
                if (rev[i] == 0) {
                    word[j] = '';
                }
                else if ((rev[i - 1] == 0) || (rev[i - 2] == 0)) {
                    word[j] = once[rev[i]] + " Hundred ";
                }
                else {
                    word[j] = once[rev[i]] + " Hundred and";
                }
                break;

            case 3:
                if (rev[i] == 0 || rev[i + 1] == 1) {
                    word[j] = '';
                }
                else {
                    word[j] = once[rev[i]];
                }
                if ((rev[i + 1] != 0) || (rev[i] > 0)) {
                    word[j] = word[j] + " Thousand";
                }
                break;

                
            case 4:
                aboveTens();
                break;

            case 5:
                if ((rev[i] == 0) || (rev[i + 1] == 1)) {
                    word[j] = '';
                }
                else {
                    word[j] = once[rev[i]];
                }
                if (rev[i + 1] !== '0' || rev[i] > '0') {
                    word[j] = word[j] + " Lakh";
                }
                 
                break;

            case 6:
                aboveTens();
                break;

            case 7:
                if ((rev[i] == 0) || (rev[i + 1] == 1)) {
                    word[j] = '';
                }
                else {
                    word[j] = once[rev[i]];
                }
                if (rev[i + 1] !== '0' || rev[i] > '0') {
                    word[j] = word[j] + " Crore";
                }                
                break;

            case 8:
                aboveTens();
                break;

            default: break;
        }
        j++;
    }

    function aboveTens() {
        if (rev[i] == 0) { word[j] = ''; }
        else if (rev[i] == 1) { word[j] = twos[rev[i - 1]]; }
        else { word[j] = tens[rev[i]]; }
    }

    word.reverse();
    var finalOutput = '';
    for (i = 0; i < numLength; i++) {
        finalOutput = finalOutput + word[i];
    }
	return finalOutput;
}

module.exports ={engGenarateDocs,telGenarateDocs};