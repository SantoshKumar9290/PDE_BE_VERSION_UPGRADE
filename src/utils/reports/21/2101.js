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
        pdeStyle.content.push({text:`${subDesc} DEED`.toUpperCase(),alignment: 'center',bold:true,decoration:'underline',margin:[10,y,0,0]});
        pdeStyle.content.push(' ');
        pdeStyle.content.push({text:`This ${subDesc.toUpperCase()} DEED is made and executed on ${data.executionDate}, by :`, style:['p1sideHeaders']});
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
                        text:`\n (Hereinafter called the 1st Party which expression shall be deemed to include their heirs, successors, representatives and assignees.) `
                    })
                    pdeStyle.content.push({
                        text:'IN FAVOUR OF'.toUpperCase(),alignment: 'center',bold:true
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
        }
        pdeStyle.content.push({text:'AND',alignment: 'center',bold:true,decoration:'underline',margin:[10,10,0,0]});
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
                        text:`\n (Hereinafter called the 2nd Party expression shall be deemed to include their heirs, successors, representatives and assignees.) `
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
            // pdeStyle.content.push({text: `Herein after called the '${partyType2}' of the second part`,style:["p1Points"]});
        }else{
            pdeStyle.content.push({
                text:`\nMr/Mrs. ................, ......................... , aged about ............ years,Presently residing at ....................`,style:["p1Text"]
            });
        }
        
        if(data.covanants?.acquireCovenents && data.covanants?.acquireCovenents.length >0){
            let aqCovanents=[]
            //pdeStyle.content.push({text:`How the Property is Aquired :`,style:['p1Text_MR']})
            let sNo=1;
            data?.covanants.acquireCovenents.map((aqcv)=>{
                let val = sNo ===1 ? `${aqcv.value}` : `\n${aqcv.value}`
                aqCovanents = [...aqCovanents,val];
            })
            for(let i of aqCovanents){
                pdeStyle.content.push({text:`${i}`,style:['p1Text_MR']})
            }
        }
        
        if(TRAN_DESC){
           
           // pdeStyle.content.push({text:`\n NOW THIS DEED OF GIFT WITNESSES AS FOLLOWS  :`,style:['sideHeaderNames']})
            let sNo =1
            let cvStaticArry =[];        
            covanantsData.Authority.map((cv)=>{
                if(cv.minDocNum == data.documentNature.TRAN_MIN_CODE){
                    let val = sNo ===1 ? `${sNo}.${cv.value}` : `\n${sNo}.${cv.value}`
                    cvStaticArry = [...cvStaticArry,val];
                    sNo =sNo+1;
                }

            });
            pdeStyle.content.push({text:cvStaticArry,style:["covanants"]});
            pdeStyle.content.push({text:covenantArr,style:["covanants"]});
            
        }
        pdeStyle.content.push({
            text:`Whereas the 2nd Party is the wife of the 1st Party. Both of them wanted to adopt a child, but could not do so far. The 1st Party herein hereby authorize the 2nd Party herein to adopt a child of her choice after the demise of the 1st party, if they could not adopt a child during the life time of the 1st Party. This authority to adopt is executed in the presence of the below signed  witnesses voluntarily in sound disposing state of mind.`,style:["p1Text"]
        });
        
        pdeStyle.content.push({text:`\n party :`,style:['p1last_MRleft']})
        if(data?.executent && data?.executent.length >0){
            let exNo =1
            for(let i of data.executent){
                let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0,8),"XXXX XXXX XXXX ") : "xxxx xxxx xxxx"; 
                pdeStyle.content.push({text:`${exNo}`});
                pdeStyle.content.push({text:`Name: ${toTitleCase(i.name)}`+'\n'+`Aadhar : ${aadhar}`,style:['p1last_MRleft']});
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

