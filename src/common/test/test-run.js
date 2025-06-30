/*
 * Copyright Adam Pritchard 2013
 * MIT License : https://adampritchard.mit-license.org/
 */

document.addEventListener('DOMContentLoaded', function() {
  mocha
    // I'm not sure what introduces the global "schemaTypes", but it's not
    // Markdown Here and it causes an error on one of my Chrome instances.
    .globals([ 'schemaTypes' ]) // acceptable globals
    .run();
});
