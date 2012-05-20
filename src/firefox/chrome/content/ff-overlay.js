
var markdown_here = {
  log: function(aMessage) {
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                   .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage(aMessage);
  },

  markdownRender: function(html, callback) {
    Components.utils.import("resource://common/markdown-render.js");
    Components.utils.import("resource://common/marked.js");
    Components.utils.import("resource://common/jsHtmlToText.js");
    Components.utils.import("resource://common/github.css.js");

    callback(markdownRender(htmlToText, marked, html), markdownHereCss);
  },

  onMenuItemCommand: function(e) {
    Components.utils.import("resource://common/markdown-here.js");

    markdownHere(window.document, this.markdownRender);
  },

  onToolbarButtonCommand: function(e) {
    // just reuse the function above.  you can change this, obviously!
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
    // show or hide the menuitem based on what the context menu is on
    var focusedElem, showItem;
    focusedElem = gContextMenu.target;
    showItem =
      focusedElem &&
      (focusedElem.contentEditable === true || focusedElem.contentEditable === 'true'
       || focusedElem.contenteditable === true || focusedElem.contenteditable === 'true'
       || (focusedElem.ownerDocument && focusedElem.ownerDocument.designMode === 'on'));

    document.getElementById("context-markdown_here").hidden = !showItem;
  }
};

window.addEventListener("load", function () {
  markdown_here.onLoad();
}, false);

