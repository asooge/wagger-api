const express = require('express')
// jsonwebtoken docs: https://github.com/auth0/node-jsonwebtoken
const crypto = require('crypto')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')
// bcrypt docs: https://github.com/kelektiv/node.bcrypt.js
const bcrypt = require('bcrypt')

const bcryptSaltRounds = 10

const errors = require('../../lib/custom_errors')

const BadParamsError = errors.BadParamsError
const BadCredentialsError = errors.BadCredentialsError

const User = require('../models/user')

const requireToken = passport.authenticate('bearer', { session: false })

const router = express.Router()

const uploadApi = require('../../lib/uploadApi')
const multer = require('multer')
const storage = multer.memoryStorage()
const multerUpload = multer({ storage: storage })

// Index all users
router.get('/users', (req, res, next) => {
  User.find()
    .select('-createdAt -updatedAt -matches.id -matches.messages._id')
    .populate('matches.messages.user', '-speak -images -likes -createdAt -updatedAt -token -matches -__v')
    // .populate('matches', '-likes -matches -token')
    .then(users => {
      return users.map(user => user.toObject())
    })
    .then(users => res.status(200).json({ users: users }))
    .catch(next)
})

// Show one user
router.get('/users/:id', (req, res, next) => {
  User.findById(req.params.id)
    .populate('matches.reference', '-likes -matches -token')
    .then(errors.handle404)
    .then(user => user.toObject())
    .then(user => res.status(200).json({ user }))
    .catch(next)
})

// Like a dog
// Patch request to update user data with new like
router.patch('/users/:id/likes', (req, res, next) => {
  console.log(req.params)
  console.log(req.body.like)

  const myId = req.params.id
  const matchId = req.body.like
  // find current user
  User.findById(myId)
    .then(function (me) {
      return me
    })
    // then find other-user and compare with me
    .then((me) => {
      User.findById(matchId)
        .then(user => {
          console.log(user)
          // if you already matched with the user, return
          if (user.matches.find(match => match.reference.toString() === myId)) {
            console.log('found the match')
            return me
          }
          // if you already like the user, return
          if (me.likes.includes(matchId)) {
            return me
          }
          // if its a match!
          if (user.likes.includes(myId)) {
            console.log(true)
            // add the relation to the other-user match array and save
            user.matches.push({ reference: myId, messages: [] })
            console.log(user)
            user.save()

            // also add to current-user match array and save
            me.matches.push({ reference: matchId, messages: [] })
            me.save()
            // finally add the like to current-user array for good measure
            me.likes.push(matchId)
          } else {
            // otherwise, simply add the like to the user likes array and save
            me.likes.push(matchId)
            me.save()
          }
          return me
        })
        .then(me => res.status(200).json({ user: me.toObject() }))
        .catch(next)
    })
})

// Reset likes to []
router.delete('/users/:id/likes', (req, res, next) => {
  User.findById(req.params.id)
    .then(user => {
      user.likes = []
      return user.save()
    })
    .then(user => res.status(200).json({ user: user.toObject() }))
})

// Nuclear option - reset all user relations
// For development only
router.delete('/users/relations', (req, res, next) => {
  User.find()
    .then(users => {
      users.forEach(user => {
        user.likes = []
        user.matches = []
        user.save()
      })
    })
    .then(user => res.sendStatus(204))
    .catch(next)
})

// Delete a match
// both for user and matched user (bi-directional)
router.delete('/users/:id/matches', (req, res, next) => {
  User.findById(req.body.match)
    .then(user => {
      console.log(user)
      user.matches.splice(user.matches.indexOf(req.params.id), 1)
      user.likes.splice(user.likes.indexOf(req.params.id), 1)
      return user.save()
    })
    .catch(console.error)
  User.findById(req.params.id)
    .populate('matches', '-likes -matches -token -createdAt -updatedAt')
    .then(user => {
      user.matches.splice(user.matches.indexOf(req.body.match), 1)
      user.likes.splice(user.likes.indexOf(req.body.match), 1)
      return user.save()
    })
    .then(me => res.status(200).json({ user: me.toObject() }))
})

// Add or update dog name
// POST request to '/users/:id/name'
router.post('/users/:id/name', (req, res, next) => {
  User.findById(req.params.id)
    .then(me => {
      me.name = req.body.name
      return me.save()
    })
    .then(me => res.status(201).json({ user: me.toObject() }))
    .catch(next)
})

