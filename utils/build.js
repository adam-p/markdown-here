/*
 * Copyright Adam Pritchard 2015
 * MIT License : http://adampritchard.mit-license.org/
 */

/* jslint node: true */
"use strict";

var fs = require('fs');
var file = require('file');
var archiver = require('archiver');
var MetaScript = require('MetaScript');


var BASE_DIR = '..';
var SRC_DIR = file.path.join(BASE_DIR, 'src');
var DIST_DIR = file.path.join(BASE_DIR, 'dist');

var CHROME_EXTENSION = file.path.join(DIST_DIR, 'chrome.zip');
var FIREFOX_EXTENSION = file.path.join(DIST_DIR, 'firefox.zip');
var THUNDERBIRD_EXTENSION = file.path.join(DIST_DIR, 'thunderbird.xpi');

var CHROME_INPUT = [/^manifest\.json$/, /^common(\\|\/)/, /^chrome(\\|\/)/, /^_locales(\\|\/)/];
var FIREFOX_INPUT = CHROME_INPUT;
var THUNDERBIRD_INPUT = [/^chrome.manifest$/, /^install.rdf$/, /^common(\\|\/)/, /^firefox(\\|\/)/];

var CHROME_PLATFORM = 'chrome';
var FIREFOX_PLATFORM = 'firefox';
var THUNDERBIRD_PLATFORM = 'thunderbird';

var skipFileRegexes = [/^common(\\|\/)test(\\|\/)/,
                       // OS files and temp files
                       /\.DS_Store$/, /.+\.bts$/, /desktop\.ini$/, /Thumbs.db$/];
var javascriptFileRegex = /.+\.js$/;
var manifestJsonFileRegex = /manifest\.json$/


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
function addBuildFile(platformName, zip, fullPath, zipPath) {
  var fileContents;

  // For the Mozilla extensions in particular, we need to do some preprocessing on JavaScript files
  // in order to exclude code specific to other platforms.
  if (javascriptFileRegex.test(fullPath)) {
    fileContents = fs.readFileSync(fullPath);
    fileContents = MetaScript.transform(fileContents, {platform: platformName});
    zip.append(fileContents, { name: zipPath });
  }
  else if (platformName === CHROME_PLATFORM && manifestJsonFileRegex.test(fullPath)) {
    // Remove the Firefox-specific stuff from manifest.json when building for Chrome.
    fileContents = fs.readFileSync(fullPath, {encoding: 'utf8'});
    fileContents = fileContents.replace(/,"applications":[^{]*{[^{]*{[^}]*}[^}]*}/m, '');
    zip.append(fileContents, { name: zipPath });
  }
  else {
    zip.file(fullPath, { name: zipPath });
  }
}


// Initialize the extension zips. Returns an object like:
//  { chrome: chromeZip, firefox: firefoxZip, thunderbird: thunderbirdZip }
function setUpZips() {
  file.mkdirsSync(DIST_DIR);
  if (fs.existsSync(CHROME_EXTENSION)) {
    fs.unlinkSync(CHROME_EXTENSION);
  }

  if (fs.existsSync(FIREFOX_EXTENSION)) {
    fs.unlinkSync(FIREFOX_EXTENSION);
  }

  if (fs.existsSync(THUNDERBIRD_EXTENSION)) {
    fs.unlinkSync(THUNDERBIRD_EXTENSION);
  }

  var chromeZip = new archiver('zip'); // Chrome will reject the zip if there's no compression
  var firefoxZip = new archiver('zip');
  var thunderbirdZip = new archiver('zip'); // addons.thunderbird.net rejects the xpi if there's no compression

  chromeZip.on('error', function(err) {
    console.log('chromeZip error:', err);
    throw err;
  });

  firefoxZip.on('error', function(err) {
    console.log('firefoxZip error:', err);
    throw err;
  });

  thunderbirdZip.on('error', function(err) {
    console.log('thunderbirdZip error:', err);
    throw err;
  });

  chromeZip.pipe(fs.createWriteStream(CHROME_EXTENSION));
  firefoxZip.pipe(fs.createWriteStream(FIREFOX_EXTENSION));
  thunderbirdZip.pipe(fs.createWriteStream(THUNDERBIRD_EXTENSION));

  return {
    chrome: chromeZip,
    firefox: firefoxZip,
    thunderbird: thunderbirdZip
  };
}


function main() {
  var zips = setUpZips();

  file.walkSync(SRC_DIR, function(dirPath, dirs, files) {
    for (var i = 0; i < files.length; i++) {
      var fullPath = file.path.join(dirPath, files[i]);

      var fnameChrome = fnameMatch(fullPath, CHROME_INPUT);
      var fnameFirefox = fnameMatch(fullPath, FIREFOX_INPUT);
      var fnameThunderbird = fnameMatch(fullPath, THUNDERBIRD_INPUT);

      if (fnameChrome) {
        addBuildFile(CHROME_PLATFORM, zips.chrome, fullPath, fnameChrome);
      }

      if (fnameFirefox) {
        addBuildFile(FIREFOX_PLATFORM, zips.firefox, fullPath, fnameFirefox);
      }

      if (fnameThunderbird) {
        addBuildFile(THUNDERBIRD_PLATFORM, zips.thunderbird, fullPath, fnameThunderbird);
      }
    }
  });

  zips.chrome.finalize();
  zips.firefox.finalize();
  zips.thunderbird.finalize();

  console.log('Done! Built extensions written to', DIST_DIR);
}

main();
