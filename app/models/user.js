const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  test: {
    // Test object to display a reference to each user
    // messages array [{ text: '', user: ref, time: String }]

    // Each user has a reference to test object so they can communicate
    // matches can be accessed in constant time

    // {user_id: false,
    // user2_id: {
    //    ref: [user3_id, user2_id],
    //    messages: [{}, {}, {}],
    //    createdOn: Timestamp
    // }
  }
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
  images: Array,
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
