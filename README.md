# ![Markdown Here logo](//github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png) Markdown Here

*Markdown Here* is a Google Chrome, Firefox, and Thunderbird extension that lets you write email<sup>*</sup> in Markdown and render them before sending. It also supports syntax highlighting (just specify the language in a fenced code block).

Writing email with code in it is pretty tedious. Writing Markdown with code in it is easy. I found myself writing email in Markdown in the Github in-browser editor, then copying the preview into email. This is a pretty absurd workflow, so I decided create a tool to write and render Markdown right in the email.

To discover what can be done with Markdown in *Markdown Here*, check out the [Markdown Cheatsheet](//github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet).

<sup>*: And Google Groups posts!</sup>

![screenshot of conversion](//github.com/adam-p/markdown-here/raw/master/store-assets/markdown-here-image1.gimp.png)

## Installation

### Chrome

#### Chrome Web Store

Go to the [Chrome Web Store page for *Markdown Here*](https://chrome.google.com/webstore/detail/elifhakcjgalahccnjkneoccemfahfoa) and install normally.

After installing, make sure to reload your webmail or restart Chrome!

#### Manual/Development

1. Clone this repo.
2. In Chrome, open the Extensions settings. (Wrench button, Tools, Extensions.)
3. On the Extensions settings page, click the "Developer Mode" checkbox.
4. Click the now-visible "Load unpacked extension…" button. Navigate to the directory where you cloned the repo, then the `src` directory under that.
5. The *Markdown Here* extension should now be visible in your extensions list.
6. Reload your webmail page (and maybe application) before trying to convert an email.

### Firefox and Thunderbird

#### Mozilla Add-ons site

**!!! PLEASE NOTE: The extension has been pulled from the Mozilla Add-ons site. For info see [issue #20](https://github.com/adam-p/markdown-here/issues/20). !!!**

Go to the [Firefox Add-ons page for *Markdown Here*](https://addons.mozilla.org/en-US/firefox/addon/markdown-here/) and install normally.

Or go to the "Tools > Add-ons" menu and then search for "Markdown Here".

After installing, make sure to restart Firefox/Thunderbird!

**Note:** It takes up to two weeks for Mozilla to approve changes to the Firefox/Thunderbird extension, so updates (features, fixes) will lag behind what is shown here. You can compare the version number on the [*Markdown Here* Mozilla Add-ons page](https://addons.mozilla.org/en-US/firefox/addon/markdown-here/) against [the changelist](https://github.com/adam-p/markdown-here/blob/master/CHANGES.md).

#### Manual/Development

1. Clone this repo.
2. Follow the instructions in the MDN ["Setting up an extension development environment"](https://developer.mozilla.org/en/Setting_up_extension_development_environment) article.

## Use

Install it, and then…

1. In Chrome or Firefox, log into your Gmail, Hotmail, or Yahoo account and start a new email. In Thunderbird, start a new message.
2. Make sure you're using the rich editor.
   * In Gmail, click the "Rich formatting" link, if it's visible.
   * In Thunderbird, make sure "Compose messages in HTML format" is enabled in your "Account Settings", "Composition & Addressing" pane.
3. Compose an email in Markdown. For example:

   <pre>
   **Hello** `world`.

   ```javascript
   alert('Hello syntax highlighting.');
   ```
   </pre>

4. Right-click in the compose box and choose the "Markdown Toggle" item from the context menu.
5. You should see your email rendered correctly from Markdown into rich HTML.
6. Send your awesome email to everyone you know. It will appear to them the same way it looks to you.

### Revert to Markdown

After rendering your Markdown to pretty HTML, you can still get back to your original Markdown. Just right-click anywhere in the newly rendered Markdown and click "Markdown Toggle" -- your email compose body will change back to the Markdown you had written.

Note that any changes you make to the pretty HTML will be lost when you revert to Markdown.

In Gmail, you can also use the browser's Undo command (ctrl+z/cmd+z, or from the Edit menu). Be warned that you might also use the last few characters you entered.

### Replies

In Gmail, Thunderbird, and Google Groups, you can use "Markdown Toggle" normally: just write your reply (top, bottom, inline, wherever) and then convert. The original email that you're replying to will be left alone. (Technically: Existing `blockquote` blocks will be left intact.) 

In Hotmail and Yahoo (which don't put the original in a `blockquote`), and optionally in Gmail, Thunderbird, and Google Groups, you can ensure that only the part of the reply that you wrote gets converted by selecting what you want to convert and then clicking "Markdown Toggle" -- see the next section.

### Selection/Piecemeal Conversion

Sometimes you don't want to convert the entire email; sometimes your email isn't entirely Markdown. To convert only part of the email, select the text (with your mouse or keyboard), right-click on it, and click the "Markdown Toggle" menu item. Your selection is magically rendered into pretty HTML.

To revert back to Markdown, just put your cursor anywhere in the block of converted text, right click, and click the "Markdown Toggle" menu item again. Now it's magically back to the original Markdown.

![screenshot of selection conversion](//github.com/adam-p/markdown-here/raw/master/store-assets/markdown-here-image2.gimp.png)

#### Things to know about converting/reverting a selection

* If you select only part of a block of text, only that text will be converted. The converted block will be wrapped in a paragraph element, so the original line will be broken up. You probably don't want to ever do this.

* Be aware that on Mac OS X (only >= Lion?), right clicking a word (only in Chrome?) will cause that word to be selected, and that triggers *Markdown Here*'s selection-convert mode. So if you want to convert the whole email, right-click where there's no text.
  * It's okay to have a selection when reverting back to Markdown, so don't worry about right-clicking on text when doing that.
  * If right-clicking on empty space is a pain, you can select-all (Cmd+A) and then convert.

* You can select and revert multiple converted blocks at the same time. One upshot of this is that you can select your entire email, click "Markdown Toggle", and all portions of it that you had converted will be reverted.

* If you don't have anything selected when you click "Markdown Toggle", *Markdown Here* will check if there are converted blocks anywhere in the message and revert them. If there no converted blocks are found, it will convert the entire email.

## Troubleshooting

Here are some common problems people run into.

<dl>
  <dt>Chrome/Firefox/Thunderbird: I just installed <em>Markdown Here</em> and the context menu item isn't showing up.</dt>
  <dd>Make sure you restarted Firefox or Thunderbird, and either restarted Chrome or reloaded your webmail page.</dd>
</dl>

## Compatibility

Short answer: Gmail and Thunderbird are great.

<table>
  <tr>
    <th></th>
    <th>Compose</th>
    <th>Send</th>
    <th>Receive</th>
  </tr>
  <tr>
    <th>Gmail</th>
    <td>Perfect</td>
    <td>Perfect</td>
    <td>Perfect</td>
  </tr>
  <tr>
    <th>Thunderbird</th>
    <td>Perfect</td>
    <td>Perfect</td>
    <td>Perfect</td>
  </tr>
  <tr>
    <th>Hotmail</th>
    <td>Perfect</td>
    <td>Perfect</td>
    <td>Email from received from Yahoo does not display with properly separated paragraphs. (Hotmail strips styling off <code>&lt;p&gt;</code> and <code>&lt;div&gt;</code> tags, and Yahoo uses the latter for paragraphs.)</td>
  </tr>
  <tr>
    <th>Yahoo</th>
    <td>Perfect</td>
    <td>Perfect</td>
    <td>Perfect</td>
  </tr>
  <tr>
    <th>Google Groups</th>
    <td>Perfect</td>
    <td>Perfect</td>
    <td>Perfect</td>
  </tr>
</table>

*Compose*
> How *Markdown Here* behaves when composing an email. E.g., if rendering and reverting looks correct, styling is good, etc.

*Send*
> Negative effect that may occur when sending a rendered email from this email client. E.g., stripped tags and styles.

*Receive*
> How well this email client displays rendered email that it receives (assuming the sender is perfect).

## Notes and Miscellaneous

* *Markdown Here* uses [Github Flavored Markdown](http://github.github.com/github-flavored-markdown/).
  * ...with limitations. Please see the Issues for details, but here are some examples:
    * No support for GFM special links: adam-p/markdown#11
    * No support for GFM-style line breaks: adam-p/markdown#12
    * No support for GFM-style tables: adam-p/markdown#13

* Available languages for syntax highlighting (and the way they should be written in the fenced code block) can be seen on the [highlight.js demo page](http://softwaremaniacs.org/media/soft/highlight/test.html).

* Most pre-formatting of email is maintained when rendering Markdown with *Markdown Here*. So you can, if you wish, add bold, font colors, links, and lists using the email editor's rich controls -- they will be kept intact after you "Markdown Toggle". 
  * This includes images. Gmail allows you to put images inline in your email -- you can do this before converting and the image will be retained.
  * This is a deviation from the Markdown spec, but it's really handy.

* Email signatures are automatically excluded from conversion. Specifically, anything after the semi-standard `'-- '` (note the trailing space) is left alone.
  * Note that Hotmail and Yahoo do *not* automatically add the `'-- '` to signatures, so you have to add it yourself.

* In Firefox and Thunderbird, the "Markdown Toggle" menu item shows up for more element types than it can correctly render. This is intended to help people realize that they're not using a rich editor. Otherwise they just don't see the menu item and don't know why.
  * In Chrome, I can't figure out how to selectively hide the menu item, so the behaviour isn't entirely intentional. But it would be basically the same even if I could.

* Styling:
  * The use of browser-specific styles (-moz-, -webkit-) should be avoided. If used, they may not render correctly for people reading the email in a different browser from the one where the email was sent.
  * Do not use multi-word font names (e.g., "Andale Mono"). For some mysterious reason, they totally mess up styling.

## Building the Extension Bundles

"Building" is really just zipping. Create all archives relative to the `src` directory.

### Chrome extension

Create a file with a `.zip` extension containing these files and directories:

```
manifest.json
common/
chrome/
```

### Firefox/Thunderbird extension

Create a file with a `.xpi` extension containing these files and directories:

```
chrome.manifest
install.rdf
common/
firefox/
```

## Next Steps

* Add user option to create custom CSS.

* Figure out how to prevent users from losing modifications to the rendered version when they revert.
  * Prompted by [this Reddit comment](http://www.reddit.com/r/programming/comments/uagqd/write_email_in_markdown_then_make_it_pretty/c4u6cpv).
  * Maybe add an option to make rendered mode read-only. If a user edits the rendered text and then reverts, they lose their changes, which is pretty bad. Better to not let the user make changes at all (optionally).
    * Is it possible to do that? In Thunderbird as well?
  * Maybe convert the HTML back to Markdown. (Like, actually convert it -- don't just use the stashed original Markdown.)
    * [to-markdown](https://github.com/domchristie/to-markdown) will probably be useful.

* Test cases.

* Add a configurable hotkey.

* Add user option to specify Markdown dialect?

* Briefly highlight rendered and reverted blocks/ranges.
  * Probably use [CSS transitions](https://developer.mozilla.org/en/CSS/CSS_transitions).

* Add a visual cue as to what action took place. Sometimes converts and reverts may be a little surprising if the user's selection is off. And sometimes their viewport won't show the entirety of what change occurred.

* When Thunderbird sends and displays, it leaves the `md-data-original` attribute (which contains the original Markdown) intact. We could provide the user the ability to extract this. (I know at least one person who wants this.)

* Internationalization

* Fix inconsistent behaviour: Sometimes a converted/reverted block ends up selected, and sometimes not.

* Make email signature conversion exclusion optional. (Maybe some people will make a special one to convert.)

## Credits

*Markdown Here* was coded on the shoulders of giants.

* Based on the Chrome extension pattern described in [antimatter15 / hideelements](https://github.com/antimatter15/hideelements).
* Markdown-to-HTML: [chjj / marked](https://github.com/chjj/marked)
* HTML-to-text: [mtrimpe / jsHtmlToText](https://github.com/mtrimpe/jsHtmlToText)
* Syntax highlighting: [isagalaev / highlight.js](https://github.com/isagalaev/highlight.js)
* Icons by [dunedel via IconArchive](http://www.iconarchive.com/show/kaori-icons-by-dunedhel/Other-Butterfly-icon.html) (CC BY-NC-ND 3.0)

### Other stuff not used, but to keep an eye on

* Markdown-to-HTML:
  * [evilstreak / markdown-js](https://github.com/evilstreak/markdown-js) (There's currently a GFM dialect that seems almost finished. See [issue #41](https://github.com/evilstreak/markdown-js/issues/41).)
  * [Pagedown](https://code.google.com/p/pagedown/)
  * [isaacs / github-flavored-markdown](https://github.com/isaacs/github-flavored-markdown) (A Showdown derivative)
  * [Showdown](https://github.com/coreyti/showdown)

* CSS:
  * [Mou.app](http://mouapp.com/)'s CSS looks pretty good. It can be found [here](https://github.com/borismus/markdown-preview/issues/16). I'm hesitant to use it because Mou isn't FOSS.
  * This [Github theme for Mou](https://github.com/gcollazo/mou-theme-github2) might be good, though.

* HTML-to-Markdown
  * [domchristie / to-markdown](https://github.com/domchristie/to-markdown)

## Feedback

All bugs, feature requests, pull requests, feedback, etc., are welcome.

## License

http://adampritchard.mit-license.org/
