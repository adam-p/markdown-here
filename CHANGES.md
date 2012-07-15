Change Log
==========

2012-06-20: v2.3.1
------------------

* Fixed bug: Yahoo: Code blocks would just show a bunch of span tags. (Introduced in 2.3.0.)

2012-06-20: v2.3.0
------------------

* Works with Google Groups posts! You can use it either in the GG rich compose box, or when sending posts via email. 

* Added support for inline, pre-rendered images. Some email editors allow the user to drag-and-drop an image into an email body, and some allow users to select one from their computer or the web (or an emoticon in the email compose controls!). Previously, the image would be lost when a "Markdown Toggle" was done. Now the image will be retained.

* Pre-formatted text (colours, italics, bold, etc.), links, and lists (made using the email client rich edit controls, for example) are now left intact when rendering the Markdown.

* Added ability to convert a reply email in its entirety, rather than using the select-and-convert piecemeal approach. 
  - This doesn't work with Yahoo and Hotmail, because they don't seem to quote the original email.
  - Resolves issue #14

* Some styling changes.

* Bug fixes.

* Created a Markdown cheatsheet: https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet


2012-06-07: v2.2.0
------------------

* Syntax highlighting! Coloured monospace text is super sexy.

* Email signatures are now excluded from conversion. Signatures must be preceded by "-- " (note the space at the end).

* Fixed block quotes.

* Much improved table and definition list styling.

* Better styling and consistency across browsers and mail clients.


2012-05-31: v2.1.3
------------------

* Firefox/Thunderbird: "Markdown Toggle" menu item will show up for non-rich-edit elements, but an error message will be given if the item is clicked. Hopefully this will help people notice that they're not using a rich editor, instead of wondering where the menu item is.

* Chrome: If the "Markdown Toggle" menu item is clicked for a non-rich-edit element, a helpful error message will be shown.

* Fixed bug: Significant trailing spaces were being stripped. This was breaking the Markdown syntax feature of two spaces at the end of the line indicating a hard line break.

* Changed context menu access key to 'k'. Previously, Chrome had no access key and Firefox/Thunderbird had the more-common letter 'm'.

* Other minor bugfixes.


2012-05-21: v2.1.2
------------------

* Chrome: Fixed manifest. Using manifest version 2 worked in debug, but not when published to the Store. Had to delete original Store extension in the process. :(

* Chrome: Updated manifest home page link to new Store address.


2012-05-21: v2.1.0
------------------

* Added Thunderbird support to Firefox extension.

* Tightened security restrictions in Chrome extension.


2012-05-20: v2.0.0
------------------

* Added Firefox extension.

* Chrome version: Moved most rendering code out of content scripts and into background scripts. This means less code needs to be loaded with each page. (The Firefox version also more or less behaves like this.)


2012-05-17: v1.2.1
------------------

* Bug fix: Rendering and reverting same selection (rather than reverting a point or selection within the original selection) would result in a loss of original Markdown.


2012-05-16: v1.2.0
------------------

* New feature: You can convert only part of an email by selected a region before clicking "Markdown Toggle". This is great for replies. To revert back to Markdown, right-click in the converted block and click "Markdown Toggle" again.


2012-05-15: v1.1.2
------------------

* Fixed issue with fonts sent and received by Yahoo.


2012-05-14: v1.1.1
------------------

* Fixed Gmail display of received rendered-from-Markdown email. Gmail was killing the `<style>` block, so styles are now also set explicitly on each element. Gmail works great now.


2012-05-13: v1.1.0
------------------

* Added ability to revert rendered HTML back to Markdown.


2012-05-12: v1.0.0
------------------

* Initial release.
