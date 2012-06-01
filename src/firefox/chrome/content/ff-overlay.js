/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * Firefox-specific code for responding to the context menu item and providing
 * rendering services.
 */

Components.utils.import('resource://common/markdown-here.js');

var markdown_here = {

  // Handle the menu-item click
  onMenuItemCommand: function(e) {
    var mdReturn;

    mdReturn = markdownHere(window.document, this.markdownRender, this.log);

    if (typeof(mdReturn) === 'string') {
      // Error message was returned.

      var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                              .getService(Components.interfaces.nsIPromptService);

      prompts.alert(null, 'Markdown Here', mdReturn);
    }
  },

  onToolbarButtonCommand: function(e) {
    // We don't have a toolbar button, but if we did...
    markdown_here.onMenuItemCommand(e);
  },

  onLoad: function() {
    var contextMenu;

    // initialization code
    this.initialized = true;
    this.strings = document.getElementById('markdown_here-strings');

    contextMenu = document.getElementById('contentAreaContextMenu');
    if (!contextMenu) contextMenu = document.getElementById('msgComposeContext');
    contextMenu.addEventListener('popupshowing', function (e) {
      markdown_here.contextMenuShowing(e);
    }, false);
  },

  contextMenuShowing: function(event) {
    // Hide the context menuitem if it's not on a message compose box.
    var focusedElem, showItem = false;

    // Are we running in Thunderbird?
    if (typeof(GetCurrentEditorType) !== 'undefined' && GetCurrentEditorType !== null) {
      // Are we rich-editing?
      showItem = (GetCurrentEditorType().indexOf('html') >= 0);
    }
    else { // Firefox
      focusedElem = markdownHere.findFocusedElem(window.document);
      showItem = markdownHere.elementCanBeRendered(focusedElem);
    }

    document.getElementById('context-markdown_here').hidden = !showItem;
    document.getElementById('context-markdown_here-separator').hidden = !showItem;
  },

  log: function(aMessage) {
    var consoleService = Components.classes['@mozilla.org/consoleservice;1']
                                   .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage(aMessage);
  },

  // The rendering service provided to the content script.
  // See the comment in markdown-render.js for why we do this.
  markdownRender: function(html, callback) {
    Components.utils.import('resource://common/markdown-render.js');
    Components.utils.import('resource://common/marked.js');
    Components.utils.import('resource://common/jsHtmlToText.js');
    Components.utils.import('resource://common/github.css.js');

    callback(markdownRender(htmlToText, marked, html), markdownHereCss);
  }
};

window.addEventListener('load', function () {
  markdown_here.onLoad();
}, false);

