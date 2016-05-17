var express = require('express');
var Converter = require('csvtojson').Converter;
var router = express.Router();

// update photo coords exiftool -overwrite_original -GPSLatitudeRef=S -GPSLatitude="41.271695" -GPSLongitudeRef=E -GPSLongitude="173.285646" pointer.jpg
//Get photo data exiftool -csv -n pointer.jpg
var photoData = [];

var exec = require('child_process').exec;
var cmdGeotagged = 'exiftool -csv -n -r. public/images/geotagged/';
var cmdManual = 'exiftool -csv -n -r. public/images/manuallyPlaced/';

exec(cmdGeotagged, function(error, stdout, stderr) {
  if(error){
    console.error(error)
    return;
  }
  var converter = new Converter({});
  converter.fromString(stdout,function(error, result){
    if(error){
      console.error(error);
      return;
    }
    result = result.map(function(currentValue){
        var folder = currentValue.Directory;
        var file = currentValue.eFilePath;
        var filepath = currentValue.SourceFile;
        var lat = currentValue.GPSLatitude;
        var lon = currentValue.GPSLongitude;
        var tags = currentValue.Tags;

        //Remove public at the start of the string
        filepath = filepath.substring(6); 
        return {
          filename: filepath,
          lat: lat,
          lon: lon,
          tags: tags
        };
    });
    photoData = photoData.concat(result);
  });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/photos', function(req,res,next) {
  res.send(photoData);
});

module.exports = router;
