/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * Firefox-specific code for responding to the context menu item and providing
 * rendering services.
 */

var markdown_here = {

  // Handle the menu-item click
  onMenuItemCommand: function(e) {
    Components.utils.import("resource://common/markdown-here.js");

    markdownHere(window.document, this.markdownRender);
  },

  onToolbarButtonCommand: function(e) {
    // We don't have a toolbar button, but if we did...
    markdown_here.onMenuItemCommand(e);
  },

  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("markdown_here-strings");

    document.getElementById("contentAreaContextMenu")
            .addEventListener("popupshowing", function (e) {
      markdown_here.showFirefoxContextMenu(e);
    }, false);
  },

  showFirefoxContextMenu: function(event) {
    // Hide the context menuitem if it's not on a message compose box.
    // See here for more info about what we're checking:
    // http://stackoverflow.com/a/3333679/729729
    var focusedElem, showItem;
    focusedElem = gContextMenu.target;
    showItem =
      focusedElem &&
      (focusedElem.contentEditable === true || focusedElem.contentEditable === 'true'
       || focusedElem.contenteditable === true || focusedElem.contenteditable === 'true'
       || (focusedElem.ownerDocument && focusedElem.ownerDocument.designMode === 'on'));

    document.getElementById("context-markdown_here").hidden = !showItem;
  },

  log: function(aMessage) {
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                   .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage(aMessage);
  },

  // The rendering service provided to the content script.
  // See the comment in markdown-render.js for why we do this.
  markdownRender: function(html, callback) {

    Components.utils.import("resource://common/markdown-render.js");
    Components.utils.import("resource://common/marked.js");
    Components.utils.import("resource://common/jsHtmlToText.js");
    Components.utils.import("resource://common/github.css.js");

    callback(markdownRender(htmlToText, marked, html), markdownHereCss);
  }
};

window.addEventListener("load", function () {
  markdown_here.onLoad();
}, false);

