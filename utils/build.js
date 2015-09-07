/*
 * Copyright Adam Pritchard 2015
 * MIT License : http://adampritchard.mit-license.org/
 */

/* jslint node: true */
"use strict";

var fs = require('fs');
var path = require('path');
var file = require('file');
var archiver = require('archiver');
var MetaScript = require('MetaScript');


var BASE_DIR = '..';
var SRC_DIR = file.path.join(BASE_DIR, 'src');
var DIST_DIR = file.path.join(BASE_DIR, 'dist');
var CHROME_EXTENSION = file.path.join(DIST_DIR, 'chrome.zip');
var FIREFOX_EXTENSION = file.path.join(DIST_DIR, 'firefox.xpi');
var CHROME_INPUT = [/^manifest\.json$/, /^common(\\|\/)/, /^chrome(\\|\/)/, /^_locales(\\|\/)/];
var FIREFOX_INPUT = [/^chrome.manifest$/, /^install.rdf$/, /^common(\\|\/)/, /^firefox(\\|\/)/];
var FIREFOX_PLATFORM = 'mozilla';

var skipFileRegexes = [/^common(\\|\/)test(\\|\/)/,
                       // OS files and temp files
                       /\.DS_Store$/, /.+\.bts$/, /desktop\.ini$/];
var javascriptFileRegex = /.+\.js$/;


// Checks for a match for fpath in inputArray (which should be CHROME_INPUT or FIREFOX_INPUT).
// Returns null if no match, or the zippable path to the file.
function fnameMatch(fpath, inputArray) {
  var fname = file.path.relativePath(SRC_DIR, fpath);

  var i;
  for (i = 0; i < skipFileRegexes.length; i++) {
    if (skipFileRegexes[i].test(fname)) {
      return null;
    }
  }

  for (i = 0; i < inputArray.length; i++) {
    if (inputArray[i].test(fname)) {
      return fname;
    }
  }

  return null;
}


// Add a file to the Chrome extension zip
function addChromeFile(zip, fullPath, zipPath) {
  zip.file(fullPath, { name: zipPath });
}


// Add a file to the Firefox extension zip
function addFirefoxFile(zip, fullPath, zipPath) {
  // For the Mozilla extension, we need to do some preprocessing on JavaScript files.
  if (javascriptFileRegex.test(fullPath)) {
    var fileContents = fs.readFileSync(fullPath);
    fileContents = MetaScript.transform(fileContents, {platform: FIREFOX_PLATFORM});
    zip.append(fileContents, { name: zipPath });
  }
  else {
    zip.file(fullPath, { name: zipPath });
  }
}


// Initialize the extension zips. Returns an object like:
//  { chrome: chromeZip, firefox: firefoxZip }
function setUpZips() {
  file.mkdirsSync(DIST_DIR);
  if (fs.existsSync(CHROME_EXTENSION)) {
    fs.unlinkSync(CHROME_EXTENSION);
  }

  if (fs.existsSync(FIREFOX_EXTENSION)) {
    fs.unlinkSync(FIREFOX_EXTENSION);
  }

  var chromeZip = new archiver('zip'); // Chrome will reject the zip if there's no compression
  var firefoxZip = new archiver('zip', {store: true});

  chromeZip.on('error', function(err) {
    console.log('chromeZip error:', err);
    throw err;
  });

  firefoxZip.on('error', function(err) {
    console.log('firefoxZip error:', err);
    throw err;
  });

  chromeZip.pipe(fs.createWriteStream(CHROME_EXTENSION));
  firefoxZip.pipe(fs.createWriteStream(FIREFOX_EXTENSION));

  return {
    chrome: chromeZip,
    firefox: firefoxZip
  };
}


function main() {
  var zips = setUpZips();

  file.walkSync(SRC_DIR, function(dirPath, dirs, files) {
    for (var i = 0; i < files.length; i++) {
      var fullPath = file.path.join(dirPath, files[i]);

      var fnameChrome = fnameMatch(fullPath, CHROME_INPUT);
      var fnameFirefox = fnameMatch(fullPath, FIREFOX_INPUT);

      if (fnameChrome) {
        addChromeFile(zips.chrome, fullPath, fnameChrome);
      }

      if (fnameFirefox) {
        addFirefoxFile(zips.firefox, fullPath, fnameFirefox);
      }
    }
  });

  zips.chrome.finalize();
  zips.firefox.finalize();

  console.log('Done! Built extensions written to', DIST_DIR);
}

main();
