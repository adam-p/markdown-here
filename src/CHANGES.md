Change Log
==========

2012-07-xx: v2.5.0
------------------

* Changed default styles to be more relative. This results, for example, in ordinary Markdown-Here-rendered text looking more like ordinary Gmail text instead of the previous somewhat jarring size change.
  * This also fixes a bug: Inline code in headings will now be the correct size.

* Chrome: Options page with changelist at top will be opened when *Markdown Here* updates.

* Significant changes under the hood to (hopefully!) allow *Markdown Here* to properly pass a full Mozilla review. For details, see [issue #21](https://github.com/adam-p/markdown-here/issues/21).

* Fixed bug: Empty line would appear at the top of rendered fenced code blocks that had been pasted.

* Removed feature/fixed bug: Pre-formatted links are no longer left intact. It conflicted with Marked.js's GFM behaviour of turning text that looks like a URL into a link. So if a pre-formatted link was created that used the URL as the text (e.g. `<a href="http://github.com">http://github.com</a>`), the resulting rendering would get messed up (`<a ...><a ...>...</a></a>`).
  - Let this be a lesson about the perils of frivolous features.

2012-07-21: v2.4.0
------------------

* Chrome: Added styling options. You can now edit the CSS used to style the rendered Markdown and choose between various syntax highlighting themes. These options are synchronized between your different installations of Chrome (if you have it enabled in Chrome).

* Removed feature: Pre-formatted text (colours, italics, bold, etc.) and lists (made using the email client rich edit controls, for example) are no longer left intact. It just caused too many problems and special cases (and would have required more special cases to get working again in Yahoo). Links are left intact.

  - There are still two ways to still get additional formatting:
      1. Format *after* Markdown-Toggling. Note that any changes -- including formatting -- made to rendered text will be lost if you toggle back to Markdown. So only do your additional formatting after you're happy with the rest.
      2. Add inline HTML with the desired formatting.
         * In your Markdown, you can use `<span>` or `<b>`, etc., to explicitly style your text. For example:
           
             ```
             Here is some <span style="background-color:red; font-size:2em;">*big red*</span> highlighting.
             ```
         * If you find you use inline tags with complex styles a lot, edit the CSS in the options to add a class that you can reuse for your inline tags. For example, in the CSS add:
   
             ```
             .bigred {
               background-color: red;
               font-size: 2em;
             }
             ```
   
             And then in your Markdown:

             ```
             Here is some <span class="red">*big red*</span> highlighting.
             ```
           
  - It saddens me to remove out this feature, but I think it's essentially creeping featurism that has a higher bug-danger-cost than it has an actually-useful-benefit. If this feature is/was important to you, please create an issue to let me know.

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
  - Resolves issue #14.

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
