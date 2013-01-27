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
   @param targetDocument  The document object where the action is taking place.
                          It will be used to create elements, but those elements
                          will not be inserted into the DOM.
   */
  function markdownRender(userprefs, htmlToText, markdownToHtml, syntaxHighlighter, html, targetDocument) {
    var extractedText, markedOptions, keepTags, i, processed;

    processed = preprocessHtml(html);

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
      langPrefix: 'language-',
      math: userprefs['math-enabled'] ? mathify : null,
      highlight: function(codeText, codeLanguage) {
                    return highlightSyntax(
                              targetDocument,
                              syntaxHighlighter,
                              codeText,
                              codeLanguage); }
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
  function preprocessHtml(html) {

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

    // Experimentation has shown some tags that need to be tweaked a little.
    preprocessInfo.html =
      preprocessInfo.html
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

  // Restore the content that we extracted so that it wouldn't be processed.
  function postprocessHtml(renderedMarkdown, preprocessInfo) {
    var i;
    for (i = 0; i < preprocessInfo.exclusions.length; i++) {
      renderedMarkdown = renderedMarkdown.replace(preprocessInfo.exclusions[i].placeholder,
                                                  preprocessInfo.exclusions[i].content);
    }

    return renderedMarkdown;
  }

  // Using `syntaxHighlighter`, highlight the code in `codeText` that is of
  // language `codeLanguage` (may be falsy).
  // `syntaxHighlighter` is expected to behave like (i.e., to be) highlight.js.
  function highlightSyntax(targetDocument, syntaxHighlighter, codeText, codeLanguage) {
    var codeElem, preElem, textNode;

    // highlight.js requires a `<code>` element to be passed in that has a
    // `<pre>` parent element.

    preElem = targetDocument.createElement('pre');
    codeElem = targetDocument.createElement('code');
    textNode = targetDocument.createTextNode(codeText);
    codeElem.appendChild(textNode);
    preElem.appendChild(codeElem);

    // If we're told the language, set it as a class so that the highlighter
    // doesn't have to guess it. This is part of the HTML5 standard. See:
    // http://www.whatwg.org/specs/web-apps/current-work/multipage/text-level-semantics.html#the-code-element
    if (codeLanguage && codeLanguage.length > 0) {
      codeElem.setAttribute('class', 'language-'+codeLanguage);
    }
    else {
      codeElem.setAttribute('class', 'no-highlight');
    }

    syntaxHighlighter.highlightBlock(codeElem);

    return codeElem.innerHTML;
  }

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
