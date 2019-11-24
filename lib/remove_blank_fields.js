
// Remove properties with empty values
module.exports = function (req, res, next) {

  Object.values(req.body).forEach(obj => {
    for (const key in obj) {
      if (obj[key] === '') {
        // removes both the key and the value, preventing it from being updated
        delete obj[key]
      }
    }
  })

  next()
}