// Add or update speak
// POST request to '/users/:id/speak'
router.post('/users/:id/speak', (req, res, next) => {
  User.findById(req.params.id)
    .then(me => {
      me.speak = req.body.speak
      return me.save()
    })
    .then(me => res.status(201).json({ user: me.toObject() }))
    .catch(next)
})

// Upload a dog image
router.post('/users/:id/images/:num', multerUpload.single('file'), (req, res, next) => {
  console.log(req.file)
  console.log(':num is', req.params.num)
  uploadApi(req.file, req.params.id, req.params.num)
    .then(awsResponse => {
      console.log('from aws', awsResponse)
      User.findById(req.params.id)
        .then(user => {
          user.images[req.params.num] = (awsResponse.Location)
          return user.save()
        })
        .then(me => res.status(201).json({ user: me.toObject() }))
    })
})

// Upload a profile pic
router.post('/users/:id/profile', multerUpload.single('file'), (req, res, next) => {
  uploadApi(req.file, req.params.id, 'profile')
    .then(awsResponse => {
      User.findById(req.params.id)
        .then(user => {
          user.profile = awsResponse.Location
          return user.save()
        })
        .then(me => res.status(201).json({ user: me.toObject() }))
    })
})

// Create a message
router.post('/users/:id/matches/:match/messages', (req, res, next) => {
  console.log('time is:', req.body.time)
  const time = new Date()
  console.log(time.toLocaleString())
  // Find the current user
  User.findById(req.params.id)
  // Find the current match
    .then(me => {
      console.log(me)
      return me.matches.find(match => {
        return match.reference.toString() === req.params.match
      })
    })
  // push the new message to the match array
    .then(match => {
      match.messages.push({ text: req.body.text, user: req.params.id, time: time })
      return match.ownerDocument().save()
    })
    .then(me => res.status(201).json({ user: me.toObject() }))
    .catch(next)
  User.findById(req.params.match)
  // Find the current match
    .then(user => {
      console.log(user)
      return user.matches.find(match => {
        return match.reference.toString() === req.params.id
      })
    })
  // push the new message to the match array
    .then(match => {
      match.messages.push({ text: req.body.text, user: req.params.id, time: time })
      return match.ownerDocument().save()
    })
    .catch(next)

  // Find the match user
  // Find the current match
  // push the new message to the match array
})

// SIGN UP
// POST /sign-up
router.post('/sign-up', (req, res, next) => {
  Promise.resolve(req.body.credentials)
    .then(credentials => {
      if (!credentials ||
          !credentials.password ||
          credentials.password !== credentials.password_confirmation) {
        throw new BadParamsError()
      }
    })
    .then(() => bcrypt.hash(req.body.credentials.password, bcryptSaltRounds))
    .then(hash => {
      return {
        email: req.body.credentials.email,
        hashedPassword: hash
      }
    })
    .then(user => User.create(user))
    .then(user => res.status(201).json({ user: user.toObject() }))
    .catch(next)
})

// SIGN IN
// POST /sign-in
router.post('/sign-in', (req, res, next) => {
  const pw = req.body.credentials.password
  let user

  // find a user based on the email that was passed
  User.findOne({ email: req.body.credentials.email })
    .then(record => {
      if (!record) {
        throw new BadCredentialsError()
      }
      user = record
      return bcrypt.compare(pw, user.hashedPassword)
    })
    .then(correctPassword => {
      if (correctPassword) {
        const token = crypto.randomBytes(16).toString('hex')
        user.token = token
        return user.save()
      } else {
        throw new BadCredentialsError()
      }
    })
    .then(user => {
      res.status(201).json({ user: user.toObject() })
    })
    .catch(next)
})

// CHANGE password
// PATCH /change-password
router.patch('/change-password', requireToken, (req, res, next) => {
  let user
  User.findById(req.user.id)
    .then(record => { user = record })
    .then(() => bcrypt.compare(req.body.passwords.old, user.hashedPassword))
    .then(correctPassword => {
      if (!req.body.passwords.new || !correctPassword) {
        throw new BadParamsError()
      }
    })
    .then(() => bcrypt.hash(req.body.passwords.new, bcryptSaltRounds))
    .then(hash => {
      user.hashedPassword = hash
      return user.save()
    })
    .then(() => res.sendStatus(204))
    .catch(next)
})

// Sign out: DELETE '/sign-out'
router.delete('/sign-out', requireToken, (req, res, next) => {
  req.user.token = crypto.randomBytes(16)
  req.user.save()
    .then(() => res.sendStatus(204))
    .catch(next)
})

module.exports = router
