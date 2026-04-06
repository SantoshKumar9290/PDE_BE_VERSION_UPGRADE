const { constructPDEError } = require("../handlers/errorHandler");
const { Logger } = require('../../services/winston');
const PartiesDao = require("../dao/partiesDao");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');
const Path = require('path');
const fs = require('fs');
const fsone = require('fs');
const https = require('https');
const axios = require('axios');

const ObjectId = mongoose.Types.ObjectId;
const { encryptWithAESPassPhrase,AadhardecryptData } = require("../utils");
const PDFPageCounter = require('pdf-page-counter');
const { EXECUTANT_CODES, CLAIMANT_CODES, WITNESS_CODES} = require("../constants/commonValues");
const DocumentDetailsDao = require("../dao/documentDetailsDao");
const { PDFDocument, rgb } = require("pdf-lib");
const fileResolver = require("../utils/fileResolver");

const instance = axios.create({
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false
    })
  });

class EsignService {
	constructor() {
		this.partiesDao = new PartiesDao();
		this.documentDetailsDao = new DocumentDetailsDao();
	}

	esignUser = async (reqData) => {
		try {

			// Check if the user is Already Esigned
			let partyDetails = null;
			let signerName = "";

			let docDetails = await this.documentDetailsDao.getOneByFilters({ documentId : reqData.documentId });			
			if(docDetails == null){
				throw new Error('Document Details not found');
			}
			let [type ,restData]= docDetails.documentType.TRAN_DESC.split(" ");

			// Check for pending Esigns
			let allPartyDetails = await this.partiesDao.getByFilters({applicationId: reqData.documentId});
			let allRepresentDetails = await this.partiesDao.getRepresntByFilters({documentId: reqData.documentId});

			for(let i in allPartyDetails){
				let id = allPartyDetails[i]._id.toString();
				if(id != reqData.partyId && allPartyDetails[i].esignStatus != null && allPartyDetails[i].esignStatus == 'P'){
					throw new Error(`Please complete the esign of ${allPartyDetails[i].name}`)
				}
			}

			for(let i in allRepresentDetails){
				let id = allRepresentDetails[i]._id.toString();
				if(id != reqData.repId && allRepresentDetails[i].esignStatus != null && allRepresentDetails[i].esignStatus == 'P'){
					throw new Error(`Please complete the esign of ${allRepresentDetails[i].name}`)
				}
			}

			if (reqData.repId) {
				partyDetails = await this.partiesDao.getOneRepresentByFilters({ _id: ObjectId(reqData.repId), parentPartyId: reqData.parentId, documentId: reqData.documentId });
			} else if (reqData.partyId) {
				partyDetails = await this.partiesDao.getOneByFilters({ _id: ObjectId(reqData.partyId), applicationId: reqData.documentId });
			}

			if (partyDetails == null) {
				console.error("EsignService - esignUser || Party Details Not Found")
				throw new Error("Party Details Not Found");
			}
			if (partyDetails.esignStatus == 'Y') {
				console.error("EsignService - esignUser || Esign is Already Done")
				throw new Error("Esign is Already Done");
			}

			// Get File Content and the coordinates
			let filePath = await this.getEsignFilePath(reqData.documentId, type, false);
            let contents = fs.readFileSync(filePath, { encoding: 'base64' });
			let coOrdinatesData = "";

			let executantPageEndCoordinates = [
				"480,10,50,100",
				"390,10,50,100",
				"300,10,50,100"
			];
			let claimantPageEndCoordinates = [
				"210,10,50,100",
				"120,10,50,100",
				"30,10,50,100"
			];

			const  getCoordinates = (clCount) => {
				let pageEndCoordinates = []
				for (let i = clCount - 1; i >= 0; i--) {
					const x = 40 + (i * 100);
					pageEndCoordinates.push(`${x},10,50,100`);
				}
				return pageEndCoordinates;
			}

			const  getCoordinatesForNewPage = (count) => {
				let pageEndCoordinates = []
				for (let i = (count/4) - 1; i >= 0; i--) {
					const y = 60 + (i * 130);
					for (let j = (count/6) - 1; j >= 0; j--) {
						const x = 40 + (j * 130);
						pageEndCoordinates.push(`${x},${y},50,100`);
					}
				}
				return pageEndCoordinates;
			}

			let dataBuffer2 = fs.readFileSync(filePath);
			let pdfData = await PDFPageCounter(dataBuffer2);
			let finalExecutantsClaimantsEsignPageNumber = pdfData.numpages;

			if(EXECUTANT_CODES.includes(reqData.code) || CLAIMANT_CODES.includes(reqData.code)) {
				if (docDetails.documentType.TRAN_MAJ_CODE == '04' && docDetails.documentSubType.TRAN_MIN_CODE == '04') {
					//04 04 classification
					const allClaimants = allPartyDetails.filter(party => CLAIMANT_CODES.includes(party.representSubType));
					const clCount = allClaimants.length;
					const countEsignN = allClaimants.filter(party => party.esignStatus != "Y").length;
					if (clCount > 3) {
						//if climants count more than 5 we are displaying all the esigns together in the last page of document
						let countVal = Math.ceil(clCount/24) * 24;

						//coordinates array for esigns
						claimantPageEndCoordinates = getCoordinatesForNewPage(countVal);
						let pdfDoc = await PDFDocument.load(dataBuffer2);  
						const pagesList = pdfDoc.getPages();    
						const pageSize = [595, 842];

						let esinPageIndex = Math.ceil(clCount/countVal);
						let pageIndex = finalExecutantsClaimantsEsignPageNumber;
						if(clCount == countEsignN) {

							let isPagesAdded = false;
							//checking already empty pages are exist or not
							for (let page of pagesList) {
								const contents = page.node.Contents?.();
								if (!contents) {
									isPagesAdded = true;
									break;
								}

								const streams = Array.isArray(contents) ? contents : [contents];
								let isEmpty = true;
								for (const stream of streams) {
									const content = stream?.contents ? stream.contents.toString().trim() : "";
									if (content.length > 0) {
										isEmpty = false;
										break;
									}
								}

								if (isEmpty) {
									isPagesAdded = true;
									break;
								}
							}
							let currentPage = null;
							if(isPagesAdded==false){
								let addNewPages = Math.ceil(clCount/countVal);
								let currentNewPage = finalExecutantsClaimantsEsignPageNumber;
								//adding the pages in the pdf based on the climants
								for(let k=1; k<=addNewPages; k++){
									currentNewPage = currentNewPage+k;
									if(k==1) {
										pageIndex = currentNewPage;
										currentPage = pdfDoc.addPage(pageSize);
									} else {
										pdfDoc.addPage(pageSize);	
									}
								}
								//coordinates array for label names
								const parsedCoordinates = claimantPageEndCoordinates.map(coord => {
									const [x, y, w, h] = coord.split(',').map(Number);
									return { x, y, w, h };
								});

								//display the climants according to the coordinates
								parsedCoordinates.forEach((coord, i) => {
									let label = null;
									if (Array.isArray(allClaimants) && allClaimants[i]?.name && allClaimants[i]?.seqNumber) {
										label = `${i + 1}. ${allClaimants[i]?.name}`
									}

									//reverting coordinates position for x axis
									let moduler = i % 4;
									let modeVal = Math.floor(i/4);
									let position = (4 * modeVal) + 3 - moduler;
									coord = parsedCoordinates[position];
									label && currentPage.drawText(label, {
										x: coord.x + 20,
										y: coord.y - 15,
										size: 10,
										maxWidth: 110,
    									wordBreaks: [' '],
									});
								});

								//saving the page in the pdf
								const pdfBytes = await pdfDoc.save();
								fs.writeFileSync(filePath, pdfBytes);
								contents = Buffer.from(pdfBytes).toString('base64');
							}
						} else {
							if(0 == (countEsignN % countVal))
								pageIndex = (pageIndex-esinPageIndex);
							else
								pageIndex = (pageIndex-esinPageIndex) + 1;
						}
						// cooridinate data for the perticular selected climant
						coOrdinatesData = coOrdinatesData + `${pageIndex}-${claimantPageEndCoordinates[reqData.ecNumber - 1]};`;
					} else {
						//if climants count less than 5 we are displaying all the esigns below the of the each page of the document
						claimantPageEndCoordinates = getCoordinates(clCount + 2);
						let pdfDoc = await PDFDocument.load(dataBuffer2);  
						const pages = pdfDoc.getPages();
						const currentPage = pages[pdfData.numpages - 1];
						currentPage.drawText("Climants ESIGN's: ", {
							x: 170,
							y: 70,
							size: 10,
							maxWidth: 110,
						});
						const pdfBytes = await pdfDoc.save();
						fs.writeFileSync(filePath, pdfBytes);
						contents = Buffer.from(pdfBytes).toString('base64');
						for (let i = 1; i <= finalExecutantsClaimantsEsignPageNumber; i++) {
							coOrdinatesData = coOrdinatesData + `${i}-${claimantPageEndCoordinates[countEsignN - 1]};`;
						}
					}
				} else {
					let coordinatesCount = reqData.ecNumber >= 3 ? 3 : reqData.ecNumber;
					for (let i = 1; i <= finalExecutantsClaimantsEsignPageNumber; i++) {
						coOrdinatesData = coOrdinatesData + `${i}-${EXECUTANT_CODES.includes(reqData.code) ? executantPageEndCoordinates[coordinatesCount - 1] : claimantPageEndCoordinates[coordinatesCount - 1]};`;
					}
				}
			} else if(WITNESS_CODES.includes(reqData.code)) {
				if (docDetails.documentType.TRAN_MAJ_CODE == '04' && docDetails.documentSubType.TRAN_MIN_CODE == '04') {
					let pdfDoc = await PDFDocument.load(dataBuffer2);  
					const pages = pdfDoc.getPages();
					const currentPage = pages[pdfData.numpages - 1];
					currentPage.drawText("Witness ESIGN's :", {
						x: 410,
						y: 70,
						size: 10,
						maxWidth: 110,
					});
					const pdfBytes = await pdfDoc.save();
					fs.writeFileSync(filePath, pdfBytes);
					contents = Buffer.from(pdfBytes).toString('base64');
					coOrdinatesData =  `${pdfData.numpages}-${reqData.ecNumber === 1 ? "40,10,50,100" : "140,10,50,100"}`
				} else {
					coOrdinatesData =  `${pdfData.numpages}-${reqData.ecNumber === 1 ? "480,60,50,100" : "210,60,50,100"}`
				}
			} else {            
            	coOrdinatesData = "";
        	}

			if (typeof contents === "undefined") {
				contents = fs.readFileSync(filePath, { encoding: 'base64' });
			}

			// Get Name and Aadhar Details

			signerName = partyDetails.name;
			if (signerName == null || signerName.length == 0)
				signerName = reqData.name
			if (signerName) {
				signerName = signerName.replace('\t', '').trim();
			}
			let transactionid=uuidv4();
			let aadhaar = AadhardecryptData(partyDetails.aadhaar?.toString())
			let eSignData = {
				"rrn": transactionid,
				"coordinates_location": "Top_Right",
				"coordinates": coOrdinatesData,
				"doctype": "PDF",
				"uid": aadhaar,
				"signername": signerName?.substring(0, 50),
				"signerlocation": 'User',
				"filepassword": "",
				"signreason": "pdeDocumentSign",
				"authmode": 1,
				"webhookurl": process.env.ESIGN_REDIRECTION_URL_EXE,
				"file": contents
			};

			let esignUrl = process.env.IGRS_ESIGN_URL
			

			let esignRequestData = encryptWithAESPassPhrase(JSON.stringify(eSignData), "igrsSecretPhrase");
			let eSignReponse = await this.igrsEsignAxiosCall(esignUrl, esignRequestData);

			// Update the values in DB
			let response = null;
			if (reqData.repId) {
				response = await this.partiesDao.updateOneByFiltersForRepresentative({ _id: ObjectId(reqData.repId), parentPartyId: reqData.parentId, documentId: reqData.documentId }, { esignStatus: 'P', esignTxnId: eSignData.rrn });
			} else if (reqData.partyId) {
				response = await this.partiesDao.updateOneByFilters({ _id: ObjectId(reqData.partyId), applicationId: reqData.documentId }, { esignStatus: 'P', esignTxnId: eSignData.rrn });
			}

			// return eSignReponse;
			return { data: eSignReponse,transid:transactionid};

		} catch (ex) {
			Logger.error(ex);
			console.error("EsignService - esignUser || Error : ", ex);
			throw constructPDEError(ex);
		}
	};


