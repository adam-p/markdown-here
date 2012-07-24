/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * Firefox-specific code for responding to the context menu item and providing
 * rendering services.
 */

var scriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                             .getService(Components.interfaces.mozIJSSubScriptLoader);

Components.utils.import('resource://common/markdown-here.js');


var markdown_here = {

  // Handle the menu-item click
  onMenuItemCommand: function(e) {
    var mdReturn, focusedElem, self = this;

    focusedElem = markdownHere.findFocusedElem(window.document);

    // Are we running in Thunderbird?
    if (typeof(GetCurrentEditorType) !== 'undefined' && GetCurrentEditorType !== null) {
      // Are we rich-editing?
      if (GetCurrentEditorType().indexOf('html') < 0) {
        this.alert('You are using a plain-text compose editor. You must change to a rich editor to use Markdown Here.');
        return;
      }
    }
    else { // Firefox
      if (!markdownHere.elementCanBeRendered(focusedElem)) {
        this.alert('The selected field is not valid for Markdown rendering. Please use a rich editor.');
        return;
      }
    }

    mdReturn = markdownHere(
                focusedElem.ownerDocument, 
                // We'll need the target document available later
                function() { 
                  self.markdownRender.apply(self, [focusedElem.ownerDocument].concat([].splice.call(arguments, 0))); }, 
                this.log);

    if (typeof(mdReturn) === 'string') {
      // Error message was returned.
      this.alert(mdReturn);
      return;
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
      // Always show the menu item.
      // If the editor isn't in rich mode, the user will get a helpful error 
      // message telling them to change modes.
      showItem = true;
    }
    else { // Firefox
      focusedElem = markdownHere.findFocusedElem(window.document);

      if (focusedElem.type === 'textarea') {
        // Show the context menu item for `textarea`s. If the user clicks it, 
        // there will be a helpful error message. This will make behaviour more 
        // consistent with Chrome, and will hopefully help people notice that
        // they're not using the rich editor instead of just wondering why the
        // menu item just isn't showing up.
        showItem = true;
      }
      else {
        showItem = markdownHere.elementCanBeRendered(focusedElem);
      }
    }

    document.getElementById('context-markdown_here').hidden = !showItem;
    document.getElementById('context-markdown_here-separator').hidden = !showItem;
  },

  log: function(msg) {
    var consoleService = Components.classes['@mozilla.org/consoleservice;1']
                                   .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage(msg);
  },

  alert: function(msg) {
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                            .getService(Components.interfaces.nsIPromptService);
    prompts.alert(null, 'Markdown Here', msg);
  },

  // The rendering service provided to the content script.
  // See the comment in markdown-render.js for why we do this.
  markdownRender: function(targetDocument, html, callback) {
    var markdownHereCss, markdownHereSyntaxCss, markdownRender = {}, hljs = {}, 
        marked = {}, htmlToText = {};

    Components.utils.import('resource://common/markdown-render.js', markdownRender);
    Components.utils.import('resource://common/marked.js', marked);
    Components.utils.import('resource://common/jsHtmlToText.js', htmlToText);
    scriptLoader.loadSubScript('resource://common/highlightjs/highlight.js', hljs);

    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType('text/plain');

    xhr.open('GET', 'resource://common/default.css', false);
    // synchronous
    xhr.send(); 
    // Assume 200 OK
    markdownHereCss = xhr.responseText;

    xhr.open('GET', 'resource://common/highlightjs/styles/github.css', false);
    // synchronous
    xhr.send(); 
    // Assume 200 OK
    markdownHereSyntaxCss = xhr.responseText;

    callback(
      markdownRender.markdownRender(
        htmlToText.htmlToText, 
        marked.marked,
        hljs.hljs, 
        html,
        targetDocument), 
      markdownHereCss + markdownHereSyntaxCss);
  }
};

window.addEventListener('load', function () {
  markdown_here.onLoad();
}, false);

