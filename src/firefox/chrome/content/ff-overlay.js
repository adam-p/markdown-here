/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/*global Components:false, markdownHere:false, GetCurrentEditorType:false,
  OptionsStore:false*/
/*jshint browser:true*/

/*
 * Firefox-specific code for responding to the context menu item and providing
 * rendering services.
 */

Components.utils.import('resource://markdown_here_common/markdown-here.js');


var markdown_here = {

  // Components.utils is somewhat more performant than mozIJSSubScriptLoader, so
  // we'll use it when possible. However, Components.utils usually requires
  // modifications to the source file, which isn't allowed for some 3rd party
  // code (Highlight.js, in particular) -- in that case we use mozIJSSubScriptLoader.
  // For details on the difference, see:
  // https://developer.mozilla.org/en-US/docs/Components.utils.import
  scriptLoader: Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                          .getService(Components.interfaces.mozIJSSubScriptLoader),

  // Handle the menu-item click
  onMenuItemCommand: function(e) {
    var mdReturn, focusedElem, self = this;

    focusedElem = markdownHere.findFocusedElem(window.document);
    if (!focusedElem) {
      // Shouldn't happen. But if it does, just silently abort.
      return;
    }

    // Are we running in Thunderbird?
    if (typeof(GetCurrentEditorType) !== 'undefined' && GetCurrentEditorType !== null) {
      // Are we rich-editing?
      /*jshint newcap:false*/
      if (GetCurrentEditorType().indexOf('html') < 0) {
        this.alert('You are using a plain-text compose editor. You must change to a rich editor to use Markdown Here.');
        return;
      }

      // The focus might not be in the compose box
      if (!markdownHere.elementCanBeRendered(focusedElem)) {
        this.alert('Please put the cursor into the compose box.');
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
    markdown_here.onMenuItemCommand(e);
  },

  onLoad: function() {
    var contextMenu, optionsStore = {};

    // initialization code
    this.initialized = true;
    this.strings = document.getElementById('markdown_here-strings');

    contextMenu = document.getElementById('contentAreaContextMenu');
    if (!contextMenu) contextMenu = document.getElementById('msgComposeContext');
    contextMenu.addEventListener('popupshowing', function (e) {
      markdown_here.contextMenuShowing(e);
    }, false);

    this.setupButton();

    // Some setup steps are dependent on options
    this.scriptLoader.loadSubScript('resource://markdown_here_common/options-store.js');
    OptionsStore.get(function(prefs) {

      // Register a hotkey listener

      function hotkeyHandler(event) {
        if (event.shiftKey === prefs.hotkey.shiftKey &&
            event.ctrlKey === prefs.hotkey.ctrlKey &&
            event.altKey === prefs.hotkey.altKey &&
            event.which === prefs.hotkey.key.toUpperCase().charCodeAt(0)) {
          markdown_here.onMenuItemCommand();
          event.preventDefault();
          return false;
        }
      }

      // Only add a listener if a key is set
      if (prefs.hotkey.key.length === 1) {
        window.addEventListener('keydown', hotkeyHandler, false);
      }
    });
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

      if (!focusedElem) {
        showItem = false;
      }
      else if (focusedElem.type === 'textarea') {
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
    var markdownRender = {}, hljs = {}, marked = {}, htmlToText = {}, optionsStore = {};

    Components.utils.import('resource://markdown_here_common/markdown-render.js', markdownRender);
    Components.utils.import('resource://markdown_here_common/marked.js', marked);
    Components.utils.import('resource://markdown_here_common/jsHtmlToText.js', htmlToText);
    this.scriptLoader.loadSubScript('resource://markdown_here_common/highlightjs/highlight.js', hljs);

    OptionsStore.get(function(prefs) {
      callback(
        markdownRender.markdownRender(
          prefs,
          htmlToText.htmlToText,
          marked.marked,
          hljs.hljs,
          html,
          targetDocument,
          targetDocument.location ? targetDocument.location.href : null),
        prefs['main-css'] + prefs['syntax-css']);
    });
  },

  /*
   * Set up our toggle button.
   * Please see src/chrome/contentscript.js for more info.
   */
  setupButton: function() {

    // At this time, only this function differs between Chrome and Firefox.
    function showToggleButton(show) {
      var btn, tooltipString;

      // Page action button
      btn = document.getElementById('pageAction-markdown_here');
      if (btn) {
        btn.setAttribute('collapsed', !show);
      }

      // Toolbar button
      btn = document.getElementById('toolbarButton-markdown_here');
      if (btn) {
        var stringsBundle = document.getElementById('markdown_here-strings');

        if (show) {
          btn.removeAttribute('disabled');

          if (stringsBundle) {
            tooltipString = stringsBundle.getString('markdown_hereButton.tooltiptext');
            if (tooltipString) {
              btn.setAttribute('tooltiptext', tooltipString);
            }
          }
        }
        else {
          btn.setAttribute('disabled', 'true');

          if (stringsBundle) {
            tooltipString = stringsBundle.getString('markdown_hereButton.disabledtooltiptext');
            if (tooltipString) {
              btn.setAttribute('tooltiptext', tooltipString);
            }
          }
        }
      }
    }

    var lastElemChecked, lastRenderable;
    function setToggleButtonVisibility(elem) {
      var renderable = false;

      // Assumption: An element does not change renderability.
      if (elem === lastElemChecked) {
        return;
      }
      lastElemChecked = elem;

      if (elem && elem.ownerDocument) {
        // We may have gotten here via the timer, so we'll add an event handler.
        // Setting the event handler like this lets us better deal with iframes.
        // It's okay to call `addEventListener` more than once with the exact same
        // arguments.
        elem.ownerDocument.addEventListener('focus', focusChange, true);

        renderable = markdownHere.elementCanBeRendered(elem);
      }

      if (renderable !== lastRenderable) {
        showToggleButton(renderable);
        lastRenderable = renderable;
      }
    }

    // When the focus in the page changes, check if the newly focused element is
    // a valid Markdown Toggle target.
    function focusChange(event) {
      setToggleButtonVisibility(event.target);
    }
    window.document.addEventListener('focus', focusChange, true);

    // We're using a function expression rather than a function declaration
    // because Mozilla's automatic extension review prefers when you pass the
    // former to `setInterval()`.
    var intervalCheck = function() {
      var focusedElem = markdownHere.findFocusedElem(window.document);
      if (!focusedElem) {
        return;
      }

      setToggleButtonVisibility(focusedElem);
    };
    setInterval(intervalCheck, 2000);
  },

  _showUpgradeNotificationInterval: null,

  showUpgradeNotification: function(optionsURL, openTabFn) {
    // Get the content of notification element
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType('text/html');
    xhr.open('GET', 'resource://markdown_here_common/upgrade-notification.html');
    xhr.onreadystatechange = function() {
      if (this.readyState === this.DONE) {
        // Assume 200 OK -- it's just a local call
        var html = this.responseText;

        // Get the logo image data
        var logoBase64 = null;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'resource://markdown_here_common/images/icon16.png');
        xhr.responseType = 'arraybuffer';

        xhr.onload = function(e) {
          if (this.readyState === this.DONE) {
            // Assume 200 OK -- it's just a local call
            var uInt8Array = new Uint8Array(this.response);
            var i = uInt8Array.length;
            var binaryString = new Array(i);
            while (i--)
            {
              binaryString[i] = String.fromCharCode(uInt8Array[i]);
            }
            var data = binaryString.join('');

            var logoBase64 = window.btoa(data);

            // Do some rough template replacement
            html = html.replace('{{optionsURL}}', optionsURL)
                       .replace('{{logoBase64}}', logoBase64);

            var addUpgradeNotificationToTab = function(tabbrowser) {
              if (!tabbrowser.contentDocument.querySelector('#markdown-here-upgrade-notification-content')) {
                var elem = tabbrowser.contentDocument.createElement('div');
                tabbrowser.contentDocument.body.appendChild(elem);
                Utils.saferSetOuterHTML(elem, html);

                  // Setting the outer HTML wrecks our reference to the element, so get it again.
                elem = tabbrowser.contentDocument.querySelector('#markdown-here-upgrade-notification-content');

                // Add click handlers so that we can clear the notification.
                var optionsLink = tabbrowser.contentDocument.querySelector('#markdown-here-upgrade-notification-link');
                optionsLink.addEventListener('click', function(event) {
                  event.preventDefault();
                  markdown_here._hideUpgradeNotification();
                  openTabFn(optionsURL);
                });

                var closeLink = tabbrowser.contentDocument.querySelector('#markdown-here-upgrade-notification-close');
                closeLink.addEventListener('click', function(event) {
                  event.preventDefault();
                  markdown_here._hideUpgradeNotification();
                });
              }
            };

            // We keep showing notifications on an interval until one gets dimissed.
            // This is because there might not actually be any tabs when we first
            // start.
            var showUpgradeNotificationsAgain = function() {
              markdown_here._forAllTabsDo(addUpgradeNotificationToTab);
            };

            if (markdown_here._showUpgradeNotificationInterval === null) {
              markdown_here._showUpgradeNotificationInterval = setInterval(showUpgradeNotificationsAgain, 5000);
            }
          }
        };

        xhr.send();
      }
    };
    xhr.send();
  },

  _hideUpgradeNotification: function() {
    if (markdown_here._showUpgradeNotificationInterval !== null) {
      clearInterval(markdown_here._showUpgradeNotificationInterval);
      markdown_here._showUpgradeNotificationInterval = null;
    }

    function removeNotificationFromTab(tabbrowser) {
      // Check if this tab has the notification and remove it.
      var notification = tabbrowser.contentDocument.querySelector('#markdown-here-upgrade-notification-content');
      if (notification) {
        tabbrowser.contentDocument.body.removeChild(notification);
      }
    }

    markdown_here._forAllTabsDo(removeNotificationFromTab);
  },

  // TODO: move to a Mozilla/Firefox-specifc utils module.
  /*
   * doFunction will be passed a [browser](https://developer.mozilla.org/en-US/docs/XUL/browser)
   * (which is approximately analogous to a tab)
   * and a [tabbrowser](https://developer.mozilla.org/en-US/docs/XUL/tabbrowser)
   * (which is approximately analogous to the window containing the tab)
   * for each open tab. browser.contentDocument can be used to access the page's
   * document object.
   */
  _forAllTabsDo: function(doFunction) {
    // Tab enumerating code from: https://developer.mozilla.org/en-US/docs/Code_snippets/Tabbed_browser#Reusing_tabs
    var windowMediator = Components.classes['@mozilla.org/appshell/window-mediator;1']
                                   .getService(Components.interfaces.nsIWindowMediator);

    var isNormalTab = function(browser) {
      // Someday we might want to make this smarter or optional (maybe the caller
      // wants to enumerate `about:` and `resource:` tabs?), but for now we'll
      // restrict it to normal web page tabs by looking for http:// and https://
      if (!browser.currentURI.spec.match(/^https?:\/\//i)) {
        return false;
      }

      // Tabs that haven't loaded properly seem to have a null body.
      if (!browser.contentDocument || !browser.contentDocument.body) {
        return false;
      }

      return true;
    };

    // Iterate through all browser windows...
    var browserEnumerator = windowMediator.getEnumerator("navigator:browser");
    while (browserEnumerator.hasMoreElements()) {
      var browserWin = browserEnumerator.getNext();
      var tabbrowser = browserWin.gBrowser;

      // ...and through all tabs in the windows
      var numTabs = tabbrowser.browsers.length;
      for (var index = 0; index < numTabs; index++) {
        var browser = tabbrowser.getBrowserAtIndex(index);

        if (isNormalTab(browser)) {
          // Do the per-tab work
          doFunction(browser, tabbrowser);
        }
      }
    }
  }
};

window.addEventListener('load', function () {
  markdown_here.onLoad();
}, false);
