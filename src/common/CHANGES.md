Change Log
==========

2013-10-07: v2.9.0
------------------

* New feature: **Forgot-to-render detection**. Have you ever forgotten to make your Markdown pretty before sending your email? Me too. Now Markdown Here will detect when your email contains raw Markdown and will give you second chance to go back and render it before sending.
  * This feature is supported in Thunderbird (and Postbox), and for Gmail in Chrome, Firefox, Opera, and Safari. (Pull requests welcome for Hotmail, Yahoo, etc.)
  * For now this feature is off by default because I'm nervous about too many false positives driving people crazy. But please opt in! The checkbox to enable it is at the bottom of the MDH Options page. And please give feedback on how the feature does or doesn't work for you, either in the [Github issue](https://github.com/adam-p/markdown-here/issues/90) or the [MDH Google Group](https://groups.google.com/forum/#!forum/markdown-here).
  * Thanks to [Petr Pudlák](https://github.com/ppetr) for requesting this in [issue #90](https://github.com/adam-p/markdown-here/issues/90), [Zhou Qiang](https://github.com/zhouqianghfut) in [issue #96](https://github.com/adam-p/markdown-here/issues/96), [Adam Backstrom](https://github.com/abackstrom) in [issue #98](https://github.com/adam-p/markdown-here/issues/98).

* **Compatibility improvements!**
  * Now works great with **Blogger** ([details](https://github.com/adam-p/markdown-here/wiki/Compatibility#blogger)).
    * The changes made will probably help with some other sites. If you tried out a site before and ended up with empty lines in your code blocks, try it again.
    * See the [Compatibility wiki page](https://github.com/adam-p/markdown-here/wiki/Compatibility#blogger) for details.
    * Thanks to [lambdaalice](https://github.com/lambdalice) for reporting the previous bad behaviour in [issue #89](https://github.com/adam-p/markdown-here/issues/89).
  * Now works very well with **Wordpress** ([details](https://github.com/adam-p/markdown-here/wiki/Compatibility#wordpress)).
  * See the [Compatibility wiki page](https://github.com/adam-p/markdown-here/wiki/Compatibility) for even more places where Markdown Here works, like **Google Sites** and **Facebook Notes**.

* New feature: **Automatic anchors for headers**. This makes it much easier to put a **table of contents** (or other intra-page links) inside your email or blog post. Just use the text of your header as the anchor link text. For example:
    ```no-highlight
    [See below](#Deep-Dive Details Section) for details.
    ...
    Deep-Dive Details Section
    =========================
    ...
    ```
  * Thanks to [Casey Watts](https://github.com/caseywatts) for requesting this and giving insight on how to do it. Closes issue [#93](https://github.com/adam-p/markdown-here/issues/93).

* Chrome and Firefox: Options page no longer opens when Markdown Here updates. Now there's a little notification in the corner of the window that can be clicked to show the MDH Options page (and the changes in the release), or dismissed.
  * Thanks to [Casey Watts](https://github.com/caseywatts) for his help. Closes issues [#64](https://github.com/adam-p/markdown-here/issues/64) and [#95](https://github.com/adam-p/markdown-here/issues/95).

* Added the ability to set **site-specific styles**. To see an example of how to do this, either reset your Primary Styling CSS or [take a look at the source for it](https://github.com/adam-p/markdown-here/blob/6d3c2efea23219b58da183df23da111f8fd9febb/src/common/default.css#L15).

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/84): Math: single-character formula won't render.
  * Thanks to kbeach who reported this [in a Google Groups post](https://groups.google.com/forum/#!msg/markdown-here/tolrITkqrx0/phElyPBBAhYJ).
  * Thanks again to [Emanuele D'Osualdo](https://github.com/bordaigorl) for providing the fix.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/83): `[a](b)` links shouldn't expand inside of a code block.
  * Thanks to [Dan Brown](https://github.com/jdanbrown) for reporting this bug.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/87): "Smart" quotations and apostrophes would sometimes get confused and curl the wrong way.
  * Thanks to [Jay Dixit](https://github.com/jaydixit) for reporting this bug.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/53): Shouldn't require blank line before list.


2013-08-24: v2.8.2
------------------

Added support for [**Opera**](http://www.opera.com)! Get it [here](https://addons.opera.com/en/extensions/details/markdown-here/).

2013-06-23: v2.8.1
------------------

**PLEASE NOTE:** If you've never customized your CSS, you should click the "Reset to Default" button for the "Primary Styling CSS". This will fix a bug (see below) and maybe give you better styling (if you installed MDH before version 2.7.0, Feb. 2013). If you have customized your CSS, you can [take a look at the changes to the default CSS](https://github.com/adam-p/markdown-here/commits/master/src/common/default.css) and decide what to take. A more elegant way of handling this is [being planned](https://github.com/adam-p/markdown-here/issues/78).

* The designer/artist of the Markdown Here logo has her own website up. You should check it out! http://tatianafryntoff.com/

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/69): Pre-formatted links break Markdown links.
  * Thanks to users Mitchell W. and [crdx](https://github.com/crdx) for reporting this bug.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/57): MD links should automatically add schema.
  * Thanks to [Casey Watts](https://github.com/caseywatts) for reporting this bug.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/70): Firefox/Thunderbird: Code blocks with horizontal scroll would have bad background colour.
  * Thanks to user Hans B. for reporting this bug.
  * Note that to get this bug fix, you either need to reset your "Primary Styling CSS" to default, or [manually apply the fix](https://github.com/adam-p/markdown-here/commit/4c9e0448251b4390ca6043fad5a75b1b6413464d).

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/52): Inline code line breaks are lost.
  * Thanks to user [CheechGe](https://github.com/CheechGe) for reporting this bug.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/77): Sometimes options page MD preview doesn't initially render.

2013-05-19: v2.8.0
------------------

* **Markdown Here now supports Safari!** [Get it here.](http://markdown-here.com/get.html)
  * Thanks to users [unscriptable](https://github.com/unscriptable) and [martinsvalin](https://github.com/martinsvalin) for [requesting it](https://github.com/adam-p/markdown-here/issues/38).

* Fixed bug in Firefox v23 (current Aurora): Options page wasn't working. ([See details.](https://github.com/adam-p/markdown-here/commit/c20b7e4841f325bed3201ea9a98b3f6c986cf8cc))

2013-03-05: v2.7.3
------------------

* Fixed Firefox+Linux bug ([#56](https://github.com/adam-p/markdown-here/issues/56)): Toolbar button icon was not displaying correctly. 
  * Thanks to users [ynoxia](https://github.com/ynoxia) and [jljouannic](https://github.com/jljouannic) for reporting the bug.
* Fixed Firefox bug: Toolbar button would not stay removed when browser was restarted.
* Added support for Icedove (Debian version of Thunderbird).

2013-02-17: v2.7.2
------------------

* Pre-formatted links will now be retained. If you use your email editor's formatting controls to create a link, it will be retained when you toggle the Markdown Here rendering state.

* Firefox/Thunderbird: Fixed bug; Resetting the primary stying CSS wasn't working.

2013-02-13: v2.7.1
------------------

* Under-the-hood changes to satisfy Mozilla requirements.

2013-02-06: v2.7.0
------------------

* Markdown Here has a **new logo**! A big thank you to the talented [Tatiana A. Fryntoff](http://tatianafryntoff.com/) for creating our shiny new logo.

* Support for new Markdown features. All credit goes to chjj, the maintainer of the [Marked library](https://github.com/chjj/marked).
  * **Tables!** Now you can easily add tables to your email with Markdown. If you're not familiar with the syntax, check out [the wiki cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Here-Cheatsheet#wiki-tables). This closes [issue #13](https://github.com/adam-p/markdown-here/issues/13).
  * Strikethrough: Put double tildes around things to ~~strike it out~~ (`~~strike it out~~`).
  * Smarter lists: Have you ever had a numbered list mysteriously/annoyingly become a bullet list because it comes after one? Not anymore.
  * GFM line breaks: If you put a line break in your Markdown, it will be a line break after you toggle, instead of joining to form a single line. This closes [issue #12](https://github.com/adam-p/markdown-here/issues/12).

* Added a **Markdown Toggle button** to complement the context menu item and hotkey. 
  * In Chrome and Firefox, this button will appear on the browser toolbar. It will be enabled when you're typing in a compose box that Markdown Here can work with. 
    * You might notice the button enabled when you're typing in places other than your email page -- try it out! You might discover that Markdown Here works somewhere new. If you do, please [add it to the compatibility wiki](https://github.com/adam-p/markdown-here/wiki/Compatibility).
  * In Thunderbird and Postbox the appears on the formatting toolbar.
  * In Firefox, Thunderbird, and Postbox you can add/remove/move the button by right-clicking on the toolbar, clicking "Customize", and then dragging the button around. In Chrome you can remove it by right-click on it.
  * If you have any feedback about the new button, please join the ["markdown-here" Google Group discussion](https://groups.google.com/d/topic/markdown-here/NjQRYcD1mgY/discussion).
  * Thanks to user jakov for [suggesting this feature in issue #34](https://github.com/adam-p/markdown-here/issues/34).

* **Default styling changes**. Note that you'll have to reset your styles to get the new defaults (click "**Reset to Default**" on the options page). The changes include:
  * Slightly smaller header font size.
  * Less space between list items.
  * Link styling is now more standard (e.g., underlines in Gmail).
  * If you have any feedback on the default styling, please join the [Google Group discussion](https://groups.google.com/d/topic/markdown-here/V2n5ZxgzGQw/discussion).
  * Thanks to [Casey Watts](http://caseywatts.github.com/2012/12/17/markdown_in_gmail/) for his input.

* Added a "Basic Usage" section to the options page. This is in response to [a tweet](https://twitter.com/KSuzukiii/status/294376172295446528) from user KSuzukii.

* Yahoo and Hotmail/Outlook.com now work a bit better.

2013-01-02: v2.6.4
------------------

* Firefox/Thunderbird: Actually fixed the bug that I thought I fixed in v2.6.3. Much thanks to Daniel Ashton for letting me know that it was still busted and John Galt for assisting in the fix.

2012-12-01: v2.6.3
------------------

* Firefox/Thunderbird: [Fixed bug](https://github.com/adam-p/markdown-here/issues/37): Changes in Firefox/Thunderbird version 17 resulted in the options page not working correctly.

2012-10-06: v2.6.2
------------------

* Firefox/Thunderbird: [Fixed bug](https://github.com/adam-p/markdown-here/issues/31): Tabbing into the email body and then Markdown-Toggling via keyboard (i.e., never clicking the mouse in the message body) would result in the email body being lost when sent. 
  * This is due to [a bug in Firefox/Thunderbird](https://bugzilla.mozilla.org/show_bug.cgi?id=740813).

* Discovered Wordpress post compatibility, thanks to user [Sina Iravanian](https://plus.google.com/116422808039109985732/posts). ([See details](https://github.com/adam-p/markdown-here/wiki/Compatibility).)

2012-09-09: v2.6.1
------------------

* Added hot-key (keyboard shortcut) support. The default key combination is <kbd>ctrl</kbd>+<kbd>alt</kbd>+<kbd>m</kbd>, but it is configurable from the Markdown Here options. Using the hot-key is identical to using the "Markdown Toggle" context menu item. 

* Added basic support for the [Postbox](http://www.postbox-inc.com/) desktop email client, at the [request of a user](https://github.com/adam-p/markdown-here/issues/30). There are [some significant caveats](https://github.com/adam-p/markdown-here/wiki/Compatibility), like the lack of an options page.

* Fixed [bug](https://github.com/adam-p/markdown-here/issues/27): Gmail and Thunderbird reply exclusion wasn't working well, resulting in quoted replies getting messed up when doing a full (non-selection) rendering. 

* Fixed: In Chrome on OS X, right-clicking on a word causes it to be selected. If "Markdown Toggle" were then clicked, it would render just that one word, which is lame. This behaviour is now avoided by not rendering single word selections -- if a single word is selected, the entire content will be rendered instead.

* Discovered [Evernote](https://evernote.com/) web-interface compatibility, thanks to user [markgoodson](https://github.com/markgoodson). ([See details](https://github.com/adam-p/markdown-here/wiki/Compatibility).)

2012-08-29: v2.6.0
------------------

* Added support for TeX math formulae. For info check out the Options page. 
  * Note that this feature is disabled by default, due to privacy concerns. Again, the see the Options page for info.
  * Thanks to [bordaigorl](https://github.com/bordaigorl) for [suggesting this feature](https://github.com/adam-p/markdown-here/issues/26) and helping to implement it.

* Firefox/Thunderbird: Added Options page. (Chrome already had it.) Take a look around and play with the styles. 

* Added a few new syntax highlighting themes. (Thanks to Highlight.js.)

2012-08-16: v2.5.3
------------------

* Chrome: Fixed compatibility with Chromium v18 (currently the version in the Ubuntu repo).
  * Limitation: Chromium v18 doesn't support synchronized settings. And when the user upgrades to a more recent version that supports `chrome.storage`, previous settings will not be migrated.
  * Thanks to [gingerlime](https://github.com/gingerlime) for [finding this bug](https://github.com/adam-p/markdown-here/issues/6#issuecomment-7769877) and helping to fix it.

2012-08-08: v2.5.2
------------------

* Firefox/Thunderbird: Minor change resulting from Mozilla review. (Fixed a "loose" variable.)

2012-08-02: v2.5.1
------------------

* Chrome: Fixed bug: In version 21 of Chrome, the Markdown Here options page no longer rendered correctly. (Chrome changed the display style name for flexbox layout from "-webkit-flexbox" to "-webkit-flex". Using bleeding edge CSS maybe wasn't a great idea.)

2012-07-27: v2.5.0
------------------

* Changed default styles (e.g., font sizes) to be more relative. This results, for example, in ordinary Markdown-Here-rendered text looking more like ordinary Gmail text instead of the previous somewhat jarring size change.
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

* Created a Markdown cheatsheet: https://github.com/adam-p/markdown-here/wiki/Markdown-Here-Cheatsheet


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
