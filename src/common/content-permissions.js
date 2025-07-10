/*
 * Copyright Adam Pritchard 2025
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * Content Permissions - Handles dynamic permission requests
 */

// TODO: Is this just too thin a wrapper around chrome.permissions to bother?

'use strict';

const ContentPermissions = {
  // Note that the "origin" and "origins" parameters are URLs or URL patterns.
  // They _require_ at least a trailing slash -- they must not be a bare domain.

  async hasPermission(origin) {
    try {
      // Test explicitly for http or https scheme.
      // If we proceed with the code below on a `moz-extension://` URL (like
      // our options page in Firefox), it will throw an error.
      if (!/^https?:\/\/.+/.test(origin)) {
        console.warn('Permission check skipped for non-http(s) origin:', origin);
        return false;
      }

      return await chrome.permissions.contains({ origins: [origin] });
    } catch (e) {
      console.error('Error checking permission:', e);
      return false;
    }
  },

  async requestPermission(origins) {
    try {
      return await chrome.permissions.request({ origins: origins });
    } catch (e) {
      console.error('Error requesting permission:', e);
      return false;
    }
  },

  async removePermissions(origins) {
    try {
      return await chrome.permissions.remove({ origins: origins });
    } catch (e) {
      console.error('Error removing permission:', e);
      return false;
    }
  },
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentPermissions;
}
