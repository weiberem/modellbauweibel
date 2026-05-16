const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data', 'modellbau.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projekte (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      massstab TEXT DEFAULT '',
      kurzbeschreibung TEXT DEFAULT '',
      beschreibung TEXT DEFAULT '',
      spannweite TEXT DEFAULT '',
      laenge TEXT DEFAULT '',
      gewicht TEXT DEFAULT '',
      antrieb TEXT DEFAULT '',
      status TEXT DEFAULT 'In Arbeit',
      verfuegbarkeit TEXT DEFAULT 'einzelstueck',
      jahr INTEGER,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projekt_bilder (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projekt_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      is_cover INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (projekt_id) REFERENCES projekte(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS produkte (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      kurzbeschreibung TEXT DEFAULT '',
      beschreibung TEXT DEFAULT '',
      kategorie TEXT DEFAULT 'Bausatz',
      preis REAL DEFAULT 0,
      lagerbestand INTEGER DEFAULT 0,
      ist_aktiv INTEGER DEFAULT 1,
      inhalt TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS produkt_bilder (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produkt_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      is_cover INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (produkt_id) REFERENCES produkte(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bestellungen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bestell_nr TEXT UNIQUE NOT NULL,
      kunde_name TEXT NOT NULL,
      kunde_email TEXT NOT NULL,
      kunde_adresse TEXT NOT NULL,
      kunde_plz TEXT DEFAULT '',
      kunde_ort TEXT DEFAULT '',
      kunde_telefon TEXT DEFAULT '',
      bemerkung TEXT DEFAULT '',
      total REAL DEFAULT 0,
      status TEXT DEFAULT 'Neu',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bestell_positionen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bestell_id INTEGER NOT NULL,
      produkt_id INTEGER NOT NULL,
      produkt_name TEXT NOT NULL,
      anzahl INTEGER NOT NULL,
      preis REAL NOT NULL,
      FOREIGN KEY (bestell_id) REFERENCES bestellungen(id) ON DELETE CASCADE,
      FOREIGN KEY (produkt_id) REFERENCES produkte(id)
    );
  `);

  // Seed admin user if none exists
  const adminCount = db.prepare('SELECT COUNT(*) as c FROM admin_users').get().c;
  if (adminCount === 0) {
    const hash = bcrypt.hashSync('modellbau2024', 10);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  }

  // Seed sample projects if empty
  const projektCount = db.prepare('SELECT COUNT(*) as c FROM projekte').get().c;
  if (projektCount === 0) {
    seedData();
  }
}

function seedData() {
  const insertProjekt = db.prepare(`
    INSERT INTO projekte (slug, name, massstab, kurzbeschreibung, beschreibung, spannweite, laenge, gewicht, antrieb, status, verfuegbarkeit, jahr, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const projects = [
    ['f20-tigershark', 'F-20 Tigershark', '1:11', 'EDF-Jet mit CNC-gefrästem Holzbaukasten',
     'Der F-20 Tigershark im Massstab 1:11 ist ein kompakter EDF-Jet, der vollständig aus einem CNC-gefrästen Holzbaukasten aufgebaut wird. Der Bau begann im Sommer 2014 und dauerte rund 1.5 Jahre. Angetrieben wird das Modell von einem Wemotec Mini Fan Evo mit einem 4S 3000–3300 mAh Akku.',
     '700 mm', '1300 mm', 'ab 1500 g', 'Wemotec Mini Fan Evo, 4S 3000–3300 mAh', 'Abgeschlossen', 'bausatz_bauplan', 2015, 1],
    ['swift-s1', 'Swift S1', '1:2', 'Grosssegler mit beeindruckender Spannweite',
     'Der Swift S1 im Massstab 1:2 ist ein imposanter Grosssegler mit einer Spannweite von 6.35 Metern. Das Modell ist eine detailgetreue Nachbildung des tschechischen Hochleistungs-Segelflugzeugs.',
     '6350 mm', '3200 mm', '', 'Segelflug / optional Elektro', 'Abgeschlossen', 'einzelstueck', 2016, 2],
    ['pilatus-pc9', 'Pilatus PC-9', '1:6.5', 'Schweizer Turboprop-Trainer als Elektromodell',
     'Die Pilatus PC-9 im Massstab 1:6.5 ist eine detailgetreue Nachbildung des legendären Schweizer Turboprop-Trainers. Angetrieben von einem Dualsky XM4255EA-6 Motor mit Fiala Electric E3 Propeller.',
     '1760 mm', '1350 mm', '', 'Dualsky XM4255EA-6, Fiala Electric E3 12x8", 5S 5000 mAh', 'Abgeschlossen', 'einzelstueck', 2017, 3],
    ['sr-falcon', 'SR Falcon', '', 'Eigenkonstruktion mit CNC-Bausatz',
     'Der SR Falcon ist eine weitere Eigenkonstruktion aus der Werkstatt von Martin Weibel. Seit Mai 2018 ist der CNC-Bausatz verfügbar.',
     '', '', '', '', 'Abgeschlossen', 'bausatz', 2018, 4],
    ['hai-3', 'Hai 3', '', 'Eleganter Segler in klassischer Holzbauweise',
     'Der Hai 3 ist ein elegantes Segelflugmodell in klassischer Holzbauweise. Mit ausgewogener Konstruktion und hervorragenden Thermikflugeigenschaften.',
     '3333 mm', '999 mm', '2500–3200 g', 'Segelflug / optional Elektro', 'Abgeschlossen', 'bauplan', 2014, 5]
  ];

  for (const p of projects) {
    insertProjekt.run(...p);
  }

  const insertProdukt = db.prepare(`
    INSERT INTO produkte (slug, name, kurzbeschreibung, beschreibung, kategorie, preis, lagerbestand, ist_aktiv, inhalt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    ['f20-bausatz', 'F-20 Tigershark M 1:11 – CNC-Holzbaukasten',
     'Kompletter CNC-gefräster Holzbaukasten für den F-20 Tigershark im Massstab 1:11.',
     'Enthält alle gefrästen Holzteile aus Pappel, Balsa und Birke-Sperrholz, Kabinenhaube, Einziehfahrwerk, Räder, Kugellager und Baupläne auf CD.',
     'Bausatz', 210, 5, 1,
     JSON.stringify(['CNC-gefräste Holzteile (Pappel, Balsa, Birke-Sperrholz)', 'Kabinenhaube', 'Einziehfahrwerk für Hartpiste', 'Räder und Kleinteile', 'Kugellager für Höhenleitwerk', 'Baupläne auf CD'])],
    ['sr-falcon-bausatz', 'SR Falcon – CNC-Holzbaukasten',
     'CNC-gefräster Holzbaukasten für den SR Falcon.',
     'Enthält alle präzise gefrästen Holzteile sowie detaillierte Baupläne. Eine bewährte Eigenkonstruktion.',
     'Bausatz', 180, 3, 1,
     JSON.stringify(['CNC-gefräste Holzteile', 'Kleinteile', 'Detaillierte Baupläne'])],
    ['f20-bauplan', 'F-20 Tigershark – Bauplan',
     'Detaillierte Baupläne für den Eigenbau des F-20 Tigershark.',
     'Umfassende Baupläne mit allen Massen und Konstruktionsdetails.',
     'Bauplan', 35, 99, 1,
     JSON.stringify(['Komplette Baupläne (A4-Format)', 'Detailzeichnungen aller Baugruppen'])]
  ];

  for (const p of products) {
    insertProdukt.run(...p);
  }
}

module.exports = { getDb };
