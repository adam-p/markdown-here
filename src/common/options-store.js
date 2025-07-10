/*
 * Copyright Adam Pritchard 2015
 * MIT License : https://adampritchard.mit-license.org/
 */


;(function() {

"use strict";
/*global module:false, chrome:false, Components:false*/

// Common defaults
const DEFAULTS = {
  'math-enabled': false,
  'math-value': '<img src="https://latex.codecogs.com/png.image?\\dpi{120}\\inline&space;{urlmathcode}" alt="{mathcode}">',
  // When we switched to the new permissions model, we needed users to re-enable the
  // forgot-to-render check, so that they would be prompted to give permission to access
  // mail.google.com. So the name of this option changed to force that.
  'forgot-to-render-check-enabled-2': false,
  'header-anchors-enabled': false,
  'gfm-line-breaks-enabled': true
};

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
    'main-css': {'__defaultFromFile__': '/common/default.css', '__dataType__': 'text'},
    'syntax-css': {'__defaultFromFile__': '/common/highlightjs/styles/github.css', '__dataType__': 'text'},
    'math-enabled': DEFAULTS['math-enabled'],
    'math-value': DEFAULTS['math-value'],
    'forgot-to-render-check-enabled-2': DEFAULTS['forgot-to-render-check-enabled-2'],
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
    // Some JS string info: https://rosettacode.org/wiki/String_length#JavaScript
    if (chrome.storage && chrome.storage.sync && chrome.storage.sync.QUOTA_BYTES_PER_ITEM) {
      return chrome.storage.sync.QUOTA_BYTES_PER_ITEM / 2;
    }
    else {
      // 8192 is the default value for chrome.storage.sync.QUOTA_BYTES_PER_ITEM, so...
      return 8192 / 2;
    }

  },

  _storageGet: function(callback) {
    if (chrome.storage) {
      (chrome.storage.sync || chrome.storage.local).get(null, function(obj) {
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
      (chrome.storage.sync || chrome.storage.local).set(finalobj, callback);
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
      (chrome.storage.sync || chrome.storage.local).remove(keysToDelete, callback);
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


// Use ChromeOptionsStore for all WebExtensions platforms
this.OptionsStore = ChromeOptionsStore;

this.OptionsStore._fillDefaults = function(prefsObj, callback) {
  var that = this;

  // Upgrade the object, if necessary.
  // Motivation: Our default for the LaTeX renderer used to be Google Charts API. Google
  // discontinued the service and we switched the default to CodeCogs, but because it was
  // the default, it will be set in many users' OptionsStore. We need to forcibly replace it.
  if (typeof prefsObj['math-value'] === 'string' && prefsObj['math-value'].indexOf('chart.googleapis.com') >= 0) {
    prefsObj['math-value'] = that.defaults['math-value'];
  }

  var key, allKeys = [];
  for (key in that.defaults) {
    if (that.defaults.hasOwnProperty(key)) {
      allKeys.push(key);
    }
  }

  doNextKey();

  function doNextKey() {
    if (allKeys.length === 0) {
      // All done.
      // Ensure this function is actually asynchronous.
      Utils.nextTick(function() {
        callback(prefsObj);
      });
      return;
    }

    // Keep processing keys (and recurse)
    doDefaultForKey(allKeys.pop(), doNextKey);
  }

  // This function may be asynchronous (if XHR occurs) or it may be a straight
  // synchronous callback invocation.
  function doDefaultForKey(key, callback) {
    // Only take action if the key doesn't already have a value set.
    if (typeof(prefsObj[key]) === 'undefined') {
      if (that.defaults[key].hasOwnProperty('__defaultFromFile__')) {
        Utils.getLocalFile(
          that.defaults[key]['__defaultFromFile__'],
          that.defaults[key]['__dataType__'] || 'text',
          function(data) {
            prefsObj[key] = data;
            callback();
        });
        return;
      }
      else {
        // Set the default.
        prefsObj[key] = that.defaults[key];
        // Recurse
        callback();
        return;
      }
    }
    else {
      // Key already has a value -- skip it.
      callback();
      return;
    }
  }
};

var EXPORTED_SYMBOLS = ['OptionsStore'];
this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