	igrsEsignAxiosCall = async (eSignUrl, eSignData) => {
        try {

            let data = JSON.stringify({
                "esignRequest": eSignData
            });

            let eSignConfig = {
                method: 'post',
                maxBodyLength: Infinity,
                url: `${eSignUrl}/storeAndProcessEsignRequest`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: data
            };
            let fileResponse = await instance.request(eSignConfig);
            if (fileResponse == null || fileResponse.data == null) {
                throw Error('IGRS Esign api error');
            }

            return fileResponse.data;

        } catch (ex) {
            console.error("ESignServices - igrsEsignAxiosCall || Error :", ex);
            throw constructPDEError(ex);
        }

    }

	esignStatus = async (reqData) => {
		try {
			// Get the Esign Status
			let partyDetails = null;
			let docDetails = await this.documentDetailsDao.getOneByFilters({ documentId : reqData.documentId });
			if(docDetails == null){
				throw new Error('Document Details not found');
			}
			let [type ,restData]= docDetails.documentType.TRAN_DESC.split(" ");

			if (reqData.repId) {
				partyDetails = await this.partiesDao.getOneRepresentByFilters({ _id: ObjectId(reqData.repId), parentPartyId: reqData.parentId, documentId: reqData.documentId, esignTxnId: reqData.txnId });
			} else if (reqData.partyId) {
				partyDetails = await this.partiesDao.getOneByFilters({ _id: ObjectId(reqData.partyId), applicationId: reqData.documentId, esignTxnId: reqData.txnId });
			}

			if (partyDetails == null) {
				console.error("EsignService - esignStatus || Party Details Not Found")
				throw new Error("Party Details Not Found");
			}
			if (partyDetails.esignStatus == 'Y') {
				console.error("EsignService - esignStatus || Esign is Already Done")
				throw new Error("Esign is Already Done for this User");
			}

			let statusResponse = await this.igrsEsignStatusAxiosCall(reqData.txnId);
			let filePath = await this.getEsignFilePath(reqData.documentId, type, true);
			console.log(filePath,'identify');
			let response;
			if (statusResponse != null && statusResponse.status == "Success") {
				await fs.writeFileSync(filePath, statusResponse.data, { encoding: 'base64' });
				if (reqData.repId) {
					response = await this.partiesDao.updateOneByFiltersForRepresentative({ _id: ObjectId(reqData.repId), parentPartyId: reqData.parentId, documentId: reqData.documentId }, { esignStatus: 'Y' });
				} else if (reqData.partyId) {
					response = await this.partiesDao.updateOneByFilters({ _id: ObjectId(reqData.partyId), applicationId: reqData.documentId }, { esignStatus: 'Y' });
				}
			} else if (statusResponse != null && statusResponse.status == "Failure") {
				if (reqData.repId) {
					response = await this.partiesDao.updateOneByFiltersForRepresentative({ _id: ObjectId(reqData.repId), parentPartyId: reqData.parentId, documentId: reqData.documentId }, { esignStatus: 'N' });
				} else if (reqData.partyId) {
					response = await this.partiesDao.updateOneByFilters({ _id: ObjectId(reqData.partyId), applicationId: reqData.documentId }, { esignStatus: 'N' });
				}
				throw new Error(statusResponse.message)
			}
			return statusResponse;
		} catch (ex) {
			Logger.error(ex.message);
			console.error("EsignService - esignStatus || Error : ", ex.message);
			throw constructPDEError(ex);
		}
	};

