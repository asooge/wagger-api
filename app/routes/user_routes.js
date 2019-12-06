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
// get 5 waggers and record timestamp
router.get('/wagger', requireToken, (req, res, next) => {
  let randNum = 0
  User.find()
    .select('-createdAt -updatedAt -matches -likes -waggers -wag -lastPull -email -token -profile')
    .then(waggers => {
      return waggers.map(wagger => wagger.toObject())
    })
    .then(waggers => {
      randNum = Math.floor(Math.random() * waggers.length)
      console.log(randNum)
      return waggers.concat(waggers).splice(randNum, 5)
    })
    .then(waggers => res.status(200).json({ waggers }))
    .catch(next)
})

// get 5 waggers for a particular user
router.get('/wagger/:id', requireToken, (req, res, next) => {
  let randNum = 0
  User.find()
    .select('-createdAt -updatedAt -matches -likes -waggers -wag -lastPull -email -token -profile')
    .then(waggers => {
      return waggers.map(wagger => wagger.toObject())
    })
    .then(waggers => {
      randNum = Math.floor(Math.random() * waggers.length)
      console.log(randNum)
      return waggers.concat(waggers).splice(randNum, 5)
    })
    .then(waggers => {
      User.findById(req.params.id)
        .populate('matches.reference', '-likes -matches -token -waggers -wag -lastPull -email')
        .then(me => {
          if (new Date() - me.lastPull >= 86400000) {
            me.waggers = waggers
            me.wag = 0
            me.lastPull = new Date() - 1
            me.save()
            res.status(200).json({ user: me.toObject() })
          }
        })
        // .then(me => res.status(200).json({ user: me.toObject() }))
    })
    .catch(next)
})

// Show one user
router.get('/users/:id', requireToken, (req, res, next) => {
  User.findById(req.params.id)
    .populate('matches.reference', '-likes -matches -token -waggers -wag -lastPull -email')
    .then(errors.handle404)
    .then(user => user.toObject())
    .then(user => res.status(200).json({ user }))
    .catch(next)
})

// Dislike a dog
// Post request to 'create' the dislike
router.post('/wagger/:id/', requireToken, (req, res, next) => {
  // User.findOneAndUpdate({ _id: req.params.id }, { $inc: { wag: 1 } }).then(me => {
  //   return me.save()
  // })
  //   .then(me => res.status(200).json({ user: me.toObject() }))
  User.findById(req.params.id)
    .then(me => {
      me.wag++
      return me.save()
    })
    .then(me => res.status(200).json({ user: me.toObject() }))
})

