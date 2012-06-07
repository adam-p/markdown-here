/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

;(function() {

var markdownHereCss = ' \
\
/* This is the overall wrapper, it should be treated as the `body` section. */ \
.markdown-here-wrapper { /* adam-p: changed from body */ \
  font: 14px Helvetica,arial,freesans,clean,sans-serif; \
  color: #333; \
  background-color: #fff; \
  border: none; \
  line-height: 1.5; \
  text-align:left; \
} \
pre, code { \
  font-size: 12px; \
  font-family: "Bitstream Vera Sans Mono","Courier",monospace; \
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
p, blockquote, ul, ol, dl, li, table, pre { \
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
blockquote { \
  border-left: 4px solid #DDD; \
  padding: 0 15px; \
  color: #777; \
} \
blockquote, q { \
  quotes: none; \
} \
blockquote::before, blockquote::after, q::before, q::after { \
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
  box-shadow:0 5px 15px #000;      \
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
Original style from softwaremaniacs.org (c) Ivan Sagalaev <Maniac@SoftwareManiacs.Org> \
 \
*/ \
 \
pre code { \
  display: block; padding: 0.5em; \
  background: #F0F0F0; \
} \
 \
pre code, \
pre .ruby .subst, \
pre .tag .title, \
pre .lisp .title { \
  color: black; \
} \
 \
pre .string, \
pre .title, \
pre .constant, \
pre .parent, \
pre .tag .value, \
pre .rules .value, \
pre .rules .value .number, \
pre .preprocessor, \
pre .ruby .symbol, \
pre .ruby .symbol .string, \
pre .ruby .symbol .keyword, \
pre .ruby .symbol .keymethods, \
pre .instancevar, \
pre .aggregate, \
pre .template_tag, \
pre .django .variable, \
pre .smalltalk .class, \
pre .addition, \
pre .flow, \
pre .stream, \
pre .bash .variable, \
pre .apache .tag, \
pre .apache .cbracket, \
pre .tex .command, \
pre .tex .special, \
pre .erlang_repl .function_or_atom, \
pre .markdown .header { \
  color: #800; \
} \
 \
pre .comment, \
pre .annotation, \
pre .template_comment, \
pre .diff .header, \
pre .chunk, \
pre .markdown .blockquote { \
  color: #888; \
} \
 \
pre .number, \
pre .date, \
pre .regexp, \
pre .literal, \
pre .smalltalk .symbol, \
pre .smalltalk .char, \
pre .go .constant, \
pre .change, \
pre .markdown .bullet, \
pre .markdown .link_url { \
  color: #080; \
} \
 \
pre .label, \
pre .javadoc, \
pre .ruby .string, \
pre .decorator, \
pre .filter .argument, \
pre .localvars, \
pre .array, \
pre .attr_selector, \
pre .important, \
pre .pseudo, \
pre .pi, \
pre .doctype, \
pre .deletion, \
pre .envvar, \
pre .shebang, \
pre .apache .sqbracket, \
pre .nginx .built_in, \
pre .tex .formula, \
pre .erlang_repl .reserved, \
pre .input_number, \
pre .markdown .link_label { \
  color: #88F \
} \
 \
pre .keyword, \
pre .id, \
pre .phpdoc, \
pre .title, \
pre .built_in, \
pre .aggregate, \
pre .css .tag, \
pre .javadoctag, \
pre .phpdoc, \
pre .yardoctag, \
pre .smalltalk .class, \
pre .winutils, \
pre .bash .variable, \
pre .apache .tag, \
pre .go .typename, \
pre .tex .command, \
pre .markdown .strong { \
  font-weight: bold; \
} \
 \
pre .markdown .emphasis { \
  font-style: italic; \
} \
 \
pre .nginx .built_in { \
  font-weight: normal; \
} \
 \
pre .coffeescript .javascript, \
pre .xml .css, \
pre .xml .javascript, \
pre .xml .vbscript, \
pre .tex .formula { \
  opacity: 0.5; \
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
