/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * The function that does the basic raw-Markdown-in-HTML to rendered-HTML
 * conversion.
 * The reason we keep this function -- specifically, the function that uses our
 * external markdown renderer (marked.js), text-from-HTML module (jsHtmlToText.js),
 * and CSS -- separate is that it allows us to keep the bulk of the rendering
 * code (and the bulk of the code in our extension) out of the content script.
 * That way, we minimize the amount of code that needs to be loaded in every page.
 */

;(function() {

  "use strict";
  /*global module:false*/

  /**
   Using the functionality provided by the functions htmlToText and markdownToHtml,
   render html into pretty text.
   */
  function markdownRender(userprefs, htmlToText, markdownToHtml, syntaxHighlighter,
                          html, url) {
    var extractedText, markedOptions, keepTags, i, processed;

    processed = preprocessHtml(html, url);

    extractedText = htmlToText(processed.html, {allowTrailingWhitespace: true});

    function mathify(mathcode) {
      return userprefs['math-value']
              .replace(/\{mathcode\}/ig, mathcode)
              .replace(/\{urlmathcode\}/ig, encodeURIComponent(mathcode));
    }

    markedOptions = {
      gfm: true,
      pedantic: false,
      sanitize: false,
      tables: true,
      smartLists: true,
      breaks: true,
      smartypants: true,
      langPrefix: 'language-',
      math: userprefs['math-enabled'] ? mathify : null,
      highlight: function(codeText, codeLanguage) {
          if (codeLanguage) {
            return hljs.highlight(codeLanguage, codeText).value;
          }

          return codeText;
        }
      };

    var renderedMarkdown = markdownToHtml(extractedText, markedOptions);

    // Re-insert the excluded content that we removed in preprocessHtml
    html = postprocessHtml(renderedMarkdown, processed);

    return html;
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
  function preprocessHtml(html, url) {

    /*
    Historical note: At one time we kept lot of stuff intact: <b>, <i>,
    <font>, <span>-with-style-attr, <h1>, and so on. This was nice, because
    it let users do some rich-edit-control formatting that would be retained
    when rendering.
    But it was a pain to get/keep working properly in Yahoo mail, and it
    introduced issue #18. So I tore out the feature, and now we
    only keep a few probably-not-problematic tags.
    */

    var preprocessInfo = { html: html, exclusions: [] };

    // The default behaviour for `htmlToText` is to strip out tags (and their
    // inner text/html) that it doesn't expect/want. But we want some tag blocks
    // to remain intact.
    preprocessInfo = excludeTagBlocks('blockquote', preprocessInfo, true);

    // Try to leave intact the line that Gmail adds that says:
    //   On such-a-date, such-a-person <email addy> wrote:
    preprocessInfo.html = preprocessInfo.html.replace(
                            /&lt;<a (href="mailto:[^>]+)>([^<]*)<\/a>&gt;/ig,
                            '&lt;&lt;a $1&gt;$2&lt;\/a&gt;&gt;');

    // It's a deviation from Markdown, but we'd like to leave any rendered
    // images already in the email intact. So we'll escape their tags.
    // Note that we can't use excludeTagBlocks because there's no closing tag.
    preprocessInfo.html = preprocessInfo.html.replace(/<(img[^>]*)>/ig, '&lt;$1&gt;');

    // Yahoo seems to often/always/sometimes (only in Chrome?) use <p> instead
    // of <div>. We'll replace the former with the latter so that our other rules work.
    // TODO: Figure out if it's more than Yahoo that's a problem.
    if (url && url.match(/\.yahoo\./i)) {
      preprocessInfo.html =
        preprocessInfo.html
          .replace(/<p\b[^>]*>/ig, '<div>')
          .replace(/<\/p\b[^>]*>/ig, '</div>');
    }

    // Some tags we can convert to Markdown
    preprocessInfo.html = convertHTMLtoMarkdown('a', preprocessInfo.html);

    // Experimentation has shown some tags that need to be tweaked a little.
    preprocessInfo.html =
      preprocessInfo.html
        .replace(/(<\/div>)((?!<div).+?)(<div[^>]*>)/ig, '$1<div>$2</div>$3') // a raw text node without an enclosing <div> won't be handled properly, so add one
        .replace(/(<\/div>)<div[^>]*><\/div>(<div[^>]*>)/ig, '$1$2') // empty <div> between other <div> elems gets removed
        .replace(/<div[^>]*><br><\/div>/ig, '<br>') // <div><br></div> --> <br>
        .replace(/(<div[^>]*>)+/ig, '<br>') // opening <div> --> <br> (but nested <div><div> just gets one <br>)
        .replace(/<\/div>/ig, '')        // closing </div> --> nothing
        .replace(/<(img[^>]*)>/ig, '&lt;$1&gt;') // <img> tags --> textual <img> tags
        .replace(/&nbsp;/ig, ' ');       // &nbsp; --> space

    return preprocessInfo;

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
    function excludeTagBlocks(tagName, preprocessInfo, wrapInPara, ifHasAttribute, ifNotHasString) {
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
        remainder = preprocessInfo.html.slice(startIndex);

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
              preprocessInfo.exclusions.push({
                placeholder: placeholder,
                content:
                  '<div class="markdown-here-exclude">' +
                  (wrapInPara ? '<p>' : '') +
                  preprocessInfo.html.slice(currentOpenIndex, closeIndex+closeTagLength) +
                  (wrapInPara ? '</p>' : '') +
                  '</div>'
              });

              // We need to insert some empty lines when we extract something,
              // otherwise the stuff above and below would be rendered as if they
              // were together.

              preprocessInfo.html =
                preprocessInfo.html.slice(0, currentOpenIndex) +
                '<br><br><br>' + // three empty lines is "guaranteed" to break a Markdown block (like a bullet list)
                placeholder +
                '<br><br><br>' +
                preprocessInfo.html.slice(closeIndex+closeTagLength);

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

      return preprocessInfo;
    }

    // Add the class `className` to all tags in `html`.
    function addClassToAllTags(className, html) {
      return html
        .replace(
          /<(\w+\b)(([^>]*)(class=("|')([^>]*?)\5)([^>]*))>/ig,
          '<$1$3class="$6 ' + className + '"$7>')
        .replace(
          /<(\w+\b)(((?!class)[^>])*)>/ig,
          '<$1 class="' + className + '"$2>');
    }
  }

  /**
  Converts instances of `tag` in `html` to Markdown and returns the
  resulting HTML.
  */
  function convertHTMLtoMarkdown(tag, html) {
    if (tag === 'a') {
      /*
      Make sure we do *not* convert HTML links that are inside of MD links.
      Otherwise we'll have problems like issue #69.
      We're going to use a regex that mimics a negative lookbehind. For details see: http://blog.stevenlevithan.com/archives/mimic-lookbehind-javascript
      Here's an attempt at an explanation of the regex:
        (                 // begin optional prefix capture group
          (?:\]\([^\)]*)  // match an unclosed URL portion of a MD link -- like "...](..."
          |(?:\[[^\]]*)   // match an unclosed name portion of a MD link -- like "...[..."
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
        /((?:\]\([^\)]*)|(?:\[[^\]]*))?<a\s[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/ig,
        function($0, $1, $2, $3) {
          return $1 ? $0 : '['+$3+']('+$2+')';
        });
    }
    else {
      throw new Error('convertHTMLtoMarkdown: ' + tag + ' is not a supported tag');
      return;
    }

    return html;
  }

  // Restore the content that we extracted so that it wouldn't be processed.
  function postprocessHtml(renderedMarkdown, preprocessInfo) {
    var i;
    for (i = 0; i < preprocessInfo.exclusions.length; i++) {
      renderedMarkdown = renderedMarkdown.replace(preprocessInfo.exclusions[i].placeholder,
                                                  preprocessInfo.exclusions[i].content);
    }

    return renderedMarkdown;
  }


  markdownRender._testExports = {
    convertHTMLtoMarkdown: convertHTMLtoMarkdown,
    preprocessHtml: preprocessHtml
  };

  var EXPORTED_SYMBOLS = ['markdownRender'];

  if (typeof module !== 'undefined') {
    module.exports = markdownRender;
  } else {
    this.markdownRender = markdownRender;
    this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;
  }

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
