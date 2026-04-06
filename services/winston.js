var appRoot = require('app-root-path');
const { createLogger, format, transports } = require("winston");
require("winston-mongodb");
var winston = require('winston')
winston.transports.DailyRotateFile = require('winston-daily-rotate-file');

const customFormat = format.combine(
	format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
	format.align(),
	format.printf((i) => `${i.level}: ${[i.timestamp]}: ${i.message}`)
);

const options = {
	file: {
		level: "info",
		filename: `${appRoot}/logs/app.log`,
		handleExceptions: true,
		json: true,
		maxsize: 5242880, // 5MB
		maxFiles: 5,
		colorize: true,
	},
	console: {
		level: "info",
		handleExceptions: true,
		json: false,
		colorize: true,
		format:customFormat
	}
};
const Logger = createLogger({
	transports:[
		new winston.transports.DailyRotateFile({
			// filename: `${appRoot}/logs/PDE-%DATE%.log`,
			filename: `${process.env.PDE_LOG_FILE_PATH}/logs/PDE-%DATE%.log`,
			datePattern: "YYYY-MM-DD",
			zippedArchive: true,
			level:"error",
			maxSize: "20m",
			maxFiles: "14d",
			level: "info",
			format:customFormat
		}),
		new winston.transports.Console(options.console),
	]
});

module.exports = {
	Logger: Logger
};