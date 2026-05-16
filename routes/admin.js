const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');

// ---- Multer config ----

function makeStorage(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads', subfolder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
      cb(null, name);
    }
  });
}

const uploadProjekt = multer({
  storage: makeStorage('projekte'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});

const uploadProdukt = multer({
  storage: makeStorage('produkte'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});

// ---- Auth Middleware ----

function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(401).json({ error: 'Nicht eingeloggt' });
  }
  res.redirect('/admin/login.html');
}

// ---- Auth Routes ----

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Falscher Benutzername oder Passwort.' });
  }

  req.session.admin = { id: user.id, username: user.username };
  res.json({ success: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

router.get('/check', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.admin) });
});

router.post('/passwort', requireAuth, (req, res) => {
  const { current, newPassword } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.session.admin.id);
  if (!bcrypt.compareSync(current, user.password_hash)) {
    return res.status(400).json({ error: 'Aktuelles Passwort falsch.' });
  }
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), user.id);
  res.json({ success: true });
});

// ---- Projekte CRUD ----

router.get('/api/projekte', requireAuth, (req, res) => {
  const db = getDb();
  const projekte = db.prepare('SELECT * FROM projekte ORDER BY sort_order, created_at DESC').all();
  for (const p of projekte) {
    p.bilder = db.prepare('SELECT * FROM projekt_bilder WHERE projekt_id = ? ORDER BY sort_order, id').all(p.id);
    p.bilder = p.bilder.map(b => ({ ...b, url: '/uploads/projekte/' + b.filename }));
  }
  res.json(projekte);
});

