const express = require("express");
const dotenv = require("dotenv");
const AWS = require("aws-sdk");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
const multer = require("multer");
dotenv.config();

const awsConfig = {
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY,
  region: process.env.REGION,
};
const S3 = new AWS.S3(awsConfig);
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let upload = multer({
  limits: 1024 * 1024 * 5,
  fileFilter: function (req, file, done) {
    if (
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png"
    )
      done(null, true);
    else {
      done("File type is not supported", false);
    }
  },
});

const uploadToS3 = (fileData) => {
  return new Promise((reject, resolve) => {
    const params = {
      Bucket: process.env.BUCKET,
      Key: `${Date.now().toString()}`,
      Body: fileData,
      ContentDisposition: "inline",
    };
    S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      return resolve(data);
    });
  });
};
app.post("/upload", upload.single("image"), (req, res) => {
  console.log(req.file);
  if (req.file) {
    uploadToS3(req.file.buffer)
      .then((result) => {
        return res.json({
          msg: "uploaded",
          imageUrl: result.location,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});
app.listen(3000, () => {
  console.log("server running");
});
