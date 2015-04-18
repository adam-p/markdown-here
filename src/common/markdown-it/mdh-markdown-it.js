/*
 * Copyright Adam Pritchard 2015
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/*jshint node:true*/

var MarkdownIt = require('markdown-it');

var requiredMarkdownItPlugins = {
  linkscheme: require('markdown-it-linkscheme')
};

var optionalMarkdownItPlugins = {
  footnote: require('markdown-it-footnote'),
  smartarrows: require('markdown-it-smartarrows')
};


// If `enabledPlugins` is null, all plugins will be enabled.
// `options` can be null and then set later using [`.set()`](https://markdown-it.github.io/markdown-it/#MarkdownIt.set)
function get(enabledPlugins, options) {
  var md = new MarkdownIt('default', options);

  var plugin;
  for (plugin in requiredMarkdownItPlugins) {
    md.use(requiredMarkdownItPlugins[plugin]);
  }

  for (plugin in optionalMarkdownItPlugins) {
    if (!enabledPlugins || plugin in enabledPlugins) {
      md.use(optionalMarkdownItPlugins[plugin]);
    }
  }

  return md;
}

module.exports = {
  get: get
};
