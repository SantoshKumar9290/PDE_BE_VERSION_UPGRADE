const { NAMES } = require("../constants/errors");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("../handlers/errorHandler");
let {generatReport,genTeluguReports} = require('../utils/report');
const Path = require('path');
const pdfMake = require('pdfmake');
const pdfDoc = require('pdfkit');
const mongoose = require('mongoose');
const fs = require('fs');
const PDFMerger = require('pdf-merger-js');
const PDFPageCounter = require('pdf-page-counter');
const { PDFDocument } = require('pdf-lib');
const {Logger} = require('../../services/winston');
const DocumentDetailsDao = require("../dao/documentDetailsDao");
const PartiesService = require("../services/partiesService");
const fileResolver = require("../utils/fileResolver");


var fonts = {
	Roboto: {
	  normal:
		"fonts/telugu.ttf",
	  bold: "node_modules/roboto-font/fonts/Roboto/roboto-bold-webfont.ttf",
	  italics:
		"node_modules/roboto-font/fonts/Roboto/roboto-italic-webfont.ttf",
	  bolditalics:
		"node_modules/roboto-font/fonts/Roboto/roboto-bolditalic-webfont.ttf",
	}
};

class ReportService {
	constructor(){
		this.documentDetailsDao = new DocumentDetailsDao();
		this.partiesService = new PartiesService();
	}

	createTheFile  = async (finalReport, documentPath) => {
		return new Promise(async resolve => {
			let createWriteData ;
			let pdfmake = new pdfMake(fonts);
			// const finalReport = await generatReport(reqData,reportType);
			let pdfDoc = pdfmake.createPdfKitDocument(finalReport, {});
			pdfDoc.pipe(createWriteData = fs.createWriteStream(documentPath));
			pdfDoc.end();
			createWriteData.on('finish', resolve);
		})
	}

	fileResolve  = async (createWriteData) => {
		return new Promise(async resolve => {
			createWriteData.on('finish', resolve);
		})
	}

		
	// report = async (reqData, reqUrl, reportType, loginDetails) => {
	// 	try {

	// 		const baseRelativePath = Path.join(String(reqData.applicationId));

	// 		const basePath = await fileResolver.getNewServerPath(baseRelativePath);

	// 		await fileResolver.ensureDirectoryExists(basePath);

	// 		const nestedRelativePath = Path.join(
	// 			String(reqData.applicationId),
	// 			String(reqData.applicationId)
	// 		);

	// 		const nestedPath = await fileResolver.getNewServerPath(nestedRelativePath);
	// 		await fileResolver.ensureDirectoryExists(nestedPath);

	// 		if (reportType === "formSixty") {
	// 			return `formSixty`;
	// 		}

	// 		if (reportType === "userManual") {
	// 			return `userManual`;
	// 		}

	// 		if (reportType === "document") {
	// 			return `${reqData.applicationId}/document`;
	// 		}

	// 		console.log("ReportService - report", nestedPath);

	// 		const pdfAbsolutePath = Path.join(
	// 			nestedPath,
	// 			`${reportType}.pdf`
	// 		);

	// 		const finalReport = await generatReport(
	// 			reqData,
	// 			reportType,
	// 			pdfAbsolutePath,
	// 			loginDetails
	// 		);

	// 		if (reportType !== "engDocs") {
	// 			await this.createTheFile(finalReport, pdfAbsolutePath);
	// 		}

	// 		let fUrl;

	// 		if (reportType !== "engDocs") {

	// 			fUrl = `${reqData.applicationId}/${reportType}`;

	// 		} else {

	// 			let imageFolder = "";
	// 			let pdfPaths = [];

	// 			const uploadsRelative = Path.join(
	// 				'public',
	// 				'uploads',
	// 				String(reqData.applicationId)
	// 			);

	// 			const uploadsPath = await fileResolver.getNewServerPath(uploadsRelative);

