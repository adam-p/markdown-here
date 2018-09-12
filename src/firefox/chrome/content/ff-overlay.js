/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/*global Components:false, OptionsStore:false */
/*jshint browser:true*/

/*
 * Firefox-specific code for responding to the context menu item and providing
 * rendering services.
 */

var markdown_here = {

  imports: {},

  // Components.utils is somewhat more performant than mozIJSSubScriptLoader,
  // but it doesn't expose the global `window` to the code, which introduces
  // tons of headaches (see https://github.com/adam-p/markdown-here/issues/141).
  // The correct way to deal with that is probably to pass `window` into every
  // single call, but that seems onerous.
  // For details on the difference, see:
  // https://developer.mozilla.org/en-US/docs/Components.utils.import
  // https://developer.mozilla.org/en-US/Add-ons/Overlay_Extensions/XUL_School/Appendix_D:_Loading_Scripts#The_Sub-Script_Loader
  scriptLoader: Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                          .getService(Components.interfaces.mozIJSSubScriptLoader),

  // Handle the menu-item click
  onMenuItemCommand: function(e) {
    var mdReturn, focusedElem, self = this;

    focusedElem = markdown_here.imports.markdownHere.findFocusedElem(window.document);
    if (!focusedElem) {
      // Shouldn't happen. But if it does, just silently abort.
      return;
    }

    // Are we running in Thunderbird?
    if (typeof(window.GetCurrentEditorType) !== 'undefined' &&
        window.GetCurrentEditorType !== null) {
      // Are we rich-editing?
      /*jshint newcap:false*/
      if (window.GetCurrentEditorType().indexOf('html') < 0) {
        this.alert(markdown_here.imports.Utils.getMessage('plain_text_compose'));
        return;
      }

      // The focus might not be in the compose box
      if (!markdown_here.imports.markdownHere.elementCanBeRendered(focusedElem)) {
        this.alert(markdown_here.imports.Utils.getMessage('cursor_into_compose'));
        return;
      }
    }
    else { // Firefox
      if (!markdown_here.imports.markdownHere.elementCanBeRendered(focusedElem)) {
        this.alert(markdown_here.imports.Utils.getMessage('invalid_field'));
        return;
      }
    }

    mdReturn = markdown_here.imports.markdownHere(
                focusedElem.ownerDocument,
                function(elem, range, callback) {
                  self.markdownRender(elem, range, callback);
                },
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

  // Called by the "open options" menuitem that's used by older versions of Thunderbird.
  // Look for "#495" below to see when it's enabled.
  openOptionsTab: function(e) {
    var url = 'resource://markdown_here_common/options.html';
    var windowMediator = Components.classes['@mozilla.org/appshell/window-mediator;1']
                          .getService(Components.interfaces.nsIWindowMediator);

    windowMediator.getMostRecentWindow('mail:3pane')
      .document.getElementById('tabmail')
      .openTab('contentTab', {contentPage: url});
    windowMediator.getMostRecentWindow('mail:3pane').focus();
  },

  // NOTE: Thunderbird seems to reuse compose windows, so this will only get
  // called for every addtion new open message. Like, if a message is opened
  // and send and another message is opened, this will only get called once.
  // If a message is opened and another message is opened at the same time, this
  // will get called twice.
  // This means that changes to the options that are used here (for turning off
  // the forgot-to-render check, say) will not reliably take effect without an
  // application restart.
  onLoad: function() {
    var contextMenu;

    // scriptLoader loads stuff into `window`.
    markdown_here.scriptLoader.loadSubScript('resource://markdown_here_common/utils.js');
    markdown_here.imports.Utils = window.Utils;
    markdown_here.scriptLoader.loadSubScript('resource://markdown_here_common/common-logic.js');
    markdown_here.imports.CommonLogic = window.CommonLogic;
    markdown_here.scriptLoader.loadSubScript('resource://markdown_here_common/jsHtmlToText.js');
    markdown_here.imports.htmlToText = window.htmlToText;
    markdown_here.scriptLoader.loadSubScript('resource://markdown_here_common/marked.js');
    markdown_here.imports.marked = window.marked;
    markdown_here.scriptLoader.loadSubScript('resource://markdown_here_common/markdown-here.js');
    markdown_here.imports.markdownHere = window.markdownHere;
    markdown_here.scriptLoader.loadSubScript('resource://markdown_here_common/mdh-html-to-text.js');
    markdown_here.imports.MdhHtmlToText = window.MdhHtmlToText;
    markdown_here.scriptLoader.loadSubScript('resource://markdown_here_common/markdown-render.js');
    markdown_here.imports.MarkdownRender = window.MarkdownRender;
    markdown_here.scriptLoader.loadSubScript('resource://markdown_here_common/options-store.js');
    markdown_here.imports.OptionsStore = OptionsStore;
    markdown_here.scriptLoader.loadSubScript('resource://markdown_here_common/highlightjs/highlight.js');
    markdown_here.imports.hljs = window.hljs;

    // initialization code
    this.initialized = true;

    // Only show the open-options menu item if we're on a version of Thunderbird where
    // the options page won't open via the usual means (see #495).
    var tbirdWithOptionsProblems =
      (navigator.userAgent.indexOf('Thunderbird') >= 0 || navigator.userAgent.indexOf('Icedove') >= 0) &&
      (Services.vc.compare(Services.appinfo.platformVersion, '59') < 0);
    if (tbirdWithOptionsProblems) {
      document.getElementById('tools-menu-markdown_here-open-options').hidden = false;
    }

    contextMenu = document.getElementById('contentAreaContextMenu');
    if (!contextMenu) contextMenu = document.getElementById('msgComposeContext');
    contextMenu.addEventListener('popupshowing', function (e) {
      markdown_here.contextMenuShowing(e);
    }, false);

    this.setupButton();

    // Some setup steps are dependent on options
    markdown_here.imports.OptionsStore.get(function(prefs) {

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
        window.addEventListener('keydown', hotkeyHandler, true);
      }

      /*
       * Set up Thunderbird's forgot-to-render hooks
       */
      // Are we running in Thunderbird?
      if (prefs['forgot-to-render-check-enabled'] &&
          typeof(window.GetCurrentEditorType) !== 'undefined' &&
          window.GetCurrentEditorType !== null) {
        // Are we rich-editing?
        /*jshint newcap:false*/
        if (window.GetCurrentEditorType().indexOf('html') < 0) {
          return;
        }

        var sendEventHandler = function(event) {
          var msgcomposeWindow = document.getElementById('msgcomposeWindow');

          // This handler will also get hit when drafts get saved, and other times.
          // For all values, see: http://hg.mozilla.org/comm-central/file/c588ff89c281/mailnews/compose/public/nsIMsgCompose.idl#l36
          // Allow type coercion in the comparison
          var deliverMode = Number(msgcomposeWindow.getAttribute('msgtype'));
          if (deliverMode !== Components.interfaces.nsIMsgCompDeliverMode.Now &&
              deliverMode !== Components.interfaces.nsIMsgCompDeliverMode.Later &&
              deliverMode !== Components.interfaces.nsIMsgCompDeliverMode.Background) {
            return;
          }

          var plaintext = new markdown_here.imports.MdhHtmlToText.MdhHtmlToText(
                            window.GetCurrentEditor().document.body,
                            null,
                            true).get();

          if (!markdown_here.imports.CommonLogic.probablyWritingMarkdown(
                plaintext,
                markdown_here.imports.htmlToText,
                markdown_here.imports.marked)) {
            return;
          }

          var promptParams = {
            inn:{
              promptInfo: markdown_here.imports.Utils.getMessage('forgot_to_render_prompt_info'),
              promptQuestion: markdown_here.imports.Utils.getMessage('forgot_to_render_prompt_question'),
              promptBackButton: markdown_here.imports.Utils.getMessage('forgot_to_render_back_button'),
              promptSendButton: markdown_here.imports.Utils.getMessage('forgot_to_render_send_button') },
            out:null
          };
          window.openDialog(
            "chrome://markdown_here/content/confirm-prompt.xul",
            "",
            "chrome, dialog, modal, centerscreen",
            promptParams).focus();

          if (!promptParams.out) {
            // User wants to go back and render.
            event.preventDefault();
          }
        };
        window.addEventListener('compose-send-message', sendEventHandler, true);
      }
    });
  },

  contextMenuShowing: function(event) {
    // Hide the context menuitem if it's not on a message compose box.
    var focusedElem, showItem = false;

    // Are we running in Thunderbird?
    if (typeof(window.GetCurrentEditorType) !== 'undefined' &&
        window.GetCurrentEditorType !== null) {
      // Always show the menu item.
      // If the editor isn't in rich mode, the user will get a helpful error
      // message telling them to change modes.
      showItem = true;
    }
    else { // Firefox
      focusedElem = markdown_here.imports.markdownHere.findFocusedElem(window.document);

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
        showItem = markdown_here.imports.markdownHere.elementCanBeRendered(focusedElem);
      }
    }

    document.getElementById('context-markdown_here').hidden = !showItem;
  },

  log: function(msg) {
    markdown_here.imports.Utils.consoleLog(msg);
  },

  alert: function(msg) {
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                            .getService(Components.interfaces.nsIPromptService);
    prompts.alert(null, 'Markdown Here', msg);
  },

  // The rendering service provided to the content script.
  markdownRender: function(elem, range, callback) {
    var mdhHtmlToText = new markdown_here.imports.MdhHtmlToText.MdhHtmlToText(elem, range);

    markdown_here.imports.OptionsStore.get(function(prefs) {
      var renderedMarkdown = markdown_here.imports.MarkdownRender.markdownRender(
        mdhHtmlToText.get(),
        prefs,
        markdown_here.imports.marked,
        markdown_here.imports.hljs);
      renderedMarkdown = mdhHtmlToText.postprocess(renderedMarkdown);

      callback(renderedMarkdown, prefs['main-css'] + prefs['syntax-css']);
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
        if (show) {
          btn.removeAttribute('disabled');

          tooltipString = markdown_here.imports.Utils.getMessage('toggle_button_tooltip');
          if (tooltipString) {
            btn.setAttribute('tooltiptext', tooltipString);
          }
        }
        else {
          btn.setAttribute('disabled', 'true');

          tooltipString = markdown_here.imports.Utils.getMessage('toggle_button_tooltip_disabled');
          if (tooltipString) {
            btn.setAttribute('tooltiptext', tooltipString);
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

        renderable = markdown_here.imports.markdownHere.elementCanBeRendered(elem);
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

    var forgotToRenderIntervalCheckPrefs = null;

    // We're using a function expression rather than a function declaration
    // because Mozilla's automatic extension review prefers when you pass the
    // former to `setInterval()`.
    var intervalCheck = function() {
      var focusedElem = markdown_here.imports.markdownHere.findFocusedElem(window.document);
      if (!focusedElem) {
        return;
      }

      setToggleButtonVisibility(focusedElem);

      if (forgotToRenderIntervalCheckPrefs === null) {
        markdown_here.imports.OptionsStore.get(function(prefs) {
          forgotToRenderIntervalCheckPrefs = prefs;
        });
      }
      else {
        markdown_here.imports.CommonLogic.forgotToRenderIntervalCheck(
          focusedElem,
          markdown_here.imports.markdownHere,
          markdown_here.imports.MdhHtmlToText,
          markdown_here.imports.marked,
          forgotToRenderIntervalCheckPrefs);
      }
    };
    setInterval(intervalCheck, 2000);
  },

  _showUpgradeNotificationInterval: null,

  showUpgradeNotification: function(optionsURL, openTabFn) {
    markdown_here.imports.CommonLogic.getUpgradeNotification(optionsURL, function(html) {
      var addUpgradeNotificationToTab = function(tabbrowser) {
        if (!tabbrowser.contentDocument.querySelector('#markdown-here-upgrade-notification-content')) {
          var elem = tabbrowser.contentDocument.createElement('div');
          tabbrowser.contentDocument.body.appendChild(elem);
          markdown_here.imports.Utils.saferSetOuterHTML(elem, html);

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
    });
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
  var delayedLoad = function() {
    markdown_here.onLoad();
  };

  // In the interest of improved browser load performace, call our onLoad after a tick.
  // Note that this is the same as `Utils.nextTick`, but we haven't loaded Utils yet.
  setTimeout(delayedLoad, 0);
}, false);
