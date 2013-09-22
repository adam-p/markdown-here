/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * Application logic that is common to all (or some) platforms.
 * (And isn't generic enough for utils.js or render-y enough for markdown-render.js,
 * etc.)
 */

;(function() {

"use strict";
/*global module:false, chrome:false, Utils:false*/




/*
 * Gets the forgot-to-render prompt. This must be called from a privileged script.
 */
function getForgotToRenderPrompt(responseCallback) {
  // Get the content of notification element
  Utils.getLocalFile(
    Utils.getLocalURL('/common/forgot-to-render-prompt.html'),
    'text/html',
    function(html) {
      // Get the logo image data
      Utils.getLocalFileAsBase64(
        Utils.getLocalURL('/common/images/icon24.png'),
        function(logoBase64) {
          // Do some rough template replacement
          html = html.replace('{{logoBase64}}', logoBase64);

          return responseCallback(html);
        });
      });
}

// Expose these functions
var CommonLogic = {};
CommonLogic.getForgotToRenderPrompt = getForgotToRenderPrompt;

var EXPORTED_SYMBOLS = ['CommonLogic'];

if (typeof module !== 'undefined') {
  module.exports = CommonLogic;
} else {
  this.CommonLogic = CommonLogic;
  this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