	// 			if (fs.existsSync(uploadsPath) === true) {

	// 				imageFolder = uploadsPath;

	// 				fs.readdirSync(imageFolder).forEach(file => {
	// 					pdfPaths.push(file);
	// 				});

	// 				fs.readdirSync(imageFolder).forEach(file => {
	// 					pdfPaths.push(file);
	// 				});
	// 			}

	// 			if (pdfPaths && pdfPaths.length === 0) {

	// 				fUrl = `${reqData.applicationId}/${reportType}`;

	// 			} else {

	// 				let mergedPath = await this.mergingReports(
	// 					reqData.applicationId,
	// 					reportType
	// 				);

	// 				console.log("Merging REPORTS :::", `${mergedPath}`);
	// 				fUrl = `${mergedPath}`;
	// 			}
	// 		}

	// 		console.log("URL :::", fUrl);
	// 		return fUrl;

	// 	} catch (ex) {

	// 		Logger.error(ex.message);
	// 		console.error("ReportService - report || Error : ", ex.message);
	// 		throw constructPDEError(ex);
	// 	}
	// };

	report = async (reqData, reqUrl, reportType, loginDetails) => {
		try {

			const applicationId = String(reqData.applicationId);

			const baseRelativePath = applicationId;
			let basePath = await fileResolver.getNewServerPath(baseRelativePath);
			console.log("ReportService - report || basePath is ", basePath);
			await fileResolver.ensureDirectoryExists(basePath);


			// if (reportType === "formSixty") {
			// 	// return `${applicationId}/formSixty`;
			// 	basePath = `${basePath}/formSixty`;
			// }

			// if (reportType === "userManual") {
			// 	// return `userManual`;
			// 	basePath = `${basePath}/userManual`;
			// }

			// if (reportType === "document") {
			// 	// return `${applicationId}/document`;
			// 	basePath = `${basePath}/document`;
			// }

			const pdfAbsolutePath = Path.join(
				basePath,
				`${reportType}.pdf`
			);

			console.log("ReportService - report || pdfAbsolutePath is ", pdfAbsolutePath);

			const finalReport = await generatReport(
				reqData,
				reportType,
				pdfAbsolutePath,
				loginDetails
			);

			if (reportType !== "engDocs") {
				await this.createTheFile(finalReport, pdfAbsolutePath);
			}

			let fUrl;

			if (reportType === "engDocs") {

				const uploadsRelative = Path.join(
					// "public",
					"uploads",
					String(applicationId)
				);

				const uploadsPath = await fileResolver.getNewServerPath(uploadsRelative);

				console.log("ReportService - report || uploadsPath is ", uploadsPath);

				let pdfPaths = [];

				if (fs.existsSync(uploadsPath)) {
					fs.readdirSync(uploadsPath).forEach(file => {
						pdfPaths.push(file);
					});
				}

				if (pdfPaths.length === 0) {
					fUrl = `${applicationId}/${reportType}`;
				} else {

					const mergedPath = await this.mergingReports(
						applicationId,
						reportType
					);

					fUrl = mergedPath;
				}

			} else {

				fUrl = `${applicationId}/${reportType}`;
			}

			console.log("Generated URL:", fUrl);
			return fUrl;

		} catch (ex) {

			Logger.error(ex.message);
			console.error("ReportService - report || Error:", ex.message);
			throw constructPDEError(ex);
		}
	};

