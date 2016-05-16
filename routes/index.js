var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/photos', function(req,res,next) {
  console.log("Sending Photos");
  res.send("{photos: []}");
});

module.exports = router;
