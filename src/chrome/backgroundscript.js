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
    sendResponse({
      html: markdownRender(
        htmlToText, 
        marked, 
        hljs,
        html,
        document),
      css: markdownHereCss
    });
  });
