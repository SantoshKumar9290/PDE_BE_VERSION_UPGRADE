const checkCodes = require('../utils/urbanMutationCodes')


// This object defines that which database model contains the document id or a unique key

const uniqueKeyInCollectionToStoreLogs = {
    'party_represent_detail': 'documentId',
    'document_details': "documentId",
    'party_sale_details': "document_id",
    'property_details': "propertyId",
    'party_details': "applicationId",
    'property_structure_details': "propertyId"
}
const isUrbanDocumentMutationNeeded = (major_code,minor_code) => {
    const isMutationNeedMajor = checkCodes.URBAN_MUTATION_ACCEPT_MAJOR_CODES.includes(major_code);
    if (isMutationNeedMajor) {
        return checkCodes.URBAN_MUTATION_ACCEPT_MINOR_CODES[major_code].includes(minor_code)
    }
    return false
}
const thirdPartyDepartments={
    webland:'CCLA',
    muncipal:'CDMA',
    franking:'FRANKING',
    stockHolding:'STOCKHOLDING',
    rera:'RERA',
    buildingApprovalNo: 'BUILDINGAPPROVALNO',
    passport:"PASSPORT",
    pan:"PAN",
    buildingPermission:"BUILDINGPERMISSION"
}
module.exports={uniqueKeyInCollectionToStoreLogs,thirdPartyDepartments,isUrbanDocumentMutationNeeded}