	teluguReports = async (reqData, rUrl, type) => {
		try {

			console.log("teluguReports - report - reqUrl", rUrl);

			const baseRelativePath = Path.join(String(reqData.applicationId));

			const basePath = await fileResolver.getNewServerPath(baseRelativePath);

			console.log("ReportService - teluguReports || basePath is ", basePath);

			await fileResolver.ensureDirectoryExists(basePath);

			const teluguRelativePath = Path.join(
				String(reqData.applicationId),
				`${type}Telugu.pdf`
			);

			const fPath = await fileResolver.getNewServerPath(teluguRelativePath);

			console.log("ReportService - teluguReports || fPath is ", fPath);

			await genTeluguReports(reqData, fPath, type);

			let pdfPaths = [];
			let fUrl;

			const uploadsRelativePath = Path.join(
				// 'public',
				'uploads',
				String(reqData.applicationId)
			);

			const uploadsPath = await fileResolver.getNewServerPath(uploadsRelativePath);

			console.log("ReportService - teluguReports || uploadsPath is ", uploadsPath);

			if (fs.existsSync(uploadsPath) === true) {

				fs.readdirSync(uploadsPath).forEach(file => {
					pdfPaths.push(file);
				});

				type = `${type}Telugu`;

				let mergedPath = await this.mergingReports(
					reqData.applicationId,
					type
				);

				console.log("Merging REPORTS :::", `${rUrl}/${mergedPath}`);

				fUrl = `${mergedPath}`;

			} else {

				fUrl = `${reqData.applicationId}/${type}Telugu`;
			}

			console.log("URL :::", fUrl);
			return fUrl;

		} catch (ex) {

			Logger.error(ex.message);
			console.log("ERROR :::", ex);
			throw constructPDEError(ex);
		}
	};
	
	mergingReports = async (documentId, type) => {
		try {

			console.log("ReportService - mergingReports ::", documentId, type);

			const baseRelativePath = Path.join(String(documentId));
			const testFolder = await fileResolver.getNewServerPath(baseRelativePath);

			console.log("ReportService - mergingReports || testFolder is ", testFolder);

			const uploadsRelativePath = Path.join(
				// 'public',
				'uploads',
				String(documentId)
			);
			const imageFolder = await fileResolver.getNewServerPath(uploadsRelativePath);

			console.log("ReportService - mergingReports || imageFolder is ", imageFolder);

			let pdfPaths = [];

			if (fs.existsSync(imageFolder)) {
				fs.readdirSync(imageFolder).forEach(file => {
					pdfPaths.push(file);
				});
			}

			if (pdfPaths && pdfPaths.length === 0) {
				throw new PDEError("No Merging Files Found");
			}

			let createWriteData;
			let pdfDocs = new pdfDoc();

			const imagesPdfPath = Path.join(testFolder, "images.pdf");

			console.log("ReportService - mergingReports || imagesPdfPath is ", imagesPdfPath);

			pdfDocs.pipe(
				createWriteData = fs.createWriteStream(imagesPdfPath)
			);

			if (pdfPaths.length > 0) {

				let x1 = 40, y1 = 20;

				for (let i in pdfPaths) {

					if (y1 > 500 && pdfPaths[i]) {
						pdfDocs.addPage();
						y1 = 20;
					}

					let extName = Path.extname(pdfPaths[i]);

					if (extName === ".png" || extName === ".jpg" || extName === ".jpeg") {

						pdfDocs.image(
							Path.join(imageFolder, pdfPaths[i]),
							x1,
							y1,
							{ fit: [400, 400], align: 'left', valign: 'justify' }
						).stroke();

						y1 = y1 + 420;
						pdfDocs.moveDown();
					}
				}

				pdfDocs.end();
			}

			await this.fileResolve(createWriteData);

			var merger = new PDFMerger();

			const mainPdfPath = Path.join(testFolder, `${type}.pdf`);

			console.log("ReportService - mergingReports || mainPdfPath is ", mainPdfPath);

			await merger.add(mainPdfPath);
			await merger.add(imagesPdfPath);

			if (pdfPaths.length > 0) {

				for (let i in pdfPaths) {

					let extName = Path.extname(pdfPaths[i]);

					if (extName === ".pdf") {
						await merger.add(
							Path.join(imageFolder, pdfPaths[i])
						);
					}
				}
			}

			await merger.save(mainPdfPath);

			return `${documentId}/${type}`;

		} catch (ex) {

			Logger.error(ex.message);
			console.log("ERRR :::", ex.message);
			throw constructPDEError(ex.message);
		}
	};

