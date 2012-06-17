/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

;(function() {

var markdownHereCss = " \
\
/* NOTE: \
 * - Do not use multi-word fonts. Gmail will strip them and kill following \
 *   styles. Sometimes. \
 */ \
\
/* This is the overall wrapper, it should be treated as the `body` section. */ \
.markdown-here-wrapper { /* adam-p: changed from body */ \
  font: 14px Helvetica,arial,freesans,clean,sans-serif; \
  color: #333; \
  background-color: #fff; \
  border: none; \
  line-height: 1.2; \
  text-align:left; \
} \
pre, code { \
  font-size: 12px; \
  font-family: Consolas, Inconsolata, Courier, monospace; \
} \
code { \
  margin: 0 2px; \
  padding: 0 5px; \
  white-space: nowrap; \
  border: 1px solid #EAEAEA; \
  background-color: #F8F8F8; \
  border-radius: 3px; \
  display: inline; /* adam-p: added to fix Yahoo block display */ \
} \
pre { \
  font-size: 13px; \
  line-height: 19px; \
  overflow: auto; \
} \
pre code { \
  white-space: pre; \
  border-radius: 3px; \
  border: 1px solid #CCC; \
  padding: 6px 10px; \
} \
ul, ol { \
  padding-left: 30px; \
} \
p, blockquote:not(.markdown-here-exclude), ul, ol, dl, li, table, pre { \
  margin: 15px 0; \
} \
dl { \
  padding: 0; \
} \
dl dt { \
  font-size: 14px; \
  font-weight: bold; \
  font-style: italic; \
  padding: 0; \
  margin: 15px 0 5px; \
} \
dl dd { \
  margin: 0 0 15px; \
  padding: 0 15px; \
} \
blockquote:not(.markdown-here-exclude) { \
  border-left: 4px solid #DDD; \
  padding: 0 15px; \
  color: #777; \
} \
blockquote:not(.markdown-here-exclude), q { \
  quotes: none; \
} \
blockquote:not(.markdown-here-exclude)::before, blockquote:not(.markdown-here-exclude)::after, q::before, q::after { \
  content: none; \
} \
a:link, a:visited { \
  color: #33e; \
  text-decoration: none; \
} \
a:hover { \
  color: #00f; \
  text-shadow:1px 1px 2px #ccf; \
  text-decoration:underline; \
} \
h1, h2, h3, h4, h5, h6 { \
  margin: 20px 0 10px; \
  padding: 0; \
  font-weight: bold; \
  color: black; \
  cursor: text; \
  position: relative; \
} \
h1 { \
  font-size: 28px; \
} \
h2 { \
  font-size: 24px; \
  border-bottom: 1px solid #CCC; \
} \
h3 { \
  font-size: 18px; \
} \
h4 { \
  font-size: 16px; \
} \
h5 { \
  font-size: 14px; \
} \
h6 { \
  font-size: 14px; \
  color: #777; \
} \
.shadow { \
  box-shadow:0 5px 15px #000; \
} \
table { \
  padding: 0; \
  border-collapse: collapse; \
  border-spacing: 0; \
  font-size: 100%; \
  font: inherit; \
  border: 0; \
} \
tbody { \
  margin: 0; \
  padding: 0; \
  border: 0; \
} \
table tr { \
  border: 0; \
  border-top: 1px solid #CCC; \
  background-color: white; \
  margin: 0; \
  padding: 0; \
} \
table tr:nth-child(2n) { \
  background-color: #F8F8F8; \
} \
table tr th, table tr td { \
  border: 1px solid #CCC; \
  text-align: left; \
  margin: 0; \
  padding: 6px 13px; \
} \
table tr th { \
 font-weight: bold; \
} \
\
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
pre .nginx .title, \
pre .subst, \
pre .request, \
pre .status { \
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
pre .haskell .type, \
pre .vhdl .literal, \
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
";

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
