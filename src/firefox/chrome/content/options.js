/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

 "use strict";
 /*global Components:false, AddonManager:false*/
 /*jshint devel:true*/

/*
 * The background service for supplying preferences to content scripts.
 * From: https://developer.mozilla.org/en-US/docs/Code_snippets/Interaction_between_privileged_and_non-privileged_pages
 *
 * Note that the stored prefs are returned raw (well, after being JSON parsed).
 * No additional processing is done, like filling in default values.
 */


var MozillaOptionsService = {
  listenRequest: function(callback) { // analogue of chrome.extension.onRequest.addListener

    return document.addEventListener('markdown_here-options-query', function(event) {
      var node = event.target, doc = node.ownerDocument;

      return callback(node.getUserData('data'), doc, function(data) {
        if (!node.getUserData('callback')) {
          return doc.documentElement.removeChild(node);
        }

        node.setUserData('response', data, null);

        var listener = doc.createEvent('HTMLEvents');
        listener.initEvent('markdown_here-options-response', true, false);
        return node.dispatchEvent(listener);
      });
    }, false, true);
  },

  requestHandler: function(request, sender, callback) {

    /*
    For information about what `addExposedProps()` is doing and why, see:
    https://blog.mozilla.org/addons/2012/08/20/exposing-objects-to-content-safely/
    The short version is that in Mozilla v17 a security feature was introduced
    (well, enforced) whereby objects shared between background scripts (i.e.,
    this code) and content scripts (i.e., the options page) have to specifically
    indicate which properties are accessible.
    This function basically undoes that by making all properties readable/writable,
    but for our purposes that's okay (this code is effectively relinquishing
    control of the object to the content script).
    This fixes issue #37 (https://github.com/adam-p/markdown-here/issues/37).
    */
    function addExposedProps(obj) {
      var key, i;

      if (typeof(obj) === 'undefined' || obj === null) {
        return;
      }

      // Note that this code path is for Objects and Arrays
      if (typeof(obj) === 'object') {
        if (!('__exposedProps__' in obj)) {
          obj['__exposedProps__'] = {};
        }

        for (key in obj) {
          if (key === '__exposedProps__') {
            continue;
          }
          obj['__exposedProps__'][key] = 'rw';
          addExposedProps(obj[key]);
        }
      }
    }

    var prefs, prefKeys, prefsObj, i;

    prefs = Components.classes['@mozilla.org/preferences-service;1']
                      .getService(Components.interfaces.nsIPrefService)
                      .getBranch('extensions.markdown-here.');

    if (request.action === 'get') {
      prefKeys = prefs.getChildList('');
      prefsObj = {};

      for (i = 0; i < prefKeys.length; i++) {
        try {
          prefsObj[prefKeys[i]] = JSON.parse(prefs.getCharPref(prefKeys[i]));
        }
        catch(e) {
          // Null values and empty strings will result in JSON exceptions
          prefsObj[prefKeys[i]] = null;
        }
      }

      addExposedProps(prefsObj);

      return callback(prefsObj);
    }
    else if (request.action === 'set') {
      for (i in request.obj) {
        prefs.setCharPref(i, JSON.stringify(request.obj[i]));
      }

      if (callback) return callback();
      return;
    }
    else if (request.action === 'clear') {
      if (typeof(request.obj) === 'string') {
        request.obj = [request.obj];
      }

      for (i = 0; i < request.obj.length; i++) {
        prefs.clearUserPref(request.obj[i]);
      }

      if (callback) return callback();
      return;
    }

    return alert('Error: no matching options service action');
  }
};

MozillaOptionsService.listenRequest(MozillaOptionsService.requestHandler);


/*
 * In order to check if this is a new version, etc., we need some code that runs
 * when the application starts. In the case of Thunderbird, our regular overlay
 * only loads when a new message is opened, so we're going to hijack this options
 * overlay code to add some version checks and startup code.
 */
