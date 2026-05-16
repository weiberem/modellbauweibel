# Modellbau Weibel – Anleitung

## Server starten

```bash
npm install       # Einmalig: Abhängigkeiten installieren
npm start         # Server starten auf http://localhost:3000
```

## Admin-Bereich

Gehe zu **http://localhost:3000/admin/** und logge dich ein:

- **Benutzer:** `admin`
- **Passwort:** `modellbau2024`

> Bitte ändere das Passwort nach dem ersten Login unter Dashboard → Passwort ändern.

### Neues Projekt erstellen

1. Im Admin unter **Projekte** → **+ Neues Projekt**
2. Formular ausfüllen:
   - Name (z.B. "F-18 Hornet")
   - Massstab (z.B. "1:5")
   - Beschreibung, Technische Daten
   - **Verfügbarkeit**: Einzelstück / Bausatz / Bauplan / Bausatz+Bauplan
   - Status: In Arbeit / Abgeschlossen / Geplant
3. Speichern → Bilder hochladen (Drag & Drop oder klicken)
4. Titelbild setzen: Auf ein Bild hovern → "Titelbild" klicken

### Neues Produkt im Shop erstellen

1. Im Admin unter **Produkte / Shop** → **+ Neues Produkt**
2. Formular ausfüllen:
   - Name, Beschreibung, Kategorie
   - **Preis** in CHF
   - **Lagerbestand** (wird bei Bestellung automatisch reduziert)
   - Lieferumfang (ein Punkt pro Zeile)
3. Speichern → Bilder hochladen

### Bestellungen verwalten

Unter **Bestellungen** siehst du alle eingegangenen Bestellungen mit:
- Kundendaten, Positionen, Total
- Status ändern: Neu → Bearbeitung → Versendet / Storniert

## Webshop für Kunden

Kunden können ohne Login:
1. Im **Shop** Produkte durchsuchen und in den **Warenkorb** legen
2. Im **Warenkorb** die Bestellung abschliessen
3. Zahlung über **PayPal** oder **Kreditkarte**

## PayPal einrichten (WICHTIG für Live-Betrieb)

Die PayPal-Integration nutzt aktuell den **Sandbox-Modus** (Testmodus).

Für echte Zahlungen:

1. Erstelle ein PayPal Business-Konto auf [developer.paypal.com](https://developer.paypal.com)
2. Erstelle eine **App** und kopiere die **Client-ID**
3. In der Datei `public/warenkorb.html`, ersetze in der PayPal-Script-Zeile:
   ```
   client-id=sb
   ```
   durch:
   ```
   client-id=DEINE_ECHTE_CLIENT_ID
   ```

## Ordnerstruktur

```
modellbauweibel/
├── server.js           # Express-Server
├── db.js               # Datenbank (SQLite)
├── package.json        # Abhängigkeiten
├── routes/
│   ├── api.js          # Öffentliche API (Projekte, Produkte, Bestellungen)
│   └── admin.js        # Admin-API (CRUD, Bildupload, Auth)
├── public/             # Statische Website-Dateien
│   ├── index.html      # Startseite
│   ├── projekte.html   # Projektübersicht
│   ├── shop.html       # Webshop
│   ├── warenkorb.html  # Warenkorb & Checkout
│   ├── kontakt.html    # Kontaktseite
│   ├── css/
│   │   ├── style.css   # Website-Design
│   │   └── admin.css   # Admin-Design
│   ├── js/
│   │   ├── app.js      # Hauptlogik (Navigation, etc.)
│   │   └── shop.js     # Warenkorb-Logik
│   └── admin/          # Admin-Panel
│       ├── login.html
│       ├── index.html
│       ├── projekte.html
│       ├── produkte.html
│       └── bestellungen.html
├── uploads/            # Hochgeladene Bilder
│   ├── projekte/
│   └── produkte/
└── data/
    └── modellbau.db    # SQLite-Datenbank (wird automatisch erstellt)
```