const telGenarateDocs = async(data,path)=>{
    try{
        return new Promise( async (resolve, reject) => {
            let [naturetype ,rest]= data.registrationType.TRAN_DESC.split(" ");
			let DocNum = data.documentNature.TRAN_MAJ_CODE;
			let [rest2,disc] = data.documentNature.TRAN_DESC.split("[");
			let [subDesc,rest3]=disc.split("]");
            var [dd,m,yyyy] = data.executionDate.split("/");
			// var dd = String(exDate.getDate()).padStart(2, '0');
			var mm = new Date(`${yyyy}-${m}-${dd}`).toLocaleDateString('en-US',{month:'long'})
			let covenantArr=[];
			if(data?.covanants){
				let sNo =DocNum ==="01" ? 6 : DocNum ==="02"? 8 : DocNum ==="03"? 4: DocNum ==="07" ? 12: DocNum === "05"? 9: DocNum === "06"?  9: DocNum === "04"? 8: DocNum == "09"? 10: 7;
				data?.covanants?.covanants.map((covn)=>{
					let val = sNo ===6 || sNo ===8|| sNo ===7 ? `${sNo}. ${covn.value}` : `\n${sNo}. ${covn.value}`
					covenantArr = [...covenantArr,val];
					sNo =sNo+1;
				})
			};
            let y = data.eStamp === "N" ? 400 : 500;
			let pdfDocs = new pdfDoc();
			let createFileData;
			pdfDocs.pipe(createFileData = fs.createWriteStream(path));
			pdfDocs.font(Path.join(__dirname,'../../../../fonts','telugu.ttf'));
            pdfDocs.fontSize('18').text(`${subDesc}`,40,y,{align:'center',underline:true});
            pdfDocs.fontSize('13').text(`రూ ${data.amount} రూపాయలు విలువగల స్థిరాస్తి ${subDesc}.`,{align:'center'});
            pdfDocs.fontSize('13').text(`ఈ ${subDesc} ${yyyy} వ సంవత్సరం ${mm} నెల ${dd} వ తేదీన వ్రాయబడింది.`,{align:'center'});
            pdfDocs.fontSize('15').text(`వ్రాయించిఇచ్చువారు :`,{align:'left',underline:true});
            if(data.executent && data.executent.length >0){
                for(let i of data.executent){
                    let add = i.address.split("\n").join("")
                    add= add.split(" ").join("");
                pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. ${toTitleCase(i.name)}, ${i.relationType}.${toTitleCase(i.relationName)}, వయస్సు ${i.age} సంవత్సరాలు, ప్రస్తుతం ${toTitleCase(add)} లో నివాసము`,{align:'justify',lineGap:0});
                pdfDocs.moveDown();
                pdfDocs.fontSize('13').text('(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “1 వ పార్టీ “ ఈ దస్తావేజునందు పరిగణించబడుదురు).',{align:'justify',lineGap:0});
                } 
            }else{
                pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. .......,S/O. .........,వయస్సు ........ సంవత్సరాలు,ప్రస్తుతం......... లో నివాసము`,{align:'justify',lineGap:0});
                pdfDocs.fontSize('13').text('(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “దాతలు “ గా ఈ దస్తావేజునందు పరిగణించబడుదురు).',{align:'justify',lineGap:0});
                pdfDocs.moveDown();
            }
            pdfDocs.fontSize('15').text(`మరియు`,{align:'center',underline:true});
            pdfDocs.fontSize('13').text(`వ్రాసుకున్నవారలు`,{align:'left',underline:true});
            if(data.claimant && data.claimant.length >0){
                for(let i of data.claimant){
                    let add = i.address.split("\n").join("")
                    add= add.split(" ").join("");
                pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. ${toTitleCase(i.name)}, ${i.relationType}.${toTitleCase(i.relationName)}, వయస్సు ${i.age} సంవత్సరాలు, ప్రస్తుతం ${toTitleCase(add)}  నివాసము`,{align:'justify',lineGap:0});
                pdfDocs.moveDown();
                }
            }else{
                pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. .......,S/O. .........,వయస్సు ........ సంవత్సరాలు,ప్రస్తుతం......... లో నివాసము`,{align:'justify',lineGap:0});
                pdfDocs.moveDown();
            }
            pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “2 వ పార్టీ “ గా ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{align:'justify',lineGap:0})
            if(data.covanants?.acquireCovenents && data.covanants?.acquireCovenents.length >0){
                let aqCovanents=[]
                //pdfDocs.fontSize('13').text('How the Property is Aquired',{align:'justify'})
                let sNo=1;
                data?.covanants.acquireCovenents.map((aqcv)=>{
                    let val = sNo ===1 ? `${sNo}. ${aqcv.value}` : `\n${sNo}. ${aqcv.value}`
					aqCovanents = [...aqCovanents,val];
					sNo =sNo+1;
                })
                for(let i of aqCovanents){
                    pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
                }
            }

           
        
            if(covenantArr && covenantArr.length >0){
                for(let i of covenantArr){
                    //pdfDocs.fontSize('13').text(`Additional Covanants:`,{align:'justify',lineGap:1});
                }
            }
            if(covenantArr && covenantArr.length >0){
                for(let i of covenantArr){
                    pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
                }
            }

            pdfDocs.fontSize('13').text(`మనలో 2 వ పార్టీ 1 వ పార్టీకి భార్య అయివున్నది మనకు సంతానము కలగనందున ఎవరి సంతానమునయిన దత్తత తీసుకోదలచితిమి. ఇప్పటివరకు మనకు నచ్చిన వారు దొరకనందున తీసుకొనలేక పోయినా ము. 1 వ పార్టీ జీవిత కాలములో మనము ఎవరిని దత్తత తీసుకొనలేకపోయినయెడల 1 వ పార్టీ  తదనంతరము   2 వ పార్టీ వారు వారికి నచ్చిన ఎవరినైనా దత్తత తీసుకోవడానికి ఇందుమూలముగా అధికారము ఇవ్వడమైనది. ఈ దస్తావేజు 1 వ పార్టీ వారు స్వస్ధ చిత్తముతోను, నిండు మనస్సుతోను, పూర్తి ఆరోగ్యం కలిగి సంపూర్ణ వ్యవహారిక జ్ఞానంతోను వ్రాయించడమైనది. \n\n`,{align:'justify',lineGap:1});


            //property
           
            pdfDocs.fontSize('13').text(`పార్టీలు:`,{align:'left',lineGap:0});

            if(data?.executent && data?.executent.length >0){
                let exNo =1
                for(let i of data.executent){
                    let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0,8),"XXXX XXXX XXXX ") : "xxxx xxxx xxxx";
                    pdfDocs.fontSize('12').text(`${exNo}`,{align:'left'});
                    pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: ${toTitleCase(i.name)}`+'\n'+`ఆధార్ నెంబర్ : ${aadhar}`,{align:'left'});
                    exNo = exNo+1;
                
                }
                // pdfDocs.fontSize('13').text(`నాకు సుమారు ${i.age} సం..లు వయస్సు కలదు జీవితము అశాశ్వతము అనియు మరియు ఎప్పుడు ఎట్లుండునో అని, నా తదనంతరం నాఆస్తిని గూర్చి ఎవ్వరూ ఎట్టి తగవులు పడకుండ ఉండగలందులకు గానూ నాఆస్ధిని గురించి జరగవలసిన ఏర్పాట్లకు ఇప్పుడే మనస్పూర్తిగా నిర్ణయించి యీవీలునామా నాసమ్మతితో   వ్రాయించడమైనది.`,{align:'left',lineGap:0})
            }else{
                pdfDocs.fontSize('13').text(`1. వ పార్టీ : .....................`,{align:'left',lineGap:0});
                pdfDocs.moveDown();
            }
            pdfDocs.addPage();
            pdfDocs.fontSize('13').text(`యిందుకు సాక్షులు`,{align:'left',lineGap:0,underline:true});
            pdfDocs.fontSize('13').text(`1.                                                    `,{align:'left',lineGap:0});
            pdfDocs.fontSize('13').text(`2.                                                    `,{align:'left',lineGap:0});
            pdfDocs.end();
            createFileData.on('finish', resolve);

        })

    }catch(ex){
        console.log("ERROR ::",ex.message);
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


module.exports ={engGenarateDocs,telGenarateDocs};