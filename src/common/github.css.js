/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

;(function() {

var markdownHereCss = ' \
/* \
 \
github.com style (c) Vasily Polovnyov <vast@whiteants.net> \
 \
*/ \
 \
pre code { \
  display: block; padding: 0.5em; \
  color: #000; \
  background: #f8f8ff \
} \
 \
pre .comment, \
pre .template_comment, \
pre .diff .header, \
pre .javadoc { \
  color: #998; \
  font-style: italic \
} \
 \
pre .keyword, \
pre .css .rule .keyword, \
pre .winutils, \
pre .javascript .title, \
pre .lisp .title, \
pre .subst { \
  color: #000; \
  font-weight: bold \
} \
 \
pre .number, \
pre .hexcolor { \
  color: #40a070 \
} \
 \
pre .string, \
pre .tag .value, \
pre .phpdoc, \
pre .tex .formula { \
  color: #d14 \
} \
 \
pre .title, \
pre .id { \
  color: #900; \
  font-weight: bold \
} \
 \
pre .javascript .title, \
pre .lisp .title, \
pre .subst { \
  font-weight: normal \
} \
 \
pre .class .title, \
pre .haskell .label, \
pre .tex .command { \
  color: #458; \
  font-weight: bold \
} \
 \
pre .tag, \
pre .tag .title, \
pre .rules .property, \
pre .django .tag .keyword { \
  color: #000080; \
  font-weight: normal \
} \
 \
pre .attribute, \
pre .variable, \
pre .instancevar, \
pre .lisp .body { \
  color: #008080 \
} \
 \
pre .regexp { \
  color: #009926 \
} \
 \
pre .class { \
  color: #458; \
  font-weight: bold \
} \
 \
pre .symbol, \
pre .ruby .symbol .string, \
pre .ruby .symbol .keyword, \
pre .ruby .symbol .keymethods, \
pre .lisp .keyword, \
pre .tex .special, \
pre .input_number { \
  color: #990073 \
} \
 \
pre .builtin, \
pre .built_in, \
pre .lisp .title { \
  color: #0086b3 \
} \
 \
pre .preprocessor, \
pre .pi, \
pre .doctype, \
pre .shebang, \
pre .cdata { \
  color: #999; \
  font-weight: bold \
} \
 \
pre .deletion { \
  background: #fdd \
} \
 \
pre .addition { \
  background: #dfd \
} \
 \
pre .diff .change { \
  background: #0086b3 \
} \
 \
pre .chunk { \
  color: #aaa \
} \
 \
pre .tex .formula { \
  opacity: 0.5; \
} \
\
/* Based on: https://gist.github.com/1082608 */ \
/* This is the overall wrapper, it should be treated as the `body` section. */ \
.markdown-here-wrapper{ /* adam-p: changed from body */ \
    font-family: helvetica, arial, freesans, clean, sans-serif; \
    color: #333; \
    background-color: #fff; \
    border: none; \
    line-height: 1.5; \
    text-align:left; \
} \
pre{ \
    padding: 10px; \
    -webkit-border-radius: 5px; \
    -moz-border-radius: 5px; \
    border-radius: 5px; \
    border: 1px solid #CCC; \
    overflow: auto; \
} \
code{ \
    padding: 1px 0px; \
    -webkit-border-radius: 2px; \
    -moz-border-radius: 2px; \
    border-radius: 2px;  \
    white-space: pre; \
    display: inline; /* adam-p: added to fix Yahoo block display */ \
} \
li p{ \
    margin: 0.3em; \
} \
a:link, a:visited{ \
    color: #33e; \
    text-decoration: none; \
} \
a:hover{ \
    color: #00f; \
    text-shadow:1px 1px 2px #ccf; \
    text-decoration:underline; \
} \
h1{ \
    color: #999; \
    font-weight: bold; \
} \
h2{ \
    border-bottom: 1px dotted #aaa; \
    margin-bottom: 1em; \
    color: #333; \
} \
h3{ \
    color: #666; \
} \
.shadow{ \
    -webkit-box-shadow:0 5px 15px #000; \
    -moz-box-shadow:0 5px 15px #000; \
    box-shadow:0 5px 15px #000;      \
} \
';

var EXPORTED_SYMBOLS = ['markdownHereCss'];

if (typeof module !== 'undefined') {
  module.exports = markdownHereCss;
} else {
  this.markdownHereCss = markdownHereCss;
  this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
