/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

$(function(){
  mocha
    // I'm not sure what introduces the global "schemaTypes", but it's not
    // Markdown Here and it causes an error on one of my Chrome instances.
    .globals([ 'schemaTypes' ]) // acceptable globals
    .run();
});
