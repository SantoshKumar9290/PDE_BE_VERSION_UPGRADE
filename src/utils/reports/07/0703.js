const pdfDoc = require("pdfkit");
const fs = require("fs");
const { fontSize } = require("pdfkit");
const { pdeStyle } = require("../../pdfStyles/engDocs");
const PDEError = require("../../../errors/customErrorClass");
const { covanantsData } = require("../../pdfStyles/covanants");
const Path = require("path");
const puppeteer = require("puppeteer");
const hbs = require("handlebars");

let STATIC_COVNENTS_COUNT = 9;

const engGenarateDocs = async (data, path) => {
  try {
    STATIC_COVNENTS_COUNT = 10;
    let englishHtmlFilePath = Path.join(
      __dirname,
      `../htmlFiles/07/03/english.hbs`
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
      `../htmlFiles/07/03/telugu.hbs`
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

function NumToWord(amount) {
  var str = new String(amount);
  var splt = str.split("");
  var rev = splt.reverse();
  var once = [
    "Zero",
    " One",
    " Two",
    " Three",
    " Four",
    " Five",
    " Six",
    " Seven",
    " Eight",
    " Nine",
  ];
  var twos = [
    "Ten",
    " Eleven",
    " Twelve",
    " Thirteen",
    " Fourteen",
    " Fifteen",
    " Sixteen",
    " Seventeen",
    " Eighteen",
    " Nineteen",
  ];
  var tens = [
    "",
    "Ten",
    " Twenty",
    " Thirty",
    " Forty",
    " Fifty",
    " Sixty",
    " Seventy",
    " Eighty",
    " Ninety",
  ];

  numLength = rev.length;
  var word = new Array();
  var j = 0;

  for (i = 0; i < numLength; i++) {
    switch (i) {
      case 0:
        if (rev[i] == 0 || rev[i + 1] == 1) {
          word[j] = "";
        } else {
          word[j] = "" + once[rev[i]];
        }
        word[j] = word[j];
        break;

      case 1:
        aboveTens();
        break;

      case 2:
        if (rev[i] == 0) {
          word[j] = "";
        } else if (rev[i - 1] == 0 || rev[i - 2] == 0) {
          word[j] = once[rev[i]] + " Hundred ";
        } else {
          word[j] = once[rev[i]] + " Hundred and";
        }
        break;

      case 3:
        if (rev[i] == 0 || rev[i + 1] == 1) {
          word[j] = "";
        } else {
          word[j] = once[rev[i]];
        }
        if (rev[i + 1] != 0 || rev[i] > 0) {
          word[j] = word[j] + " Thousand";
        }
        break;

      case 4:
        aboveTens();
        break;

      case 5:
        if (rev[i] == 0 || rev[i + 1] == 1) {
          word[j] = "";
        } else {
          word[j] = once[rev[i]];
        }
        if (rev[i + 1] !== "0" || rev[i] > "0") {
          word[j] = word[j] + " Lakh";
        }

        break;

      case 6:
        aboveTens();
        break;

      case 7:
        if (rev[i] == 0 || rev[i + 1] == 1) {
          word[j] = "";
        } else {
          word[j] = once[rev[i]];
        }
        if (rev[i + 1] !== "0" || rev[i] > "0") {
          word[j] = word[j] + " Crore";
        }
        break;

      case 8:
        aboveTens();
        break;

      default:
        break;
    }
    j++;
  }

  function aboveTens() {
    if (rev[i] == 0) {
      word[j] = "";
    } else if (rev[i] == 1) {
      word[j] = twos[rev[i - 1]];
    } else {
      word[j] = tens[rev[i]];
    }
  }

  word.reverse();
  var finalOutput = "";
  for (i = 0; i < numLength; i++) {
    finalOutput = finalOutput + word[i];
  }
  return finalOutput;
}

module.exports = { engGenarateDocs, telGenarateDocs };
