var express = require('express');
var Converter = require('csvtojson').Converter;
var router = express.Router();

// update photo coords exiftool -overwrite_original -GPSLatitudeRef=S -GPSLatitude="41.271695" -GPSLongitudeRef=E -GPSLongitude="173.285646" pointer.jpg
//Get photo data exiftool -csv -n pointer.jpg
var photoData = [];

var exec = require('child_process').exec;
var cmdGeotagged = 'exiftool -csv -n -r. public/images/geotagged/';
var cmdManual    = 'exiftool -csv -n -r. public/images/manuallyPlaced/';

var geoTagProcess = exec(cmdGeotagged);
var manualProcess = exec(cmdManual);

var converterTag = new Converter({constructResult:false});
var converterMan = new Converter({constructResult:false});

//record_parsed will be emitted per row
converterTag.on("record_parsed", function (row) {

  var folder   = row.Directory;
  var file     = row.FilePath;
  var filepath = row.SourceFile;
  var lat      = row.GPSLatitude;
  var lon      = row.GPSLongitude;
  var tags     = row.Tags;

  //Remove public at the start of the string
  filepath = filepath.substring(6); 
  result = {
    filename: filepath,
    lat: lat,
    lon: lon,
    tags: tags
  };
  photoData = photoData.concat(result);
});


converterMan.on("record_parsed", function (row) {
  var folder = row.Directory;
  var file = row.FilePath;
  var filepath = row.SourceFile;
  var tags = row.Tags;

  var latLon = folder.split("/").pop().split("_");
  var lat = latLon[0];
  var lon = latLon[1];

  //Remove public at the start of the string
  filepath = filepath.substring(6); 
  result = {
    filename: filepath,
    lat: lat,
    lon: lon,
    tags: tags
  };
  photoData = photoData.concat(result);
});


geoTagProcess.stdout.pipe(converterTag);
manualProcess.stdout.pipe(converterMan);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/photos', function(req,res,next) {
  res.send(photoData);
});

module.exports = router;
