const Handlebars = require("handlebars");
const nodemailer = require("nodemailer");
const CryptoJs = require('crypto-js');
const path = require('path');
const fs = require('fs')
const fs1 = require('fs').promises;
/**
 * Return a string by adding variables
 * @param {String} string
 * @param {Object} variable
 * @returns {String}
 *
 * @example
 *
 * const str = "Order Id {{existingOrder}} for BU {{businessUnit}} already exists";
 * const variable = {"existingOrder": "12341234", "businessUnit": "facl"}
 * const newStr = parseString(str, variable);
 * console.log(newStr) // "Order Id 12341234 for BU facl already exists";
 */
exports.parseString = function(string, variable) {
  const template = Handlebars.compile(string);
  return template(variable);
};

/**
 * Convert array of string to object with key value pair
 * @param {String[]} arr
 * @returns {Object}
 *
 * @example
 * const arr = ["one", "two", "three"];
 * const returnData = stringArrayToObject(arr);
 * console.log(returnData) // {one: "one", two: "two", three: "three"};
 */
exports.stringArrayToObject = (arr = []) =>
  arr.reduce((acc, next) => {
    acc[next] = next;
    return acc;
}, {});

exports.transportEmail =  nodemailer.createTransport({
	host: "smtp-mail.outlook.com",
    port: 587,
            //secure: false,
    ssl:true,
    auth: {
		user: `${process.env.SMTP_EMAIL}`,
		pass: `${process.env.SMTP_PASSWORD}`
    },
});
exports.diffMinutes = (dt1) =>{
  var diff =(new Date().getTime() - new Date(dt1).getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
  
}

exports.decryptWithAES = (ciphertext) => {
	const passphrase = process.env.adhar_Secret_key
	const bytes = CryptoJs.AES.decrypt(ciphertext, passphrase);
	const originalText = bytes.toString(CryptoJs.enc.Utf8);
	return originalText;
};


exports.encryptWithAESPassPhrase = (originalText, passphrase) => {
	const encryptedText = CryptoJs.AES.encrypt(originalText, passphrase).toString();
	return encryptedText;
};

exports.decryptWithAESPassPhrase = (ciphertext, passphrase) => {
  if(ciphertext == null || ciphertext.length == 0)
    return null;
	const bytes = CryptoJs.AES.decrypt(ciphertext, passphrase);
	const originalText = bytes.toString(CryptoJs.enc.Utf8);
	return originalText;
};
exports.maskAadharNumber = (aadharNumber) =>{
	// Replace all but the last 4 digits with asterisks
	// return String(aadharNumber).replace(/.(?=.{4})/g, '*');
	return aadharNumber;
}

exports.unmaskAadharNumber= (maskedAadharNumber)=> {
	// Remove all the asterisks
	return String(maskedAadharNumber).replace(/\*/g, '');
}

exports.EncryptAdrwithPkcs =(text)=>{
	const parsedkey = CryptoJs.enc.Utf8.parse(process.env.ADR_SECRET_KEY);
    const iv = CryptoJs.enc.Utf8.parse(process.env.ADR_SECRET_IV);
    return CryptoJs.AES.encrypt(text, parsedkey, { iv: iv, mode: CryptoJs.mode.ECB, padding: CryptoJs.pad.Pkcs7 }).toString();
}
exports.DecryptAdrwithPkcs =(encrypted)=>{
	var keys = CryptoJs.enc.Utf8.parse(process.env.ADR_SECRET_KEY);
    let base64 = CryptoJs.enc.Base64.parse(encrypted);
    let src = CryptoJs.enc.Base64.stringify(base64);
    var decrypt = CryptoJs.AES.decrypt(src, keys, { mode: CryptoJs.mode.ECB, padding: CryptoJs.pad.Pkcs7 });
	return decrypt.toString(CryptoJs.enc.Utf8);
}

exports.encryptData = (data) => {
  const parsedkey = CryptoJs.enc.Utf8.parse(process.env.ENC_SECRET_KEY);
  const iv = CryptoJs.enc.Utf8.parse(process.env.ENC_SECRET_IV);
  const encrypted = CryptoJs.AES.encrypt(data, parsedkey, { iv: iv, mode: CryptoJs.mode.ECB, padding: CryptoJs.pad.Pkcs7 });
  return encrypted.toString();
}

exports.decryptData = (encryptedData) => {
  var keys = CryptoJs.enc.Utf8.parse(process.env.ENC_SECRET_KEY);
  let base64 = CryptoJs.enc.Base64.parse(encryptedData);
  let src = CryptoJs.enc.Base64.stringify(base64);
  var decrypt = CryptoJs.AES.decrypt(src, keys, { mode: CryptoJs.mode.ECB, padding: CryptoJs.pad.Pkcs7 });
  return decrypt.toString(CryptoJs.enc.Utf8);
}


exports.maskAadhaar = (aadharNumber) =>{
	return String(aadharNumber).replace(/.(?=.{4})/g, 'X');
}
exports.maskPhoneNumber = (phoneNumber) =>{
  return String(phoneNumber).replace(/.(?=.{4})/g, 'X');
}
exports.maskEmail = (email) => {
    const [name, domain] = email.split("@");
    const visible = name.slice(0, 5);
    const masked = "****";
    return `${visible}${masked}@${domain}`;
};
exports.loadTemplate = (applicationId, data) => {
  const filePath = path.join(__dirname, '../../Form60', `${applicationId}.hbs`);
  const source = fs.readFileSync(filePath, 'utf8');
  const template = handlebars.compile(source);
  return template(data);
};

exports.encryptUID = (data) => {
  const parsedkey = CryptoJs.enc.Utf8.parse(process.env.AADHAAR_ENC_SECRET_KEY);
  const iv = CryptoJs.enc.Utf8.parse(process.env.AADHAAR_ENC_SECRET_IV);
  const encrypted = CryptoJs.AES.encrypt(data, parsedkey, { iv: iv, mode: CryptoJs.mode.ECB, padding: CryptoJs.pad.Pkcs7 });
  return encrypted.toString();
}

exports.AadhardecryptData = (encryptedData) => {
  encryptedData = Buffer.from(encryptedData, 'base64').toString('utf-8');
  var keys = CryptoJs.enc.Utf8.parse(process.env.ENC_SECRET_KEY);
  let base64 = CryptoJs.enc.Base64.parse(encryptedData);
  let src = CryptoJs.enc.Base64.stringify(base64);
  var decrypt = CryptoJs.AES.decrypt(src, keys, { mode: CryptoJs.mode.ECB, padding: CryptoJs.pad.Pkcs7 });
  return decrypt.toString(CryptoJs.enc.Utf8);
}

exports.AadharencryptData = (data) => {
  const parsedkey = CryptoJs.enc.Utf8.parse(process.env.ENC_SECRET_KEY);
  const iv = CryptoJs.enc.Utf8.parse(process.env.ENC_SECRET_IV);
  const encrypted = CryptoJs.AES.encrypt(data, parsedkey, { iv: iv, mode: CryptoJs.mode.ECB, padding: CryptoJs.pad.Pkcs7 });
  let encryptedData = Buffer.from(encrypted.toString()).toString('base64');
  return encryptedData;
}