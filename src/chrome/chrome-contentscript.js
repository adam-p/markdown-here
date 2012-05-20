

function clickRequest(event) {
  if (event && event.action === 'context-click') {
    markdownHere(document, requestMarkdownConversion);
  }
}

function requestMarkdownConversion(html, callback) {
  chrome.extension.sendRequest(html, function(response) {
    callback(response.html, response.css);
  });
}

chrome.extension.onRequest.addListener(clickRequest);