router.post('/api/projekte', requireAuth, (req, res) => {
  const db = getDb();
  const { name, massstab, kurzbeschreibung, beschreibung, spannweite, laenge, gewicht, antrieb, status, verfuegbarkeit, jahr } = req.body;

  if (!name) return res.status(400).json({ error: 'Name ist erforderlich.' });

  const slug = name.toLowerCase().replace(/[^a-z0-9äöü]+/g, '-').replace(/^-|-$/g, '').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue');
  const maxSort = db.prepare('SELECT MAX(sort_order) as m FROM projekte').get().m || 0;

  try {
    const result = db.prepare(`
      INSERT INTO projekte (slug, name, massstab, kurzbeschreibung, beschreibung, spannweite, laenge, gewicht, antrieb, status, verfuegbarkeit, jahr, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(slug, name, massstab || '', kurzbeschreibung || '', beschreibung || '', spannweite || '', laenge || '', gewicht || '', antrieb || '', status || 'In Arbeit', verfuegbarkeit || 'einzelstueck', jahr || new Date().getFullYear(), maxSort + 1);

    res.json({ success: true, id: result.lastInsertRowid, slug });
  } catch (err) {
    res.status(400).json({ error: 'Projekt konnte nicht erstellt werden. Name bereits vergeben?' });
  }
});

router.put('/api/projekte/:id', requireAuth, (req, res) => {
  const db = getDb();
  const { name, massstab, kurzbeschreibung, beschreibung, spannweite, laenge, gewicht, antrieb, status, verfuegbarkeit, jahr } = req.body;

  db.prepare(`
    UPDATE projekte SET name=?, massstab=?, kurzbeschreibung=?, beschreibung=?, spannweite=?, laenge=?, gewicht=?, antrieb=?, status=?, verfuegbarkeit=?, jahr=?
    WHERE id=?
  `).run(name, massstab || '', kurzbeschreibung || '', beschreibung || '', spannweite || '', laenge || '', gewicht || '', antrieb || '', status || '', verfuegbarkeit || 'einzelstueck', jahr || null, req.params.id);

  res.json({ success: true });
});

router.delete('/api/projekte/:id', requireAuth, (req, res) => {
  const db = getDb();
  const bilder = db.prepare('SELECT filename FROM projekt_bilder WHERE projekt_id = ?').all(req.params.id);
  for (const b of bilder) {
    const filepath = path.join(__dirname, '..', 'uploads', 'projekte', b.filename);
    try { fs.unlinkSync(filepath); } catch {}
  }
  db.prepare('DELETE FROM projekte WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---- Projekt Bilder ----

router.post('/api/projekte/:id/bilder', requireAuth, uploadProjekt.array('bilder', 20), (req, res) => {
  const db = getDb();
  const projektId = req.params.id;
  const existing = db.prepare('SELECT COUNT(*) as c FROM projekt_bilder WHERE projekt_id = ?').get(projektId).c;

  const insert = db.prepare('INSERT INTO projekt_bilder (projekt_id, filename, is_cover, sort_order) VALUES (?, ?, ?, ?)');
  for (let i = 0; i < req.files.length; i++) {
    insert.run(projektId, req.files[i].filename, existing === 0 && i === 0 ? 1 : 0, existing + i);
  }

  const bilder = db.prepare('SELECT * FROM projekt_bilder WHERE projekt_id = ? ORDER BY sort_order, id').all(projektId);
  res.json(bilder.map(b => ({ ...b, url: '/uploads/projekte/' + b.filename })));
});

router.put('/api/projekt-bilder/:bildId/cover', requireAuth, (req, res) => {
  const db = getDb();
  const bild = db.prepare('SELECT * FROM projekt_bilder WHERE id = ?').get(req.params.bildId);
  if (!bild) return res.status(404).json({ error: 'Bild nicht gefunden' });

  db.prepare('UPDATE projekt_bilder SET is_cover = 0 WHERE projekt_id = ?').run(bild.projekt_id);
  db.prepare('UPDATE projekt_bilder SET is_cover = 1 WHERE id = ?').run(bild.id);
  res.json({ success: true });
});

router.delete('/api/projekt-bilder/:bildId', requireAuth, (req, res) => {
  const db = getDb();
  const bild = db.prepare('SELECT * FROM projekt_bilder WHERE id = ?').get(req.params.bildId);
  if (!bild) return res.status(404).json({ error: 'Bild nicht gefunden' });

  const filepath = path.join(__dirname, '..', 'uploads', 'projekte', bild.filename);
  try { fs.unlinkSync(filepath); } catch {}
  db.prepare('DELETE FROM projekt_bilder WHERE id = ?').run(bild.id);

  if (bild.is_cover) {
    const next = db.prepare('SELECT id FROM projekt_bilder WHERE projekt_id = ? ORDER BY sort_order LIMIT 1').get(bild.projekt_id);
    if (next) db.prepare('UPDATE projekt_bilder SET is_cover = 1 WHERE id = ?').run(next.id);
  }
  res.json({ success: true });
});

// ---- Produkte CRUD ----

router.get('/api/produkte', requireAuth, (req, res) => {
  const db = getDb();
  const produkte = db.prepare('SELECT * FROM produkte ORDER BY created_at DESC').all();
  for (const p of produkte) {
    p.bilder = db.prepare('SELECT * FROM produkt_bilder WHERE produkt_id = ? ORDER BY sort_order, id').all(p.id);
    p.bilder = p.bilder.map(b => ({ ...b, url: '/uploads/produkte/' + b.filename }));
    try { p.inhalt = JSON.parse(p.inhalt); } catch { p.inhalt = []; }
  }
  res.json(produkte);
});

router.post('/api/produkte', requireAuth, (req, res) => {
  const db = getDb();
  const { name, kurzbeschreibung, beschreibung, kategorie, preis, lagerbestand, ist_aktiv, inhalt } = req.body;

  if (!name) return res.status(400).json({ error: 'Name ist erforderlich.' });

  const slug = name.toLowerCase().replace(/[^a-z0-9äöü]+/g, '-').replace(/^-|-$/g, '').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue');

  try {
    const result = db.prepare(`
      INSERT INTO produkte (slug, name, kurzbeschreibung, beschreibung, kategorie, preis, lagerbestand, ist_aktiv, inhalt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(slug, name, kurzbeschreibung || '', beschreibung || '', kategorie || 'Bausatz', preis || 0, lagerbestand || 0, ist_aktiv !== undefined ? ist_aktiv : 1, JSON.stringify(inhalt || []));

    res.json({ success: true, id: result.lastInsertRowid, slug });
  } catch (err) {
    res.status(400).json({ error: 'Produkt konnte nicht erstellt werden.' });
  }
});

router.put('/api/produkte/:id', requireAuth, (req, res) => {
  const db = getDb();
  const { name, kurzbeschreibung, beschreibung, kategorie, preis, lagerbestand, ist_aktiv, inhalt } = req.body;

  db.prepare(`
    UPDATE produkte SET name=?, kurzbeschreibung=?, beschreibung=?, kategorie=?, preis=?, lagerbestand=?, ist_aktiv=?, inhalt=?
    WHERE id=?
  `).run(name, kurzbeschreibung || '', beschreibung || '', kategorie || 'Bausatz', preis || 0, lagerbestand || 0, ist_aktiv !== undefined ? ist_aktiv : 1, JSON.stringify(inhalt || []), req.params.id);

  res.json({ success: true });
});

router.delete('/api/produkte/:id', requireAuth, (req, res) => {
  const db = getDb();
  const bilder = db.prepare('SELECT filename FROM produkt_bilder WHERE produkt_id = ?').all(req.params.id);
  for (const b of bilder) {
    try { fs.unlinkSync(path.join(__dirname, '..', 'uploads', 'produkte', b.filename)); } catch {}
  }
  db.prepare('DELETE FROM produkte WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---- Produkt Bilder ----

router.post('/api/produkte/:id/bilder', requireAuth, uploadProdukt.array('bilder', 20), (req, res) => {
  const db = getDb();
  const produktId = req.params.id;
  const existing = db.prepare('SELECT COUNT(*) as c FROM produkt_bilder WHERE produkt_id = ?').get(produktId).c;

  const insert = db.prepare('INSERT INTO produkt_bilder (produkt_id, filename, is_cover, sort_order) VALUES (?, ?, ?, ?)');
  for (let i = 0; i < req.files.length; i++) {
    insert.run(produktId, req.files[i].filename, existing === 0 && i === 0 ? 1 : 0, existing + i);
  }

  const bilder = db.prepare('SELECT * FROM produkt_bilder WHERE produkt_id = ? ORDER BY sort_order, id').all(produktId);
  res.json(bilder.map(b => ({ ...b, url: '/uploads/produkte/' + b.filename })));
});

router.put('/api/produkt-bilder/:bildId/cover', requireAuth, (req, res) => {
  const db = getDb();
  const bild = db.prepare('SELECT * FROM produkt_bilder WHERE id = ?').get(req.params.bildId);
  if (!bild) return res.status(404).json({ error: 'Bild nicht gefunden' });

  db.prepare('UPDATE produkt_bilder SET is_cover = 0 WHERE produkt_id = ?').run(bild.produkt_id);
  db.prepare('UPDATE produkt_bilder SET is_cover = 1 WHERE id = ?').run(bild.id);
  res.json({ success: true });
});

router.delete('/api/produkt-bilder/:bildId', requireAuth, (req, res) => {
  const db = getDb();
  const bild = db.prepare('SELECT * FROM produkt_bilder WHERE id = ?').get(req.params.bildId);
  if (!bild) return res.status(404).json({ error: 'Bild nicht gefunden' });

  try { fs.unlinkSync(path.join(__dirname, '..', 'uploads', 'produkte', bild.filename)); } catch {}
  db.prepare('DELETE FROM produkt_bilder WHERE id = ?').run(bild.id);

  if (bild.is_cover) {
    const next = db.prepare('SELECT id FROM produkt_bilder WHERE produkt_id = ? ORDER BY sort_order LIMIT 1').get(bild.produkt_id);
    if (next) db.prepare('UPDATE produkt_bilder SET is_cover = 1 WHERE id = ?').run(next.id);
  }
  res.json({ success: true });
});

// ---- Bestellungen ----

router.get('/api/bestellungen', requireAuth, (req, res) => {
  const db = getDb();
  const bestellungen = db.prepare('SELECT * FROM bestellungen ORDER BY created_at DESC').all();
  for (const b of bestellungen) {
    b.positionen = db.prepare('SELECT * FROM bestell_positionen WHERE bestell_id = ?').all(b.id);
  }
  res.json(bestellungen);
});

router.put('/api/bestellungen/:id/status', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE bestellungen SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  res.json({ success: true });
});

module.exports = router;
