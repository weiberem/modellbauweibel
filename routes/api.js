const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// ---- Projekte (Public) ----

router.get('/projekte', (req, res) => {
  const db = getDb();
  const projekte = db.prepare(`
    SELECT p.*,
      (SELECT filename FROM projekt_bilder WHERE projekt_id = p.id AND is_cover = 1 LIMIT 1) as titelbild
    FROM projekte p ORDER BY p.sort_order, p.created_at DESC
  `).all();

  for (const p of projekte) {
    p.bilder = db.prepare('SELECT * FROM projekt_bilder WHERE projekt_id = ? ORDER BY sort_order, id').all(p.id);
    if (p.titelbild) p.titelbild = '/uploads/projekte/' + p.titelbild;
    p.bilder = p.bilder.map(b => ({ ...b, url: '/uploads/projekte/' + b.filename }));

    // Find matching products by name keywords
    p.passende_produkte = [];
    if (p.verfuegbarkeit && p.verfuegbarkeit !== 'einzelstueck') {
      const keywords = p.name.split(/[\s\-\/]+/).filter(w => w.length > 2);
      if (keywords.length > 0) {
        const likeClauses = keywords.map(() => 'p2.name LIKE ?').join(' OR ');
        const params = keywords.map(k => `%${k}%`);
        p.passende_produkte = db.prepare(`
          SELECT p2.id, p2.slug, p2.name, p2.kategorie, p2.preis, p2.lagerbestand,
            (SELECT filename FROM produkt_bilder WHERE produkt_id = p2.id AND is_cover = 1 LIMIT 1) as titelbild
          FROM produkte p2 WHERE p2.ist_aktiv = 1 AND (${likeClauses})
        `).all(...params);
        p.passende_produkte = p.passende_produkte.map(pr => ({
          ...pr,
          titelbild: pr.titelbild ? '/uploads/produkte/' + pr.titelbild : null
        }));
      }
    }
  }
  res.json(projekte);
});

router.get('/projekte/:slug', (req, res) => {
  const db = getDb();
  const projekt = db.prepare(`
    SELECT p.*,
      (SELECT filename FROM projekt_bilder WHERE projekt_id = p.id AND is_cover = 1 LIMIT 1) as titelbild
    FROM projekte p WHERE p.slug = ?
  `).get(req.params.slug);
  if (!projekt) return res.status(404).json({ error: 'Nicht gefunden' });

  projekt.bilder = db.prepare('SELECT * FROM projekt_bilder WHERE projekt_id = ? ORDER BY sort_order, id').all(projekt.id);
  if (projekt.titelbild) projekt.titelbild = '/uploads/projekte/' + projekt.titelbild;
  projekt.bilder = projekt.bilder.map(b => ({ ...b, url: '/uploads/projekte/' + b.filename }));
  res.json(projekt);
});

// ---- Produkte (Public) ----

router.get('/produkte', (req, res) => {
  const db = getDb();
  const produkte = db.prepare(`
    SELECT p.*,
      (SELECT filename FROM produkt_bilder WHERE produkt_id = p.id AND is_cover = 1 LIMIT 1) as titelbild
    FROM produkte p WHERE p.ist_aktiv = 1 ORDER BY p.created_at DESC
  `).all();

  for (const p of produkte) {
    p.bilder = db.prepare('SELECT * FROM produkt_bilder WHERE produkt_id = ? ORDER BY sort_order, id').all(p.id);
    if (p.titelbild) p.titelbild = '/uploads/produkte/' + p.titelbild;
    p.bilder = p.bilder.map(b => ({ ...b, url: '/uploads/produkte/' + b.filename }));
    try { p.inhalt = JSON.parse(p.inhalt); } catch { p.inhalt = []; }
  }
  res.json(produkte);
});

// ---- Bestellungen (Public: Checkout) ----

router.post('/bestellen', (req, res) => {
  const db = getDb();
  const { kunde_name, kunde_email, kunde_adresse, kunde_plz, kunde_ort, kunde_telefon, bemerkung, positionen } = req.body;

  if (!kunde_name || !kunde_email || !kunde_adresse || !positionen || !positionen.length) {
    return res.status(400).json({ error: 'Bitte alle Pflichtfelder ausfüllen.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(kunde_email)) {
    return res.status(400).json({ error: 'Ungültige E-Mail-Adresse.' });
  }

  // Validate stock and calculate total
  let total = 0;
  const validatedItems = [];

  for (const item of positionen) {
    const produkt = db.prepare('SELECT * FROM produkte WHERE id = ? AND ist_aktiv = 1').get(item.produkt_id);
    if (!produkt) return res.status(400).json({ error: `Produkt "${item.produkt_name}" nicht mehr verfügbar.` });
    if (produkt.lagerbestand < item.anzahl) {
      return res.status(400).json({ error: `"${produkt.name}" nur noch ${produkt.lagerbestand}x auf Lager.` });
    }
    validatedItems.push({ produkt, anzahl: item.anzahl });
    total += produkt.preis * item.anzahl;
  }

  // Create order
  const bestellNr = 'MW-' + Date.now().toString(36).toUpperCase();

  const insertOrder = db.prepare(`
    INSERT INTO bestellungen (bestell_nr, kunde_name, kunde_email, kunde_adresse, kunde_plz, kunde_ort, kunde_telefon, bemerkung, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT INTO bestell_positionen (bestell_id, produkt_id, produkt_name, anzahl, preis)
    VALUES (?, ?, ?, ?, ?)
  `);

  const updateStock = db.prepare('UPDATE produkte SET lagerbestand = lagerbestand - ? WHERE id = ?');

  const transaction = db.transaction(() => {
    const result = insertOrder.run(bestellNr, kunde_name, kunde_email, kunde_adresse, kunde_plz || '', kunde_ort || '', kunde_telefon || '', bemerkung || '', total);
    const bestellId = result.lastInsertRowid;

    for (const vi of validatedItems) {
      insertItem.run(bestellId, vi.produkt.id, vi.produkt.name, vi.anzahl, vi.produkt.preis);
      updateStock.run(vi.anzahl, vi.produkt.id);
    }
    return bestellNr;
  });

  try {
    const nr = transaction();
    res.json({ success: true, bestell_nr: nr, total });
  } catch (err) {
    res.status(500).json({ error: 'Bestellung fehlgeschlagen. Bitte versuchen Sie es erneut.' });
  }
});

module.exports = router;
