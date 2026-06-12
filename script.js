// ═══════════════════════════════════════════════════════
//  CATEGORIAS — ícone fixo com imagem real
// ═══════════════════════════════════════════════════════
const CATEGORIES = [
  { id: 31, name: 'Dia dos Namorados',  icon: 'img/6dca3c4521c7d892.webp' },
  { id: 27, name: 'Flores + Chocolate', icon: 'img/3419fca0d9b8e70b.jpg' },
  { id: 25, name: 'Buquês de Rosas',    icon: 'img/b0d0590b584cbc19.jpg' },
  { id: 23, name: 'Kits Especiais',     icon: 'img/1d473992a4abbcb6.jpg' },
  { id: 22, name: 'Cestas Românticas',  icon: 'img/593d49a8110b4d90.jpg' },
  { id: 32, name: 'Ursinho',            icon: 'img/33698ef01238d858.webp' },
  { id: 19, name: 'Café da Manhã',      icon: 'img/38dc172fa2e16cda.jpg' },
  { id: 21, name: 'Buquê + Presente',   icon: 'img/dac78a6cf626a448.jpg' },
  { id: 26, name: 'Arranjos em Vaso',   icon: 'img/a235f4a0e6ff2c3a.jpg' },
  { id: 24, name: 'Para Homens',        icon: 'img/bc363c673c6569b5.jpg' },
  { id: 28, name: 'Rosas Encantadas',   icon: 'img/d0a976f57ceef218.jpg' },
  { id: 29, name: 'Flores Plantadas',   icon: 'img/a7c8839d35a616b3.jpg' },
  { id: 20, name: 'Café Saudável',      icon: 'img/bc8ed51d8641e5b5.jpg' },
  { id: 30, name: 'Flores Silvestres',  icon: 'img/15772a8b3e071174.jpg' },
];

// ═══════════════════════════════════════════════════════
//  SLUGS DE URL POR CATEGORIA (para sitelinks do Google Ads)
//  Cada categoria abre em https://floricultura-dosamores.sbs/<slug>
// ═══════════════════════════════════════════════════════
const CAT_SLUGS = {
  31: 'dia-dos-namorados',
  27: 'flores-e-chocolate',
  25: 'buques-de-rosas',
  23: 'kits-especiais',
  22: 'cestas-romanticas',
  32: 'ursos-de-pelucia',
  19: 'cesta-cafe-da-manha',
  21: 'buque-e-presente',
  26: 'arranjos-em-vaso',
  24: 'para-homens',
  28: 'rosas-encantadas',
  29: 'flores-plantadas',
  20: 'cafe-saudavel',
  30: 'flores-silvestres',
};
function slugForCat(id) { return CAT_SLUGS[id] || ('categoria-' + id); }
function catForSlug(slug) {
  slug = String(slug || '').toLowerCase();
  for (const k in CAT_SLUGS) { if (CAT_SLUGS[k] === slug) return parseInt(k, 10); }
  return null;
}