	esignExecute = async (reqData) => {
		try {
			// Get the Esign Status
			let partyDetails = await this.partiesDao.getByFilters({ applicationId: reqData.documentId });

			if (partyDetails == null) {
				console.error("EsignService - esignExecute || Party Details Not Found")
				throw new Error("Party Details Not Found");
			}
			
			for(let i in partyDetails){
				if(partyDetails[i].represent != null && partyDetails[i].represent.length > 0){
					let representDetails = await this.partiesDao.getOneRepresentByFilters({_id: ObjectId(partyDetails[i].represent[0])})
					if(representDetails != null && (representDetails.esignStatus == null || representDetails.esignStatus != 'Y')){
						throw new Error("Please complete esign of all the represents");
					}
				} else if(partyDetails[i].esignStatus == null && !partyDetails.filter(p => p.partyType !== "Deceased").every(p => p.esignStatus === 'Y')){
					throw new Error("Please complete esign of all the parties");
				}
			}

			let response = await this.documentDetailsDao.updateOneByFilters({ documentId : reqData.documentId }, {esignExecuted: true})
			return response;
		} catch (ex) {
			Logger.error(ex.message);
			console.error("EsignService - esignExecute || Error : ", ex.message);
			throw constructPDEError(ex);
		}
	};

	esignRemove = async (reqData) => {
		try {

			let docDetails = await this.documentDetailsDao.getOneByFilters({ documentId : reqData.documentId });
			if(docDetails == null){
				throw new Error('Document Details not found');
			}
			let [type ,restData]= docDetails.documentType.TRAN_DESC.split(" ");

			// Delete all the files
			// let docDirectoryPath = Path.join(__dirname, `../../../pdf/${applicationId}/`);
			// if (fs.existsSync(`${docDirectoryPath}engDocs.pdf`)) {
            //     fs.unlinkSync(`${docDirectoryPath}engDocs.pdf`);
            // }
			// if (fs.existsSync(`${docDirectoryPath}signedEngDocs.pdf`)) {
            //     fs.unlinkSync(`${docDirectoryPath}signedEngDocs.pdf`);
            // }
			// if (fs.existsSync(`${docDirectoryPath}${type}Telugu.pdf`)) {
            //     fs.unlinkSync(`${docDirectoryPath}${type}Telugu.pdf`);
            // }
			// if (fs.existsSync(`${docDirectoryPath}signed${type}Telugu.pdf`)) {
            //     fs.unlinkSync(`${docDirectoryPath}signed${type}Telugu.pdf`);
            // }

			const baseFolder = Path.join(String(applicationId));

			await fileResolver.delete(Path.join(baseFolder, 'engDocs.pdf'));
			await fileResolver.delete(Path.join(baseFolder, 'signedEngDocs.pdf'));
			await fileResolver.delete(Path.join(baseFolder, `${type}Telugu.pdf`));
			await fileResolver.delete(Path.join(baseFolder, `signed${type}Telugu.pdf`));
	

			// Change the Esign Status
			await this.partiesDao.updateFilters({ applicationId: reqData.documentId }, {esignStatus: 'N'});
			await this.partiesDao.updateByFiltersForRepresentative({ documentId: reqData.documentId }, {esignStatus: 'N'});
			await this.documentDetailsDao.updateOneByFilters({ documentId : reqData.documentId }, {esignExecuted: false});

			return "Esign Data Removed Succesfully";
		} catch (ex) {
			Logger.error(ex.message);
			console.error("EsignService - esignExecute || Error : ", ex.message);
			throw constructPDEError(ex);
		}
	};

