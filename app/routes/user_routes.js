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
const Match = require('../models/match')

const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// Index all users
router.get('/users', (req, res, next) => {
  User.find()
    .select('-createdAt -updatedAt')
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
        .catch(console.error)
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

// SIGN UP
// POST /sign-up
router.post('/sign-up', (req, res, next) => {
  // start a promise chain, so that any errors will pass to `handle`
  Promise.resolve(req.body.credentials)
    // reject any requests where `credentials.password` is not present, or where
    // the password is an empty string
    .then(credentials => {
      if (!credentials ||
          !credentials.password ||
          credentials.password !== credentials.password_confirmation) {
        throw new BadParamsError()
      }
    })
    // generate a hash from the provided password, returning a promise
    .then(() => bcrypt.hash(req.body.credentials.password, bcryptSaltRounds))
    .then(hash => {
      // return necessary params to create a user
      return {
        email: req.body.credentials.email,
        hashedPassword: hash
      }
    })
    // create user with provided email and hashed password
    .then(user => User.create(user))
    // send the new user object back with status 201, but `hashedPassword`
    // won't be send because of the `transform` in the User model
    .then(user => res.status(201).json({ user: user.toObject() }))
    // pass any errors along to the error handler
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
        // save the token to the DB as a property on user
        return user.save()
      } else {
        // throw an error to trigger the error handler and end the promise chain
        // this will send back 401 and a message about sending wrong parameters
        throw new BadCredentialsError()
      }
    })
    .then(user => {
      // return status 201, the email, and the new token
      res.status(201).json({ user: user.toObject() })
    })
    .catch(next)
})

// CHANGE password
// PATCH /change-password
router.patch('/change-password', requireToken, (req, res, next) => {
  let user
  // `req.user` will be determined by decoding the token payload
  User.findById(req.user.id)
    // save user outside the promise chain
    .then(record => { user = record })
    // check that the old password is correct
    .then(() => bcrypt.compare(req.body.passwords.old, user.hashedPassword))
    // `correctPassword` will be true if hashing the old password ends up the
    // same as `user.hashedPassword`
    .then(correctPassword => {
      // throw an error if the new password is missing, an empty string,
      // or the old password was wrong
      if (!req.body.passwords.new || !correctPassword) {
        throw new BadParamsError()
      }
    })
    // hash the new password
    .then(() => bcrypt.hash(req.body.passwords.new, bcryptSaltRounds))
    .then(hash => {
      // set and save the new hashed password in the DB
      user.hashedPassword = hash
      return user.save()
    })
    // respond with no content and status 200
    .then(() => res.sendStatus(204))
    // pass any errors along to the error handler
    .catch(next)
})

router.delete('/sign-out', requireToken, (req, res, next) => {
  // create a new random token for the user, invalidating the current one
  req.user.token = crypto.randomBytes(16)
  // save the token and respond with 204
  req.user.save()
    .then(() => res.sendStatus(204))
    .catch(next)
})

module.exports = router
