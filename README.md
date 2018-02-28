# ![Markdown Here logo](https://raw.github.com/adam-p/markdown-here/master/src/common/images/icon48.png) Markdown Here

[**bezoek de website.**](http://markdown-here.com)<br>
[**Download link voor Chrome.**](https://chrome.google.com/webstore/detail/elifhakcjgalahccnjkneoccemfahfoa)<br>
[**Download link voor Firefox.**](https://addons.mozilla.org/en-US/firefox/addon/markdown-here/)<br>
[**Download link voor Safari.**](https://s3.amazonaws.com/markdown-here/markdown-here.safariextz)<br>
[**Download link voor Thunderbird en Postbox.**](https://addons.mozilla.org/en-US/thunderbird/addon/markdown-here/)<br>
[**Download link voor Opera.**](https://addons.opera.com/en/extensions/details/markdown-here/)<br>
[**Voer discussies en stel vragen in de Google Groep.**](https://groups.google.com/forum/?fromgroups#!forum/markdown-here/)<br>

*Markdown Here* is een Google Chrome, Firefox, Safari, Opera, and Thunderbird extensie die jou email laat schrijven<sup>&dagger;</sup> in Markdown<sup>&Dagger;</sup> en een voorbeeld weergeeft voordat je deze verzendt. Het ondersteunt ook het accentueren van zinnen.(Hiervoor hoef je alleen je taal op te geven in een codeblok, die als zodanig herkend wordt als u een hekje plaatst aan het begin en het eind).

Het schrijven van email met code erin verwerkt is best wel vervelend. Markdown schrijven met code erin is vrij eenvoudig. Ik merkte dat ik zelf email schreef in Markdown in de Github in-browser bewerker, om deze vervolgens te kopieren naar mijn email. Dit is een vrij omslachtige manier, dus besloot ik een hulpmiddel te ontwikkelen om Markdown rechtstreeks in de email weer te geven.

Om te zien welke mogelijkheden er allemaal zijn met *Markdown Here*, kijk je hier [Markdown Here Cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Here-Cheatsheet) en op de andere wiki pagina's [wiki pages](https://github.com/adam-p/markdown-here/wiki).

<sup>&dagger;: En Google Groepsberichten, en Blogberichten, en Evernote notities, en Wordpress berichten! [Zie meer](#compatibility).</sup><br>
<sup>&Dagger;: En TeX mathematica formules!</sup>

![schermafbeelding van conversie](https://raw.github.com/adam-p/markdown-here/master/store-assets/markdown-here-image1.gimp.png)

### Inhoudsopgave
**[Installatie Handleiding](#installation-instructions)**<br>
**[Gebruikers Handleiding](#usage-instructions)**<br>
**[Probleemoplossing](#troubleshooting)**<br>
**[Compatibiliteit](#compatibility)**<br>
**[Aantekeningen en Diversen](#notes-and-miscellaneous)**<br>
**[Uitbreidingsbundels Bouwen](#building-the-extension-bundles)**<br>
**[Volgende stappen, Credits, Feedback, Licensies](#next-steps)**<br>

## Installatie Handleiding

### Chrome

#### Chrome Webwinkel

Ga naar de [Chrome Webwinkel pagina voor *Markdown Here*](https://chrome.google.com/webstore/detail/elifhakcjgalahccnjkneoccemfahfoa) en voer een normale installatie uit.

Na het installeren, wees er zeker van dat je jouw webmail opnieuw laadt óf Chrome herstart!

#### Handmatig/Ontwikkeling

1. Kloon deze repo.
2. In Chrome, open de Extensies in instellingen. (knop met sleutel-icoon, Gereedschappen, Extensies).
3. In de instellingen pagina voor Extensies, klik op het vakje naast "Ontwikkelaarsmodus" zodat deze aangevinkt staat.
4. Klik op de "Laad uitgepakte extensie…" knop. Navigeer naar de directory waar jouw gekloonde repo staat, ga naar de `src` directory die daar weer onder staat.
5. De *Markdown Here* extensie zou nu zichtbaar moeten zijn in jouw lijst met extensies.
6. Herlaadt nu jouw webmail pagina (en eventueel de applicatie) alvorens je gaat proberen een email om te zetten.

### Firefox and Thunderbird

#### Mozilla Add-ons site

Ga naar de [Firefox Add-ons pagina voor *Markdown Here*](https://addons.mozilla.org/en-US/firefox/addon/markdown-here/) voer een normale installatie uit.

Of ga naar "Tools > Add-ons" menu en zoek dan naar "Markdown Here".

Na het installeren, zorg ervoor dat je Firefox/thunderbird herstart!

**Aantekening:** Het duurt tot maximaal een maand voordat Mozilla wijzigingen in de Mozilla/Thunderbird extensie goedkeurt, dus updates (functies, reparaties) zullen achterlopen op wat hier wordt weergegeven. U kunt handmatig kiezen om de nieuwste versie te installeren, nog voordat deze is beoordeeld vanuit de lijst met verschillende versies: [https://addons.mozilla.org/en-US/firefox/addon/markdown-here/versions/](https://addons.mozilla.org/en-US/firefox/addon/markdown-here/versions/)

#### Handmatig/Ontwikkeling

1. Kloon deze Repo.
2. Volg de instructies in het MDN ["Setting up an extension development environment"](https://developer.mozilla.org/en/Setting_up_extension_development_environment) artikel.

### Safari

[Download de extensie rechtstreeks.](https://s3.amazonaws.com/markdown-here/markdown-here.safariextz) Als de dowload compleet is, klik tweemaal om te installeren.

#### Voorkeuren

Om jouw Markdown voorkeuren op te geven, open uw Safari voorkeuren en ga naar de "Extensies" tab. Dan klik je op het "Klik hier om de Markdown Here opties weer te geven" hokje.

### Opera

Onthoud dat *Markdown Here* alleen werkt met Opera versies 16 en hoger (d.w.z. degenen die gebaseerd zijn op Chromium).

Ga naar de [Opera Add-ons winkel pagina voor *Markdown Here*](https://addons.opera.com/en/extensions/details/markdown-here/) en voer normale installatie uit.

Na het installeren, zorg ervoor dat u uw webmail herlaadt of Chrome herstart!

## Gebruikers Handleiding

Installeer het, en dan...

1. In Chrome/Safari/Opera, *zorg ervoor* dat u uw webmail herlaadt, voordat u Markdown Here probeert te gebruiken.
2. In Chrome/Firefox/Safari/Opera, log in op uw Gmail, Hotmail, of Yahoo account en start een nieuwe email. Als u gebruik maakt van Thunderbird, start u een nieuw bericht.
3. Zorg ervoor dat u de rich editor gebruikt.
   * In Gmail, klik op de "Rich formatting" (Rijk opmaken) link, als deze zichtbaar is. 
   * In Thunderbird, Zorg ervoor dat "Berichten opmaken in HTML formaat" is geactiveerd in uw "Account Instellingen", in het deelvenster "Compositie & Adressering".
4. Stel een email op in Markdown. Als voorbeeld:

   <pre>
   **Hello** `world`.

   ```javascript
   alert('Hello syntax highlighting.');
   ```
   </pre>

5. Klik met de rechtermuisknop op de compose-box en kies het item "Markdown Toggle" in het contextmenu. Of klik op de knop die verschijnt in uw adresbar. Of gebruik de sneltoets (<kbd>CTRL</kbd>+<kbd>ALT</kbd>+<kbd>M</kbd> als standaard).
6. U zou uw email in de juiste weergave moeten zien veranderen van Markdown naar rich HTML.
7. Verzend uw email naar iedereen die u kent. Het zal er bij hun precies hetzelfde uitzien zoals het er voor u uitziet.

### Terugkeren naar Markdown

Na het weergeven van uw Markdown naar het fraaie HTML, kunt u nog steeds terugkeren naar uw originele Markdown. Als u met uw rechtermuisknop ergens in de nieuw weergegeven Markdown klikt en dan op "Markdown Toggle" -- Uw email bewerkingsscherm keert terug naar de Markdown die u heeft geschreven.

Houdt u er rekening mee dat wijzigingen die u aanbrengt aan het fraaie HTML verloren gaan wanneer u terugkeert naar Markdown.

In Gmail, kunt u ook het commando ongedaan maken vanuit de browser gebruiken (<kbd>CTRL</kbd>+<kbd>Z</kbd> / <kbd>CMD</kbd>+<kbd>Z</kbd>, of vanuit het wijzigings menu). Houdt u er rekening mee dat u hierdoor ook de laatste paar karakters die u heeft ingevoerd kunt verliezen.

### Antwoorden

In Gmail, Thunderbird, en Google Groepen, kunt u "Markdown Toggle" gewoon gebruiken: schrijf gewoon uw antwoord (bovenaan, onderin, op dezelfde plaats, waar dan ook) en daarna kunt u deze omzetten. De originele email waar u op reageert blijft ongewijzigd. (Technisch bekeken: bestaande `blockquote` blokken zullen intact worden gelaten).

In Hotmail en Yahoo (die het originele bericht niet in een `blockquote` plaatsen), en optioneel in Gmail, Thunderbird, en Google Groepen, bent u er altijd zeker van dat alleen het deel van uw antwoord dat u geschreven heeft zal worden omgezet, door te selecteren wat u wilt omzetten waarna u "Markdown Toggle" aanklikt -- zie de volgende paragraaf.

### Selectie/Gedeeltelijk Omzetten

Soms wilt u niet een gehele mail omzetten; in sommige gevallen is niet uw gehele email Markdown. Om een gedeelte van een email om te zetten, selecteert u een gedeelte van de email, selecteer de tekst (met uw muis of keyboard), klik met de rechtermuisknop op uw selectie, en klik op het "Markdown Toggle" item in het menu. Uw selectie wordt op magische wijze weergegeven in het prachtige HTML.

Om terug te keren naar Markdown, plaatst u uw cursor ergens in het blok van de omgezette tekst, klik rechts, en klik wederom op het "Markdown Toggle" item in het menu. To revert back to Markdown, just put your cursor anywhere in the block of converted text, right click, and click the "Markdown Toggle" menu item again. Nu zal de weergave op magische wijze terugkeren naar het originele Markdown.

![schermafbeelding van selectie omzetten](https://raw.github.com/adam-p/markdown-here/master/store-assets/markdown-here-image2.gimp.png)

#### Wat u moet weten over het omzetten/terugzetten van een selectie

* Wanneer u alleen een gedeelte van een blok of tekst selecteert, zal alleen die tekst worden omgezet. Het omgezette blok zal in een alinea- element worden gewikkeld, zodat de originele regel zal worden verbroken. U zult dit waarschijnlijk nooit willen doen.

* U kunt meerdere blokken tegelijk selecteren en terugzetten. Een voordeel hiervan is dat wanneer u de gehele email selecteert, "Markdown Toggle" aanklikt, alle delen die u had omgezet zullen worden teruggezet.

* Als u niets heeft geselecteerd wanneer u op "Markdown Toggle" klikt, zal *Markdown Here* controleren of ergens in het bericht omgezette blokken zijn en deze terugzetten. Als er geen omgezette blokken worden gevonden, zal de hele email worden omgezet.

### Opties

De *Markdown Here* Opties pagina kan worden bereikt via de Chrome, Firefox, Safari, or Thunderbird lijst met extensies. De beschikbare opties zijn:

* Stylingswijzigingen voor de omgezette Markdown.
* Zinnen accentueren voor selecteren van thema's en wijzigingen.
* TeX wiskundige formules verwerken inschakelen en aanpassen.
* Wat de sneltoets zou moeten zijn.

Voor Chrome en Firefox, zullen alle wijzigingen die gedaan worden in de *Markdown Here* Opties automatisch gesynchroniseerd tussen uw andere installaties van die browser (als u de sync optie van uw browser geactiveerd heeft).

![schermafbeelding van opties](https://raw.githubusercontent.com/adam-p/markdown-here/master/store-assets/markdown-here-chrome-options-1.gimp.png)


## Probleemoplossing

Zie de [Probleemoplossing wiki pagina](https://github.com/adam-p/markdown-here/wiki/Troubleshooting).


## Compatibiliteit

See the [Compatibiliteit wiki pagina](https://github.com/adam-p/markdown-here/wiki/Compatibility).


## Aantekeningen en Diversen

* *Markdown Here* maakt gebruik van [Github Flavored Markdown](http://github.github.com/github-flavored-markdown/), met de beperking dat speciale GFM links niet worden ondersteund ([issue #11](https://github.com/adam-p/markdown-here/issues/11)); niet ondersteund zullen gaan worden, aangezien MDH niet Github-specifiek is.

* Beschikbare talen voor het markeren van tekstdelen (en de manier waarop ze moeten worden geschreven in het omheinde codeblok) kan worden bekeken op de [markeren.js demo pagina](http://softwaremaniacs.org/media/soft/highlight/test.html).

* Afbeeldingen die in jouw Markdown verwerkt zitten, zullen worden behouden wanneer je "Markdown Toggle"gebruikt. Gmail staat toe dat afbeeldingen rechtstreeks aan een email worden toegevoegd -- dit kan veel makkelijker zijn dan te refereren naar een externe afbeelding.

* Email handtekeningen zijn automatisch uitgesloten van omzetting. Specifieker, alles na de semi- standaard `'-- '` (let op de achterliggende ruimte) zal alleen worden gelaten.
  * Let goed op met Hotmail en Yahoo die *niet* automatisch `'-- '` toevoegen aan handtekeningen, dus zal je dit zelf toe moeten voegen.

* Het "Markdown Toggle" menu item bevat meer soorten elementen dan het kan weergeven. Dit is bewust gedaan als hulp om mensen zich te laten realiseren dat ze geen rijke tekst editor gebruiken. Anders zien ze het menu item gewoonweg niet en zulen ze niet weten waarom.

* Styling:
  * Het gebruik van browser- specifieke stijlen (-moz-, -webkit-) moeten worden vermeden. Bij gebruik hiervan, kunnen emails mogelijk niet juist worden weergegeven voor mensen die de email lezen in een andere browser dan degene van waaruit de email werd verzonden.
  * Het gebruik van situatie- afhankelijke stijlen (zoals `a:hover`) werken niet, als ze niet overeenkomen met de tijd waarop de stijlen expliciet zijn ingesteld. (In emails, moeten stijlen expliciet op alle elementen worden toegepast -- styles must be explicitly applied to all elements -- stijlsheets worden gestript.)

* Voor meer tricky functies, bezoek de [Tips en Tricks](https://github.com/adam-p/markdown-here/wiki/Tips-and-Tricks) sectie.

## Uitbreidings Bundels bouwen

"Bouwen" is echt net als zippen. Maak alle archieven gerelateerd aan de 'src' directory.

Voordat je gaat zippen, verwijdert u de `src/common/test` map. Hiermee wordt voorkomen dat de autotests in de release terechtkomen.

Een belangrijke voorbereidende stap is het verwijderen van eventuele door het systeem gegenereerde verborgen bestanden die niet in het releasebestand zouden moeten worden opgenomen (zoals Windows' `desktop.ini` en OS X's `.DS_Store`, enz.). Dit shell commando zal deze ongewilde bestanden verwijderen:

```
find . -name "desktop.ini" -or -name ".*" -and -not -name "." -and -not -name ".git*" -print0 | xargs -0 rm -rf
```

### Chrome and Opera extensie

Maak een bestand met een `.zip` extensie die de volgende bestanden en mappen bevat:

```
manifest.json
common/
chrome/
```

### Firefox/Thunderbird extensie

Maak een bestand met een `.xpi` extensie die de volgende bestanden en mappen bevat:

```
chrome.manifest
install.rdf
common/
firefox/
```

### Safari extensie

De browser- specifieke code is gelocaliseerd in het [`markdown-here-safari`](https://github.com/adam-p/markdown-here-safari) project.

Gebruik de Safari Extensie Bouwer.

## Volgende Stappen

Zie de [lijst met kwesties](https://github.com/adam-p/markdown-here/issues) en de [Aantekeningen wiki](https://github.com/adam-p/markdown-here/wiki/Development-Notes). Alle ideeën, fouten, plannen, klachten en dromen zullen eindigen in een van deze twee plekken.

Voel je vrij om een toekomstig wijzigingsverzoek in te dienen als hetgeen je wilt er nog niet is. Feel free to create a feature request issue if what you want isn't already there. Als u de voorkeur geeft aan een minder formele benadering voor het indienen van een idee, stuur je een bericht naar ["markdown-here" Google Groep](https://groups.google.com/forum/?fromgroups=#!forum/markdown-here).

Het is eerlijk gezegd ook best wat werk om up-to-date te blijven met de laatste wijzigingen in alle applicaties en web sites waar Markdown Here werkt.

## Credits

*Markdown Here* is gecodeerd op de schouders van reuzen.

* Markdown-to-HTML: [chjj / marked](https://github.com/chjj/marked)
* Syntax highlighting: [isagalaev / highlight.js](https://github.com/isagalaev/highlight.js)
* HTML-to-text: [mtrimpe / jsHtmlToText](https://github.com/mtrimpe/jsHtmlToText)

## Feedback

Alle fouten, toekomstige aanvragen, pull aanvragen, feedback, enz., zijn welkom. [Create an issue](https://github.com/adam-p/markdown-here/issues). Of [post to the "markdown-here" Google Group](https://groups.google.com/forum/?fromgroups=#!forum/markdown-here).

## License

### Code

MIT License: http://adampritchard.mit-license.org/ or see [the `LICENSE` file](https://github.com/adam-p/markdown-here/blob/master/LICENSE).

### Logo

Copyright 2015, [Austin Anderson](http://protractor.ninja/). Licensed to Markdown Here under the [MDH contributor license agreement](https://github.com/adam-p/markdown-here/blob/master/CLA-individual.md).

### Other images

[Creative Commons Attribution 3.0 Unported (CC BY 3.0) License](http://creativecommons.org/licenses/by/3.0/)

---

![Dos Equis man says](https://raw.github.com/adam-p/markdown-here/master/store-assets/dos-equis-MDH.jpg)
