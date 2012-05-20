
self.on('context', function() {
  var focusedElem, showItem;
  focusedElem = findFocusedElem();
  showItem =
    focusedElem &&
    (focusedElem.contentEditable === true || focusedElem.contentEditable === 'true'
     || focusedElem.contenteditable === true || focusedElem.contenteditable === 'true'
     || (focusedElem.ownerDocument && focusedElem.ownerDocument.designMode === 'on'));
  return !!showItem;
});

self.on('click', function() {
  doMarkdownHereToggle();
});

function requestMarkdownConversion(html, callback) {
  callback(
    markdownRender(htmlToText, marked, html),
    markdownHereCss);
}

