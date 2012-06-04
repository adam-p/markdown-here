/* Based on: https://gist.github.com/1082608 */

;(function() {

var markdownHereCss = ' \
/*  \
   Some simple Github-like styles, with syntax highlighting CSS via Pygments. \
*/ \
/* This is the overall wrapper, it should be treated as the `body` section. */ \
.markdown-here-wrapper{ /* adam-p: changed from body */ \
    font-family: helvetica, arial, freesans, clean, sans-serif; \
    color: #333; \
    background-color: #fff; \
    border: none; \
    line-height: 1.5; \
    /* margin: 2em 3em; adam-p: removed */ \
    text-align:left; \
} \
pre{ \
    background-color: #eee; \
    padding: 10px; \
    -webkit-border-radius: 5px; \
    -moz-border-radius: 5px; \
    border-radius: 5px; \
    overflow: auto; \
} \
code{ \
    background-color: #eee; \
    padding: 1px 0px; /* adam-p: changed from "1px 3px" */ \
    -webkit-border-radius: 2px; \
    -moz-border-radius: 2px; \
    border-radius: 2px;  \
    white-space: pre; /* adam-p: added */ \
    display: inline; /* adam-p: added to fix Yahoo block display */ \
} \
li p{ \
    margin: 0.3em; \
} \
/* adam-p: removed this \
li{ \
    list-style-type: disc; \
}*/ \
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
 \
.hll { background-color: #ffffcc } \
.c { color: #888888 } /* Comment */ \
.err { color: #a61717; background-color: #e3d2d2 } /* Error */ \
.k { color: #008800; font-weight: bold } /* Keyword */ \
.cm { color: #888888 } /* Comment.Multiline */ \
.cp { color: #cc0000; font-weight: bold } /* Comment.Preproc */ \
.c1 { color: #888888 } /* Comment.Single */ \
.cs { color: #cc0000; font-weight: bold; background-color: #fff0f0 } /* Comment.Special */ \
.gd { color: #000000; background-color: #ffdddd } /* Generic.Deleted */ \
.ge { font-style: italic } /* Generic.Emph */ \
.gr { color: #aa0000 } /* Generic.Error */ \
.gh { color: #303030 } /* Generic.Heading */ \
.gi { color: #000000; background-color: #ddffdd } /* Generic.Inserted */ \
.go { color: #888888 } /* Generic.Output */ \
.gp { color: #555555 } /* Generic.Prompt */ \
.gs { font-weight: bold } /* Generic.Strong */ \
.gu { color: #606060 } /* Generic.Subheading */ \
.gt { color: #aa0000 } /* Generic.Traceback */ \
.kc { color: #008800; font-weight: bold } /* Keyword.Constant */ \
.kd { color: #008800; font-weight: bold } /* Keyword.Declaration */ \
.kn { color: #008800; font-weight: bold } /* Keyword.Namespace */ \
.kp { color: #008800 } /* Keyword.Pseudo */ \
.kr { color: #008800; font-weight: bold } /* Keyword.Reserved */ \
.kt { color: #888888; font-weight: bold } /* Keyword.Type */ \
.m { color: #0000DD; font-weight: bold } /* Literal.Number */ \
.s { color: #dd2200; background-color: #fff0f0 } /* Literal.String */ \
.na { color: #336699 } /* Name.Attribute */ \
.nb { color: #003388 } /* Name.Builtin */ \
.nc { color: #bb0066; font-weight: bold } /* Name.Class */ \
.no { color: #003366; font-weight: bold } /* Name.Constant */ \
.nd { color: #555555 } /* Name.Decorator */ \
.ne { color: #bb0066; font-weight: bold } /* Name.Exception */ \
.nf { color: #0066bb; font-weight: bold } /* Name.Function */ \
.nl { color: #336699; font-style: italic } /* Name.Label */ \
.nn { color: #bb0066; font-weight: bold } /* Name.Namespace */ \
.py { color: #336699; font-weight: bold } /* Name.Property */ \
.nt { color: #bb0066; font-weight: bold } /* Name.Tag */ \
.nv { color: #336699 } /* Name.Variable */ \
.ow { color: #008800 } /* Operator.Word */ \
.w { color: #bbbbbb } /* Text.Whitespace */ \
.mf { color: #0000DD; font-weight: bold } /* Literal.Number.Float */ \
.mh { color: #0000DD; font-weight: bold } /* Literal.Number.Hex */ \
.mi { color: #0000DD; font-weight: bold } /* Literal.Number.Integer */ \
.mo { color: #0000DD; font-weight: bold } /* Literal.Number.Oct */ \
.sb { color: #dd2200; background-color: #fff0f0 } /* Literal.String.Backtick */ \
.sc { color: #dd2200; background-color: #fff0f0 } /* Literal.String.Char */ \
.sd { color: #dd2200; background-color: #fff0f0 } /* Literal.String.Doc */ \
.s2 { color: #dd2200; background-color: #fff0f0 } /* Literal.String.Double */ \
.se { color: #0044dd; background-color: #fff0f0 } /* Literal.String.Escape */ \
.sh { color: #dd2200; background-color: #fff0f0 } /* Literal.String.Heredoc */ \
.si { color: #3333bb; background-color: #fff0f0 } /* Literal.String.Interpol */ \
.sx { color: #22bb22; background-color: #f0fff0 } /* Literal.String.Other */ \
.sr { color: #008800; background-color: #fff0ff } /* Literal.String.Regex */ \
.s1 { color: #dd2200; background-color: #fff0f0 } /* Literal.String.Single */ \
.ss { color: #aa6600; background-color: #fff0f0 } /* Literal.String.Symbol */ \
.bp { color: #003388 } /* Name.Builtin.Pseudo */ \
.vc { color: #336699 } /* Name.Variable.Class */ \
.vg { color: #dd7700 } /* Name.Variable.Global */ \
.vi { color: #3333bb } /* Name.Variable.Instance */ \
.il { color: #0000DD; font-weight: bold } /* Literal.Number.Integer.Long */ \
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
