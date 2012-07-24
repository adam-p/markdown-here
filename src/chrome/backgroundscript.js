/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * Chrome background script.
 */

// Create the context menu that will signal our main code.
chrome.contextMenus.create({
  contexts: ['editable'],
  title: 'Mar&kdown Toggle',
  onclick: function(info, tab) {
    chrome.tabs.sendRequest(tab.id, {action: 'context-click'});
  }
});

// Handle rendering requests from the content script.
// See the comment in markdown-render.js for why we do this.
chrome.extension.onRequest.addListener(
  function renderRequest(html, sender, sendResponse) {
    OptionsStore.get(function(prefs) {
      var markdownHereCss, markdownHereSyntaxCss;

      markdownHereCss = prefs['markdown-here-css'];
      markdownHereSyntaxCss = prefs['markdown-here-syntax-css'];

      var xhr = new XMLHttpRequest();
      xhr.overrideMimeType('text/plain');

      if (!markdownHereCss) {
        // Get the default value.
        xhr.open('GET', 'resource://common/default.css', false);
        // synchronous
        xhr.send(); 
        // Assume 200 OK
        markdownHereCss = xhr.responseText;
      }

      if (!markdownHereSyntaxCss) {
        // Get the default value.        
        xhr.open('GET', 'resource://common/highlightjs/styles/github.css', false);
        // synchronous
        xhr.send(); 
        // Assume 200 OK
        markdownHereSyntaxCss = xhr.responseText;
      }

      sendResponse({
        html: markdownRender(
          htmlToText, 
          marked, 
          hljs,
          html,
          document),
        // Use default CSS if not set
        css: (markdownHereCss + markdownHereSyntaxCss)
      });
    })
  });