// Like a dog
// Patch request to update user data with new like
router.patch('/users/:id/likes/:user', requireToken, (req, res, next) => {
  console.log(req.params)

  const myId = req.params.id
  const matchId = req.params.user
  // find current user
  User.findById(myId)
    .populate('matches.reference', '-likes -matches -token -waggers -wag -lastPull -email')
    // .then(function (me) {
    //   return me
    // })
    // then find other-user and compare with me
    .then((me) => {
      User.findById(matchId)
        .then(user => {
          // if you already matched with the user, increment wag and return
          if (user.matches.find(match => match.reference.toString() === myId)) {
            console.log('already matched')
            me.wag++
            return me.save()
          //   User.findOneAndUpdate({_id: myId}, { $inc: { wag: 1 } }, {returnOriginal: false})
          //     .then(me => res.status(200).json({ user: me.toObject() }))
          }
          // if you already like the user, increment wag and return
          if (me.likes.includes(matchId)) {
            console.log('already liked')
            me.wag++
            return me.save()
          //   User.findOneAndUpdate({_id: myId}, { $inc: { wag: 1 } }, {returnOriginal: false})
          //     .then(me => res.status(200).json({ user: me.toObject() }))
          //   return me.save()
          }
          // if its a match!
          if (user.likes.includes(myId)) {
            console.log('its a match')
            // add the relation to the other-user match array and save
            user.matches.push({ reference: myId, messages: [] })
            user.save()

            // User.findOneAndUpdate({_id: matchId}, { $push: { matches: { reference: myId, messages: [] } } }, {returnOriginal: false})
            //   .then(user => user.save())
            //   .then(console.log)
            // also add to current-user match array and save
            // add the like to current-user array for good measure
            // iterate wag, save and return me
            me.wag++
            me.likes.push(matchId)
            me.matches.push({ reference: matchId, messages: [] })
            return me.save()
            // User.findOneAndUpdate({_id: myId}, { $inc: { wag: 1 }, $push: { likes: matchId, matches: { reference: matchId, messages: [] } } }, {returnOriginal: false})
            //   .then(me => res.status(200).json({ user: me.toObject() }))
          } else {
            console.log('just a like')
            // otherwise, simply add the like to the user likes array and save
            me.wag++
            me.likes.push(matchId)
            return me.save()

            // User.findOneAndUpdate({_id: myId}, { $inc: { wag: 1 }, $push: { likes: matchId } }, {returnOriginal: false})
            //   .then(me => res.status(200).json({ user: me.toObject() }))
          }
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
router.delete('/users/:id/matches', requireToken, (req, res, next) => {
  // User.findById(req.body.match)
  //   .then(user => {
  //     console.log(user)
  //     user.matches.splice(user.matches.indexOf(req.params.id), 1)
  //     user.likes.splice(user.likes.indexOf(req.params.id), 1)
  //     return user.save()
  //   })
  //   .catch(console.error)
  User.findById(req.params.id)
    // .populate('matches.reference', '-likes -matches -token -waggers -wag -lastPull -email')
    .then(user => {
      console.log('can we find:', user.matches.findIndex(match => match.reference.toString() === req.body.match))
      console.log(user.matches)
      console.log(req.body.match)
      // console.log('delete match with this user id:', req.body.match)
      // console.log('user matches is', user.matches)
      // console.log('can you find:', user.matches[0].reference._id)
      // console.log('index of', user.matches.findIndex(match => match.reference._id === req.body.match))
      const deleteIndex = user.matches.findIndex(match => match.reference.toString() === req.body.match)
      console.log('delete index is', deleteIndex)
      user.matches.splice(deleteIndex, 1)
      console.log('updated user', user)
      user.likes.splice(user.likes.indexOf(req.body.match), 1)
      return user.save()
    })
    .then(me => res.status(200).json({ user: me.toObject() }))
})

// Add or update dog name
// POST request to '/users/:id/name'
router.post('/users/:id/name', requireToken, (req, res, next) => {
  User.findById(req.params.id)
    .populate('matches.reference', '-likes -matches -token -waggers -wag -lastPull -email')
    .then(me => {
      me.name = req.body.name
      return me.save()
    })
    .then(me => res.status(201).json({ user: me.toObject() }))
    .catch(next)
})

// Add or update speak
// POST request to '/users/:id/speak'
router.post('/users/:id/speak', requireToken, (req, res, next) => {
  User.findById(req.params.id)
    .populate('matches.reference', '-likes -matches -token -waggers -wag -lastPull -email')
    .then(me => {
      me.speak = req.body.speak
      return me.save()
    })
    .then(me => res.status(201).json({ user: me.toObject() }))
    .catch(next)
})

// Upload a dog image
router.post('/users/:id/images/:num', multerUpload.single('file'), (req, res, next) => {
  console.log(':num is', req.params.num)
  uploadApi(req.file, req.params.id, req.params.num)
    .then(awsResponse => {
      console.log('from aws', awsResponse)
      User.findById(req.params.id)
        .populate('matches.reference', '-likes -matches -token -waggers -wag -lastPull -email')
        .then(user => {
          console.log('user images:', user.images)
          // user.images[req.params.num] = (awsResponse.Location)
          // user.images.splice([req.params.num, 0, awsResponse.Location])
          user.updateOne(user.images.splice([req.params.num], 0, awsResponse.Location))
          return user.save()
        })
        .then(me => res.status(201).json({ user: me.toObject() }))
    })
})

// Update (patch) a dog image
router.patch('/users/:id/images/:num', multerUpload.single('file'), (req, res, next) => {
  console.log(':num is', req.params.num)
  uploadApi(req.file, req.params.id, req.params.num)
    .then(awsResponse => {
      console.log('from aws', awsResponse)
      User.findById(req.params.id)
        .populate('matches.reference', '-likes -matches -token -waggers -wag -lastPull -email')
        .then(user => {
          console.log('user images:', user.images)
          user.images.splice([req.params.num], 1, awsResponse.Location)
          return user.save()
        })
        .then(me => res.status(201).json({ user: me.toObject() }))
    })
})

// Upload a profile pic
router.post('/users/:id/profile', multerUpload.single('profile'), (req, res, next) => {
  console.log(req.file)
  uploadApi(req.file, req.params.id, 'profile')
    .then(awsResponse => {
      User.findById(req.params.id)
        .populate('matches.reference', '-likes -matches -token -waggers -wag -lastPull -email')
        .then(user => {
          user.profile = awsResponse.Location
          return user.save()
        })
        .then(me => res.status(201).json({ user: me.toObject() }))
    })
})

// Alternate route patch profile
router.patch('/users/:id/profile', multerUpload.single('file'), (req, res, next) => {
  console.log(req.file)
  uploadApi(req.file, req.params.id, 'profile')
    .then(awsResponse => {
      User.findById(req.params.id)
        .populate('matches.reference', '-likes -matches -token -waggers -wag -lastPull -email')
        .then(user => {
          user.profile = awsResponse.Location
          return user.save()
        })
        .then(me => res.status(201).json({ user: me.toObject() }))
    })
})

// Create a message
router.post('/users/:id/matches/:match/messages', requireToken, (req, res, next) => {
  console.log('time is:', req.body.time)
  const time = new Date()
  console.log(time.toLocaleString())
  // Find the current user
  User.findById(req.params.id)
    .populate('matches.reference', '-likes -matches -token -waggers -wag -lastPull -email')
  // Find the current match
    .then(me => {
      console.log(me)
      return me.matches.find(match => {
        return match.reference._id.toString() === req.params.match
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
        return match.reference._id.toString() === req.params.id
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
    .populate('matches.reference', '-likes -matches -token -waggers -wag -lastPull -email')
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
