# ![Markdown Here logo](https://raw.github.com/adam-p/markdown-here/master/src/common/images/icon48.png) Markdown Here

[**Visit the website.**](http://markdown-here.com)<br>
[**Get it for Chrome.**](https://chrome.google.com/webstore/detail/elifhakcjgalahccnjkneoccemfahfoa)<br>
[**Get it for Firefox.**](https://addons.mozilla.org/en-US/firefox/addon/markdown-here/)<br>
[**Get it for Safari.**](https://s3.amazonaws.com/markdown-here/markdown-here.safariextz)<br>
[**Get it for Thunderbird and Postbox.**](https://addons.mozilla.org/en-US/thunderbird/addon/markdown-here/)<br>
[**Get it for Opera.**](https://addons.opera.com/en/extensions/details/markdown-here/)<br>
[**Discuss it and ask questions in the Google Group.**](https://groups.google.com/forum/?fromgroups#!forum/markdown-here/)<br>

*Markdown Here* is a Google Chrome, Firefox, Safari, Opera, and Thunderbird extension that lets you write email<sup>&dagger;</sup> in Markdown<sup>&Dagger;</sup> and render them before sending. It also supports syntax highlighting (just specify the language in a fenced code block).

Writing email with code in it is pretty tedious. Writing Markdown with code in it is easy. I found myself writing email in Markdown in the Github in-browser editor, then copying the preview into email. This is a pretty absurd workflow, so I decided create a tool to write and render Markdown right in the email.

To discover what can be done with Markdown in *Markdown Here*, check out the [Markdown Here Cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Here-Cheatsheet) and the other [wiki pages](https://github.com/adam-p/markdown-here/wiki).

<sup>&dagger;: And Google Groups posts, and Blogger posts, and Evernote notes, and Wordpress posts! [See more](#compatibility).</sup><br>
<sup>&Dagger;: And TeX mathematical formulae!</sup>

![screenshot of conversion](https://raw.github.com/adam-p/markdown-here/master/store-assets/markdown-here-image1.gimp.png)

### Table of Contents
**[Installation Instructions](#installation-instructions)**<br>
**[Usage Instructions](#usage-instructions)**<br>
**[Troubleshooting](#troubleshooting)**<br>
**[Compatibility](#compatibility)**<br>
**[Notes and Miscellaneous](#notes-and-miscellaneous)**<br>
**[Building the Extension Bundles](#building-the-extension-bundles)**<br>
**[Next Steps, Credits, Feedback, License](#next-steps)**<br>

## Installation Instructions

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

Go to the [Firefox Add-ons page for *Markdown Here*](https://addons.mozilla.org/en-US/firefox/addon/markdown-here/) and install normally.

Or go to the "Tools > Add-ons" menu and then search for "Markdown Here".

After installing, make sure to restart Firefox/Thunderbird!

**Note:** It takes up to a month for Mozilla to approve changes to the Firefox/Thunderbird extension, so updates (features, fixes) will lag behind what is shown here. You can manually choose to install the newest version before it's reviewed from the list of versions: [https://addons.mozilla.org/en-US/firefox/addon/markdown-here/versions/](https://addons.mozilla.org/en-US/firefox/addon/markdown-here/versions/)

#### Manual/Development

1. Clone this repo.
2. Follow the instructions in the MDN ["Setting up an extension development environment"](https://developer.mozilla.org/en/Setting_up_extension_development_environment) article.

### Safari

[Download the extension directly.](https://s3.amazonaws.com/markdown-here/markdown-here.safariextz) When it has finished downloading, double click it to install.

#### Preferences

To get to the Markdown Here preferences, open the Safari preferences and then go to the "Extensions" tab. Then click the "Click me to show Markdown Here options" box.

### Opera

Note that *Markdown Here* only works with Opera versions 16 and higher (i.e., the ones that are based on Chromium).

Go to the [Opera Add-ons store page for *Markdown Here*](https://addons.opera.com/en/extensions/details/markdown-here/) and install normally.

After installing, make sure to reload your webmail or restart Chrome!

## Usage Instructions

Install it, and then…

1. In Chrome/Safari/Opera, *make sure* you reload your web mail page before trying to use Markdown Here.
2. In Chrome/Firefox/Safari/Opera, log into your Gmail, Hotmail, or Yahoo account and start a new email. In Thunderbird, start a new message.
3. Make sure you're using the rich editor.
   * In Gmail, click the "Rich formatting" link, if it's visible.
   * In Thunderbird, make sure "Compose messages in HTML format" is enabled in your "Account Settings", "Composition & Addressing" pane.
4. Compose an email in Markdown. For example:

   <pre>
   **Hello** `world`.

   ```javascript
   alert('Hello syntax highlighting.');
   ```
   </pre>

5. Right-click in the compose box and choose the "Markdown Toggle" item from the context menu. Or click the button that appears in your address bar. Or use the hotkey (<kbd>CTRL</kbd>+<kbd>ALT</kbd>+<kbd>M</kbd> by default).
6. You should see your email rendered correctly from Markdown into rich HTML.
7. Send your awesome email to everyone you know. It will appear to them the same way it looks to you.

### Revert to Markdown

After rendering your Markdown to pretty HTML, you can still get back to your original Markdown. Just right-click anywhere in the newly rendered Markdown and click "Markdown Toggle" -- your email compose body will change back to the Markdown you had written.

Note that any changes you make to the pretty HTML will be lost when you revert to Markdown.

In Gmail, you can also use the browser's Undo command (<kbd>CTRL</kbd>+<kbd>Z</kbd> / <kbd>CMD</kbd>+<kbd>Z</kbd>, or from the Edit menu). Be warned that you might also lose the last few characters you entered.

### Replies

In Gmail, Thunderbird, and Google Groups, you can use "Markdown Toggle" normally: just write your reply (top, bottom, inline, wherever) and then convert. The original email that you're replying to will be left alone. (Technically: Existing `blockquote` blocks will be left intact.)

In Hotmail and Yahoo (which don't put the original in a `blockquote`), and optionally in Gmail, Thunderbird, and Google Groups, you can ensure that only the part of the reply that you wrote gets converted by selecting what you want to convert and then clicking "Markdown Toggle" -- see the next section.

### Selection/Piecemeal Conversion

Sometimes you don't want to convert the entire email; sometimes your email isn't entirely Markdown. To convert only part of the email, select the text (with your mouse or keyboard), right-click on it, and click the "Markdown Toggle" menu item. Your selection is magically rendered into pretty HTML.

To revert back to Markdown, just put your cursor anywhere in the block of converted text, right click, and click the "Markdown Toggle" menu item again. Now it's magically back to the original Markdown.

![screenshot of selection conversion](https://raw.github.com/adam-p/markdown-here/master/store-assets/markdown-here-image2.gimp.png)

#### Things to know about converting/reverting a selection

* If you select only part of a block of text, only that text will be converted. The converted block will be wrapped in a paragraph element, so the original line will be broken up. You probably don't want to ever do this.

* You can select and revert multiple converted blocks at the same time. One upshot of this is that you can select your entire email, click "Markdown Toggle", and all portions of it that you had converted will be reverted.

* If you don't have anything selected when you click "Markdown Toggle", *Markdown Here* will check if there are converted blocks anywhere in the message and revert them. If there no converted blocks are found, it will convert the entire email.

### Options

The *Markdown Here* Options page can be accessed via the Chrome, Firefox, Safari, or Thunderbird extensions list. The available options include:

* Styling modifications for the rendered Markdown.
* Syntax highlighting theme selection and modification.
* TeX math formulae processing enabling and customization.
* What the hotkey should be.

For Chrome and Firefox, any changes made in the *Markdown Here* Options are automatically synchronized between your other installations of that browser (if you have the sync feature enabled in the browser).

![screenshot of options](https://raw.githubusercontent.com/adam-p/markdown-here/master/store-assets/markdown-here-chrome-options-1.gimp.png)


## Troubleshooting

See the [Troubleshooting wiki page](https://github.com/adam-p/markdown-here/wiki/Troubleshooting).


## Compatibility

See the [Compatibility wiki page](https://github.com/adam-p/markdown-here/wiki/Compatibility).


## Notes and Miscellaneous

* *Markdown Here* uses [Github Flavored Markdown](http://github.github.com/github-flavored-markdown/), with the limitation that GFM special links are not supported ([issue #11](https://github.com/adam-p/markdown-here/issues/11)); nor will they be, as MDH is not Github-specific.

* Available languages for syntax highlighting (and the way they should be written in the fenced code block) can be seen on the [highlight.js demo page](http://softwaremaniacs.org/media/soft/highlight/test.html).

* Images embedded inline in your Markdown will be retained when you "Markdown Toggle". Gmail allows you to put images inline in your email -- this can be much easier than referencing an external image.

* Email signatures are automatically excluded from conversion. Specifically, anything after the semi-standard `'-- '` (note the trailing space) is left alone.
  * Note that Hotmail and Yahoo do *not* automatically add the `'-- '` to signatures, so you have to add it yourself.

* The "Markdown Toggle" menu item shows up for more element types than it can correctly render. This is intended to help people realize that they're not using a rich editor. Otherwise they just don't see the menu item and don't know why.

* Styling:
  * The use of browser-specific styles (-moz-, -webkit-) should be avoided. If used, they may not render correctly for people reading the email in a different browser from the one where the email was sent.
  * The use of state-dependent styles (like `a:hover`) don't work because they don't match at the time the styles are made explicit. (In email, styles must be explicitly applied to all elements -- stylesheets get stripped.)

* For more tweaky features, visit the [Tips and Tricks](https://github.com/adam-p/markdown-here/wiki/Tips-and-Tricks) section.

## Building the Extension Bundles

```
cd utils
node build.js
```


### Chrome and Opera extension

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

### Safari extension

The browser-specific code is located in the [`markdown-here-safari`](https://github.com/adam-p/markdown-here-safari) project.

Use the Safari Extension Builder.

## Next Steps

See the [issues list](https://github.com/adam-p/markdown-here/issues) and the [Notes Wiki](https://github.com/adam-p/markdown-here/wiki/Development-Notes). All ideas, bugs, plans, complaints, and dreams will end up in one of those two places.

Feel free to create a feature request issue if what you want isn't already there. If you'd prefer a less formal approach to floating an idea, post to the ["markdown-here" Google Group](https://groups.google.com/forum/?fromgroups=#!forum/markdown-here).

It also takes a fair bit of work to stay up-to-date with the latest changes in all the applications and web sites where Markdown Here works.

## Credits

*Markdown Here* was coded on the shoulders of giants.

* Markdown-to-HTML: [chjj / marked](https://github.com/chjj/marked)
* Syntax highlighting: [isagalaev / highlight.js](https://github.com/isagalaev/highlight.js)
* HTML-to-text: [mtrimpe / jsHtmlToText](https://github.com/mtrimpe/jsHtmlToText)

## Feedback

All bugs, feature requests, pull requests, feedback, etc., are welcome. [Create an issue](https://github.com/adam-p/markdown-here/issues). Or [post to the "markdown-here" Google Group](https://groups.google.com/forum/?fromgroups=#!forum/markdown-here).

## License

### Code

MIT License: http://adampritchard.mit-license.org/ or see [the `LICENSE` file](https://github.com/adam-p/markdown-here/blob/master/LICENSE).

### Logo

Copyright 2015, [Austin Anderson](http://protractor.ninja/). Licensed to Markdown Here under the [MDH contributor license agreement](https://github.com/adam-p/markdown-here/blob/master/CLA-individual.md).

### Other images

[Creative Commons Attribution 3.0 Unported (CC BY 3.0) License](http://creativecommons.org/licenses/by/3.0/)

---

![Dos Equis man says](https://raw.github.com/adam-p/markdown-here/master/store-assets/dos-equis-MDH.jpg)
