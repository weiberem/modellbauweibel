/* ============================================
   Warenkorb & Checkout
   ============================================ */

const Cart = {
  KEY: 'mw_cart',

  getItems() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },

  save(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateBadge();
  },

  add(produkt) {
    const items = this.getItems();
    const existing = items.find(i => i.produkt_id === produkt.id);
    if (existing) {
      existing.anzahl++;
    } else {
      items.push({
        produkt_id: produkt.id,
        produkt_name: produkt.name,
        preis: produkt.preis,
        anzahl: 1,
        titelbild: produkt.titelbild || '',
        max_lager: produkt.lagerbestand
      });
    }
    this.save(items);
    this.showNotification(produkt.name);
  },

  updateQuantity(produktId, anzahl) {
    const items = this.getItems();
    const item = items.find(i => i.produkt_id === produktId);
    if (item) {
      if (anzahl <= 0) {
        this.remove(produktId);
        return;
      }
      item.anzahl = Math.min(anzahl, item.max_lager);
      this.save(items);
    }
  },

  remove(produktId) {
    const items = this.getItems().filter(i => i.produkt_id !== produktId);
    this.save(items);
  },

  clear() {
    localStorage.removeItem(this.KEY);
    this.updateBadge();
  },

  getTotal() {
    return this.getItems().reduce((sum, i) => sum + i.preis * i.anzahl, 0);
  },

  getCount() {
    return this.getItems().reduce((sum, i) => sum + i.anzahl, 0);
  },

  updateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = this.getCount();
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  showNotification(name) {
    let notif = document.getElementById('cart-notification');
    if (!notif) {
      notif = document.createElement('div');
      notif.id = 'cart-notification';
      notif.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#16a34a;color:white;padding:16px 24px;border-radius:12px;font-weight:600;font-size:0.92rem;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.2);transform:translateY(100px);transition:transform 0.3s ease;font-family:Inter,sans-serif;';
      document.body.appendChild(notif);
    }
    notif.innerHTML = `✓ "${name}" zum Warenkorb hinzugefügt<br><a href="/warenkorb.html" style="color:white;text-decoration:underline;font-size:0.82rem;">Zum Warenkorb →</a>`;
    requestAnimationFrame(() => { notif.style.transform = 'translateY(0)'; });
    clearTimeout(notif._timer);
    notif._timer = setTimeout(() => { notif.style.transform = 'translateY(100px)'; }, 4000);
  }
};

document.addEventListener('DOMContentLoaded', () => Cart.updateBadge());
