exports.cdmaAPIs={
    createAssessment:`/v1.0/property/automutation/unassessed/mutation`,
    searchByDoorNumber:`/v1.0/property/search/doorno`,
    tokenGeneration:`/oauth/token?ulbCode=`,
    saveProperty: `/v1.0/property/automutation/assessed?ulbCode=`,
    propertyTax: `/v1.0/external/property/taxdues`

}
exports.cdmaHostURL=process.env.URBAN_BASE_URL || "";