// ═══════════════════════════════════════════════════════
//  POOL DE IMAGENS — substitui cestasfeitacomamor.top
//  (esse servidor retorna a mesma foto pra todos os produtos)
// ═══════════════════════════════════════════════════════
const IMG_POOL = {
  19: [
    'img/38dc172fa2e16cda.jpg',
    'img/bc8ed51d8641e5b5.jpg',
    'img/31607ae2b9cd513e.jpg',
    'img/a89912875f89088a.jpg',
  ],
  22: [
    'img/593d49a8110b4d90.jpg',
    'img/d1de0d152f32d5d9.jpg',
    'img/3cb6fececbe948a7.jpg',
    'img/a0e19c4c4830ee0f.jpg',
    'img/dac78a6cf626a448.jpg',
    'img/e97d7c31aa88c91b.jpg',
  ],
  21: [
    'img/f5eefe85e4f0d03c.jpg',
    'img/e49742f8e56ff0cf.jpg',
    'img/1d473992a4abbcb6.jpg',
    'img/b57ac94452b86e1b.jpg',
  ],
  // cat 25 novos produtos 179-182 usam cestasfeitacomamor → usar isabelaflores existentes
  25: [
    'img/b0d0590b584cbc19.jpg',
    'img/e49742f8e56ff0cf.jpg',
    'img/e23c094449cc6970.jpg',
    'img/dac78a6cf626a448.jpg',
    'img/e97d7c31aa88c91b.jpg',
    'img/22179617c94c6cbf.jpg',
  ],
  // cat 27 novos produtos 183-186
  27: [
    'img/3419fca0d9b8e70b.jpg',
    'img/af2f0c34f79abc8b.jpg',
    'img/f4bd08c151b2cb8b.jpg',
    'img/0036b93e99ba299e.jpg',
  ],
  23: [
    'img/2a9bddce64995a0b.jpg',
    'img/53aa2443ec41e53c.jpg',
    'img/b57ac94452b86e1b.jpg',
    'img/1d473992a4abbcb6.jpg',
  ],
  24: [
    'img/bc363c673c6569b5.jpg',
    'img/3915de57e424a595.jpg',
  ],
  // cat 20 novos produtos 187-188
  20: [
    'img/38dc172fa2e16cda.jpg',
    'img/bc8ed51d8641e5b5.jpg',
    'img/31607ae2b9cd513e.jpg',
    'img/a89912875f89088a.jpg',
  ],
};

// Índice global por categoria para garantir imagens únicas sequencialmente
const _poolIdx = {};

