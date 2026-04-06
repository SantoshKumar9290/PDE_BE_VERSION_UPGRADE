const Path = require('path');
const {ackAndSlotStyles} = require('./pdfStyles/ackAndSlot');
const {checkSlipReport }  =require('./pdfStyles/checkSlip');
const {formSixtyStyles} = require('./pdfStyles/formSixty');
const {pdeStyle} = require('./pdfStyles/engDocs')
const {saleDeedDocs}= require('./pdfStyles/telugu/saleDeed');
const {covanantsData}= require('./pdfStyles/covanants');
const { generateBarcodeBase64  } = require("../common/barcodeGenerator");
const UrbanService = require('../services/urbanServices');
const urbanService = new UrbanService();
const moment = require('moment');
const {isUrbanDocumentMutationNeeded} = require ('../utils/config');
const { maskAadhaar, DecryptAdrwithPkcs, maskPhoneNumber, maskEmail} = require('../utils/index');


// const {telCovanantsData} = require('./pdfStyles/telCovanants')
const pdfDoc = require('pdfkit');
const fs = require('fs');
const { fontSize } = require('pdfkit');
const PDEError = require('../errors/customErrorClass');
const { getUserInfo } = require('../plugins/auth/authService');
const documentDetailsModel = require('../model/documentDetailsModel');
const OracleDao = require('../dao/oracleDbDaos');
const orDbDao = new OracleDao();