	merge_pdf = async (reqBody) => {

		const baseFolder = String(reqBody.documentId);

		const engRelative = Path.join(baseFolder, 'engDocs.pdf');
		const telRelative = Path.join(baseFolder, 'SaleTelugu.pdf');
		const mergeRelative = Path.join(baseFolder, 'merge.pdf');

		// Resolve paths (auto migrate true)
		const engPath = await fileResolver.resolve(engRelative, false);
		const telPath = await fileResolver.resolve(telRelative, false);

		console.log("ReportService - merge_pdf || engPath is ", engPath);
		console.log("ReportService - merge_pdf || telPath is ", telPath);

		let pdf2Path = telPath;

		let dataBuffer1 = fs.readFileSync(engPath);

		let pdf1Data = await PDFPageCounter(telPath);

		let dataBuffer2 = fs.readFileSync(pdf2Path);

		let pdf2Data = await PDFPageCounter(dataBuffer2);

		var merger = new PDFMerger();

		for (let i = 1; i <= pdf1Data.numpages; i++) {
			for (let j = 1; j <= pdf2Data.numpages; i++) {
				for (let k in dataBuffer1) {
					for (let l in pdf2Path) {
						await merger.add(dataBuffer1[l], pdf1Data.numpages[i]);
						await merger.add(dataBuffer2[k], pdf1Data.numpages[j]);
					}
				}
			}
		}

		// Get absolute save path
		const finalPath = await fileResolver.getNewServerPath(mergeRelative);

		console.log("ReportService - merge_pdf || finalPath is ", finalPath);

		await fileResolver.ensureDirectoryExists(
			Path.dirname(finalPath)
		);

		await merger.save(finalPath);

		return mergeRelative;
	}
	
	getDocumentPartyDetails = async (documentData) => {		
        try {
			const docIdExist = Object.keys(documentData).includes('documentId');
            var documentDbFilter = {...documentData};
			let documentDbResponse;
			if(docIdExist === true){
				documentDbResponse= await this.documentDetailsDao.getOneByFilters(documentDbFilter);
				if(documentDbResponse == null || documentDbResponse.length == 0){
					console.log("ReportService - getDocumentPartyDetails || No Document Present");
					throw new PDEError({name: NAMES.NOT_FOUND, err: "No Document Present"});
				}
				let partySaleDetailsDbResponse = await this.partiesService.getParties(documentDbResponse.documentId);
				console.log("ReportService - getDocumentPartyDetails || partySaleDetailsDbResponse is ", partySaleDetailsDbResponse);

				return partySaleDetailsDbResponse;
			}
        } catch (error) {
			Logger.error(error.message);
            console.error("ReportService - getDocumentPartyDetails ||  Error : ", error);
            throw constructPDEError(error);
        }
    }

	getFileWithFallback = async (localFilePath, documentId, fileName) => {
		try {
			// If file exists locally → return buffer
			if (fs.existsSync(localFilePath)) {
				return fs.readFileSync(localFilePath);
			}

			// If fallback disabled → throw error
			if (process.env.ENABLE_FILE_FALLBACK !== 'true') {
				throw new Error('File not found locally');
			}

			// Fetch from old server
			const oldFileUrl = `${process.env.STATIC_PATH_PDf}/${documentId}/${fileName}`;

			const response = await axios({
				url: oldFileUrl,
				method: 'GET',
				responseType: 'arraybuffer'
			});

			// Save locally (lazy migration)
			const dir = Path.dirname(localFilePath);
			fs.mkdirSync(dir, { recursive: true });

			fs.writeFileSync(localFilePath, response.data);

			return response.data;

		} catch (error) {
			throw new Error('File not found in both servers');
		}
	}

}

module.exports = ReportService;