function resolveImage(p) {
  if (p.image && !p.image.includes('cestasfeitacomamor.top')) {
    return p.image; // imagem própria e funcional
  }
  const pool = IMG_POOL[p.category_id];
  if (!pool || !pool.length) return p.image;
  if (_poolIdx[p.id] === undefined) {
    // Atribui índice fixo baseado no id do produto dentro da categoria
    _poolIdx[p.id] = p.id % pool.length;
  }
  return pool[_poolIdx[p.id]];
}

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════
function formatPrice(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}
function fakeReviews(id) {
  return ((id * 37 + 11) % 4800 + 50);
}
function makeCard(p, extraClass) {
  const img  = resolveImage(p);
  const cat  = CATEGORIES.find(c => c.id === p.category_id);
  // Selo "Promoção" vermelho em todos os itens
  const label = `<span class="plabel" style="background:#fce7f3;color:#c2185b">Promoção</span>`;
  const oldP = p.old_price && Number(p.old_price) > Number(p.price)
    ? `<span class="pold">De ${formatPrice(p.old_price)}</span>` : '';
  return `
    <div class="pcard${extraClass ? ' '+extraClass : ''}" onclick="openDetail(${p.id})">
      <div class="pimg">
        <img src="${img}" alt="${p.name}" loading="lazy"
          onerror="this.onerror=null;this.src='${cat ? cat.icon : ''}'">
        ${label}
      </div>
      <div class="pinfo">
        <div class="pprice">${formatPrice(p.price)}<span class="pdot"></span></div>
        ${oldP}
        <div class="pname">${p.name}</div>
        <button class="pbuy" type="button" aria-label="Comprar" onclick="event.stopPropagation(); quickBuy(${p.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M1 1h4l2.3 12.4a2 2 0 0 0 2 1.6h9.1a2 2 0 0 0 2-1.6L23 6H6"/></svg></button>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════
//  PÁGINAS (navegação SPA)
// ═══════════════════════════════════════════════════════
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
  // Bolinha "Loja aberta" só na página principal
  const fl = document.getElementById('openFloat');
  if (fl) fl.style.display = (id === 'homePage') ? 'flex' : 'none';
  // Volta a URL para "/" ao exibir a home (sem criar histórico)
  if (id === 'homePage') { try { history.replaceState(history.state, '', '/'); } catch (e) {} }
}

// Indicador flutuante "Loja aberta" — interação ao clicar
function setupOpenFloat() {
  const fl = document.getElementById('openFloat');
  if (!fl) return;
  fl.addEventListener('click', () => {
    fl.classList.remove('bump'); void fl.offsetWidth; fl.classList.add('bump');
    let t = document.getElementById('openToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'openToast';
      t.className = 'open-toast';
      document.body.appendChild(t);
    }
    t.innerHTML = '<span class="open-float-dot"></span> Estamos abertos e prontos para o seu pedido!';
    t.classList.add('show');
    clearTimeout(fl._toastTimer);
    fl._toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  });
}

// ═══════════════════════════════════════════════════════
//  PÁGINA DE CATEGORIA — "Ver mais" abre aqui
// ═══════════════════════════════════════════════════════
function openCategory(catId) {
  const cat   = CATEGORIES.find(c => c.id === catId);
  const items = allProducts.filter(p => p.category_id === catId && p.active !== 0);
  if (!cat || !items.length) return;

  document.getElementById('catPageTitle').textContent = cat.name;
  document.getElementById('catPageCount').textContent = `${items.length} produtos encontrados`;
  document.getElementById('catPageGrid').innerHTML = items.map(p => makeCard(p)).join('');

  showPage('categoryPage');
  // Atualiza a URL para o slug da categoria (sem criar histórico) — p/ sitelinks
  try { history.replaceState(history.state, '', '/' + slugForCat(catId)); } catch (e) {}
}

document.getElementById('catBackBtn').addEventListener('click', () => {
  showPage('homePage');
});

// ═══════════════════════════════════════════════════════
//  CATEGORIAS (chips de navegação)
// ═══════════════════════════════════════════════════════
function renderCatChips() {
  const wrap = document.getElementById('catScroll');
  if (!wrap) return;
  wrap.innerHTML = CATEGORIES.map(c => `
    <div class="cat" onclick="openCategory(${c.id})">
      <div class="cat-circle">
        <img src="${c.icon}" alt="${c.name}" loading="lazy">
      </div>
      <span class="cat-lbl">${c.name}</span>
    </div>`).join('');
}

function scrollToSection(id) {
  const el = document.getElementById('sec-' + id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ═══════════════════════════════════════════════════════
//  SEÇÕES DA HOME — carrossel simples (sem loop infinito)
//  Mostra os 5 primeiros; "Ver mais" abre página de categoria
// ═══════════════════════════════════════════════════════
const HOME_PREVIEW = 5;

function renderSections(products) {
  const container = document.getElementById('dynamicSections');
  if (!container) return;

  let html = '';
  CATEGORIES.forEach(cat => {
    const items = products.filter(p => p.category_id === cat.id && p.active !== 0);
    if (!items.length) return;

    const cards = items.map(p => makeCard(p)).join('');

    html += `
      <section class="sec" id="sec-${cat.id}">
        <div class="sec-hdr">
          <span class="sec-title">${cat.name}</span>
          <span class="sec-more" onclick="openCategory(${cat.id})">Ver mais (${items.length})</span>
        </div>
        <div class="prods">${cards}</div>
      </section>`;
  });

  container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════
//  DETALHE DO PRODUTO
// ═══════════════════════════════════════════════════════
let allProducts = [];

function openDetail(id) {
  const p   = allProducts.find(x => x.id === id);
  if (!p) return;
  const cat = CATEGORIES.find(c => c.id === p.category_id);
  const img = resolveImage(p);

  const detImg = document.getElementById('detImg');
  detImg.src = img;
  detImg.onerror = function () { this.onerror = null; this.src = cat ? cat.icon : ''; };

  document.getElementById('detName').textContent  = p.name;
  document.getElementById('detPrice').textContent = formatPrice(p.price);
  document.getElementById('detStars').textContent = '★★★★★';
  document.getElementById('detCount').textContent = ' (' + fakeReviews(p.id).toLocaleString('pt-BR') + ' avaliações)';
  document.getElementById('detDesc').textContent  = p.description || '';
  document.getElementById('detShip').innerHTML    = '<strong>Entrega rápida</strong> disponível na sua região';

  const oldEl = document.getElementById('detOldPrice');
  if (p.old_price && Number(p.old_price) > Number(p.price)) {
    oldEl.textContent = 'De ' + formatPrice(p.old_price);
    oldEl.style.display = 'block';
  } else {
    oldEl.style.display = 'none';
  }

  // Guarda de onde viemos para o back funcionar corretamente
  const fromCat = document.getElementById('categoryPage').classList.contains('active');
  document.getElementById('backBtn').dataset.from = fromCat ? 'categoryPage' : 'homePage';

  // Expõe o id atual para o cart.js
  window._currentDetailId = id;

  showPage('detailPage');
}

document.getElementById('backBtn').addEventListener('click', () => {
  const from = document.getElementById('backBtn').dataset.from || 'homePage';
  showPage(from);
});

// ═══════════════════════════════════════════════════════
//  MENU LATERAL
// ═══════════════════════════════════════════════════════
const menuBtn  = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
const overlay  = document.getElementById('overlay');

function closeSideMenu() {
  sideMenu.classList.remove('open');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function renderSideMenu() {
  const wrap = document.getElementById('smCats');
  if (!wrap) return;
  wrap.innerHTML = CATEGORIES.map(c => `
    <a class="sm-cat-link" href="#" onclick="openCategory(${c.id}); closeSideMenu(); return false;">
      <img src="${c.icon}" alt="${c.name}" class="sm-cat-icon" loading="lazy" onerror="this.style.display='none'">
      <span class="sm-cat-name">${c.name}</span>
      <svg class="sm-cat-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </a>
  `).join('');
}

menuBtn.addEventListener('click', () => {
  sideMenu.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
});
overlay.addEventListener('click', closeSideMenu);

// ═══════════════════════════════════════════════════════
//  BUSCA — tempo real com debounce
// ═══════════════════════════════════════════════════════
const searchBarEl  = document.getElementById('searchBar');
const searchInput  = searchBarEl.querySelector('input');
const searchCloseX = searchBarEl.querySelector('.search-close');

// Lista de categorias (nome + imagem) exibida ao abrir a busca
function renderSearchCategories() {
  const titleEl = document.getElementById('catPageTitle');
  const countEl = document.getElementById('catPageCount');
  const gridEl  = document.getElementById('catPageGrid');
  titleEl.textContent = 'Confira nossas categorias';
  countEl.textContent = `${CATEGORIES.length} categorias`;
  gridEl.innerHTML = '<div class="search-cats-list">' + CATEGORIES.map(c => `
      <a href="#" class="search-cat-row" onclick="openCategory(${c.id});return false;">
        <img class="search-cat-img" src="${c.icon}" alt="${c.name}" loading="lazy">
        <span class="search-cat-name">${c.name}</span>
        <svg class="search-cat-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </a>`).join('') + '</div>';
  showPage('categoryPage');
}

