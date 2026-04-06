const pdfDoc = require("pdfkit");
const fs = require("fs");
const { fontSize } = require("pdfkit");
const { pdeStyle } = require("../../pdfStyles/engDocs");
const PDEError = require("../../../errors/customErrorClass");
const { covanantsData } = require("../../pdfStyles/covanants");
const Path = require("path");
const puppeteer = require("puppeteer");
const hbs = require("handlebars");

let STATIC_COVNENTS_COUNT = 0;

const engGenarateDocs = async (data) => {
  try {
    var [dd, m, yyyy] = data.executionDate.split("/");
    // var dd = String(exDate.getDate()).padStart(2, '0');
    var mm = new Date(`${yyyy}-${m}-${dd}`).toLocaleDateString("en-US", {
      month: "long",
    });
    pdeStyle.content = [];
    y = data.eStamp === "N" ? 400 : 550;
    if (data.status == "DRAFT") {
      pdeStyle.watermark.text = "DRAFT";
    }
    let covenantArr = [];
    if (data?.covanants) {
      let sNo = 9;
      data?.covanants?.covanants.map((covn) => {
        let val = sNo === 9 ? `${sNo}.${covn.value}` : `\n${sNo}.${covn.value}`;
        covenantArr = [...covenantArr, val];
        sNo = sNo + 1;
      });
    }
    let [subDesc, disc] = data.documentNature.TRAN_DESC.split("[");
    let [TRAN_DESC, rest] = data.registrationType.TRAN_DESC
      ? data.registrationType.TRAN_DESC.split("[")
      : ["", ""];
    pdeStyle.content.push({
      text: `${subDesc} DEED`.toUpperCase(),
      alignment: "center",
      bold: true,
      decoration: "underline",
      margin: [10, y, 0, 0],
    });
    pdeStyle.content.push(" ");
    pdeStyle.content.push({
      text: `This ${subDesc.toUpperCase()} DEED is made and executed on this  ${
        data.executionDate
      }, by :`,
      style: ["p1sideHeaders"],
    });
    let party1Text, party2Text;
    if (data?.executent && data?.executent.length > 0) {
      for (var i = 0; i < data.executent.length; i++) {
        let address = data?.executent[i]?.address.replace(/\n/g, "");
        let name = data?.executent[i]?.name
          ? toTitleCase(data?.executent[i]?.name)
          : "............";
        let relationType = data?.executent[i]?.relationType
          ? data?.executent[i]?.relationType
          : "............";
        let relationName = data?.executent[i]?.relationName
          ? toTitleCase(data?.executent[i]?.relationName)
          : "............";
        let age = data?.executent[i]?.age
          ? data?.executent[i]?.age
          : "............";
        if (data?.executent[i].partyType === "Public") {
          pdeStyle.content.push({
            text: `\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(
              address
            )}`,
            style: ["p1Text"],
          });
          pdeStyle.content.push({
            text: `\n(Hereinafter called the “FIRST PARTY” which expression shall wherever it occurs in this deed include her heirs, executors, assignees and administrators.)`,
          });
        } else {
          pdeStyle.content.push({
            text: `M/s .${name}, ${address} is represented by`,
            style: ["p1Text"],
          });
        }

        if (
          data.executent[i]?.represent &&
          data.executent[i]?.represent.length > 0
        ) {
          for (let j in data.executent[i]?.represent) {
            let address = data?.executent[i]?.represent[j]?.address.replace(
              /\n/g,
              ""
            );
            let name = data?.executent[i]?.represent[j]?.name
              ? toTitleCase(data?.executent[i]?.represent[j]?.name)
              : "............";
            let relationType = data?.executent[i]?.represent[j]?.relationType
              ? data?.executent[i]?.represent[j]?.relationType
              : "............";
            let relationName = data?.executent[i]?.represent[j]?.relationName
              ? toTitleCase(data?.executent[i]?.represent[j]?.relationName)
              : "............";
            let age = data?.executent[i]?.represent[j]?.age
              ? data?.executent[i]?.represent[j]?.age
              : "............";

            if (data?.executent[i].partyType === "Public") {
              if (j === 0) {
                pdeStyle.content.push({
                  text: `Represented By :`,
                  style: ["p1Text"],
                });
              }
              pdeStyle.content.push({
                text: `\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(
                  address
                )}`,
                style: ["p1Text"],
              });
            } else {
              pdeStyle.content.push({
                text: `\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(
                  address
                )}`,
                style: ["p1Text"],
              });
            }
          }
        }
      }
    } else {
      pdeStyle.content.push({
        text: `\nMr/Mrs. ..............., ......................... , aged about ............ years,Presently residing at ...................`,
        style: ["p1Text"],
      });
    }
    pdeStyle.content.push({
      text: "AND",
      alignment: "center",
      bold: true,
      decoration: "underline",
      margin: [10, 10, 0, 0],
    });
    if (data?.claimant && data?.claimant.length > 0) {
      for (var i = 0; i < data.claimant.length; i++) {
        let address = data?.claimant[i]?.address.replace(/\n/g, "");
        let name = data?.claimant[i]?.name
          ? toTitleCase(data?.claimant[i]?.name)
          : "............";
        let relationType = data?.claimant[i]?.relationType
          ? data?.claimant[i]?.relationType
          : "............";
        let relationName = data?.claimant[i]?.relationName
          ? toTitleCase(data?.claimant[i]?.relationName)
          : "............";
        let age = data?.claimant[i]?.age
          ? data?.claimant[i]?.age
          : "............";
        if (data?.claimant[i].partyType === "Public") {
          pdeStyle.content.push({
            text: `\nMr/Mrs. ${name}, ${relationType} ${relationName} , aged about ${age}  years, Presently residing at ${toTitleCase(
              address
            )}`,
            style: ["p1Text"],
          });
          pdeStyle.content.push({
            text: `\n(Hereinafter called the “SECOND PARTY”  which expression shall wherever it occurs in this deed includes his heirs, executors, assignees and administrators).`,
          });
        } else {
          pdeStyle.content.push({
            text: `M/s .${name}, ${address} is represented by`,
            style: ["p1Text"],
          });
        }

        if (
          data.claimant[i]?.represent &&
          data.claimant[i]?.represent.length > 0
        ) {
          for (let j in data.claimant[i]?.represent) {
            let address = data?.claimant[i]?.represent[j]?.address.replace(
              /\n/g,
              ""
            );
            let name = data?.claimant[i]?.represent[j]?.name
              ? toTitleCase(data?.claimant[i]?.represent[j]?.name)
              : "............";
            let relationType = data?.claimant[i]?.represent[j]?.relationType
              ? data?.claimant[i]?.represent[j]?.relationType
              : "............";
            let relationName = data?.claimant[i]?.represent[j]?.relationName
              ? toTitleCase(data?.claimant[i]?.represent[j]?.relationName)
              : "............";
            let age = data?.claimant[i]?.represent[j]?.age
              ? data?.claimant[i]?.represent[j]?.age
              : "............";

            if (data?.claimant[i].partyType === "Public") {
              pdeStyle.content.push({
                text: `Represented By :`,
                style: ["p1Text"],
              });
              pdeStyle.content.push({
                text: `\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(
                  address
                )}`,
                style: ["p1Text"],
              });
            } else {
              pdeStyle.content.push({
                text: `\nMr/Mrs. ${name}, ${relationType}.${relationName} , aged about ${age} years,Presently residing at ${toTitleCase(
                  address
                )}`,
                style: ["p1Text"],
              });
            }
          }
        }
      }
      // pdeStyle.content.push({text: `Herein after called the '${partyType2}' of the second part`,style:["p1Points"]});
    } else {
      pdeStyle.content.push({
        text: `\nMr/Mrs. ................, ......................... , aged about ............ years,Presently residing at ....................`,
        style: ["p1Text"],
      });
    }
    // pdeStyle.content.push({
    //     text:`Whereas the First Party had purchased the site/House/Flat/Agriculture measuring _____ Sq.yards/Acres _____ Sq.meters/ Hectares covered by S.Nos. ____ of ______ Village/ within the limits of Municipal Corporation of -------- under mentioned below documents..`,style:["p1Text"]
    // });
    // pdeStyle.content.push({
    //     text:`Whereas the schedule mentioned properties have been acquired by the parties through a ____________ deed registered in their favour as No.________ /_______ at SRO __________ . Since then the above parties are in peaceful possession and enjoyment of all the properties.`,style:["p1Text"]
    // });
    pdeStyle.content.push({
      text: `WHEREAS, as it was not possible to jointly enjoy the schedule mentioned properties, the above parties have decided to divide the schedule mentioned properties among themselves. They have discussed, agreed and mutually decided to effect partition of the said properties between them in the manner hereinafter described in the presence of their elders and well wishers. `,
      style: ["p1Text"],
    });
    if (TRAN_DESC) {
      if (data?.property && data.property.length > 0) {
        for (let i in data?.property) {
          let [landUse, rest] = data.property[i].landUse
            ? data.property[i].landUse.split("[")
            : ["............", ""];
          let [acr, cent] = data?.property[i]?.tExtent
            ? data.property[i].tExtent.split(".")
            : ["............", "............"];
          if (cent == undefined) {
            cent = "00";
          }
          let linkedText;
          if (
            data?.property[i]?.LinkedDocDetails &&
            data?.property[i]?.LinkedDocDetails?.length > 0
          ) {
            for (let j in data?.property[i]?.LinkedDocDetails) {
              let linkDocNo = data.property[i].LinkedDocDetails[j].linkDocNo
                ? data.property[i].LinkedDocDetails[j].linkDocNo
                : "............";
              let year = data.property[i].LinkedDocDetails[j].regYear
                ? data.property[i].LinkedDocDetails[j].regYear
                : "............";
              let bookNo = data.property[i].LinkedDocDetails[j].bookNo
                ? data.property[i].LinkedDocDetails[j].bookNo
                : "............";
              linkedText = `virtue of registered document bearing the number ${linkDocNo} of ${year} of book ${bookNo}`;
            }
          } else {
            linkedText = `inheritance`;
          }
          let propType = data.property[i].propertyType.includes("RURAL")
            ? "RURAL"
            : "URBAN";
          let msA = propType === "URBAN" ? "Sq.Yards" : "Acres";
          let msB = propType === "URBAN" ? "" : "Cents";
          cent = propType === "URBAN" ? "" : cent;
          let surveyNo = data.property[i].survayNo
            ? data.property[i].survayNo
            : "............";
          let habitation = data.property[i].habitation
            ? data.property[i].habitation
            : "............";
          let mandal = data.property[i].mandal
            ? data.property[i].mandal
            : "............";
          let district = data.property[i].district
            ? data.property[i].district
            : "............";
          // pdeStyle.content.push({text:`Whereas the Parties herein is the absolute owner and possessor of ${toTitleCase(landUse)}  measuring ${acr} ${msA} ${cent} ${msB} forming part of Survey No ${surveyNo} situated at ${toTitleCase(habitation)} of ${toTitleCase(mandal)} Mandal, ${toTitleCase(district)} District , Whereas Parties has acquired the schedule property by ${linkedText} since then the parties is in possession and enjoyment of thesaid site with full and absolute rights free from all encumbrances.`,style:["p3Text1_main1"]})
        }
      }
      pdeStyle.content.push({
        text: `NOW THIS DEED WITNESSESS AS FOLLOWS:`,
        style: ["p3Text1_main1"],
      });
      let sNo = 1;
      let cvStaticArry = [];
      covanantsData.exchange.map((cv) => {
        if (cv.minDocNum == data.documentNature.TRAN_MIN_CODE) {
          let val = sNo === 1 ? `${sNo}.${cv.value}` : `\n${sNo}.${cv.value}`;
          cvStaticArry = [...cvStaticArry, val];
          sNo = sNo + 1;
        }
      });
      pdeStyle.content.push({ text: cvStaticArry, style: ["covanants"] });
      pdeStyle.content.push({ text: covenantArr, style: ["covanants"] });

      //PropertyDetails**
      pdeStyle.content.push({
        text: "SCHEDULE OF PROPERTY",
        alignment: "center",
        bold: true,
        decoration: "underline",
        margin: [10, 10, 0, 5],
      });
      if (data.property && data.property.length > 0) {
        let propLangth = data.property.length;
        let tMValue = 0;
        let dataI = 0;

        for (var i = 0; i < data.property.length; i++) {
          dataI = dataI === 0 ? 1 : dataI + 1;
          tMValue = tMValue + data.property[i].marketValue;
          let [landUse, rest] = data.property[i].landUse.split("[");
          let propType = data.property[i].propertyType.includes("RURAL")
            ? "RURAL"
            : "URBAN";
          pdeStyle.content.push({
            text: [
              {
                text: `Schedule ${data.property[i].seqNumber}:`,
                style: ["f18"],
              },
              { text: ` ${landUse}`, fontSize: "12" },
            ],
          });

          pdeStyle.content.push({
            text: "Location of the Property",
            style: ["sideHeaderNames"],
          });
          pdeStyle.content.push({
            table: {
              widths: [120, 120, 120, 120],
              body: [
                [
                  {
                    text: "Registration District",
                    alignment: "center",
                    bold: true,
                    width: "*",
                    margin: [10, 1, 27, 0],
                  },
                  {
                    text: "Sub Registrar Office",
                    bold: true,
                    alignment: "center",
                    width: "*",
                    margin: [10, 1, 27, 0],
                  },
                  {
                    text: "Village",
                    bold: true,
                    alignment: "center",
                    width: "*",
                    margin: [20, 1, 27, 0],
                  },
                  {
                    text: "Mandal",
                    bold: true,
                    alignment: "center",
                    width: "*",
                    margin: [20, 1, 27, 0],
                  },
                ],
                [
                  {
                    text: `${toTitleCase(data?.property[i].district)}`,
                    alignment: "center",
                  },
                  {
                    text: `${toTitleCase(data?.property[i].sroOffice)}`,
                    alignment: "center",
                  },
                  {
                    text: `${toTitleCase(data?.property[i]?.village)}`,
                    alignment: "center",
                  },
                  {
                    text: `${toTitleCase(data?.property[i]?.village)}`,
                    alignment: "center",
                  },
                ],
              ],
            },
          });
          pdeStyle.content.push(" ");
          pdeStyle.content.push({
            table: {
              widths: [250, 249],
              body: [
                [
                  { text: "Revenue District", alignment: "center", bold: true },
                  { text: "Local Body", bold: true, alignment: "center" },
                ],
                [
                  {
                    text: `${toTitleCase(data?.property[i]?.district)}`,
                    alignment: "center",
                  },
                  {
                    text: `${toTitleCase(data?.property[i]?.sroOffice)}`,
                    alignment: "center",
                  },
                ],
              ],
            },
          });
          pdeStyle.content.push({
            text: "Land Details",
            style: ["sideHeaderNames"],
          });
          const locality =
            data?.property[i].locality != ""
              ? toTitleCase(data?.property[i].locality)
              : toTitleCase(data?.property[i].habitation);
          if (propType === "URBAN") {
            pdeStyle.content.push({
              table: {
                widths: [90, 30, 35, 40, 50, 50, 70, 80],
                body: [
                  [
                    {
                      text: "Locality/Habitation",
                      alignment: "center",
                      bold: true,
                    },
                    { text: "Ward", bold: true, alignment: "center" },
                    { text: "Block", bold: true, alignment: "center" },
                    { text: "Door\nNo", bold: true, alignment: "center" },
                    {
                      text: "Survey/\nTSurvey Number",
                      bold: true,
                      alignment: "center",
                    },
                    {
                      text: "Total Extent\n(Sq.Yards)",
                      alignment: "center",
                      bold: true,
                    },
                    {
                      text: "Undivided \nShare(Sq.Yards)",
                      alignment: "center",
                      bold: true,
                    },
                    { text: "Market value", alignment: "center", bold: true },
                  ],
                  [
                    { text: `${toTitleCase(locality)}`, alignment: "center" },
                    { text: `${data?.property[i].ward}`, alignment: "center" },
                    { text: `${data?.property[i].block}`, alignment: "center" },
                    {
                      text: `${data?.property[i].doorNo}`,
                      alignment: "center",
                    },
                    {
                      text: `${data?.property[i].survayNo}`,
                      alignment: "center",
                    },
                    {
                      text: `${data?.property[i].extent}`,
                      alignment: "center",
                    }, //totalext
                    {
                      text: `${data?.property[i].undividedShare}`,
                      alignment: "center",
                    },
                    {
                      text: `${data?.property[i].marketValue}`,
                      alignment: "center",
                    },
                  ],
                ],
              },
            });
            pdeStyle.content.push({
              columns: [
                { text: "Structure Details", style: ["sideHeaderNames"] },
                {
                  text: `Apartment Name :  ${data?.property[
                    i
                  ].appartmentName.toUpperCase()}`,
                  style: ["sideHeaderNames"],
                },
                {
                  text: `No of Floors : ${data?.property[i].totalFloors}`,
                  style: ["sideHeaderNamesright"],
                },
              ],
            });
            if (data?.property[i]?.structure?.length > 0) {
              for (var j = 0; j < data?.property[i]?.structure.length; j++) {
                let [strType, rest] =
                  data?.property[i]?.structure[j].structureType.split("[");
                let [stage, rest2] =
                  data?.property[i]?.structure[j].stageOfCons.split("[");
                pdeStyle.content.push({
                  table: {
                    body: [
                      [
                        {
                          text: "Floor No",
                          alignment: "center",
                          bold: true,
                          width: "*",
                          margin: [10, 1, 25, 0],
                        },
                        {
                          text: "Structure type",
                          bold: true,
                          alignment: "center",
                          width: "*",
                          margin: [0, 0, 25, 0],
                        },
                        {
                          text: "Plinth(sq feets) ",
                          bold: true,
                          alignment: "center",
                          width: "*",
                          margin: [0, 0, 27, 0],
                        },
                        {
                          text: "Stage of Cons.",
                          bold: true,
                          alignment: "center",
                          width: "*",
                          margin: [0, 0, 25, 0],
                        },
                        {
                          text: "Age",
                          bold: true,
                          alignment: "center",
                          width: "*",
                          margin: [0, 0, 30, 0],
                        },
                      ],

                      [
                        {
                          text: `${data?.property[i]?.structure[j].floorNo}`,
                          alignment: "center",
                        },
                        { text: `${strType}`, alignment: "center" },
                        {
                          text: `${data?.property[i]?.structure[j].plinth}`,
                          alignment: "center",
                        },
                        { text: `${stage}`, alignment: "center" },
                        {
                          text: `${data?.property[i]?.structure[j].age}`,
                          alignment: "center",
                        },
                      ],
                    ],
                  },
                });
              }
            }
            let [scProp, rest] =
              data?.property[i].schedulePropertyType.split("[");
            scProp = scProp.trim();
            if (scProp === "FLAT") {
              pdeStyle.content.push({
                text: "Flat Boundary Details",
                style: ["sideHeaderNames"],
              });
              pdeStyle.content.push({
                table: {
                  widths: [208, 290],
                  body: [
                    [
                      {
                        text: "East",
                        alignment: "left",
                        width: "*",
                        margin: [10, 0, 165, 0],
                      },
                      {
                        text: `${toTitleCase(
                          data?.property[i]?.flatEastBoundry.slice(0, 20)
                        )}`,
                        alignment: "left",
                        margin: [10, 0, 200, 0],
                      },
                    ],
                    [
                      {
                        text: "West",
                        alignment: "left",
                        width: "*",
                        margin: [10, 0, 154, 0],
                      },
                      {
                        text: `${toTitleCase(
                          data?.property[i]?.flatWestBoundry
                        )}`,
                        alignment: "left",
                        margin: [10, 0, 100, 0],
                      },
                    ],
                    [
                      {
                        text: "North",
                        alignment: "left",
                        width: "*",
                        margin: [10, 0, 154, 0],
                      },
                      {
                        text: `${toTitleCase(
                          data?.property[i]?.flatNorthBoundry
                        )}`,
                        alignment: "left",
                        margin: [10, 0, 100, 0],
                      },
                    ],
                    [
                      {
                        text: "South",
                        alignment: "left",
                        width: "*",
                        margin: [10, 0, 154, 0],
                      },
                      {
                        text: `${toTitleCase(
                          data?.property[i]?.flatSouthBoundry
                        )}`,
                        alignment: "left",
                        margin: [10, 0, 100, 0],
                      },
                    ],
                  ],
                },
              });
            }

            if (propLangth === dataI) {
              pdeStyle.content.push({
                text: "Apartment Boundary Details",
                style: ["sideHeaderNames"],
              });
              pdeStyle.content.push({
                table: {
                  widths: [208, 290],
                  body: [
                    [
                      {
                        text: "East",
                        alignment: "left",
                        width: "*",
                        margin: [10, 0, 165, 0],
                      },
                      {
                        text: `${toTitleCase(
                          data?.property[i]?.eastBoundry.slice(0, 20)
                        )}`,
                        alignment: "left",
                        margin: [10, 0, 200, 0],
                      },
                    ],
                    [
                      {
                        text: "West",
                        alignment: "left",
                        width: "*",
                        margin: [10, 0, 154, 0],
                      },
                      {
                        text: `${toTitleCase(data?.property[i]?.westBoundry)}`,
                        alignment: "left",
                        margin: [10, 0, 100, 0],
                      },
                    ],
                    [
                      {
                        text: "North",
                        alignment: "left",
                        width: "*",
                        margin: [10, 0, 154, 0],
                      },
                      {
                        text: `${toTitleCase(data?.property[i]?.northBoundry)}`,
                        alignment: "left",
                        margin: [10, 0, 100, 0],
                      },
                    ],
                    [
                      {
                        text: "South",
                        alignment: "left",
                        width: "*",
                        margin: [10, 0, 154, 0],
                      },
                      {
                        text: `${toTitleCase(data?.property[i]?.southBoundry)}`,
                        alignment: "left",
                        margin: [10, 0, 100, 0],
                      },
                    ],
                  ],
                },
              });
              pdeStyle.content.push(" ");
              pdeStyle.content.push({
                table: {
                  widths: [250, 249],
                  body: [
                    [
                      {
                        text: "Chargeable Value(Round to next 500/-)",
                        alignment: "left",
                        width: "*",
                        margin: [10, 10, 0, 0],
                      },
                      {
                        text: `${tMValue}`,
                        alignment: "left",
                        width: "*",
                        margin: [10, 10, 188, 0],
                      },
                    ],
                  ],
                },
              });
            } else {
              pdeStyle.content.push({
                text: "Apartment Boundary Details",
                style: ["sideHeaderNames"],
              });
              pdeStyle.content.push({
                table: {
                  widths: [208, 290],
                  body: [
                    [
                      {
                        text: "East",
                        alignment: "left",
                        width: "*",
                        margin: [10, 0, 165, 0],
                      },
                      {
                        text: `${toTitleCase(
                          data?.property[i]?.eastBoundry.slice(0, 20)
                        )}`,
                        alignment: "left",
                        margin: [10, 0, 200, 0],
                      },
                    ],
                    [
                      {
                        text: "West",
                        alignment: "left",
                        width: "*",
                        margin: [10, 0, 154, 0],
                      },
                      {
                        text: `${toTitleCase(data?.property[i]?.westBoundry)}`,
                        alignment: "left",
                        margin: [10, 0, 100, 0],
                      },
                    ],
                    [
                      {
                        text: "North",
                        alignment: "left",
                        width: "*",
                        margin: [10, 0, 154, 0],
                      },
                      {
                        text: `${toTitleCase(data?.property[i]?.northBoundry)}`,
                        alignment: "left",
                        margin: [10, 0, 100, 0],
                      },
                    ],
                    [
                      {
                        text: "South",
                        alignment: "left",
                        width: "*",
                        margin: [10, 0, 154, 0],
                      },
                      {
                        text: `${toTitleCase(data?.property[i]?.southBoundry)}`,
                        alignment: "left",
                        margin: [10, 0, 100, 0],
                      },
                    ],
                  ],
                },
                pageBreak: "after",
              });
            }
          }

          if (propType === "RURAL") {
            pdeStyle.content.push({
              table: {
                widths: [120, 100, 120, 140],
                body: [
                  [
                    {
                      text: "Locality/Habitation",
                      alignment: "center",
                      bold: true,
                    },
                    {
                      text: "Survey/\nTSurvey Number",
                      bold: true,
                      alignment: "center",
                    },
                    { text: "conveyedExtent", bold: true, alignment: "center" },
                    { text: "Market value", alignment: "center", bold: true },
                  ],
                  [
                    { text: `${toTitleCase(locality)}`, alignment: "center" },
                    {
                      text: `${data?.property[i].survayNo}`,
                      alignment: "center",
                    },
                    {
                      text: `${data?.property[i].tExtent}`,
                      alignment: "center",
                    },
                    {
                      text: `${data?.property[i].marketValue}`,
                      alignment: "center",
                    },
                  ],
                ],
              },
            });
            pdeStyle.content.push({
              text: "Boundary Details",
              style: ["sideHeaderNames"],
            });
            pdeStyle.content.push({ text: "", style: ["sideHeaderNames"] });
            pdeStyle.content.push({
              table: {
                widths: [208, 290],
                body: [
                  [
                    {
                      text: "East",
                      alignment: "left",
                      width: "*",
                      margin: [10, 0, 165, 0],
                    },
                    {
                      text: `${toTitleCase(
                        data?.property[i]?.eastBoundry.slice(0, 20)
                      )}`,
                      alignment: "left",
                      margin: [10, 0, 200, 0],
                    },
                  ],
                  [
                    {
                      text: "West",
                      alignment: "left",
                      width: "*",
                      margin: [10, 0, 154, 0],
                    },
                    {
                      text: `${toTitleCase(data?.property[i]?.westBoundry)}`,
                      alignment: "left",
                      margin: [10, 0, 100, 0],
                    },
                  ],
                  [
                    {
                      text: "North",
                      alignment: "left",
                      width: "*",
                      margin: [10, 0, 154, 0],
                    },
                    {
                      text: `${toTitleCase(data?.property[i]?.northBoundry)}`,
                      alignment: "left",
                      margin: [10, 0, 100, 0],
                    },
                  ],
                  [
                    {
                      text: "South",
                      alignment: "left",
                      width: "*",
                      margin: [10, 0, 154, 0],
                    },
                    {
                      text: `${toTitleCase(data?.property[i]?.southBoundry)}`,
                      alignment: "left",
                      margin: [10, 0, 100, 0],
                    },
                  ],
                ],
              },
              pageBreak: "after",
            });
          }
          pdeStyle.content.push(" ");
          //}
        }
      } else {
        pdeStyle.content.push({
          text: [
            { text: `Schedule ....:`, style: ["f18"] },
            { text: `.........`, fontSize: "12" },
          ],
        });
        pdeStyle.content.push({
          text: "Location of the Property",
          style: ["sideHeaderNames"],
        });
        pdeStyle.content.push({
          table: {
            widths: [120, 120, 120, 120],
            body: [
              [
                {
                  text: "Registration District",
                  alignment: "center",
                  bold: true,
                  width: "*",
                  margin: [10, 1, 27, 0],
                },
                {
                  text: "Sub Registrar Office",
                  bold: true,
                  alignment: "center",
                  width: "*",
                  margin: [10, 1, 27, 0],
                },
                {
                  text: "Village",
                  bold: true,
                  alignment: "center",
                  width: "*",
                  margin: [20, 1, 27, 0],
                },
                {
                  text: "Mandal",
                  bold: true,
                  alignment: "center",
                  width: "*",
                  margin: [20, 1, 27, 0],
                },
              ],
              [
                { text: ` `, alignment: "center" },
                { text: ` `, alignment: "center" },
                { text: ` `, alignment: "center" },
                { text: ` `, alignment: "center" },
              ],
            ],
          },
        });
        pdeStyle.content.push(" ");
        pdeStyle.content.push({
          table: {
            widths: [250, 249],
            body: [
              [
                { text: "Revenue District", alignment: "center", bold: true },
                { text: "Local Body", bold: true, alignment: "center" },
              ],
              [
                { text: ` `, alignment: "center" },
                { text: ` `, alignment: "center" },
              ],
            ],
          },
        });
        pdeStyle.content.push({
          text: "Land Details",
          style: ["sideHeaderNames"],
        });

        // if(propType === "RURAL"){
        pdeStyle.content.push({
          table: {
            widths: [120, 200, 170],
            body: [
              [
                {
                  text: "Locality/Habitation",
                  alignment: "center",
                  bold: true,
                },
                {
                  text: "Survey/\nTSurvey Number",
                  bold: true,
                  alignment: "center",
                },
                { text: "Market value", alignment: "center", bold: true },
              ],
              [
                { text: `    `, alignment: "center" },
                { text: `     `, alignment: "center" },
                { text: `      `, alignment: "center" },
              ],
            ],
          },
        });
        // }
        pdeStyle.content.push(" ");
        // }else if(naturetype == "Mortgage"){
        pdeStyle.content.push({
          text: `All that the piece and parcel of Agriculture Land bearing Survey No._________   admeasuring Ac. ______ / _______ Hectors, situated in ___________ Village ___________ Mandal _______, under the jurisdiction of Sub District _______  and  Registration District ________ `,
          style: ["p1Text_MR"],
        });
        pdeStyle.content.push({ text: `EAST       : `, style: ["p1Text_MR1"] });
        pdeStyle.content.push({ text: `WEST      : `, style: ["p1Text_MR1"] });
        pdeStyle.content.push({ text: `NORTH   : `, style: ["p1Text_MR1"] });
        pdeStyle.content.push({ text: `SOUTH   : `, style: ["p1Text_MR1"] });
        // }
      }
    }

    if (data?.executent && data?.executent.length > 0) {
      for (var i = 0; i < data.executent.length; i++) {
        let name = data?.executent[i]?.name
          ? toTitleCase(data?.executent[i]?.name)
          : "............";
        if (data?.executent[i].partyType === "Public") {
          pdeStyle.content.push({
            text: `\nFIRST PARTY : ${name}`,
            style: ["p4Text"],
          });
        } else {
          pdeStyle.content.push({
            text: `\nFIRST PARTY : ${name}`,
            style: ["p4Text"],
          });
        }
      }
    }

    if (data?.claimant && data?.claimant.length > 0) {
      for (var i = 0; i < data.claimant.length; i++) {
        let name = data?.claimant[i]?.name
          ? toTitleCase(data?.claimant[i]?.name)
          : "............";
        if (data?.claimant[i].partyType === "Public") {
          pdeStyle.content.push({
            text: `\nSECOND PARTY : ${name}`,
            style: ["p4Text"],
          });
        } else {
          pdeStyle.content.push({
            text: `\nSECOND PARTY : ${name}`,
            style: ["p4Text"],
          });
        }
      }
    }

    pdeStyle.content.push({ text: `WITNESSES :`, style: ["p1last_MRleft"] });

    pdeStyle.content.push({ text: `WITNESSES :`, style: ["p1last_MRleft"] });

    pdeStyle.content.push({ text: `1. ` + `\n`, style: ["p1Text_MR"] });
    pdeStyle.content.push({ text: `2. ` + `\n.`, style: ["p1Text_MR"] });
    return pdeStyle;
  } catch (ex) {
    console.log("error ::", ex.message);
    throw new PDEError({ status: false, message: "Internal Server" });
  }
};

const telGenarateDocs = async (data, path) => {
  try {
    let teluguHtmlFilePath = Path.join(
      __dirname,
      `../htmlFiles/06/01/telugu.hbs`
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

module.exports = { engGenarateDocs, telGenarateDocs };
