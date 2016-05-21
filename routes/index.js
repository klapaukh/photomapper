"use strict";

var express = require('express');
var Converter = require('csvtojson').Converter;
var router = express.Router();

// update photo coords exiftool -overwrite_original -GPSLatitudeRef=S -GPSLatitude="41.271695" -GPSLongitudeRef=E -GPSLongitude="173.285646" pointer.jpg
//Get photo data exiftool -csv -n pointer.jpg
var photoData = [];

var exec = require('child_process').exec;
var cmdGeotagged = 'exiftool -csv -n -r. -Directory -FilePath -GPSLatitude -GPSLongitude -TagsList public/images/geotagged/';
var cmdManual    = 'exiftool -csv -n -r. -Directory -FilePath -GPSLatitude -GPSLongitude -TagsList public/images/manuallyPlaced/';

var geoTagProcess = exec(cmdGeotagged);
var manualProcess = exec(cmdManual);

var converterTag = new Converter({constructResult:false, checkColumn: true});
var converterMan = new Converter({constructResult:false, checkColumn: true});

//record_parsed will be emitted per row
converterTag.on("record_parsed", function (row) {

  var folder   = row.Directory;
  var file     = row.FilePath;
  var filepath = row.SourceFile;
  var lat      = row.GPSLatitude;
  var lon      = row.GPSLongitude;
  var tags     = row.TagsList;

  //Remove public at the start of the string
  filepath = filepath.substring(6); 
  var result = {
    filename: filepath,
    lat: lat,
    lon: lon,
    tags: tags
  };
  photoData = photoData.concat(result);
});

converterMan.on("record_parsed", function (resultRow, rawRow, rowIndex) {
  var folder   = resultRow.Directory;
  var file     = resultRow.FilePath;
  var filepath = resultRow.SourceFile;
  var tags     = resultRow.TagsList;

  var latLon = folder.split("/").pop().split("_");
  var lat = latLon[0];
  var lon = latLon[1];

  //Remove public at the start of the string
  filepath = filepath.substring(6); 
  var result = {
    filename: filepath,
    lat: lat,
    lon: lon,
    tags: tags
  };
  photoData = photoData.concat(result);
});

converterMan.on("end_parsed",function(){
  console.log("Finished parsing manually placed objects");
})

converterTag.on("end_parsed",function(){
  console.log("Finished parsing geoTagged objects");
})

geoTagProcess.stdout.pipe(converterTag);
manualProcess.stdout.pipe(converterMan);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/photos', function(req,res,next) {
  res.send(photoData);
});

router.get('/addtag', function(req, res, next){
  var filename = "public" + req.query.photo;
  var newtags = req.query.tag;

  console.log(filename + " " + newtags);

  var cmdAddTags = 'exiftool -overwrite_original -TagsList+="' + 
    newtags + '" ' + filename;

  console.log(cmdAddTags);

  var tagProcess = exec(cmdAddTags, function(error, stdout, stderr){
    console.log("stdout: " + stdout);
    console.log("stderr: " + stderr);
    
    if(stderr !== '' && stderr !== undefined){
      res.send(stderr);
    }

    //update the cached store
    var p =photoData
      .find(function(p) { return p.filename === req.query.photo ;});

    if(p !== undefined){
      if(p.tags === undefined){
        p.tags = [newtags];
      }else{
        p.tags = p.tags + ", " + newtags;
      }
    }

    res.send("true");
  });


});

router.get('/deltag', function(req, res, next){
  var filename = "public" + req.query.photo;
  var newtags = req.query.tag;

  console.log(filename + " " + newtags);

  var cmdAddTags = 'exiftool -overwrite_original -TagsList-="' + 
    newtags + '" ' + filename;

  console.log(cmdAddTags);

  var tagProcess = exec(cmdAddTags, function(error, stdout, stderr){
    console.log("stdout: " + stdout);
    console.log("stderr: " + stderr);
    
    if(stderr !== '' && stderr !== undefined){
      res.send(stderr);
    }

    //update the cached store
    var p =photoData
      .find(function(p) { return p.filename === req.query.photo ;});

    if(p !== undefined){
      if(p.tags !== undefined){
        var regexp = new RegExp("(^|,)\\s*"+ newtags,"");
        p.tags = p.tags.replace(regexp,"");
      }
    }

    res.send("true");
  });


});
module.exports = router;
