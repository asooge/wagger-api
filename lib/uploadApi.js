require('dotenv').config()
const mime = require('mime-types')
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
AWS.config.update({ region: 'us-east-1' })
const bucketName = process.env.BUCKET_NAME

module.exports = function (file, userId, imageNum) {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucketName,
      Key: `wagger/${userId}/${imageNum}`,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype
    }
    s3.upload(params, (err, s3Data) => {
      if (err) reject(err)
      resolve(s3Data)
    })
  })
}
