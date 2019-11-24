
module.exports = (req, res, next) => {
  if (req.headers.authorization) {
    const auth = req.headers.authorization

    req.headers.authorization = auth.replace('Token token=', 'Bearer ')
  }
  next()
}
