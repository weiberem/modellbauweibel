const express = require('express');
const session = require('express-session');
const path = require('path');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
getDb();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'modellbau-weibel-geheim-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));

app.listen(PORT, () => {
  console.log(`Modellbau Weibel läuft auf http://localhost:${PORT}`);
});