	// getEsignFilePath = async (applicationId, docType, isEsignedFilePath) => {
	// 	try {
	// 		let engFilePath = Path.join(process.env.ESIGN_FILE + `/pdfs/${applicationId}/engDocs.pdf`);			
	// 		let telFilePath = Path.join(process.env.ESIGN_FILE + `/pdfs/${applicationId}/${docType}Telugu.pdf`);			
	// 		if (fs.existsSync(engFilePath)) {
	// 			let engSignedFilePath = Path.join(process.env.ESIGN_FILE + `/pdfs/${applicationId}/signedEngDocs.pdf`);
	// 			if (isEsignedFilePath)
	// 				return engSignedFilePath;
	// 			if (fs.existsSync(engSignedFilePath))
	// 				return engSignedFilePath;
	// 			return engFilePath;
	// 		} else if (fs.existsSync(telFilePath)) {
	// 			let telSignedFilePath = Path.join(process.env.ESIGN_FILE + `/pdfs/${applicationId}/signed${docType}Telugu.pdf`);
	// 			if (isEsignedFilePath)
	// 				return telSignedFilePath;
	// 			if (fs.existsSync(telSignedFilePath))
	// 				return telSignedFilePath;
	// 			return telFilePath;
	// 		} else {
	// 			throw new Error("No File to eSign. Please generate the file");
	// 		}
	// 	} catch (ex) {
	// 		Logger.error(ex.message);
	// 		console.error("EsignService - esignStatus || Error : ", ex.message);
	// 		throw constructPDEError(ex);
	// 	}
	// }

