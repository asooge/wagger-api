const mongoose = require('mongoose')

const connectionSchema = new mongoose.Schema({
  user_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  match_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoreMatch',
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Connection', connectionSchema)
