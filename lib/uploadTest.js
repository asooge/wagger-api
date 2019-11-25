require('dotenv').config()
const AWS = require('aws-sdk')
const fs = require('fs')
const mime = require('mime-types')

var s3 = new AWS.S3()

AWS.config.update({
  region: 'us-east-1'
})

console.log(s3)

const bucketName = process.env.BUCKET_NAME
console.log(bucketName)
// Access command line arguments to get file path

const filePath = process.argv[2]

console.log(mime.lookup(filePath))

fs.readFile(filePath, (err, fileData) => {
  if (err) {
    throw err
  }
  console.log(fileData)
  // create params object for s3 upload
  const params = {
    Bucket: bucketName,
    Key: 'wagger/test',
    Body: fileData,
    ACL: 'public-read',
    ContentType: mime.lookup(filePath)
  }
  // upload to s3
  s3.upload(params, (err, s3Data) => {
    if (err) throw err
    console.log(s3Data)
  })
})
