const format = require("util").format;
const express = require("express");
const Multer = require("multer");
const path = require("path");
const bodyParser = require("body-parser");
// const Storage = require('@google-cloud/storage');

// const storage = Storage();
const app = express();

const allowCrossDomain = function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // intercept OPTIONS method
  if ("OPTIONS" == req.method) {
    res.send(200);
  } else {
    next();
  }
};

app.use(express.json());
app.use(allowCrossDomain);
app.use(express.static(path.join(__dirname, "")));

const { Storage } = require("@google-cloud/storage");
// Enable Cloud Storage
const GCLOUD_PROJECT_ID = "realidadevirtual";
const GCLOUD_PROJECT_KEYFILE = path.join(__dirname, `./serviceaccount.json`);
const gcs = new Storage({
  keyFilename: GCLOUD_PROJECT_KEYFILE,
  projectId: GCLOUD_PROJECT_ID,
});
// Reference an existing bucket.
const bucket = gcs.bucket("modelsforapp");

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});
app.disable("x-powered-by");
// app.use(multer.single('fileUpload'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// A bucket is a container for objects (files).
// const bucket = storage.bucket('web-application-53390.appspot.com');

// Process the file upload and upload to Google Cloud Storage.
app.post("/uploadHandler", multer.single("fileUpload"), (req, res, next) => {
  if (!req.file) {
    res.status(400).send("No file uploaded.");
    return;
  }
  // Create a new blob in the bucket and upload the file data.
  let newFileName = req.body.userId + "/" + req.file.originalname;
  const blob = bucket.file(newFileName);

  const blobStream = blob.createWriteStream();

  blobStream.on("error", (err) => {
    next(err);
  });

  blobStream.on("finish", () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = format(
      `https://storage.googleapis.com/modelsforapp/${blob.name}`
    );
    res.status(200).send(publicUrl);
  });

  blobStream.end(req.file.buffer);
});

// delete
app.post("/deleteHandler", (req, res) => {
  const imagesToDelete = req.body.files;
  const folder = req.body.folder;

  imagesToDelete.map(async (image) => {
    await bucket.file(folder + "/" + image).delete();
  });
  res.status(200).send("ok");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log("Press Ctrl+C to quit.");
});
