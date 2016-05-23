/*
 *  Photo Mapper for viewing, tagging, and filtering photos on a map 
 *  Copyright (C) 2016  Roman Klapaukh
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
  res.render('index', { title: 'Photo Mapper' });
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
    var p = photoData
      .find(function(p) { return p.filename === req.query.photo ;});

    if(p !== undefined){
      if(p.tags === undefined || !(/\S/.test(p.tags))){
        p.tags = newtags;
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
    var p = photoData
      .find(function(p) { return p.filename === req.query.photo ;});

    if(p !== undefined){
      if(p.tags !== undefined){
        if(typeof(p.tags === "string")){
          var regexp = new RegExp("(^|,)\\s*"+ newtags + "(,|$)","");
          p.tags = p.tags.replace(regexp,"$2").replace(/^\s*,\s*/,"");
        } else {
          p.tags = p.tags.filter(function(m) { return m !== newtags; });
        }
      }
    }

    res.send("true");
  });


});
module.exports = router;
