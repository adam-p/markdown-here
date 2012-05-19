const contextMenu = require('context-menu');
const data = require('self').data;


var menuItem = contextMenu.Item({
  label: 'Markdown Toggle',
  context: contextMenu.URLContext('*'),
  contentScriptFile: [
    data.url('marked.js'),
    data.url('jsHtmlToText.js'),
    data.url('github.css.js'),
    data.url('markdown-render.js'),
    data.url('markdown-here-listener.js'),
    data.url('firefox-contentscript.js')]
});
