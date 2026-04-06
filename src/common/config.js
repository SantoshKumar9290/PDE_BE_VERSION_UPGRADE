const ipaddress = 'localhost';//ip.address();

module.exports = {
    "port": 3004,
	"ipaddress": ipaddress,
    "environment": "dev",
    "log4js": {
        "fileName": "serverlogs.log",
        "logLevelFormat": "INFO",
        "category": "Development"
    }
};