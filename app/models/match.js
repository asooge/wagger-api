const mongoose = require('mongoose')

const storeMatchSchema = new mongoose.Schema({
  ref: {
    type: Array,
    default: [],
    required: true
  },
  messages: {
    type: Array,
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('StoreMatch', storeMatchSchema)
