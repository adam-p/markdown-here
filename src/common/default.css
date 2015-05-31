/*
 * NOTE:
 * - The use of browser-specific styles (-moz-, -webkit-) should be avoided.
 *   If used, they may not render correctly for people reading the email in
 *   a different browser than the one from which the email was sent.
 * - The use of state-dependent styles (like a:hover) don't work because they
 *   don't match at the time the styles are made explicit. (In email, styles
 *   must be explicitly applied to all elements -- stylesheets get stripped.)
 */

/* This is the overall wrapper, it should be treated as the `body` section. */
.markdown-here-wrapper {
}

/* To add site specific rules, you can use the `data-md-url` attribute that we
   add to the wrapper element. Note that rules like this are used depending
   on the URL you're *sending* from, not the URL where the recipient views it.
*/
/* .markdown-here-wrapper[data-md-url*="mail.yahoo."] ul { color: red; } */

pre, code {
  font-size: 0.85em;
  font-family: Consolas, Inconsolata, Courier, monospace;
}

code {
  margin: 0 0.15em;
  padding: 0 0.3em;
  white-space: pre-wrap;
  border: 1px solid #EAEAEA;
  background-color: #F8F8F8;
  border-radius: 3px;
  display: inline; /* added to fix Yahoo block display of inline code */
}

pre {
  font-size: 1em;
  line-height: 1.2em;
}

pre code {
  white-space: pre;
  overflow: auto; /* fixes issue #70: Firefox/Thunderbird: Code blocks with horizontal scroll would have bad background colour */
  border-radius: 3px;
  border: 1px solid #CCC;
  padding: 0.5em 0.7em;
  display: block !important; /* added to counteract the Yahoo-specific `code` rule; without this, code blocks in Blogger are broken */
}

/* In edit mode, Wordpress uses a `* { font: ...;} rule+style that makes highlighted
code look non-monospace. This rule will override it. */
.markdown-here-wrapper[data-md-url*="wordpress."] code span {
  font: inherit;
}

/* Wordpress adds a grey background to `pre` elements that doesn't go well with
our syntax highlighting. */
.markdown-here-wrapper[data-md-url*="wordpress."] pre {
  background-color: transparent;
}

/* This spacing has been tweaked to closely match Gmail+Chrome "paragraph" (two line breaks) spacing.
Note that we only use a top margin and not a bottom margin -- this prevents the
"blank line" look at the top of the email (issue #243).
*/
p {
  /* !important is needed here because Hotmail/Outlook.com uses !important to
     kill the margin in <p>. We need this to win. */
  margin: 0 0 1.2em 0 !important;
}

table, pre, dl, blockquote, q, ul, ol {
  margin: 1.2em 0;
}

ul, ol {
  padding-left: 2em;
}

li {
  margin: 0.5em 0;
}

/* Space paragraphs in a list the same as the list itself. */
li p {
  /* Needs !important to override rule above. */
  margin: 0.5em 0 !important;
}

/* Smaller spacing for sub-lists */
ul ul, ul ol, ol ul, ol ol {
  margin: 0;
  padding-left: 1em;
}

/* Use Roman numerals for sub-ordered-lists. (Like Github.) */
ol ol, ul ol {
  list-style-type: lower-roman;
}

/* Use letters for sub-sub-ordered lists. (Like Github.) */
ul ul ol, ul ol ol, ol ul ol, ol ol ol {
  list-style-type: lower-alpha;
}

dl {
  padding: 0;
}

dl dt {
  font-size: 1em;
  font-weight: bold;
  font-style: italic;
}

dl dd {
  margin: 0 0 1em;
  padding: 0 1em;
}

blockquote, q {
  border-left: 4px solid #DDD;
  padding: 0 1em;
  color: #777;
  quotes: none;
}

blockquote::before, blockquote::after, q::before, q::after {
  content: none;
}

h1, h2, h3, h4, h5, h6 {
  margin: 1.3em 0 1em;
  padding: 0;
  font-weight: bold;
}

h1 {
  font-size: 1.6em;
  border-bottom: 1px solid #ddd;
}

h2 {
  font-size: 1.4em;
  border-bottom: 1px solid #eee;
}

h3 {
  font-size: 1.3em;
}

h4 {
  font-size: 1.2em;
}

h5 {
  font-size: 1em;
}

h6 {
  font-size: 1em;
  color: #777;
}

table {
  padding: 0;
  border-collapse: collapse;
  border-spacing: 0;
  font-size: 1em;
  font: inherit;
  border: 0;
}

tbody {
  margin: 0;
  padding: 0;
  border: 0;
}

table tr {
  border: 0;
  border-top: 1px solid #CCC;
  background-color: white;
  margin: 0;
  padding: 0;
}

table tr:nth-child(2n) {
  background-color: #F8F8F8;
}

table tr th, table tr td {
  font-size: 1em;
  border: 1px solid #CCC;
  margin: 0;
  padding: 0.5em 1em;
}

table tr th {
 font-weight: bold;
  background-color: #F0F0F0;
}
