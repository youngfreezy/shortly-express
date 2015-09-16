var express  = require('express');
var request  = require('request');
var router   = express.Router();

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  if (url === undefined) return false;
  return url.match(rValidUrl);
};

exports.timedOut = function() {
  var timeout;

  router.get('/', function(req, res) {
    timeout = req.session["timeout"] - Math.floor(Date.now()/1000) > 0;
  });

  return timeout;
}

exports.timedOutTime = function() {
  var amt;

  router.get('/', function(req, res) {
    amt = req.session["timeout"] - Math.floor(Date.now()/1000);
  });

  return amt;
}

/************************************************************/
// Add additional utility functions below
/************************************************************/


