/* ============================================
   Modellbau Weibel – Main Application JS
   ============================================ */

// ---- Shared Header & Footer ----

function getCurrentPage() {
  const path = window.location.pathname;
  if (path.includes('projekte')) return 'projekte';
  if (path.includes('shop')) return 'shop';
  if (path.includes('kontakt')) return 'kontakt';
  return 'home';
}

function renderHeader() {
  const page = getCurrentPage();
  const header = document.getElementById('site-header');
  if (!header) return;

  header.innerHTML = `
    <div class="container">
      <nav class="nav-wrapper">
        <a href="index.html" class="logo">
          <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            <path d="M33 16l-15-14-3 3 4 5-12 4-5-3-2 2 6 6-3 3c-1 1-1.5 3-.5 4s3 .5 4-.5l3-3 6 6 2-2-3-5 4-12 5 4z" fill="currentColor" opacity="0.9"/>
          </svg>
          Modellbau <span>Weibel</span>
        </a>
        <ul class="nav-links" id="nav-links">
          <li><a href="index.html" class="${page === 'home' ? 'active' : ''}">Home</a></li>
          <li><a href="projekte.html" class="${page === 'projekte' ? 'active' : ''}">Projekte</a></li>
          <li><a href="shop.html" class="${page === 'shop' ? 'active' : ''}">Shop</a></li>
          <li><a href="kontakt.html" class="${page === 'kontakt' ? 'active' : ''}">Kontakt</a></li>
        </ul>
        <button class="nav-toggle" id="nav-toggle" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </nav>
    </div>
  `;

  // Mobile toggle
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    links.classList.toggle('open');
  });

  // Close on link click
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      toggle.classList.remove('active');
      links.classList.remove('open');
    });
  });

  // Header scroll effect
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });
}

function renderFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;

  const year = new Date().getFullYear();
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-about">
          <a href="index.html" class="logo">
            <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" width="30" height="30">
              <path d="M33 16l-15-14-3 3 4 5-12 4-5-3-2 2 6 6-3 3c-1 1-1.5 3-.5 4s3 .5 4-.5l3-3 6 6 2-2-3-5 4-12 5 4z" fill="currentColor" opacity="0.9"/>
            </svg>
            Modellbau <span>Weibel</span>
          </a>
          <p>Seit 1980 baue und fliege ich mit Leidenschaft Modellflugzeuge. Die meisten Modelle sind Eigenkonstruktionen aus Holz.</p>
        </div>
        <div class="footer-links">
          <h4>Navigation</h4>
          <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="projekte.html">Projekte</a></li>
            <li><a href="shop.html">Shop</a></li>
            <li><a href="kontakt.html">Kontakt</a></li>
          </ul>
        </div>
        <div class="footer-contact">
          <h4>Kontakt</h4>
          <p>Martin Weibel</p>
          <p>Bachelstrasse 61<br>Lohnstorf, Schweiz</p>
          <p>Tel: 031 809 34 77</p>
          <p><a href="mailto:modellbau-weibel@bluewin.ch">modellbau-weibel@bluewin.ch</a></p>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; ${year} Modellbau Weibel. Alle Rechte vorbehalten.
      </div>
    </div>
  `;
}

// ---- Data Loading ----

async function loadJSON(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Fehler beim Laden: ${path}`);
    return await response.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

// ---- Image Handling ----