(function() {
  try {
      // Firefox 4 and later; Mozilla 2 and later
      Components.utils.import("resource://gre/modules/AddonManager.jsm");
      AddonManager.getAddonByID("markdown-here@adam.pritchard", function(addon) {
          updateHandler(addon.version);
    });
  }
  catch (ex) {
      // Firefox 3.6 and before; Mozilla 1.9.2 and before
      var em = Components.classes["@mozilla.org/extensions/manager;1"]
               .getService(Components.interfaces.nsIExtensionManager);
      var addon = em.getItemForID("markdown-here@adam.pritchard");
      updateHandler(addon.version);
  }

  function updateHandler(currVer) {

    // I don't know why, but getting the extension prefs -- like last-version
    // -- doesn't seem to work when using prefsServ and providing the full pref
    // name. So we need to use prefsServ to set the sync options and prefsBranch
    // to get and set the extension options.
    var prefsServ = Components.classes['@mozilla.org/preferences-service;1']
                              .getService(Components.interfaces.nsIPrefBranch);
    var prefsBranch = prefsServ.getBranch('extensions.markdown-here.');


    var lastVersion = '';
    try {
      lastVersion = JSON.parse(prefsBranch.getCharPref('last-version'));
    }
    catch (ex) {
    }

    var localFirstRun = false;
    try {
      // No need to assign this to anything. It shouldn't exist on first run.
      JSON.parse(prefsBranch.getCharPref('local-first-run'));
    }
    catch (ex) {
      // It's only the first run if the above throws.
      localFirstRun = true;
    }

    prefsBranch.setCharPref('local-first-run', JSON.stringify(localFirstRun));

    if (currVer !== lastVersion) {
      prefsBranch.setCharPref('last-version', JSON.stringify(currVer));

      // Set the sync flags while we're at it.
      prefsServ.setBoolPref('services.sync.prefs.sync.extensions.markdown-here.main-css', true);
      prefsServ.setBoolPref('services.sync.prefs.sync.extensions.markdown-here.syntax-css', true);
      prefsServ.setBoolPref('services.sync.prefs.sync.extensions.markdown-here.last-version', true);
      prefsServ.setBoolPref('services.sync.prefs.sync.extensions.markdown-here.math-enabled', true);
      prefsServ.setBoolPref('services.sync.prefs.sync.extensions.markdown-here.math-value', true);
      prefsServ.setBoolPref('services.sync.prefs.sync.extensions.markdown-here.hotkey', true);

      // Don't sync this one -- local only.
      prefsServ.setBoolPref('services.sync.prefs.sync.extensions.markdown-here.local-first-run', false);

      // This is a bit dirty. If we open the new tab immediately, it will get
      // overwritten when session restore starts creating tabs. So we'll wait a
      // couple of seconds after the last tab is restored to open ours.
      // But we'll also have to make sure we handle the case that no tabs are
      // being restored.

      var timeoutID = null;

      var tabRestored = function() {
        var postTabRestoredOptionsOpen = function() {
          document.removeEventListener('SSTabRestored', tabRestored);
          var windowMediator = Components.classes['@mozilla.org/appshell/window-mediator;1']
                                         .getService(Components.interfaces.nsIWindowMediator);
          var optionsUrl = 'resource://markdown_here_common/options.html#changelist';
          if (navigator.userAgent.indexOf('Thunderbird') >= 0) {
              windowMediator.getMostRecentWindow('mail:3pane')
                            .document.getElementById('tabmail')
                            .openTab('contentTab', {contentPage: optionsUrl});
          }
          else if (navigator.userAgent.indexOf('Postbox') >= 0) {
              /* Haven't yet figured out how to open a tab in Postbox */
          }
          else {
              var win = windowMediator.getMostRecentWindow('navigator:browser');
              win.gBrowser.selectedTab = win.gBrowser.addTab(optionsUrl);
          }
        };

        clearTimeout(timeoutID);
        timeoutID = setTimeout(postTabRestoredOptionsOpen, 2000);
      };
      timeoutID = setTimeout(tabRestored, 1);
      document.addEventListener('SSTabRestored', tabRestored, false);
    }

    if (true || localFirstRun) {
      installButton('nav-bar', 'toolbarButton-markdown_here');

      // Note that we can't add the same button to more than one toolbar.
      // If we wanted to add the button to the addon toolbar, we'd use this
      // line.
      // The 'addon-bar' is available since Firefox 4
      //installButton('addon-bar', 'toolbarButton-markdown_here');
    }
  }

  // From: https://developer.mozilla.org/en-US/docs/Code_snippets/Toolbar?redirectlocale=en-US&redirectslug=Code_snippets%3AToolbar#Adding_button_by_default
  /**
   * Installs the toolbar button with the given ID into the given
   * toolbar, if it is not already present in the document.
   *
   * @param {string} toolbarId The ID of the toolbar to install to.
   * @param {string} id The ID of the button to install.
   * @param {string} afterId The ID of the element to insert after. @optional
   */
  function installButton(toolbarId, id, afterId) {
    if (!document.getElementById(id)) {
      var toolbar, elem;

      toolbar = document.getElementById(toolbarId);

      if (!toolbar) {
        return;
      }

      // If no afterId is given, then append the item to the toolbar
      var before = null;
      if (afterId) {
        elem = document.getElementById(afterId);
        if (elem && elem.parentNode == toolbar) {
          before = elem.nextElementSibling;
        }
      }

      toolbar.insertItem(id, before);
      toolbar.setAttribute('currentset', toolbar.currentSet);
      document.persist(toolbar.id, 'currentset');

      if (toolbarId == 'addon-bar') {
        toolbar.collapsed = false;
      }
    }
  }
})();
