/*
 * Copyright Adam Pritchard 2015
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
This module encapsulates Markdown Here's HTML-to-plaintext functionality.
*/


;(function() {

"use strict";
/*global module:false, htmlToText:false, Utils:false*/

var exports = {};


if (typeof(htmlToText) === 'undefined' &&
    typeof(Components) !== 'undefined' &&
    typeof(Components.utils) !== 'undefined') {
  var scriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                               .getService(Components.interfaces.mozIJSSubScriptLoader);
  scriptLoader.loadSubScript('resource://markdown_here_common/jsHtmlToText.js');
  scriptLoader.loadSubScript('resource://markdown_here_common/utils.js');
}


/*
NOTE: Maybe it would be better to process the DOM directly? String-processing
the HTML seems suboptimal.
*/


/*
`checkingIfMarkdown` should be true if the caller just wants to know if the
HTML contains Markdown. It will prevent any alterations that introduce MD that
isn't already present.
*/
function MdhHtmlToText(elem, range, checkingIfMarkdown) {
  this.elem = elem;
  this.range = range;
  this.checkingIfMarkdown = checkingIfMarkdown;

  // NOTE: If we end up really using `range`, we should do this:
  // if (!this.range) { this.range = new Range(); this.range.selectNodeContents(elem); }
  // ...or just make it non-optional.

  // Is this insufficient? What if `elem` is in an iframe with no `src`?
  // Maybe we should go higher in the iframe chain?
  this.url = Utils.getTopURL(elem.ownerDocument.defaultView);

  this._preprocess();
}


/*
We need to tweak the html-to-text processing to get the results we want.
We also want to exclude some stuff (like reply blocks) from any processing.
Returns an object that looks like this:
{
  html: the HTML to render,
  exclusions: [array of {
    placeholder: the string added as placeholder for the excluded content
    content: the excluded content
  }]
}

NOTE: Maybe it would be better to do this stuff in markdown-here.js, where
we have the DOM available? String-processing the HTML seems suboptimal.
*/
MdhHtmlToText.prototype._preprocess = function() {
  /*
  Historical note: At one time we kept lot of stuff intact: <b>, <i>,
  <font>, <span>-with-style-attr, <h1>, and so on. This was nice, because
  it let users do some rich-edit-control formatting that would be retained
  when rendering.
  But it was a pain to get/keep working properly in Yahoo mail, and it
  introduced issue #18. So I tore out the feature, and now we
  only keep a few probably-not-problematic tags.
  */

  /*
  preprocessInfo ends up looking like this:
  {
    html: the HTML to render,
    exclusions: [array of {
      placeholder: the string added as placeholder for the excluded content
      content: the excluded content
    }]
  }
  */
  var html;
  if (this.range) {
    html = Utils.getDocumentFragmentHTML(this.range.cloneContents());
  }
  else {
    html = this.elem.innerHTML;
  }

  this.preprocessInfo = { html: html, exclusions: [] };

  // The default behaviour for `jsHtmlToText.js` is to strip out tags (and their
  // inner text/html) that it doesn't expect/want. But we want some tag blocks
  // to remain intact.
  this.excludeTagBlocks('blockquote', true);

  // Try to leave intact the line that Gmail adds that says:
  //   On such-a-date, such-a-person <email addy> wrote:
  this.preprocessInfo.html = this.preprocessInfo.html.replace(
                          /&lt;<a (href="mailto:[^>]+)>([^<]*)<\/a>&gt;/ig,
                          '&lt;&lt;a $1&gt;$2&lt;\/a&gt;&gt;');

  // It's a deviation from Markdown, but we'd like to leave any rendered
  // images already in the email intact. So we'll escape their tags.
  // Note that we can't use excludeTagBlocks because there's no closing tag.
  this.preprocessInfo.html = this.preprocessInfo.html.replace(/<(img[^>]*)>/ig, '&lt;$1&gt;');

  // Yahoo seems to often/always/sometimes (only in Chrome?) use <p> instead
  // of <div>. We'll replace the former with the latter so that our other rules work.
  // This also seems to be the case in Blogger.
  // Instead of adding URL matches, we're going to count the number of <p> and
  // <br> elements and do some replacement if there are more of the former than
  // the latter.
  var brMatches = this.preprocessInfo.html.match(/<br\b/g);
  brMatches = (brMatches ? brMatches.length : 0);
  var pMatches = this.preprocessInfo.html.match(/<p\b/g);
  pMatches = (pMatches ? pMatches.length : 0);
  if (pMatches > brMatches) {
    this.preprocessInfo.html =
      this.preprocessInfo.html
        .replace(/<p\b[^>]*>/ig, '<div>')
        .replace(/<\/p\b[^>]*>/ig, '</div>');
  }

  if (this.checkingIfMarkdown) {
    // If we're just checking for Markdown, strip out `<code>` blocks so that
    // we don't incorrectly detect unrendered MD in them.
    this.preprocessInfo.html = this.preprocessInfo.html.replace(/<code\b.+?<\/code>/ig, '');
  }
  else {
    // Some tags we can convert to Markdown, but don't do it if we're just
    // checking for Markdown, otherwise we'll cause false positives.
    this.preprocessInfo.html = convertHTMLtoMarkdown('a', this.preprocessInfo.html);
  }

  // NOTE: Don't use '.' in these regexes and hope to match across newlines. Instead use [\s\S].

  // Experimentation has shown some tags that need to be tweaked a little.
  this.preprocessInfo.html =
    this.preprocessInfo.html
      // A raw text node without an enclosing <div> won't be handled properly, so enclose them.
      // At the beginning:
      .replace(/^((?:(?!<div\b)[\s\S])+)/i, '<div>$1</div>')
      // In the middle:
      .replace(/(<\/div>)((?!<div\b)[\s\S]+?)(<div\b[^>]*>)/ig, '$1<div>$2</div>$3')
      // At the end:
      // Note: The original, simpler form of this regex -- `([^>]+)$/` was
      // horribly slow. The new form is fast for both positive and negative
      // matches. I can't pretend to entirely understand why.
      // More info: https://stackoverflow.com/questions/31952381/end-of-string-regex-match-too-slow
      .replace(/^(?=([\s\S]*>))\1([^>]+)$/, '$1<div>$2</div>')

      // empty <div> between other <div> elems gets removed
      .replace(/(<\/div>)<div\b[^>]*><\/div>(<div[^>]*>)/ig, '$1$2')

      // <div><br></div> --> <br>
      .replace(/<div\b[^>]*><br\b[^>]*><\/div>/ig, '<br>')

      // A <br> as the last child of a <div> adds no whitespace, so: <br></div> --> </div>
      // Note: I can't find a reference for this, but testing shows it.
      // The reason we're testing for this is because we see it in the wild. E.g., issue #251.
      .replace(/<br\b[^>]*><\/div>/ig, '</div>')

      // closing </div> --> <br> (but nested </div></div> just gets one <br>)
      .replace(/(<\/div>)+/ig, '<br>')

      // open <div> --> nothing (since we've replaced all the closing tags)
      .replace(/<div\b[^>]*>/ig, '')

      // <img> tags --> textual <img> tags
      .replace(/<(img[^>]*)>/ig, '&lt;$1&gt;')

      // &nbsp; --> space
      .replace(/&nbsp;/ig, ' ');
};


MdhHtmlToText.prototype.get = function() {
  return htmlToText(this.preprocessInfo.html, { allowTrailingWhitespace: true });
};


// Re-insert the excluded content that we removed in preprocessing
MdhHtmlToText.prototype.postprocess = function(renderedMarkdown) {
  var i;
  for (i = 0; i < this.preprocessInfo.exclusions.length; i++) {
    renderedMarkdown = renderedMarkdown.replace(this.preprocessInfo.exclusions[i].placeholder,
                                                this.preprocessInfo.exclusions[i].content);
  }

  return renderedMarkdown;
};


// Escape all tags between tags of type `tagName`, inclusive. Also add a
// special "exclude" class to them.
// If `wrapInPara` is true, `<p>` tags will be added before and after each
// tag block found.
// If `ifHasAttribute` is non-null, tags will only be matched if they have
// that attribute.
// If `ifNotHasString` is non-null, tags that contain that string will not
// be matched. Note that `ifNotHasString` will be used in a regex.
// TODO: This function is pretty flawed. Wrapping block elements in paras
//       doesn't make much sense. And if we're going to support inline
//       elements, then we can't unconditionally put linebreaks around the
//       the wrapped elements.
MdhHtmlToText.prototype.excludeTagBlocks = function(
          tagName,
          wrapInPara,
          ifHasAttribute,
          ifNotHasString) {
  var depth, startIndex, openIndex, closeIndex, currentOpenIndex,
    openTagRegex, closeTagRegex, remainder, closeTagLength, regexFiller;

  regexFiller = ifNotHasString ? '(((?!'+ifNotHasString+')[^>])*)' : '[^>]*';
  if (ifHasAttribute) {
    openTagRegex = new RegExp('<'+tagName+'\\b'+regexFiller+'\\b'+ifHasAttribute+'\\b'+regexFiller+'>', 'i');
  }
  else {
    openTagRegex = new RegExp('<'+tagName+'\\b'+regexFiller+'>', 'i');
  }

  closeTagRegex = new RegExp('</'+tagName+'\\b', 'i');

  depth = 0;
  startIndex = 0;

  while (true) {
    remainder = this.preprocessInfo.html.slice(startIndex);

    openIndex = remainder.search(openTagRegex);
    closeIndex = remainder.search(closeTagRegex);

    if (openIndex < 0 && closeIndex < 0) {
      break;
    }

    if (closeIndex < 0 || (openIndex >= 0 && openIndex < closeIndex)) {
      // Process an open tag next.

      // Make the index relative to the beginning of the string.
      openIndex += startIndex;

      if (depth === 0) {
        // Not a nested tag. Start the escape here.
        currentOpenIndex = openIndex;
      }

      startIndex = openIndex + 1;
      depth += 1;
    }
    else {
      // Process a close tag next.

      if (depth > 0) {
        // Make the index relative to the beginning of the string.
        closeIndex += startIndex;

        if (depth === 1) {
          // Not a nested tag. Time to escape.
          // Because we've mangled the opening and closing tags, we need to
          // put around them so that they don't get mashed together with the
          // preceeding and following Markdown.

          closeTagLength = ('</'+tagName+'>').length;

          var placeholder = String(Math.random());
          this.preprocessInfo.exclusions.push({
            placeholder: placeholder,
            content:
              '<div class="markdown-here-exclude">' +
              (wrapInPara ? '<p>' : '') +
              this.preprocessInfo.html.slice(currentOpenIndex, closeIndex+closeTagLength) +
              (wrapInPara ? '</p>' : '') +
              '</div>'
          });

          // We need to insert some empty lines when we extract something,
          // otherwise the stuff above and below would be rendered as if they
          // were together.

          this.preprocessInfo.html =
            this.preprocessInfo.html.slice(0, currentOpenIndex) +
            '<br><br><br>' + // three empty lines is "guaranteed" to break a Markdown block (like a bullet list)
            placeholder +
            '<br><br><br>' +
            this.preprocessInfo.html.slice(closeIndex+closeTagLength);

          // Start from the beginning again. The length of the string has
          // changed (so our indexes are meaningless), and we'll only find
          // unescaped/unprocessed tags of interest anyway.
          startIndex = 0;
        }
        else {
          startIndex = closeIndex + 1;
        }

        depth -= 1;
      }
      else {
        // Depth is 0. So we've found a closing tag while not in an opening
        // tag -- this can happen normally if `ifHasAttribute` is non-null.
        // Just advance the startIndex.
        startIndex += closeIndex + 1;
      }
    }
  }
};


/**
Converts instances of `tag` in `html` to Markdown and returns the
resulting HTML.
*/
function convertHTMLtoMarkdown(tag, html) {
  if (tag === 'a') {
    var htmlToRestore = [];
    html = html.replace(/(`+)[\s\S]+?\1/ig, function($0) {
      var replacement = Math.random();
      htmlToRestore.push([replacement, $0]);
      return replacement;
    });
    /*
    Make sure we do *not* convert HTML links that are inside of MD links.
    Otherwise we'll have problems like issue #69.
    We're going to use a regex that mimics a negative lookbehind. For details see: http://blog.stevenlevithan.com/archives/mimic-lookbehind-javascript
    Here's an attempt at an explanation of the regex:
      (                 // begin optional prefix capture group
        (?:\]\([^\)]*)  // match an unclosed URL portion of a MD link -- like "...](..."
        |(?:\[[^\]]*)   // match an unclosed name portion of a MD link -- like "...[..."
        |(?:\[.*\]:.*)  // match the patterns of reflink and nolink -- link "[...]:..."
      )?                // capture group is optional so that we do the "negative" lookbehind -- that is, we can match links that are *not* preceded by the stuff we *don't* want
      <a\s[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>  // an HTML link
    Then the replace callback looks like this:
      return $1 ? $0 : '['+$3+']('+$2+')'
    So, if the first capture group is matched (i.e., $1 has value), then we've
    matched the bad thing -- the indication that the HTML is inside a MD link.
    In that case, we don't modify anything. Otherwise we use our other capture
    groups to create the desired MD link.
    */
    html = html.replace(
      /((?:\]\([^\)]*)|(?:\[[^\]]*)|(?:\[.*\]:.*))?<a\s[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/ig,
      function($0, $1, $2, $3) {
        return $1 ? $0 : '['+$3+']('+$2+')';
      });

    for (var i = 0; i < htmlToRestore.length; i++) {
      html = html.replace(htmlToRestore[i][0], function() {
          // The replacement argument to `String.replace()` has some magic values: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter
          // Because we don't control the content of that argument, we either
          // need to escape dollar signs in it, or use the function version.
          return htmlToRestore[i][1];
        });
    }
  }
  else {
    throw new Error('convertHTMLtoMarkdown: ' + tag + ' is not a supported tag');
  }

  return html;
}


exports.MdhHtmlToText = MdhHtmlToText;

exports._testExports = {
  convertHTMLtoMarkdown: convertHTMLtoMarkdown
};

var EXPORTED_SYMBOLS = ['MdhHtmlToText'];

if (typeof module !== 'undefined') {
  module.exports = exports;
} else {
  this.MdhHtmlToText = exports;
  this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
