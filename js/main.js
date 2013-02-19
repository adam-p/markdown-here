$(function() {

  // Set up the live Markdown demo instances
  $('.livedemo').each(function() {
     $that = $(this);
     $raw = $(this).find('.livedemo-raw');
     $rendered = $(this).find('.livedemo-rendered');
    var markedOptions = {
        gfm: true,
        pedantic: false,
        sanitize: false,
        tables: true,
        smartLists: true,
        breaks: true,
        langPrefix: 'language-',
        math: true,
        highlight: function(codeText, codeLanguage) {
                      return highlightSyntax(
                                $rendered.get(0).ownerDocument,
                                hljs,
                                codeText,
                                codeLanguage); }
        };

    $raw.keyup(function() {
      var html = marked($(this).val(), markedOptions);
      $rendered.html(html);
    });

    // Match the heights of the raw and rendered views.
    $that.find('.livedemo-elem').height(Math.max($raw.height(), $rendered.height()));

    // Trigger the first render
    $raw.keyup();
  });
});


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
