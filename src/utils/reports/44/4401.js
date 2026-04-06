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
        pdeStyle.content.push({ text: `${subDesc} DEED`.toUpperCase(), alignment: 'center', bold: true, decoration: 'underline', margin: [10, y, 0, 0] });
        pdeStyle.content.push(' ');
        pdeStyle.content.push({ text: `This ${subDesc.toUpperCase()} DEED is made and executed on ${data.executionDate}, by :`, style: ['p1sideHeaders'] });
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
                        text:'Hereinafter called the FIRST PARTY which expression shall be deemed to include their heirs, successors, representatives and assignees. ',style:["p1Text"]
                    })
                    pdeStyle.content.push({
                        text:'AND', alignment: 'center', bold: true, decoration: 'underline', margin: [10, y, 0, 0]
                    })
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
        // pdeStyle.content.push({ text: 'AND', alignment: 'center', bold: true, decoration: 'underline', margin: [10, 10, 0, 0] });
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
                        text:'Hereinafter called the SECOND PARTY which expression shall be deemed to include their heirs, successors, representatives and assignees. ',style:["p1Text"]
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
        covanantsData.Partner2.map((cv) => {
            if (cv.minDocNum == data.documentNature.TRAN_MIN_CODE) {
                let val = sNo === 1 ? `${cv.value}` : `\n${cv.value}`
                cvStaticArry = [...cvStaticArry, val];
                sNo = sNo + 1;
            }
            if(covenantArr.length > 0){
                pdeStyle.content.push({
                    // text : 'Additional Covanants:',style:["p1last_MRleft"]
                })
                }
        });
        pdeStyle.content.push({
            text: `\nWHEREAS, the Parties desire to memorialize certain terms and conditions of their anticipated endeavor;`, style: ["p1Text"]
        });
        pdeStyle.content.push({
            text: `\nNOW THEREFORE, in consideration of the mutual promises and covenants contained herein, the Parties agree as follows:`, style: ["p1Text"]
        });
        pdeStyle.content.push({
            text: `\nRepresentations and Warranties. Both Parties represent that they are fully authorized to enter into this Agreement. The performance and obligations of either Party will not violate or infringe upon the rights of any third-party or violate any other agreement between the Parties, individually, and any other person, organization, or business or any law or governmental regulation.`, style: ["p1Text"]
        });
        pdeStyle.content.push({
            text: `\nIndemnity. The Parties each agree to indemnify and hold harmless the other Party, its respective affiliates, officers, agents, employees, and permitted successors and assigns against any and all claims, losses, damages, liabilities, penalties, punitive damages, expenses, reasonable legal fees and costs of any kind or amount whatsoever, which result from the negligence of or breach of this Agreement by the indemnifying party, its respective successors and assigns that occurs in connection with this Agreement. This section remains in full force and effect even after termination of the Agreement by its natural termination or the early termination by either party.`, style: ["p1Text"]
        });
        pdeStyle.content.push({
            text: `\nLimitation of Liability. under no circumstances shall either party be liable to the other party or any third party for any damages resulting from any part of this agreement such as, but not limited to, loss of revenue or anticipated profit or lost business, costs of delay or failure of delivery, which are not related to or the direct result of a party’s negligence or breach`, style: ["p1Text"]
        });
        pdeStyle.content.push({
            text: `\nSeverability. In the event any provision of this Agreement is deemed invalid or unenforceable, in whole or in part, that part shall be severed from the remainder of the Agreement and all other provisions should continue in full force and effect as valid and enforceable`, style: ["p1Text"]
        });
        pdeStyle.content.push({
            text: `\nWaiver. The failure by either Party to exercise any right, power, or privilege under the terms of this Agreement will not be construed as a waiver of any subsequent or future exercise of that right, power, or privilege or the exercise of any other right, power, or privilege. `, style: ["p1Text"]
        });
        pdeStyle.content.push({
            text: `\nLegal Fees. In the event of a dispute resulting in legal action, the successful party will be entitled to its legal fees, including, but not limited to its attorneys’ fees.`, style: ["p1Text"]
        });
        pdeStyle.content.push({
            text: `\nLegal and Binding Agreement. This Agreement is legal and binding between the Parties as stated above. This Agreement may be entered into and is legal and binding both in the United States and throughout Europe. The Parties each represent that they have the authority to enter into this Agreement.`, style: ["p1Text"]
        });
        pdeStyle.content.push({ text: cvStaticArry, style: ["covanants"] });
        pdeStyle.content.push({ text: covenantArr, style: ["covanants"] });

        pdeStyle.content.push({text:'\n  IN WITNESS WHEREOF the said parties have hereto signed and executed this MOU. \n ',style:['p1Text']})

        // if (data?.executent && data?.executent.length > 0) {
        //     for (var i = 0; i < data.executent.length; i++) {
        //         let name = data?.executent[i]?.name ? toTitleCase(data?.executent[i]?.name) : "............"
        //         if (data?.executent[i].partyType === "Public") {
        //             pdeStyle.content.push({
        //                 text: `\n Partners : ${name}`, style: ["p1Text"]
        //             })
        //         } else {
        //             pdeStyle.content.push({
        //                 text: `\n Partners : ${name}`, style: ["p1Text"]
        //             })
        //         }
        //     }
        // }
        
        // if (data?.claimant && data?.claimant.length > 0) {
        //     for (var i = 0; i < data.claimant.length; i++) {
        //         let name = data?.claimant[i]?.name ? toTitleCase(data?.claimant[i]?.name) : "............"
        //         if (data?.claimant[i].partyType === "Public") {
        //             pdeStyle.content.push({
        //                 text: `\n Partners : ${name}`, style: ["p1Text"]
        //             })
        //         } else {
        //             pdeStyle.content.push({
        //                 text: `\n Partners : ${name}`, style: ["p1Text"]
        //             })
        //         }
        //     }
        // }
        pdeStyle.content.push({ text: `WITNESSES :`, style: ['p1last_MRleft'] })

        pdeStyle.content.push({ text: `1. ` + `\n\n2.`, style: ['p1Text_MR'] })
        return pdeStyle;

    } catch (ex) {
        console.log("error ::", ex.message)
        throw new PDEError({ status: false, message: "Internal Server" });
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


module.exports = { engGenarateDocs };
