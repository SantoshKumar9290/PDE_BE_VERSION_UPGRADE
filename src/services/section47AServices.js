const PDEError = require("../errors/customErrorClass");
const orDbDao = require('../dao/oracleDbDaos')
const { Logger } = require('../../services/winston');
const { Error } = require("../handlers/errorHandler");
const { constructPDEError } = require("../handlers/errorHandler");
const axios = require("axios");
const fsone = require('fs');
const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib')
const pdfjsLib = require('pdfjs-dist');
const { generatePDFFromHTML } = require("./generatePDFFromHTML");
const MvaDao = require("../dao/masterDataVillageDao");
const _ = require('lodash');

const convertBase64ToPdf = async (base64String) => {
  const decodedBuffer = Buffer.from(base64String, 'base64');
  const pdfDoc = await PDFDocument.load(decodedBuffer)
  return pdfDoc.save();
}
const savePdfToFile = async (pdfBytes, filePath) => {
  await fs.writeFile(filePath, pdfBytes);
  console.log(`PDF saved to ${filePath}`);
  return true;
};
const https = require('https');
const fileResolver = require("../utils/fileResolver");

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});
class section47AService {
  constructor() {
    this.orDao = new orDbDao();
    this.MvaDao = new MvaDao();
  }




  extractTextWithPositionsFromPDF = async (pdfFilePath) => {
    const data = new Uint8Array(fsone.readFileSync(pdfFilePath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;

    let textWithPositions = [];

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const content = await page.getTextContent();
      content.items.forEach(item => {
        textWithPositions.push({
          text: item.str,
          position: {
            x: item.transform[4],
            y: item.transform[5]
          },
          page: i
        });
      });
    }

    return textWithPositions;
  }

  Section47ApublicDocsrvc = async (reqData) => {
    // console.log(reqData, 'namedispal');  
    try {
      let bindparam = {'SR_CODE':reqData.sroCode};
      const currentYear = new Date().getFullYear();
      let query =`SELECT a.sr_cd, a.sr_name, c.DR_NAME FROM sr_master a
         JOIN CARD.MST_REVREGDIST c ON a.dr_cd = c.dr_code WHERE a.sr_cd = :SR_CODE`;
      let mastreresponse = await this.orDao.oDBQueryServiceWithBindParams(query, bindparam);     
        const imagePath = path.join(__dirname, `../../logos/ap_logo.jpg`);
        let Imagedatapath = fsone.readFileSync(imagePath, { encoding: 'base64' });

        let html = `
 <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <div style="text-align: center;">
     <div style="display: inline-block;">
            <img src="data:image/jpeg;base64,${Imagedatapath}" alt="Header image" style="max-width:90px; height:90px; display: inline-block; vertical-align: middle;"/>
           </div>
           <div style="display: inline-block; text-align: left; vertical-align: middle;">
              <h3 style="margin-top: 15px; margin-bottom: 0; font-size:15px">REGISTRATIONS & STAMPS DEPARTMENT</h3>
              <h5 style="margin-top: 10px; margin-left: 37px">GOVERNMENT OF ANDHRA PRADESH</h5>
           </div>
   </div>
    <title>Section47A Request Form</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1;
        }
        .letter-header, .letter-footer {
            margin-bottom: 20px;
        }
        .letter-body {
            margin-bottom: 40px;
        }
        .signature {
            margin-top: 40px;
        }
    </style>
</head>
<body>
<div class="letter-header" style="display: flex; justify-content: space-between; margin-bottom: 20px;">
    <div style="flex: 1; text-align: left;">
        <p><strong>From:</strong></p>
        <p>${reqData.presenter[0].name}<br>${reqData.presenter[0].address}</p>
        <p><strong>Through:</strong> ${reqData.sroOffice}-${reqData.sroCode}</p>
    </div>
    <div style="flex: 1; text-align: right;">
        <p><strong>To:</strong><br>The District Registrar,<br>${mastreresponse[0].DR_NAME}<br></p>
    </div>
</div>
    <div class="letter-body">
        <p><strong>Subject:</strong> Market value – Section 47A of Indian Stamp Act, 1899 – ${reqData.presenter[0].name} – Request for reassessing the market value by collector under Section 47 A of Indian Stamp Act – Request – Reg.</p>
        ${reqData.property.map((item, index) =>`<p>
            I would like to bring to your attention that I have purchased a property measuring <strong> ${item.conveyedExtent[0].extent} ${item.conveyedExtent[0].unit}</strong>, located in Survey No. <strong>${item.survayNo}, ${item.village}</strong>
            village/town
        </p>`).join('')}  <p> from Sri ${reqData.executent.map((item, index) =>`${item.name},` ).join('')} 
         The consideration paid for the purchase was Rs. ${reqData.amount}/-, for which I duly paid the 
            applicable stamp duties and other charges as required, as evidence by Challan No............ dated [.............]
        </p>
        <p>
            I visited the Sub-Registrar office ${reqData.sroOffice} to completed the registration formalities for the said property. However, I was 
            informed that the market value of the property has been fixed at Rs. ${reqData.tmarketValue}, which is significantly higher than the agreed 
            purchase value. I do not agree with this higher market value and request that it not be adopted for the purpose of registering the 
            document.
        </p>
        <p>
            Furthermore, I have already paid the full stamp duty and fee at the rate of 7.5% along with user charges based on the agreed market value. 
            Additionally, I have deposited Rs. ${(reqData.tmarketValue-reqData.amount)/2}/- as 50% of the differential value, which represents the difference between the market 
            value determined by the Market Value Revision Committee and the agreed market value.
        </p>
        <p>
            In light of the above, I kindly request that the Sub-Registrar ${reqData.sroOffice} forward my application to the District Registrar 
           <strong> ${mastreresponse[0].DR_NAME} </strong> for a reassessment of the market value fixed for the property under Section 47A of the Indian Stamp Act, 1899.
        </p>
        <p>
            I trust that you will consider my request and take appropriate action to resolve this matter.
        </p>
        <p>Thank you for your attention to this issue.</p>
        <p>Yours sincerely,</p>
        <p>${reqData.presenter[0].name}<br>${reqData.presenter[0].address}</p>
    </div>
</body>
</html>
`

        // let section47Adirectory = path.join(__dirname, `../../../pdfs/`);
        // let endorsementDirectiory = Path.join(__dirname, `../../public/`);
        // let section47Adirectory = path.join(process.env.file_path, `/`);
        // if (!fsone.existsSync(section47Adirectory)) {
        //   fsone.mkdirSync(section47Adirectory, { recursive: true });
        // }
        // section47Adirectory = `${section47Adirectory}/uploads/`;

        // if (!fsone.existsSync(section47Adirectory)) {
        //   fsone.mkdirSync(section47Adirectory, { recursive: true });
        // }
        // section47Adirectory = `${section47Adirectory}${currentYear}/`;
        // if (!fsone.existsSync(section47Adirectory)) {
        //   fsone.mkdirSync(section47Adirectory, { recursive: true });
        // }
        // section47Adirectory = `${section47Adirectory}${reqData.sroCode}/`;
        // if (!fsone.existsSync(section47Adirectory)) {
        //   fsone.mkdirSync(section47Adirectory, { recursive: true });
        // }
        // // const filename = `${section47Adirectory}section47ADocument_${reqData.applicationId`}.pdf`;

        // const filename = await fileResolver.resolve(`${section47Adirectory}section47ADocument_${reqData.applicationId}.pdf`);
        // const pdfBuffer = await generatePDFFromHTML(html, filename,{});
        // // const pdfPath = path.join(__dirname, filename);
        // const pdfdata = await require('fs').promises.readFile(filename);
        // const base64Pdf = pdfdata.toString('base64');
        // return base64Pdf;

        const relativeDirectoryPath = path.join(
          'uploads',
          String(currentYear),
          String(reqData.sroCode)
        );

        const section47Adirectory = await fileResolver.getNewServerPath(
          relativeDirectoryPath
        );

        console.log("Section47AServices - Section47ApublicDocsrvc || section47Adirectory is ", section47Adirectory);

        await fileResolver.ensureDirectoryExists(section47Adirectory);

        const relativeFilePath = path.join(
          'uploads',
          String(currentYear),
          String(reqData.sroCode),
          `section47ADocument_${reqData.applicationId}.pdf`
        );

        console.log("Section47AServices - Section47ApublicDocsrvc || relativeFilePath is ", relativeFilePath);

        const filename = await fileResolver.getNewServerPath(relativeFilePath);

        console.log("Section47AServices - Section47ApublicDocsrvc || filename is ", filename);

        const pdfBuffer = await generatePDFFromHTML(html, filename, {});

        const pdfdata = await fs.promises.readFile(filename);
        const base64Pdf = pdfdata.toString('base64');

        console.log("Section47AServices - Section47ApublicDocsrvc || base64Pdf is ", base64Pdf);

        return base64Pdf;
      
    } catch (ex) {
      Logger.error("Section47AServices - Section47ApublicDocsrvc || Error :", ex);
      console.error("Section47AServices - Section47ApublicDocsrvc || Error :", ex);
      throw constructPDEError(ex);
    }
  };

  pdfpreviewSrvc = async (reqData) => {
    try {

      const relativePath = path.join(
        'uploads',
        String(reqData.REG_YEAR),
        String(reqData.SR_CODE),
        '1',
        String(reqData.REQ_NO),
        'mvAssistanceReport.pdf'
      );

      const filePath = await fileResolver.getNewServerPath(relativePath);
      console.log("Section47AServices - pdfpreviewSrvc || filePath is ", filePath);

      const pdfBuffer = await fs.promises.readFile(filePath);

      const base64Pdf = pdfBuffer.toString('base64');

      return base64Pdf;

    } catch (ex) {

      console.error("Error in PDFPreview:", ex);
      throw ex;
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
      console.error("ESignServices - igrsEsignAxiosCall || Error :", ex.message);
      throw constructPDEError(ex);
    }
  }

  generateForm2PDF47ASrvc = async (reqData) => {
    try {
        const Sec47aQuery = `select * from pde_doc_status_cr ps 
        join srouser.tran_section_47a ts on ps.sr_code=ts.sr_code and ps.doct_no=ts.doct_no where ts.form2_status = 'Y'`
        const verifyQuery = `
                select b.sr_cd from (          
                select sr.dr_cd from employee_login_master a
                join sr_master sr on a.sr_code = sr.sr_cd
                where a.empl_name = :EMPL_NAME and a.designation = 'District Registrar') a
                join sr_master b on a.dr_cd = b.dr_cd and b.sr_cd = :SR_CODE`;
        const query = `select sr_cd, sr_name from sr_master where sr_cd = :SR_CODE`;
        const bindParams = {
            SR_CODE : reqData.SR_CODE
        }
        const bindParams1 = {
          EMPL_NAME : reqData.EMPL_NAME
        }
        const bindParams2 = {
          SR_CODE : reqData.SR_CODE,
          DOCT_NO : reqData.DOCT_NO,
          BOOK_NO : reqData.BOOK_NO,
          REG_YEAR : reqData.REG_YEAR
        }
        let sec47aResult = await this.orDao.oDBQueryServiceWithBindParams(Sec47aQuery, bindParams2);
        if(sec47aResult.length > 0 && sec47aResult[0].COUNT > 0) {
          throw new Error("Form 2 already generated");
        }
        let verifyResult = await this.orDao.oDBQueryServiceWithBindParams(verifyQuery, {...bindParams,...bindParams1});
        if(verifyResult.length === 0) {
          throw new Error("Not authorized to generate the form 2");
        }
        const drQuery = `select dr.dr_name from employee_login_master a
                        join sr_master sr on a.sr_code = sr.sr_cd
                        join dr_master dr on sr.dr_cd = dr.dr_cd
                        where a.empl_name = :EMPL_NAME and a.designation = 'District Registrar'`;
        let response = await this.orDao.oDBQueryServiceWithBindParams(query, bindParams);
        let drResult = await this.orDao.oDBQueryServiceWithBindParams(drQuery, bindParams1);
        if(response.length === 0 || drResult.length === 0) {
          throw new Error("No data found");
        }
        const imagePath = path.join(__dirname, `../../logos/ap_logo.jpg`);
        const data = fs.readFileSync(imagePath , {encoding : 'base64'});
        const html = `<div style="text-align: center; margin:20px; margin-top:0 ">
            <div><img src="data:image/jpeg;base64,${data}" alt="Header image" style="max-width:75px"/></div>
            <h3 style="margin:0px; margin-top : 5px">GOVERNMENT OF ANDHRA PRADESH</h3>
            <h4 style="margin:0px; margin-top : 5px">REGISTRATIONS & STAMPS DEPARTMENT</h4>
            <h5 style="margin:0px; margin-top : 8px; text-decoration : underline;">FORM - 2(vide Rule 4(i))</h5>
            <div style="font-weight: 600; text-align: center; margin-top: 10px; font-size : 14px;">
                [Form of notice prescribed under Rule 4 of the Andhra Pradesh Stamp (Presentation of Undervaluation of instruments) Rules, 1975]
            </div>
            <div style="margin-top: 10px; font-size : 14px; line-height: 1.8;">
                <div>To</div>
                <div style="text-align : justify;">
                  Please take notice that under sub-section(1) of Section 47-A of the Indian Stamp (Andhra Pradesh Amendment) Act,
                  1971 (Act No.22 of 1971), a reference has been received from the registering officer
                  <span style="font-weight : 600;">${response[0].SR_NAME}(${response[0].SR_CD})</span> for determination of the market
                  value of the perperties/ the consideration covered by the instrument registered as check slip No <span style="font-weight : 600;">${reqData.DOCT_NO}/${reqData.REG_YEAR}</span>
                  dated the ............. and the duty payable on the above instrument.
                </div>
                <div>
                  (A copy of the reference is enclosed)
                </div>
                <div style="text-align : justify;">
                  2. You are hereby required to submit your representation, if any in writing. to the undersigned within twenty-one days
                  from the date of service of this notice, to show that the market value of the properties/the consideration has been truly
                  and correctly setforth in the instrument. You may also produce all evidence in support of your representation within the time allowed.
                </div>
                <div style="text-align : justify;">
                  3. If no representation is received within the time allowed, the matter will be disposed of on the basis of material available.
                </div>
            </div>
            <div style = "font-size : 14px;">
              <div style="display:flex; justify-content:space-between; margin-top: 15px;">
                  <div><span style = "font-weight : 600;">Office :</span> ${drResult[0].DR_NAME}</div>
              </div>
              <div style="display:flex; justify-content:space-between; margin-top: 5px;">
                  <div><span style = "font-weight : 600;">Date :</span> ${moment().format('DD-MM-YYYY')}</div>
                  <div><span style = "font-weight : 600;">Signature</span></div>
              </div>
            </div>
            </div>
        `;
        // let section47aDirectory = `/pdfs/uploads/Section47A/${reqData.SR_CODE}/${reqData.BOOK_NO}/${reqData.DOCT_NO}/${reqData.REG_YEAR}/`;
        // let section47aDirectory = path.join(process.env.file_path, `uploads/Section47A/${reqData.SR_CODE}/${reqData.BOOK_NO}/${reqData.DOCT_NO}/${reqData.REG_YEAR}/`);
        // if (!fs.existsSync(section47aDirectory)) {
        //   fs.mkdirSync(section47aDirectory, { recursive: true });
        // }
        // // const filename = `${section47aDirectory}document_${reqData.SR_CODE}_${reqData.BOOK_NO}_${reqData.DOCT_NO}_${reqData.REG_YEAR}_form2.pdf`;

        // const filename = await fileResolver.resolve(`${section47aDirectory}document_${reqData.SR_CODE}_${reqData.BOOK_NO}_${reqData.DOCT_NO}_${reqData.REG_YEAR}_form2.pdf`);
        // await this.generatePDFFromHTML(html,filename);
        // let pdfBuffer = await fs.promises.readFile(filename);
        // const isFileSaved = fs.existsSync(filename);
        // if(isFileSaved) {
        //     const base64Pdf = pdfBuffer.toString('base64');
        //     return base64Pdf;
        //   }
        
        // else {
        //   throw new Error("Re-generate the Form - 2");
        // }

      const relativeDirectoryPath = path.join(
        'uploads',
        'Section47A',
        String(reqData.SR_CODE),
        String(reqData.BOOK_NO),
        String(reqData.DOCT_NO),
        String(reqData.REG_YEAR)
      );

      const section47aDirectory = await fileResolver.getNewServerPath(
        relativeDirectoryPath
      );

      await fileResolver.ensureDirectoryExists(section47aDirectory);

      const relativeFilePath = path.join(
        'uploads',
        'Section47A',
        String(reqData.SR_CODE),
        String(reqData.BOOK_NO),
        String(reqData.DOCT_NO),
        String(reqData.REG_YEAR),
        `document_${reqData.SR_CODE}_${reqData.BOOK_NO}_${reqData.DOCT_NO}_${reqData.REG_YEAR}_form2.pdf`
      );

      console.log("Section47AServices - generateForm2PDF47ASrvc || relativeFilePath is ", relativeFilePath);

      const filename = await fileResolver.getNewServerPath(relativeFilePath);

      console.log("Section47AServices - generateForm2PDF47ASrvc || filename is ", filename);

      await this.generatePDFFromHTML(html, filename);

      let pdfBuffer = await fs.promises.readFile(filename);

      const isFileSaved = fs.existsSync(filename);

      if (isFileSaved) {
        const base64Pdf = pdfBuffer.toString('base64');
        return base64Pdf;
      } else {
        throw new Error("Re-generate the Form - 2");
      }
    } catch (ex) {
        Logger.error("Section47AServices - generateForm2PDF47ASrvc || Error :", ex);
        console.error("Section47AServices - generateForm2PDF47ASrvc || Error :", ex);
        throw constructPDEError(ex);
    }
  }


 
};


module.exports = section47AService;