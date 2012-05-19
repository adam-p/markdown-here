

chrome.extension.onRequest.addListener(doMarkdownHereToggle);

function requestMarkdownConversion(html, callback) {
  chrome.extension.sendRequest(html, function(response) {
    callback(response.html, response.css);
  });
}
