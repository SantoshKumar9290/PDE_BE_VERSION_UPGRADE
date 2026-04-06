const mongoose = require('mongoose')

const uniqueSchema = new mongoose.Schema({
    sequenceValue:{
        type: Number
    }

})
module.exports = mongoose.model('mv_genarator',uniqueSchema,"mv_genarator")