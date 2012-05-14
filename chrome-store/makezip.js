/*
 * A simple utility to zip up the files necessary for uploading a new release to
 * the Chrome Web Store.
 */

var fs = require('fs');
var path = require('path');
var zip = require('node-native-zip');

// Change our path to be relative to the project root (i.e., relative to the manifest).
process.chdir(path.dirname(__dirname));

var manifest = JSON.parse(fs.readFileSync('manifest.json'));

var archive = new zip();

var files = [];

files.push({name: 'manifest.json', path: 'manifest.json'});
files.push({name: manifest.background_page, path: manifest.background_page});

for (var iconsize in manifest.icons) {
  files.push({name: manifest.icons[iconsize], path: manifest.icons[iconsize]});
}

for (var i in manifest.content_scripts) {
  for (var j in manifest.content_scripts[i].js) {
    var scriptfile = manifest.content_scripts[i].js[j];
    files.push({name: scriptfile, path: scriptfile});
  }
}

archive.addFiles(files, function (err) {
  if (err) return console.log("err while adding files", err);

  var buff = archive.toBuffer();

  fs.writeFile(path.join(__dirname, "markdown-here.zip"), buff, function () {
      console.log("Finished");
  });
});
