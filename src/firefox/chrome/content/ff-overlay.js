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
    var contextMenu;

    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("markdown_here-strings");

    contextMenu = document.getElementById("contentAreaContextMenu");
    if (!contextMenu) contextMenu = document.getElementById("msgComposeContext");
    contextMenu.addEventListener("popupshowing", function (e) {
      markdown_here.contextMenuShowing(e);
    }, false);
  },

  contextMenuShowing: function(event) {
    // Hide the context menuitem if it's not on a message compose box.
    var focusedElem, showItem = false;

    // Are we running in Thunderbird?
    if (GetCurrentEditorType) {
      // Are we rich-editing?
      showItem = (GetCurrentEditorType().indexOf('html') >= 0);
    }
    else { // Firefox
      function testElem(elem) {
        // See here for more info about what we're checking:
        // http://stackoverflow.com/a/3333679/729729
        return elem.contentEditable === true || elem.contentEditable === 'true'
               || elem.contenteditable === true || elem.contenteditable === 'true'
               || (elem.ownerDocument && elem.ownerDocument.designMode === 'on');
      }

      focusedElem = gContextMenu.target;

      // Test all the way up to the parent <body> (needed for Hotmail on Firefox).
      while (focusedElem) {
        showItem = testElem(focusedElem);
        if (showItem) break;
        focusedElem = focusedElem.parentElement;
      }
    }

    document.getElementById("context-markdown_here").hidden = !showItem;
    document.getElementById("context-markdown_here-separator").hidden = !showItem;
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