// Abre/fecha a barra
document.getElementById('searchBtn').addEventListener('click', () => {
  searchBarEl.classList.toggle('hidden');
  if (!searchBarEl.classList.contains('hidden')) {
    searchInput.focus();
    searchInput.select();
    if (searchInput.value.trim().length < 2) renderSearchCategories();
  }
});

// Botão X na barra
if (searchCloseX) {
  searchCloseX.addEventListener('click', () => {
    searchInput.value = '';
    searchBarEl.classList.add('hidden');
    showPage('homePage');
  });
}

// Busca em tempo real (debounce 250ms)
let _searchTimer = null;
function doSearch(q) {
  q = q.trim().toLowerCase();

  if (q.length < 2) {
    // Pouco texto → mostra todas as categorias (lista)
    renderSearchCategories();
    return;
  }

  const results = allProducts.filter(p =>
    p.active !== 0 && (
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    )
  );

  // Monta grid de resultados
  const titleEl = document.getElementById('catPageTitle');
  const countEl = document.getElementById('catPageCount');
  const gridEl  = document.getElementById('catPageGrid');

  titleEl.textContent = `Busca: "${searchInput.value.trim()}"`;

  if (results.length) {
    countEl.textContent = `${results.length} produto(s) encontrado(s)`;
    gridEl.innerHTML    = results.map(p => makeCard(p)).join('');
  } else {
    countEl.textContent = '';
    gridEl.innerHTML = `
      <div style="grid-column:1/-1;padding:40px 20px;text-align:center;color:#888">
        <div style="font-size:36px;margin-bottom:12px">🔍</div>
        <div style="font-size:15px;font-weight:600;color:#1a1a2e;margin-bottom:6px">Nenhum produto encontrado</div>
        <div style="font-size:13px">Tente outro termo ou navegue pelas categorias</div>
      </div>`;
  }

  showPage('categoryPage');
}

