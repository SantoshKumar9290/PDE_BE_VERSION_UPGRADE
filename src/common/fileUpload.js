const multer = require('multer');
const fs = require('fs');
const Path =require('path');
const fileResolver = require('../utils/fileResolver');
class FileUpload {
	
    uploadStorage = multer.diskStorage({
		
        // destination: function (req, file, cb) {
		// 	const reqParams =req.params;
		// 	let imageDir;
		// 	if(reqParams.fileName === 'document' || reqParams.fileName === 'anywheredocument' || reqParams.fileName === 'deathCertificate' || reqParams.fileName === 'familyMemberCertificate' || reqParams.fileName === 'mutationApplication'){
		// 		imageDir=Path.join(__dirname,`../../../../../pdfs/${reqParams.documentId}`);
		// 		fs.mkdirSync(imageDir, { recursive: true })
		// 	}else{
		// 		imageDir=`./public/uploads/${reqParams.documentId}`;
		// 		fs.mkdirSync(imageDir, { recursive: true })
		// 	} 
        //     if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
        //         cb(null, imageDir)
        //     } else if (file.mimetype == "application/pdf") {
        //         cb(null, imageDir)
        //     } else {
        //         cb(new Error('invalid file type.'))
        //     }
        // },
		destination: function (req, file, cb) {
			(async () => {
				try {

					const reqParams = req.params;
					let imageDir;

					const PDF_TYPES = [
						'document',
						'anywheredocument',
						'deathCertificate',
						'familyMemberCertificate',
						'mutationApplication'
					];

					// if (PDF_TYPES.includes(reqParams.fileName)) {

					imageDir = await fileResolver.getNewServerPath(reqParams.documentId);

					// } else {

						// imageDir = await fileResolver.getNewServerPath(
						// 	Path.join('public', 'uploads', reqParams.documentId)
						// );

					// }

					await fs.promises.mkdir(imageDir, { recursive: true });

					if (
						file.mimetype === "image/png" ||
						file.mimetype === "image/jpg" ||
						file.mimetype === "image/jpeg" ||
						file.mimetype === "application/pdf"
					) {
						cb(null, imageDir);
					} else {
						cb(new Error("Invalid file type."));
					}

				} catch (err) {
					cb(err);
				}
			})();
		},
        filename: function (req, file, cb) {
			const reqParams =req.params;
			if(file.mimetype == "application/pdf"){
				if(reqParams.fileName === undefined){
					cb(null,file.fieldname +'.pdf')
				}else{
					cb(null, reqParams.fileName + '.pdf');
				}

			}else{
				if(reqParams.fileName ==undefined){
					cb(null,file.fieldname +'.png')
				}else{
					cb(null, reqParams.fileName + '.png');
				}
				
			}
            
        }
    });
    uploadStore = multer({ storage: this.uploadStorage });
}

module.exports = new FileUpload({});
