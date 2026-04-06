const puppeteer = require('puppeteer');
async function generatePDFFromHTML(html, filename) {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage(); 
    await page.setContent(html);
    const totalPages = await page.evaluate(() => {
      const pageHeight = 595; 
      const contentHeight = document.documentElement.scrollWidth; // Use scrollWidth for landscape orientation
      return Math.ceil(contentHeight / pageHeight);
    });
 let landscapeparam;
 let filenamecondition;
 if(filename== true){
  landscapeparam=true;
  filenamecondition='';
 }
 else{
  landscapeparam=false;
  filenamecondition=filename;
 }
   let pdfbuffer= await page.pdf({
path: filenamecondition,
format: 'A4',
landscape: landscapeparam,
margin: {
  top: '20px',
  right: '10px',
  bottom: '15px',
  left: '10px',
},
displayHeaderFooter: true,
footerTemplate: `
  <div style="font-size: 10px; color: #333; text-align: center; margin-left: 250px">
    Page <span class="pageNumber"></span> of ${totalPages - 1}
  </div>
  <div style="font-size: 10px; color: #333; text-align: center; margin-left: 100px">
    Generated on: ${new Date().toLocaleString()}
  </div>`,
      margin: { top: '20mm', bottom: '20mm' }
    });
    await browser.close();
    return pdfbuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

module.exports = { generatePDFFromHTML };
