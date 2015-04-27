/*
 * Copyright Adam Pritchard 2015
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/*jshint node:true*/

/* TODO:
- Okay to use global stuff like JSON? Or need to make calls to Utils?
*/

var MarkdownIt = require('markdown-it');

var requiredMarkdownItPlugins = {
};

var optionalMarkdownItPlugins = {
  linkscheme: require('markdown-it-linkscheme'),
  footnotes: require('markdown-it-footnote'),
  smartarrows: require('markdown-it-smartarrows'),
  headingAnchors: require('markdown-it-headinganchor'),
  math: require('markdown-it-math')
};


// When possible, we would like to avoid re-instantiating the renderer instance.
var g_cachedRenderer = {
  renderer: null,
  optionsJSON: null,
  pluginsJSON: null
};


function get(options) {
  options = options || {};

  // HACK: Using a stringified version of options for object-comparison purposes.
  var optionsJSON = JSON.stringify(options);

  if (g_cachedRenderer.renderer &&
      g_cachedRenderer.optionsJSON === optionsJSON) {
    return g_cachedRenderer.renderer;
  }

  var markdownitOptions = {
    html: true,       // Enable HTML tags in source
    linkify: true,    // Autoconvert URL-like text to links

    // Enable some language-neutral replacement + quotes beautification
    typographer:  true,

    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Set doubles to '«»' for Russian, '„“' for German.
    quotes: '\u201c\u201d\u2018\u2019' /* “”‘’ */, // TODO: Make configurable, or localize.

    breaks: options.gfmLineBreaks, // Convert '\n' in paragraphs into <br>

    langPrefix: options.langPrefix, // CSS language prefix for fenced blocks.
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    highlight: options.highlight
  };

  var renderer = new MarkdownIt('default', markdownitOptions);

  var plugin;
  for (plugin in requiredMarkdownItPlugins) {
    renderer.use(requiredMarkdownItPlugins[plugin]);
  }

  if (options.headingAnchors !== false) {
    renderer.use(optionalMarkdownItPlugins.headingAnchors, {
      anchorClass: 'mdh-heading-anchor'
    });
  }

  if (options.linkscheme !== false) {
    renderer.use(optionalMarkdownItPlugins.linkscheme);
  }

  if (options.footnotes !== false) {
    renderer.use(optionalMarkdownItPlugins.footnotes);
  }

  if (options.smartarrows !== false) {
    renderer.use(optionalMarkdownItPlugins.smartarrows);
  }

  if (options.mathRenderer) {
    renderer.use(
      require('markdown-it-math'),
      {
        inlineOpen: '$',
        inlineClose: '$',
        inlineRenderer: options.mathRenderer
      });
  }

  g_cachedRenderer.renderer = renderer;
  g_cachedRenderer.optionsJSON = optionsJSON;

  return renderer;
}

module.exports = {
  get: get
};