function createImgElement(src, alt, className) {
  const container = document.createElement('div');
  container.className = className || '';

  const img = document.createElement('img');
  img.alt = alt;
  img.loading = 'lazy';

  // Try to load real image, show placeholder if missing
  img.src = src;
  img.onerror = function () {
    this.style.display = 'none';
    const placeholder = document.createElement('div');
    placeholder.className = 'img-placeholder';
    placeholder.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`;
    this.parentNode.appendChild(placeholder);
  };

  container.appendChild(img);
  return container;
}

// ---- Project Cards ----

function renderProjectCard(project) {
  return `
    <article class="project-card fade-in" data-id="${project.id}" onclick="openProjectModal('${project.id}')">
      <div class="project-card-image">
        <img src="${project.titelbild}" alt="${project.name}" loading="lazy"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="img-placeholder" style="display:none; position:absolute; inset:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        </div>
        ${project.massstab ? `<span class="project-card-badge">M ${project.massstab}</span>` : ''}
      </div>
      <div class="project-card-body">
        <h3>${project.name}</h3>
        <div class="project-card-meta">${project.massstab ? `Massstab ${project.massstab}` : ''} ${project.status ? `&middot; ${project.status}` : ''} ${project.jahr ? `&middot; ${project.jahr}` : ''}</div>
        <p>${project.kurzbeschreibung}</p>
        <div class="project-card-specs">
          ${project.spannweite ? `<div class="spec-item"><span class="spec-label">Spannweite</span><span class="spec-value">${project.spannweite}</span></div>` : ''}
          ${project.laenge ? `<div class="spec-item"><span class="spec-label">Länge</span><span class="spec-value">${project.laenge}</span></div>` : ''}
          ${project.gewicht ? `<div class="spec-item"><span class="spec-label">Gewicht</span><span class="spec-value">${project.gewicht}</span></div>` : ''}
        </div>
      </div>
    </article>
  `;
}

// ---- Project Modal ----

let projectsData = [];

async function loadProjectsData() {
  projectsData = await loadJSON('data/projekte.json');
  return projectsData;
}

function openProjectModal(id) {
  const project = projectsData.find(p => p.id === id);
  if (!project) return;

  const modal = document.getElementById('project-modal');
  if (!modal) return;

  modal.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <img src="${project.titelbild}" alt="${project.name}"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="img-placeholder" style="display:none; position:absolute; inset:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        </div>
        <button class="modal-close" onclick="closeProjectModal()">&times;</button>
      </div>
      <div class="modal-body">
        <h2>${project.name}</h2>
        <div class="project-card-meta">${project.massstab ? `Massstab ${project.massstab}` : ''} ${project.status ? `&middot; ${project.status}` : ''} ${project.jahr ? `&middot; ${project.jahr}` : ''}</div>
        <p class="description">${project.beschreibung}</p>
        <div class="modal-specs-grid">
          ${project.spannweite ? `<div class="modal-spec"><div class="spec-label">Spannweite</div><div class="spec-value">${project.spannweite}</div></div>` : ''}
          ${project.laenge ? `<div class="modal-spec"><div class="spec-label">Länge</div><div class="spec-value">${project.laenge}</div></div>` : ''}
          ${project.gewicht ? `<div class="modal-spec"><div class="spec-label">Gewicht</div><div class="spec-value">${project.gewicht}</div></div>` : ''}
          ${project.antrieb ? `<div class="modal-spec"><div class="spec-label">Antrieb</div><div class="spec-value">${project.antrieb}</div></div>` : ''}
        </div>
        ${project.bilder && project.bilder.length > 1 ? `
          <h4>Weitere Bilder</h4>
          <div class="modal-gallery">
            ${project.bilder.slice(1).map(img => `
              <img src="${img}" alt="${project.name}" loading="lazy" onclick="openLightbox('${img}')"
                   onerror="this.style.display='none'">
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  const modal = document.getElementById('project-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ---- Product Cards ----

function renderProductCard(product) {
  const badgeClass = product.kategorie === 'Bausatz' ? 'bausatz' : 'bauplan';
  return `
    <article class="product-card fade-in">
      <div class="product-card-image">
        <img src="${product.titelbild}" alt="${product.name}" loading="lazy"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="img-placeholder" style="display:none; position:absolute; inset:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        </div>
        <span class="product-badge ${badgeClass}">${product.kategorie}</span>
        ${product.verfuegbar ? '<span class="product-badge verfuegbar" style="left:auto;right:16px;">Verfügbar</span>' : ''}
      </div>
      <div class="product-card-body">
        <h3>${product.name}</h3>
        <p>${product.kurzbeschreibung}</p>
        ${product.inhalt && product.inhalt.length > 0 ? `
          <ul class="product-inhalt">
            ${product.inhalt.map(item => `<li>${item}</li>`).join('')}
          </ul>
        ` : ''}
        <div class="product-price">
          <span class="price">${product.preis}</span>
          <a href="kontakt.html" class="btn btn-dark">Anfragen</a>
        </div>
      </div>
    </article>
  `;
}

// ---- Lightbox ----

function openLightbox(src) {
  let lightbox = document.getElementById('lightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'lightbox';
    lightbox.onclick = closeLightbox;
    lightbox.innerHTML = `
      <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
      <img src="" alt="Vollbild">
    `;
    document.body.appendChild(lightbox);
  }

  lightbox.querySelector('img').src = src;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.classList.remove('active');
    if (!document.querySelector('.modal-overlay.active')) {
      document.body.style.overflow = '';
    }
  }
}

// ---- Scroll Animations ----

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ---- Keyboard Handling ----

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
    closeProjectModal();
  }
});

// ---- Initialize ----

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();

  // Delay scroll animations slightly to allow content rendering
  setTimeout(initScrollAnimations, 100);
});
