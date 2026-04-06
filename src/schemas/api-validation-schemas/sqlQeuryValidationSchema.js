
module.exports = {
    description: "sql query schema",
    entity: "oracledb",
    storeValidationErrorInDB: false,
	params: {
		type: "object",
		properties: {
			habCode: {
				type: "string",
				pattern: "^[0-9]+$"
		  	},
			mandalId:{
				type: "string",
				pattern: "^[0-9]*$"
			},
			districtId:{
				type: "string",
				pattern: "^[0-9]*$"
			},
			villageCode: {
				type: "string",
				pattern: "^[0-9]*$"
			},
			sroCode: {
				type: "string",
				pattern: "^[0-9]*$"
			}
		}
	},
    query: {
        type: "object",
        properties: {
            districtCode: {
                type: "string",
                pattern: "^[0-9]*$"
            },
            mandalCode: {
                type: "string",
                pattern: "^[0-9]*$"
            },
            villageCode: {
                type: "string",
                pattern: "^[0-9]*$"
            },
            sroCode: {
                type: "string",
                pattern: "^[0-9]*$"
            },
			habCode:{
				type: "string",
                pattern: "^[0-9]*$"
			},
			mandalId:{
				type: "string",
                pattern: "^[0-9]*$"
			},
			districtId:{
				type: "string",
                pattern: "^[0-9]*$"
			},
        },
        additionalProperties: true
    },
    body: {
        type: "object",
        properties: {
            districtCode: {
                type: "string",
                pattern: "^[0-9]*$"
            },
            mandalCode: {
                type: "string",
                pattern: "^[0-9]*$"
            },
			mandalId:{
				type: "string",
                pattern: "^[0-9]*$"
			},
            villageCode: {
                type: "string",
                pattern: "^[0-9]*$"
            },
            sroCode: {
                type: "string",
                pattern: "^[0-9]*$"
            },
			habCode:{
				type: "string",
                pattern: "^[0-9]*$"
			},
			districtId:{
				type: "string",
                pattern: "^[0-9]*$"
			},
			linkDoc_No:{
				type: "string",
                pattern: "^[0-9]*$"
			},
			regYear:{
				type: "string",
                pattern: "^[0-9]*$"
			}
        },
        additionalProperties: true
    }
};
  