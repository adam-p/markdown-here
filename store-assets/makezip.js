/*
 * A simple utility to zip up the files necessary for uploading a new release to
 * the Chrome Web Store.
 */

var fs = require('fs');
var path = require('path');
var zip = require('node-native-zip');

// Change our path to be relative to the project root (i.e., relative to the manifest).
__dirname = path.join(path.dirname(__dirname), 'src');
process.chdir(__dirname);

function makeChromeExtension() {
  var files = [], backgroundLines, manifest, iconsize, i, j, scriptfile, match;

  manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

  files.push({name: 'manifest.json', path: 'manifest.json'});

  for (iconsize in manifest.icons) {
    files.push({name: manifest.icons[iconsize], path: manifest.icons[iconsize]});
  }

  for (i = 0; i < manifest.content_scripts.length; i++) {
    for (j = 0; j < manifest.content_scripts[i].js.length; j++) {
      scriptfile = manifest.content_scripts[i].js[j];
      files.push({name: scriptfile, path: scriptfile});
    }
  }

  for (i = 0; i < manifest.background.scripts.length; i++) {
    scriptfile = manifest.background.scripts[i];
    files.push({name: scriptfile, path: scriptfile});
  }

  console.log('--- makeChromeExtension ---');
  for (i = 0; i < files.length; i++) {
    console.log(files[i].name);
  }
  console.log('---------------------------\n');

  zipFiles(files, 'markdown-here.zip');
}

function makeFirefoxExtension() {
  var files = [], paths = [], pathMap = {}, i, manifestLines, line;

  // These helper functions are badly inefficient, but it doesn't matter.

  function convertURItoPath(uri) {
    var pathMapKey;
    for (pathMapKey in pathMap) {
      if (uri.substring(0, pathMapKey.length) === pathMapKey) {
        return pathMap[pathMapKey] + uri.substring(pathMapKey.length);
      }
    }

    throw 'pathMap not found for URI: ' + uri;
  }

  function extractPathFromLine(line) {
    var pathMapKey, regex, regexMatch;
    for (pathMapKey in pathMap) {
      regex = new RegExp('.*('+pathMapKey+')(.*?)[\"\'<].*');
      regexMatch = line.match(regex);
      if (!regexMatch || regexMatch.length < 3) continue;

      return pathMap[pathMapKey] + regexMatch[2];
    }

    return null;
  }

  function extractPaths(lines) {
    var i, paths = [], path;
    for (i = 0; i < lines.length; i++) {
      path = extractPathFromLine(lines[i]);
      if (path) paths.push(path);
    }
    return paths;
  }

  // There's going to be some ugly special-case-ness mixed with generic-ness here...

  paths.push('chrome.manifest');
  manifestLines = fs.readFileSync('chrome.manifest', 'utf8').split('\n');
  for (i = 0; i < manifestLines.length; i++) {
    line = manifestLines[i].split(/\s+/g);
    if (line[0] === 'resource') {
      pathMap['resource://'+line[1]+'/'] = line[line.length-1];
    }
    else if (line[0] === 'overlay') {
      // Assume the overlay lines come last in the manifest
      paths.push(convertURItoPath(line[2]));
    }
    else {
      pathMap['chrome://'+line[1]+'/'+line[0]+'/'] = line[line.length-1];
    }
  }

  paths.push('install.rdf');
  installRdfLines = fs.readFileSync('install.rdf', 'utf8').split('\n');
  paths = paths.concat(extractPaths(installRdfLines));

  function deeplyProcessFiles(paths) {
    var i, newPaths = [], lines;

    if (paths.length === 0) {
      return [];
    }

    for (i = 0; i < paths.length; i++) {
      if (paths[i].search(/(\.js|\.xul)$/) > 0) {
        lines = fs.readFileSync(paths[i], 'utf8').split('\n');
        newPaths = newPaths.concat(extractPaths(lines));
      }
    }

    // Remove duplicate paths -- we don't want them, and they could indicate a
    // cycle, which would result in infinite recursion.
    newPaths = newPaths.filter(function(newPath) {
      for (i = 0; i < paths.length; i++) {
        if (newPath === paths[i]) {
          return false;
        }
      }
      return true;
    });

    // recursive call
    return newPaths.concat(deeplyProcessFiles(newPaths));
  }

  paths = paths.concat(deeplyProcessFiles(paths));

  paths.forEach(function(path) {
    var duplicate = files.some(function(element) {
      return element.name === path;
    });
    if (!duplicate) {
      files.push({name: path, path: path});
    }
  });

  console.log('--- makeFirefoxExtension ---');
  for (i = 0; i < files.length; i++) {
    console.log(files[i].name);
  }
  console.log('----------------------------\n');

  zipFiles(files, 'markdown_here.xpi');
}

function zipFiles(files, outputFilename) {
  var archive = new zip();

  archive.addFiles(files, function (err) {
    if (err) {
      console.log("err while adding files");
      throw err;
    }

    var buff = archive.toBuffer();

    fs.writeFileSync(path.join(__dirname, outputFilename), buff);

    console.log("Wrote " + outputFilename);
  });
}

makeChromeExtension();
makeFirefoxExtension();
