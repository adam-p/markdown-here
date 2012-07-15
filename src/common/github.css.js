/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

;(function() {

var markdownHereCss = "\
\
/* NOTE: \n\
 * - Do not use multi-word fonts. Gmail will strip them and kill following \n\
 *   styles. Sometimes. \n\
 */ \n\
\n\
/* This is the overall wrapper, it should be treated as the `body` section. */ \n\
.markdown-here-wrapper { \n\
  font: 14px Helvetica,arial,freesans,clean,sans-serif; \n\
  color: #333; \n\
  background-color: #fff; \n\
  border: none; \n\
  line-height: 1.2; \n\
  text-align:left; \n\
} \n\
pre, code { \n\
  font-size: 12px; \n\
  font-family: Consolas, Inconsolata, Courier, monospace; \n\
} \n\
code { \n\
  margin: 0 2px; \n\
  padding: 0 5px; \n\
  white-space: nowrap; \n\
  border: 1px solid #EAEAEA; \n\
  background-color: #F8F8F8; \n\
  border-radius: 3px; \n\
  display: inline; /* adam-p: added to fix Yahoo block display */ \n\
} \n\
pre { \n\
  font-size: 13px; \n\
  line-height: 19px; \n\
  overflow: auto; \n\
} \n\
pre code { \n\
  white-space: pre; \n\
  border-radius: 3px; \n\
  border: 1px solid #CCC; \n\
  padding: 6px 10px; \n\
} \n\
ul, ol { \n\
  padding-left: 30px; \n\
} \n\
p, blockquote:not(.markdown-here-exclude), ul, ol, dl, li, table, pre { \n\
  margin: 15px 0; \n\
} \n\
dl { \n\
  padding: 0; \n\
} \n\
dl dt { \n\
  font-size: 14px; \n\
  font-weight: bold; \n\
  font-style: italic; \n\
  padding: 0; \n\
  margin: 15px 0 5px; \n\
} \n\
dl dd { \n\
  margin: 0 0 15px; \n\
  padding: 0 15px; \n\
} \n\
blockquote:not(.markdown-here-exclude) { \n\
  border-left: 4px solid #DDD; \n\
  padding: 0 15px; \n\
  color: #777; \n\
} \n\
blockquote:not(.markdown-here-exclude), q { \n\
  quotes: none; \n\
} \n\
blockquote:not(.markdown-here-exclude)::before, blockquote:not(.markdown-here-exclude)::after, q::before, q::after { \n\
  content: none; \n\
} \n\
a:link, a:visited { \n\
  color: #33e; \n\
  text-decoration: none; \n\
} \n\
a:hover { \n\
  color: #00f; \n\
  text-shadow:1px 1px 2px #ccf; \n\
  text-decoration:underline; \n\
} \n\
h1, h2, h3, h4, h5, h6 { \n\
  margin: 20px 0 10px; \n\
  padding: 0; \n\
  font-weight: bold; \n\
  color: black; \n\
  cursor: text; \n\
  position: relative; \n\
} \n\
h1 { \n\
  font-size: 28px; \n\
} \n\
h2 { \n\
  font-size: 24px; \n\
  border-bottom: 1px solid #CCC; \n\
} \n\
h3 { \n\
  font-size: 18px; \n\
} \n\
h4 { \n\
  font-size: 16px; \n\
} \n\
h5 { \n\
  font-size: 14px; \n\
} \n\
h6 { \n\
  font-size: 14px; \n\
  color: #777; \n\
} \n\
.shadow { \n\
  box-shadow:0 5px 15px #000; \n\
} \n\
table { \n\
  padding: 0; \n\
  border-collapse: collapse; \n\
  border-spacing: 0; \n\
  font-size: 100%; \n\
  font: inherit; \n\
  border: 0; \n\
} \n\
tbody { \n\
  margin: 0; \n\
  padding: 0; \n\
  border: 0; \n\
} \n\
table tr { \n\
  border: 0; \n\
  border-top: 1px solid #CCC; \n\
  background-color: white; \n\
  margin: 0; \n\
  padding: 0; \n\
} \n\
table tr:nth-child(2n) { \n\
  background-color: #F8F8F8; \n\
} \n\
table tr th, table tr td { \n\
  border: 1px solid #CCC; \n\
  text-align: left; \n\
  margin: 0; \n\
  padding: 6px 13px; \n\
} \n\
table tr th { \n\
 font-weight: bold; \n\
} \
";

var markdownHereSyntaxCss = "\
/* \n\
 \n\
github.com style (c) Vasily Polovnyov <vast@whiteants.net> \n\
 \n\
*/ \n\
 \n\
pre code { \n\
  display: block; padding: 0.5em; \n\
  color: #000; \n\
  background: #f8f8ff \n\
} \n\
 \n\
pre .comment, \n\
pre .template_comment, \n\
pre .diff .header, \n\
pre .javadoc { \n\
  color: #998; \n\
  font-style: italic \n\
} \n\
 \n\
pre .keyword, \n\
pre .css .rule .keyword, \n\
pre .winutils, \n\
pre .javascript .title, \n\
pre .lisp .title, \n\
pre .nginx .title, \n\
pre .subst, \n\
pre .request, \n\
pre .status { \n\
  color: #000; \n\
  font-weight: bold \n\
} \n\
 \n\
pre .number, \n\
pre .hexcolor { \n\
  color: #40a070 \n\
} \n\
 \n\
pre .string, \n\
pre .tag .value, \n\
pre .phpdoc, \n\
pre .tex .formula { \n\
  color: #d14 \n\
} \n\
 \n\
pre .title, \n\
pre .id { \n\
  color: #900; \n\
  font-weight: bold \n\
} \n\
 \n\
pre .javascript .title, \n\
pre .lisp .title, \n\
pre .subst { \n\
  font-weight: normal \n\
} \n\
 \n\
pre .class .title, \n\
pre .haskell .type, \n\
pre .vhdl .literal, \n\
pre .tex .command { \n\
  color: #458; \n\
  font-weight: bold \n\
} \n\
 \n\
pre .tag, \n\
pre .tag .title, \n\
pre .rules .property, \n\
pre .django .tag .keyword { \n\
  color: #000080; \n\
  font-weight: normal \n\
} \n\
 \n\
pre .attribute, \n\
pre .variable, \n\
pre .instancevar, \n\
pre .lisp .body { \n\
  color: #008080 \n\
} \n\
 \n\
pre .regexp { \n\
  color: #009926 \n\
} \n\
 \n\
pre .class { \n\
  color: #458; \n\
  font-weight: bold \n\
} \n\
 \n\
pre .symbol, \n\
pre .ruby .symbol .string, \n\
pre .ruby .symbol .keyword, \n\
pre .ruby .symbol .keymethods, \n\
pre .lisp .keyword, \n\
pre .tex .special, \n\
pre .input_number { \n\
  color: #990073 \n\
} \n\
 \n\
pre .builtin, \n\
pre .built_in, \n\
pre .lisp .title { \n\
  color: #0086b3 \n\
} \n\
 \n\
pre .preprocessor, \n\
pre .pi, \n\
pre .doctype, \n\
pre .shebang, \n\
pre .cdata { \n\
  color: #999; \n\
  font-weight: bold \n\
} \n\
 \n\
pre .deletion { \n\
  background: #fdd \n\
} \n\
 \n\
pre .addition { \n\
  background: #dfd \n\
} \n\
 \n\
pre .diff .change { \n\
  background: #0086b3 \n\
} \n\
 \n\
pre .chunk { \n\
  color: #aaa \n\
} \n\
 \n\
pre .tex .formula { \n\
  opacity: 0.5; \n\
} \n\
";

var EXPORTED_SYMBOLS = ['markdownHereCss', 'markdownHereSyntaxCss'];

if (typeof module !== 'undefined') {
  module.exports.markdownHereCss = markdownHereCss;
  module.exports.markdownHereSyntaxCss = markdownHereSyntaxCss;
} else {
  this.markdownHereSyntaxCss = markdownHereSyntaxCss;
  this.markdownHereCss = markdownHereCss;
  this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
