/*
 * Copyright Adam Pritchard 2015
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * The function that does the basic raw-Markdown-in-HTML to rendered-HTML
 * conversion.
 * The reason we keep this function -- specifically, the function that uses our
 * external markdown renderer (markdown-it.js), text-from-HTML module (jsHtmlToText.js),
 * and CSS -- separate is that it allows us to keep the bulk of the rendering
 * code (and the bulk of the code in our extension) out of the content script.
 * That way, we minimize the amount of code that needs to be loaded in every page.
 */

;(function() {

"use strict";
/*global module:false*/

var MarkdownRender = {};


/**
 Using the functionality provided by the functions htmlToText and markdownToHtml,
 render html into pretty text.
 */
function markdownRender(mdText, userprefs, MdhMarkdownIt, hljs) {
  function mathify(mathcode) {
    return userprefs['math-value']
            .replace(/\{mathcode\}/ig, mathcode)
            .replace(/\{urlmathcode\}/ig, encodeURIComponent(mathcode));
  }

  /* TODO:MD
  // Hook into some of Marked's renderer customizations
  var markedRenderer = new marked.Renderer();
  */

  /* TODO:MD
  var sanitizeLinkForAnchor = function(text) {
    return text.toLowerCase().replace(/[^\w]+/g, '-');
  };
  */

  /* TODO:MD
  var defaultHeadingRenderer = markedRenderer.heading;
  markedRenderer.heading = function (text, level, raw) {
    if (userprefs['header-anchors-enabled']) {
      // Add an anchor right above the heading. See MDH issue #93.
      var sanitizedText = sanitizeLinkForAnchor(text);
      var anchorLink = '<a href="#" name="' + sanitizedText + '"></a>';
      return '<h' + level + '>' +
             anchorLink +
             text +
             '</h' + level + '>\n';
    }
    else {
      return defaultHeadingRenderer.call(this, text, level, raw);
    }
  };
  */

  /* TODO:MD
  var defaultLinkRenderer = markedRenderer.link;
  markedRenderer.link = function(href, title, text) {
    // Added to fix MDH issue #57: MD links should automatically add scheme.
    // Note that the presence of a ':' is used to indicate a scheme, so port
    // numbers will defeat this.
    href = href.replace(/^(?!#)([^:]+)$/, 'http://$1');

    if (userprefs['header-anchors-enabled']) {
      // Add an anchor right above the heading. See MDH issue #93.
      if (href.indexOf('#') === 0) {
        href = '#' + sanitizeLinkForAnchor(href.slice(1).toLowerCase());
      }
    }

    return defaultLinkRenderer.call(this, href, title, text);
  };
  */

  /* TEMP: OLD
  var markdownitOptions = {
    gfm: true,
    pedantic: false,
    sanitize: false,
    tables: true,
    smartLists: true,
    breaks: userprefs['gfm-line-breaks-enabled'],
    smartypants: true,
    // Bit of a hack: highlight.js uses a `hljs` class to style the code block,
    // so we'll add it by sneaking it into this config field.
    langPrefix: 'hljs language-',
    math: userprefs['math-enabled'] ? mathify : null,
    highlight: function(codeText, codeLanguage) {
        if (codeLanguage &&
            hljs.getLanguage(codeLanguage.toLowerCase())) {
          return hljs.highlight(codeLanguage.toLowerCase(), codeText).value;
        }

        return codeText;
      }
    };
  */

  var rendererOptions = {
    gfmLineBreaks: userprefs['gfm-line-breaks-enabled'], // Convert '\n' in paragraphs into <br>

    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    highlight: function(codeText, codeLanguage) {
      if (codeLanguage &&
          hljs.getLanguage(codeLanguage.toLowerCase())) {
        return hljs.highlight(codeLanguage.toLowerCase(), codeText).value;
      }

      return '';
    },
    langPrefix: 'hljs language-', // CSS language prefix for fenced blocks.

    // MDH custom options
    headingAnchors: userprefs['header-anchors-enabled'],
    mathRenderer: userprefs['math-enabled'] ? mathify : null
  };

  // TODO: Enable/disable plugins
  var mdRender = MdhMarkdownIt.get(rendererOptions);
  var renderedMarkdown = mdRender.render(mdText);

  return renderedMarkdown;
}


// Expose these functions

MarkdownRender.markdownRender = markdownRender;

var EXPORTED_SYMBOLS = ['MarkdownRender'];

if (typeof module !== 'undefined') {
  module.exports = MarkdownRender;
} else {
  this.MarkdownRender = MarkdownRender;
  this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