searchInput.addEventListener('input', e => {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => doSearch(e.target.value), 250);
});

// Enter fecha o teclado mobile (não fecha a barra)
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    searchInput.value = '';
    searchBarEl.classList.add('hidden');
    showPage('homePage');
  }
});


// ═══════════════════════════════════════════════════════
//  COOKIE BANNER
// ═══════════════════════════════════════════════════════
const cookieBanner = document.getElementById('cookieBanner');
if (cookieBanner) {
  document.getElementById('cookieBtn').addEventListener('click', () => {
    cookieBanner.classList.add('hidden');
    localStorage.setItem('cookie_ok', '1');
  });
  if (localStorage.getItem('cookie_ok')) {
    cookieBanner.classList.add('hidden');
  }
}

// ═══════════════════════════════════════════════════════
//  HERO CAROUSEL LOGIC
// ═══════════════════════════════════════════════════════
let currentHeroSlide = 0;
let heroInterval = null;

window.setHeroSlide = function(idx) {
  currentHeroSlide = idx;
  const track = document.getElementById('heroTrack');
  if (track) {
    track.style.transform = `translateX(-${(idx * 100) / 3}%)`;
  }
  
  // Update dots active state
  const dots = document.querySelectorAll('.hero-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === idx);
  });
};

function nextHeroSlide() {
  let next = (currentHeroSlide + 1) % 3;
  window.setHeroSlide(next);
}

function startHeroAutoPlay() {
  stopHeroAutoPlay();
  heroInterval = setInterval(nextHeroSlide, 4500); // changes slide every 4.5 seconds
}

function stopHeroAutoPlay() {
  if (heroInterval) {
    clearInterval(heroInterval);
    heroInterval = null;
  }
}

// Touch swipe support for mobile
function initHeroCarouselTouch() {
  const carousel = document.getElementById('heroCarousel');
  if (!carousel) return;

  let startX = 0;
  let moveX = 0;
  let isDragging = false;

  carousel.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    isDragging = true;
    stopHeroAutoPlay();
  }, { passive: true });

  carousel.addEventListener('touchmove', e => {
    if (!isDragging) return;
    moveX = e.touches[0].clientX;
  }, { passive: true });

  carousel.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    
    let diff = startX - moveX;
    if (Math.abs(diff) > 50 && moveX > 0) {
      if (diff > 0) {
        let next = (currentHeroSlide + 1) % 3;
        window.setHeroSlide(next);
      } else {
        let prev = (currentHeroSlide - 3 + 1) % 3; // wait: correct prev modulo is (currentHeroSlide - 1 + 3) % 3
        let prevCorrected = (currentHeroSlide - 1 + 3) % 3;
        window.setHeroSlide(prevCorrected);
      }
    }
    moveX = 0;
    startHeroAutoPlay();
  });
}

// ═══════════════════════════════════════════════════════
//  TERMOS POPULARES & CIDADES ATENDIDAS
// ═══════════════════════════════════════════════════════
function initPopularTags() {
  const btnMore = document.getElementById('btnTagsMore');
  if (btnMore) {
    btnMore.addEventListener('click', () => {
      const extraTags = document.querySelectorAll('.tag-extra');
      if (!extraTags.length) return;
      const isHidden = extraTags[0].classList.contains('hidden');
      
      extraTags.forEach(tag => {
        if (isHidden) {
          tag.classList.remove('hidden');
        } else {
          tag.classList.add('hidden');
        }
      });
      
      btnMore.textContent = isHidden ? 'Ver menos' : 'Ver mais';
    });
  }

  // Cliques em tags para realizar buscas automáticas
  document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const text = tag.textContent.trim();
      const searchBar = document.getElementById('searchBar');
      if (searchBar) {
        searchBar.classList.remove('hidden');
        const input = searchBar.querySelector('input');
        if (input) {
          input.value = text;
          doSearch(text);
        }
      }
    });
  });
}

