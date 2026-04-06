const { createCanvas } = require("canvas");
const JsBarcode = require("jsbarcode");

function generateBarcodeBase64(applicationId) {
    const canvasWidth = 600; 
    const canvasHeight = 200; 
    const canvas = createCanvas(canvasWidth, canvasHeight);
    JsBarcode(canvas, applicationId, {
        format: "CODE128",
        displayValue: true,
        width: 6,
        height: 160,
        margin: 10,
        fontSize: 60,
        text: applicationId, 
        fontOptions: "bold",
        lineColor: "#000000"
    });

    const buffer = canvas.toBuffer("image/png");
    return `data:image/png;base64,${buffer.toString("base64")}`;
}

module.exports = { generateBarcodeBase64 };