	getEsignFilePath = async (applicationId, docType, isEsignedFilePath) => {
		try {

			const baseFolder = Path.join(String(applicationId));

			const engFile = Path.join(baseFolder, 'engDocs.pdf');
			const engSignedFile = Path.join(baseFolder, 'signedEngDocs.pdf');

			const telFile = Path.join(baseFolder, `${docType}Telugu.pdf`);
			const telSignedFile = Path.join(baseFolder, `signed${docType}Telugu.pdf`);

			try {
				await fileResolver.resolve(engFile);

				if (isEsignedFilePath) {
					return await fileResolver.resolve(engSignedFile, true);
				}
			} catch (err) {
				throw constructPDEError(err);
			}

			try {
				await fileResolver.resolve(telFile);

				if (isEsignedFilePath) {
					return await fileResolver.resolve(telSignedFile, true);
				}
			} catch (err) {
				throw constructPDEError(err);
			}
		} catch (ex) {
			Logger.error(ex.message);
			console.error("EsignService - esignStatus || Error : ", ex.message);
			throw constructPDEError(ex);
		}
	};

	igrsEsignStatusAxiosCall = async (rrn) => {
		rrn = encryptWithAESPassPhrase(`${rrn}`, "igrsSecretPhrase");
		rrn = encodeURIComponent(`${rrn}`);
		console.log(rrn);

		try {
			let eSignConfig = {
				method: 'post',
				maxBodyLength: Infinity,
				url: `${process.env.IGRS_ESIGN_URL}/downloadSignedDocTransID?transactionId=${rrn}`,
				headers: {
					'Content-Type': 'application/json'
				}
			};
			let fileResponse = await instance.request(eSignConfig);
			if (fileResponse == null || fileResponse.data == null) {
				throw Error('IGRS Esign api error');
			}

			return fileResponse.data;

		} catch (ex) {
			console.error("ESignServices - igrsEsignStatusAxiosCall || Error :", ex.message);
			throw constructPDEError(ex);
		}

	}

};
module.exports = EsignService;