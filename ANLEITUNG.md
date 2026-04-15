# Modellbau Weibel – Anleitung zur Inhaltspflege

## Übersicht

Die Website ist so aufgebaut, dass du neue Projekte und Produkte ganz einfach hinzufügen kannst – ohne Programmierkenntnisse. Du musst nur zwei Dinge tun:

1. **Bilder** in den richtigen Ordner kopieren
2. **JSON-Datei** bearbeiten (einfache Textdatei)

---

## Neues Projekt hinzufügen

### Schritt 1: Bilder vorbereiten

1. Erstelle einen neuen Ordner in `images/projekte/` mit dem Projektnamen (Kleinbuchstaben, Bindestriche statt Leerzeichen)
   - Beispiel: `images/projekte/mein-neues-modell/`
2. Kopiere deine Bilder in diesen Ordner
   - Benenne sie z.B. `01.jpg`, `02.jpg`, `03.jpg` usw.
   - Das erste Bild (`01.jpg`) wird als Titelbild verwendet

### Schritt 2: Projekt in die Datenliste eintragen

Öffne die Datei `data/projekte.json` mit einem Texteditor (z.B. Notepad, TextEdit).

Füge am Ende der Liste (vor der letzten `]` Klammer) einen neuen Block hinzu:

```json
  ,
  {
    "id": "mein-neues-modell",
    "name": "Mein Neues Modell",
    "massstab": "1:8",
    "kurzbeschreibung": "Kurze Beschreibung für die Übersicht",
    "beschreibung": "Ausführliche Beschreibung des Projekts. Hier kannst du mehr Details schreiben.",
    "spannweite": "1200 mm",
    "laenge": "900 mm",
    "gewicht": "2500 g",
    "antrieb": "Brushless Motor, 4S 3000 mAh",
    "bilder": [
      "images/projekte/mein-neues-modell/01.jpg",
      "images/projekte/mein-neues-modell/02.jpg",
      "images/projekte/mein-neues-modell/03.jpg"
    ],
    "titelbild": "images/projekte/mein-neues-modell/01.jpg",
    "status": "In Arbeit",
    "jahr": 2026
  }
```

**Wichtig:**
- Vergiss das Komma `,` vor dem `{` nicht (ausser es ist der erste Eintrag)
- Alle Texte in Anführungszeichen `"` schreiben
- Felder die du nicht brauchst einfach leer lassen: `"gewicht": ""`

---

## Neues Produkt hinzufügen

### Schritt 1: Bilder vorbereiten

Kopiere Produktbilder in den Ordner `images/produkte/`
- Beispiel: `images/produkte/mein-bausatz-01.jpg`

### Schritt 2: Produkt in die Datenliste eintragen

Öffne die Datei `data/produkte.json` und füge einen neuen Block hinzu:

```json
  ,
  {
    "id": "mein-bausatz",
    "name": "Mein Modell – CNC-Holzbaukasten",
    "kurzbeschreibung": "Kurze Beschreibung des Produkts",
    "beschreibung": "Ausführliche Beschreibung was alles im Bausatz enthalten ist.",
    "kategorie": "Bausatz",
    "preis": "CHF 250.–",
    "inhalt": [
      "CNC-gefräste Holzteile",
      "Kleinteile",
      "Baupläne"
    ],
    "bilder": [
      "images/produkte/mein-bausatz-01.jpg"
    ],
    "titelbild": "images/produkte/mein-bausatz-01.jpg",
    "verfuegbar": true
  }
```

**Kategorie** kann sein: `"Bausatz"` oder `"Bauplan"`

**Verfügbar**: `true` = Auf Lager, `false` = Nicht verfügbar

---

## Bilder ersetzen

Die Platzhalter-Bilder auf der Website können einfach ersetzt werden:

1. **About-Bild** (Startseite): Ersetze `images/about.jpg`
2. **Projektbilder**: Lege Fotos in den jeweiligen Ordner unter `images/projekte/`
3. **Produktbilder**: Lege Fotos in `images/produkte/`

**Empfohlene Bildgrössen:**
- Projektbilder: mindestens 1200 x 800 Pixel
- Produktbilder: mindestens 1200 x 800 Pixel
- About-Bild: mindestens 800 x 600 Pixel
- Format: JPG (für Fotos), PNG (für Grafiken)

---

## Ordnerstruktur

```
modellbauweibel/
├── index.html          ← Startseite
├── projekte.html       ← Projektübersicht
├── shop.html           ← Bausätze & Baupläne
├── kontakt.html        ← Kontaktseite
├── css/
│   └── style.css       ← Design (nicht ändern)
├── js/
│   └── app.js          ← Funktionen (nicht ändern)
├── data/
│   ├── projekte.json   ← ★ HIER Projekte bearbeiten
│   └── produkte.json   ← ★ HIER Produkte bearbeiten
└── images/
    ├── about.jpg        ← Bild für "Über mich"
    ├── projekte/        ← Projektbilder
    │   ├── f20-tigershark/
    │   ├── swift-s1/
    │   ├── pilatus-pc9/
    │   ├── sr-falcon/
    │   └── hai-3/
    └── produkte/        ← Produktbilder
```

---

## Kontaktdaten ändern

Die Kontaktdaten stehen in der Datei `js/app.js` in der Funktion `renderFooter()`. 
Suche nach den folgenden Zeilen und ändere sie:

```
Martin Weibel
Bachelstrasse 61
Lohnstorf, Schweiz
Tel: 031 809 34 77
modellbau-weibel@bluewin.ch
```

Auch auf der Kontaktseite (`kontakt.html`) müssen die Daten angepasst werden.

---

## Tipps

- Teste Änderungen immer zuerst lokal im Browser (einfach `index.html` doppelklicken)
- Mache vor Änderungen eine Sicherheitskopie der JSON-Dateien
- Bei Problemen: Prüfe ob alle Anführungszeichen `"` und Kommas `,` korrekt gesetzt sind
- Ein guter Online-JSON-Prüfer: jsonlint.com
