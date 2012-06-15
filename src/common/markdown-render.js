/*
 * Copyright Adam Pritchard 2012
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

  /** 
   Using the functionality provided by the functions htmlToText and markdownToHtml,
   render html into pretty text.
   @param targetDocument  The document object where the action is taking place. 
                          It will be used to create elements, but those elements 
                          will not be inserted into the DOM.
   */
  function markdownRender(htmlToText, markdownToHtml, syntaxHighlighter, html, targetDocument) {
    var extractedText, markedOptions;

    // We need to tweak the html-to-text processing to get the results we want.
    function tagReplacement(text) {

      // The default behaviour for `htmlToText` is to strip out tags (and their
      // inner text/html) that it doesn't expect/want. But we want some tag blocks
      // to remain intact.
      
      text = excludeTagBlocks('blockquote', text);

      text =
        text
          .replace(/<div[^>]*>/ig, '<br>') // opening <div> --> <br>
          .replace(/<\/div>/ig, '')        // closing </div> --> nothing
          .replace(/<(img[^>]*)>/ig, '&lt;$1&gt;') // <img> tags --> textual <img> tags
          .replace(/&nbsp;/ig, ' ');       // &nbsp; --> space

      return text;

      // Escape all tags between tags of type `tagName`, inclusive. Also add a
      // special "exclude" class to them.
      function excludeTagBlocks(tagName, text) {
        var depth, startIndex, openIndex, closeIndex, currentOpenIndex, 
          openTagRegex, closeTagRegex, remainderText, closeTagLength;

        openTagRegex = new RegExp('<'+tagName, 'i');
        closeTagRegex = new RegExp('</'+tagName, 'i');

        depth = 0;
        startIndex = 0;

        while (true) {
          remainderText = text.slice(startIndex); 

          openIndex = remainderText.search(openTagRegex);
          closeIndex = remainderText.search(closeTagRegex);

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

            // Make the index relative to the beginning of the string.
            closeIndex += startIndex;

            if (depth === 1) {
              // Not a nested tag. Time to escape.
              // Because we've mangled the opening and closing tags, we need to
              // put around them so that they don't get mashed together with the 
              // preceeding and following Markdown.
              
              closeTagLength = ('</'+tagName+'>').length;

              text = 
                text.slice(0, currentOpenIndex)
                + '<p/>'
                + addClassToAllTags('markdown-here-exclude', text.slice(currentOpenIndex, closeIndex+closeTagLength))
                      .replace(/\&/ig, '&amp;')
                      .replace(/</ig, '&lt;')
                + '<p/>'
                + text.slice(closeIndex+closeTagLength);

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
        }

        return text;
      }

      // Add the class `className` to all tags in `text`.
      function addClassToAllTags(className, text) {
        return text
          .replace(
            /<(\w+\b)(([^>]*)(class=("|')([^>]*?)\5)([^>]*))>/ig, 
            '<$1$3class="$6 ' + className + '"$7>')
          .replace(
            /<(\w+\b)(((?!class)[^>])*)>/ig, 
            '<$1 class="' + className + '"$2>');
      }
    }

    extractedText = htmlToText(html, {tagreplacement: tagReplacement, allowTrailingWhitespace: true});

    markedOptions = {
      gfm: true,
      pedantic: false,
      sanitize: false,
      highlight: function(codeText, codeLanguage) {                 
                    return highlightSyntax(
                              targetDocument, 
                              syntaxHighlighter, 
                              codeText, 
                              codeLanguage); }
      };

    return markdownToHtml(extractedText, markedOptions);
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
