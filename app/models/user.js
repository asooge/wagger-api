const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  hashedPassword: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: '',
    maxlength: 35
  },
  speak: {
    type: String,
    default: 'woof',
    maxlength: 500
  },
  profile: String,
  images: {
    type: Array,
    default: []
  },
  waggers: Array,
  wag: {
    type: Number,
    default: 0
  },
  lastPull: {
    type: String,
    default: new Date() - 86400000
  },
  likes: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User'
  },
  matches: {
    type: [
      { reference: mongoose.Schema.Types.ObjectId,
        messages: {
          type: [
            { user: mongoose.Schema.Types.ObjectId,
              text: String,
              time: String
            }]
        } }
    ]
  },
  token: String
}, {
  timestamps: true,
  toObject: {
    // remove `hashedPassword` field when we call `.toObject`
    transform: (_doc, user) => {
      delete user.hashedPassword
      return user
    }
  }
})

module.exports = mongoose.model('User', userSchema)
