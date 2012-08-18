/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

/* 
 * The background service for supplying preferences to content scripts.
 * From: https://developer.mozilla.org/en-US/docs/Code_snippets/Interaction_between_privileged_and_non-privileged_pages
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

    var prefs, prefKeys, prefsObj, i;

    prefs = Components.classes['@mozilla.org/preferences-service;1']
                      .getService(Components.interfaces.nsIPrefService)
                      .getBranch('extensions.markdown-here.');
    
    if (request.action === 'get') {
      prefKeys = prefs.getChildList('');
      prefsObj = {};

      for (i = 0; i < prefKeys.length; i++) {
        prefsObj[prefKeys[i]] = JSON.parse(prefs.getCharPref(prefKeys[i]));
      }

      return callback(prefsObj);
    }
 
    if (request.action === 'set') {
      for (i in request.obj) {
        prefs.setCharPref(i, JSON.stringify(request.obj[i]));
      }

      if (callback) return callback();
      return;
    }
 
    return alert('Error: no matching options service action');
  }
}
 
MozillaOptionsService.listenRequest(MozillaOptionsService.requestHandler);