function initCitiesDirectory() {
  const btnOpen = document.getElementById('btnCidadesAtendidas');
  const btnClose = document.getElementById('btnCidadesClose');
  const modal = document.getElementById('cidadesModal');
  const searchInput = document.getElementById('cidadesSearchInput');

  if (!modal) return;

  if (btnOpen) {
    btnOpen.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.remove('hidden');
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  // Filtro de cidades em tempo real
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      const stateGroups = document.querySelectorAll('.cidades-state-group');

      stateGroups.forEach(group => {
        let hasVisibleCity = false;
        const cities = group.querySelectorAll('.cidade-item');

        cities.forEach(city => {
          const cityName = city.textContent.trim().toLowerCase();
          if (cityName.includes(query)) {
            city.classList.remove('hidden');
            hasVisibleCity = true;
          } else {
            city.classList.add('hidden');
          }
        });

        if (hasVisibleCity) {
          group.classList.remove('hidden');
        } else {
          group.classList.add('hidden');
        }
      });
    });
  }

  // Clicar em qualquer cidade faz uma busca automática
  document.querySelectorAll('.cidade-item').forEach(item => {
    item.addEventListener('click', () => {
      const city = item.textContent.trim();
      modal.classList.add('hidden');
      
      const searchQuery = `Floricultura ${city}`;
      const searchBar = document.getElementById('searchBar');
      if (searchBar) {
        searchBar.classList.remove('hidden');
        const input = searchBar.querySelector('input');
        if (input) {
          input.value = searchQuery;
          doSearch(searchQuery);
        }
      }
    });
  });
}

// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════
(function init() {
  const data = window.PRODUCTS_DATA || [];
  // Deixa todos os valores "quebrados" (terminando em ,90)
  const quebrar = v => {
    const n = parseFloat(v);
    if (!n || isNaN(n)) return v;
    return (Math.floor(n) + 0.90).toFixed(2);
  };
  data.forEach(p => {
    if (p.price) p.price = quebrar(p.price);
    if (p.old_price && parseFloat(p.old_price) > 0) p.old_price = quebrar(p.old_price);
    if (p.description) {
      p.description = p.description
        .replace(/entrega rápida e segura em todo o Brasil/gi, 'entrega rápida')
        .replace(/[,.]?\s*(em|para)\s+todo\s+o?\s*Brasil/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }
  });
  allProducts = data;
  window.allProducts = data;   // Expõe globalmente para cart.js
  renderCatChips();
  renderSections(data);
  renderSideMenu();
  setupOpenFloat();

  // Reposiciona: categorias no TOPO (antes das seções de produto);
  // faixa "Loja aberta" logo após o banner.
  (function repositionLayout() {
    const hero    = document.getElementById('heroCarousel');
    const openBar = document.querySelector('.region-bar.open-bar');
    const catsEl  = document.querySelector('.cats');
    const dyn     = document.getElementById('dynamicSections');
    if (catsEl && dyn && dyn.children.length) {
      // título "Confira nossas categorias" + categorias na frente de tudo
      if (!document.getElementById('catsHeading')) {
        const heading = document.createElement('div');
        heading.id = 'catsHeading';
        heading.className = 'cats-heading';
        heading.textContent = 'Confira nossas categorias';
        dyn.insertBefore(heading, dyn.firstChild);
        dyn.insertBefore(catsEl, heading.nextSibling); // categorias logo abaixo do título
      } else {
        dyn.insertBefore(catsEl, dyn.firstChild);
      }
    }
    if (hero && openBar) {
      hero.insertAdjacentElement('afterend', openBar); // "Loja aberta" após o banner
    }
  })();

  // Initialize Carousel
  startHeroAutoPlay();
  initHeroCarouselTouch();
  
  // Initialize Popular Tags & Cities
  initPopularTags();
  initCitiesDirectory();

  // ROTEAMENTO POR URL — se a pessoa entrar em /<slug> (ex.: sitelink do Google Ads),
  // abre direto a categoria correspondente.
  (function routeFromUrl() {
    const slug = (location.pathname || '/').replace(/^\/+|\/+$/g, '').toLowerCase();
    if (!slug) return;
    const catId = catForSlug(slug);
    if (catId) { try { openCategory(catId); } catch (e) {} }
  })();
})();
