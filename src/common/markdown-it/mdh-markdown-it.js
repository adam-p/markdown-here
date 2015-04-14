/*
 * Copyright Adam Pritchard 2015
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/*jshint node:true*/

var MarkdownIt = require('markdown-it');

var markdownItPlugins = {
  footnote: require('markdown-it-footnote')
};


// If `enabledPlugins` is null, all plugins will be enabled.
// `options` can be null and then set later using [`.set()`](https://markdown-it.github.io/markdown-it/#MarkdownIt.set)
function get(enabledPlugins, options) {
  enabledPlugins = enabledPlugins || [];

  var md = new MarkdownIt('default', options);

  for (var plugin in markdownItPlugins) {
    if (!enabledPlugins || plugin in enabledPlugins) {
      md.use(markdownItPlugins[plugin]);
    }
  }

  return md;
}

module.exports = {
  get: get
};