const generatReport = async (data, reportType, documentPath, loginDetails) => {
	let checkSlip = JSON.parse(JSON.stringify(checkSlipReport));
	try {
		let [naturetype, rest] = data.registrationType.TRAN_DESC.split(" ");
		//const vswsDataType=data.regWith ='Vsws'
		let loginType;
		let loginDisplay;
		if (data.regWith != 'Vsws') {
			let DocumentDetails = await documentDetailsModel.aggregate([
				{
					$match: {
						documentId: data.applicationId
					}
				},
				{
					$lookup: {
						from: 'users',
						let: { uid: "$userId" },
						pipeline: [
							{
								$match: {
									$expr: { $eq: ["$_id", { $toObjectId: "$$uid" }] }
								}
							}
						],
						as: "userDetails"
					}
				}
			]);

			let user = DocumentDetails[0].userDetails;
			let userData = Array.isArray(user) ? user[0] : user;

			if (userData.loginName == 'Titdco') {
				loginType = userData.loginName;
			} else if (userData.loginName == 'APIIC') {
				loginType = userData.loginName;
			}
			else {
				loginType = userData.loginName;
			}
			if (userData.loginMobile && userData.loginMobile !== "") {
				loginDisplay = maskPhoneNumber(userData.loginMobile);
			} else if (userData.aadhar) {
				loginDisplay = maskAadhaar(userData.aadhar);
			}
			else if (userData.loginEmail) {
				loginDisplay = maskEmail(userData.loginEmail)
			}
			else {
				loginDisplay = "";
			}
		}
		let doctstattus = data.documentNature.TRAN_MAJ_CODE === '01' && data.documentNature.TRAN_MIN_CODE === '27';
		let barcode = await generateBarcodeBase64(data.applicationId);
		let DummyImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBw0NDQ0NDQ0ICA0IDQ0NDQ0NDQ8IDQ0NFREWFhURExMYHSggGBolGxMTITEhJSkrLi4uFx8zODMsNygtLisBCgoKDQ0NDg0PDy0ZFRk3KzctKysrKy03LTctKzcrKystKystKysrKysrKysrKysrKysrKysrKysrKysrKysrK//AABEIAPYAzQMBIgACEQEDEQH/xAAZAAEBAQEBAQAAAAAAAAAAAAAAAQMEAgf/xAAqEAEBAAECBQQCAgIDAAAAAAAAAQIDERIhQWFxBDFRgZGhYrEi8BMUQv/EABcBAQEBAQAAAAAAAAAAAAAAAAABAgP/xAAWEQEBAQAAAAAAAAAAAAAAAAAAARH/2gAMAwEAAhEDEQA/APqYDq5gAAAAAIAAioAAACAAgAACKgAABEWA1AAAAAABAAecspPeyAoxvqJ0lv6eL6i/GM/ZhrpHL/z5fx/C/wDYy/iuGugYT1HzPxWmOrjeu3nkmD2hQAAEAARUAIUgNgAAAAAQGHqNT/zOvuBq6/TH8ue37BpAAQQAAAe8NSzvPh045SzeON608+G/2liutDf9iKAAgAIsRQbAAAAIAJldpb8OG3e7/Lq9Tf8AHzXKsSgCoAgAAAAAAN/T5ctvhq5dG7ZTvydSVqCAgIqAKhAbgAAAgAOf1XT7YNvVe88Vi1EoAIIUAAAAAQAXG855jscUdiVYAiKAAECA3AAQoAioDn9V0+2Lf1PT7YNRKAggAAAACAAAs955dbkw955jrSrBARQEAWIQHQioAACAA49TLe2/7s8g0ygAAAAACFAAAHRpZbzxyc7f0/tfKVY0ARRFQAgQG4ACAAADj1MdsrHh16unxdrHLnjZyrURABAABKqAAAAAOnSm0882eGl1v4bJVgCIoAARCA6AQAAAEAYepntfpu86mO8s+QrjAaZAQAAAABcJvZPlGuhj1+hWwDKoAACAECA6EKCgAggAIqA59fDa79L/AGydmU3m3y5M8drtViIgKgAAACyb8vl04zabfDxo4bc771olagiogAAIUAIEBuAACAAgAADPWxll7c2jPWu2N/AOUBpkAAaaOMt59GbTQvPzBW4DKoAACAAAhAgOgABAAqDznnJ7366g9Fv058te9OX7rLK2++9XE105a2M7+GOrqcXaRmLhoAIAAEu3P4AG01p13n7e5lL7VzCYuuoc+OpZ38tMdWXsmK9gAIqAERYDoRUtAec85Pdlqa/TH8sLftcTWuetb7f4z9sgUEVBAAAAAAAABFQAEB6xzsa46svvy/pgGK6hz452d42xylZxVWIQVvnlJzrl1NS5dp8Jnlbd68rIzoAqAAIAAAAAAAAACAAIAAABL9ADbDU35X3/ALe45mmGp880salQBWQABAAAAAAAAAAQAAQAAAAAAAAGvBexwXsApwXsnBeygJwXscF7ABwXscPgAOG9k4b2UBOG9jhvYAOG9jhvYAOHwcN7ACcHg4PAAcN7HDewAcPg4fAJonD4OHwAHD4OHwoaP//Z"
		if (data.regWith == 'Vsws') {
			loginType = 'VSWS';
		}
		let barcoderow = [
			{
				style: 'insideTable1',
				table: {
					widths: [260, '*'],   // Only 2 columns
					body: [
						[{
							text: [
								{ text: `User Name : `, fontSize: 8, bold: true, margin: [10, 5, 0, 0] },
								{ text: `${loginType}\n`, fontSize: 8, bold: false },
								...(loginType === 'Titdco' || loginType === 'APIIC' || loginType === 'VSWS'
									? [] : [
										{ text: 'Login By : ', fontSize: 8, bold: true, margin: [10, 2, 0, 0] },
										{ text: loginDisplay ? `(${loginDisplay})` : '-', fontSize: 8, bold: false }
									])
							],
						},
						{
							columns: [
								{
									text: 'Application ID: ',
									fontSize: 9,
									bold: true,
									alignment: 'right',
									margin: [0, 8, 5, 0]
								},
								{
									image: barcode,
									width: 130,
									height: 20,
									alignment: 'right',
									margin: [0, 5, 0, 0]
								}
							]
						}
						]
					]
				},

			}

		];

		if (naturetype == "Gift") {
			naturetype = "SETTLEMENT";
		}
		let partyType1 = naturetype == "SETTLEMENT" ? "SETTLOR" : naturetype == "Mortgage" ? "MORTGAGOR" : naturetype == "Release" ? "RELEASOR" : "VENDOR";
		let partyType2 = naturetype == "SETTLEMENT" ? "SETTLEE" : naturetype == "Mortgage" ? "MORTGAGEE(S)S" : naturetype == "Release" ? "RELEASEES" : "VENDEE";
		let covenantArr = [];
		if (data?.covanants) {
			let sNo = naturetype === "Sale" ? 6 : naturetype === "Mortgage" ? 4 : naturetype === "SETTLEMENT" ? 6 : 3;
			data?.covanants?.covanants.map((covn) => {
				let val = sNo === 6 || sNo === 4 || sNo === 9 ? `${sNo}.${covn.value}` : `\n${sNo}.${covn.value}`
				covenantArr = [...covenantArr, val];
				sNo = sNo + 1;
			})
		};
		var [dd, m, yyyy] = data.executionDate.split("/");
		// var dd = String(exDate.getDate()).padStart(2, '0');
		var mm = new Date(`${yyyy}-${m}-${dd}`).toLocaleDateString('en-US', { month: 'long' })
		if (reportType == "checkSlip") {
			checkSlip.content = [];
			checkSlip.content.push({
				columns: [
					{
						image: Path.resolve(__dirname, '', '../../logos/ap_logo.jpg'),
						height: 70,
						width: 70,
						style: ['header']
					},
					{ text: 'Government of Andhra Pradesh' + '\n' + 'Registration and Stamps Department', style: ['title'] }
				]
			})
			let [reg, rest] = data.registrationType.TRAN_DESC.split("[")
			let [regSubType, restw] = data?.documentNature?.TRAN_DESC.split("[")
			checkSlip.content.push({
				table: {
					body: [
						barcode ? barcoderow : [[]],
						[{
							text: `Public Data Entry (PDE)`, alignment: 'center', fillColor: '#50c4eb',
							color: '#343f42',
						}],
						[
							{
								style: 'insideTable1',
								table: {
									widths: [110, '*', '*'],
									body: [
										[
											{
												columns: [{ text: `Type of Registration`, fontSize: 8, bold: true, margin: [10, 5, -100, 0] },
												{ text: '\n' + `${reg}`, fontSize: 8, margin: [-20, 6, 0, 0] }
												]
											},
											{
												columns: [
													{
														text: 'Government Of AndhraPradesh', fontSize: 8, bold: true, decoration: 'underline', margin: [20, 5, -100, 0]
													},
													{
														text: `Registration And Stamps Department`, fontSize: 8, margin: [-67, 18, 10, 0]
													}
												]
											},
											{

												columns: [
													{ text: `SRO Code :` + '\n' + `SRO Name :` + '\n' + `District Name :` + '\n' + `Mandal:` + '\n' + `Village:`, fontSize: 8, bold: true, alignment: 'left' },
													{ text: `${data.sroCode}` + '\n' + `${data.sroOffice}` + '\n' + `${data.district}` + '\n' + `${data.mandal}` + '\n' + `${data.village}`, fontSize: 6, margin: [-10, 2, 0, 0] },
												],
											}

										]
									]
								}
							}
						],
						[
							{
								text: 'Document Details', alignment: 'center', fillColor: '#50c4eb',
								color: '#343f42',
							}
						],
						[
							{
								style: 'insideTable1',
								table: {
									widths: [130, 80, 120, 130],
									body: [
										[
											{
												text: [
													{ text: 'Trans. ID:', fontSize: 8, bold: true }, { text: ` ${data.applicationId}`, fontSize: 8, margin: [20, 5, 20, 0] },
													{ text: '\nDocument Nature: ', fontSize: 8, bold: true }, { text: ` ${regSubType} ${(data.property.length > 0 && (Object.keys(data?.property[0]?.Go134).length > 0 || Object.keys(data?.property[0]?.Go84).length > 0) ? `(${Object.keys(data?.property[0]?.Go134).length > 0 ? 'GO-134' : 'GO-84'})` : '')}`, fontSize: 8 }
												]
											},
											{
												text: [
													{ text: '               ' },
													{ text: 'Year : ', bold: true, fontSize: 8, alignment: 'center', margin: [20, 45, 10, 0] }, { text: `${yyyy}`, fontSize: 8, alignment: 'center' },
												]
											},
											{
												text: [
													{ text: '               ' },
													{ text: 'Date of Stamp Purchased : ', bold: true, fontSize: 8, alignment: 'left' }, { text: `${data?.stampPurchaseDate}`, fontSize: 8, },
												]
											},
											{
												text: [
													{ text: '               ' },
													{ text: 'Date of Execution : ', bold: true, fontSize: 8, alignment: 'left' }, { text: `${data?.executionDate}`, fontSize: 8, },
												]
											}
										]
									]
								}
							}
						],
					]
				}, style: ["tableExample2"]
			});

			// const printPanOrFormHeader = (party) =>{
			// 	if(party?.isSelectedPanOrForm60){
			// 		return party?.isSelectedPanOrForm60 == "pan" ? "PAN" : "Form 60/61";
			// 	}
			// 	return party?.panNoOrForm60or61 == "" ? "Form 60/61" : "PAN";
			// }

			const printPanOrFormOrTinOrTanValue = (party) => {
				return (
					((party.partyType?.replace(/\s+/g, "") == 'OCI' || party.partyType?.replace(/\s+/g, "") == 'NRI') && party.panNoOrForm60or61?.replace(/\s+/g, "") == "") ?
						"-" :
						party.isSelectedPanOrForm60 == "pan" ?
							`${party.panNoOrForm60or61.toUpperCase()} (PAN)`
							:
							(party.isSelectedPanOrForm60 == "tin" ?
								`${party.tin} (TIN)`
								:
								(party.isSelectedPanOrForm60 == "tan" ?
									`${party.tan} (TAN)`
									:
									"Form 60/61 Selected"
								)
							)
				)
			}


			let exArry = [
				{
					style: 'insideTable2',
					table: {
						widths: [25, 60, 101, 56, 26, 20, 55, 80],
						body: [
							[
								{ text: 'S.No.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Photo.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Name', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'PAN/TAN/TIN or Form 60/61', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: "center" },
								{ text: 'PartyNo', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Age', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Relation Name', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Address', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' }
							],

						]
					}
				}
			];
			let clArry = [
				{
					style: 'insideTable2',
					table: {
						widths: [25, 60, 101, 56, 26, 20, 55, 80],
						body: [
							[
								{ text: 'S.No.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Photo.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Name', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'PAN/TAN/TIN or Form 60/61', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: "center" },
								{ text: 'PartyNo', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Age', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Relation Name', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Address', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' }
							],

						]
					}
				}
			];
			let repArryEx = [
				{
					style: 'insideTable2',
					table: {
						widths: [25, 60, 101, 56, 26, 20, 55, 80],
						body: [
							[
								{ text: 'S.No.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Photo.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Name', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'PAN/TAN/TIN or Form 60/61', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: "center" },
								{ text: 'Represented To', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Age', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Relation Name', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Address', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' }
							],

						]
					}
				}
			];
			let repArryCl = [
				{
					style: 'insideTable2',
					table: {
						widths: [25, 60, 101, 56, 26, 20, 55, 80],
						body: [
							[
								{ text: 'S.No.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Photo.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Name', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'PAN/TAN/TIN or Form 60/61', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: "center" },
								{ text: 'Represented To', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Age', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Relation Name', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Address', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' }
							],

						]
					}
				}
			];
			if (data?.executent && data?.executent?.length > 0) {
				checkSlip.content[1].table.body.push([{
					text: 'Seller Details', alignment: 'center', fillColor: '#50c4eb',
					color: '#343f42',
				}]);
				let sNo = 0;
				for (let i in data.executent) {
					let a;
					if (sNo === 0) {
						a = [
							{ text: sNo + 1, fontSize: 8 },
							{
								image: data.executent[i]?.aadharDetails?.encodedPhoto ? `data:image/jpeg;base64,${data.executent[i]?.aadharDetails?.encodedPhoto.toString('base64')}` : DummyImage,
								height: 55,
								width: 60,
								alignment: 'center',
							},
							{ text: `${toTitleCase(data.executent[i].name)} ${data?.executent[i]?.aadhaar ? `\nAadhar: ${maskAadhaar(data?.executent[i]?.aadhaar.length > 12 ? DecryptAdrwithPkcs(data?.executent[i]?.aadhaar) : data?.executent[i]?.aadhaar)}` : ''}${data?.executent[i]?.passportNumber ? `\nPassport Number: ${data?.executent[i]?.passportNumber}` : ''}${data?.executent[i]?.fileNo ? `\nPassport File No.: ${data?.executent[i]?.fileNo}` : ''}${data?.executent[i]?.dateOfBrith ? `\n${data?.executent[i]?.partyType === 'Deceased' ? 'Date of Death' : 'Date of Birth'}: ${data?.executent[i]?.dateOfBrith}` : ''}${data?.executent[i]?.doi ? `\nDate of Issued: ${data?.executent[i]?.doi}` : ''}${data?.executent[i]?.passportExpireDate ? `\nPassport Expire Date: ${data?.executent[i]?.passportExpireDate}` : ''}${data?.executent[i]?.placeOfIssue ? `\nPlace of Issue: ${data?.executent[i]?.placeOfIssue}` : ''}${data?.executent[i]?.partyType !== 'Deceased' ? `\nMobile No.: ${maskPhoneNumber(data?.executent[i]?.phone)}` : ''}`, fontSize: 8 },
							{ text: `${printPanOrFormOrTinOrTanValue(data?.executent[i])}`, fontSize: 8 },
							{ text: data.executent[i].seqNumber, fontSize: 8 },
							{ text: data.executent[i].age, fontSize: 8 },
							{ text: `${data.executent[i].relationType}.${toTitleCase(data.executent[i].relationName)}`, fontSize: 8 },
							{ text: toTitleCase(data.executent[i].address), fontSize: 8 },
						]
						sNo = sNo + 1;
					} else {
						a = [
							{ text: sNo + 1, fontSize: 8 },
							{
								image: data.executent[i]?.aadharDetails?.encodedPhoto ? `data:image/jpeg;base64,${data.executent[i]?.aadharDetails?.encodedPhoto.toString('base64')}` : DummyImage,
								height: 55,
								width: 60,
								alignment: 'center',
							},
							{ text: `${toTitleCase(data.executent[i].name)} ${data?.executent[i]?.aadhaar ? `\nAadhar: ${maskAadhaar(data?.executent[i]?.aadhaar.length > 12 ? DecryptAdrwithPkcs(data?.executent[i]?.aadhaar) : data?.executent[i]?.aadhaar)}` : ''}${data?.executent[i]?.passportNumber ? `\nPassport Number: ${data?.executent[i]?.passportNumber}` : ''}${data?.executent[i]?.fileNo ? `\nPassport File No.: ${data?.executent[i]?.fileNo}` : ''}${data?.executent[i]?.dateOfBrith ? `\n${data?.executent[i]?.partyType === 'Deceased' ? 'Date of Death' : 'Date of Birth'}: ${data?.executent[i]?.dateOfBrith}` : ''}${data?.executent[i]?.doi ? `\nDate of Issued: ${data?.executent[i]?.doi}` : ''}${data?.executent[i]?.passportExpireDate ? `\nPassport Expire Date: ${data?.executent[i]?.passportExpireDate}` : ''}${data?.executent[i]?.placeOfIssue ? `\nPlace of Issue: ${data?.executent[i]?.placeOfIssue}` : ''}${data?.executent[i]?.partyType !== 'Deceased' ? `\nMobile No.: ${maskPhoneNumber(data?.executent[i]?.phone)}` : ''}`, fontSize: 8 },
							{ text: `${printPanOrFormOrTinOrTanValue(data?.executent[i])}`, fontSize: 8 },
							{ text: data.executent[i].seqNumber, fontSize: 8 },
							{ text: data.executent[i].age, fontSize: 8 },
							{ text: `${data.executent[i].relationType}.${toTitleCase(data.executent[i].relationName)}`, fontSize: 8 },
							{ text: toTitleCase(data.executent[i].address), fontSize: 8 },
						]
						sNo = sNo + 1;
					}
					// const a = [i+1,data.executent[i].name,data.executent[i].age,data.executent[i].relationName,data.executent[i].address];
					exArry[0].table.body.push(a);
				}
				checkSlip.content[1].table.body.push(exArry);
				// checkSlip.content[1].table.body[5]=[...checkSlip.content[1].table.body[5],];
			} else {
				const a = ["", "", "", "", ""];
				exArry[0].table.body.push(a);
				// checkSlip.content[1].table.body.push(exArry)
			};
			if (data?.executent && data?.executent?.length > 0) {
				let seNo = 0;
				for (let i in data.executent) {
					if (data.executent[i].represent && data.executent[i].represent.length > 0) {
						for (let j in data.executent[i].represent) {
							let a;
							if (seNo === 0) {
								a = [
									{ text: seNo + 1, fontSize: 8 },
									{
										image: data.executent[i]?.represent[j]?.aadharDetails?.encodedPhoto ? `data:image/jpeg;base64,${data.executent[i]?.represent[j]?.aadharDetails?.encodedPhoto.toString('base64')}` : DummyImage,
										height: 55,
										width: 60,
										alignment: 'center',
									},
									{ text: `${toTitleCase(data.executent[i].represent[j].name)}${data?.executent[i]?.represent[j]?.aadhaar ? `\nAadhar: ${maskAadhaar(data?.executent[i]?.represent[j]?.aadhaar.length > 12 ? DecryptAdrwithPkcs(data?.executent[i]?.represent[j]?.aadhaar) : data?.executent[i]?.represent[j]?.aadhaar)}` : ''}\nMobile No.: ${maskPhoneNumber(data?.executent[i]?.represent[j]?.phone)}`, fontSize: 8 },
									{ text: `${printPanOrFormOrTinOrTanValue(data?.executent[i]?.represent[j])}`, fontSize: 8 },
									{ text: data.executent[i].seqNumber, fontSize: 8 },
									{ text: data.executent[i].represent[j].age, fontSize: 8 },
									{ text: `${data.executent[i].represent[j].relationType}.${toTitleCase(data.executent[i].represent[j].relationName)}`, fontSize: 8 },
									{ text: toTitleCase(data.executent[i].represent[j].address), fontSize: 8 },
								]
								seNo = seNo + 1;
							} else {
								a = [
									{ text: seNo + 1, fontSize: 8 },
									{
										image: data.executent[i]?.represent[j]?.aadharDetails?.encodedPhoto ? `data:image/jpeg;base64,${data.executent[i]?.represent[j]?.aadharDetails?.encodedPhoto.toString('base64')}` : DummyImage,
										height: 55,
										width: 60,
										alignment: 'center',
									},
									{ text: `${toTitleCase(data.executent[i].represent[j].name)}${data?.executent[i]?.represent[j]?.aadhaar ? `\nAadhar: ${maskAadhaar(data?.executent[i]?.represent[j]?.aadhaar.length > 12 ? DecryptAdrwithPkcs(data?.executent[i]?.represent[j]?.aadhaar) : data?.executent[i]?.represent[j]?.aadhaar)}` : ''}\nMobile No.: ${maskPhoneNumber(data?.executent[i]?.represent[j]?.phone)}`, fontSize: 8 },
									{ text: `${printPanOrFormOrTinOrTanValue(data?.executent[i]?.represent[j])}`, fontSize: 8 },
									{ text: data.executent[i].seqNumber, fontSize: 8 },
									{ text: data.executent[i].represent[j].age, fontSize: 8 },
									{ text: `${data.executent[i].represent[j].relationType}.${toTitleCase(data.executent[i].represent[j].relationName)}`, fontSize: 8 },
									{ text: toTitleCase(data.executent[i].represent[j].address), fontSize: 8 },
								]
								seNo = seNo + 1;
							}
							repArryEx[0].table.body.push(a);
						}
					}
				}
				// if(repArryEx && repArryEx[0].table  && repArryEx[0].table.body   && repArryEx[0].table.body.length >1){
				checkSlip.content[1].table.body.push([{
					text: 'Seller Representative Details', alignment: 'center', fillColor: '#50c4eb',
					color: '#343f42',
				}]);
				checkSlip.content[1].table.body.push(repArryEx);
				//  }

			} else {
				const a = ["", "", "", "", ""];
				repArryEx[0].table.body.push(a);
			}

			if (data?.claimant && data?.claimant?.length > 0) {
				checkSlip.content[1].table.body.push([{
					text: 'Buyer Details', alignment: 'center', fillColor: '#50c4eb',
					color: '#343f42',
				}]);
				let sNo = 0;
				for (let i in data.claimant) {
					let a;
					if (sNo === 0) {
						a = [
							{ text: sNo + 1, fontSize: 8 },
							{
								image: data?.claimant[i]?.aadharDetails?.encodedPhoto ? `data:image/jpeg;base64,${data?.claimant[i]?.aadharDetails?.encodedPhoto.toString('base64')}` : DummyImage,
								height: 55,
								width: 60,
								alignment: 'center',
							},
							{ text: `${toTitleCase(data.claimant[i].name)} ${data?.claimant[i]?.nameTe ? `\n${toTitleCase(data.claimant[i].nameTe)}` : ''}${data?.claimant[i]?.aadhaar ? `\nAadhar: ${maskAadhaar(data?.claimant[i]?.aadhaar.length > 12 ? DecryptAdrwithPkcs(data?.claimant[i]?.aadhaar) : data?.claimant[i]?.aadhaar)}` : ''}${data?.claimant[i]?.passportNumber ? `\nPassport Number: ${data?.claimant[i]?.passportNumber}` : ''}${data?.claimant[i]?.fileNo ? `\nPassport File No.: ${data?.claimant[i]?.fileNo}` : ''}${data?.claimant[i]?.dateOfBrith ? `\nDate of Birth: ${data?.claimant[i]?.dateOfBrith}` : ''}${data?.claimant[i]?.doi ? `\nDate of Issued: ${data?.claimant[i]?.doi}` : ''}${data?.claimant[i]?.passportExpireDate ? `\nPassport Expire Date: ${data?.claimant[i]?.passportExpireDate}` : ''}${data?.claimant[i]?.placeOfIssue ? `\nPlace of Issue: ${data?.claimant[i]?.placeOfIssue}` : ''}\nMobile No.: ${maskPhoneNumber(data?.claimant[i]?.phone)}`, fontSize: 8 }, { text: `${printPanOrFormOrTinOrTanValue(data?.claimant[i])}`, fontSize: 8 },
							{ text: data.claimant[i].seqNumber, fontSize: 8 },
							{ text: data.claimant[i].age, fontSize: 8 },
							{ text: `${data.claimant[i].relationType}.${toTitleCase(data.claimant[i].relationName)} ${data?.claimant[i]?.relationType ? `\n${toTitleCase(data.claimant[i].relationNameTe)}` : ''}`, fontSize: 8 },
							{ text: toTitleCase(data.claimant[i].address), fontSize: 8 },
						]
						sNo = sNo + 1;
					} else {
						a = [
							{ text: sNo + 1, fontSize: 8 },
							{
								image: data?.claimant[i]?.aadharDetails?.encodedPhoto ? `data:image/jpeg;base64,${data?.claimant[i]?.aadharDetails?.encodedPhoto.toString('base64')}` : DummyImage,
								height: 55,
								width: 60,
								alignment: 'center',
							},
							{ text: `${toTitleCase(data.claimant[i].name)} ${data?.claimant[i]?.nameTe ? `\n${toTitleCase(data.claimant[i].nameTe)}` : ''}${data?.claimant[i]?.aadhaar ? `\nAadhar: ${maskAadhaar(data?.claimant[i]?.aadhaar.length > 12 ? DecryptAdrwithPkcs(data?.claimant[i]?.aadhaar) : data?.claimant[i]?.aadhaar)}` : ''}${data?.claimant[i]?.passportNumber ? `\nPassport Number: ${data?.claimant[i]?.passportNumber}` : ''}${data?.claimant[i]?.fileNo ? `\nPassport File No.: ${data?.claimant[i]?.fileNo}` : ''}${data?.claimant[i]?.dateOfBrith ? `\nDate of Birth: ${data?.claimant[i]?.dateOfBrith}` : ''}${data?.claimant[i]?.doi ? `\nDate of Issued: ${data?.claimant[i]?.doi}` : ''}${data?.claimant[i]?.passportExpireDate ? `\nPassport Expire Date: ${data?.claimant[i]?.passportExpireDate}` : ''}${data?.claimant[i]?.placeOfIssue ? `\nPlace of Issue: ${data?.claimant[i]?.placeOfIssue}` : ''}\nMobile No.: ${maskPhoneNumber(data?.claimant[i]?.phone)}`, fontSize: 8 }, { text: `${printPanOrFormOrTinOrTanValue(data?.claimant[i])}`, fontSize: 8 },
							{ text: data.claimant[i].seqNumber, fontSize: 8 },
							{ text: data.claimant[i].age, fontSize: 8 },
							{ text: `${data.claimant[i].relationType}.${toTitleCase(data.claimant[i].relationName)} ${data?.claimant[i]?.relationType ? `\n${toTitleCase(data.claimant[i].relationNameTe)}` : ''}`, fontSize: 8 },
							{ text: toTitleCase(data.claimant[i].address), fontSize: 8 },
						]
						sNo = sNo + 1;
					}
					// const a = [i+1,data.claimant[i].name,data.claimant[i].age,data.claimant[i].relationName,data.claimant[i].address];
					clArry[0].table.body.push(a);
				}

				checkSlip.content[1].table.body.push(clArry);
				// checkSlip.content[1].table.body[5]=[...checkSlip.content[1].table.body[5],];
			} else {
				const a = ["", "", "", "", ""];
				clArry[0].table.body.push(a);
				// checkSlip.content[1].table.body.push(clArry)
			};
			if (data?.claimant && data?.claimant?.length > 0) {
				let seNo = 0;
				for (let i in data.claimant) {
					if (data.claimant[i].represent && data.claimant[i].represent.length > 0) {
						for (let j in data.claimant[i].represent) {
							let a;
							if (seNo === 0) {
								a = [
									{ text: seNo + 1, fontSize: 8 },
									{
										image: data.claimant[i]?.represent[j]?.aadharDetails?.encodedPhoto ? `data:image/jpeg;base64,${data.claimant[i]?.represent[j]?.aadharDetails?.encodedPhoto.toString('base64')}` : DummyImage,
										height: 55,
										width: 60,
										alignment: 'center',
									},
									{ text: `${toTitleCase(data.claimant[i].represent[j].name)}  ${data?.claimant[i]?.represent[j]?.aadhaar ? `\nAadhar: ${maskAadhaar(data?.claimant[i]?.represent[j]?.aadhaar.length > 12 ? DecryptAdrwithPkcs(data?.claimant[i]?.represent[j]?.aadhaar) : data?.claimant[i]?.represent[j]?.aadhaar)}` : ''}\nMobile No.: ${maskPhoneNumber(data?.claimant[i]?.represent[j]?.phone)}`, fontSize: 8 },
									{ text: `${printPanOrFormOrTinOrTanValue(data?.claimant[i]?.represent[j])}`, fontSize: 8 },
									{ text: data.claimant[i].seqNumber, fontSize: 8 },
									{ text: data.claimant[i].represent[j].age, fontSize: 8 },
									{ text: `${data.claimant[i].represent[j].relationType}.${toTitleCase(data.claimant[i].represent[j].relationName)}`, fontSize: 8 },
									{ text: toTitleCase(data.claimant[i].represent[j].address), fontSize: 8 },
								]
								seNo = seNo + 1;
							} else {
								a = [
									{ text: seNo + 1, fontSize: 8 },
									{
										image: data.claimant[i].represent[j].aadharDetails?.encodedPhoto ? `data:image/jpeg;base64,${data.claimant[i].represent[j].aadharDetails?.encodedPhoto.toString('base64')}` : DummyImage,
										height: 55,
										width: 60,
									},
									{ text: `${toTitleCase(data.claimant[i].represent[j].name)}  ${data?.claimant[i]?.represent[j]?.aadhaar ? `\nAadhar: ${maskAadhaar(data?.claimant[i]?.represent[j]?.aadhaar.length > 12 ? DecryptAdrwithPkcs(data?.claimant[i]?.represent[j]?.aadhaar) : data?.claimant[i]?.represent[j]?.aadhaar)}` : ''}\nMobile No.: ${maskPhoneNumber(data?.claimant[i]?.represent[j]?.phone)}`, fontSize: 8 },
									{ text: `${printPanOrFormOrTinOrTanValue(data?.claimant[i]?.represent[j])}`, fontSize: 8 },
									{ text: data.claimant[i].seqNumber, fontSize: 8 },
									{ text: data.claimant[i].represent[j].age, fontSize: 8 },
									{ text: `${data.claimant[i].represent[j].relationType}.${toTitleCase(data.claimant[i].represent[j].relationName)}`, fontSize: 8 },
									{ text: toTitleCase(data.claimant[i].represent[j].address), fontSize: 8 },
								]
								seNo = seNo + 1;
							}
							// const a = [i+1,data.claimant[i].represent[j].name,data.claimant[i].represent[j].age,data.claimant[i].represent[j].relationName,data.claimant[i].represent[j].address];
							repArryCl[0].table.body.push(a);
						}
					}
				}
				//  if(repArryCl && repArryCl[0].table && repArryCl[0].table.body && repArryCl[0].table.body.length >1){
				checkSlip.content[1].table.body.push([{
					text: 'Buyer Representative Details', alignment: 'center', fillColor: '#50c4eb',
					color: '#343f42',
				}]);
				checkSlip.content[1].table.body.push(repArryCl);
				//  }

			} else {
				const a = ["", "", "", "", "", ""];
				repArryCl[0].table.body.push(a);
			}
			// checkSlip.content[1].table.body.push([{text:'Representative Details',alignment:'center',fillColor: '#50c4eb',
			// color: '#343f42',}]);
			// if(data?.executent && data?.executent?.length >0 || data?.claimant && data?.claimant?.length >0){
			// 	let seNo=0;
			// 	for(let i in data.executent){
			// 		if(data.executent[i].represent && data.executent[i].represent.length >0){
			// 			for(let j in data.executent[i].represent){
			// 				let a;
			// 				if(seNo === 0){
			// 					a  = [
			// 						{text:seNo+1,fontSize:8},
			// 						{text:toTitleCase(data.executent[i].represent[j].name),fontSize:8},
			// 						{text:data.executent[i].represent[j].age,fontSize:8},
			// 						{text:`${data.executent[i].represent[j].relationType}.${toTitleCase(data.executent[i].represent[j].relationName)}`,fontSize:8},
			// 						{text:toTitleCase(data.executent[i].represent[j].address),fontSize:8},
			// 					]
			// 					seNo = seNo +1;
			// 				}else{
			// 					a  = [
			// 						{text:seNo+1,fontSize:8},
			// 						{text:toTitleCase(data.executent[i].represent[j].name),fontSize:8},
			// 						{text:data.executent[i].represent[j].age,fontSize:8},
			// 						{text:`${data.executent[i].represent[j].relationType}.${toTitleCase(data.executent[i].represent[j].relationName)}`,fontSize:8},
			// 						{text:toTitleCase(data.executent[i].represent[j].address),fontSize:8},
			// 					]
			// 					seNo = seNo +1;
			// 				}
			// 				repArry[0].table.body.push(a);
			// 			}
			// 		}
			// 	}
			// 	for(let i in data.claimant){
			// 		if(data.claimant[i].represent && data.claimant[i].represent.length >0){
			// 			for(let j in data.claimant[i].represent){
			// 				let a;
			// 				if(seNo === 0){
			// 					a  = [
			// 						{text:seNo+1,fontSize:8},
			// 						{text:toTitleCase(data.claimant[i].represent[j].name),fontSize:8},
			// 						{text:data.claimant[i].represent[j].age,fontSize:8},
			// 						{text:`${data.claimant[i].represent[j].relationType}.${toTitleCase(data.claimant[i].represent[j].relationName)}`,fontSize:8},
			// 						{text:toTitleCase(data.claimant[i].represent[j].address),fontSize:8},
			// 					]
			// 					seNo = seNo +1;
			// 				}else{
			// 					a  = [
			// 						{text:seNo+1,fontSize:8},
			// 						{text:toTitleCase(data.claimant[i].represent[j].name),fontSize:8},
			// 						{text:data.claimant[i].represent[j].age,fontSize:8},
			// 						{text:`${data.claimant[i].represent[j].relationType}.${toTitleCase(data.claimant[i].represent[j].relationName)}`,fontSize:8},
			// 						{text:toTitleCase(data.claimant[i].represent[j].address),fontSize:8},
			// 					]
			// 					seNo = seNo +1;
			// 				}
			// 				// const a = [i+1,data.claimant[i].represent[j].name,data.claimant[i].represent[j].age,data.claimant[i].represent[j].relationName,data.claimant[i].represent[j].address];
			// 				repArry[0].table.body.push(a);
			// 			}
			// 		}
			// 	}
			// 	if(repArry && repArry.length >0){
			// 		checkSlip.content[1].table.body.push([{text:'Representative Details',alignment:'center',fillColor: '#50c4eb',
			// 		color: '#343f42',}]);
			// 	}
			// 	checkSlip.content[1].table.body.push(repArry);
			// 	// checkSlip.content[1].table.body[5]=[...checkSlip.content[1].table.body[5],];
			// }else{
			// 	const a = ["","","","",""];
			// 	repArry[0].table.body.push(a);
			// 	// checkSlip.content[1].table.body.push(repArry)
			// };


			let propArry = [
				{
					style: 'insideTable5',
					table: {
						widths: [40, 130, 120, 100, 60],
						body: [
							[
								{ text: 'S.No.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'SRO/District/Mandal/Village/Town/Boundaries', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Door/Flat/Plot/Survey No./LPM No./Extent', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Land Use', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Market Value / Unit Rate', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
							],
							// [
							// 	{text:`${fData.propDNo}`,fontSize:8},{text:`${fData.propVillage}`,fontSize:8},{text:`${fData.propDNo}`,fontSize:8},{text:`${fData.propLandType}`,fontSize:8},{text:`${fData.PropMarkValue}`,fontSize:8},{text:`${fData.propUnitCost}`,fontSize:8}
							// ]
						]
					}
				}

			]

			if (data && data?.property && data.property.length > 0) {
				checkSlip.content[1].table.body.push([{
					text: 'Details of the Property', alignment: 'center', fillColor: '#50c4eb',
					color: '#343f42',
				}])
				let sNo = 0;
				for (let i of data.property) {
					let a;
					let mv = i.marketValue ? i.marketValue : 0;
					let [landUse, rest] = i.landUse.split("[");
					let exUnit = i.extentUnit ? i.extentUnit.split("[")[0] : "";
					if (exUnit === undefined) {
						exUnit = ""
					}
					let sroCode = i.sroCode ? i.sroCode : "";
					let sroOffice = i.sroOffice ? i.sroOffice : "";
					let district = i.district ? i.district : "";
					let mandal = i.mandal ? i.mandal : "";
					let village = i.village ? i.village : "";
					let surveyNo = i.survayNo ? i.survayNo : "";
					let urbanLanduse = i.landUseCode === "01" || i.landUseCode === "02" ? "Sq.Feet" : "Sq.Yards";
					let plot = i.plotNo ? i.plotNo : "";
					let flatNo = i.flatNo ? i.flatNo : "";
					let doorNo = i.doorNo ? i.doorNo : "";
					let extrate = i.ext_Rate ? i.ext_Rate : "";
					let lpmNo = i?.lpmNo ? i?.lpmNo : "";
					let nearDoorNo = i?.nearTodoorNo ? `nearDoorNo: ${i?.nearTodoorNo}` : "";
					let eleSrvcNo = i?.eleSrvcNo ? `Electricity Service No: ${i?.eleSrvcNo}` : "";
					let habitation = i?.habitation ? i.habitation : "";
					let ward = i?.ward ? (i?.biWard !== null && i?.biWard !== 0 && i?.biWard !== '' && i?.biWard) ? i.ward + '/' + i.biWard : i.ward : "";
					let block = i?.block ? (i?.biBlock !== null && i?.biBlock !== 0 && i?.biBlock !== '0' && i?.biBlock) ? i.block + '/' + i.biBlock : i.block : "";
					// let ward = i?.ward ? i.ward :"";
					// let block = i?.block ? i.block :"";
					let lBD = i.localBodyType
					if (String(i.localBodyType).includes('[')) {
						let [localbody, rest] = i.localBodyType.split('[');
						lBD = localbody;
					}
					let propType = i.propertyType.includes('RURAL') ? 'RURAL' : 'URBAN';
					if (i.typeOfProperty != "Others") {
						if (sNo === 0) {
							if (propType === "URBAN") {
								let flat = [];
								if (i.schedulePropertyType === "FLAT [ఫ్లాట్]") {
									flat = [{ text: '\nFlat Boundaries:\n', bold: true }, { text: 'East: ', bold: true }, `${i.flatEastBoundry}\n`, { text: 'West: ', bold: true }, `${i.flatWestBoundry}\n`, { text: 'North: ', bold: true }, `${i.flatNorthBoundry}\n`, { text: 'South: ', bold: true }, `${i.flatSouthBoundry}\n`];
								}
								a = ((boldTextLine = (label, value) => value ? [{ text: `${label}: `, bold: true }, `${value}\n`] : []) => [{ text: sNo + 1, fontSize: 8 }, { text: [{ text: `SRO Code: `, bold: true }, `${sroCode}\n`, { text: `SRO Office: `, bold: true }, `${sroOffice}\n`, `${district}\n`, `${mandal}\n`, `${village}\n`, ...boldTextLine('Type of LocalBody', lBD), ...boldTextLine('local Body Name', i.localBodyName), { text: `Property Boundaries:\n`, bold: true }, ...boldTextLine('East', i.eastBoundry), ...boldTextLine('West', i.westBoundry), ...boldTextLine('North', i.northBoundry), ...boldTextLine('South', i.southBoundry), ...flat], fontSize: 8, alignment: 'left' }, { text: [...boldTextLine('Habitation/Locality', habitation), ...boldTextLine('Ward/Bi-Ward', ward), ...boldTextLine('Block/Bi-Block', block), ...boldTextLine('DoorNo', doorNo), `${nearDoorNo}\n`, ...boldTextLine('Survey No.', surveyNo), ...boldTextLine('Lpm No.', lpmNo), ...boldTextLine('Plot', plot), ...boldTextLine('Flat No', flatNo), `${eleSrvcNo}\n`, ...boldTextLine('FlatTotal Extent', i.tExtent ? `${i.tExtent} ${exUnit}` : ''), ...boldTextLine('Property Being Sold', i.urban_selling_extent), ...boldTextLine('Layout Name', i.layoutName), ...boldTextLine('Undivided Share / Extent', i.undividedShare && i.undividedShareUnit ? `${i.undividedShare} ${i.undividedShareUnit}` : i.undividedShare || i.undividedShareUnit), ...boldTextLine('VLT NO. / LP NO. / IPLP NO', i.layoutNo), ...boldTextLine('RERA Approval No.', i.reraApprovalNo), ...boldTextLine('Building Approval No.', i.buildingApprovalNo), ...boldTextLine('Election Ward No.', i.electionWard), ...boldTextLine('Election Ward Name', i.electionWardName), ...boldTextLine('Ward Secretariat', i.secratariatWardName), ...boldTextLine('Apartment Name', i.appartmentName), ...boldTextLine('Unit', i.extentUnit)], fontSize: 8, alignment: 'left' }, { text: landUse, fontSize: 8, alignment: 'left' }, { text: [...boldTextLine('MarketValue', mv), ...boldTextLine('Unit Rate', extrate ? `${extrate} per Sq.Yards` : '')], fontSize: 8, alignment: 'left' }])();
								sNo = sNo + 1;
							} else {
								let lpm = i.lpmNo ? `\nLPM No : ${i.lpmNo}` : "";
								a = ((b = (label, val, suffix = '\n') => val ? [{ text: `${label}: `, bold: true }, `${val}${suffix}`] : []) => [{ text: sNo + 1, fontSize: 8 }, { text: [{ text: 'SRO Code: ', bold: true }, `${sroCode}\n`, { text: 'SRO Office: ', bold: true }, `${sroOffice}\n`, `${district}\n`, `${mandal}\n`, `${village}\n`, ...b('Type of LocalBody', lBD), ...b('local Body Name', i.localBodyName), ...b('East', i.eastBoundry, ',\n'), ...b('West', i.westBoundry, ',\n'), ...b('North', i.northBoundry, ',\n'), ...b('South', i.southBoundry, ',\n')], fontSize: 8, alignment: 'left' }, { text: [...b('Survey No.', surveyNo + (lpm ? ` ${lpm}` : '')), ...b('Total Extent', i.tExtent ? `${i.tExtent} ${exUnit}` : ''), ...b('Habitation/Locality', habitation), ...b('Layout Name', i.layoutName), ...b('Undivided Share / Extent', i.undividedShare), ...b('VLT NO. / LP NO. / IPLP NO', i.layoutNo), ...b('ElectionWard', i.electionWard), ...b('Ward Secretariat', i.secratariatWardName), ...b('AppartmentName', i.appartmentName), ...b('Unit', i.extentUnit)], fontSize: 8, alignment: 'left' }, { text: landUse, fontSize: 8, alignment: 'left' }, { text: [...b('MarketValue', mv), ...b('unitRate', extrate ? `${extrate} per Acre` : '')], fontSize: 8, alignment: 'left' }])();
								sNo = sNo + 1;
							}
						} else {
							if (propType === "URBAN") {
								let flat = [];
								if (i.schedulePropertyType === "FLAT [ఫ్లాట్]")
									flat = [{ text: '\nFlat Boundaries:\n', bold: true }, { text: 'East: ', bold: true }, `${i.flatEastBoundry}\n`, { text: 'West: ', bold: true }, `${i.flatWestBoundry}\n`, { text: 'North: ', bold: true }, `${i.flatNorthBoundry}\n`, { text: 'South: ', bold: true }, `${i.flatSouthBoundry}\n`];
								a = ((b = (label, val, suffix = '\n') => val ? [{ text: `${label}: `, bold: true }, `${val}${suffix}`] : []) => [{ text: sNo + 1, fontSize: 8 }, { text: [{ text: 'SRO Code: ', bold: true }, `${sroCode}\n`, { text: 'SRO Office: ', bold: true }, `${sroOffice}\n`, `${district}\n`, `${mandal}\n`, `${village}\n`, ...b('Type of LocalBody', lBD), ...b('local Body Name', i.localBodyName), { text: 'Property Boundaries:\n', bold: true }, ...b('East', i.eastBoundry, ',\n'), ...b('West', i.westBoundry, ',\n'), ...b('North', i.northBoundry, ',\n'), ...b('South', i.southBoundry, ' '), ...flat], fontSize: 8, alignment: 'left' }, { text: [...b('Survey No.', surveyNo), ...b('Lpm No.', lpmNo), ...b('Plot', plot), ...b('Block/Bi-block', block), ...b('DoorNo', doorNo), `${nearDoorNo ? nearDoorNo + '\n' : ''}`, ...b('Flat No', flatNo), `${eleSrvcNo ? eleSrvcNo + '\n' : ''}`, ...b('Apartment Name', i.appartmentName), ...b('Total Extent', i.tExtent ? `${i.tExtent} ${exUnit}` : ''), ...b('Habitation/Locality', habitation), ...b('Ward/Bi-ward', ward), ...b('Block/Bi-block', block), ...b('Layout Name', i.layoutName), ...b('Undivided Share / Extent', i.undividedShare), ...b('VLT NO. / LP NO. / IPLP NO', i.layoutNo), ...b('RERA Approval No.', i.reraApprovalNo), ...b('Building Approval No.', i.buildingApprovalNo), ...b('ElectionWard', i.electionWard), ...b('Ward Secretariat', i.secratariatWardName), ...b('Apartment Name', i.appartmentName), ...b('Unit', i.extentUnit)], fontSize: 8, alignment: 'left' }, { text: landUse || '', fontSize: 8, alignment: 'left' }, { text: [...b('MarketValue', mv), ...b('unitRate', extrate ? `${extrate} per Sq.Yards` : '')], fontSize: 8, alignment: 'left' }])();
								sNo = sNo + 1;
							} else {
								let lpm = i.lpmNo ? `\nLPM No : ${i.lpmNo}` : "";
								a = ((b = (label, val, suffix = '\n') => val ? [{ text: `${label}: `, bold: true }, `${val}${suffix}`] : []) => [{ text: sNo + 1, fontSize: 8 }, { text: [{ text: 'SRO Code: ', bold: true }, `${sroCode}\n`, { text: 'SRO Office: ', bold: true }, `${sroOffice}\n`, `${district}\n`, `${mandal}\n`, `${village}\n`, ...b('Type of LocalBody', lBD), ...b('local Body Name', i.localBodyName), ...b('East', i.eastBoundry, ',\n'), ...b('West', i.westBoundry, ',\n'), ...b('North', i.northBoundry, ',\n'), ...b('South', i.southBoundry)], fontSize: 8, alignment: 'left' }, { text: [...b('Survey No.', surveyNo && lpm ? `${surveyNo} ${lpm}` : surveyNo || lpm), ...b('Total Extent', i.tExtent), ...b('Habitation/Locality', habitation), ...b('Layout Name', i.layoutName), ...b('Undivided Share / Extent', i.undividedShare), ...b('VLT NO. / LP NO. / IPLP NO', i.layoutNo), ...b('ElectionWard', i.electionWard), ...b('Ward Secretariat', i.secratariatWardName), ...b('AppartmentName', i.appartmentName), ...b('Unit', i.extentUnit)], fontSize: 8, alignment: 'left' }, { text: landUse || '', fontSize: 8, alignment: 'left' }, { text: [...b('MarketValue', mv, ',\n'), ...b('unitRate', extrate ? `${extrate} per Acre` : '')], fontSize: 8, alignment: 'left' }])();
								sNo = sNo + 1;
							}
						}
					}
					if (i.typeOfProperty == "Others") {
						a = [{ text: sNo + 1, fontSize: 8 }, { text: `OtherProperty - ${i.otherPropName}`, fontSize: 8, alignment: 'center' }, { text: `-`, fontSize: 8, alignment: 'center' }, { text: '-', fontSize: 8, alignment: 'center' }, { text: `MarketValue :\n${mv}`, fontSize: 8, alignment: 'center' },];
						sNo = sNo + 1;
					}
					if (i.landUseCode != 99 || i.landUseCode != "99") {
						propArry[0].table.body.push(a);
					}
					else {
						// if land code is cash
						const cashProp = [{ text: sNo, fontSize: 8 }, { text: `${village}`, fontSize: 8, alignment: 'center' }, { text: "", fontSize: 8 }, { text: "", fontSize: 8 }, { text: `${mv} (Cash)`, fontSize: 8, alignment: 'center' }]
						propArry[0].table.body.push(cashProp);
					}
				}

				checkSlip.content[1].table.body.push(propArry);
			} else {
				const a = ["", "", "", "", ""];
				propArry[0].table.body.push(a);
				// checkSlip.content[1].table.body.push(propArry)
			};

			let strArray = [
				{
					style: 'insideTable6',
					table: {
						widths: [36, 36, 60, 60, 70, 36],
						body: [
							[
								{ text: 'S.No.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Floor No', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Structure Type', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Plinth(sq. feets)', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Stage of Cons.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Age', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' }
							],
						]
					}
				}
			]

			if (data?.property && data?.property?.length > 0) {
				let strDetailsArry = [], propType = "";
				for (let i in data.property) {
					propType = data.property[i].propertyType.includes('RURAL') ? 'RURAL' : 'URBAN';
					if (propType === "URBAN") {
						for (let j in data?.property[i]?.structure) {
							strDetailsArry = [...strDetailsArry, data?.property[i]?.structure[j]];
						}
					}
				}
				if (strDetailsArry && strDetailsArry.length > 0) {
					checkSlip.content[1].table.body.push([{ text: 'Structure Details', alignment: 'center', fillColor: '#50c4eb', color: '#343f42', }])
					let sNo = 0;
					for (let j in strDetailsArry) {

						let [strType, reststr] = strDetailsArry[j]?.structureType.split("[");
						let [stageOfCons, restcons] = strDetailsArry[j]?.stageOfCons.split("[");
						let a;
						if (sNo === 0) {
							a = [{ text: sNo + 1, fontSize: 8 }, { text: strDetailsArry[j].floorNo, fontSize: 8 }, { text: strType, fontSize: 8 }, { text: strDetailsArry[j].plinth, fontSize: 8 }, { text: stageOfCons, fontSize: 8 }, { text: strDetailsArry[j].age, fontSize: 8 }];
							sNo = sNo + 1;
						} else {
							a = [{ text: sNo + 1, fontSize: 8 }, { text: strDetailsArry[j].floorNo, fontSize: 8 }, { text: strType, fontSize: 8 }, { text: strDetailsArry[j].plinth, fontSize: 8 }, { text: stageOfCons, fontSize: 8 }, { text: strDetailsArry[j].age, fontSize: 8 }];
							sNo = sNo + 1;
						}
						strArray[0].table.body.push(a);
					}
					checkSlip.content[1].table.body.push(strArray);
				}
			} else {
				const a = ["", "", "", "", "", ""];
				strArray[0].table.body.push(a);
				// checkSlip.content[1].table.body.push(strArray)
			};

			let chargeArry
			if (data.documentNature.TRAN_MAJ_CODE === "07") {
				chargeArry = [
					{
						style: 'insideTable7',
						table: {
							widths: [115, 115, 115, 115],
							body: [
								[
									{ text: 'Lease Period', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
									{ text: 'Advance', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
									{ text: 'Muncipal Tax', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
									{ text: 'Total Market value (AAR)', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								],
								// [{text:`${data?.property[0]?.amount}`,fontSize:8,alignment:'center'},{text:`${data?.property[0]?.amount}`,fontSize:8,alignment:'center'},{text:'',fontSize:8,alignment:'center'}]
							]
						}
					}
				]
			}
			else {
				chargeArry = [
					{
						style: 'insideTable7',
						table: {
							widths: [133, 134, 200],
							body: [
								[
									{ text: 'Market Value(Total)', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
									{ text: doctstattus ? 'Auction Value' : 'Consideration Value', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
									{ text: 'Chargeable Value(Rounded to next Rs.500/-)', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								],
								// [{text:`${data?.property[0]?.amount}`,fontSize:8,alignment:'center'},{text:`${data?.property[0]?.amount}`,fontSize:8,alignment:'center'},{text:'',fontSize:8,alignment:'center'}]
							]
						}
					}
				]
			}
			if (data?.property && data.property.length > 0) {
				let totMV = 0;
				let chargeValue = 0;
				// checkSlip.content[1].table.body.push([{text:'Chargeable Value Details',alignment:'center',fillColor: '#50c4eb',color: '#343f42'}])
				for (let i in data?.property) {
					let mv = data.property[i].marketValue ? data.property[i].marketValue : 0;
					totMV = totMV + mv
					// if(data.documentNature.TRAN_MAJ_CODE ==="02"){
					// 	chargeValue = data.amount
					// }else{
					// 	chargeValue =  mv > data.amount ? mv : data.amount;
					// }
				}
				if (data.documentNature.TRAN_MAJ_CODE === "04" || data.documentNature.TRAN_MAJ_CODE === "05" || data.documentNature.TRAN_MAJ_CODE === "06") {
					chargeValue = data.section47A?.isSection47 === 'Y' ? data.section47A?.considerationValue : data.tmarketValue
				} else if (data.documentNature.TRAN_MAJ_CODE === "01" && data.documentNature.TRAN_MIN_CODE === "04") {
					chargeValue = data.amount;
				}
				else if (data.documentNature.TRAN_MAJ_CODE === "01" && data.documentNature.TRAN_MIN_CODE === "27") {
					chargeValue = data.amount;
				}
				else if (data.documentNature.TRAN_MAJ_CODE === "02") {
					chargeValue = data.amount
				} else if (data?.section47A?.sectionType === "Section 47A(6)") {
					chargeValue = data.amount;
				} else {
					chargeValue = data.section47A?.differentialStampDuty ? data.section47A?.considerationValue : (totMV > data.amount ? totMV : data.amount);
				}
				let grAmount = 0, MVOver30 = 0;
				if (data?.documentNature?.TRAN_MAJ_CODE === "07" && data?.property?.length > 0) {
					const lease = data.property[0].leaseDetails;
					data.property[0].leaseDetails.rentalDetails?.forEach(rp => {
						grAmount += Number(rp.totalAmount);
					});

					if (lease.lPeriod > 30) {
						data.property.forEach(x => {
							if (x.marketValue) MVOver30 += x.marketValue;
						});
					}
				}

				const lease = data?.property?.[0]?.leaseDetails;
				const leaseMarketValue =
					data?.documentNature?.TRAN_MAJ_CODE === "07" && lease
						? data.documentNature.TRAN_MIN_CODE === "06"
							? 0
							: lease.lPeriod > 30
								? MVOver30
								: Math.round(
									Number(grAmount) / Number(lease.lPeriod) +
									Number(lease.advance) +
									Number(lease.muncipalTax)
								)
						: 0;

				const a = (data.documentNature.TRAN_MAJ_CODE === "07" && data.property && data.property.length > 0) ? [{ text: lease.lPeriod, fontSize: 8 }, { text: lease.advance, fontSize: 8 }, { text: lease.muncipalTax, fontSize: 8 }, { text: leaseMarketValue, fontSize: 8 }] : [{ text: totMV, fontSize: 8 }, { text: data.amount, fontSize: 8 }, { text: chargeValue, fontSize: 8 }];
				chargeArry[0].table.body.push(a);
				const hideChargeableDetails = data.documentNature.TRAN_MAJ_CODE === "07" && data.documentNature.TRAN_MIN_CODE === "06";
				if (chargeArry && chargeArry.length > 0 && !hideChargeableDetails) {
					checkSlip.content[1].table.body.push([{ text: `${data.documentNature.TRAN_MAJ_CODE === "07" ? 'Lease ' : ''}Chargeable Value Details`, alignment: 'center', fillColor: '#50c4eb', color: '#343f42' }])
				}
				if (!hideChargeableDetails) {
					checkSlip.content[1].table.body.push(chargeArry);
				}
			} else {
				const a = data.documentNature.TRAN_MAJ_CODE === "07" ? ["", "", "", ""] : ["", "", ""];
				chargeArry[0].table.body.push(a);
				// checkSlip.content[1].table.body.push(chargeArry)
			};
			// 		// [{text:'payable Amount Details',alignment:'center',fillColor: '#50c4eb',
			// 		// color: '#343f42',}],

			if (data.documentNature.TRAN_MAJ_CODE === "07") {
				let rentalArr = [
					{
						style: 'insideTable4',
						table: {
							widths: [90, 90, 90, 90, 90],
							body: [
								[
									{ text: 'S.No.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
									{ text: 'With effective from', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
									{ text: 'Rental Period', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
									{ text: 'Rental Amount', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
									{ text: 'Total Amount', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								],
							]
						}
					}
				]
				checkSlip.content[1].table.body.push([{ text: 'Rental Details', alignment: 'center', fillColor: '#50c4eb', color: '#343f42', }])
				let wefValue = data?.property?.[0]?.leaseDetails?.wef;
				if (wefValue && typeof wefValue === 'string') {
					wefValue = wefValue.split('T')[0].split('-').reverse().join('-');
				}
				const rentalDetails = data?.property?.[0]?.leaseDetails?.rentalDetails;
				if (rentalDetails && rentalDetails.length > 0) {
					for (let i of data.property[0].leaseDetails.rentalDetails) {
						const row = [
							{ text: i.sNo, fontSize: 8 },
							{ text: wefValue, fontSize: 8 },
							{ text: i.rentalPeriod, fontSize: 8 },
							{ text: i.rentalAmount, fontSize: 8 },
							{ text: i.totalAmount, fontSize: 8 },
						];
						rentalArr[0].table.body.push(row);
					}
				} else {
					rentalArr[0].table.body.push([
						{ text: 1, fontSize: 8 },
						{ text: wefValue || '', fontSize: 8 },
						{ text: '', fontSize: 8 },
						{ text: '', fontSize: 8 },
						{ text: '', fontSize: 8 }
					]);
				}

				checkSlip.content[1].table.body.push(rentalArr);
			}

			let payArry = [
				{
					style: 'insideTable10',
					table: {
						// widths:[60,60,70,70,71,60,60],
						// widths:[70,70,50,50,50,70,70],
						widths: data.section47A?.differentialStampDuty ? [60, 55, 55, 30, 40, 40, 40, 60, 60] : [65, 45, 30, 50, 50, 50, 60, 90],
						body: [
							[
								{ text: 'Deficit Stamp Duty Payable', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Stamp Paper Value', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'No of Stamps', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'User Charge Payable', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Registration Fee Payable', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Transfer Duty Payable', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'TypeofStampPaper', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'FrankinId / StockHoldingId / NJ Stamps', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
							],
						]
					}
				}
			];
			if (data.section47A?.differentialStampDuty) {
				payArry[0].table.body[0].unshift({ text: 'Defferential Stamp Duty Payable', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' });
			}
			if (data?.dutyFeeData && data.dutyFeeData.uc_p != undefined) {
				let differentialSD = data.section47A?.differentialStampDuty;
				let NJStamp = "";
				if (data.typeOfStamps == 'Non-Judicial Stamp Papers') {
					NJStamp = data.nonJudicialStamps?.map(obj => `${obj.mainSerialNumber} ${obj.serialNumber} - Rs.${obj.value},\n`)
				}
				let stampvalue = (data.dutyFeeData.sd_p - data.stampPaperValue) > 0 ? (data.dutyFeeData.sd_p - data.stampPaperValue) : 0;
				let valueOfstockOrFrnakIn = data.frankingId ? data.frankingId : data.stockHoldingId ? data.stockHoldingId : NJStamp;
				checkSlip.content[1].table.body.push([{ text: 'Payable Amount Details', alignment: 'center', fillColor: '#50c4eb', color: '#343f42', }])
				const a = [{ text: stampvalue, fontSize: 8 }, { text: data.stampPaperValue, fontSize: 8 }, { text: data.noOfStampPapers, fontSize: 8 }, { text: data.dutyFeeData.uc_p, fontSize: 8 }, { text: data.dutyFeeData.rf_p, fontSize: 8 }, { text: data.dutyFeeData.td_p, fontSize: 8 }, { text: data.typeOfStamps, fontSize: 8 }, { text: valueOfstockOrFrnakIn, fontSize: 8 }]
				if (differentialSD) {
					a.unshift({ text: differentialSD, fontSize: 8 });
				}
				payArry[0].table.body.push(a);
				checkSlip.content[1].table.body.push(payArry);
			}
			let linkedArry = [
				{
					style: 'insideTable8',
					table: {
						widths: [35, 40, 100, 100, 40, 57, 60],
						body: [
							[

								{ text: 'S.No.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Sch No', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Link SRO Name', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Link Doc No', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Link Book No', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Link Reg Year', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Link Sch No', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
							],
							// [{text:`${data?.property[0]?.amount}`,fontSize:8,alignment:'center'},{text:`${data?.property[0]?.amount}`,fontSize:8,alignment:'center'},{text:'',fontSize:8,alignment:'center'}]
						]
					}
				}
			];
			let linkDocs = [];
			if (data?.property && data?.property?.length > 0) {

				let sNo = 0;
				for (let i of data.property) {
					if (i.LinkedDocDetails && i.LinkedDocDetails.length > 0) {

						for (let j of i.LinkedDocDetails) {
							const Obj = {};
							Obj.linkDocNo = j?.linkDocNo;
							Obj.regYear = j?.regYear;
							Obj.bookNo = j?.bookNo;
							Obj.scheduleNo = j?.scheduleNo;
							Obj.district = j?.district;
							Obj.sroOffice = j?.sroOffice;
							Obj.sch = i?.seqNumber;
							Obj.sNo = Number(sNo) === 0 ? 1 : Number(sNo) + Number(1);
							linkDocs = [...linkDocs, Obj];
							sNo = Number(sNo) + Number(1);
						}
					}

				}
				if (linkDocs && linkDocs.length > 0) {
					checkSlip.content[1].table.body.push([{ text: 'Link Document Details', alignment: 'center', fillColor: '#50c4eb', color: '#343f42', }])
					for (let j of linkDocs) {

						const a = [{ text: j.sNo, fontSize: 8 }, { text: j.sch, fontSize: 8 }, { text: j.sroOffice, fontSize: 8 }, { text: j.linkDocNo, fontSize: 8 }, { text: j.bookNo, fontSize: 8 }, { text: j.regYear, fontSize: 8 }, { text: j.scheduleNo, fontSize: 8 }];
						linkedArry[0].table.body.push(a);
					}
					checkSlip.content[1].table.body.push(linkedArry);
				}
			}

			let webLandArry = [
				{
					style: 'insideTable11',
					table: {
						widths: [20, 20, 25, 25, 25, 25, 30, 30, 37, 50, 30, 30, 30],
						body: [
							[
								{ text: 'S.No.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'LPM No', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Land Nature', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Total Extent', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Cultivated', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Non Cultivated', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Occupant Extent', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Classification', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Water Resource', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Occupant Name', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Father Name', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Survey No.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Occupant Khata No.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
							],
						]
					}
				}
			]
			if (data?.property && data.property.length > 0 && data.property.some(x => Object.keys(x.webLandDetails).includes('landNature'))) {
				checkSlip.content[1].table.body.push([{ text: 'Web Land Details', alignment: 'center', fillColor: '#50c4eb', color: '#343f42', }])
				let ind = 1
				for (let j of data.property) {
					if (j.webLandDetails.landNature !== undefined && j.webLandDetails.landNature !== "") {
						const a = [{ text: ind, fontSize: 8 }, { text: j.lpmNo, fontSize: 8, normal: true }, { text: j.webLandDetails.landNature, fontSize: 8, normal: true },
						{ text: j.webLandDetails.totalExtent, fontSize: 8 }, { text: j.webLandDetails.cultivated, fontSize: 8 },
						{ text: j.webLandDetails.nonCultivated, fontSize: 8 }, { text: j.webLandDetails.occupantExtent, fontSize: 8 },
						{ text: j.webLandDetails.classification, fontSize: 8 }, { text: j.webLandDetails.waterResource, fontSize: 8 },
						{ text: j.webLandDetails.occupantName, fontSize: 8 }, { text: j.webLandDetails.fatherName, fontSize: 8 },
						{ text: j.webLandDetails.survayNo, fontSize: 8 }, { text: j.webLandDetails.occupantKhataNo, fontSize: 8 },];
						webLandArry[0].table.body.push(a);
						ind++;
					}
				}
				checkSlip.content[1].table.body.push(webLandArry);
			}

			const isMutableDoc = isUrbanDocumentMutationNeeded(data?.documentNature?.TRAN_MAJ_CODE, data?.documentNature?.TRAN_MIN_CODE);

			let cdmaArry = [
				{
					style: 'insideTable12',
					table: {
						widths: isMutableDoc ? [20, 45, 60, 85, 40, 35, 35, 35, 30, 30] : [20, 60, 120, 40, 50, 30, 35, 30, 30],
						body: [
							[
								{ text: 'S.No.', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'PTIN Number', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Property Address', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'propertyType', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Owner Name', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Site Extent (sq. yds)', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Undivided Shares Of Land (sq. yds)', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Total TaxDue', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
								{ text: 'Door No', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' },
							],
						]
					}
				}
			]
			if (isMutableDoc) {
				cdmaArry[0].table.body[0].splice(2, 0, { text: 'Mutation Fee', fillColor: '#ede8fa', fontSize: 8, bold: true, alignment: 'center' });
			}

			if (data?.property && data.property.length > 0 && data.property.some(x => x.cdma_details?.length)) {
				checkSlip.content[1].table.body.push([{ text: 'CDMA Details', alignment: 'center', fillColor: '#50c4eb', color: '#343f42', }])
				let ind = 1
				for (let j of data.property) {
					let cdmaData
					if (j.cdma_details && typeof j.cdma_details === 'string' && j.cdma_details.trim().startsWith('{') && j.cdma_details.trim() !== '{}') {
						cdmaData = JSON.parse(j.cdma_details);
					}
					const response = await urbanService.propertyTaxDueSrvc({ assessmentNo: j.ptinNo, applicationId: j.applicationId, propertyId: j.propertyId });
					if (cdmaData && cdmaData.propertyAddress != undefined && cdmaData.propertyAddress != "") {
						const a = [
							{ text: ind, fontSize: 8 },
							{ text: cdmaData?.propertyID, fontSize: 8, normal: true },
							{ text: cdmaData?.propertyAddress, fontSize: 8, normal: true },
							{ text: cdmaData?.propertyDetails?.propertyType, fontSize: 8 },
							{ text: cdmaData?.ownerNames[0].ownerName, fontSize: 8 },
							{ text: cdmaData?.siteExtent, fontSize: 8 },
							{ text: cdmaData?.undividedShareOfLand, fontSize: 8 },
							{ text: cdmaData?.propertyDetails?.taxDue, fontSize: 8 },
							{ text: cdmaData?.houseNo, fontSize: 8 }
						];
						if (isMutableDoc) {
							a.splice(2, 0, {
								text: [{ text: 'Amount: ', bold: true }, `${j?.payableMutationFee ?? 0}\n`, { text: 'Status: ', bold: true },
								`${(response?.mutationFee ?? 0) < 1 && ['SUBMITTED', 'SYNCED'].includes(data.status) ? 'Paid' : 'Not Paid'}`], fontSize: 8
							});
						}
						cdmaArry[0].table.body.push(a);
						ind++;
					}
				}
				checkSlip.content[1].table.body.push(cdmaArry);
			}
			if (data.eStamp === 'G') {
				let payArry1 = [
					{
						style: 'insideTable13',
						widths: [60, 60],
						table: {
							widths: [250, 250],
							body: [
								[
									{ text: 'SR_eSign', fontSize: 8, alignment: 'left', margin: [100, 60, 0, 0] },
									{ text: 'DR_eSign', fontSize: 8, alignment: 'right', margin: [0, 60, 100, 0] }
								],
							],
						},
						layout: 'noBorders'
					}
				];
				checkSlip.content[1].table.body.push(payArry1);
			}
			{ data?.section47A?.sectionType === "Section 47A(6)" ? checkSlip.content[1].table.body.push([{ text: 'NOTE: Setction 47A(6)', alignment: 'left', color: 'red', fontSize: 8, width: 200 }]) : null }
			checkSlip.content[1].table.body.push([{ text: 'Disclaimer : Sellers and buyers are responsible for verifying the entered document particulars especially schedule of the property before proceeding to pay the required charges through Online Payment System', alignment: 'left', color: 'red', fontSize: 8, width: 200 }])
			if (loginDetails.emplName && loginDetails.emplName != undefined && loginDetails.emplName != 'undefined') {
				const timeNow = moment().format('DD/MM/YYYY & HH:mm');
				checkSlip['footer'] = function (currentPage, pageCount) {
					if (currentPage === pageCount) {
						return {
							text: `CheckSlip Generated By : ${loginDetails.emplName} & CheckSlip Generated On :  (${timeNow})`,
							fontSize: 8,
							alignment: 'left',
							margin: [80, 5, 0, 0]
						}

					}
				}
			}
			else {
				checkSlip['footer'] = function (currentPage, pageCount) {
					if (currentPage === pageCount) {
						return {
							text: "",
							fontSize: 8,
							alignment: 'left',
							margin: [80, 5, 0, 0]
						}

					}
				}
			}

			return checkSlip;
		}
		if (reportType == "acknowledgement") {
			if (data.status == "DRAFT") {
				ackAndSlotStyles.watermark.text = "DRAFT"
			}
			let documentBy = data?.executent[0]?.name == undefined ? data?.claimant[0]?.name : data?.executent[0]?.name;
			let ackTable = {
				widths: [200, 200],
				body: [
					[{ text: "Application ID:", fontSize: 13, bold: true, alignment: 'right', margin: [0, 10, 0, 0] }, { text: `${data.applicationId}`, fontSize: 12, alignment: 'left', margin: [0, 10, 0, 0] }],
					[{ text: "Entry Date:", fontSize: 13, bold: true, alignment: 'right', margin: [0, 10, 0, 0] }, { text: `${data.date}`, fontSize: 12, alignment: 'left', margin: [0, 10, 0, 0] }],
					[{ text: "Document By:", fontSize: 13, bold: true, alignment: 'right', margin: [0, 10, 0, 0] }, { text: `${documentBy}`, fontSize: 12, alignment: 'left', margin: [0, 10, 0, 0] }],
					[{ text: "Document Status:", fontSize: 13, bold: true, alignment: 'right', margin: [0, 10, 0, 0] }, { text: `${data.status}`, fontSize: 13, alignment: 'left', margin: [0, 10, 0, 0] }],
					[{ text: "Document Type:", fontSize: 13, bold: true, alignment: 'right', margin: [0, 10, 0, 0] }, { text: `${naturetype.toUpperCase()}`, fontSize: 13, alignment: 'left', margin: [0, 10, 0, 0] }],
					// [{text:"Slot Booked Status:",fontSize:12,bold:true,alignment:'right',margin:[0,10,0,0]},{text:`${"Not Booked"}`,fontSize:12,alignment:'left',margin:[0,10,0,0]}]
				]
			}
			ackAndSlotStyles.content.map((ac) => {
				if (ac.style === "table1")
					ac.table = ackTable;
			})
			return ackAndSlotStyles;
		}
		if (reportType == "slotBookingSlip") {
			if (data.status == "DRAFT") {
				ackAndSlotStyles.watermark.text = "DRAFT"
			}
			let slotDate = data?.slots ? data?.slots?.slotDate : "";
			let slotTime = data?.slots ? data?.slots?.slotTime : "";
			let presenterName = data?.presenter[0]?.name;
			let presenterAahaar = data?.presenter[0]?.aadhaar;
			let presenterPhone = data?.presenter[0]?.phone;
			let ackTable = {
				widths: [200, 200],
				body: [
					[{ text: "Application ID:", fontSize: 13, bold: true, alignment: 'right', margin: [0, 10, 0, 0] }, { text: `${data.applicationId}`, fontSize: 12, alignment: 'left', margin: [0, 10, 0, 0] }],
					[{ text: "Sub-Registrar Office :", fontSize: 13, bold: true, alignment: 'right', margin: [0, 10, 0, 0] }, { text: `${data.sroOffice}`, fontSize: 12, alignment: 'left', margin: [0, 10, 0, 0] }],
					[{ text: "Slot Booked On:", fontSize: 13, bold: true, alignment: 'right', margin: [0, 10, 0, 0] }, { text: `${slotDate}`, fontSize: 12, alignment: 'left', margin: [0, 10, 0, 0] }],
					[{ text: "Slot Time:", fontSize: 13, bold: true, alignment: 'right', margin: [0, 10, 0, 0] }, { text: `${slotTime}`, fontSize: 13, alignment: 'left', margin: [0, 10, 0, 0] }],
					[{ text: "Slot Booked by:", fontSize: 13, bold: true, alignment: 'right', margin: [0, 10, 0, 0] }, { text: `${"SELF"}`, fontSize: 13, alignment: 'left', margin: [0, 10, 0, 0] }],
					[{ text: "Presenter's name :", fontSize: 13, bold: true, alignment: 'right', margin: [0, 10, 0, 0] }, { text: `${presenterName}`, fontSize: 13, alignment: 'left', margin: [0, 10, 0, 0] }],
					[{ text: "Aadhaar Number:", fontSize: 13, bold: true, alignment: 'right', margin: [0, 10, 0, 0] }, { text: `${maskAadhaar(presenterAahaar)}`, fontSize: 13, alignment: 'left', margin: [0, 10, 0, 0] }],
					[{ text: "Mobile Number:", fontSize: 13, bold: true, alignment: 'right', margin: [0, 10, 0, 0] }, { text: `${maskAadhaar(presenterPhone)}`, fontSize: 13, alignment: 'left', margin: [0, 10, 0, 0] }],
					[{ text: "Nature of Document:", fontSize: 13, bold: true, alignment: 'right', margin: [0, 10, 0, 0] }, { text: `${naturetype.toUpperCase()}`, fontSize: 13, alignment: 'left', margin: [0, 10, 0, 0] }],
					// [{text:"Slot Booked from IP:",fontSize:12,bold:true,alignment:'right',margin:[0,10,0,0]},{text:`${"XX.XX.XXX.XXX"}`,fontSize:12,alignment:'left',margin:[0,10,0,0]}]
				]
			}
			ackAndSlotStyles.content.map((ac) => {
				if (ac.style === "table1")
					ac.table = ackTable;
			})
			return ackAndSlotStyles;
		}
		if (reportType == "formSixty") {
			return formSixtyStyles
		};
		if (reportType == "engDocs") {


			// if(data.noOfStampPapers){
			// 	y = data.noOfStampPapers * 250
			// }else{

			//}

			if (data.documentNature.TRAN_MAJ_CODE == " ") {
				pdeStyle.content = [];
				let y = data.eStamp === "N" ? 400 : 550;
				if (data.status == "DRAFT") {
					pdeStyle.watermark.text = "DRAFT"
				}
				let DocNum = data.documentNature.TRAN_MAJ_CODE
				let [subDesc, disc] = data.documentNature.TRAN_DESC.split("[");
				let [TRAN_DESC, rest] = data.registrationType.TRAN_DESC ? data.registrationType.TRAN_DESC.split("[") : ["", ""];
				pdeStyle.content.push({ text: `${subDesc} DEED`.toUpperCase(), alignment: 'center', bold: true, decoration: 'underline', margin: [10, y, 0, 0] });
				pdeStyle.content.push(' ');
				pdeStyle.content.push({ text: `This ${subDesc.toUpperCase()} DEED is made and executed on this ${dd} day of ${mm} , ${yyyy}, by :`, style: ['p1sideHeaders'] });
				let party1Text, party2Text;
				if (data?.executent && data?.executent.length > 0) {
					for (var i = 0; i < data.executent.length; i++) {
						let address = data?.executent[i]?.address?.replace(/\n/g, '');
						let name = data?.executent[i]?.name ? toTitleCase(data?.executent[i]?.name) : "............";
						let relationType = data?.executent[i]?.relationType ? data?.executent[i]?.relationType : "............";
						let relationName = data?.executent[i]?.relationName ? toTitleCase(data?.executent[i]?.relationName) : "............";
						let age = data?.executent[i]?.age ? data?.executent[i]?.age : "............";
						if (data?.executent[i].partyType === "Public") {
							pdeStyle.content.push({
								text: `\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(address)}`, style: ["p1Text"]
							})
						} else {
							pdeStyle.content.push({
								text: `M/s .${name}, ${address} is represented by`, style: ["p1Text"]
							})
						}

						if (data.executent[i]?.represent && data.executent[i]?.represent.length > 0) {
							for (let j in data.executent[i]?.represent) {
								let address = data?.executent[i]?.represent[j]?.address?.replace(/\n/g, '');
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
					party1Text = naturetype == "Release" ? `Hereinafter called as"${partyType1}",which expression shall wherever the context so permit and admit shall mean and include his heirs,executors,legal representatives,administrators,assignees.` : `Herein after called the '${partyType1}' of the first part`;
					pdeStyle.content.push({ text: party1Text, style: ["p1Points"] });
				} else {
					pdeStyle.content.push({
						text: `\nMr/Mrs. ..............., ......................... , aged about ............ years,Presently residing at ...................`, style: ["p1Text"]
					});
					party1Text = naturetype == "Release" ? `Hereinafter called as"${partyType1}",which expression shall wherever the context so permit and admit shall mean and include his heirs,executors,legal representatives,administrators,assignees.` : `Herein after called the '${partyType1}' of the first part`
					pdeStyle.content.push({ text: party1Text, style: ["p1Points"] },);
				}
				pdeStyle.content.push({ text: 'AND', alignment: 'center', bold: true, decoration: 'underline', margin: [10, 10, 0, 0] });
				if (data?.claimant && data?.claimant.length > 0) {
					for (var i = 0; i < data.claimant.length; i++) {
						let address = data?.claimant[i]?.address?.replace(/\n/g, '');
						let name = data?.claimant[i]?.name ? toTitleCase(data?.claimant[i]?.name) : "............";
						let relationType = data?.claimant[i]?.relationType ? data?.claimant[i]?.relationType : "............";
						let relationName = data?.claimant[i]?.relationName ? toTitleCase(data?.claimant[i]?.relationName) : "............";
						let age = data?.claimant[i]?.age ? data?.claimant[i]?.age : "............";
						if (data?.claimant[i].partyType === "Public") {
							pdeStyle.content.push({
								text: `\nMr/Mrs. ${name}, ${relationType} ${relationName} , aged about ${age}  years, Presently residing at ${toTitleCase(address)}`, style: ["p1Text"]
							});
						} else {
							pdeStyle.content.push({
								text: `M/s .${name}, ${address} is represented by`, style: ["p1Text"]
							})
						}

						if (data.claimant[i]?.represent && data.claimant[i]?.represent.length > 0) {
							for (let j in data.claimant[i]?.represent) {
								let address = data?.claimant[i]?.represent[j]?.address?.replace(/\n/g, '');
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
					party2Text = naturetype == "Release" ? `Hereinafter called as"${partyType2}",which expression shall wherever the context so permit and admit shall mean and include his heirs,executors,legal representatives,administrators,assignees.` : `Herein after called the '${partyType2}' of the first part`
					pdeStyle.content.push({ text: party2Text, style: ["p1Points"] });
					// pdeStyle.content.push({text: `Herein after called the '${partyType2}' of the second part`,style:["p1Points"]});
				} else {
					pdeStyle.content.push({
						text: `\nMr/Mrs. ................, ......................... , aged about ............ years,Presently residing at ....................`, style: ["p1Text"]
					});
					party2Text = naturetype == "Release" ? `Hereinafter called as"${partyType2}",which expression shall wherever the context so permit and admit shall mean and include his heirs,executors,legal representatives,administrators,assignees.` : `Herein after called the '${partyType2}' of the first part`
					pdeStyle.content.push({ text: party2Text, style: ["p1Points"] });
				}
				if (data.covanants?.acquireCovenents && data.covanants?.acquireCovenents.length > 0) {
					let aqCovanents = []
					pdeStyle.content.push({ text: `How the Property is Aquired :`, style: ['p1Text_MR'] })
					let sNo = 1;
					data?.covanants.acquireCovenents.map((aqcv) => {
						let val = sNo === 1 ? `${aqcv.value}` : `\n ${aqcv.value}`
						aqCovanents = [...aqCovanents, val];
					})
					for (let i of aqCovanents) {
						pdeStyle.content.push({ text: `${i}`, style: ['p1Text_MR'] })
					}
				}
				// if(TRAN_DESC === "Sale"){

				// }
				let covenantArr = [];
				let sNo = 1;
				covanantsData[DocNum].map((cov) => {
					if (cov.minDocNum === data.documentNature.TRAN_MIN_CODE) {
						covenantArr = [...covenantArr, sNo + "." + cov.value];
						sNo = sNo + 1;
					}
				});
				if (data?.covanants) {
					sNo = covenantArr.length + 1;
					data?.covanants?.covanants.map((dnc) => {
						covenantArr = [...covenantArr, sNo + "." + dnc.value];
						sNo = sNo + 1;
					});
				};

				if (TRAN_DESC) {
					//pdeStyle.content.push({text:`PDE ID : ${data.applicationId}`,alignment:"right"});

					let amountInWords = await NumToWord(data.amount);
					if (data?.property && data.property.length > 0) {
						for (let i in data?.property) {
							let [landUse, rest] = data.property[i].landUse ? data.property[i].landUse.split("[") : ["............", ""];
							let [acr, cent] = data?.property[i]?.tExtent ? data.property[i].tExtent.split(".") : ["............", "............"];
							if (cent == undefined) {
								cent = "00"
							}
							let linkedText;
							if (data?.property[i]?.LinkedDocDetails && data?.property[i]?.LinkedDocDetails?.length > 0) {
								for (let j in data?.property[i]?.LinkedDocDetails) {
									let linkDocNo = data.property[i].LinkedDocDetails[j].linkDocNo ? data.property[i].LinkedDocDetails[j].linkDocNo : "............"
									let year = data.property[i].LinkedDocDetails[j].regYear ? data.property[i].LinkedDocDetails[j].regYear : "............"
									let bookNo = data.property[i].LinkedDocDetails[j].bookNo ? data.property[i].LinkedDocDetails[j].bookNo : "............"
									linkedText = `virtue of registered document bearing the number ${linkDocNo} of ${year} of book ${bookNo}`
								}
							} else {
								linkedText = `inheritance`
							}
							let propType = data.property[i].propertyType.includes('RURAL') ? 'RURAL' : 'URBAN';
							let msA = propType === 'URBAN' ? "Sq.Yards" : 'Acres';
							let msB = propType === 'URBAN' ? "" : 'Cents';
							cent = propType === 'URBAN' ? "" : cent;
							if (naturetype == "Sale") {
								let survayNo = data.property[i].survayNo ? data.property[i].survayNo : "............";
								let habitation = data.property[i].habitation ? data.property[i].habitation : "............";
								let district = data.property[i].district ? data.property[i].district : "............";
								let sroOffice = data.property[i].sroOffice ? data.property[i].sroOffice : "............";
								let amount = data.amount ? data.amount : "............";
								let am = amountInWords ? amountInWords : "............";
								pdeStyle.content.push({ text: `(the terms 'THE VENDOR' and the 'THE VENDEE' herein used shall wherever the context so admit mean and include all their respective heirs, executors, successors, legal representatives,partners, directors,administrators and assignees etc..., thereof) Whereas the Vendor is the absolute owner and possessor of ${toTitleCase(landUse)} measuring ${acr} ${msA} ${cent}${msB} forming part of Survey No ${survayNo}, situated at ${toTitleCase(habitation)} , ${toTitleCase(district)} District Whereas VENDOR has acquired the schedule property by ${linkedText} registered at SRO ${toTitleCase(sroOffice)} and since from the date of acquisition, the VENDOR is in peaceful possession of the same.Whereas the vendor herein offered to sell the schedule property, which is free from all kinds ofencumbrances for a total sale consideration of Rs.${amount}/ (Rupees ${am} only) to the vendee and the vendee has agreed to purchase the same for the said consideration`, style: ["p3Text1_main1"] });
							} else if (naturetype == "SETTLEMENT") {
								let surveyNo = data.property[i].survayNo ? data.property[i].survayNo : "............";
								let habitation = data.property[i].habitation ? data.property[i].habitation : "............";
								let mandal = data.property[i].mandal ? data.property[i].mandal : "............";
								let district = data.property[i].district ? data.property[i].district : "............";
								pdeStyle.content.push({ text: `Whereas the ${partyType1} herein is the absolute owner and possessor of ${toTitleCase(landUse)}  measuring ${acr} ${msA} ${cent} ${msB} forming part of Survey No ${surveyNo} situated at ${toTitleCase(habitation)} of ${toTitleCase(mandal)} Mandal, ${toTitleCase(district)} District , Whereas Settlor has acquired the schedule property by ${linkedText} since then the settlor is in possession and enjoyment of thesaid site with full and absolute rights free from all encumbrances.`, style: ["p3Text1_main1"] })

							} else if (naturetype === "Mortgage") {
								let survayNo = data.property[i].survayNo ? data.property[i].survayNo : "............";
								let habitation = data.property[i].habitation ? data.property[i].habitation : "............";
								let district = data.property[i].district ? data.property[i].district : "............";
								let sroOffice = data.property[i].sroOffice ? data.property[i].sroOffice : "............";
								let amount = data.amount ? data.amount : "............";
								let am = amountInWords ? amountInWords : "............";
								pdeStyle.content.push({ text: `Whereas the mortgagor is the absolute owner and possessor of Scheduled property in Sy.No. ${survayNo} Extent ${acr} ${msA} ${cent} ${msB} situated at ${toTitleCase(habitation)} village of ${toTitleCase(data.property[i].mandal)} Mandal, ${toTitleCase(district)} district acquired by ${linkedText}`, style: ["p3Text1_main1"] });
								pdeStyle.content.push({ text: `AND WHEREAS the MORTGAGOR${partyType1}(S) being in need of money has/have approached the ${partyType2} to lend the money, and the Mortgagee herein also  agreed for the same and on this day the ${partyType1}(S) borrowed and received a sum of Rs.${amount}/ (Rupees ${am} only) from the ${partyType2} and the ${partyType1}(S) do hereby admits and acknowledges the receipt of the same.`, style: ["p3Text1_main1"] });
							} else if (naturetype === "Release") {
								pdeStyle.content.push({ text: `Whereas the ${partyType1} and ${partyType2} for a valid sale consideration, through a Sale Deed dt......as Document No... and got it registered in the Office of the Sub Registrar.....of Book-1, Volume......Pages..... to......`, style: ["p3Text1_main1"] });
								pdeStyle.content.push({ text: `The Releasees Nos....... each are having ..... th undivided share of rights in the schedule property and Releasees Nos. ..... are having ....... undivided share of rights in the schedule property and decided to take the ........ share belongs to the Releasor and the Releasor has also agreed to release his ....... th share in the schedule property and the Releasor delivered the possession of his share of property to the Releasees and the Releasees taken over the possession thereof.`, style: ["p3Text1_main1"] });
								pdeStyle.content.push({
									text: `The Releasor hereby convey, transfer and assign all his.......... share of rights, title and interest together with all liberties, advantages, appurtenances and rights of easements in
								the schedule property to the Releasees who shall hereafter ........ enjoy the schedule property together along with their share of property, with full and absolute rights from generation without any dispute or objection from any one or from any source.`, style: ["p3Text1_main1"]
								});
							}
						}
					} else if (naturetype == "Sale") {
						pdeStyle.content.push({ text: `(the terms 'THE VENDOR' and the 'THE VENDEE' herein used shall wherever the context so admit mean and include all their respective heirs, executors, successors, legal representatives,partners, directors,administrators and assignees etc..., thereof) Whereas the Vendor is the absolute owner and possessor of ............ measuring ............Acres ............Cents forming part of Survey No ............, situated at ............ , ............ District Whereas VENDOR has acquired the schedule property by ............ registered at SRO ............ and since from the date of acquisition, the VENDOR is in peaceful possession of the same.Whereas the vendor herein offered to sell the schedule property, which is free from all kinds ofencumbrances for a total sale consideration of Rs............./ (Rupees ............ only) to the vendee and the vendee has agreed to purchase the same for the said consideration`, style: ["p3Text1_main1"] });
					} else if (naturetype == "SETTLEMENT") {
						pdeStyle.content.push({ text: `Whereas the ${partyType1} herein is the absolute owner and possessor of ...... measuring ...... Sq.yds in ,........ situated at ......... , acquired by inheritence.`, style: ["p3Text1_main1"] })
					} else if (naturetype === "Mortgage") {
						pdeStyle.content.push({ text: `Whereas the mortgagor is the absolute owner and possessor of Scheduled property in Sy.No.____Extent_____ situated at ____ village of ___ Mandal, _____district acquired by inheritance.`, style: ["p3Text1_main1"] });
						pdeStyle.content.push({ text: `AND WHEREAS the MORTGAGOR(S) being in need of money has/have approached the MORTGAGEE(S)s to lend the money, and the Mortgagee herein also  agreed for the same and on this day the MORTGAGOR(S) borrowed and received a sum of Rs. ________________ /- (Rupees  _____ only) from the MORTGAGEE(S) and the MORTGAGOR(S) do hereby admits and acknowledges the receipt of the same`, style: ["p3Text1_main1"] });
					} else if (naturetype === "Release") {
						pdeStyle.content.push({ text: `Whereas the ${partyType1} and ${partyType2} for a valid sale consideration, through a Sale Deed dt......as Document No... and got it registered in the Office of the Sub Registrar.....of Book-1, Volume......Pages..... to......`, style: ["p3Text1_main1"] });
						pdeStyle.content.push({ text: `The Releasees Nos....... each are having ..... th undivided share of rights in the schedule property and Releasees Nos. ..... are having ....... undivided share of rights in the schedule property and decided to take the ........ share belongs to the Releasor and the Releasor has also agreed to release his ....... th share in the schedule property and the Releasor delivered the possession of his share of property to the Releasees and the Releasees taken over the possession thereof.`, style: ["p3Text1_main1"] });
						pdeStyle.content.push({
							text: `The Releasor hereby convey, transfer and assign all his.......... share of rights, title and interest together with all liberties, advantages, appurtenances and rights of easements in
						the schedule property to the Releasees who shall hereafter ........ enjoy the schedule property together along with their share of property, with full and absolute rights from generation without any dispute or objection from any one or from any source.`, style: ["p3Text1_main1"]
						});
					}

					// pdeStyle.content.push({text:`PDE ID : ${data.applicationId}`,alignment:"right"});

					if (naturetype == "Sale") {
						pdeStyle.content.push({ text: `NOW THEREFORE THIS DEED OF ABSOLUTE ${naturetype.toUpperCase()} WITNESSETH AS HERE UNDER:`, style: ["p2Header_main"] });
						pdeStyle.content.push({ text: `1.In pursuance of the said offer and acceptance the ${partyType2} has paid the entire consideration a sum of Rs.${data.amount}/- (Rupees ${amountInWords} Only) to the ${partyType1} in the following manner.`, style: ["p3Text1_main3"] });
						if (data?.payment && data?.payment.length > 0) {

							let payNo = 0;
							for (let i in data?.payment) {
								let payinword = await NumToWord(data?.payment[i]?.payAmount);
								let payDate = new Date(data?.payment[i]?.dateOfPayment).toLocaleDateString();
								payNo = payNo + 1;
								if (payNo == 1) {
									pdeStyle.content.push({ text: `${payNo}. Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} Dated ${payDate}.`, style: ["p3text1_pay"] })
								} else {
									pdeStyle.content.push({ text: `${payNo}. Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} Dated ${payDate}.`, style: ["p3text1_pay"] })
								}
							}
							pdeStyle.content.push({ text: `\n\nAnd the VENDOR hereby admits and acknowledges the same.`, style: ["p3text1_pay"] });

						};
					} else if (naturetype == "SETTLEMENT") {
						pdeStyle.content.push({ text: `NOW THIS ${naturetype} DEED WITNESSES AS FOLLOWS:`, style: ["p2Header_main"] });
						pdeStyle.content.push({ text: `1.The ${partyType1} hereby declare that the ${partyType1} is the rightful owner, and is having full right and absolute authority to settle the schedule property to the ${partyType2} and that the schedule property is free from all kinds of encumbrances, charges, lien, claims and demands of whatsoever nature and that the ${partyType1} has paid all taxes etc., payable on the schedule property up to date and there are no dues of any kind against the said property.`, style: ["p3Text1_main3"] })
					} else if (naturetype == "Mortgage") {
						pdeStyle.content.push({ text: `NOW THEREFORE THIS DEED OF  ${naturetype.toUpperCase()}  WITNESSESTH AS HEREUNDER:`, style: ["p2Header_main"] });
						pdeStyle.content.push({ text: `In pursuance of the  terms and condtions hereunder mentioned,  the mortgagee has paid the loan amount a sum of Rs.${data.amount}(Rupees ${amountInWords} only) to the mortgagor in the following manner.`, style: ["p3Text1_main3"] })

						pdeStyle.content.push({ text: `\n\nAnd the mortgagor hereby admits and acknowledges the same.`, style: ["p3text1_pay"] });
					} else if (naturetype === "Release") {
						pdeStyle.content.push({ text: `THE RELEASOR FURTHER COVENANT WITH THE RELEASEES AS FOLLOWS:`, style: ["p2Header_main"] });
						pdeStyle.content.push({
							text: `1.The Releasor and Releasees have jointly got full, absolute and marketable title as mentioned supra, and the Releasor convey, transfer and assign all his share of title, interest and all rights in the schedule property to the Releasees. The Releasor hereby assure the Releasors that the schedule property is not subject to any mortgage, claim, court litigations whatsoever and that it is free from all sorts of encumbrances.
						\n2.The Releasor shall indemnify the Releasees against any loss that would be sustained by the Releasees on account of any defect in the title, rights, interest of his share of the Releasor over the schedule property and that all disputes that would arise in future course of time, with regards to his share of schedule property belonging to the Releasor will be settled down by the Releaser at his own cost and relieve the Releasees from all such disputes. 
						\n3.The Releasor, his heirs or representatives or assignees hereafter shall not interfere or claim or dispute the right, title and enjoyment of the schedule property by the Releasees or their heirs, or representatives and assignees. 
						\n4.The possession of the schedule property was already delivered to the Releases by the Releasor 
						\n5.The Releasor and Releasees have jointly paid all the taxes. Revenue Cess to the concerned authorities up to date and the Releasees and Releasor shall jointly pay if there are any arrears of taxes etc.
						\n6.For change of mutation in the records of the Government and Municipal Records the necessary Patta Transfer Application Forms are presented along with this Release Deed to the registering officer.
						\n7.The Releasor hereby declares that the schedule property is not hit by the provisions of the A.P. Act 9/1977 (Act prohibiting the alienations of the A.P. Assigned Lands) that it was not mortgaged to the Government or to its agencies previously and it is not earmarked in the master plan for any public purposes.
						\n8.All the link documents relating to the schedule property is handedover to the Releases by the Releasor.`, style: ["p3Text1_main3"]
						})
					}


					if (naturetype == "Mortgage") {
						pdeStyle.content.push({ text: `1)Repayment of Loan :`, style: ["p3Header_MR"] });
						if (data?.payment && data?.payment.length > 0) {
							for (let i in data?.payment) {
								pdeStyle.content.push({ text: `That the MORTGAGOR(S) has agreed to pay the said principle sum of Rs.${data?.payment[i].payAmount} within a period of ${data?.payment[i].duration}  months/years from this day and interest will be payable in once in a month @ ${data?.payment[i].rateOfInterest} %  per annum. And that in case of default in payment of the said interest amount, penal interest will be charged @ ${data?.payment[i].interestOfPenalty}% in addition per month. If any interest amount remains unpaid the same will be payable at once with the Principal.`, style: ["covanants"] });
							}
						} else {
							pdeStyle.content.push({ text: `That the MORTGAGOR(S) has agreed to pay the said principle sum of Rs.${data.amount} within a period of ______ months/years from this day and interest will be payable in once in a month @ _____%  per annum. And that in case of default in payment of the said interest amount, penal interest will be charged @ _______% in addition per month. If any interest amount remains unpaid the same will be payable at once with the Principal.`, style: ["covanants"] });
						}
						pdeStyle.content.push({ text: `2)Security :`, style: ["p3Header_MR"] });
						pdeStyle.content.push({ text: `As security for the repayment of  the above loan the MORTGAGOR hereby transfers by way of simple mortgage the property morefully described in the schedule hereunder in favour of the MORTGAGEE.`, style: ["covanants"] });
						pdeStyle.content.push({ text: `3)Indemnity :`, style: ["p3Header_MR"] });
						pdeStyle.content.push({ text: `That if the said principal sum or sums of money herein before  covenanted to be paid with interest at the rate and within the period stipulated is not be duly paid or if MORTGAGOR(S) fails and/or neglects to complete this obligation, in so doing the MORTGAGEE(S)s shall have the right to enforce the security hereunder created and to sell the property and realise out of the proceeds of such sale all sums due to them together with principal and interest after paying the costs and expenses  of such sale and if the MORTGAGEE(S)s debt is still unsatisfied,  the MORTGAGEE(S)s may enforce the loan against the person or other property of the MORTGAGOR(S) and in case  of there being surplus, the same shall be refunded to the MORTGAGOR(S). And the MORTGAGOR(S) shall reimburse all the sums paid by the MORTGAGEE(S)s on behalf of the MORTGAGOR(S). And also that if any expenditure incurred by the MORTGAGEE(S)s towards postal, registration charges, court expenses etc. shall be debited to the Principal and shall carry interest as mentioned above. As a security for the due repayment of all monies due under this deed, the MORTGAGOR(S) hereby mortgage without possession with MORTGAGEE(S)s all the schedule property as said above.`, style: ["covanants"] });
						pdeStyle.content.push({ text: covenantArr, style: ["covanants"] });
						pdeStyle.content.push({ text: `Declaration :`, style: ["p3Header_MR"] });
						pdeStyle.content.push({ text: `And the MORTGAGOR(S) hereby declares and covenant.`, style: ["covanants"] });
						pdeStyle.content.push({
							text: `a)	That the Mortgaged property is free from all charges and encumbrances whatsoever.
						\nb) That the MORTGAGOR(S) is the absolute owner of the property mentioned below and is entitled to mortgage the same.`, style: ["covanants"]
						});

					} else {
						let sNo = 2
						let cvStaticArry = [];
						let sNoD = 1;
						covanantsData[DocNum].map((cov) => {
							if (cov.minDocNum === data.documentNature.TRAN_MIN_CODE) {
								covenantArr = [...covenantArr, sNoD + "." + cov.value];
								sNo = sNo + 1;
							}
						});
						// if(naturetype === "Sale"){
						// 	covanantsData.sale.map((cv)=>{
						// 		let val = sNo ===2 ? `${sNo}.${cv.value}` : `\n${sNo}.${cv.value}`
						// 		cvStaticArry = [...cvStaticArry,val];
						// 		sNo =sNo+1;
						// 	})
						// }
						if (naturetype === "SETTLEMENT") {
							covanantsData.gift.map((cv) => {
								let val = sNo === 2 ? `${sNo}.${cv.value}` : `\n${sNo}.${cv.value}`
								cvStaticArry = [...cvStaticArry, val];
								sNo = sNo + 1;
							})
						}

						pdeStyle.content.push({ text: cvStaticArry, style: ["covanants"] });
						pdeStyle.content.push({ text: covenantArr, style: ["covanants"] });
					}
					// pdeStyle.content.push({text:`PDE ID : ${data.applicationId}`,alignment:"right"});

					//PropertyDetails**
					pdeStyle.content.push({ text: 'SCHEDULE OF PROPERTY', alignment: 'center', bold: true, decoration: 'underline', margin: [10, 10, 0, 5] });

					if (data.property && data.property.length > 0) {
						let propLangth = data.property.length;
						let tMValue = 0;
						let dataI = 0;

						for (var i = 0; i < data.property.length; i++) {
							dataI = dataI === 0 ? 1 : dataI + 1;
							tMValue = tMValue + data.property[i].marketValue;
							if (naturetype == "Sale" || naturetype == "SETTLEMENT" || naturetype == "Release" || naturetype == "Mortgage") {
								let [landUse, rest] = data.property[i].landUse.split("[");
								let propType = data.property[i].propertyType.includes('RURAL') ? 'RURAL' : 'URBAN';
								pdeStyle.content.push({ text: [{ text: `Schedule ${data.property[i].seqNumber}:`, style: ['f18'] }, { text: ` ${landUse}`, fontSize: '12' }] });

								pdeStyle.content.push({ text: 'Location of the Property', style: ['sideHeaderNames'] });
								pdeStyle.content.push({
									table: {
										widths: [120, 120, 120, 120],
										body: [
											[{ text: 'Registration District', alignment: 'center', bold: true, width: '*', margin: [10, 1, 27, 0] }, { text: 'Sub Registrar Office', bold: true, alignment: 'center', width: '*', margin: [10, 1, 27, 0] }, { text: 'Village', bold: true, alignment: 'center', width: '*', margin: [20, 1, 27, 0] }, { text: 'Mandal', bold: true, alignment: 'center', width: '*', margin: [20, 1, 27, 0] }],
											[{ text: `${toTitleCase(data?.property[i].district)}`, alignment: 'center' }, { text: `${toTitleCase(data?.property[i].sroOffice)}`, alignment: 'center' }, { text: `${toTitleCase(data?.property[i]?.village)}`, alignment: 'center' }, { text: `${toTitleCase(data?.property[i]?.village)}`, alignment: 'center' }]
										]
									}
								});
								pdeStyle.content.push(' ');
								pdeStyle.content.push({
									table: {
										widths: [250, 249],
										body: [
											[{ text: 'Revenue District', alignment: 'center', bold: true }, { text: 'Local Body', bold: true, alignment: 'center', }],
											[{ text: `${toTitleCase(data?.property[i]?.district)}`, alignment: 'center' }, { text: `${toTitleCase(data?.property[i]?.sroOffice)}`, alignment: 'center' }]
										]
									}
								});
								pdeStyle.content.push({ text: 'Land Details', style: ['sideHeaderNames'] });
								const locality = data?.property[i].locality != "" ? toTitleCase(data?.property[i].locality) : toTitleCase(data?.property[i].habitation);
								if (propType === "URBAN") {
									pdeStyle.content.push({
										table: {
											widths: [90, 30, 35, 40, 50, 50, 70, 80],
											body: [
												[{ text: 'Locality/Habitation', alignment: 'center', bold: true },
												{ text: 'Ward/Bi-ward', bold: true, alignment: 'center' },
												{ text: 'Block/Bi-block', bold: true, alignment: 'center' },
												{ text: 'Door\nNo', bold: true, alignment: 'center' },
												{ text: 'Survey/\nTSurvey Number', bold: true, alignment: 'center' },
												{ text: 'Total Extent\n(Sq.Yards)', alignment: 'center', bold: true },
												{ text: 'Undivided \nShare(Sq.Yards)', alignment: 'center', bold: true },
												{ text: 'Market Value', alignment: 'center', bold: true }],
												[
													{ text: `${toTitleCase(locality)}`, alignment: 'center' },
													{ text: data?.property[i].biWard && data?.property[i].biWard != 0 && data?.property[i].biWard !== '' ? `${data?.property[i].ward}/${data?.property[i].biWard}` : `${data?.property[i].ward}`, alignment: 'center' },
													{ text: data?.property[i].biBlock && data?.property[i].biBlock != 0 && data?.property[i].biBlock !== '' ? `${data?.property[i].block}/${data?.property[i].biBlock}` : `${data?.property[i].block}`, alignment: 'center' },
													{ text: `${data?.property[i].doorNo}`, alignment: 'center' },
													{ text: `${data?.property[i].survayNo}`, alignment: 'center' },
													{ text: `${data?.property[i].extent}`, alignment: 'center' }, //totalext
													{ text: `${data?.property[i].undividedShare}`, alignment: 'center' },
													{ text: `${data?.property[i].marketValue}`, alignment: 'center' }
												]
											]

										}
									});
									pdeStyle.content.push({
										columns: [
											{ text: 'Structure Details', style: ['sideHeaderNames'] },
											{ text: `Apartment Name :  ${data?.property[i].appartmentName.toUpperCase()}`, style: ['sideHeaderNames'] },
											{ text: `No of Floors : ${data?.property[i].totalFloors}`, style: ['sideHeaderNamesright'] }
										]
									});
									if (data?.property[i]?.structure?.length > 0) {
										for (var j = 0; j < data?.property[i]?.structure.length; j++) {
											let [strType, rest] = data?.property[i]?.structure[j].structureType.split("[");
											let [stage, rest2] = data?.property[i]?.structure[j].stageOfCons.split("[");
											pdeStyle.content.push({
												table: {
													body: [
														[
															{ text: 'Floor No', alignment: 'center', bold: true, width: '*', margin: [10, 1, 25, 0] }, { text: 'Structure type', bold: true, alignment: 'center', width: '*', margin: [0, 0, 25, 0] }, { text: 'Plinth(sq feets) ', bold: true, alignment: 'center', width: '*', margin: [0, 0, 27, 0] }, { text: 'Stage of Cons.', bold: true, alignment: 'center', width: '*', margin: [0, 0, 25, 0] }, { text: 'Age', bold: true, alignment: 'center', width: '*', margin: [0, 0, 30, 0] }],

														[
															{ text: `${data?.property[i]?.structure[j].floorNo}`, alignment: 'center' }, { text: `${strType}`, alignment: 'center' }, { text: `${data?.property[i]?.structure[j].plinth}`, alignment: 'center' }, { text: `${stage}`, alignment: 'center' }, { text: `${data?.property[i]?.structure[j].age}`, alignment: 'center' }
														]
													]
												}
											})
										}

									}
									let [scProp, rest] = data?.property[i].schedulePropertyType.split('[');
									scProp = scProp.trim();
									if (scProp === 'FLAT') {
										pdeStyle.content.push({ text: 'Flat Boundary Details', style: ['sideHeaderNames'] });
										pdeStyle.content.push({
											table: {
												widths: [208, 290],
												body: [
													[{ text: 'East', alignment: 'left', width: '*', margin: [10, 0, 165, 0] }, { text: `${toTitleCase(data?.property[i]?.flatEastBoundry.slice(0, 20))}`, alignment: 'left', margin: [10, 0, 200, 0] }],
													[{ text: 'West', alignment: 'left', width: '*', margin: [10, 0, 154, 0] }, { text: `${toTitleCase(data?.property[i]?.flatWestBoundry)}`, alignment: 'left', margin: [10, 0, 100, 0] }],
													[{ text: 'North', alignment: 'left', width: '*', margin: [10, 0, 154, 0] }, { text: `${toTitleCase(data?.property[i]?.flatNorthBoundry)}`, alignment: 'left', margin: [10, 0, 100, 0] }],
													[{ text: 'South', alignment: 'left', width: '*', margin: [10, 0, 154, 0] }, { text: `${toTitleCase(data?.property[i]?.flatSouthBoundry)}`, alignment: 'left', margin: [10, 0, 100, 0] }],
												]
											}
										});
									};

									if (propLangth === dataI) {
										pdeStyle.content.push({ text: 'Apartment Boundary Details', style: ['sideHeaderNames'] });
										pdeStyle.content.push({
											table: {
												widths: [208, 290],
												body: [
													[{ text: 'East', alignment: 'left', width: '*', margin: [10, 0, 165, 0] }, { text: `${toTitleCase(data?.property[i]?.eastBoundry.slice(0, 20))}`, alignment: 'left', margin: [10, 0, 200, 0] }],
													[{ text: 'West', alignment: 'left', width: '*', margin: [10, 0, 154, 0] }, { text: `${toTitleCase(data?.property[i]?.westBoundry)}`, alignment: 'left', margin: [10, 0, 100, 0] }],
													[{ text: 'North', alignment: 'left', width: '*', margin: [10, 0, 154, 0] }, { text: `${toTitleCase(data?.property[i]?.northBoundry)}`, alignment: 'left', margin: [10, 0, 100, 0] }],
													[{ text: 'South', alignment: 'left', width: '*', margin: [10, 0, 154, 0] }, { text: `${toTitleCase(data?.property[i]?.southBoundry)}`, alignment: 'left', margin: [10, 0, 100, 0] }],
												]
											}
										});
										pdeStyle.content.push(' ');
										pdeStyle.content.push({
											table: {
												widths: [250, 249],
												body: [
													[{ text: 'Chargeable Value(Round to next 500/-)', alignment: 'left', width: '*', margin: [10, 10, 0, 0] }, { text: `${tMValue}`, alignment: 'left', width: '*', margin: [10, 10, 188, 0] }]
												]
											}
										});
									} else {
										pdeStyle.content.push({ text: 'Apartment Boundary Details', style: ['sideHeaderNames'] });
										pdeStyle.content.push({
											table: {
												widths: [208, 290],
												body: [
													[{ text: 'East', alignment: 'left', width: '*', margin: [10, 0, 165, 0] }, { text: `${toTitleCase(data?.property[i]?.eastBoundry.slice(0, 20))}`, alignment: 'left', margin: [10, 0, 200, 0] }],
													[{ text: 'West', alignment: 'left', width: '*', margin: [10, 0, 154, 0] }, { text: `${toTitleCase(data?.property[i]?.westBoundry)}`, alignment: 'left', margin: [10, 0, 100, 0] }],
													[{ text: 'North', alignment: 'left', width: '*', margin: [10, 0, 154, 0] }, { text: `${toTitleCase(data?.property[i]?.northBoundry)}`, alignment: 'left', margin: [10, 0, 100, 0] }],
													[{ text: 'South', alignment: 'left', width: '*', margin: [10, 0, 154, 0] }, { text: `${toTitleCase(data?.property[i]?.southBoundry)}`, alignment: 'left', margin: [10, 0, 100, 0] }],
												]
											}, pageBreak: "after"
										});
									}
								};

								if (propType === "RURAL") {
									pdeStyle.content.push({
										table: {
											widths: [120, 100, 120, 140],
											body: [
												[{ text: 'Locality/Habitation', alignment: 'center', bold: true },
												{ text: 'Survey/\nTSurvey Number', bold: true, alignment: 'center' },
												{ text: 'conveyedExtent', bold: true, alignment: 'center' },
												{ text: 'Market value', alignment: 'center', bold: true }],
												[
													{ text: `${toTitleCase(locality)}`, alignment: 'center' },
													{ text: `${data?.property[i].survayNo}`, alignment: 'center' },
													{ text: `${data?.property[i].tExtent}`, alignment: 'center' },
													{ text: `${data?.property[i].marketValue}`, alignment: 'center' }
												]
											]
										}
									});
									pdeStyle.content.push({ text: 'Boundary Details', style: ['sideHeaderNames'] });
									pdeStyle.content.push({ text: '', style: ['sideHeaderNames'] });
									pdeStyle.content.push({
										table: {
											widths: [208, 290],
											body: [
												[{ text: 'East', alignment: 'left', width: '*', margin: [10, 0, 165, 0] }, { text: `${toTitleCase(data?.property[i]?.eastBoundry.slice(0, 20))}`, alignment: 'left', margin: [10, 0, 200, 0] }],
												[{ text: 'West', alignment: 'left', width: '*', margin: [10, 0, 154, 0] }, { text: `${toTitleCase(data?.property[i]?.westBoundry)}`, alignment: 'left', margin: [10, 0, 100, 0] }],
												[{ text: 'North', alignment: 'left', width: '*', margin: [10, 0, 154, 0] }, { text: `${toTitleCase(data?.property[i]?.northBoundry)}`, alignment: 'left', margin: [10, 0, 100, 0] }],
												[{ text: 'South', alignment: 'left', width: '*', margin: [10, 0, 154, 0] }, { text: `${toTitleCase(data?.property[i]?.southBoundry)}`, alignment: 'left', margin: [10, 0, 100, 0] }],
											]
										}, pageBreak: "after"
									})
								}
								pdeStyle.content.push(' ');
							}
						}
					} else {
						if (naturetype == "Sale" || naturetype == "SETTLEMENT") {
							pdeStyle.content.push({ text: [{ text: `Schedule ....:`, style: ['f18'] }, { text: `.........`, fontSize: '12' }] });
							pdeStyle.content.push({ text: 'Location of the Property', style: ['sideHeaderNames'] });
							pdeStyle.content.push({
								table: {
									widths: [120, 120, 120, 120],
									body: [
										[{ text: 'Registration District', alignment: 'center', bold: true, width: '*', margin: [10, 1, 27, 0] }, { text: 'Sub Registrar Office', bold: true, alignment: 'center', width: '*', margin: [10, 1, 27, 0] }, { text: 'Village', bold: true, alignment: 'center', width: '*', margin: [20, 1, 27, 0] }, { text: 'Mandal', bold: true, alignment: 'center', width: '*', margin: [20, 1, 27, 0] }],
										[{ text: ` `, alignment: 'center' }, { text: ` `, alignment: 'center' }, { text: ` `, alignment: 'center' }, { text: ` `, alignment: 'center' }]
									]
								}
							});
							pdeStyle.content.push(' ');
							pdeStyle.content.push({
								table: {
									widths: [250, 249],
									body: [
										[{ text: 'Revenue District', alignment: 'center', bold: true }, { text: 'Local Body', bold: true, alignment: 'center', }],
										[{ text: ` `, alignment: 'center' }, { text: ` `, alignment: 'center' }]
									]
								}
							});
							pdeStyle.content.push({ text: 'Land Details', style: ['sideHeaderNames'] });

							// if(propType === "RURAL"){
							pdeStyle.content.push({
								table: {
									widths: [120, 200, 170],
									body: [
										[{ text: 'Locality/Habitation', alignment: 'center', bold: true },
										{ text: 'Survey/\nTSurvey Number', bold: true, alignment: 'center' },
										{ text: 'Market value', alignment: 'center', bold: true }],
										[
											{ text: `    `, alignment: 'center' },
											{ text: `     `, alignment: 'center' },
											{ text: `      `, alignment: 'center' }
										]
									]

								}
							});
							// }
							pdeStyle.content.push(' ');
						} else if (naturetype == "Mortgage") {
							pdeStyle.content.push({ text: `All that the piece and parcel of Agriculture Land bearing Survey No._________   admeasuring Ac. ______ / _______ Hectors, situated in ___________ Village ___________ Mandal _______, under the jurisdiction of Sub District _______  and  Registration District ________ `, style: ['p1Text_MR'] })
							pdeStyle.content.push({ text: `EAST       : `, style: ['p1Text_MR1'] })
							pdeStyle.content.push({ text: `WEST      : `, style: ['p1Text_MR1'] })
							pdeStyle.content.push({ text: `NORTH   : `, style: ['p1Text_MR1'] })
							pdeStyle.content.push({ text: `SOUTH   : `, style: ['p1Text_MR1'] })
						}
					}

					if (naturetype == "Sale" || naturetype == "SETTLEMENT") {
						pdeStyle.content.push({ text: `PDE ID : ${data.applicationId}`, alignment: "right", pageBreak: 'before' });
						pdeStyle.content.push({ text: 'Execution Details', alignment: 'center', bold: true, decoration: 'underline', margin: [10, 20, 0, 5] })
						pdeStyle.content.push({ text: `In witness whereof,  the ${partyType1.toUpperCase()} herein has signed on this  Settlement  Deed  with free will and on the day, month and year first above mentioned in the presence of the following witnesses.`, style: ["p3Text1_main2"] });
						pdeStyle.content.push({ text: partyType1, style: "p3Text1_settlor" });
						if (data?.executent && data?.executent.length > 0) {
							let excount = 1;
							for (let i in data?.executent) {
								let aadhar = data?.executent[i]?.aadhaar ? String(data?.executent[i]?.aadhaar)?.replace(String(data?.executent[i]?.aadhaar).substring(0, 8), "XXXX XXXX ") : "XXXX XXXX XXXX";
								let panOrTanOrForm60Header = data.executent[i]?.panNoOrForm60or61 ? "PAN/Form60" : "TAN";
								let panOrTanOrForm60Value = data.executent[i]?.panNoOrForm60or61 ? data.executent[i]?.panNoOrForm60or61 : data.executent[i]?.tan;
								pdeStyle.content.push({ text: `${excount}`, margin: [50, 20, 0, 0] })
								pdeStyle.content.push({
									text: `Signature:        ` + '\n' + '\n' +
										`Name:   ${data?.executent[i]?.name}`
										+ '\n' + '\n' +
										`Aadhar Number : ${aadhar}` + '\n' + '\n' +
										`${panOrTanOrForm60Header} : ${panOrTanOrForm60Value}`
									, style: "p3Text1_settlor1"
								});
								excount = excount + 1;
								if (data?.executent[i]?.represent.length > 0) {
									pdeStyle.content.push({ text: `Reprentated By :`, style: "p3Text1_settlor" });
									let repCount = 1;
									for (let j in data?.executent[i].represent) {
										let aadhar = data?.executent[i]?.represent[j].aadhaar ? String(data?.executent[i]?.represent[j].aadhaar)?.replace(String(data?.executent[i]?.represent[j].aadhaar).substring(0, 8), "XXXX XXXX ") : "XXXX XXXX XXXX";
										let panOrTanOrForm60Header = data?.executent[i]?.represent[j].panNoOrForm60or61 ? "PAN/Form60" : "TAN";
										let panOrTanOrForm60Value = data?.executent[i]?.represent[j].panNoOrForm60or61 ? String(data?.executent[i]?.represent[j].panNoOrForm60or61).toUpperCase() : String(data?.executent[i]?.represent[j].tan).toUpperCase();
										pdeStyle.content.push({ text: `${repCount}`, margin: [50, 20, 0, 0] })
										pdeStyle.content.push({
											text: `Signature:        ` + '\n' + '\n' +
												`Name:   ${toTitleCase(data?.executent[i]?.represent[j].name)}`
												+ '\n' + '\n' +
												`Aadhar Number : ${aadhar}` + '\n' + '\n' +
												`${panOrTanOrForm60Header} : ${panOrTanOrForm60Value}`, style: "p3Text1_settlor1"
										})
										repCount = repCount + 1;
									}
								}
							}
						} else {
							pdeStyle.content.push({ text: `${1}`, margin: [50, 20, 0, 0] })
							pdeStyle.content.push({
								text: `Signature:        ` + '\n' + '\n' +
									`Name:   XXXXXXXX XXX`
									+ '\n' + '\n' +
									`Aadhar Number: XXXX XXXX XXXX` + '\n' + '\n' +
									`FORM60`
								, style: "p3Text1_settlor1"
							});
						}
						pdeStyle.content.push({ text: partyType2, style: "p3Text1_settlor" });
						if (data?.claimant && data?.claimant.length > 0) {
							let excount = 1;
							for (let i in data?.claimant) {
								let aadhar = data?.claimant[i]?.aadhaar ? String(data?.claimant[i]?.aadhaar)?.replace(String(data?.claimant[i]?.aadhaar).substring(0, 8), "XXXX XXXX") : "XXXX XXXX XXXX";
								let panOrTanOrForm60Header = data.claimant[i]?.panNoOrForm60or61 ? "PAN/Form60" : "TAN";
								let panOrTanOrForm60Value = data.claimant[i]?.panNoOrForm60or61 ? String(data.claimant[i]?.panNoOrForm60or61).toUpperCase() : String(data.claimant[i]?.tan).toUpperCase();
								pdeStyle.content.push({ text: `${excount}`, margin: [50, 20, 0, 0] })
								pdeStyle.content.push({
									text: `Signature:        ` + '\n' + '\n' +
										`Name:   ${toTitleCase(data?.claimant[i]?.name)}`
										+ '\n' + '\n' +
										`Aadhar Number : ${aadhar}` + '\n' + '\n' +
										`${panOrTanOrForm60Header} : ${panOrTanOrForm60Value}`
									, style: "p3Text1_settlor1"
								});
								excount = excount + 1;
								if (data?.claimant[i]?.represent.length > 0) {
									pdeStyle.content.push({ text: `Reprentated By :`, style: "p3Text1_settlor" });
									let repCount = 1;
									for (let j in data?.claimant[i].represent) {
										let aadhar = data?.claimant[i]?.represent[j].aadhaar ? String(data?.claimant[i]?.represent[j].aadhaar)?.replace(String(data?.claimant[i]?.represent[j].aadhaar).substring(0, 8), "XXXX XXXX") : "XXXX XXXX XXXX";
										let panOrTanOrForm60Header = data?.claimant[i]?.represent[j].panNoOrForm60or61 ? "PAN/Form60" : "TAN";
										let panOrTanOrForm60Value = data?.claimant[i]?.represent[j].panNoOrForm60or61 ? String(data?.claimant[i]?.represent[j].panNoOrForm60or61).toUpperCase() : String(data?.claimant[i]?.represent[j].tan).toUpperCase();
										pdeStyle.content.push({ text: `${repCount}`, margin: [50, 20, 0, 0] })
										pdeStyle.content.push({
											text: `Signature:        ` + '\n' + '\n' +
												`Name:   ${toTitleCase(data?.claimant[i]?.represent[j].name)}`
												+ '\n' + '\n' +
												`Aadhar Number : ${aadhar}` + '\n' + '\n' +
												`${panOrTanOrForm60Header} : ${panOrTanOrForm60Value}`, style: "p3Text1_settlor1"
										})
										repCount = repCount + 1;
									}
								}
							}
						} else {
							pdeStyle.content.push({ text: `${1}`, margin: [50, 20, 0, 0] })
							pdeStyle.content.push({
								text: `Signature:        ` + '\n' + '\n' +
									`Name:   XXXXXXXX XXX`
									+ '\n' + '\n' +
									`Aadhar Number: XXXX XXXX XXXX` + '\n' + '\n' +
									`FORM60`
								, style: "p3Text1_settlor1"
							});
						}
						pdeStyle.content.push({ text: " " });
					} else if (naturetype == "Mortgage") {
						pdeStyle.content.push({ text: 'Execution Details', alignment: 'center', bold: true, decoration: 'underline' })
						pdeStyle.content.push({ text: `	IN WITNESS WHEREOF, MORTGAGOR(S) has put signature on this Mortgage Deed with free will and consent without coercion or fraud in the presence of the following witnesses on the above mentioned date, month and year.`, style: ['p1Text_MR'] })
						pdeStyle.content.push({ text: `WITNESSES :`, style: ['p1last_MRleft'] })
						pdeStyle.content.push({ text: `MORTGAGOR `, style: ['p1last_MRright'] })
						pdeStyle.content.push({ text: `1. ` + `\n\n2.`, style: ['p1Text_MR'] })
					}

					// pdeStyle.content.push({text:"Prepared By :",margin:[10,30,0,0],decoration:"underline",bold:true});
					// if(data?.presenter){
					// 	for(let i in data?.presenter){
					// 		pdeStyle.content.push({text:`Signature`+'\n'+'\n'+`Full Name : ${data.presenter[i].name}`+'\n'+'\n'+`Aadhar No : ${data?.presenter[i]?.aadhaar}`+'\n'+'\n'+'\n'+'Photos',style:["p3witness"]});
					// 	}
					// };
					return pdeStyle;
				}
			}
			else {
				let { engGenarateDocs } = require(`./reports/${data.documentNature.TRAN_MAJ_CODE}/${data.documentNature.TRAN_MAJ_CODE}${data.documentNature.TRAN_MIN_CODE}`);
				let hj = await engGenarateDocs(data, documentPath);
				return hj;
			}
		}
	} catch (ex) {
		console.log("error ::", ex.message)
		throw new PDEError({ status: false, message: "Internal Server" });
	}
};

const genTeluguReports = async(data,path,type)=>{
	try{
		// if(data.documentNature.TRAN_MAJ_CODE ==" " ){
		// 	return new Promise( async (resolve, reject) => {
		// 		let [naturetype ,rest]= data.registrationType.TRAN_DESC.split(" ");
		// 		let DocNum = data.documentNature.TRAN_MAJ_CODE;
		// 		let MinDocNum = data.documentNature.TRAN_MIN_CODE;
		// 		let [rest2,disc] = data.documentNature.TRAN_DESC.split("[");
		// 		let [subDesc,rest3]=disc.split("]");
		// 		if(naturetype == "Gift"){
		// 			naturetype = "SETTLEMENT";
		// 		}
		// 		// let partyType1 = naturetype == "SETTLEMENT" ? "SETTLOR" :naturetype == "Mortgage"?"MORTGAGOR":naturetype == "Release"?"RELEASOR" :"VENDOR";
		// 		// let partyType2 = naturetype == "SETTLEMENT" ? "SETTLEE" :naturetype == "Mortgage"?"MORTGAGEE(S)S":naturetype == "Release"?"RELEASEES":"VENDEE";
		// 		var [dd,m,yyyy] = data.executionDate.split("/");
		// 		// var dd = String(exDate.getDate()).padStart(2, '0');
		// 		var mm = new Date(`${yyyy}-${m}-${dd}`).toLocaleDateString('en-US',{month:'long'})
		// 		let covenantArr=[];
		// 		let sNo=1;
		// 		telCovanantsData[DocNum].map((cov)=>{
		// 			if(cov.minDocNum === data.documentNature.TRAN_MIN_CODE){
		// 				covenantArr =[...covenantArr,sNo+"."+cov.value];
		// 				sNo=sNo+1;
		// 			}
		// 		});
		// 		if(data?.covanants){
		// 			sNo=covenantArr.length +1;
		// 			// let sNo =DocNum ==="01" ? 6 : DocNum ==="02"? 8 : DocNum ==="03"? 4: DocNum ==="07" ? 12: DocNum === "05"? 9: DocNum === "06"?  9: DocNum === "04"? 8: DocNum == "09"? 10: 7;
		// 			data?.covanants?.covanants.map((dnc)=>{
		// 				// let val = sNo ===6 || sNo ===8|| sNo ===7 ? `${sNo}. ${covn.value}` : `\n${sNo}. ${covn.value}`
		// 				covenantArr = [...covenantArr,sNo+"."+dnc.value];
		// 				sNo =sNo+1;
		// 			});
		// 		};
		// 		// let y=400
		// 		let y = data.eStamp === "N" ? 400 : 500;
		// 		let pdfDocs = new pdfDoc();
		// 		let createFileData;
		// 		pdfDocs.pipe(createFileData = fs.createWriteStream(path));
		// 		pdfDocs.font(Path.join(__dirname,'../../fonts','telugu.ttf'));
		// 		// if(type == 'rent'){
	
	
		// 		// }else{
					
		// 			// if(data.noOfStampPapers){
		// 			// 	y = data.noOfStampPapers * 200
		// 			// }else{
						
		// 			//}
		// 			//title 2or 3 lines
		// 			pdfDocs.fontSize('18').text(`${subDesc}`,40,y,{align:'center',underline:true});
		// 			switch (DocNum) {
		// 				case "01":
		// 					// pdfDocs.fontSize('18').text(saleDeedDocs.sideheader3,40,y,{align:'center'});
		// 					pdfDocs.fontSize('15').text(`ఈ ${subDesc} ${yyyy} వ సంవత్సరం ${mm} నెల ${dd} వ తేదీన వ్రాయబడినది.`,{align:'center',lineGap:0});
		// 					break;
		// 				case "02":
		// 					// pdfDocs.fontSize('18').text(`${subdoc}`,40,y,{align:'center',underline:true});
		// 					pdfDocs.fontSize('15').text(`రూ ${data.amount} రూపాయలకు  స్థిరాస్థి అస్వాధీన తనఖా దస్తావేజు.`,{align:'center',lineGap:0});
		// 					pdfDocs.fontSize('15').text(`ఈ ${subDesc} ${yyyy} వ సంవత్సరం ${mm} నెల ${dd} వ తేదీన వ్రాయబడినది.`,{align:'center',lineGap:0});
		// 					break;
		// 				case "03":
		// 					// pdfDocs.fontSize('18').text(`దఖలు/దానపట్టా/సెటిల్మెంట్ దస్తావేజు`,40,y,{align:'center'});
		// 					pdfDocs.fontSize('15').text(`ఈ ${subDesc} ${yyyy} వ సంవత్సరం ${mm} నెల ${dd} వ తేదీన వ్రాయబడింది.`,{align:'center',lineGap:0});
		// 				case "07":
		// 					// pdfDocs.fontSize('18').text(`${subDesc}`,40,y,{align:'center',underline:true});
		// 					pdfDocs.fontSize('13').text(`1) .${subDesc}`,{align:'center'});
		// 					pdfDocs.fontSize('13').text(`2) .ఈ ${subDesc} ${yyyy} వ సంవత్సరం ${mm} నెల ${dd} వ తేదీన వ్రాయబడింది.`,{align:'center'});
		// 					break;
		// 				case "05":
		// 					// pdfDocs.fontSize('18').text(`${subDesc}`,40,y,{align:'center',underline:true});
		// 					pdfDocs.fontSize('13').text(`రూ..... రూపాయలు ప్రతిఫలముగా తీసుకొని, షెడ్యూలు దాఖలా మొత్తం చక్ర..... లు స్థిరాస్తిలో నాకుగల ...వ వంతు జాయంటు హక్కులను పూర్తిగా వదలుకొని, బందుకు నిదర్శనముగా వ్రాయించి యిచ్చిన స్థిరాస్తి హక్కు విడుదల దస్తావేజు.`,{align:'center'});
		// 					pdfDocs.fontSize('13').text(`ఈ ${subDesc} ${yyyy} వ సంవత్సరం ${mm} నెల ${dd} వ తేదీన వ్రాయబడింది.`,{align:'center'});
		// 					break;
		// 				case "09":
		// 					// pdfDocs.fontSize('18').text(`${subDesc}`,40,y,{align:'center',underline:true});
		// 					pdfDocs.fontSize('13').text(`ఈ ${subDesc} ${yyyy} వ సంవత్సరం ${mm} నెల ${dd} వ తేదీన వ్రాయబడింది.`,{align:'center'});
		// 					break;					
		// 				default:
		// 					break;
		// 			}
		// 			if(DocNum == "07"){
		// 				pdfDocs.fontSize('13').text(`3. వ్రాసుకున్నవారులు`,{align:'left'});
		// 				pdfDocs.fontSize('13').text(`   1 వ పార్టీ వారు ఆస్థి ని అద్దెకు ఇచ్చినవారు`,{align:'left',underline:true});
		// 			}else if(DocNum =="06"){
		// 				pdfDocs.fontSize('13').text(`రూ ${data.amount} రూపాయలు విలువగల స్థిరాస్తి ${subDesc}.`,{align:'center'});
		// 				pdfDocs.fontSize('13').text(`ఈ ${subDesc} ${yyyy} వ సంవత్సరం ${mm} నెల ${dd} వ తేదీన వ్రాయబడింది.`,{align:'center'});
		// 				pdfDocs.fontSize('13').text(`వ్రాసుకున్నవారులు`,{align:'left',underline:true});
		// 				pdfDocs.fontSize('13').text(`   1 వ పార్టీ :`,{align:'left',underline:true});
		// 			}else if(DocNum =="04"){
		// 				pdfDocs.fontSize('13').text(`రూ ${data.amount} రూపాయలు విలువగల స్థిరాస్తి ${subDesc}.`,{align:'center'});
		// 				pdfDocs.fontSize('13').text(`${yyyy} వ సంవత్సరం ${mm} నెల ${dd} వ తేదీ.`,{align:'center'});
		// 				pdfDocs.fontSize('13').text(`వ్రాసుకున్నవారలు`,{align:'left',underline:true});
		// 				// pdfDocs.fontSize('13').text(`వ్రాసుకున్నవారులు`,{align:'left'});
		// 				// pdfDocs.fontSize('13').text(`(1) ......., ....జిల్లా, (ఆధార్ నెం..............) (PAN :.....................)`,{align:'center'});
		// 				// pdfDocs.fontSize('13').text(`(2) ....., .....జిల్లా, (ఆధార్ నెం..............) (PAN :.....................)`,{align:'center'});
		// 				// pdfDocs.addPage()
		// 			}
		// 			else{
		// 				pdfDocs.fontSize('15').text(`వ్రాయించిఇచ్చువారు :`,{align:'left',underline:true});
		// 			}
		// 			if(DocNum != "04"){
		// 				if(data.executent && data.executent.length >0){
		// 					for(let i of data.executent){
		// 						let add = i.address.split("\n").join("")
		// 						add= add.split(" ").join("");
		// 						pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. ${toTitleCase(i.name)}, ${i.relationType}.${toTitleCase(i.relationName)}, వయస్సు ${i.age} సంవత్సరాలు, ప్రస్తుతం ${toTitleCase(add)} లో నివాసము`,{align:'justify',lineGap:0});
		// 						pdfDocs.moveDown();
		// 						if (MinDocNum === "12" || MinDocNum === "13") {
		// 							if (MinDocNum === "12"){
		// 							pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “బదిలీ చేయువారు “ ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{ align: 'justify', lineGap: 0 });
		// 						} else if (MinDocNum === "13") {
		// 							pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “బదిలీ చేయువారు “ ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{ align: 'justify', lineGap: 0 })}
		// 						} else {
		// 						pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “విక్రయదారులుగా “ ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{ align: 'justify', lineGap: 0 })
		// 						}
		// 						pdfDocs.moveDown();
		// 					}
		// 				}else{
		// 					pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. .......,S/O. .........,వయస్సు ........ సంవత్సరాలు,ప్రస్తుతం......... లో నివాసము`,{align:'justify',lineGap:0});
		// 					pdfDocs.moveDown();
		// 					if (MinDocNum === "12" || MinDocNum === "13") {
		// 						if (MinDocNum === "12"){
		// 						pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “బదిలీ చేయువారు “ ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{ align: 'justify', lineGap: 0 });
		// 					} else if (MinDocNum === "13") {
		// 						pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “బదిలీ చేయువారు “ ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{ align: 'justify', lineGap: 0 })}
		// 					} else {
		// 					pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “విక్రయదారులుగా “ ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{ align: 'justify', lineGap: 0 })
		// 					}	
		// 				}
		// 			}
						
		// 			switch (DocNum) {
		// 				case "01":
		// 					// pdfDocs.fontSize('13').text(`(ఈ భాగమును "అమ్మినవారుగా" ఈ దస్తావేజు నందు పరిగణించవలెను.)`,{align:'center',lineGap:0});
		// 					pdfDocs.fontSize('15').text(`మరియు`,{align:'center',underline:true});
		// 					pdfDocs.moveDown();
		// 					break;
		// 				case "02":
		// 					pdfDocs.fontSize('13').text(`(ఈ భాగమును "ఋణ దాత" గా  పరిగణించవలెను.)`,{align:'center',lineGap:0});
		// 					pdfDocs.fontSize('15').text(`మరియు`,{align:'center',underline:true});
		// 					pdfDocs.moveDown();
		// 					break;
		// 				case "03":
		// 					pdfDocs.fontSize('13').text(`(పై వారిని ఇక నుండి దఖలు చేయువారు అని పిలవబడెదరు.)`,{align:'center',lineGap:0});
		// 					pdfDocs.fontSize('15').text(`మరియు`,{align:'center',underline:true});
		// 					pdfDocs.moveDown();
		// 				default:
		// 					break;
		// 			}
		// 			if(DocNum == "07"){
		// 				pdfDocs.fontSize('13').text(`2 వ పార్టీ వారు ఆస్థి ని అద్దెకు ఇచ్చినవారు`,{align:'left',underline:true});
		// 			}else if(DocNum =="06"){
		// 				pdfDocs.fontSize('13').text(`   2 వ పార్టీ :`,{align:'left',underline:true});
		// 			}
		// 			else{
		// 				DocNum != "04" && pdfDocs.fontSize('13').text(`వ్రాయించుకొన్నవారు :`,{align:'left',underline:true});
		// 			}
		// 			// if(DocNum != "04"){
		// 				if(data.claimant && data.claimant.length >0){
		// 					for(let i of data.claimant){
		// 						let add = i.address.split("\n").join("")
		// 						add= add.split(" ").join("");
		// 						DocNum !="04" && pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. ${toTitleCase(i.name)}, ${i.relationType}.${toTitleCase(i.relationName)}, వయస్సు ${i.age} సంవత్సరాలు, ప్రస్తుతం ${toTitleCase(add)} లో నివాసము`,{align:'justify',lineGap:0});
		// 						if (MinDocNum === "12" || MinDocNum === "13") {
		// 							if (MinDocNum === "12"){
		// 							pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “బదిలీ పొందువారు “ ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{ align: 'justify', lineGap: 0 });
		// 						} else if (MinDocNum === "13") {
		// 							pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “బదిలీ పొందువారు “ ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{ align: 'justify', lineGap: 0 })}
		// 						} else {
		// 						pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “కొనుగోలుదారులుగా“ ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{ align: 'justify', lineGap: 0 })
		// 						}
		// 						// DocNum === "04" && pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. ${toTitleCase(i.name)}, ${i.relationType}.${toTitleCase(i.relationName)}, వయస్సు ${i.age} సంవత్సరాలు, ప్రస్తుతం ${toTitleCase(add)}  నివాసము`,{align:'justify',lineGap:0});
		// 						pdfDocs.moveDown();
		// 					}
		// 				}else{
		// 					pdfDocs.fontSize('13').text(`శ్రీ/శ్రీమతి. .......,S/O. .........,వయస్సు ........ సంవత్సరాలు,ప్రస్తుతం......... లో నివాసము`,{align:'justify',lineGap:0});
		// 					pdfDocs.moveDown();
		// 					if (MinDocNum === "12" || MinDocNum === "13") {
		// 						if (MinDocNum === "12"){
		// 						pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “బదిలీ పొందువారు “ ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{ align: 'justify', lineGap: 0 });
		// 					} else if (MinDocNum === "13") {
		// 						pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “బదిలీ పొందువారు “ ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{ align: 'justify', lineGap: 0 })}
		// 					} else {
		// 					pdfDocs.fontSize('13').text(`(అనువారు, వారి వారసులు, స్తానీయులు, రెప్రెసెంటేటివ్ లు, ఏజెంట్లు మరియు అసైనీలు “కొనుగోలుదారులుగా“ ఈ దస్తావేజునందు పరిగణించబడుదురు).`,{ align: 'justify', lineGap: 0 })
		// 					}
		// 				}
		// 			// }
	
	
		// 			//
		// 			switch (DocNum) {
		// 				case "01":
		// 					// pdfDocs.fontSize('13').text(`(ఈ భాగమును "కొనుగోలుదారుగా" ఈ దస్తావేజు నందు పరిగణించవలెను.)`,{align:'center',lineGap:0});
		// 					break;
		// 				case "02":
		// 					pdfDocs.fontSize('13').text(`(ఈ భాగమును "ఋణ గ్రహీత" గా పరిగణించవలెను.)`,{align:'center',lineGap:0});
		// 					pdfDocs.fontSize('14').text(`స్వభావము :`,{align:'left',underline:true});
		// 					break;
		// 				case "03":
		// 					pdfDocs.fontSize('13').text(`(పై వారిని ఇక నుండి దఖలు పొందువారు అని పిలవబడెదరు.)`,{align:'center',lineGap:0});
		// 				default:
		// 					break;
		// 			}
	
		// 			// let linkedText ="";
		// 			// if(data.property && data.property.length >0){
		// 			// 	let linkedFlag=false;
		// 			// 	for(let i of data.property){
		// 			// 		if(i?.LinkedDocDetails && i?.LinkedDocDetails?.length > 0){
		// 			// 			for(let j in i?.LinkedDocDetails){
		// 			// 				let linkDocNo = i.LinkedDocDetails[j].linkDocNo ? i.LinkedDocDetails[j].linkDocNo : "............"
		// 			// 				let year = i.LinkedDocDetails[j].regYear ? i.LinkedDocDetails[j].regYear : "............"
		// 			// 				let bookNo = i.LinkedDocDetails[j].bookNo ? i.LinkedDocDetails[j].bookNo : "............"
		// 			// 				linkedText =`మా పేరున ${linkDocNo}/${year} దస్తావేజు ${toTitleCase(i.sroOffice)} సబ్ రిజిస్ట్రార్ కార్యాలయములో ${bookNo} వ పుస్తకము లో రిజిస్టర్ కాబడిన రీత్యా మాకు సంక్రమించబడిన ఈ దిగువ షెడ్యూలు దాఖలా స్థిరాస్తిని మా స్వాధీనములో సర్వ సంపూర్ణ  నిర్వివాద  యాజమాన్య హక్కు భుక్తములతో అనుభవించుచున్నాము`
		// 			// 				//`virtue of registered document bearing the number ${linkDocNo} of ${year} of book ${bookNo}`
		// 			// 			}
		// 			// 		}else{
		// 			// 			linkedFlag = true;
		// 			// 		}
		// 			// 		DocNum === "04" && pdfDocs.addPage();
		// 			// 		pdfDocs.fontSize('13').text(`${linkedText}`,{align:'justify',lineGap:0});
		// 			// 	}
		// 			// 	if(linkedFlag === true){
		// 			// 		linkedText = `దిగువ షెడ్యూలు దాఖలా ఆస్తి మాకు పూర్వార్జితపు ఆస్థి గా సంక్రమించి దాన వినిమయ విక్రయాధికార సర్వ సంపూర్ణ హక్కు భుక్తములతో అనుభవించుచున్నాము.`
		// 			// 		pdfDocs.fontSize('13').text(`${linkedText}`,{align:'justify',lineGap:0});
		// 			// 	}
		// 			// }else{
		// 			// 	DocNum === "04" && pdfDocs.addPage();
		// 			// 	linkedText = `దిగువ షెడ్యూలు దాఖలా ఆస్తి మాకు పూర్వార్జితపు ఆస్థి గా సంక్రమించి దాన వినిమయ విక్రయాధికార సర్వ సంపూర్ణ హక్కు భుక్తములతో అనుభవించుచున్నాము.`
		// 			// 	pdfDocs.fontSize('13').text(`${linkedText}`,{align:'justify',lineGap:0});
		// 			// 	pdfDocs.fontSize('13').text(`.......జిల్లా, ....... మండలం, ......గ్రామంలోని సర్వే నెంబర్...... నందలి ఎకరములు .... విస్తీర్ణం గల., దిగువ షెడ్యూలు దాఖలా ఆస్తి అమ్మకందారుకు పూర్వార్జితపు ఆస్థి గా సంక్రమించి దాన వినిమయ విక్రయాధికార సర్వ సంపూర్ణ హక్కు భుక్తములతో అనుభవించుచున్నారు.`,{align:'justify',lineGap:0});
		// 			// }
		// 			if(data.covanants?.acquireCovenents && data.covanants?.acquireCovenents.length >0){
		// 				let aqCovanents=[]
		// 				pdfDocs.fontSize('13').text('How the Property is Aquired',{align:'justify'})
		// 				let sNo=1;
		// 				data?.covanants.acquireCovenents.map((aqcv)=>{
		// 					let val = sNo ===1 ? `${sNo}. ${aqcv.value}` : `\n${sNo}. ${aqcv.value}`
		// 					aqCovanents = [...aqCovanents,val];
		// 					sNo =sNo+1;
		// 				})
		// 				for(let i of aqCovanents){
		// 					pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
		// 				}
		// 			}
		// 			if(DocNum =="01"){
		// 				if(MinDocNum === "04"){
		// 					pdfDocs.moveDown();
		// 					pdfDocs.fontSize('13').text(`ఈ క్రింది షెడ్యూలులో వివరించిన ఆస్థి ఆంధ్ర ప్రదేశ్ హౌసింగ్ బోర్డు (ప్లాట్ల కేటాయింపు) నియమాలు 1977 మరియు సవరణలు (మద్యతరగతి ఆదాయ వర్గం) అనుసరించి అభివృద్ధి పరచబడినది. షెడ్యూలు ఆస్థిని  మధ్యతరగతి ఆదాయ వర్గం సెల్ఫ్ ఫైనాన్స్ స్కీమ్ క్రింద కొనుగోలుదారునికి విక్రయించబడినది. \n`,{ align: 'justify', lineGap: 0 })
		// 					pdfDocs.moveDown();
		// 					pdfDocs.fontSize('13').text(`షెడ్యూలు ఆస్థికి ఆంధ్ర ప్రదేశ్ హౌసింగ్ బోర్డు వైస్ ఛైర్మన్ మరియు హౌసింగ్ కమీషనర్ వారిచే నిర్ణయించబడిన ధర రూ ${data.amount}/- కొనుగోలుదారు చెల్లించినందున అందినట్లుగా ఇందుమూలముగా ధృవీకరించడమైనది.`,{ align: 'justify', lineGap: 0 })
		// 					pdfDocs.moveDown();
		// 				} else if(MinDocNum === "06"){
		// 					pdfDocs.moveDown();
		// 					pdfDocs.fontSize('13').text(`సొసైటీ సదరు ఆస్థిని అభివృద్ధి పరచి అందులో భాగమైన షెడ్యూల్ ఆస్థిని సొసైటీ తాలూకు బై లాస్  ననుసరించి పై తెలిపిన GL నెంబరు గల  మెంబరుకు విక్రయించదలిచారు. కొనుగోలుదారు అయిన మెంబరు షెడ్యూల్ ఆస్థిని రూపాయలు  ${data.amount}/- కు కొనుగోలు చేయడానికి ప్రతిపాదించారు. సొసైటీ కొనుగోలుదారుల ప్రతిపాదన ప్రస్తుత మార్కెట్ విలువకు దగ్గరగా వున్నందున సముచితంగా భావించి షెడ్యూల్ ఆస్థిని విక్రయించడానికి అంగీకరించారు.\n`,{align:'left',lineGap:0});
		// 				} else if(MinDocNum === "07"){
		// 					pdfDocs.moveDown();
		// 					pdfDocs.fontSize('13').text(`సొసైటీ సదరు ఆస్థిని అభివృద్ధి పరచి అందులో భాగమైన షెడ్యూల్ ఆస్థిని సొసైటీ తాలూకు బై లాస్  ననుసరించి తమ ఆర్థిక అవసరాలు తీర్చుకొనే నిమిత్తం షెడ్యూల్ ఆస్థిని విక్రయించదలిచారని తెలుసుకొని కొనుగోలుదారులు  షెడ్యూల్ ఆస్థిని రూపాయలు ${data.amount}/- కు కొనుగోలు చేయడానికి ప్రతిపాదించారు. విక్రయదారులు కొనుగోలుదారుల ప్రతిపాదన ప్రస్తుత మార్కెట్ విలువకు దగ్గరగా వున్నందున సముచితంగా భావించి షెడ్యూల్ ఆస్థిని విక్రయించడానికి అంగీకరించారు.\n`,{align:'left',lineGap:0});
		// 				} else if(MinDocNum === "08"){
		// 					pdfDocs.moveDown();
		// 					pdfDocs.fontSize('13').text(`విక్రయదారులు తమ ఆర్థిక అవసరాలు తీర్చుకొనే నిమిత్తం షెడ్యూల్ ఆస్థిని విక్రయించదలిచారని తెలుసుకొని కొనుగోలుదారులు  షెడ్యూల్ ఆస్థిని రూపాయలు  ${data.amount} /- కు కొనుగోలు చేయడానికి ప్రతిపాదించారు. విక్రయదారులు కొనుగోలుదారుల ప్రతిపాదన ప్రస్తుత మార్కెట్ విలువకు దగ్గరగా వున్నందున సముచితంగా భావించి షెడ్యూల్ ఆస్థిని విక్రయించడానికి అంగీకరించారు.\n`,{align:'left',lineGap:0})
		// 				} else {
		// 					pdfDocs.fontSize('13').text(`విక్రయదారులు తమ ఆర్థిక అవసరాలు తీర్చుకొనే నిమిత్తం షెడ్యూల్ ఆస్థిని విక్రయించదలిచారని తెలుసుకొని కొనుగోలుదారులు  షెడ్యూల్ ఆస్థిని రూపాయలు  ${data.amount}/- కు కొనుగోలు చేయడానికి ప్రతిపాదించారు. విక్రయదారులు కొనుగోలుదారుల ప్రతిపాదన ప్రస్తుత మార్కెట్ విలువకు దగ్గరగా వున్నందున సముచితంగా భావించి షెడ్యూల్ ఆస్థిని విక్రయించడానికి అంగీకరించారు.`,{ align: 'justify', lineGap: 0 })
		// 				}
		// 				pdfDocs.fontSize('15').text(`ఈ క్రింది విషయములను ఈ విక్రయ దస్తావేజు ధ్రువపరుచుచున్నది :`,{align:'left',underline:true,lineGap:0});
		// 				// pdfDocs.fontSize('18').text(`క్రయప్రతిఫల అంగీకారం :`,{align:'left',underline:true});
		// 				// pdfDocs.fontSize('13').text(`1. క్రయ ప్రతిఫలం మొత్తం ${data.amount} అమ్మకందారునకు కొనుగోలుదారు ఈ దిగువ చూపిన ప్రకారం చెల్లించినారు`,{align:'justify',lineGap:0});
		// 				if (MinDocNum === "02" || MinDocNum === "03") {
		// 					if (MinDocNum === "02"){
		// 					pdfDocs.fontSize('13').text(`పైన చెప్పబడిన ప్రతిపాదనను పరిగణనలోకి తీసుకుని కొనుగోలుదారులు విక్రయదారులకు పూర్తి క్రయ ప్రతిఫలం రూపాయలు ${data.amount} లో నుండి కొంత అడ్వాన్సు మొత్తమును క్రింది విదంగా అందజేసియున్నారు`,{ align: 'justify', lineGap: 0 });
		// 				} else if (MinDocNum === "03") {
		// 					pdfDocs.fontSize('13').text(`పైన చెప్పబడిన ప్రతిపాదనను పరిగణనలోకి తీసుకుని కొనుగోలుదారులు విక్రయదారులకు పూర్తి క్రయ ప్రతిఫలం రూపాయలు ${data.amount} లో నుండి కొంత అడ్వాన్సు మొత్తమును క్రింది విదంగా అందజేసియున్నారు`,{ align: 'justify', lineGap: 0 })} 		
		// 				} else {
		// 					pdfDocs.fontSize('13').text(`పైన చెప్పబడిన ప్రతిపాదనను పరిగణనలోకి తీసుకొని కొనుగోలుదారులు విక్రయాదారులకు పూర్తి క్రయ ప్రతిఫలము రూపాయలు ${data.amount} ఈ క్రింది విధముగా అందజేసియున్నారు:`,{ align: 'justify', lineGap: 0 })
		// 				}
		// 				if(data?.payment && data?.payment.length >0){
								
		// 					let payNo = 0;
		// 					for(let i in data?.payment){
		// 						let payinword = await NumToWord(data?.payment[i]?.payAmount);
		// 						let payDate = new Date(data?.payment[i]?.dateOfPayment).toLocaleDateString();
		// 						payNo = payNo +1;
		// 						if(payNo ==1){
									
		// 							switch (data.payment[i].paymentMode) {
		// 								case "CASH":
		// 									pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} Dated ${payDate}.`,{align:"left"})
		// 									break;
		// 								case "UPI":
		// 									pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} ,transactionNo:${data.payment[i].transactionNo}, Dated ${payDate}.`,{align:"right",marginLeft:'30'})
		// 									break;
		// 								case "CHEQUE":
		// 									pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode},checkNo ${data.payment[i].checkNo},branch:${data.payment[i].bankName},${data.payment[i].branchName} Dated ${payDate}.`)
		// 									break;
		// 								case "NEFT/RTGS":
		// 									pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode},branch:${data.payment[i].bankName},utrNo:${data.payment[i].utrNumber} Dated ${payDate}.`)
		// 									break;
		// 								default:
		// 									break;
		// 							}
		// 							// pdfDocs.fontSize('13').text(`${payNo}. Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} Dated ${payDate}.`)
		// 						}else{
		// 							// pdfDocs.fontSize('13').text(`${payNo}. Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} Dated ${payDate}.`)
		// 							switch (data.payment[i].paymentMode) {
		// 								case "CASH":
		// 									pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} Dated ${payDate}.`)
		// 									break;
		// 								case "UPI":
		// 									pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode} ,transactionNo:${data.payment[i].transactionNo}, Dated ${payDate}.`)
		// 									break;
		// 								case "CHEQUE":
		// 									pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode},checkNo ${data.payment[i].checkNo},branch:${data.payment[i].bankName},${data.payment[i].branchName} Dated ${payDate}.`)
		// 									break;
		// 								case "NEFT/RTGS":
		// 									pdfDocs.fontSize('13').text(`${payNo}). Rs ${data.payment[i].payAmount}/- (${payinword}) paid by ${data.payment[i].paymentMode},branch:${data.payment[i].bankName},utrNo:${data.payment[i].utrNumber} Dated ${payDate}.`)
		// 									break;
		// 								default:
		// 									break;
		// 							}
		// 						}
		// 					}
		// 					pdfDocs.fontSize('13').text(`మరియు ఈ చెల్లింపు ను అమ్మినవారు పుచ్చుకొన్నట్లు అంగీకరించారు`)
							
		// 				};
		// 				// pdfDocs.fontSize('18').text(`యాజమాన్య హక్కు బదలాయింపు :`,{align:'left',underline:true});
						
		// 				// pdfDocs.fontSize('13').text(`2. ఈ దిగువ షెడ్యూలు దాఖలా ఆస్థి పై అమ్మినవారు సర్వ సంపూర్ణ దాన వినిమయ విక్రయాదికారములు కలిగి యున్నారనియు, అట్టి ఆస్థి పై ఎట్టి ఋణములు కాని అన్యాక్రాంతములు   కాని చేసి యుండలేదని హామీ యిచ్చుచున్నారు. మరియు సదరు ఆస్థి పై ఈ నాటి వరకు చెల్లించవలసిన శిస్తు వగైరాలు అమ్మినవారు చెల్లించి వున్నారనియు ఎట్టి పన్ను బకాయిలు లేవనియు, యిప్పటి నుండి కొనుగోలుదారులు ఈ ఆస్థి పై సర్కారు పన్నులు అన్నియు చెల్లించుకోవలసి యున్నది.`,{align:'left'})
		// 				// pdfDocs.fontSize(18).text(`ఆస్తిని స్వాధీనపరుచుట :`,{align:'left',underline:true})
		// 				// pdfDocs.fontSize(13).text(`3. ఈ విక్రయ దస్తావేజు ద్వారా అమ్మినవారు ఈ దిగువ షెడ్యూలు దాఖలా నిర్వివాద నిష్పేచి ఆస్థి పై తనకున్న దాన వినిమయ విక్రయాధికార సర్వ సంపూర్ణ హక్కులను కొనుగోలు దారునకు చెందచేసి ఈ రోజున ఆస్థిని స్వాధీన పరచడమైనది. భవిష్యత్తులో సదరు ఆస్థి పై కొనుగోలు చేసినవారు సర్వ సంపూర్ణ హక్కులతో అనుభవించుటకు అమ్మినవారు గాని వారి వారసులు గాని ఎటువంటి ఆక్షేపణలు గాని ఆటంకములు గాని చేయరు అని తెలియచేయడమైనది.`,{align:'left'});
		// 				// pdfDocs.fontSize(18).text(`ఆస్తి బదలాయింపునకు హామీ యిచ్చుట :`,{align:'left',underline:true});
		// 				// pdfDocs.fontSize(13).text(`4. ఈ దిగువ షెడ్యూలు దాఖలా ఆస్థిని అమ్మినవారు గానీ, వారి యొక్క వారసులు గాని, ప్రతినిధులు గాని ఏ విధమైన అన్యాక్రాంతములను చేసియుండలేదనియు, అట్టి తప్పిదము ఏదైనా సంభవించిన యెడల అమ్మినవారే అందుకు పూర్తి భాద్యత వహించగలరు అని హామీ ఇవ్వడమైనది. మరియు భవిష్యత్తులో ఈ షెడ్యూలు దాఖలా ఆస్థి పై ఎట్టి దావా తగాదాలు ఎవరివల్లనైననూ సంభవించే యడల అట్టి వివాదములను తమ స్వంత ఖర్చులతో పూర్తిగా పరిష్కరించి కొనుగోలుదారునకు నిరాటంకముగా చెంద చేయుదురని ఇందుమూలముగా హామీ ఇవ్వడమైనది.`,{align:'left'});
		// 				// pdfDocs.fontSize(18).text(`యాజమాన్య పేరు మార్పుదల :`,{align:'left',underline:true});
		// 				// pdfDocs.fontSize(13).text(`5. ఈ దిగువ షెడ్యూలు దాఖలా ఆస్థిని సంబంధిత కార్యాలయాలలో కొనుగోలుదారు తన పేరిట మార్పుదల చేసుకొనుటకు అవసరమైన అన్ని సంతకములు, సహకారములు అమ్మినవారు చేయగలరు అని తెలియచేయడమైనది.`,{align:'left'});
		// 				if (MinDocNum === "02" || MinDocNum === "03") {
		// 					if (MinDocNum === "02"){
		// 					pdfDocs.fontSize('13').text(`          విక్రయదారులు పై విదంగా చెల్లించబడిన అడ్వాన్సు మొత్తము పూర్తిగా అందినదని ధృవీకరించుచున్నారు. మరియు మిగిలిన క్రయ ప్రతిఫలమును  కొనుగోలుదారు  పైన తెలిపిన గడువు లోపల విక్రయదారు కు చెల్లించవలసినది గా ఒప్పందము.  ఒప్పందము ప్రకారము కొనుగోలు దారు పూర్తి క్రయ ప్రతిఫలమును విక్రయాదారు కు చెల్లించిన వెంటనే షెడ్యూల్ ఆస్థిని కొనుగోలు దారుల పేరున గాని వారు కోరినవారి పేరున గాని కొనుగోలుదారు ఖర్చులతో క్రయ దస్తావేజు రిజిస్టర్ చేసి ఇచ్చుటకు ఇందుమూలంగా విక్రయదారు అంగీకరించుచూ షెడ్యూల్‌లో పేర్కొన్న ఆస్థిని ఈ రోజున కొనుగోలుదారుకు స్వాధీనము చేయడ మైనది.`,{ align: 'justify', lineGap: 0 });
		// 				} else if (MinDocNum === "03") {
		// 					pdfDocs.fontSize('13').text(`          విక్రయదారులు పై విదంగా చెల్లించబడిన అడ్వాన్సు మొత్తము పూర్తిగా అందినదని ధృవీకరించుచున్నారు. మరియు మిగిలిన క్రయ ప్రతిఫలమును  కొనుగోలుదారు  పైన తెలిపిన గడువు లోపల విక్రయదారు కు చెల్లించవలసినది గా ఒప్పందము.  ఒప్పందము ప్రకారము కొనుగోలు దారు పూర్తి క్రయ ప్రతిఫలమును విక్రయాదారు కు చెల్లించిన వెంటనే షెడ్యూల్ ఆస్థిని కొనుగోలు దారుల పేరున గాని వారు కోరినవారి పేరున గాని కొనుగోలుదారు ఖర్చులతో క్రయ దస్తావేజు రిజిస్టర్ చేసి ఇచ్చుటకు ఇందుమూలంగా విక్రయదారు అంగీకరించుచూ షెడ్యూల్‌లో పేర్కొన్న ఆస్థిని విక్రయాదారులు తమ స్వాధీనము లోనే ఉంచుకోవడమైనది.`,{ align: 'justify', lineGap: 0 })}
		// 				} else {
		// 				pdfDocs.fontSize('13').text(`           విక్రయదారులు పై విధంగా చెల్లించబడిన క్రయ ప్రతిఫలం పూర్తిగా అందినదని ధృవీకరించుచూ షెడ్యూల్ ఆస్థి పై వారికి గల హక్కులు, టైటిల్ మరియు ఆసక్తి, క్లెయిమ్ మరియు డిమాండ్‌ను అన్నింటిని యీజ్ మెంట్ హక్కులతో ఈ విక్రయ దస్తావేజు ద్వారా  బదిలీ చేయడం మరియు కేటాయించడం జరిగింది. షెడ్యూల్‌లో పేర్కొన్న ఆస్థిని ఈ రోజున కొనుగోలుదారులకు స్వాధీనము చేయడ మైనది. ఇంతటి నుండి కొనుగోలుదారులు  షెడ్యూల్ ఆస్థిని సుఖాన స్వేఛ్చగా  సంపూర్ణ హక్కులతో అనుభవించుటకు నిర్ణయము.\n`,{ align: 'left', lineGap: 0 })
		// 				}
		// 				if(covenantArr && covenantArr.length >0){
		// 					for(let i of covenantArr){
		// 						pdfDocs.fontSize(13).text(i,{align:'left'})
		// 					}
		// 				}
		// 				pdfDocs.fontSize(16).text(`రిజిస్ట్రేషన్ చట్టము, 1908 నందలి సెక్షన్ 22-B ననుసరించి చేయు ప్రకటన :\n`,{align:'center',underline:true});
		// 				pdfDocs.fontSize(13).text(`షెడ్యూలు దాఖలా ఆస్తిని గాని అందలి కొంత భాగమును గాని ఈ దస్తావేజునందలి బదిలీ దారులు స్వయంగా గాని రెప్రెసెంటేటివ్ లు, అస్సయినీలు, ఏజెంట్ల ద్వారా గాని మరి ఏ ఇతరలకు రిజిస్టరైన దస్తావేజు ద్వారా  బదలాయించలేదని ఇందు మూలము గా ప్రకటించడమైనది.  ఈ ఆస్తి ఏ దస్తావేజు ద్వారా బదిలీ దారులకు సంక్రమించి యున్నదో ఆ దస్తావేజు ఏ న్యాయస్థానము యొక్క ఉత్తర్వుల ద్వారా రద్దు చేయబడలేదని ప్రకటించడమైనది. ఈ ప్రకటన అవాస్తవమని నిరూపించబడిన యెడల చట్ట ప్రకారము మాపై తీసుకొనబడు చర్యలకు బద్దులమై ఉండుటయే కాక బదిలీదారులకు వాటిల్లిన నష్టమును భర్తీ చేయగలవారమని ప్రకటించడమైనది.`,{align:'left'});
		// 				pdfDocs.moveDown();
		// 				pdfDocs.fontSize(13).text(`షెడ్యూలు దాఖలా ఆస్తి ప్రభుత్వ ఆస్తి గాని అస్సయిండ్ ఆస్తి గాని వక్ఫ్ బోర్డ్ కు చెందిన ఆస్తి గాని దేవాదాయ శాఖకు చెందిన ఆస్తి గాని కాదని ఇందు మూలము గా ప్రకటించడమైనది.`,{align:'left'});
		// 				// pdfDocs.addPage();
		// 			}else if(DocNum =="02"){
		// 				let payment ="..........";
		// 				let interest ="........."
		// 				if(data.payment && data.payment.length >0){
		// 					payment = data.payment[0].payAmount;
		// 					interest = data.payment[0].rateOfInterest;
		// 				}
		// 				// pdfDocs.fontSize('13').text(`స్వభావము వంశ పారంపర్వము మరియు లింకు డాక్యూమెంటు ద్వారా వచ్చినది.`,{align:'justify',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`1. యిట్టిస్థితి లో మా కుటుంబ అవసర ఖర్చుల నిమిత్తం మాకు సొమ్ము అవసరమై, మా తాలూకు  ఈ దిగువ  షెడ్యూలు దాఖలా స్థిరాస్థి ని మీకు అస్వాధీన తనఖా గా ఉంచి, మీ వద్ద అప్పు పుచ్చుకోనుటకు ఏర్పాటు చేసుకొన్న మొత్తం Rs ${payment} రూపాయలు మాత్రం.`,{align:'justify',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`2. సదరు తనఖా ప్రతిఫలం Rs ${payment} రూపాయలు ఈ అస్వాధీన తనఖా దస్తావేజు వ్రాతకాలమందు మీరు మాకు నగదు గా ఇచ్చినందున, మీ వలన మాకు పూర్తిగా ముట్టినవి.`,{align:'justify',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`3. గనుక యితటినుంచి ఈ తనఖా ప్రతిఫలమునకు నెల1కి నూటికి Rs ${interest} చొప్పున కాగల వడ్డీతో మీ సొమ్ము ముట్టే వరకు అయ్యే అసలు ఫాయిదాల బాకీ ఎప్పుడు అడిగితే అప్పుడు మీకు గానీ , మీ వలన యీ తనఖా దస్తావేజు ట్రాన్స్ ఫర్  పొందిన వారికి గాని పూర్తిగా చెల్లించి,యీ దస్తావేజు ఫీఠీన చెల్లు వ్రాయించుకొని, యీ దస్తావేజు వగైరా యావత్తు రికార్డును మీ నుండి మేము వాపసు తీసుకోగలము.`,{align:'justify',lineGap:1});
		// 				pdfDocs.fontSize('13').text(`4. యీ తనఖా బాకీ అసలు ఫాయిదాల క్రింద మీకు మేము ఇచ్చే వసూళ్లు ఎప్పటికప్పుడు యిoదు ఫీఠీన చెల్లు వ్రాయించగలముగాని,అట్లు చెల్లు లేని వసూళ్లు గాని  ప్రత్యేక రశీదులు గాని, వేరే మూజుమాని ఖరారులుకాని కలవని మిమ్ము మేము ముదరాకోరగల వారము కాము.`,{align:'justify',lineGap:1});
		// 				pdfDocs.fontSize('13').text(`5. యీ తనఖా బాకీ అసలు ఫాయిదాలు తీర్మానించే వరకు, ఈ దిగువ షెడ్యూలు దాఖలా స్థిరాస్థి ని మీకు అస్వాధీన తనఖా గా ఉంచి షెడ్యూలు ఆస్తిని మా స్వాధీనములోనే వుంచుకోవడమైనది.యీ తనఖా బాకీ పూర్తిగా తీర్మానించే వరకు షెడ్యూలు ఆస్తి విలువకు భంగకరమైన యెట్టి పనులు చేయగలవారము గాము.`,{align:'justify',lineGap:1});
		// 				pdfDocs.fontSize('13').text(`6. యీ తనఖా బాకీ అసలు ఫాయిదాలు ఈ దిగువ షెడ్యూలు ఆస్తి వల్లనూ. అందు పై లభించు ఆదాయము వల్లనూ, ఇంకా మాకు వుండుకున్న యతుర స్థిర చరాస్థి వల్లనూ మేము స్వయముగా తీర్మానించగలము. యీ తనఖా బాకీ అసలు ఫాయిదాలు పూర్తిగా తీర్మానించకుండా, మీ ఎరుక సమ్మతులు లేకుండా షెడ్యూలు ఆస్తిని  మేము యతురత్ర యెట్టి అన్యాక్రాంతములు చేయగలవారము కాదు.`,{align:'justify',lineGap:1});
		// 				if(covenantArr && covenantArr.length >0){
		// 					for(let i of covenantArr){
		// 						pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
		// 					}
		// 				}
		// 				pdfDocs.addPage();
		// 				// pdfDocs.fontSize('13').text(`షెడ్యూలు ఆస్తిని లోగడ మేము అన్యులెవ్వరికి యెట్టి అన్యాక్రాంతములు చేసివుండలేదనిన్నీ, షెడ్యూలు ఆస్థి పై ఏ విధమైన కోర్టు లిటిగేషన్లు పెండింగు లో లేవనిన్ని,షెడ్యూలు ఆస్థి పై కోర్టు లో జప్తులు, ఇంజన్క్షన్లు, జాయింటు భా
		// 				// గలబ్ధ తగాయిదాలు, ఇతుర యెగ్రిమెంట్లు, తదితర శెక్యూరిటీలు, మొదలగు యెట్టి హక్కులు, భాద్యతలు ఎవరికీ ఏమిలేవనిన్నీ, మా స్వంతమై , మాకు మాత్రమే సమస్త సంపూర్ణ హక్కు భుక్తములుగల నిర్వివాదమైన ఆస్తియనిన్నీ మిమ్ము మేము పూర్తిగా నమ్మించి, షెడ్యూలు ఆస్తిని మీకు అస్వాధీన తనఖా గా ఉంచి,అందుకు నిదర్శనుముగా మీపేరా ఈ అస్వాధీన తనఖా దస్తావేజును వ్రాయించి ఇవ్వడమైనది. షెడ్యూలు ఆస్తికి సంభందించిన ....... దస్తావేజు వగైరా రికార్డును యిoదులో మీకు యివ్వడమైనది.`,{align:'justify',lineGap:0});
		// 			}else if(DocNum =="03"){
		// 				pdfDocs.fontSize('15').text(`ఈ క్రింది విషయములను ఈ దఖలు దస్తావేజు ధ్రువపరుచుచున్నది :`,{align:'left',lineGap:0,underline:true});
	
		// 				if(data.payment && data.payment.length >0){
		// 					for(let i of data.payment){
		// 						let relation = i.relationType === "W/O" ? "భార్య" : i.relationType === "S/O" ?"కొడుకు":  i.relationType === "D/O" ?"కూతురు" : "Gurdian"
		// 						pdfDocs.fontSize('13').text(`1. దఖలు పరచు వారికి దఖలు పొందువారు ${relation} అయినందున వారి పట్ల సహజ ప్రేమాభిమానాలు చేత ప్రేమయే ప్రతి ఫలముగా యుంచి స్వచ్ఛందంగా షెడ్యూలు దాఖలా ఆస్తిని దాఖలు పరచనున్నారు.`,{align:'justify',lineGap:0,});
		// 						pdfDocs.fontSize('13').text(`ఈ దఖలు దస్తావేజు ద్వారా దఖలు చేయువారు ఈ దిగువ షెడ్యూలు దాఖలా నిర్వివాద ఆస్తి పై తనకున్న దాన వినిమయ విక్రయాధికార సర్వ సంపూర్ణ హక్కులను దఖలు పొందువారు చెoదచేసి ఈ రోజున ఆస్తిని స్వాధీనపరచడమైనది. భవిష్యత్తులో సదరు ఆస్తి పై దఖలు పొందువారు సర్వ సంపూర్ణ హక్కులతో అనుభవించుటకు దఖలు చేయువారు గాని, వారి వారసులు గాని ఎటువంటి ఆక్షేపణలు గాని కలుగ చేయరు అని తెలియజేయడమైనది`,{align:'justify',lineGap:0,});
								
	
		// 					}
		// 				}else{
		// 				pdfDocs.fontSize('13').text(`1. దఖలు పరచు వారికి దఖలు పొందువారు ....... అయినందున వారి పట్ల సహజ ప్రేమాభిమానాలు చేత ప్రేమయే ప్రతి ఫలముగా యుంచి స్వచ్ఛందంగా షెడ్యూలు దాఖలా ఆస్తిని దాఖలు పరచనున్నారు.`,{align:'justify',lineGap:0,});
		// 					pdfDocs.fontSize('13').text(`ఈ దఖలు దస్తావేజు ద్వారా దఖలు చేయువారు ఈ దిగువ షెడ్యూలు దాఖలా నిర్వివాద ఆస్తి పై తనకున్న దాన వినిమయ విక్రయాధికార సర్వ సంపూర్ణ హక్కులను దఖలు పొందువారు చెoదచేసి ఈ రోజున ఆస్తిని స్వాధీనపరచడమైనది. భవిష్యత్తులో సదరు ఆస్తి పై దఖలు పొందువారు సర్వ సంపూర్ణ హక్కులతో అనుభవించుటకు దఖలు చేయువారు గాని, వారి వారసులు గాని ఎటువంటి ఆక్షేపణలు గాని కలుగ చేయరు అని తెలియజేయడమైనది`,{align:'justify',lineGap:0,});
		// 				}
		// 				pdfDocs.fontSize('15').text(`ఆస్తి బదలాయింపునకు హామీ ఇచ్చుట :`,{align:'left',lineGap:0,underline:true});
		// 				pdfDocs.fontSize('13').text(`2. షెడ్యూలు దాకలాస్తిపై ఈరోజు వరకు ఏ విధమైన తాకట్లు విక్రయం దానము,వగైరా అన్యక్రాంతములు చేయలేదని ఎలాంటి కోర్టు వ్యక్తులు ఇంజక్షన్ సెక్యూరిటీలు లేవని మరెవరికి ఇలా ఎలాంటి హక్కులు లేవని ధ్రువీకరించడమైనది. ఈ దఖలు గురించి గానీ షెడ్యూలు దాకలాస్తి గురించి గానీ, హక్కుల గురించి గానీ, ఎవరి వలనైనా ఏ విధమైన ఆటంకములు గాని దావా తగాదాలు కానీ వచ్చినచో దఖలు పరుచు వారు వారి సొంత ఖర్చులతో నివారించగలరని ప్రకటించడమైనది.`,{align:'justify',lineGap:0,});
		// 				pdfDocs.fontSize('15').text(`యాజమాన్య పేరు మార్పుదల :`,{align:'left',lineGap:0,underline:true});
		// 				pdfDocs.fontSize('13').text(`3. షెడ్యూలు దాఖల ఆస్తికి దఖలు పొందు వారి పేరుటకు మార్పుదల చేసుకొనుటకు అవసరమైన అన్ని సంతకములు సహకారములు దఖలు పరచు వారు చేయుదరని ప్రకటించడమైనది.`,{align:'justify',lineGap:0,});
		// 				if(covenantArr && covenantArr.length >0){
		// 					for(let i of covenantArr){
		// 						pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
		// 					}
		// 				}
		// 				pdfDocs.fontSize('15').text(`డిక్లరేషన్ :`,{align:'left',lineGap:0,underline:true});
		// 				pdfDocs.fontSize('13').text(`రిజిస్ట్రేషన్ చట్టము, భారతీయ స్టాంపు చట్టము, ఆస్తి బదలాయింపు చట్టం, ఎవిడెన్స్ చట్టము, సంబంధించిన శాసనబద్ధనమైన చట్టములకు లోబడి పొందుపరచబడవలసిన అన్ని అంశములు ఈ దస్తావేజు నందు వ్రాయబడినవి. పైన పేర్కొన్న చట్టములను గాని, ప్రభుత్వ నిర్దేశిత ఉత్తర్వులను గాని, అతిక్రమణ చేసినట్లయితే అట్టి నష్టమునకు దఖలు పరుచువారు బాధ్యత వహించగలరు మరియు ఈ ఆ నష్టము పూరించుటకు బాకీ వసూలు జరిమానులకు బాధ్యులగుదురు.`,{align:'justify',lineGap:0,});
		// 				pdfDocs.fontSize('13').text(`ఈ దిగువ షెడ్యూలు దఖలు ఆస్తి ఏ విధముగా రిజిస్టర్ జరుపుటకు నిషేధించబడినది కాదు అని మరియు ఎట్టి న్యాయస్థానపు  ఉత్తర్వులు ఆస్తి విషయమై జారీ చేయబడలేదనియు అమ్మిన వారు రూడీగా తెలియజేయుచున్నారు.`,{align:'justify',lineGap:0,});
		// 				pdfDocs.addPage();
		// 			}else if(DocNum ==="07"){
		// 				pdfDocs.fontSize('15').text(`4) .స్వభావము :`,{align:'left',lineGap:0,underline:true});
	
		// 				pdfDocs.fontSize('13').text(`మనలో 1వ పార్టీవారికి స్వాధీన సర్వ సంపూర్ణ నిర్వివాద యాజమాన్య హక్కు భుక్తములుగల, విజయవాడ, డోరు నెం.... రు దాఖలా స్థిరాస్తిని మనలో 1వ పార్టీవారు అద్దెకు యిచ్చు తలంపుతో యుండగా, అది తెలుసుకొనిన మనలో 2వ పార్టీవారు వ్యాపారము చేసుకొను నిమిత్తం, సదరాస్తిని అద్దెకు యివ్వవలసినదిగా మనలో 1వ పార్టీవారిని కోరగా, అందుకు 1వ పార్టీవారు అంగీకరించి, సదరాస్తికి తెలిపిన అద్దెను 2వ పార్టీవారు రీజనబుల్ అండ్ ఫెయిరెంట్గా అంగీకరించినందున, వుభయ పార్టీల వారము కలసి యీ దిగువ తెలిపిన షరతుల ప్రకారం నడచుకొనుటకు నిర్ణయించుకొని, అందుకు నిదర్శనముగా యీ అద్దె యెగ్రిమెంటును వ్రాసుకోవడమైనది. `,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('15').text(`షరతులు`,{align:'center',lineGap:0,underline:true});
		// 				pdfDocs.fontSize('13').text(`1. ది.. వ తేదీనుండి ది.....వ తేదీవరకు అనగా సంవత్సరముల కాలము అద్దె గరువై యున్నది.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`2. అద్దె ఆస్తికి నెల1కి రూ... లు చొప్పున ది...వ తేదీ నుండి ది....వ తేదీవరకున్నూ:`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`అద్దె ఆస్తికి నెల1కి రూ....లు చొప్పున ది.. వ తేదీనుండి ది....వ తేది వరకున్నూ:`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`ఏ నెల అద్దె ఆ మరుసటి నెల వ తేదీనాటికి మనలో 2వ పార్టీవారు 1వ పార్టీవారికి చెల్లించి. రశీదు పొందగల ఏర్పాటు. అట్లు రశీదులేని అద్దె జములు కలవని ముదరా కోరుటకు మనలో 2వ పార్టీవారికి ఎట్టి హక్కులు లేవు.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`3. వరుసగా మూడు నెలల అద్దె బకాయి పడిన యెడల, యీ అద్దె యెగ్రిమెంటులోని మిగతా అద్దె గడువుతో సంబంధము లేకుండా మనలో 2వ పార్టీవారిని అద్దె ఆస్తినుండి ఖాళీ చేయించుటకు మనలో 1వ పార్టీవారు అధికారము కలిగియుందురు.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`4. 2వ పార్టీవారి వ్యాపారమునకు అవసరమైన టెంపరరీ ఉడెన్ పార్టిషన్స్ను మనలో 2వ పార్టీవారు | వారి అవసరమునుబట్టి ఏర్పాటు చేసుకొని, అద్దె గదువు ఆఖరున యెట్టి ముదరాలు కోరకుండా 2వ పార్టీవారి స్వంతఖర్చులపై అట్టి టెంపరరీ పార్టిషన్స్ను తొలగించుకొని, తీసుకొని వెళ్లగల ఏర్పాటు.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`5. అద్దె ఆస్తిలోగల ఎలక్ట్రికల్ కరెంట్ సర్వీస్ కనెక్షన్ నుపయోగించుకొని 2వ పార్టీవారు వాడుకొనే కరెంటు చార్జీలు మరియు 2వ పార్టీవారి వ్యాపార పన్నులు వగైరాలు మనలో 2వ పార్టీవారే చెల్లించు కోవలెను. ఆస్తి పన్నులు మాత్రం మనలో 1వ పార్టీవారు చెల్లించుకోగల ఏర్పాటు.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`6. మనలో 2వ పార్టీవారు అద్దె ఆస్తిని తమ స్వంత వ్యాపారమునకు మాత్రమే వినియోగించు కొనవలెనుగాని, అద్దె ఆస్తి మొత్తమునుగాని, అందు కొంత భాగమునుగాని మనలో 2వ పార్టీవారు యితరత్రా ఎవరికీ ఎట్టి సబ్ లీజు వగైరా పరాధీనములు చేయరాదు. అద్దె గడువు ఆఖరున మనలో 1వ పార్టీవారి యెట్టి విడుదల నోటీసులతో నిమిత్తం లేకుండా మనలో 2వ పార్టీవారు అద్దె ఆస్తిని ఖాళీ చేసి, 1వ పార్టీవారికి యిప్పటి యధాస్థితిలో నిరభ్యంతరముగా స్వాధీనపర్చగల ఏర్పాటు.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`7. అద్దె ఆస్తిలో మనలో 2వ పార్టీవారు ఎట్టి చట్టవ్యతిరేకమైన వ్యాపారములను, వ్యవహారములను నిర్వహించరాదు. అద్దె ఆస్తికి భంగంవాటిల్లెడి ఎట్టి చర్యలను మనలో 2వ పార్టీవారు అద్దె ఆస్తిలో చేయరాదు.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`8. మనలో 1వ పార్టీవారి కోరికపై అద్దె ఆస్తికి శెక్యూరిటీ డిపాజిట్ క్రింద రూ.... లు సొమ్మును మనలో 2వ పార్టీవారు యీ అద్దె యెగ్రిమెంటు వ్రాతకాలమందు 1వ పార్టీవారికి నగదుగా చెల్లించినందున ముట్టినవి. యీ మొత్తమునకు యెట్టి వడ్డీతో నిమిత్తం లేకుండా మనలో 2వ పార్టీవారు అద్దె ఆస్తిని మనలో 1వ పార్టీవారికి స్వాధీనపర్చు సందర్భములో సదకు మొత్తం రూ.... లు సొమ్మును మనలో 1వ పార్టీవారు 2వ పార్టీవారికి చెల్లించి, రశీదు పొందగల ఏర్పాటు.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`9. అద్దె గడువు అనంతరం మనలో 2వ పార్టీవారు అద్దెఆస్తిలో యింకనూ అద్దెదారుగా కంటిన్యూ అవ్వదలచుకున్న యెడల, అప్పటి అద్దె మొత్తమునకు .....% అద్దెను పెంచి చెల్లించుటకు అంగీకరించే యెడల, ఆ సంధర్భములో కొత్త అద్దె యెగ్రిమెంటును వ్రాసుకొని మాత్రమే మనలో 2వ పార్టీవారు అద్దెదారుగా కంటిన్యూ అగుటకు మనలో 1వ పార్టీవారు అంగీకరించడ మైనది.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`10. అద్దె గడువు కాలములో మనలో 2వ పార్టీవారు ఏ కారణము చేతనైనా అద్దె ఆస్తిని ఖాళీ చేయదలచుకున్న యెడల, ఆ విషయమును మూడు నెలల ముందుగా లిఖిత పూర్వకముగా మనలో 2వ పార్టీవారు 1వ పార్టీవారికి తెలియపరచి, సదరు మూడు నెలల గడువు కాలములో మనలో 2వ పార్టీవారు అద్దె ఆస్తిని ఖాళీ చేసి 1వ పార్టీవారికి వేకెంటుగా స్వాధీనపర్చగల ఏర్పాటు.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`అదేవిధముగా మనలో 1వ పార్టీవారికి ఏ కారణము చేతనైననూ అద్దె ఆస్తి అవసరమైన యెడల, ఆ విషయమును మూడు నెలల ముందుగా లిఖిత పూర్వకముగా మనలో 1వ పార్టీవారు 2వ పార్టీవారికి తెలియపరచులాగున్నూ, అట్టు 1వ పార్టీవారు తెలియపరచిన మూడు నెలల గడువు కాలములో మనలో 2వ పార్టీవారు అద్దె ఆస్తిని ఖాళీ చేసి 1వ పార్టీవారికి వేకెంటుగా, నిరభ్యంతరముగా స్వాధీనపర్చగల ఏర్పాటు.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`11. పై షరతులతో మనలో 1వ పార్టీవారు అద్దెఆస్తిని ది వ తేదీననే మనలో 2వ పార్టీవారికి స్వాధీనపర్చడమైనది. ది వ తేదీనుండి అద్దె గడువు ప్రారంభమైనది.`,{align:'left',lineGap:0});
		// 				if(covenantArr && covenantArr.length >0){
		// 					for(let i of covenantArr){
		// 						pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
		// 					}
		// 				}
		// 				pdfDocs.addPage();
		// 			}else if(DocNum === "05"){
		// 				pdfDocs.fontSize('15').text(`స్వభావము :`,{align:'left',lineGap:0,underline:true});
						
		// 				pdfDocs.fontSize('13').text(`1. తద్విదముగా మనకు సంక్రమింపబడిన యీ దిగువ షెడ్యూలు దాఖలా మొత్తం స్థిరాస్తిని మనందరి స్వాధీనములో సర్వ సంపూర్ణ నిర్వివాద యాజమాన్య హక్కు భుర్తములతో అనుభవించు చున్నాము. పదంస్తిలో మీరు .... వంతు, నేను.....వ వంతు చొప్పున జాయంటు హక్కులు కలిగియున్నాము.`,{align:'left',lineGap:0});
						
		// 				pdfDocs.fontSize('13').text(`2. యిట్టిస్థితిలో షెడ్యూలు దాఖలా మొత్తం చ.గ... లు స్థిరాస్తిలో పైన తెలిపిన విధముగా నాకుగట ....వ వింతు జాయంటు హక్కులను పురస్కరించుకొని, సదరాస్తిని మీతోపాటు కలసి జాయింటుగా అనుభవించుటకు నాకు వీలు కుదరనందున అందలి 1వ పేరా దాఖల సొమ్ము రూ.... రూపాయలను మీరు నాకు చెల్లించుటకు అంగీకరించే యెడల, షెడ్యూలు దాఖలా మొత్తం స్థిరాస్తిలో నాగుగల చూపత్తు జాదుంటు హక్కులను నేను మీరు పూర్తిగా వదలుకొనగలనని పెద్దల కృతముగా నేను మీరు తెలుపగా, అందుకు మీరు అంగీకరించి, నేను కోరిన అందలి 1వ పేరా దాఖలో మొత్తం రూ.....! రూపాయలు సొమ్మును యీ హక్కు విడుదల దస్తావే ప్రాతరాలమందు మీరు నాకు నగదుగా చెల్లించినందున, మీ వలన నాకు పూర్తిగా ముట్టినవి.`,{align:'left',lineGap:0});
						
		// 				pdfDocs.fontSize('13').text(`3. .........బ్రాంచి,......బ్యాంక్ వారి ది....వ తేదీగల, నెం... రుగల చెక్కును మీరు నా పేరుతో యిచ్చినందున, ముందలి 1వ పేరా దాఖలా మొత్తం రూ.... రూపాయలు మీ వలన నాకు పూర్తిగా ముట్టినవి.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`4. యిందలి 1వ పేరా దాఖలా మొత్తం రూ రూపాయలు మీరు ౠ దిగువ తెలిపిన విధముగా జారు. చెల్లించినందున, మీ వలన నాకు పూర్తిగా ముట్టినవి. సదురు  వివరం :`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`(1). యీ దస్తావేజు వ్రాతనాలనుందు మీరు నాకు నగదుగా చెల్లించినందున, మీ వలన నాకు ముట్టినవి.`,{align:'left',lineGap:0,width:400});
		// 				pdfDocs.fontSize('13').text(`రూ.......లు`,{align:'right',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`(2).   ............బ్రాంచి,............బ్యాంక్ వారి, ది. వ తేదీగల నెం.. రుగల చెక్కును మీరు నా పేరుతో యిచ్చినందున, మీ వలన నాకు ముట్టినవి.`,{align:'left',lineGap:0,width:400});
		// 				pdfDocs.fontSize('13').text(`రూ.......లు`,{align:'right',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`వెరశి ... రూ.......లు`,{align:'right',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`5. గనుక షెడ్యూలు దాఖలా మొత్తం స్థిరాస్తిలో నాటగల చూపత్తు వాయుంటు హర్యులను నేను పూర్తిగా వదలుకొని, వదరు నా జాయంటు దిక్కులను యిందుమూలముగా మీరు సంక్రమించి చేయడమైనది. యింక నుండి షెడ్యూలు దాఖలా మొత్తం చ.గ...లు స్థిరాస్తికి మీరే పూర్తి హక్కుడాబై సదం-ప్తికి చెల్లించవలసిన యావత్తు పన్నులు మీరే చెల్లించుకొనుచూ, సదదాస్తిని, అందులభించు తరు, జల, ధన, విధి, నిక్షేప పాషాణాదుల సమేతము మీరు. మీ స్థానీయులు వగైరాలు మీ బుష్టానుసారం దాని -వమన వినిమయ విక్రయాని సమస్త సంపూర్ణ హక్కులతో అనుభవించవలసినది.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`6. యీ హక్కు విడుదలను గురించి మిమ్ము మీ వారసులు. మీ స్థానీయులు వగైరాలను -- నేను, నా వారసులు, నా స్థానీయులు పక్షరాలము యెన్నటికీ యెుట్టి తగాదాలు చేయగలవారముకాము.. ముందెప్పటికైనా యీ హక్కు విడుదలను గురించి, నా సానీయులు వగైరా ఎవరివల్ల యెట్టి శగాయిదాలు --కలిగిననూ అవియన్నియు నేనుగాని, నా వారసులుగాని మా స్వంత ఖర్చులపై పూర్తిగా నివారించి. యీ "హక్కు విడుదల అంశములను స్థిరపర్చి మీ భుక్తమును నిరాటంకముగా అమలు జరుపుటయేగాక, అందువలన మీరు కలిగే యావత్తు వస్త్రము, ఖర్చులు సహా మీకు నేను పూర్తిగా చెల్లించగలము.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`7. షెడ్యూలు దాఖలా మొత్తం ఆస్తిలో నాకుగల జయంబు హక్కులను పురస్కరించుకొని లోగడ నేను అన్యులెవ్వరికీ యెట్టి అవ్వాకాంతములు చేసియుండలేదనిన్నీ, సదరాస్తిపై కోర్టు ఇప్పులు, జంక్షన్లు, జాయంటు భాగలబ్ధి వేగాయి దాటు, యితర యెగ్రిమెంట్లు, తదితర కెక్యూరిటీలు మొదలగు యెట్టి హక్కులు, బాధ్యతలు ఎవరికి ఏమీలేవనిన్నీ మనకు మాత్రమే సమస్త సంపూర్ణ హక్కు భుక్తములుగల నిర్విచారమైన ఆత్మీయనిన్నీ మిమ్ము నేను పూర్తిగా నమ్మించి, సరరాస్తిలో నాకుగల జాయంటు హక్కులను మీకు పూర్తిగా వరలుకొనుచూ, మీపేర యీ హక్కు విడుదల దస్తావేజును వ్రాయించి యివ్వడమైనది.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`8. యిప్పటివరకు సద్యులు అనికి చెల్లించవలసిన అమాంబాపుకు బకాయి పన్నులు ఏమైనా పున్నయెడల. మీకు నిమిత్తం లేకుండా నేనే చెల్లించగలను. షెడ్యూలు అప్తికి సంబంధించిన దస్తావేజు వగైరా యావత్తు రికార్డు యిందుతో మీకు యివ్వడమైనది. షెడ్యూలు ఆమ్లా రెవిన్యూ మరియు నగరపాలక సంస్థ వారి లెబ్బలలో మీపేరుతో నమోదు తాగలందులకు యిందుతో పట్టా ట్రాన్స్ఫర్ ఫారములు దాఖలు చేయడమైనది.`,{align:'left',lineGap:0});
		// 				if(covenantArr && covenantArr.length >0){
		// 					for(let i of covenantArr){
		// 						pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
		// 					}
		// 				}
		// 				pdfDocs.addPage();
		// 			}else if(DocNum === "06"){
		// 				pdfDocs.fontSize('15').text(`స్వభావము :`,{align:'left',lineGap:0,underline:true});
						
		// 				pdfDocs.fontSize('13').text(`(ఏ)  మనలో 1వ పార్టీవారు వారి స్వార్జితపు సొమ్ముతో, వారిపేర ............ తేదీన, గారివద్ద క్రయమును పొంది, సబ్ రిజిష్ట్రారు వారి కార్యాలయములో నెం....... రుగా రిజిష్టరు చేయించుకున్న విక్రయ దస్తావేజు రీత్యా సంక్రమింపబడిన, గ్రామ ఆర్.యస్. ......రు దాఖలా చ.గ. లు స్థలమును మనలో 1వ పార్టీవారు వారి స్వాధీనములో సర్వ సంపూర్ణ నిర్వివాద యాజమాన్య హక్కు భుక్తములతో అనుభవించు చున్నారు. సదరాస్తిని యీ దస్తావేజులో బి-షెడ్యూలునందు చూపడమైనది.`,{align:'left',lineGap:0});
						
		// 				pdfDocs.fontSize('13').text(`(బి)  మనలో 2వ పార్టీవారు వారి స్వార్జితపు సొమ్ముతో, వారిపేర వ తేదీన, గారివద్ద క్రయమును పొంది, సబ్ రిజిష్ట్రారు వారి కార్యాలయములో నె........ రుగా రిజిష్టరు చేయించుకున్న విక్రయ దస్తావేజు రీత్యా సంక్రమింపబడిన, గ్రామ ఆర్.యస్. నెం...... రు దాఖలా చ......లు స్థలమును మనలో 2వ పార్టీవారు వారి స్వాధీనములో సర్వ సంపూర్ణ నిర్వివాద యాజమాన్య హక్కు భుక్తములతో అనుభవించు చున్నారు. సదరాస్తిని యీ దస్తావేజులో ఎ-షెడ్యూలునందు చూపడమైనది.`,{align:'left',lineGap:0});
					
		// 				pdfDocs.fontSize('13').text(`1. ఇట్టిస్థితిలో మన ఉభయపార్టీల పూర్తి సమ్మతితో మన తాలూకు యీ దిగువ ఎ, బి షెడ్యూళ్లలో చూపిన ఆస్తులను విలువలు, విస్తీర్ణ హెచ్చుతగ్గులు వగైరాలతో సంబంధము లేకుండా మనము పరస్పరము (మార్పిడి) పరటా చేసుకొనుటకు నిర్ణయించుకొని;`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`మనలో 2వ పార్టీవారి తాలూకు యీ దిగువ ఎ-షెడ్యూలు స్థిరాస్తిని మనలో 2వ పార్టీవారు 1వ పార్టీవారికి పరటాగా యిచ్చి, అందుకు ప్రతిఫలముగా 1వ పార్టీవారి తాలూకు యీ దిగువ బి-షెడ్యూలు స్థిరాస్తిని మనలో 2వ పార్టీవారు పరటాగా తీసుకోవడమైనది.`,{align:'left',lineGap:0});
					
		// 				pdfDocs.fontSize('13').text(`2 .గనుక మనలో 2వ పార్టీవారి వద్దనుండి దిగువ ఎ-షెడ్యూలులో చూపిన స్థిరాస్తిని మనలో 1వ పార్టీవారున్నూ, 1వ పార్టీవారి వద్దనుండి దిగువ బి-షెడ్యూలులో చూపిన స్థిరాస్తిని మనలో 2వ పార్టీవారున్నూ యీ రోజుననే సర్వ హక్కులతో స్వాధీనపర్చుకోవడమైనది.`,{align:'left',lineGap:0});
					
		// 				pdfDocs.fontSize('13').text(`3. యింతటినుండి ఎ-షెడ్యూలు ఆస్తికి చెల్లించవలసిన యావత్తు పన్నులు చెల్లించుకొనుచూ, ఎ-షెడ్యూలు ఆస్తిని, అందులభించు తరు, జల, ధన, నిధి, నిక్షేప పాషాణాదుల సమేతము మనలో 1వ పార్టీవారు వారి యిష్టానుసారం దానా దమన వినిమయ విక్రయాది సమస్త సంపూర్ణ హక్కు భుక్తములతో అనుభవించవలసినది.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`4. అదేవిధముగా యింతటినుండి బి-షెడ్యూలు ఆస్తికి చెల్లించవలసిన యావత్తు పన్నులు చెల్లించుకొనుచూ,బి-షెడ్యూలు ఆస్తిని, అందులభించు తరు, జల, ధన, నిధి, నిక్షేప పాషాణాదుల సమేతము మనలో 2వ పార్టీవారు వారి యిష్టానుసారం దానా దమన వినిమయ విక్రయాది సమస్త సంపూర్ణ హక్కు భుక్తములతో అనుభవించవలసినది.`,{align:'left',lineGap:0});
					
		// 				pdfDocs.fontSize('13').text(`5. యీ ఆస్తుల మార్పిడిని గురించి మనలో మనము ఎన్నటికీ ఎట్టి తాగాయిదాలు చేసుకోగలవారము కాము. ముందెప్పటికైనా యీ ఆస్తుల మార్పిడిని గురించి మనలో ఎవరివల్ల ఎట్టి తాగాయిదాలు కలిగిననూ, అట్లు తగాయిదాలు కలుగచేసినవారు మిగతావారికి అయ్యే యావత్తు ఖర్చులు, నష్టము సహా పూర్తిగా చెల్లించుటయేగాక, యిందలి అంశముల ప్రకారం నిరాటంకముగా అమలు జరుపగల ఏర్పాటు.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`6. బి-షెడ్యూలు ఆస్తిని మనలో 1వ పార్టీవారుగాని, ఎ-షెడ్యూలు ఆస్తిని మనలో 2వ పార్టీవారుగాని లోగడ అన్యులెవ్వరికీ ఎట్టి అన్యాక్రాంతములు చేసియుండలేదనిన్నీ, సదరాస్తులపై కోర్టు ఒప్పులు, ఇంజంక్షన్లు, జాయింటు భాగలబ్ధ తగాయిదాలు, తదితర శెక్యూరిటీలు, యితర యెగ్రిమెంట్లు వగైరాలు ఏమీలేవనిన్నీ, సదరాస్తులపై మనకు తప్ప అన్యులెవ్వరికీ ఎట్టి హక్కులు, బాధ్యతలు ఏమీలేవనిన్నీ మనము ఒకరినొకరము పూర్తిగా నమ్మించుకొని, ఉభయపార్టీల పూర్తి సమ్మతితో యిప్పుడు యీ పరటా దస్తావేజును వ్రాసుకోడమైనది.`,{align:'left',lineGap:0});
						
		// 				pdfDocs.fontSize('13').text(`7. ఎ-షెడ్యూలు ఆస్తికి సంబంధించిన యావత్తు ఒరిజినల్ రికార్డును మనలో 2వ పార్టీవారు 1వ పార్టీవారికి యివ్వడమైనది. అదేవిధముగా బి-షెడ్యూలు ఆస్తికి సంబంధించిన యావత్తు ఒరిజినల్ రికార్డును మనలో 1వ పార్టీవారు 2వ పార్టీవారికి యివ్వడమైనది.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`8. యీ పరటా దస్తావేజు ఒరిజినల్ మనలో 1వ పార్టీవారి వద్దను, డూప్లికేట్ మనలో 2వ పార్టీవారి వద్దను వుంచుకోవడమైనది. ఎ-షెడ్యూలు ఆస్తి మనలో 1వ పార్టీవారి పేరుతోను, బి-షెడ్యూలు ఆస్తి మనలో 2వ పార్టీవారి పేర్లతోను రెవిన్యూ రికార్డులలో నమోదు కాగలందులకు యిందుతో పట్టా ట్రాన్స్ఫర్ ఫారములు దాఖలు చేసుకోవడమైనది.`,{align:'left',lineGap:0});
		// 				if(covenantArr && covenantArr.length >0){
		// 					for(let i of covenantArr){
		// 						pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
		// 					}
		// 				}
		// 				pdfDocs.addPage();
		// 			}else if(DocNum === "04"){
		// 				pdfDocs.fontSize('15').text(`స్వభావము :`,{align:'left',lineGap:0,underline:true});
		// 				pdfDocs.fontSize('13').text(`దిగువ షెడ్యూలు దాఖలా ఆస్తి మాకు పూర్వార్జితపు ఆస్థి గా సంక్రమించి సమిష్ఠిగా అనుభవించుచున్నాము.`,{align:'left',lineGap:0})
		// 				pdfDocs.fontSize('13').text(`1.తద్విధముగా మనకు జాయంటు హక్కు భుక్తములుగల స్థిరాస్తులను విభజన చేసి ఎవరి వాటాకు రాబడిన ఆస్తిని ఆ వాటాదారు యిష్టానుసారం సర్వ హక్కులతో అనుభవించుటకు నిర్ణయించుకొని,యున్నము మనమందరము కలసి, మన కుటుంబ, శ్రేయోభిలాషులగు పెద్దల సమక్షములో సమావేశపడి చర్చించుకొనిన పిమ్మట మనందరి పూర్తి సమ్మతిపై మన తాలూకు జాయంటు ఆస్తులను, యీ దిగువ ఎ-షెడ్యూలు ఆస్తి మనలో 1వ వారి వాటాకున్నూ, బి-షెడ్యూలు ఆస్తి మనలో 2వ వారి వాటాకున్నూ రాబడి. యీ రోజుననే ప్రత్యక్షముగా స్వాధీనపర్చుకోవడమైనది.`,{align:'left',lineGap:0});
						
		// 				pdfDocs.fontSize('13').text(`2. యింతటినుండి యీ దిగువ (ఎ)-షెడ్యూలు ఆస్తికి చెల్లించవలసిన యావత్తు పన్నులు చెల్లించుకొనుచూ, ఎ-షెడ్యూలు ఆస్తిని, అందులభించు తరు, జల, ధన, నిధి, నిక్షేప పాషాణాదుల సమేతము మనలో 1వ వారు వారి యిష్టానుసారం దానా దమన వినిమయ విక్రయాది సమస్త సంపూర్ణ హక్కులతో అనుభవించ వలసినది.`,{align:'left',lineGap:0});
						
		// 				pdfDocs.fontSize('13').text(`3. అదేవిధముగా యింతటినుండి యీ దిగువ (బి)-షెడ్యూలు ఆస్తికి చెల్లించవలసిన యావత్తు పన్నులు చెల్లించుకొనుచూ, బి-షెడ్యూలు ఆస్తిని, అందులభించు తరు, జల, ధన, నిధి, నిక్షేప పాషాణాదుల సమేతము మనలో 2వ వారు వారి యిష్టానుసారం దానా దమన వినిమయ విక్రయాది సమస్త సంపూర్ణ హక్కులతో అనుభవించ వలసినది.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`4. మన పూర్తి సమ్మతితో మన తాలూకు జాయంటు స్థిరాస్తిని యిందు వుదహరించిన విధముగా మనము విభజించుకున్నందున, వాటాలు హెచ్చు తగ్గులు కలవనిగాని, విస్తీర్ణములలో, విలువలలో తేడాలు వున్నవనిగాని, మెరుగు తరుగులు కలవనిగాని, వేరే మూజువాణీ ఖరారులున్నవని గాని, తిరిగి పంపిణీ చేయవలెననిగాని, మరి ఏవిధముగాను యీ విభజన విషయమై మనలో మనము యెట్టి తాగాయిదాలు చేసుకోగలవారముకాము. ఒకవేళ మనలో ఎవరైనా యిందుకు భిన్నముగా ప్రవర్తించి తగాయిదాలు కలుగచేసే యెడల, అందువలన మిగతావారికి కలిగే యావత్తు నష్టము, ఖర్చులు సహా వ్యతిరేకించి నడచుకొనినవారు పూర్తిగా చెల్లించుటయేగాక, యీ దస్తావేజు అంశముల ప్రకారం అమలు జరుపగల ఏర్పాటు.`,{align:'left',lineGap:0});
						
		// 				pdfDocs.fontSize('13').text(`5. షెడ్యూళ్ల ఆస్తులను యిదివరకు మనము కలసిగాని, విడివిడిగాగాని అన్యులెవ్వరికీ యెట్టి అన్యాక్రాంతములు చేసియుండలేదనిన్నీ, షెడ్యూళ్ల ఆస్తులపై ఏవిధమైన కోర్టు లిటిగేషన్లు పెండింగ్లో లేవనిన్నీ, షెడ్యూళ్ల ఆస్తులపై కోర్టు జప్తులు, ఇంజంక్షన్లు, జాయంటు భాగలబ్ధ తగాయిదాలు, ఏవిధమైన తనఖాలు, యితర యెగ్రిమెంట్లు, తదితర శెక్యూరిటీలు మొదలగు యెట్టి హక్కులు, బాధ్యతలు ఎవరికీ ఏమీ లేవనిన్నీ, షెడ్యూళ్ల ఆస్తులపై మనము మాత్రమే జాయంటు హక్కులు కలిగి యున్నామనిన్నీ ఒకరినొకరము నమ్మించుకొని, మన తాలూకు జాయంటు ఆస్తులను యిందు వుదహరించిన విధముగా విభజించుకొని, అందుకు నిదర్శనముగా యిప్పుడు యీ పార్టీషన్ దస్తావేజును వ్రాసుకోవడమైనది.`,{align:'left',lineGap:0});
						
		// 				pdfDocs.fontSize('13').text(`6. యీ పార్టీషన్ ఒరిజినల్ మనలో . వ వారివద్దను, డూప్లికేట్ మనలో వ వారివద్దను వుంచుకోవడ మైనది. షెడ్యూళ్ల ఆస్తులకు సంబంధించిన యావత్తు ఒరిజినల్ రికార్డు మనలో ....వ వారివద్దను, వాటి ఫొటోస్టాట్ కాపీలను మిగతావారల వద్దను వుంచుకోవడమైనది.`,{align:'left',lineGap:0});
						
		// 				pdfDocs.fontSize('13').text(`7. ఎ-షెడ్యూలు ఆస్తి మనలో 1వ వారిపేరుతోను, బి-షెడ్యూలు ఆస్తి మనలో 2వ వారిపేరుతోను ప్రభుత్వం వారి లెఖ్కలలో నమోదు కాగలందుకు యిందుతో పట్టా ట్రాన్స్ఫర్ ఫారములను దాఖలు చేసుకోవడమైనది. షెడ్యూళ్ల ఆస్తులకు మనము తప్ప యితర హక్కుదారులు ఎవరూలేరు. షెడ్యూళ్ల ఆస్తులు తప్ప యింక మనము విభజించుకోవలసిన యితర స్థిర చరాస్తులు ఏమీలేవు.`,{align:'left',lineGap:0});
		// 				if(covenantArr && covenantArr.length >0){
		// 					for(let i of covenantArr){
		// 						pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
		// 					}
		// 				}
		// 				pdfDocs.addPage();
		// 			}else if(DocNum === "09"){
		// 				pdfDocs.fontSize('15').text(`స్వభావము :`,{align:'left',lineGap:0,underline:true});
		// 				pdfDocs.moveDown();
		// 				pdfDocs.fontSize('13').text(`ఇట్టిస్థితిలో ప్రస్తుతము నేను దూరప్రాంతము వెళ్లుచున్నందున, నా తాలూకు షెడ్యూలు ఆస్తి విషయములో యీ దిగువ తెలిపిన అన్ని సంధర్భములలోను నా తరపున వ్యవహరించుటకుగాను నా . మిమ్ములను నా ఏజెంటుగా నియమించి, మీకు పూర్తి అధికారములను కలుగ చేయుచూ, మీపేర యీ జనరల్ పవర్ ఆఫ్ అటార్నీని వ్రాయించి యివ్వడమైనది.`,{align:'left',lineGap:0});
		// 				pdfDocs.moveDown();
		// 				pdfDocs.fontSize('13').text(`నా తరపున జనరల్ పవర్ ఆఫ్ అటార్నీ ఏజెంటు హెూదాలో మీరు`,{align:'center',lineGap:0,underline:true});
		// 				pdfDocs.moveDown();
		// 				pdfDocs.fontSize('13').text(`1. నా తాలూకు షెడ్యూలు ఆస్తిని సమర్ధవంతముగా మేనేజిమెంటు చేయుటకు;`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`2. నా తాలూకు షెడ్యూలు ఆస్తి మొత్తమును ఒకటిగాగాని, భాగములుగాగాని మీ యిష్టమువచ్చిన వారలకు, మీ యిష్టము వచ్చినంత అద్దెతో అద్దెలకు యిచ్చుటకు, అద్దెదారుల వద్దనుండి అద్దె మొత్తములు వసూలు చేసి, రశీదులు యిచ్చుటకు, పాత అద్దెదారులను ఖాళీ చేయించి కొత్త అద్దెదారులను నియమించుటకు, అద్దెదారుల పేర్లతో అవసరమైన యెడల అద్దె యెగ్రిమెంట్లు వ్రాయించి, సంతకములు చేయుటకు, రిజిష్టర్ల వ్యవహారములు పూర్తి చేయుటకు; అద్దెదారులను ఖాళీ చేయించు నిమిత్తం అవసరమైన యెడల ఆయా కోర్టులలో దావా గ్రంధములు వగైరా అన్ని వ్యవహారములు జరుపుటకు;`,{align:'left',lineGap:0});
		// 				pdfDocs.moveDown();
		// 				pdfDocs.fontSize('13').text(`3. నా తాలూకు షెడ్యూలు ఆస్తి మొత్తమును ఒకటిగాగాని, భాగములుగాగాని, అవిభాజ్యములుగాగాని, మీ యిష్టమువచ్చిన ధరకు, మీ యిష్టంవచ్చినవారలకు విక్రయించుటకు, క్రయదారు పేరు/పేర్లతో బయానా రశీదులు, విక్రయ యెగ్రిమెంట్లు, విక్రయ దస్తావేజులు వగైరా సదరాస్తి బదలాయింపు నిమిత్తం అవసరమైన అన్ని పత్రములను, వాటికి సంబంధించిన ఫారములను వ్రాయించి, వాటిపై సంతకములు చేసి, అందలి ప్రతిఫలములను తీసుకొనుటకు, సదరు విక్రయ దస్తావేజులను సంబంధిత సబ్ రిజిష్ట్రారు/జిల్లా రిజిష్ట్రారు (లేదా) ఏదైనా సబ్ రిజిష్ట్రారు వారి కార్యాలయములో ఎనీవేర్ రిజిస్ట్రేషన్ క్రింద దాఖలుచేసి, అందలి అంశములను ఒప్పుకొనుచూ, రిజిష్టర్ల వ్యవహార మంతయు పూర్తి చేయుటకు, విక్రయాస్తిని క్రయదారులకు స్వాధీనపర్చుటకు;`,{align:'left',lineGap:0});
		// 				pdfDocs.moveDown();
		// 				pdfDocs.fontSize('13').text(`4. షెడ్యూలు ఆస్తి విషయమై అవసరమైన యెడల సవరణ దస్తావేజులు, ఒప్పుదల దస్తావేజులు, రద్దు దస్తావేజులను వ్రాయించి, సంతకములు చేసి, వాటిని సంబంధిత సబ్ రిజిష్ట్రారు/జిల్లా రిజిస్ట్రారు (లేదా) ఏదైనా సబ్ రిజిష్ట్రారు వారి కార్యాలయములో ఎనీవేర్ రిజిస్ట్రేషన్ క్రింద దాఖలుచేసి, అందలి అంశములను ఒప్పుకొనుచూ, రిజిష్టర్ల వ్యవహారమంతయు పూర్తి చేయుటకు;`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`5. నా తాలూకు షెడ్యూలు ఆస్తిని తనఖాగా / హామీగా / స్యూరిటీగా / శెక్యూరిటీగా / గ్యారంటీగా వుంచుటకు, ఆయా బ్యాంక్ లలోను, ఫైనాన్స్ సంస్థలలోను, చిట్ ఫండ్ సంస్థలలోను, యితర వ్యక్తుల వద్దను ఋణములు/ఆయా మొత్తములు పొందుటకు, ఆ సంధర్బములో అవసరమైన అన్ని పత్రములు వ్రాయించి, సంతకములు చేయుటకు, అవసరమైన యెడల వాటిని రిజిష్టరు చేయించి యిచ్చుటకు, ఋణముల తీర్మానానంతరం వాటిని రద్దు పర్పించుటకు; బాకీలు తీర్మానించ బడినట్లుగా ఋణదాతలచే చెల్లు రశీదులు వ్రాయించుకొనుటకు, రిజిష్టరు చేయించుకొనుటకు;`,{align:'left',lineGap:0});
		// 				pdfDocs.moveDown();
		// 				pdfDocs.fontSize('13').text(`6. ఆయా బ్యాంక్ లో ఋణములను పొందు సంధర్భములో ' అన్ని రకముల మార్టిగేజ్ దస్తావేజులు, లోన్ యెగ్రిమెంట్లు, ప్రాంశరీ నోట్లు, టర్మ్ లోన్ యెగ్రిమెంట్లు, హైపోతికేషన్ యెగ్రిమెంట్లు, ప్లెడ్జ్ యెగ్రిమెంట్లు, క్యాష్ క్రెడిట్ యెగ్రిమెంట్లు, పర్సనల్ గ్యారంటీ బాండ్లు/దస్తావేజులు వగైరా బ్యాంక్ నిబంధనల ప్రకారం బ్యాంక్ వారు కోరెడి పత్రములన్నింటిపై ' నా తరపున సంతకములు చేసి, ఋణములు పొందుటకు; యింకా ' డెట్ రివైవల్ లెటర్స్, బ్యాలన్స్ కన్ఫర్మేషన్ లెటర్స్ ' వగైరా పత్రములపై సమయానుసారముగా సంతకములు చేయుటకు;`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`7. నాపేరుతో వ్యక్తిగతముగాగాని, యితరులతో కలసి జాయింటుగాగాని, సేవింగ్స్ ఎక్కౌంట్లు, కరెంటు ఎక్కౌంట్లు వగైరా అన్ని బాపతుల ఎక్కౌంట్లను ప్రారంభించుటకు, ఆయా ఖాతాలలో చెక్కు పుస్తకములను తీసుకొనుటకు, చెక్కులు, యితర ఓచర్లు వగైరా బ్యాంకింగ్ ట్రాన్సాక్షన్స్ చేయుటకు అవసరమైన అన్ని పత్రములపై సంతకములు చేయుటకు, సదరు ఖాతాలలో సొమ్మును జమ చేయుటకు, విత్ డ్రా చేయుటకు వగైరా సదరు ఖాతాలను ఆపరేట్ చేయుటకు; బ్యాంక్ లో నేను జరుపవలసిన యావత్తు లిఖిత, వాగ్రూపక చర్యలన్నియు జరుపుటకు;`,{align:'left',lineGap:0});
		// 				pdfDocs.moveDown();
		// 				pdfDocs.fontSize('13').text(`8. నా తాలూకు షెడ్యూలు ఆస్తి విషయమై అవసరమైన యెడల రెవిన్యూ మరియు నగరపాలక సంస్థ, ఏపి సిఆర్డీఏ, ఇన్కంటాక్స్, సేల్స్ టాక్స్, ఎలక్ట్రిసిటీ డిపార్ట్మెంట్ తదితర యావత్తు రాష్ట్ర, కేంద్ర ప్రభుత్వ కార్యాలయములలోను, స్థానిక సంస్థలలోను నా తరపున దరఖాస్తులు వగైరాలన్నింటిపై సంతకములు చేసి, వాటిని ఆయా కార్యాలయములలో దాఖలు చేసి, అఫిడవిట్లు, స్టేట్మెంట్లు వగైరాలు యిచ్చి, నేను జరుపవలసిన లిఖిత వాగ్రూపక చర్యలన్నియు నా తరపున మీరు జరిపి అవసరమగు పర్మిషన్లు, సర్టిఫికెట్లు, ప్లాన్లు, యెండార్సుమెంట్లు, ఆర్డర్లు వగైరాలు పొందుటకు;`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`9. నా తాలూకు షెడ్యూలు ఆస్తి విషయమై అవసరమైన యెడల అడ్వకేట్లను నియమించుటకు, వకాల్తానామాలు యిచ్చుటకు, షెడ్యూలు ఆస్తి విషయమై యితరులు నాపై దాఖలు చేసెడి అన్ని దావాలలో నా తరపున పాల్గొనుటకు, యితరులపై నా తరపున దావాలు, పిటీషన్లు దాఖలు చేయుటకు, ఆయా కోర్టులలో అవసరమైన అఫిడవిట్లు, స్టేట్మెంట్లు, వాంగ్మూలములు వగైరాలు యిచ్చి దావాలను కొనసాగించుటకు, ఆయా కోర్టుల ఉత్తర్వుల ప్రకారం అమలు జరుపుటకు, కోర్టులనుండి/ప్రతివాదులు వగైరాలనుండి ఆయా మొత్తములుగాని, దస్తావేజులుగాని తీసుకొనుటకు, ఆయా వారలతో రాజీ చేసుకొనుటకు, అవసరమైన యెడల పై కోర్టులలో అప్పీళ్లు చేసుకొని దావాలు కొనసాగించుటకు మరియు ఆయా కోర్టులలో నేను జరుపవలసిన యావత్తు లిఖిత వాగ్రూపక చర్యలన్నియు నా తరపున మీరు జరుపుటకు;`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`పైన తెలిపిన అన్ని సంధర్భములలోను నా తరపున మీరు జరుపు యావత్తు లిఖిత వాగ్రూపక చర్యలన్నియు నేనే స్వయముగా వుండి, జరిపినట్లుగా యెంచుకోగలను.`,{align:'left',lineGap:0});
		// 				if(covenantArr && covenantArr.length >0){
		// 					for(let i of covenantArr){
		// 						pdfDocs.fontSize('13').text(`${i}`,{align:'justify',lineGap:1});
		// 					}
		// 				}
		// 				pdfDocs.addPage();
		// 			}
		// 			pdfDocs.addPage();
		// 			let x1=40,y1=180;
		// 			if(data?.property && data.property?.length >0){
		// 				let propLangth = data.property.length;
		// 				let tMValue=0;
		// 				let dataI =0;
		// 				pdfDocs.fontSize('13').text(`షెడ్యూలు ఆస్తి వివరము`,{align:'center',lineGap:0,underline:true});
		// 				pdfDocs.moveDown();
		// 				for(let i of data.property){
							
		// 					dataI = dataI ===0 ? 1 : dataI + 1;
		// 					tMValue = tMValue + i.marketValue
		// 					x1=40,y1=180;
		// 					let [landUse,rest1] =i.landUse.split('[')
		// 					pdfDocs.fontSize('13').text(`షెడ్యూల్ ${i.seqNumber} : ${toTitleCase(landUse)}`,x1,130,{align:'left',lineGap:0});
		// 					pdfDocs.fontSize('13').text(`ఆస్తి యుండు ప్రదేశము`,x1,160,{align:'left',lineGap:0});
		// 					pdfDocs.moveDown();
		// 					let header1='రిజిస్ట్రేషన్ జిల్లా';
		// 					// i.sroOffice ="YYYYYYYYYYYYYY"
		// 					// i.mandal= "tripuranthakam"
		// 					// console.log("&&&&&&&&&&&&&&&&&&&&&&&&",String(i.sroOffice).length,String(i.village).length,String(i.mandal).length)
		// 					// let rowHeight ;
		// 					// let vgHeight,mdHight,sroHight;
		// 					// vgHeight =String(i.village).length;
		// 					// mdHight = String(i.mandal).length;
		// 					// sroHight = String(i.mandal).length;
		// 					let Dist = await toTitleCase(i.district);
		// 					let sroOffice = await toTitleCase(i.sroOffice);
		// 					let village = await toTitleCase(i.village);
		// 					let mandal = await toTitleCase(i.mandal);
		// 					pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,20).moveTo(150,180).lineTo(150,200).moveDown(0.1)
		// 					.text(header1,x1+2,y1+2,{indent:5, align:'left',fontSize:'16'}).moveTo(300,180).lineTo(300,200)
		// 					.text(`సబ్ రిజిస్ట్రార్ కార్యాలయము`,x1+112,y1+2,{indent:5, align:'left',fontSize:'16'})
		// 					.moveTo(430,180).lineTo(430,200)
		// 					.text(`రెవెన్యూ గ్రామము`,x1+262,y1+2,{indent:5, align:'left',fontSize:'16'})
		// 					.text(`మండలము`,x1+392,y1+2,{indent:5, align:'left',fontSize:'16'})
		// 					.moveTo(150,180).lineTo(150,220)
		// 					.text(`${Dist}`,x1+2,y1+22,{indent:5, align:'left',fontSize:'16'})
		// 					.moveTo(300,200).lineTo(300,220)
		// 					.text(`${sroOffice}`,x1+112,y1+22,{width:140,indent:5, align:'left',fontSize:'16'})
		// 					.moveTo(430,200).lineTo(430,220)
		// 					.text(`${village}`,x1+259,y1+22,{width:120,indent:5, align:'left',fontSize:'16'})
		// 					.text(`${mandal}`,x1+388,y1+22,{width:122,indent:5, align:'left',fontSize:'16'})
		// 					.lineWidth(1).stroke();
		// 					x1= 40;y1=187;
		// 					// pdfDocs.text('jsshggssf',x1,y1+40)
		// 					pdfDocs.moveDown()
		// 					let lBD =""
		// 					if(String(i.localBodyType).includes('[')){
		// 						let [rest,localbody]= i.localBodyType.split('[');
		// 						let [localbody2,rest2] = localbody.split(']');
		// 						lBD=localbody2;
		// 					}
	
		// 					pdfDocs.rect(x1,y1+40,500,20).rect(40,y1+60,500,20).moveTo(300,y1+40).lineTo(300,y1+60)
		// 					.text(`రెవెన్యూ జిల్లా`,42,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 					.text(`స్థానిక సంస్థ / పంచాయతీ`,300,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 					.moveTo(300,y1+60).lineTo(300,y1+80)
		// 					.text(`${toTitleCase(i.district)}`,42,y1+62,{indent:5, align:'left',fontSize:'16'})
		// 					.text(`${toTitleCase(lBD)}`,300,y1+62,{indent:5, align:'left',fontSize:'16'})
		// 					.lineWidth(1).stroke();
		// 					x1=40;y1=262+10;
		// 					pdfDocs.fontSize('13').text(`ఆస్థి సర్వే విస్తీర్ణము మరియు విలువలు వివరములు (రూల్-3 స్టేటుమెంటు):`,x1,y1);
	
		// 					let locality = i.locality != "" ? toTitleCase(locality) : toTitleCase(i.habitation);
		// 					let propType = i.propertyType.includes('RURAL') ? 'RURAL':'URBAN';
		// 					y1=y1+20;
		// 					pdfDocs.fontSize('13').text(`Locality : ${locality}`,x1,y1);
		// 					if(propType === "URBAN"){
		// 						pdfDocs.rect(x1,y1+20,500,20).rect(x1,y1+40,500,20).moveTo(x1+55,y1+20).lineTo(x1+55,y1+60)
		// 						.text(`Ward`,x1+2,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(134,y1+20).lineTo(134,y1+60)
		// 						.text(`Block`,x1+57,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(182,y1+20).lineTo(182,y1+60)
		// 						.text(`Door`,x1+100,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(250,y1+20).lineTo(250,y1+60)
		// 						.text(`Survey No`,x1+140,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(330,y1+20).lineTo(330,y1+60)
		// 						.text(`Total Extent`,x1+207,y1+22,{indent:5, align:'left',fontSize:'16'}).moveTo(400,y1+20).lineTo(400,y1+60)
		// 						.text(`Undivided`,x1+286,y1+22,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`Market value`,x1+366,y1+22,{indent:5, align:'left',fontSize:'16'})
		// 						// .text(`Market value`,x1+400,y1+42,{indent:5, align:'left',fontSize:'16'}).moveTo(440,y1+40).lineTo(440,y1+80)
	
		// 						.text(`${i.ward}`,42,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${i.block}`,x1+57,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${i.doorNo}`,x1+102,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${i.survayNo}`,x1+145,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${i.extent}`,x1+208,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${i.undividedShare}`,330,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${i.marketValue}`,400,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 						//.text(`${i.marketValue}`,x1+402,y1+62,{indent:5, align:'left',fontSize:'16'})
		// 						.lineWidth(1).stroke();
		// 						let [scProp,rest] = i.schedulePropertyType.split('[');
		// 						scProp= scProp.trim();
		// 						if(scProp =="FLAT" || scProp =="HOUSE"){
		// 							pdfDocs.text(`Structure Details :`,40,y1+60,{align:'left'});
		// 						}
		// 						if(scProp =="FLAT"){
		// 							pdfDocs.text(`Apartment Name : ${toTitleCase(i.appartmentName)}`,40,y1+80,{align:'left'});
		// 							pdfDocs.text(`No of Floors : ${i.totalFloors}`,110,y1+80,{align:'right'});
		// 						}
		// 						pdfDocs.moveDown();
								
		// 						// pdfDocs.text('sudhakar',x1,y1)
		// 						if(i.structure && i.structure.length >0){
		// 							x1=40, y1=y1+95;
		// 							for(let j in i.structure){
		// 								let [strType,rest] = i.structure[j].structureType.split('[');
		// 								let [stageOfCons,rest2] = i.structure[j].stageOfCons.split('[');
		// 								let rowHeight = String(stageOfCons).length >16 ?40 :20;
		// 								let rowLine = String(stageOfCons).length >16 ? 60:40
		// 								pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,rowHeight).moveTo(x1+85,y1).lineTo(x1+85,y1+rowLine)
		// 								.text(`floorNo`,x1+2,y1+2,{indent:5, align:'left',fontSize:'16'}).moveTo(x1+230,y1).lineTo(x1+230,y1+rowLine)
		// 								.text(`Structure type`,x1+105,y1+2,{indent:5, align:'left',fontSize:'16'}).moveTo(x1+303,y1).lineTo(x1+303,y1+rowLine)
		// 								.text(`Plinth`,x1+235,y1+2,{indent:5, align:'left',fontSize:'16'}).moveTo(x1+462,y1).lineTo(x1+462,y1+rowLine)
		// 								.text(`Stage of Cons`,x1+304,y1+2,{indent:5, align:'left',fontSize:'16'})
		// 								.text(`Age`,x1+464,y1+2,{indent:5, align:'left',fontSize:'16'})
		// 								.text(`${i.structure[j].floorNo}`,x1+2,y1+22,{indent:5, align:'left',fontSize:'16'})
		// 								.text(`${toTitleCase(strType)}`,x1+85,y1+22,{width:150,indent:5, align:'left',fontSize:'16'})
		// 								.text(`${i.structure[j].plinth}`,x1+235,y1+22,{indent:5, align:'left',fontSize:'16'})
		// 								.text(`${toTitleCase(stageOfCons)}` ,x1+304,y1+22,{width:200,indent:5, align:'left',fontSize:'16'})
		// 								.text(`${i.structure[j].age}`,x1+464,y1+22,{indent:5, align:'left',fontSize:'16'})
		// 								.lineWidth(1).stroke();
		// 								// pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,40).moveTo(x1+85,y1).lineTo(x1+85,y1+40)
		// 								// .lineWidth(1).stroke();
		// 							}
		// 						}
	
	
		// 						if(scProp == "FLAT"){
		// 							x1=40,y1=y1+22+60;
		// 							pdfDocs.text(`Flat Boundary Details :`,x1,y1);
		// 							x1=40,y1=y1+20;
		// 							let east = await  toTitleCase(i.flatEastBoundry)
		// 							let west = await  toTitleCase(i.flatWestBoundry)
		// 							let north = await  toTitleCase(i.flatNorthBoundry)
		// 							let south = await  toTitleCase(i.flatSouthBoundry)
		// 							pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,20).rect(x1,y1+40,500,20).rect(x1,y1+60,500,20).moveTo(x1+100,y1).lineTo(x1+100,y1+80)
		// 							.text(`EAST`,x1+2,y1+2,{indent:5, align:'left',fontSize:'16'})
		// 							.text(`WEST`,x1+2,y1+22,{indent:5, align:'left',fontSize:'16'})
		// 							.text(`NORTH`,x1+2,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 							.text(`SOUTH`,x1+2,y1+62,{indent:5, align:'left',fontSize:'16'})
		// 							.text(`${east}`,x1+102,y1+2,{indent:5, align:'left',fontSize:'16'})
		// 							.text(`${west}`,x1+102,y1+22,{indent:5, align:'left',fontSize:'16'})
		// 							.text(`${north}`,x1+102,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 							.text(`${south}`,x1+102,y1+62,{indent:5, align:'left',fontSize:'16'})
		// 							.lineWidth(1).stroke();
		// 						}
	
								
		// 						x1=40,y1=y1+62+20;
		// 						pdfDocs.text(`Apartment Boundary Details :`,x1,y1);
		// 						x1=40,y1=y1+20;
		// 						// pdfDocs.rect(x1,y1)
		// 						let eastBry = await  toTitleCase(i.eastBoundry);
		// 						let westBry = await  toTitleCase(i.westBoundry);
		// 						let northBry = await  toTitleCase(i.northBoundry);
		// 						let southBry = await  toTitleCase(i.southBoundry);
		// 						pdfDocs.rect(x1,y1,500,20).rect(x1,y1+20,500,20).rect(x1,y1+40,500,20).rect(x1,y1+60,500,20).moveTo(x1+100,y1).lineTo(x1+100,y1+80)
		// 						.text(`EAST`,x1+2,y1+2,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`WEST`,x1+2,y1+22,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`NORTH`,x1+2,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`SOUTH`,x1+2,y1+62,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${eastBry}`,x1+102,y1+2,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${westBry}`,x1+102,y1+22,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${northBry}`,x1+102,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${southBry}`,x1+102,y1+62,{indent:5, align:'left',fontSize:'16'})
		// 						.lineWidth(1).stroke();
		// 						pdfDocs.addPage();
		// 					}else if(propType === "RURAL"){
		// 						pdfDocs.rect(x1,y1+40,500,20).rect(x1,y1+60,500,20).moveTo(150,y1+40).lineTo(150,y1+80)
		// 						.text(`సర్వే/సబ్ నెంబర్. లు`,x1+2,y1+42,{indent:5, align:'left',fontSize:'16'}).moveTo(300,y1+40).lineTo(300,y1+80)
		// 						.text(`బదలాయించు విస్తీర్ణము`,x1+112,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`మార్కెట్ విలువ`,x1+262,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${i.survayNo}`,42,y1+62,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${i.tExtent}`,152,y1+62,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${i.marketValue}`,302,y1+62,{indent:5, align:'left',fontSize:'16'})
		// 						.lineWidth(1).stroke();
		// 						x1=40;y1=y1+62+40;
	
		// 						pdfDocs.rect(x1,y1,500,20).rect(40,y1+20,500,20).rect(40,y1+40,500,20).rect(40,y1+60,500,20).moveTo(150,y1).lineTo(150,y1+80)
		// 						.text(`తూర్పు`,42,y1+2,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`పడమర`,42,y1+22,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`ఉత్తరం`,42,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`దక్షణం`,42,y1+62,{indent:5, align:'left',fontSize:'16'})
						
		// 						.text(`${toTitleCase(i.eastBoundry)}`,152,y1+2,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${toTitleCase(i.westBoundry)}`,152,y1+22,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${toTitleCase(i.northBoundry)}`,152,y1+42,{indent:5, align:'left',fontSize:'16'})
		// 						.text(`${toTitleCase(i.southBoundry)}`,152,y1+62,{indent:5, align:'left',fontSize:'16'})
		// 						.lineWidth(1).stroke();
		// 						if(propLangth === dataI){
		// 							x1=40;y1=y1+62+20;
		// 							pdfDocs.fontSize('12').text(`సుంకం నిర్ధారణ నిమిత్తం :`,x1+2,y1,{align:'left'});
		// 							x1=40;y1=y1+40;
		// 							pdfDocs.rect(x1,y1,500,20).moveTo(320,y1).lineTo(320,y1+20)
		// 							.text(`ఛార్జ్ చేయదగిన విలువ (తదుపరి 500/- వరకు)`,42,y1+2,{indent:5, align:'left',fontSize:'16'})
		// 							.text(`${tMValue}`,320,y1+2,{indent:5, align:'left',fontSize:'16'})
		// 							.lineWidth(1).stroke();
		// 						}
		// 						pdfDocs.addPage();
		// 					}
		// 					// x1=40;y1=y1+62+40;
	
		// 					// if(y1 === 300){
		// 					// 	pdfDocs.addPage();
		// 					// }
		// 				}
		// 			}
	
	
		// 			if(DocNum === "01"){
		// 			   pdfDocs.addPage()
		// 				x1=40;y1=20;
		// 				pdfDocs.fontSize('13').text(`అమలు వివరాలు`,x1,y1,{align:'left',lineGap:0,underline:true});
		// 				x1=40;y1=y1+20;
		// 				pdfDocs.fontSize('13').text(`ఈ దస్తావేజు లోని అన్ని విషయములను క్షుణ్ణముగా అర్ధము చేసుకొని సంతృప్తి చెంది సంపూర్ణ అంగీకారముతో ఈ దిగువ సాక్షుల సమక్షమున సంతకములు చేయడమైనది.`,x1,y1,{align:'left',lineGap:0});
		// 				x1=40;y1=y1+60;
		// 				pdfDocs.fontSize('15').text(`అమ్మినవారు :`,40,y1,{align:'left'});
		// 				if(data?.executent && data?.executent.length >0){
		// 					let exNo =1
		// 					for(let i of data.executent){
		// 						let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0,8),"XXXX XXXX XXXX ") : "xxxx xxxx xxxx";
		// 						let panOrTanOrForm60Header = i.panNoOrForm60or61 ? "PAN/Form60" :i.panNoOrForm60or61 ==="" && i.tan ==="" ? "PAN/Form60" :"TAN";
		// 						let panOrTanOrForm60Value = i.panNoOrForm60or61 ? i.panNoOrForm60or61 : i.tan;
		// 						if(y1 >= 580){
		// 							pdfDocs.addPage();
		// 							y1 =100+50;
		// 						}
		// 						y1= y1+30;
		// 						pdfDocs.fontSize('12').text(`${exNo}`,60,y1,{align:'left'});
		// 						y1= y1+30;
		// 						pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: ${toTitleCase(i.name)}`+'\n'+`ఆధార్ నెంబర్ : ${aadhar}`+'\n'+`${panOrTanOrForm60Header} : ${panOrTanOrForm60Value}`,80,y1,{align:'left'});
		// 						exNo = exNo+1;
		// 						y1 =y1+50;
		// 					}
		// 				}else{
		// 					y1= y1+30;
		// 					pdfDocs.fontSize('12').text(`${"1"}`,60,y1+30,{align:'left'});
		// 					y1= y1+30;
		// 					pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: XXXXXXX`+'\n'+`ఆధార్ నెంబర్ :XXXXXX`+'\n'+'FORM60',80,y1,{align:'left'});;
		// 					y1= y1+30;
		// 				}
		// 				y1 = y1+50;
		// 				pdfDocs.fontSize('15').text(`కొనుగోలుదారు :`,40,y1,{align:'left'});
		// 				let exNo =1
		// 				if(data?.claimant && data?.claimant.length >0){
		// 					for(let i of data?.claimant){
		// 						let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0,8),"XXXX XXXX XXXX ") : "xxxx xxxx xxxx";
		// 						let panOrTanOrForm60Header = i.panNoOrForm60or61 ? "PAN/Form60" :i.panNoOrForm60or61 ==="" && i.tan ==="" ? "PAN/Form60" :"TAN";
		// 						let panOrTanOrForm60Value = i.panNoOrForm60or61 ? i.panNoOrForm60or61 : i.tan;
		// 						y1= y1+30;
		// 						pdfDocs.fontSize('12').text(`${exNo}`,60,y1,{align:'left'});
		// 						let name = i.name ? toTitleCase(i.name) :"";
		// 						let adhar = i.aadhaar ? i.aadhaar :""
		// 						y1= y1+30;
		// 						pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: ${toTitleCase(i.name)}`+'\n'+`ఆధార్ నెంబర్ : ${aadhar}`+'\n'+`${panOrTanOrForm60Header} : ${panOrTanOrForm60Value}`,80,y1,{align:'left'});
		// 						exNo = exNo+1;
		// 						y1 =y1+50;
		// 					}
		// 				pdfDocs.moveDown();
		// 				pdfDocs.fontSize('13').text(`యిందుకు సాక్షులు`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`1. `,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`2. `,{align:'left',lineGap:0});
							
		// 				}else{
		// 					y1= y1+30;
		// 					pdfDocs.fontSize('12').text(`${"1"}`,60,y1+30,{align:'left'});
		// 					y1= y1+30;
		// 					pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: XXXXXXX`+'\n'+`ఆధార్ నెంబర్ :XXXXXX`+'\n'+'FORM60',80,y1,{align:'left'});
		// 					y1= y1+30;
		// 				pdfDocs.moveDown();
		// 				pdfDocs.fontSize('13').text(`యిందుకు సాక్షులు`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`1. `,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`2. `,{align:'left',lineGap:0});
		// 				}
		// 			}else if(DocNum === "02"){
						
		// 				pdfDocs.fontSize('13').text(`షెడ్యూలు ఆస్తి ప్రభుత్వము వారిది కాదనియు ప్రభుత్వము వారిచే ఎసైను చేయబడినది కాదనియు,ప్రభుత్వమూ వారికీ తనఖా పెట్టబడినది కాదనయు ,మరియు ప్రజోపయోగ నిమిత్తము కేటాయించబడనిది కాదనియు యిందుమూలముగా ద్రువీకరించుచున్నాము`,{align:'justify'});
		// 				pdfDocs.fontSize('13').text(`యిది మా సమ్మతిని వ్రాయించి యిచ్చిన స్థిరాస్థి అస్వాధీన తనఖా దస్తావేజు.`,{align:'justify'});
		// 				pdfDocs.fontSize('18').text(`యిందుకు సాక్షులు`,{align:'justify',underline:true,bold:true});
		// 				pdfDocs.fontSize('13').text(`\n1.`,{align:'justify'});
		// 				pdfDocs.fontSize('13').text(`\n2.`,{align:'justify'});
	
		// 			}else if(DocNum =="03"){
		// 				pdfDocs.fontSize('13').text(`ఆస్థి బదిలీ వివరాలు`,{align:'center',lineGap:0,underline:true});
		// 				pdfDocs.fontSize('13').text(`ఈ దస్తావేజు లోని అన్ని విషయములను క్షుణ్ణంగా అర్థం చేసుకొని సంతృప్తి చెంది సంపూర్ణ అంగీకారంతో ఈ దిగువ సాక్షుల సమక్షమున సంతకములు చేయడమైనది.`,40,100,{align:'left',lineGap:0})
		// 				y =100 +50
		// 				pdfDocs.fontSize('15').text(`దాత :`,40,y,{align:'left'});
		// 				if(data.executent && data.executent.length >0){
		// 					let exNo =1
		// 					for(let i of data.executent){
		// 						let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0,8),"XXXX XXXX ") : "xxxx xxxx xxxx";
		// 						let panOrTanOrForm60Header = i.panNoOrForm60or61 ? "PAN/Form60" :i.panNoOrForm60or61 ==="" && i.tan ==="" ? "PAN/Form60" :"TAN";
		// 						let panOrTanOrForm60Value = i.panNoOrForm60or61 ? i.panNoOrForm60or61 : i.tan;
		// 						if(y >= 580){
		// 							pdfDocs.addPage();
		// 							y =100+50;
		// 						}
		// 						y= y+30;
		// 						// let aadhar = i.aadhaar.replaceAll(i.aadhaar.substring(0,8),"xxxxxxxx")
		// 						pdfDocs.fontSize('12').text(`${exNo}`,60,y,{align:'left'});
		// 						y= y+30;
		// 						pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: ${i.name}`+'\n'+`ఆధార్ నెంబర్ : ${aadhar}`+'\n'+`${panOrTanOrForm60Header} : ${panOrTanOrForm60Value}`,80,y,{align:'left'});
		// 						exNo = exNo+1;
		// 						y =y+50;
		// 					}
		// 				}else{
		// 					y= y+30;
		// 					pdfDocs.fontSize('12').text(`${"1"}`,60,y+30,{align:'left'});
		// 					y= y+30;
		// 					pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: XXXXXXX`+'\n'+`ఆధార్ నెంబర్ :XXXX XXXX XXXX`+'\n'+'FORM60',80,y,{align:'left'});
		// 					y= y+30;
		// 				}
		// 				y = y+50;
		// 				pdfDocs.fontSize('15').text(`గ్రహీత :`,40,y,{align:'left'});
		// 				if(data.claimant && data.claimant.length >0){
		// 					let exNo =1
		// 					for(let i of data.claimant){
		// 						let aadhar = i.aadhaar ? String(i.aadhaar).replace(String(i.aadhaar).substring(0,8),"XXXX XXXX ") : "xxxx xxxx xxxx";
		// 						let panOrTanOrForm60Header = i.panNoOrForm60or61 ? "PAN/Form60" :i.panNoOrForm60or61 ==="" && i.tan ==="" ? "PAN/Form60" :"TAN";
		// 						let panOrTanOrForm60Value = i.panNoOrForm60or61 ? i.panNoOrForm60or61 : i.tan;
		// 						y= y+30;
		// 						pdfDocs.fontSize('12').text(`${exNo}`,60,y,{align:'left'});
		// 						y= y+30;
		// 						pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: ${i.name}`+'\n'+`ఆధార్ నెంబర్ : ${aadhar}`+'\n'+`${panOrTanOrForm60Header} : ${panOrTanOrForm60Value}`,80,y,{align:'left'});
		// 						exNo = exNo+1;
		// 						y =y+50;
		// 					}

		// 				}else{
		// 					y= y+30;
		// 					pdfDocs.fontSize('12').text(`${"1"}`,60,y+30,{align:'left'});
		// 					y= y+30;
		// 					pdfDocs.fontSize('12').text(`సంతకము :`+'\n'+`పేరు: XXXXXXX`+'\n'+`ఆధార్ నెంబర్ :XXXX XXXX XXXX`+'\n'+'FORM60',80,y,{align:'left'});
		// 					y= y+30;
		// 					pdfDocs.fontSize('13').text(`యిందుకు సాక్షులు`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`1.                                                            1 వ పార్టీ :`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`2                                                             2 వ పార్టీ :`,{align:'left',lineGap:0});
		// 				}
		// 			}else if(DocNum =="07"){
		// 				pdfDocs.fontSize('13').text(`యిది మన సమ్మతిన వ్రాసుకున్న స్థిరాస్తి అద్దె యెగ్రిమెంటు.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`యిందుకు సాక్షులు`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`1.                                                            1 వ పార్టీ :`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`2                                                             2 వ పార్టీ :`,{align:'left',lineGap:0});
		// 			}else if(DocNum == "05"){
		// 				pdfDocs.fontSize('13').text(`యిది నా సమ్మతిన వ్రాయించి యిచ్చిన స్థిరాస్తి హక్క విడుదల దస్తావేజు.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`యిందుకు సాక్షులు`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`1.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`2.`,{align:'left',lineGap:0});
		// 			}else if(DocNum == "06"){
		// 				pdfDocs.fontSize('13').text(`ఎ, బి - షెడ్యూళ్ల ఆస్తులు ప్రభుత్వము వారివి కావనియు, ప్రభుత్వము వారిచే ఎస్పైన్ చేయబడినవి. కావనియు, ప్రభుత్వము వారికి తనఖా పెట్టబడినవి కావనియు మరియు ప్రజోపయోగ నిమిత్తం కేటాయించబడినవి కావనియు యిందుమూలముగా ధృవీకరించు చున్నాము.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`యిది నా సమ్మతిన వ్రాయించి యిచ్చిన స్థిరాస్తి పరటా దస్తావేజు. యిందుకు సాక్షులు`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`యిందుకు సాక్షులు`,{align:'left',lineGap:0,underline:true});
		// 				pdfDocs.fontSize('13').text(`1.                                                         1 వ పార్టీ :`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`2.                                                         2 వ పార్టీ :`,{align:'left',lineGap:0});
		// 			}
		// 			else if(DocNum == "04"){
		// 				pdfDocs.fontSize('13').text(`యిది నా సమ్మతిన వ్రాయించి యిచ్చిన స్థిరాస్తి పార్టీషన్ దస్తావేజు.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`యిందుకు సాక్షులు`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`1.                                                         1 వ పార్టీ :`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`2.                                                         2 వ పార్టీ :`,{align:'left',lineGap:0});
		// 			}else if(DocNum == "09"){
		// 				pdfDocs.fontSize('13').text(`యిది నా సమ్మతిన వ్రాయించి యిచ్చిన జనరల్ పవర్ ఆఫ్ అటార్నీ.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`యిందుకు సాక్షులు`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`1.`,{align:'left',lineGap:0});
		// 				pdfDocs.fontSize('13').text(`2.`,{align:'left',lineGap:0});
		// 			}
					
		// 		// }
		// 		pdfDocs.end();
		// 		createFileData.on('finish', resolve);
		// 		// return ;
		// 	});
		// }else 
		if(type =='pai'){
			let {paiGenarateDocs} = require('./reports/pai/pai');
			let paiDocs = await paiGenarateDocs(data,path);
			return paiDocs;
		}
		else{
			let {telGenarateDocs} = require(`./reports/${data.documentNature.TRAN_MAJ_CODE}/${data.documentNature.TRAN_MAJ_CODE}${data.documentNature.TRAN_MIN_CODE}`);
			let hj =await telGenarateDocs(data,path);
			return hj;
		}


		// if(data.documentNature.TRAN_MAJ_CODE =="04"){
		// 	let {telGenarateDocs} = require(`./reports/${data.documentNature.TRAN_MAJ_CODE}/${data.documentNature.TRAN_MAJ_CODE}${data.documentNature.TRAN_MIN_CODE}`);
		// 	let hj =await telGenarateDocs(data,path);
		// 	return hj;
		// }
	}catch(ex){
		console.log("ERROR ::",ex.message);
		throw new PDEError(ex.message);
	}
}


const toTitleCase = (phrase) => {
	if (typeof phrase !== 'string') return '';
	phrase = phrase?.replace(/ +/g, ' ');
	return phrase
		.toLowerCase()
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

async function NumToWord(amount) {
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
  const formatDate = (d, returnCurrentDate = false) => {
  let x;
  if (d) {
    if (d.includes('/')) {
      x = d.split('/');
      let a = x[0];
      x[0] = x[1];
      x[1] = a;
    }
  }
  else {
    return '--'
  }
  const date = returnCurrentDate ? new Date() : new Date(x ? x.join('/') : (`${d}`.includes('T') && `${d}`.includes('Z')) ? Date.parse(d.substr(0, d.length - 1)) : d);
  return z(date.getDate()) + '/' + z(date.getMonth() + 1) + '/' + date.getFullYear()
}
 function z(n) { return (n < 10 ? '0' : '') + n }


module.exports ={generatReport,genTeluguReports};