

function clickRequest(event) {
  if (event && event.action === 'context-click') {
    doMarkdownHereToggle();
  }
}

chrome.extension.onRequest.addListener(clickRequest);


function requestMarkdownConversion(html, callback) {
  chrome.extension.sendRequest(html, function(response) {
    callback(response.html, response.css);
  });
}
