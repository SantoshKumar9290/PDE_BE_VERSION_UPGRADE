const pdfDoc = require('pdfkit');
const fs = require('fs');
const { fontSize } = require('pdfkit');
const { pdeStyle } = require('../../pdfStyles/engDocs')
const PDEError = require('../../../errors/customErrorClass');
const { covanantsData } = require('../../pdfStyles/covanants')
const Path = require('path');


const engGenarateDocs = async (data) => {
    try {
        var [dd, m, yyyy] = data.executionDate.split("/");
        // var dd = String(exDate.getDate()).padStart(2, '0');
        var mm = new Date(`${yyyy}-${m}-${dd}`).toLocaleDateString('en-US', { month: 'long' })
        pdeStyle.content = [];
        y = data.eStamp === "N" ? 400 : 550;
        if (data.status == "DRAFT") {
            pdeStyle.watermark.text = "DRAFT"
        }
        let covenantArr = [];
        if (data?.covanants) {
            let sNo = 1
            data?.covanants?.covanants.map((covn) => {
                let val = sNo === 1 ? `${sNo}.${covn.value}` : `\n${sNo}.${covn.value}`
                covenantArr = [...covenantArr, val];
                sNo = sNo + 1;
            })
        };
        let [subDesc, disc] = data.documentNature.TRAN_DESC.split("[");
        let [TRAN_DESC, rest] = data.registrationType.TRAN_DESC ? data.registrationType.TRAN_DESC.split("[") : ["", ""];
        pdeStyle.content.push({ text: `DEED OF ${subDesc}`.toUpperCase(), alignment: 'center', bold: true, decoration: 'underline', margin: [10, y, 0, 0] });
        pdeStyle.content.push(' ');
        pdeStyle.content.push({ text: `This DEED OF ${subDesc.toUpperCase()} is made and executed on ${data.executionDate}, by :`, style: ['p1sideHeaders'] });
        let party1Text, party2Text;
        if (data?.executent && data?.executent.length > 0) {
            for (var i = 0; i < data.executent.length; i++) {
                let address = data?.executent[i]?.address.replace(/\n/g, '');
                let name = data?.executent[i]?.name ? toTitleCase(data?.executent[i]?.name) : "............";
                let relationType = data?.executent[i]?.relationType ? data?.executent[i]?.relationType : "............";
                let relationName = data?.executent[i]?.relationName ? toTitleCase(data?.executent[i]?.relationName) : "............";
                let age = data?.executent[i]?.age ? data?.executent[i]?.age : "............";
                if (data?.executent[i].partyType === "Public") {
                    pdeStyle.content.push({
                        text: `\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`, style: ["p1Text"]
                    })
                    pdeStyle.content.push({
                        text:'(hereinafter referred  to as the “PRINCIPAL” which expression shall wherever it occurs in this Deed includes his legal representatives, executors, assignees and administrators  etc..,) ',style:["p1Text"]
                    })
                    // pdeStyle.content.push({
                    //     text:'In favour of'.toUpperCase(), alignment: 'center', bold: true, decoration: 'underline', margin: [10, y, 0, 0]
                    // })
                } else {
                    pdeStyle.content.push({
                        text: `M/s .${name}, ${address} is represented by`, style: ["p1Text"]
                    })
                }

                if (data.executent[i]?.represent && data.executent[i]?.represent.length > 0) {
                    for (let j in data.executent[i]?.represent) {
                        let address = data?.executent[i]?.represent[j]?.address.replace(/\n/g, '');
                        let name = data?.executent[i]?.represent[j]?.name ? toTitleCase(data?.executent[i]?.represent[j]?.name) : "............";
                        let relationType = data?.executent[i]?.represent[j]?.relationType ? data?.executent[i]?.represent[j]?.relationType : "............";
                        let relationName = data?.executent[i]?.represent[j]?.relationName ? toTitleCase(data?.executent[i]?.represent[j]?.relationName) : "............";
                        let age = data?.executent[i]?.represent[j]?.age ? data?.executent[i]?.represent[j]?.age : "............";

                        if (data?.executent[i].partyType === "Public") {
                            if (j === 0) {
                                pdeStyle.content.push({
                                    text: `Represented By :`, style: ["p1Text"]
                                })
                            };
                            pdeStyle.content.push({
                                text: `\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`, style: ["p1Text"]
                            });
                        } else {
                            pdeStyle.content.push({
                                text: `\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`, style: ["p1Text"]
                            })
                        }

                    }
                }
            }
        } else {
            pdeStyle.content.push({
                text: `\nMr/Mrs. ..............., ......................... , aged about ............ years,Presently residing at ...................`, style: ["p1Text"]
            });
        }
        pdeStyle.content.push({ text: 'IN FAVOUR OF', alignment: 'center', bold: true, decoration: 'underline', margin: [10, 10, 0, 0] });
        if (data?.claimant && data?.claimant.length > 0) {
            for (var i = 0; i < data.claimant.length; i++) {
                let address = data?.claimant[i]?.address.replace(/\n/g, '');
                let name = data?.claimant[i]?.name ? toTitleCase(data?.claimant[i]?.name) : "............";
                let relationType = data?.claimant[i]?.relationType ? data?.claimant[i]?.relationType : "............";
                let relationName = data?.claimant[i]?.relationName ? toTitleCase(data?.claimant[i]?.relationName) : "............";
                let age = data?.claimant[i]?.age ? data?.claimant[i]?.age : "............";
                if (data?.claimant[i].partyType === "Public") {
                    pdeStyle.content.push({
                        text: `\nMr/Mrs. ${name}, ${relationType} ${relationName} , aged about ${age}  years, Presently residing at ${toTitleCase(address)}`, style: ["p1Text"]
                    });
                    pdeStyle.content.push({
                        text:'(hereinafter referred  to as the “AGENT” which expression shall wherever it occurs in this Deed includes his legal representatives, executors, assignees and administrators  etc..,).',style:["p1Text"]
                    })
                } else {
                    pdeStyle.content.push({
                        text: `M/s .${name}, ${address} is represented by`, style: ["p1Text"]
                    })
                }

                if (data.claimant[i]?.represent && data.claimant[i]?.represent.length > 0) {
                    for (let j in data.claimant[i]?.represent) {
                        let address = data?.claimant[i]?.represent[j]?.address.replace(/\n/g, '');
                        let name = data?.claimant[i]?.represent[j]?.name ? toTitleCase(data?.claimant[i]?.represent[j]?.name) : "............";
                        let relationType = data?.claimant[i]?.represent[j]?.relationType ? data?.claimant[i]?.represent[j]?.relationType : "............";
                        let relationName = data?.claimant[i]?.represent[j]?.relationName ? toTitleCase(data?.claimant[i]?.represent[j]?.relationName) : "............";
                        let age = data?.claimant[i]?.represent[j]?.age ? data?.claimant[i]?.represent[j]?.age : "............";

                        if (data?.claimant[i].partyType === "Public") {
                            pdeStyle.content.push({
                                text: `Represented By :`, style: ["p1Text"]
                            })
                            pdeStyle.content.push({
                                text: `\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`, style: ["p1Text"]
                            })
                        } else {
                            pdeStyle.content.push({
                                text: `\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`, style: ["p1Text"]
                            })
                        }
                    }
                }
            }
            // pdeStyle.content.push({text: `Herein after called the '${partyType2}' of the second part`,style:["p1Points"]});
        } else {
            pdeStyle.content.push({
                text: `\nMr/Mrs. ................, ......................... , aged about ............ years,Presently residing at ....................`, style: ["p1Text"]
            });
        }

        // pdeStyle.content.push({
        //     text:"NOW THIS BOND WITNESSETH AS FOLLOWS:",style:["p1sideHeaders"]
        // })
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
        let sNo = 1
        let cvStaticArry = [];
        covanantsData.powerofConsideration.map((cv) => {
            if (cv.minDocNum == data.documentNature.TRAN_MIN_CODE) {
                let val = sNo === 1 ? `${cv.value}` : `\n${cv.value}`
                cvStaticArry = [...cvStaticArry, val];
                sNo = sNo + 1;
            }
            if(covenantArr.length > 0){
                pdeStyle.content.push({
                    text : 'Additional Covanants:',style:["p1last_MRleft"]
                })
                }
        });
        pdeStyle.content.push({ text: cvStaticArry, style: ["covanants"] });
        pdeStyle.content.push({ text: covenantArr, style: ["covanants"] });
        pdeStyle.content.push({text:'\n This is not an assigned or Government  land and the land is not covered under the Urban Land Ceiling limits.\n',style:['p1Text']})
        pdeStyle.content.push({text:'\n IN WITNESS WHERE OF the Principal has signed on this deed of special Power of Attorney on the day mentioned above. \n ',style:['p1Text']})

        pdeStyle.content.push({ text: `PRINCIPAL :\n\n`, style: ['p1last_MRright'] })
        if(data?.executent && data?.executent.length >0){
            let exNo =1
            for(let i of data.executent){
                let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0,8),"XXXX XXXX XXXX ") : "xxxx xxxx xxxx";
                pdeStyle.content.push({text:`${exNo})Name: ${toTitleCase(i.name)}`+'\n'+`Aadhar : ${aadhar}`,style:['p1last_MRright']});
                exNo = exNo+1;
            }
        }
        pdeStyle.content.push({ text: `WITNESSES :`, style: ['p1last_MRleft'] })

        pdeStyle.content.push({ text: `1. ` + `\n\n2.`, style: ['p1Text_MR'] })
        return pdeStyle;

    } catch (ex) {
        console.log("error ::", ex.message)
        throw new PDEError({ status: false, message: "Internal Server" });
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
                pdfDocs.fontSize(13).text('\n(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “ ప్రిన్సిపాల్  “ గా ఈ దస్తావేజునందు పరిగణించబడుదురు).',{align:'justify',lineGap:0});
                pdfDocs.moveDown();
                } 
            }else{
                pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. .......,S/O. .........,వయస్సు ........ సంవత్సరాలు,ప్రస్తుతం......... లో నివాసము`,{align:'justify',lineGap:0});
                pdfDocs.moveDown();
            }
            pdfDocs.fontSize('15').text(`మరియు`,{align:'center',underline:true});
            pdfDocs.fontSize('13').text(`వ్రాసుకున్నవారలు`,{align:'left',underline:true});
            if(data.claimant && data.claimant.length >0){
                for(let i of data.claimant){
                    let add = i.address.split("\n").join("")
                    add= add.split(" ").join("");
                pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. ${toTitleCase(i.name)}, ${i.relationType}.${toTitleCase(i.relationName)}, వయస్సు ${i.age} సంవత్సరాలు, ప్రస్తుతం ${toTitleCase(add)}  నివాసము`,{align:'justify',lineGap:0});
                pdfDocs.fontSize('13').text('\n (అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “ఏజెంట్ “ గా ఈ దస్తావేజునందు పరిగణించబడుదురు).',{align:'justify',lineGap:0})
                pdfDocs.moveDown();
                }
            }else{
                pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. .......,S/O. .........,వయస్సు ........ సంవత్సరాలు,ప్రస్తుతం......... లో నివాసము`,{align:'justify',lineGap:0});
                pdfDocs.moveDown();
            }

            //pdfDocs.fontSize(13).text('\n ప్రస్తుతము ఈ బాండు ఈ క్రింది విషయాలను దృవీకరించుచున్నది:  \n',{align:"justify",lineGap:0})
            if(data.covanants?.acquireCovenents && data.covanants?.acquireCovenents.length >0){
                let aqCovanents=[]
               // pdfDocs.fontSize('13').text('How the Property is Aquired',{align:'justify'})
                let sNo=1;
                data?.covanants.acquireCovenents.map((aqcv)=>{
                    let val = sNo ===1 ? ` ${aqcv.value}` : `\n${sNo}. ${aqcv.value}`
					aqCovanents = [...aqCovanents,val];
					
                })
                for(let i of aqCovanents){
                    pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
                }
            }
            
            if(covenantArr && covenantArr.length >0){
                for(let i of covenantArr){
                    pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
                }
            }
            pdfDocs.fontSize(13).text('\n ఈ క్రింది సాక్షుల సమక్షంలో పైన పేర్కొనిన తేదీన ఈ స్పెషల్ పవరాఫ్ అటార్నీ దస్తావేజుపై సంతకములు చేయదమైనది.\n',{align:'justify',lineGap:0})
            pdfDocs.fontSize('13').text(`1 వ పార్టీ `,{align:'justify',lineGap:1});
            if(data?.executent && data?.executent.length >0){
                let exNo =1
                for(let i of data.executent){
                    let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0,8),"XXXX XXXX XXXX ") : "xxxx xxxx xxxx";
                    //let panOrTanOrForm60Header = i.panNoOrForm60or61 ? "PAN/Form60" :i.panNoOrForm60or61 ==="" && i.tan ==="" ? "PAN/Form60" :"TAN";
                    //let panOrTanOrForm60Value = i.panNoOrForm60or61 ? i.panNoOrForm60or61 : i.tan;
                    
                    
                    pdfDocs.fontSize('12').text(`${exNo}`,{align:'left'});
                    
                    pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: ${toTitleCase(i.name)}`+'\n'+`ఆధార్ నెంబర్ : ${aadhar}`,{align:'left'});
                    exNo = exNo+1;
                
                }
            
            }else{
                pdfDocs.fontSize('13').text(`1. వ పార్టీ : .....................`,{align:'left',lineGap:0});
                pdfDocs.moveDown();
            }
            pdfDocs.fontSize('13').text(`2  వ పార్టీ `,{align:'justify',lineGap:1});
            if(data?.claimant && data?.claimant.length >0){
                let exNo =1
                for(let i of data.claimant){
                    let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0,8),"XXXX XXXX XXXX ") : "xxxx xxxx xxxx";
                    //let panOrTanOrForm60Header = i.panNoOrForm60or61 ? "PAN/Form60" :i.panNoOrForm60or61 ==="" && i.tan ==="" ? "PAN/Form60" :"TAN";
                    //let panOrTanOrForm60Value = i.panNoOrForm60or61 ? i.panNoOrForm60or61 : i.tan;
                    
                    
                    pdfDocs.fontSize('12').text(`${exNo}`,{align:'left'});
                    
                    pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: ${toTitleCase(i.name)}`+'\n'+`ఆధార్ నెంబర్ : ${aadhar}`,{align:'left'});
                    exNo = exNo+1;
                
                }
            
            }else{
                pdfDocs.fontSize('13').text(`1. వ పార్టీ : .....................`,{align:'left',lineGap:0});
                pdfDocs.moveDown();
            }
           
            pdfDocs.fontSize('13').text(`యిందుకు సాక్షులు`,{align:'left',lineGap:0,underline:true});
            pdfDocs.fontSize('13').text(`1.                                                         1 వ పార్టీ :`,{align:'left',lineGap:0});
            pdfDocs.fontSize('13').text(`2.                                                         2 వ పార్టీ :`,{align:'left',lineGap:0});
            pdfDocs.end();
            createFileData.on('finish', resolve);

        })

    }catch(ex){
        console.log("ERROR ::",ex.message);
		throw new PDEError(ex.message);
    }
    
}
const toTitleCase = (phrase) => {
    phrase = phrase.replace(/ +/g, ' ');
    return phrase
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};


module.exports = { engGenarateDocs, telGenarateDocs };
