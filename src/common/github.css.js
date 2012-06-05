/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

;(function() {

var markdownHereCss = ' \
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
    padding: 5px; \
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
