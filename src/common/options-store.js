/*
 * Copyright Adam Pritchard 2015
 * MIT License : http://adampritchard.mit-license.org/
 */


;(function() {

"use strict";
/*global module:false, chrome:false, Components:false*/

if (typeof(Utils) === 'undefined' && typeof(Components) !== 'undefined') {
  var scriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                               .getService(Components.interfaces.mozIJSSubScriptLoader);
  scriptLoader.loadSubScript('resource://markdown_here_common/utils.js');
}

// Common defaults
var DEFAULTS = {
  'math-enabled': true,
  'math-value': '<img src="https://chart.googleapis.com/chart?cht=tx&chl={urlmathcode}" alt="{mathcode}">',
  'hotkey': { shiftKey: false, ctrlKey: true, altKey: true, key: 'M' },
  'forgot-to-render-check-enabled': false,
  'header-anchors-enabled': false,
  'gfm-line-breaks-enabled': true
};

/*? if(platform!=='mozilla'){ */
/*
 * Chrome storage helper. Gets around the synchronized value size limit.
 * Overall quota limits still apply (or less, but we should stay well within).
 * Limitations:
 *   - `get` gets the entire options object and `set` sets the entire options
 *     object (unlike the underlying `chrome.storage.sync` functions).
 *
 * Long strings are broken into pieces and stored in separate fields. They are
 * recombined when retrieved.
 *
 * Note that we fall back to (unsynced) localStorage if chrome.storage isn't
 * available. This is the case in Chromium v18 (currently the latest available
 * via Ubuntu repo). Part of the reason we JSON-encode values is to get around
 * the fact that you can only store strings with localStorage.
 *
 * Chrome note/warning: OptionsStore can't be used directly from a content script.
 * When it tries to fill in the CSS defaults with a XHR request, it'll fail with
 * a cross-domain restriction error. Instead use the service provided by the
 * background script.
 */
// TODO: Check for errors. See: https://code.google.com/chrome/extensions/dev/storage.html

var ChromeOptionsStore = {

  // The options object will be passed to `callback`
  get: function(callback) {
    var that = this;

    this._storageGet(function(sync) {

      // Process the object, recombining divided entries.
      var tempobj = {}, finalobj = {};
      for (var key in sync) {
        var val = sync[key];
        var divIndex = key.indexOf(that._div);

        if (divIndex < 0) {
          finalobj[key] = val;
        }
        else {
          var keybase = key.slice(0, divIndex);
          var keynum = key.slice(divIndex+that._div.length);
          tempobj[keybase] = tempobj[keybase] || [];
          tempobj[keybase][keynum] = val;
        }
      }

      // Recombine the divided entries.
      for (key in tempobj) {
        finalobj[key] = tempobj[key].join('');
      }

      that._fillDefaults(finalobj, callback);
    });
  },

  // Store `obj`, splitting long strings when necessary. `callback` will be
  // called (with no arguments) when complete.
  set: function(obj, callback) {
    var that = this;

    // First clear out existing entries.
    this._clearExisting(obj, function() {

      // Split long string entries into pieces, so we don't exceed the limit.
      var finalobj = {};
      for (var key in obj) {
        var val = obj[key];
        if (typeof(val) !== 'string' || val.length < that._maxlen()) {
          // Don't need to split, or can't.
          finalobj[key] = val;
        }
        else {
          var pieces = Math.ceil(val.length / that._maxlen());
          for (var i = 0; i < pieces; i++) {
            finalobj[key+that._div+i] = val.substr(i*that._maxlen(), that._maxlen());
          }
        }
      }

      that._storageSet(finalobj, function() {
        if (callback) callback();
      });
    });
  },

  remove: function(arrayOfKeys, callback) {
    var that = this;
    if (typeof(arrayOfKeys) === 'string') {
      arrayOfKeys = [arrayOfKeys];
    }
    this._clearExisting(arrayOfKeys, callback);
  },

  // The default values or URLs for our various options.
  defaults: {
    'main-css': {'__defaultFromFile__': '/common/default.css', '__mimeType__': 'text/css'},
    'syntax-css': {'__defaultFromFile__': '/common/highlightjs/styles/github.css', '__mimeType__': 'text/css'},
    'math-enabled': DEFAULTS['math-enabled'],
    'math-value': DEFAULTS['math-value'],
    'hotkey': DEFAULTS['hotkey'],
    'forgot-to-render-check-enabled': DEFAULTS['forgot-to-render-check-enabled'],
    'header-anchors-enabled': DEFAULTS['header-anchors-enabled'],
    'gfm-line-breaks-enabled': DEFAULTS['gfm-line-breaks-enabled']
  },

  // Stored string pieces look like: {'key##0': 'the quick ', 'key##1': 'brown fox'}
  _div: '##',

  // HACK: Using the full length, or length-keylength, gives quota error.
  // Because
  _maxlen: function() {
    // Note that chrome.storage.sync.QUOTA_BYTES_PER_ITEM is in bytes, but JavaScript
    // strings are UTF-16, so we need to divide by 2.
    // Some JS string info: http://rosettacode.org/wiki/String_length#JavaScript
    if (chrome.storage) {
      return chrome.storage.sync.QUOTA_BYTES_PER_ITEM / 2;
    }
    else {
      // 2048 is the default value for chrome.storage.sync.QUOTA_BYTES_PER_ITEM, so...
      return 2048 / 2;
    }

  },

  _storageGet: function(callback) {
    if (chrome.storage) {
      chrome.storage.sync.get(null, function(obj) {
        var key;
        for (key in obj) {
          // Older settings aren't JSON-encoded, so they'll throw an exception.
          try {
            obj[key] = JSON.parse(obj[key]);
          }
          catch (ex) {
            // do nothing, leave the value as-is
          }
        }
        callback(obj);
      });
      return;
    }
    else {
      // Make this actually an async call.
      Utils.nextTick(function() {
        var i, obj = {};
        for (i = 0; i < localStorage.length; i++) {
          // Older settings aren't JSON-encoded, so they'll throw an exception.
          try {
            obj[localStorage.key(i)] = JSON.parse(localStorage.getItem(localStorage.key(i)));
          }
          catch (ex) {
            obj[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
          }
        }
        callback(obj);
      });
      return;
    }
  },

  _storageSet: function(obj, callback) {
    var key, finalobj = {};
    for (key in obj) {
      finalobj[key] = JSON.stringify(obj[key]);
    }

    if (chrome.storage) {
      chrome.storage.sync.set(finalobj, callback);
      return;
    }
    else {
      // Make this actually an async call.
      Utils.nextTick(function() {
        var key;
        for (key in finalobj) {
          localStorage.setItem(key, finalobj[key]);
        }
        if (callback) callback();
      });
      return;
    }
  },

  _storageRemove: function(keysToDelete, callback) {
    if (chrome.storage) {
      chrome.storage.sync.remove(keysToDelete, callback);
      return;
    }
    else {
      // Make this actually an async call.
      Utils.nextTick(function() {
        var i;
        for (i = 0; i < keysToDelete.length; i++) {
          localStorage.removeItem(keysToDelete[i]);
        }
        callback();
      });
      return;
    }
  },

  // Clear any existing entries that match the given object's members.
  _clearExisting: function(obj, callback) {
    var that = this, newObj = {}, i;

    if (obj.constructor === Array) {
      newObj = {};
      for (i = 0; i < obj.length; i++) {
        newObj[obj[i]] = null;
      }
      obj = newObj;
    }

    this._storageGet(function(sync) {
      var keysToDelete = [];
      for (var objKey in obj) {
        for (var syncKey in sync) {
          if (syncKey === objKey || syncKey.indexOf(objKey+that._div) === 0) {
            keysToDelete.push(syncKey);
          }
        }
      }

      if (keysToDelete.length > 0) {
        that._storageRemove(keysToDelete, callback);
      }
      else {
        if (callback) callback();
      }
    });
  }
};
/*? } */


/*
 * Mozilla preferences storage helper
 */

var MozillaOptionsStore = {

  get: function(callback) {
    var that = this;
    this._sendRequest({verb: 'get'}, function(prefsObj) {
      that._fillDefaults(prefsObj, callback);
    });
  },

  set: function(obj, callback) {
    this._sendRequest({verb: 'set', obj: obj}, callback);
  },

  remove: function(arrayOfKeys, callback) {
    this._sendRequest({verb: 'clear', obj: arrayOfKeys}, callback);
  },

  // The default values or URLs for our various options.
  defaults: {
    'local-first-run': true,
    'main-css': {'__defaultFromFile__': 'resource://markdown_here_common/default.css', '__mimeType__': 'text/css'},
    'syntax-css': {'__defaultFromFile__': 'resource://markdown_here_common/highlightjs/styles/github.css', '__mimeType__': 'text/css'},
    'math-enabled': DEFAULTS['math-enabled'],
    'math-value': DEFAULTS['math-value'],
    'hotkey': DEFAULTS['hotkey'],
    'forgot-to-render-check-enabled': DEFAULTS['forgot-to-render-check-enabled'],
    'header-anchors-enabled': DEFAULTS['header-anchors-enabled'],
    'gfm-line-breaks-enabled': DEFAULTS['gfm-line-breaks-enabled']
  },

  // This is called both from content and background scripts, and we need vastly
  // different code in those cases. When calling from a content script, we need
  // to make a request to a background service (found in firefox/chrome/content/background-services.js).
  // When called from a background script, we're going to access the browser prefs
  // directly. Unfortunately, this means duplicating some code from the background
  // service.
  _sendRequest: function(data, callback) { // analogue of chrome.extension.sendMessage
    var extPrefsBranch, supportString, prefKeys, prefsObj, request, sender, i;

    try {
      extPrefsBranch = window.Components.classes['@mozilla.org/preferences-service;1']
                             .getService(Components.interfaces.nsIPrefService)
                             .getBranch('extensions.markdown-here.');
      supportString = Components.classes["@mozilla.org/supports-string;1"]
                                .createInstance(Components.interfaces.nsISupportsString);

      if (data.verb === 'get') {
        prefKeys = extPrefsBranch.getChildList('');
        prefsObj = {};

        for (i = 0; i < prefKeys.length; i++) {
          // All of our legitimate prefs should be strings, but issue #237 suggests
          // that things may sometimes get into a bad state. We will check and delete
          // and prefs that aren't strings.
          // https://github.com/adam-p/markdown-here/issues/237
          if (extPrefsBranch.getPrefType(prefKeys[i]) !== extPrefsBranch.PREF_STRING) {
            extPrefsBranch.clearUserPref(prefKeys[i]);
            continue;
          }

          try {
            prefsObj[prefKeys[i]] = window.JSON.parse(
                                      extPrefsBranch.getComplexValue(
                                        prefKeys[i],
                                        Components.interfaces.nsISupportsString).data);
          }
          catch(e) {
            // Null values and empty strings will result in JSON exceptions
            prefsObj[prefKeys[i]] = null;
          }
        }

        callback(prefsObj);
        return;
      }
      else if (data.verb === 'set') {
        for (i in data.obj) {
          supportString.data = window.JSON.stringify(data.obj[i]);
          extPrefsBranch.setComplexValue(
            i,
            Components.interfaces.nsISupportsString,
            supportString);
        }

        if (callback) callback();
        return;
      }
      else if (data.verb === 'clear') {
        if (typeof(data.obj) === 'string') {
          data.obj = [data.obj];
        }

        for (i = 0; i < data.obj.length; i++) {
          extPrefsBranch.clearUserPref(data.obj[i]);
        }

        if (callback) return callback();
        return;
      }
    }
    catch (ex) {
      // This exception was thrown by the Components.classes stuff above, and
      // means that this code is being called from a content script.
      // We need to send a request from this non-privileged context to the
      // privileged background script.
      data.action = 'prefs-access';
      Utils.makeRequestToPrivilegedScript(
        document,
        data,
        callback);
    }
  }
};


/*? if(platform!=='mozilla'){ */
/*
 * When called from the options page, this is effectively a content script, so
 * we'll have to make calls to the background script in that case.
 */
var SafariOptionsStore = {

  // The options object will be passed to `callback`
  get: function(callback) {
    var that = this;
    this._getPreferences(function(options) {
      that._fillDefaults(options, callback);
    });
  },

  // Store `obj`. `callback` will be called (with no arguments) when complete.
  set: function(obj, callback) {
    this._setPreferences(obj, callback);
  },

  remove: function(arrayOfKeys, callback) {
    this._removePreferences(arrayOfKeys, callback);
  },

  _getPreferences: function(callback) {
    // Only the background script has `safari.extension.settings`.
    if (typeof(safari.extension.settings) === 'undefined') {
      // We're going to assume we have Utils and document available here, which
      // should be the case, since we should be running as a content script.
      Utils.makeRequestToPrivilegedScript(
        document,
        { action: 'get-options' },
        callback);
    }
    else {
      // Make this actually asynchronous
      Utils.nextTick(function() {
        if (callback) callback(safari.extension.settings);
      });
    }
  },

  _setPreferences: function(obj, callback) {
    // Only the background script has `safari.extension.settings`.
    if (typeof(safari.extension.settings) === 'undefined') {
      // We're going to assume we have Utils and document available here, which
      // should be the case, since we should be running as a content script.
      Utils.makeRequestToPrivilegedScript(
        document,
        { action: 'set-options', options: obj },
        callback);
    }
    else {
      // Make this actually asynchronous
      Utils.nextTick(function() {
        for (var key in obj) {
          safari.extension.settings[key] = obj[key];
        }

        if (callback) callback();
      });
    }
  },

  _removePreferences: function(arrayOfKeys, callback) {
    // Only the background script has `safari.extension.settings`.
    if (typeof(safari.extension.settings) === 'undefined') {
      // We're going to assume we have Utils and document available here, which
      // should be the case, since we should be running as a content script.
      Utils.makeRequestToPrivilegedScript(
        document,
        { action: 'remove-options', arrayOfKeys: arrayOfKeys },
        callback);
    }
    else {
      // Make this actually asynchronous
      Utils.nextTick(function() {
        var i;
        if (typeof(arrayOfKeys) === 'string') {
          arrayOfKeys = [arrayOfKeys];
        }

        for (i = 0; i < arrayOfKeys.length; i++) {
          delete safari.extension.settings[arrayOfKeys[i]];
        }

        if (callback) callback();
      });
    }
  },

  // The default values or URLs for our various options.
  defaults: {
    'main-css': {'__defaultFromFile__': (typeof(safari) !== 'undefined' ? safari.extension.baseURI : '')+'markdown-here/src/common/default.css', '__mimeType__': 'text/css'},
    'syntax-css': {'__defaultFromFile__': (typeof(safari) !== 'undefined' ? safari.extension.baseURI : '')+'markdown-here/src/common/highlightjs/styles/github.css', '__mimeType__': 'text/css'},
    'math-enabled': DEFAULTS['math-enabled'],
    'math-value': DEFAULTS['math-value'],
    'hotkey': DEFAULTS['hotkey'],
    'forgot-to-render-check-enabled': DEFAULTS['forgot-to-render-check-enabled'],
    'header-anchors-enabled': DEFAULTS['header-anchors-enabled'],
    'gfm-line-breaks-enabled': DEFAULTS['gfm-line-breaks-enabled']
  }
};
/*? } */


/*? if(platform!=='mozilla'){ */
if (typeof(navigator) !== 'undefined' && navigator.userAgent.indexOf('Chrome') >= 0) {
  this.OptionsStore = ChromeOptionsStore;
}
else if (typeof(navigator) !== 'undefined' && navigator.userAgent.match(/AppleWebKit.*Version.*Safari/)) {
  this.OptionsStore = SafariOptionsStore;
}
else /*? } */ {
  this.OptionsStore = MozillaOptionsStore;
}

this.OptionsStore._fillDefaults = function(prefsObj, callback) {
  var that = this;

  var key, allKeys = [];
  for (key in that.defaults) {
    if (that.defaults.hasOwnProperty(key)) {
      allKeys.push(key);
    }
  }

  doNextKey();

  function doNextKey() {
    if (allKeys.length === 0) {
      // All done
      return callback(prefsObj);
    }

    // Keep processing keys (and recurse)
    return doDefaultForKey(allKeys.pop(), doNextKey);
  }

  function doDefaultForKey(key, callback) {
    // Only take action if the key doesn't already have a value set.
    if (typeof(prefsObj[key]) === 'undefined') {
      if (that.defaults[key].hasOwnProperty('__defaultFromFile__')) {
        var xhr = new window.XMLHttpRequest();

        if (that.defaults[key]['__mimeType__']) {
          xhr.overrideMimeType(that.defaults[key]['__mimeType__']);
        }

        // Get the default value from the indicated file.
        xhr.open('GET', that.defaults[key]['__defaultFromFile__']);

        xhr.onreadystatechange = function() {
          if (this.readyState === this.DONE) {
            // Assume 200 OK -- it's just a local call
            prefsObj[key] = this.responseText;

            return callback();
          }
        };

        xhr.send();
      }
      else {
        // Make it actually asynchronous
        Utils.nextTick(function() {
          prefsObj[key] = that.defaults[key];
          return callback();
        });
      }
    }
    else {
      // Just skip it, but make it asynchronous
      Utils.nextTick(function() {
        return callback();
      });
    }
  }
};

var EXPORTED_SYMBOLS = ['OptionsStore'];
this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
