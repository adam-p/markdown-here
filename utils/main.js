/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

/* jslint node: true */
"use strict";

var fs = require('fs');

var stringBundle = JSON.parse(fs.readFileSync('../src/_locales/en/messages.json'));

var mozPropertiesFilename = '../src/firefox/chrome/locale/en-US/strings.properties';
fs.truncateSync(mozPropertiesFilename, 0);

var mozDtdFilename = '../src/firefox/chrome/locale/en-US/strings.dtd';
fs.truncateSync(mozDtdFilename, 0);

var key, message;
for (key in stringBundle) {
  message = stringBundle[key]['message'];

  // Chrome i18n strings use dollar signs as placeholders, so $$ is actually a
  // single literal dollar sign.
  // TODO: Support placeholders cross-platform.
  message = message.replace(/\$\$/g, '$');

  message = message.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');

  fs.appendFile(mozPropertiesFilename, key + '=' + message + '\n');

  if (stringBundle[key]['inMozDTD']) {
    fs.appendFile(mozDtdFilename, '<!ENTITY ' + key + ' "' + message + '">\n' );
  }
}
