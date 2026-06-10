// ═══════════════════════════════════════════════════════════════
//  CART.JS — SISTEMA COMPLETO DE COMPRA
//  Fluxo: Produto → Adicionais+Cartinha → Upsell → Carrinho → Checkout
// ═══════════════════════════════════════════════════════════════

// ──────────────── ESTADO GLOBAL ────────────────
const CART = {
  items: [],          // [{product, qty, complements, cardMessage, obs, totalPrice}]
  currentProduct: null,
  selectedComplements: new Set(),
  cardMessage: '',
  premiumCardData: null,
};

// ──────────────── COMPLEMENTOS ────────────────
const COMPLEMENTS = [
  { id: 1, name: 'Cartão com mensagem personalizada', price: 0 },
  { id: 2, name: 'Foto do presente antes da entrega (WhatsApp)', price: 0 },
  { id: 3, name: 'Cartão premium (papel especial/escrito à mão)', price: 9.90 },
  { id: 4, name: 'Laço decorativo premium', price: 7.90 },
  { id: 5, name: 'Embalagem especial para presente', price: 12.90 },
  { id: 6, name: 'Balão de coração metalizado', price: 15.90 },
  { id: 7, name: 'Mini buquê de flores', price: 24.90 },
  { id: 8, name: 'Ferrero Rocher 4 unidades', price: 14.90 },
  { id: 9, name: 'Ferrero Rocher 8 unidades', price: 24.90 },
  { id: 10, name: 'Ferrero Rocher 12 unidades', price: 36.90 },
  { id: 11, name: 'Caixa de Bombom Garoto', price: 19.90 },
  { id: 12, name: 'Raffaello 9 unidades', price: 22.90 },
];

const CARD_TEMPLATES = [
  { title: 'Amor',        color: '#e91e8c', text: 'Com todo meu amor, para você que é especial em minha vida. Que estas flores transmitam o carinho que sinto por você!' },
  { title: 'Namorados',   color: '#c2185b', text: 'Cada dia ao seu lado é um presente. Que estas flores expressem o que as palavras não conseguem dizer. Feliz Dia dos Namorados, meu amor!' },
  { title: 'Dia das Mães', color: '#7b1fa2', text: 'Mãe, este buquê é um pequeno gesto do meu grande amor por você. Obrigado(a) por tudo que faz. Feliz Dia das Mães!' },
  { title: 'Aniversário', color: '#e65100', text: 'Feliz Aniversário! Que seu dia seja tão especial quanto você é para mim. Muitas felicidades nessa nova fase!' },
  { title: 'Agradecimento', color: '#1565c0', text: 'Obrigado(a) por tudo! Essas flores são um pequeno gesto de gratidão pela sua presença e carinho em minha vida.' },
  { title: 'Desculpas',   color: '#2e7d32', text: 'Me perdoe. Essas flores representam meu pedido sincero de desculpas. Você é importante demais para mim.' },
  { title: 'Força',       color: '#37474f', text: 'Estou aqui por você! Que estas flores tragam um sorriso e te lembrem que você nunca está sozinho(a).' },
];

const MIN_ORDER = 20;

// ──────────────── HELPERS ────────────────
function fmt(v) { return 'R$ ' + Number(v).toFixed(2).replace('.', ','); }

function getCartTotal() {
  return CART.items.reduce((s, i) => s + i.totalPrice, 0);
}

function getCartCount() {
  return CART.items.reduce((s, i) => s + i.qty, 0);
}

function getComplementsTotal() {
  return [...CART.selectedComplements].reduce((s, id) => {
    const c = COMPLEMENTS.find(x => x.id === id);
    return s + (c ? c.price : 0);
  }, 0);
}

function updateCartBadge() {
  const count = getCartCount();
  const badge = document.getElementById('cartBadge');
  const btn   = document.getElementById('cartBtn');
  if (!badge) return;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
  if (btn) btn.classList.toggle('has-items', count > 0);
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.classList.remove('visible');
    setTimeout(() => m.remove(), 320);
  });
  document.body.style.overflow = '';
}

function createOverlay(id, content, zIndex = 600) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = id;
  div.className = 'modal-overlay';
  div.style.cssText = `position:fixed;inset:0;z-index:${zIndex};display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0);transition:background .3s;`;
  div.innerHTML = content;
  document.body.appendChild(div);
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    div.style.background = 'rgba(0,0,0,0.52)';
    const sheet = div.querySelector('.bottom-sheet');
    if (sheet) { sheet.style.transform = 'translateY(0)'; }
    div.classList.add('visible');
  });

  div.addEventListener('click', e => {
    if (e.target === div) closeOverlay(id);
  });

  return div;
}

function closeOverlay(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.background = 'rgba(0,0,0,0)';
  const sheet = el.querySelector('.bottom-sheet');
  if (sheet) sheet.style.transform = 'translateY(100%)';
  setTimeout(() => { el.remove(); document.body.style.overflow = ''; }, 320);
}

// ═══════════════════════════════════════════════════════════════
//  1. MODAL DE PRODUTO (adicionais + cartinha)
// ═══════════════════════════════════════════════════════════════
function openProductModal(productId) {
  const p = (window.allProducts || []).find(x => x.id === productId);
  if (!p) return;

  CART.currentProduct = p;
  CART.selectedComplements = new Set();
  CART.cardMessage = '';
  CART.premiumCardData = null;

  const img = (typeof resolveImage === 'function') ? resolveImage(p) : (p.image || '');
  const price = parseFloat(p.price || 0);
  const oldPrice = parseFloat(p.old_price || 0);

  const isTshirt = !!p.is_tshirt;
  window._tshirtSize = 'M';
  window._tshirtColor = p.name.includes('Girlfriend') ? 'Rosa' : 'Off white';
  window._tshirtPhoto = '';

  let customizableSection = '';
  if (isTshirt) {
    const sizes = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG'];
    const colors = ['Rosa', 'Off white', 'Preto', 'Branco'];
    const colorValues = {
      'Rosa': '#f4a0b8',
      'Off white': '#f5f5f0',
      'Preto': '#1a1a1a',
      'Branco': '#ffffff'
    };

    const sizesHtml = sizes.map(s => `
      <button type="button" class="tshirt-size-btn ${s === 'M' ? 'selected' : ''}" onclick="selectTshirtSize('${s}')" id="size-btn-${s}">${s}</button>
    `).join('');

    const colorsHtml = colors.map(c => `
      <button type="button" class="tshirt-swatch ${c === window._tshirtColor ? 'selected' : ''}" onclick="selectTshirtColor('${c}')" id="color-swatch-${c}" style="background-color: ${colorValues[c]};" title="${c}"></button>
    `).join('');

    customizableSection = `
      <div class="pm-section">
        <div class="pm-section-title" style="margin-bottom:8px">Escolha a Cor</div>
        <div class="tshirt-swatch-list" style="display:flex;gap:12px;margin-bottom:8px">${colorsHtml}</div>
        <div class="tshirt-selected-color" style="font-size:12px;color:#6b7280">Cor selecionada: <strong id="tshirtSelectedColorVal" style="color:#e91e8c">${window._tshirtColor}</strong></div>
      </div>

      <div class="pm-section">
        <div class="pm-section-title" style="margin-bottom:8px">Escolha o Tamanho</div>
        <div class="tshirt-size-grid" style="display:flex;flex-wrap:wrap;gap:8px">${sizesHtml}</div>
      </div>

      <div class="pm-section">
        <div class="pm-section-title" style="margin-bottom:8px">Envie sua Foto <span class="pm-obs-opt">(estampa no peito)</span></div>
        <div class="tshirt-upload-zone" id="tshirtUploadZone" onclick="triggerTshirtUpload()" style="border:2px dashed #e91e8c;border-radius:10px;padding:20px;text-align:center;cursor:pointer;background:#fdf2f8;transition:background .2s;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <input type="file" id="tshirtPhotoInput" accept="image/*" style="display:none" onchange="handleTshirtPhoto(event)">
          <div class="tshirt-upload-inner" id="tshirtUploadInner" style="display:flex;flex-direction:column;align-items:center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#e91e8c" stroke-width="2" width="28" height="28" style="margin-bottom:8px">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span class="tshirt-upload-title" style="font-size:13px;font-weight:700;color:#1a1a2e">Clique para enviar a foto</span>
            <span class="tshirt-upload-sub" style="font-size:11px;color:#888;margin-top:2px">Formatos suportados: JPG, PNG</span>
          </div>
          <div class="tshirt-upload-preview-wrap" id="tshirtUploadPreviewWrap" style="display:none;flex-direction:column;align-items:center;width:100%">
            <img id="tshirtPhotoPreview" src="" alt="Preview" style="max-width:120px;max-height:120px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:8px">
            <button type="button" class="tshirt-remove-photo" onclick="removeTshirtPhoto(event)" style="background:#fdf2f8;color:#e91e8c;border:1px solid #f8c8dd;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer">✕ Remover Foto</button>
          </div>
        </div>
      </div>
    `;
  } else {
    const compsHtml = COMPLEMENTS.map(c => `
      <div class="comp-item" id="ci-${c.id}" onclick="toggleComplement(${c.id})">
        <div class="comp-info">
          <span class="comp-name">${c.name}</span>
          ${c.price > 0 ? `<span class="comp-price">+ ${fmt(c.price)}</span>` : '<span class="comp-free">Grátis</span>'}
        </div>
        <div class="comp-check" id="chk-${c.id}"></div>
      </div>`).join('');

    customizableSection = `
      <div class="pm-section">
        <div class="pm-section-hdr">
          <div class="pm-section-hdr-left">
            <div class="pm-section-title">Adicionais</div>
            <div class="pm-section-sub">Selecione até 5 opções</div>
          </div>
          <span class="pm-count" id="compCount">0/5</span>
        </div>
        <div class="pm-comps">${compsHtml}</div>
      </div>
    `;
  }

  const html = `
  <div class="bottom-sheet product-modal-sheet">
    <div class="pm-img-wrap">
      <img src="${img}" alt="${p.name}" onerror="this.style.display='none'">
      <button class="pm-close" onclick="closeOverlay('productModal')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
    </div>
    <div class="pm-body">
      <h2 class="pm-name">${p.name}</h2>
      ${p.description ? `<p class="pm-desc">${p.description}</p>` : ''}
      <div class="pm-prices">
        <span class="pm-price" id="pmPrice">${fmt(price)}</span>
        ${oldPrice > price ? `<span class="pm-old">${fmt(oldPrice)}</span>` : ''}
      </div>

      ${customizableSection}

      <div class="pm-section">
        <div class="pm-section-title pm-obs-title">Observações <span class="pm-obs-opt">(opcional)</span></div>
        <textarea id="pmObs" placeholder="Algum pedido especial? Ex: sem embalagem..." class="pm-obs"></textarea>
        <div class="pm-obs-count"><span id="obsLen">0</span>/200</div>
      </div>

      <div style="height:100px"></div>
    </div>
    <div class="pm-footer">
      <div class="pm-qty">
        <button onclick="pmQty(-1)">−</button>
        <span id="pmQtyVal">1</span>
        <button onclick="pmQty(1)">+</button>
      </div>
      <button class="pm-add-btn" onclick="addToCart()">
        Adicionar · <span id="pmTotal">${fmt(price)}</span>
      </button>
    </div>
  </div>`;

  createOverlay('productModal', html, 600);

  // listeners de obs
  setTimeout(() => {
    const obs = document.getElementById('pmObs');
    if (obs) obs.addEventListener('input', () => {
      document.getElementById('obsLen').textContent = obs.value.length;
    });
    window._pmQty = 1;
    updatePmTotal();
  }, 50);
}

// Tshirt helper functions wired to window
window.selectTshirtSize = function(size) {
  window._tshirtSize = size;
  document.querySelectorAll('.tshirt-size-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.id === 'size-btn-' + size);
  });
};

window.selectTshirtColor = function(color) {
  window._tshirtColor = color;
  document.querySelectorAll('.tshirt-swatch').forEach(btn => {
    btn.classList.toggle('selected', btn.id === 'color-swatch-' + color);
  });
  const valEl = document.getElementById('tshirtSelectedColorVal');
  if (valEl) valEl.textContent = color;

  const p = CART.currentProduct;
  if (p && p.tshirt_images && p.tshirt_images[color]) {
    const sheetImg = document.querySelector('.pm-img-wrap img');
    if (sheetImg) {
      sheetImg.src = p.tshirt_images[color];
    }
  }
};

window.triggerTshirtUpload = function() {
  const input = document.getElementById('tshirtPhotoInput');
  if (input) input.click();
};

window.handleTshirtPhoto = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    window._tshirtPhoto = e.target.result;
    const previewImg = document.getElementById('tshirtPhotoPreview');
    const previewWrap = document.getElementById('tshirtUploadPreviewWrap');
    const innerUpload = document.getElementById('tshirtUploadInner');
    
    if (previewImg) previewImg.src = e.target.result;
    if (previewWrap) previewWrap.style.display = 'flex';
    if (innerUpload) innerUpload.style.display = 'none';
  };
  reader.readAsDataURL(file);
};

window.removeTshirtPhoto = function(event) {
  if (event) event.stopPropagation();
  window._tshirtPhoto = '';
  
  const previewWrap = document.getElementById('tshirtUploadPreviewWrap');
  const innerUpload = document.getElementById('tshirtUploadInner');
  const input = document.getElementById('tshirtPhotoInput');
  
  if (previewWrap) previewWrap.style.display = 'none';
  if (innerUpload) innerUpload.style.display = 'flex';
  if (input) input.value = '';
};

window._pmQty = 1;
window.pmQty = function(delta) {
  window._pmQty = Math.max(1, (window._pmQty || 1) + delta);
  document.getElementById('pmQtyVal').textContent = window._pmQty;
  updatePmTotal();
};

function updatePmTotal() {
  const p = CART.currentProduct;
  if (!p) return;
  const base = parseFloat(p.price || 0) + getComplementsTotal();
  const total = base * (window._pmQty || 1);
  const el = document.getElementById('pmTotal');
  if (el) el.textContent = fmt(total);
  const pe = document.getElementById('pmPrice');
  if (pe) pe.textContent = fmt(base);
}

window.toggleComplement = function(id) {
  // Cartão gratuito → abre modal de cartinha
  if (id === 1) {
    if (CART.selectedComplements.has(1)) {
      CART.selectedComplements.delete(1);
      CART.cardMessage = '';
      refreshCompCheck(1);
    } else {
      openCardModal();
    }
    return;
  }
  // Cartão premium → abre modal premium
  if (id === 3) {
    if (CART.selectedComplements.has(3)) {
      CART.selectedComplements.delete(3);
      CART.premiumCardData = null;
      refreshCompCheck(3);
    } else {
      openPremiumCardModal();
    }
    return;
  }

  if (CART.selectedComplements.size >= 5 && !CART.selectedComplements.has(id)) return;
  if (CART.selectedComplements.has(id)) {
    CART.selectedComplements.delete(id);
  } else {
    CART.selectedComplements.add(id);
  }
  refreshCompCheck(id);
  updateCompCount();
  updatePmTotal();
  if (id === 6) renderBalloonColors();
};

// ── Opções de cor do balão (aparecem quando o balão é selecionado) ──
const BALLOON_COLORS = [
  { name: 'Vermelho', hex: '#e91e8c' },
  { name: 'Rosa',     hex: '#ec4899' },
  { name: 'Dourado',  hex: '#d4af37' },
  { name: 'Prata',    hex: '#c0c0c0' },
  { name: 'Azul',     hex: '#2563eb' },
];
function renderBalloonColors() {
  const item = document.getElementById('ci-6');
  const existing = document.getElementById('balloonColors');
  if (!item || !CART.selectedComplements.has(6)) { if (existing) existing.remove(); return; }
  if (existing) return;
  if (!CART.balloonColor) CART.balloonColor = 'Vermelho';
  const sw = BALLOON_COLORS.map(c =>
    `<button type="button" class="balloon-sw${CART.balloonColor === c.name ? ' selected' : ''}" title="${c.name}" style="background:${c.hex}" onclick="selectBalloonColor('${c.name}')"></button>`
  ).join('');
  item.insertAdjacentHTML('afterend',
    `<div id="balloonColors" class="balloon-colors">
      <span class="balloon-colors-lbl">Escolha a cor do balão: <strong id="balloonColorName">${CART.balloonColor}</strong></span>
      <div class="balloon-swatches">${sw}</div>
    </div>`);
}
window.selectBalloonColor = function(name) {
  CART.balloonColor = name;
  document.querySelectorAll('.balloon-sw').forEach(b => b.classList.toggle('selected', b.title === name));
  const n = document.getElementById('balloonColorName');
  if (n) n.textContent = name;
};

function refreshCompCheck(id) {
  const el = document.getElementById('ci-' + id);
  const chk = document.getElementById('chk-' + id);
  if (!el || !chk) return;
  const sel = CART.selectedComplements.has(id);
  el.classList.toggle('selected', sel);
  chk.innerHTML = sel ? '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '';
}

function updateCompCount() {
  const el = document.getElementById('compCount');
  if (el) el.textContent = `${CART.selectedComplements.size}/5`;
}

window.addToCart = function() {
  const p = CART.currentProduct;
  if (!p) return;

  if (p.is_tshirt && !window._tshirtPhoto) {
    izaToast('Envie uma foto para a estampa da camiseta para continuar.');
    return;
  }

  const qty  = window._pmQty || 1;
  const obs  = (document.getElementById('pmObs') || {}).value || '';
  const compTotal = getComplementsTotal();
  const totalPrice = (parseFloat(p.price || 0) + compTotal) * qty;

  const compNames = [...CART.selectedComplements].map(id => {
    const c = COMPLEMENTS.find(x => x.id === id);
    if (!c) return '';
    if (id === 6) return c.name + ' (' + (CART.balloonColor || 'Vermelho') + ')';
    return c.name;
  }).filter(Boolean);

  let fullObs = obs.trim();
  if (p.is_tshirt) {
    fullObs += (fullObs ? ' | ' : '') + `Tamanho: ${window._tshirtSize} | Cor: ${window._tshirtColor} [Foto Personalizada Inclusa]`;
  } else {
    if (compNames.length) fullObs += (fullObs ? ' | ' : '') + 'Adicionais: ' + compNames.join(', ');
    if (CART.cardMessage) fullObs += '\nCartão: ' + CART.cardMessage;
    if (CART.premiumCardData) fullObs += '\nCartão Premium - Para: ' + (CART.premiumCardData.to || '') + ' | Mensagem: ' + CART.premiumCardData.message;
  }

  const itemObj = { product: p, qty, obs: fullObs, totalPrice };
  if (p.is_tshirt) {
    itemObj.is_tshirt = true;
    itemObj.size = window._tshirtSize;
    itemObj.color = window._tshirtColor;
    itemObj.photo = window._tshirtPhoto;
  }

  CART.items.push(itemObj);
  updateCartBadge();
  closeOverlay('productModal');
  setTimeout(() => openUpsellModal(), 350);
};

// ═══════════════════════════════════════════════════════════════
//  COMPRA RÁPIDA — botão "Comprar agora" do card.
//  Abre os ADICIONAIS/CARTINHAS (modal) e, ao adicionar, vem o UPSELL —
//  exatamente o mesmo fluxo do botão "Adicionar ao Carrinho" da página
//  do produto. (Sem abrir a descrição inteira.)
//  Clicar SOBRE o produto continua abrindo a descrição (openDetail).
// ═══════════════════════════════════════════════════════════════
window.quickBuy = function(id) {
  const p = (window.allProducts || []).find(x => x.id === id);
  if (!p) return;

  // Camisetas e anéis exigem personalização na página → abre o detalhe
  if (p.is_tshirt || p.is_alliance) {
    if (typeof openDetail === 'function') openDetail(id);
    return;
  }

  // Demais produtos: modal de adicionais/cartinhas → ao adicionar, abre o upsell.
  if (typeof openProductModal === 'function') openProductModal(id);
};

// ═══════════════════════════════════════════════════════════════
//  2. MODAL DE CARTINHA (Cartão de Declaração)
// ═══════════════════════════════════════════════════════════════
function openCardModal() {
  const templatesHtml = CARD_TEMPLATES.map((t, i) => `
    <button class="card-tpl-btn" onclick="selectCardTemplate(${i})" style="--tcolor:${t.color}">
      ${t.title}
    </button>`).join('');

  const html = `
  <div class="bottom-sheet card-modal-sheet">
    <div class="cm-handle"></div>
    <div class="cm-header">
      <div class="cm-title">
        <svg viewBox="0 0 24 24" fill="#e91e8c" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        Cartão de Declaração
      </div>
      <button class="cm-close" onclick="closeOverlay('cardModal')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <p class="cm-sub">Escreva uma mensagem especial para o cartão</p>
    </div>
    <div class="cm-body">
      <div class="cm-preview" id="cmPreview">
        <div class="cm-preview-corner cm-preview-tl"></div>
        <div class="cm-preview-corner cm-preview-br"></div>
        <p class="cm-for">Para: <span id="previewTo">Nome do destinatário</span></p>
        <p class="cm-msg" id="previewMsg">Sua mensagem aparecerá aqui...</p>
        <p class="cm-from">Com carinho, <span id="previewFrom">Seu nome</span></p>
      </div>

      <label class="cm-label">Para quem é o presente?</label>
      <input id="cmTo" class="cm-input" placeholder="Ex: Maria, Amor, Mamãe..." oninput="cmUpdatePreview()">

      <label class="cm-label">Modelo de mensagem</label>
      <div class="cm-templates">${templatesHtml}</div>

      <label class="cm-label">Sua mensagem</label>
      <textarea id="cmMsg" class="cm-textarea" placeholder="Escreva aqui sua mensagem especial..." oninput="cmUpdatePreview()"></textarea>
      <div class="cm-char"><span id="cmLen">0</span> caracteres</div>

      <label class="cm-label">Seu nome (remetente)</label>
      <input id="cmFrom" class="cm-input" placeholder="Ex: João, Seu amor, Família Silva..." oninput="cmUpdatePreview()">

      <div style="height:20px"></div>
    </div>
    <div class="cm-footer">
      <button class="cm-save-btn" id="cmSaveBtn" onclick="saveCardMessage()">
        Salvar Mensagem
      </button>
    </div>
  </div>`;

  createOverlay('cardModal', html, 700);
}


window.selectCardTemplate = function(idx) {
  const t = CARD_TEMPLATES[idx];
  const el = document.getElementById('cmMsg');
  if (el) {
    el.value = t.text;
    const len = document.getElementById('cmLen');
    if (len) len.textContent = t.text.length;
  }
  // Destaca o botão ativo
  document.querySelectorAll('.card-tpl-btn').forEach((b, i) => {
    b.classList.toggle('active', i === idx);
  });
  cmUpdatePreview();
};

window.cmUpdatePreview = function() {
  const to   = (document.getElementById('cmTo') || {}).value || '';
  const msg  = (document.getElementById('cmMsg') || {}).value || '';
  const from = (document.getElementById('cmFrom') || {}).value || '';
  const len  = document.getElementById('cmLen');

  if (to)   document.getElementById('previewTo').textContent = to;
  if (msg)  document.getElementById('previewMsg').textContent = msg;
  if (from) document.getElementById('previewFrom').textContent = from;
  if (len && document.getElementById('cmMsg')) len.textContent = document.getElementById('cmMsg').value.length;
};

window.saveCardMessage = function() {
  const to   = (document.getElementById('cmTo')   || {}).value?.trim() || 'Você';
  const msg  = (document.getElementById('cmMsg')  || {}).value?.trim();
  const from = (document.getElementById('cmFrom') || {}).value?.trim() || 'Seu admirador(a)';

  if (!msg) { izaToast('Escreva uma mensagem para o cartão.'); return; }

  const full = `Para: ${to}\n\n${msg}\n\nCom carinho,\n${from}`;
  CART.cardMessage = full;
  CART.selectedComplements.add(1);
  refreshCompCheck(1);
  updateCompCount();
  updatePmTotal();
  closeOverlay('cardModal');
};

// ═══════════════════════════════════════════════════════════════
//  3. MODAL DE CARTÃO PREMIUM
// ═══════════════════════════════════════════════════════════════
function openPremiumCardModal() {
  const papers = [
    { id: 'kraft', label: 'Kraft Rústico', color: '#c8a060' },
    { id: 'perolado', label: 'Perolado Branco', color: '#e8e0d8' },
    { id: 'rosa', label: 'Rosa Metalizado', color: '#f4a0b8' },
    { id: 'dourado', label: 'Dourado Premium', color: '#d4af37' },
    { id: 'texturizado', label: 'Texturizado Marfim', color: '#f0e8d8' },
  ];

  const papersHtml = papers.map(p => `
    <button class="pm2-paper" id="paper-${p.id}" onclick="selectPaper('${p.id}','${p.label}')"
      style="background:${p.color}">
      <span>${p.label}</span>
    </button>`).join('');

  const html = `
  <div class="bottom-sheet card-modal-sheet">
    <div class="cm-header">
      <div class="cm-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2" width="18" height="18"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Cartão Premium (R$ 9,90)
      </div>
      <button class="cm-close" onclick="closeOverlay('premiumModal')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <p class="cm-sub">Cartão escrito à mão em papel especial</p>
    </div>
    <div class="cm-body">
      <label class="cm-label">Tipo de Papel:</label>
      <div class="pm2-papers">${papersHtml}</div>
      <div class="pm2-selected-paper">Selecionado: <span id="pm2PaperLabel">Escolha um papel</span></div>

      <label class="cm-label">Para quem é?</label>
      <input id="pm2To" class="cm-input" placeholder="Nome do destinatário">

      <label class="cm-label">Sua mensagem especial:</label>
      <textarea id="pm2Msg" class="cm-textarea" placeholder="Mensagem que será escrita à mão..." maxlength="400"></textarea>

      <label class="cm-label">Seu nome (remetente):</label>
      <input id="pm2From" class="cm-input" placeholder="Seu nome">

      <div style="height:20px"></div>
    </div>
    <div class="cm-footer">
      <button class="cm-save-btn" onclick="savePremiumCard()" style="background:#9333ea">
        ✉️ Confirmar Cartão Premium
      </button>
    </div>
  </div>`;

  createOverlay('premiumModal', html, 700);
  window._selectedPaper = '';
}

window.selectPaper = function(id, label) {
  window._selectedPaper = id;
  document.getElementById('pm2PaperLabel').textContent = label;
  document.querySelectorAll('.pm2-paper').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('paper-' + id);
  if (btn) btn.classList.add('active');
};

window.savePremiumCard = function() {
  if (!window._selectedPaper) { izaToast('Escolha o tipo de papel.'); return; }
  const msg  = (document.getElementById('pm2Msg')  || {}).value?.trim();
  if (!msg) { izaToast('Escreva uma mensagem.'); return; }

  CART.premiumCardData = {
    paper: window._selectedPaper,
    to: (document.getElementById('pm2To') || {}).value?.trim() || '',
    message: msg,
    from: (document.getElementById('pm2From') || {}).value?.trim() || '',
  };
  CART.selectedComplements.add(3);
  refreshCompCheck(3);
  updateCompCount();
  updatePmTotal();
  closeOverlay('premiumModal');
};

// ═══════════════════════════════════════════════════════════════
//  4. MODAL DE UPSELL
// ═══════════════════════════════════════════════════════════════
function openUpsellModal() {
  const all = window.allProducts || [];
  const current = CART.currentProduct;

  // 2 buquês (cat 25) + 2 ursinhos de menor valor (cat 32)
  const curId = current ? current.id : -1;
  function pick(catId, n, sortLow) {
    let list = all.filter(p => p.active !== 0 && p.id !== curId && p.category_id === catId);
    if (sortLow) list = list.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
    const out = [], seen = new Set();
    for (const p of list) { if (!seen.has(p.name)) { seen.add(p.name); out.push(p); } if (out.length >= n) break; }
    return out;
  }
  // 2 flores com chocolate (cat 27) de menor valor
  const flores = pick(27, 2, true);
  // 2 ursinhos (cat 32) "com coração/amor", de menor valor
  const heartRe = /\bcora[çc][ãa]o|love|amor/i;
  let ursoList = all.filter(p => p.active !== 0 && p.id !== curId && p.category_id === 32 && heartRe.test(p.name))
    .sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
  const ursinhos = [], seenU = new Set();
  for (const p of ursoList) { if (!seenU.has(p.name)) { seenU.add(p.name); ursinhos.push(p); } if (ursinhos.length >= 2) break; }
  if (ursinhos.length < 2) {
    pick(32, 4, true).forEach(p => { if (ursinhos.length < 2 && !seenU.has(p.name)) { seenU.add(p.name); ursinhos.push(p); } });
  }
  let suggestions = [...flores, ...ursinhos];

  const addedIds = new Set();

  const itemsHtml = suggestions.map(p => {
    const img = (typeof resolveImage === 'function') ? resolveImage(p) : (p.image || '');
    return `
    <div class="upsell-item" id="us-${p.id}">
      <img src="${img}" alt="${p.name}" onerror="this.style.display='none'">
      <div class="upsell-info">
        <div class="upsell-name">${p.name}</div>
        <div class="upsell-desc">${(p.description || '').slice(0, 60)}${(p.description || '').length > 60 ? '...' : ''}</div>
        <div class="upsell-price">${fmt(p.price)}</div>
      </div>
      <button class="upsell-add" id="ua-${p.id}" onclick="toggleUpsell(${p.id})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>`;
  }).join('');

  const html = `
  <div class="bottom-sheet upsell-sheet">
    <div class="us-header">
      <div class="us-icon">🛒</div>
      <div>
        <div class="us-title">Que tal alguns adicionais?</div>
        <div class="us-sub">Aproveite nossas ofertas</div>
      </div>
      <button onclick="continueFromUpsell()" style="background:none;border:none;font-size:22px;color:#9ca3af;cursor:pointer">×</button>
    </div>
    <div class="us-items">${itemsHtml}</div>
    <div class="us-footer">
      <button class="us-continue-btn" id="usContinueBtn" onclick="continueFromUpsell()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        <span id="usContinueTxt">Continuar sem adicionais</span>
      </button>
      <div class="us-footer-link">
        <button onclick="continueFromUpsell()" style="background:none;border:none;color:#22c55e;font-size:13px;cursor:pointer;text-decoration:underline">Ver todas as ofertas</button>
      </div>
    </div>
  </div>`;

  window._upsellAdded = new Set();
  window._upsellSuggestions = suggestions;
  createOverlay('upsellModal', html, 650);
}

window.toggleUpsell = function(id) {
  const btn = document.getElementById('ua-' + id);
  const item = document.getElementById('us-' + id);
  if (!btn || !item) return;

  if (window._upsellAdded.has(id)) {
    window._upsellAdded.delete(id);
    CART.items = CART.items.filter(i => i.product.id !== id || i._upsell !== true);
    btn.style.background = '#22c55e';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    item.style.opacity = '1';
  } else {
    window._upsellAdded.add(id);
    const p = (window._upsellSuggestions || []).find(x => x.id === id);
    if (p) CART.items.push({ product: p, qty: 1, obs: '', totalPrice: parseFloat(p.price || 0), _upsell: true });
    btn.style.background = '#16a34a';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>';
    item.style.opacity = '0.8';
  }
  updateCartBadge();
  const count = window._upsellAdded.size;
  const txt = document.getElementById('usContinueTxt');
  if (txt) txt.textContent = count === 0
    ? 'Continuar sem adicionais'
    : `Continuar com ${count} item${count > 1 ? 's' : ''} adicionado${count > 1 ? 's' : ''}`;
};

window.continueFromUpsell = function() {
  updateCartBadge();
  closeOverlay('upsellModal');
  setTimeout(() => openCartSheet(), 350);
};

// ═══════════════════════════════════════════════════════════════
//  5. CARRINHO (bottom sheet)
// ═══════════════════════════════════════════════════════════════
function openCartSheet() {
  renderCartSheet();
}

function renderCartSheet() {
  const items = CART.items;
  const subtotal = getCartTotal();
  const canCheckout = subtotal >= MIN_ORDER;
  const remaining = MIN_ORDER - subtotal;
  const pct = Math.min(100, (subtotal / MIN_ORDER) * 100);

  const itemsHtml = items.length === 0 ? `
    <div class="cart-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" width="52" height="52"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
      <p>Seu carrinho est\u00e1 vazio</p>
      <small>Adicione produtos para continuar</small>
    </div>` : items.map((item, idx) => {
    const itemImg = item.is_tshirt && item.product.tshirt_images && item.product.tshirt_images[item.color] 
      ? item.product.tshirt_images[item.color] 
      : ((typeof resolveImage === 'function' ? resolveImage(item.product) : item.product.image) || '');
    
    let tshirtDetailsHtml = '';
    if (item.is_tshirt) {
      tshirtDetailsHtml = `
        <div class="cart-item-tshirt-details" style="display:flex;align-items:center;gap:8px;margin-top:4px;margin-bottom:4px;">
          <span style="font-size:11px;background:#fce7f3;color:#9d174d;padding:2px 6px;border-radius:4px;font-weight:600">Tam: ${item.size}</span>
          <span style="font-size:11px;background:#f3f4f6;color:#374151;padding:2px 6px;border-radius:4px;font-weight:600">Cor: ${item.color}</span>
          ${item.photo ? `<div style="position:relative;display:flex;align-items:center;gap:4px"><img src="${item.photo}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;border:1.5px solid #e91e8c"><span style="font-size:10px;color:#e91e8c;font-weight:700">Foto</span></div>` : ''}
        </div>
      `;
    }

    let allianceDetailsHtml = '';
    if (item.is_alliance) {
      allianceDetailsHtml = `
        <div class="cart-item-alliance-details">
          <div class="cart-item-alliance-row">
            <strong>Masc:</strong> Aro ${item.maleSize} ${item.maleText ? `(<span class="alliance-txt-val">"${item.maleText}"</span>)` : ''}
          </div>
          <div class="cart-item-alliance-row">
            <strong>Fem:</strong> Aro ${item.femaleSize} ${item.femaleText ? `(<span class="alliance-txt-val">"${item.femaleText}"</span>)` : ''}
          </div>
          <div class="cart-item-alliance-row">
            <strong>Solitário:</strong> ${item.solitaireOption} (Aro ${item.solitaireSize})
          </div>
        </div>
      `;
    }

    return `
    <div class="cart-item" id="cartItem${idx}">
      <img src="${itemImg}" alt="${item.product.name}" onerror="this.style.display='none'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.product.name}</div>
        ${tshirtDetailsHtml}
        ${allianceDetailsHtml}
        ${item.obs && !item.is_tshirt && !item.is_alliance ? `<div class="cart-item-obs">${item.obs.slice(0, 60)}${item.obs.length > 60 ? '...' : ''}</div>` : ''}
        ${item.obs && item.is_tshirt && item.obs.replace(/Tamanho:.*Cor:.*\[Foto.*\].*/, '').trim() ? `<div class="cart-item-obs">${item.obs.replace(/Tamanho:.*Cor:.*\[Foto.*\].*/, '').trim().slice(0, 60)}</div>` : ''}
        <div class="cart-item-row">
          <div class="cart-item-price">${fmt(item.totalPrice)}</div>
          <div class="cart-item-controls">
            <button onclick="cartQty(${idx}, -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="cartQty(${idx}, 1)">+</button>
            <button class="cart-remove" onclick="cartRemove(${idx})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  const footerHtml = items.length === 0 ? '' : `
    <div class="cart-footer">
      ${!canCheckout ? `
        <div class="cart-progress">
          <div class="cart-prog-txt">Faltam <strong>${fmt(remaining)}</strong> para o pedido mínimo de ${fmt(MIN_ORDER)}</div>
          <div class="cart-prog-bar"><div class="cart-prog-fill" style="width:${pct}%"></div></div>
        </div>` : ''}
      <div class="cart-totals">
        <span>Subtotal</span><span>${fmt(subtotal)}</span>
      </div>
      <div class="cart-total-row">
        <span>Total</span><span class="cart-total-val">${fmt(subtotal)}</span>
      </div>
      <button class="cart-checkout-btn ${canCheckout ? '' : 'disabled'}" onclick="${canCheckout ? 'goToCheckout()' : ''}">
        ${canCheckout ? 'Finalizar Pedido' : `Adicione mais ${fmt(remaining)}`}
      </button>
    </div>`;

  const html = `
  <div class="bottom-sheet cart-sheet">
    <div class="cart-header">
    <h2 class="cart-h2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        Seu Carrinho
      </h2>
      <div class="cart-header-btns">
        ${items.length > 0 ? `<button class="cart-clear-btn" onclick="izaConfirm('Deseja limpar o carrinho?', cartClear)">Limpar</button>` : ''}
        <button onclick="closeOverlay('cartSheet')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <div class="cart-items">${itemsHtml}</div>
    ${footerHtml}
  </div>`;

  const existing = document.getElementById('cartSheet');
  if (existing) { existing.remove(); }
  createOverlay('cartSheet', html, 550);
}

window.cartQty = function(idx, delta) {
  const item = CART.items[idx];
  if (!item) return;
  const base = item.totalPrice / item.qty;
  item.qty = Math.max(1, item.qty + delta);
  item.totalPrice = base * item.qty;
  updateCartBadge();
  renderCartSheet();
};

window.cartRemove = function(idx) {
  CART.items.splice(idx, 1);
  updateCartBadge();
  renderCartSheet();
};

window.cartClear = function() {
  CART.items = [];
  updateCartBadge();
  closeOverlay('cartSheet');
};

window.goToCheckout = function() {
  closeOverlay('cartSheet');
  setTimeout(openCheckout, 350);
};

// ═══════════════════════════════════════════════════════════════
//  6. CHECKOUT (tela cheia)
// ═══════════════════════════════════════════════════════════════
function openCheckout() {
  const items = CART.items;
  const subtotal = getCartTotal();

  const html = `
  <div id="checkoutScreen" class="checkout-screen">
    <!-- Header -->
    <div class="co-header">
      <button id="coBackBtn" onclick="checkoutBack()" class="co-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="22" height="22"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="co-title">Finalizar Pedido</span>
    </div>

    <div class="co-body">
      <!-- Resumo colapsável -->
      <div class="co-card" id="coSummaryCard">
        <div class="co-summary-hdr" onclick="toggleSummary()">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ea3434" stroke-width="2" width="20" height="20"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          <span id="coSummaryLbl">Mostrar resumo do pedido</span>
          <span class="co-sum-total">${fmt(subtotal)}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" width="17" height="17" id="coChevron"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div id="coSummaryBody" style="display:none">
          ${items.map(i => {
            const itemImg = i.is_tshirt && i.product.tshirt_images && i.product.tshirt_images[i.color] 
              ? i.product.tshirt_images[i.color] 
              : ((typeof resolveImage === 'function' ? resolveImage(i.product) : i.product.image) || '');
            
            let tshirtSummaryDetails = '';
            if (i.is_tshirt) {
              tshirtSummaryDetails = `
                <div style="font-size:11px;color:#9d174d;font-weight:600;margin-top:2px;display:flex;align-items:center;gap:6px">
                  <span>Tamanho: ${i.size}</span>
                  <span>|</span>
                  <span>Cor: ${i.color}</span>
                  ${i.photo ? `
                  <span>|</span>
                  <span style="display:flex;align-items:center;gap:3px">
                    <img src="${i.photo}" style="width:14px;height:14px;border-radius:50%;object-fit:cover;border:1px solid #e91e8c">
                    Foto inclusa
                  </span>` : ''}
                </div>
              `;
            }

            let allianceSummaryDetails = '';
            if (i.is_alliance) {
              allianceSummaryDetails = `
                <div style="font-size:11px;color:#4b5563;margin-top:4px;background:#fdf2f8;border-left:2px solid #e91e8c;padding:4px 6px;border-radius:4px;font-family:'DM Sans',sans-serif;line-height:1.4">
                  <div><strong>Masc:</strong> Aro ${i.maleSize} ${i.maleText ? `("${i.maleText}")` : ''}</div>
                  <div><strong>Fem:</strong> Aro ${i.femaleSize} ${i.femaleText ? `("${i.femaleText}")` : ''}</div>
                  <div><strong>Solitário:</strong> ${i.solitaireOption} (Aro ${i.solitaireSize})</div>
                </div>
              `;
            }
            
            return `
            <div class="co-sum-item">
              <img src="${itemImg}" alt="" onerror="this.style.display='none'">
              <div style="flex:1;min-width:0">
                <div class="co-sum-name">${i.product.name}</div>
                ${tshirtSummaryDetails}
                ${allianceSummaryDetails}
                <div class="co-sum-qty">Qtd: ${i.qty}</div>
                <div class="co-sum-price">${fmt(i.totalPrice)}</div>
              </div>
            </div>`;
          }).join('')}
          <div class="co-sum-totals">
            <div><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
            <div><span>Frete</span><span class="co-free">Grátis</span></div>
            <div class="co-sum-final"><span>Total</span><span>${fmt(subtotal)}</span></div>
          </div>
        </div>
      </div>

      <!-- Steps progress -->
      <div class="co-steps">
        <div class="co-step active" id="coStep1Dot"><div class="co-step-dot"><span>1</span></div><div class="co-step-lbl">Dados de Entrega</div></div>
        <div class="co-step-line" id="coStepLine"></div>
        <div class="co-step" id="coStep2Dot"><div class="co-step-dot"><span>2</span></div><div class="co-step-lbl">Pagamento</div></div>
      </div>

      <div id="coError" class="co-error" style="display:none"></div>

      <!-- Passo 1: Dados de entrega -->
      <div id="coStep1" class="co-card">
        <div class="co-section-title">Detalhes de entrega</div>

        <label class="co-lbl">Nome Completo</label>
        <input id="coName" class="co-input" placeholder="Ex: João da Silva">

        <label class="co-lbl">Telefone (WhatsApp)</label>
        <input id="coPhone" class="co-input" placeholder="(00) 00000-0000" oninput="this.value=fmtPhone(this.value)" inputmode="tel">

        <label class="co-lbl">Email</label>
        <input id="coEmail" class="co-input" placeholder="seu@email.com" type="email">

        <div class="co-divider">
          Endereço de Entrega
        </div>


        <div class="co-grid-2">
          <div>
            <label class="co-lbl">CEP</label>
            <input id="coCEP" class="co-input" placeholder="00000-000" maxlength="9" oninput="this.value=fmtCEP(this.value);fetchCEP(this.value)" inputmode="numeric">
          </div>
          <div>
            <label class="co-lbl">Rua</label>
            <input id="coStreet" class="co-input" placeholder="Ex: Av. Paulista">
          </div>
        </div>

        <div class="co-grid-2">
          <div>
            <label class="co-lbl">Número</label>
            <input id="coNumber" class="co-input" placeholder="Ex: 123" id2="nonum">
            <label class="co-check-lbl"><input type="checkbox" onchange="document.getElementById('coNumber').value=this.checked?'S/N':'';document.getElementById('coNumber').disabled=this.checked"> Sem número</label>
          </div>
          <div>
            <label class="co-lbl">Bairro</label>
            <input id="coNeigh" class="co-input" placeholder="Ex: Centro">
          </div>
        </div>

        <div class="co-grid-2">
          <div>
            <label class="co-lbl">Cidade</label>
            <input id="coCity" class="co-input" placeholder="Ex: São Paulo">
          </div>
          <div>
            <label class="co-lbl">Estado</label>
            <input id="coState" class="co-input" placeholder="SP" maxlength="2" oninput="this.value=this.value.toUpperCase()">
          </div>
        </div>

        <button class="co-primary-btn" onclick="goToPayment()">Confirmar endereço</button>
      </div>

      <!-- Passo 2: Pagamento -->
      <div id="coStep2" style="display:none">
        <div class="co-card">
          <div class="co-delivery-info" id="coDeliveryInfo"></div>

          <div class="co-section-title" style="margin-top:16px">Opções de entrega</div>
          <div class="co-freight-opt selected" id="fr-slow" onclick="selectFreight('slow')">
            <div><div class="co-fr-name">Hoje, 35 – 45 min</div><div class="co-fr-sub">Padrão</div></div>
            <span class="co-fr-free">GRÁTIS</span>
            <div class="co-radio-dot selected" id="rd-slow"></div>
          </div>
          <div class="co-freight-opt" id="fr-fast" onclick="selectFreight('fast')">
            <div><div class="co-fr-name">Hoje, 19 – 29 min</div><div class="co-fr-sub">Rápida</div></div>
            <span class="co-fr-price">R$ 5,89</span>
            <div class="co-radio-dot" id="rd-fast"></div>
          </div>
          <div class="co-freight-opt" id="fr-sched" onclick="selectFreight('sched')">
            <div>
              <div class="co-fr-name" id="frSchedName">Agendar entrega</div>
              <div class="co-fr-sub">Escolha o dia e horário</div>
            </div>
            <span class="co-fr-free">GRÁTIS</span>
            <div class="co-radio-dot" id="rd-sched"></div>
            <div id="schedFields" style="display:none;grid-column:1/-1;padding-top:10px">
              <label class="co-lbl" style="font-size:11px;margin:0 0 4px">Data da entrega</label>
              <input type="date" id="schedDate" class="co-input" style="font-size:14px;width:100%;margin:0 0 12px" onchange="updateSchedLabel()">
              <label class="co-lbl" style="font-size:11px;margin:0 0 4px">Horário</label>
              <select id="schedTime" class="co-input sched-select" style="font-size:14px;width:100%;margin:0" onchange="updateSchedLabel()">
                <option value="">Selecione o horário</option>
                <option>08:00 - 10:00</option>
                <option>10:00 - 12:00</option>
                <option>12:00 - 14:00</option>
                <option>14:00 - 16:00</option>
                <option>16:00 - 18:00</option>
                <option>18:00 - 20:00</option>
              </select>
            </div>
          </div>
        </div>

        <div class="co-card">
          <div class="co-section-title">Forma de pagamento</div>
          <div class="co-pay-opt" id="pay-pix" onclick="selectPayment('pix')">
            <div class="co-pay-icon">
              <img src="https://logospng.org/download/pix/logo-pix-icone-512.png" width="28" height="28" alt="PIX">
            </div>
            <div class="co-pay-info"><div class="co-pay-name">PIX</div><div class="co-pay-sub" style="color:#4db6ac">Pagamento instantâneo</div></div>
            <div class="co-radio-dot" id="rp-pix"></div>
          </div>
          <div class="co-pay-opt" id="pay-card" onclick="selectPayment('card')">
            <div class="co-pay-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" width="24" height="24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <div class="co-pay-info"><div class="co-pay-name">Cartão de Crédito</div><div class="co-pay-sub">Todas as bandeiras</div></div>
            <div class="co-radio-dot" id="rp-card"></div>
          </div>
          <div id="cardFields" style="display:none;margin-top:12px">
            <label class="co-lbl">Número do Cartão</label>
            <input id="ccNum" class="co-input" placeholder="0000 0000 0000 0000" oninput="this.value=fmtCard(this.value)" inputmode="numeric">
            <label class="co-lbl">Nome no Cartão</label>
            <input id="ccName" class="co-input" placeholder="NOME COMO ESTÁ NO CARTÃO" oninput="this.value=this.value.toUpperCase()">
            <div class="co-grid-2">
              <div><label class="co-lbl">Validade</label><input id="ccExpiry" class="co-input" placeholder="MM/AA" maxlength="5" oninput="this.value=fmtExpiry(this.value)" inputmode="numeric"></div>
              <div><label class="co-lbl">CVV</label><input id="ccCvv" class="co-input" placeholder="000" maxlength="4" inputmode="numeric"></div>
            </div>
          </div>

          <label class="co-lbl" style="margin-top:14px">CPF do Comprador</label>
          <input id="coCPF" class="co-input" placeholder="000.000.000-00" oninput="this.value=fmtCPF(this.value)" inputmode="numeric">

          <div class="co-totals-box">
            <div class="co-total-line"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
            <div class="co-total-line"><span>Frete</span><span id="coFreightVal" style="color:#10b981">Grátis</span></div>
            <div class="co-total-final"><span>Total</span><span id="coFinalVal">${fmt(subtotal)}</span></div>
          </div>

          <button class="co-primary-btn" onclick="confirmOrder()">Confirmar Pedido</button>
          <div class="co-secure">Pagamento 100% seguro</div>
        </div>
      </div>

      <!-- PIX -->
      <div id="coPixStep" style="display:none">
        <div class="co-card co-pix-card">
          <div class="co-pix-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" width="52" height="52"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h3 class="co-pix-title">Pedido Confirmado!</h3>
          <p class="co-pix-sub">Escaneie o QR Code ou copie o código PIX para finalizar o pagamento</p>
          <div class="co-pix-qr">
            <div id="coQRCode" class="co-qr-box"></div>
          </div>
          <div class="co-pix-code-wrap">
            <div class="co-pix-code" id="coPixCode">Gerando código PIX...</div>
            <button class="co-copy-btn" onclick="copyPix()" id="coCopyBtn">
              Copiar c\u00f3digo PIX
            </button>
          </div>
          <div class="co-pix-info">O código PIX expira em 30 minutos. A confirmação do pagamento é automática.</div>

          <div class="co-trust">
            <div class="co-trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <span>SSL<b>256-bit</b></span>
            </div>
            <div class="co-trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
              <span>Compra<b>Garantida</b></span>
            </div>
            <div class="co-trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><circle cx="12" cy="16" r="1.4"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <span>Dados<b>Criptografados</b></span>
            </div>
          </div>
          <div class="co-secure-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            Pagamento processado em ambiente 100% seguro e protegido
          </div>
        </div>
      </div>

    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);
  document.body.style.overflow = 'hidden';
  window._freightType = 'slow';
  window._paymentMethod = null;
  window._coData = {};
}

window.checkoutBack = function() {
  const s2 = document.getElementById('coStep2');
  if (s2 && s2.style.display !== 'none') {
    document.getElementById('coStep1').style.display = '';
    s2.style.display = 'none';
    updateCoSteps(1);
    return;
  }
  const screen = document.getElementById('checkoutScreen');
  if (screen) screen.remove();
  document.body.style.overflow = '';
};

function updateCoSteps(active) {
  const d1 = document.getElementById('coStep1Dot');
  const d2 = document.getElementById('coStep2Dot');
  const line = document.getElementById('coStepLine');
  if (!d1) return;
  d1.classList.toggle('active', true);
  d2.classList.toggle('active', active === 2);
  if (line) line.classList.toggle('active', active === 2);
  // Check mark step 1 when on step 2
  const dot1 = d1.querySelector('.co-step-dot');
  if (dot1) dot1.innerHTML = active === 2
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>'
    : '<span>1</span>';
}

window.toggleSummary = function() {
  const body = document.getElementById('coSummaryBody');
  const lbl  = document.getElementById('coSummaryLbl');
  const chev = document.getElementById('coChevron');
  if (!body) return;
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : '';
  if (lbl) lbl.textContent = open ? 'Mostrar resumo do pedido' : 'Ocultar resumo do pedido';
  if (chev) chev.style.transform = open ? '' : 'rotate(180deg)';
};

// CEP auto-fill
window.fetchCEP = async function(val) {
  const digits = val.replace(/\D/g, '');
  if (digits.length !== 8) return;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const d = await r.json();
    if (!d.erro) {
      if (d.logradouro) document.getElementById('coStreet').value = d.logradouro;
      if (d.bairro)     document.getElementById('coNeigh').value  = d.bairro;
      if (d.localidade) document.getElementById('coCity').value   = d.localidade;
      if (d.uf)         document.getElementById('coState').value  = d.uf;
    }
  } catch {}
};

// Formatadores
window.fmtCPF = v => { const d = v.replace(/\D/g,'').slice(0,11); if(d.length<=3)return d; if(d.length<=6)return d.slice(0,3)+'.'+d.slice(3); if(d.length<=9)return d.slice(0,3)+'.'+d.slice(3,6)+'.'+d.slice(6); return d.slice(0,3)+'.'+d.slice(3,6)+'.'+d.slice(6,9)+'-'+d.slice(9); };
window.fmtPhone = v => { const d = v.replace(/\D/g,'').slice(0,11); if(d.length<=2)return '('+d; if(d.length<=7)return '('+d.slice(0,2)+') '+d.slice(2); return '('+d.slice(0,2)+') '+d.slice(2,7)+'-'+d.slice(7); };
window.fmtCEP = v => { const d = v.replace(/\D/g,'').slice(0,8); if(d.length<=5)return d; return d.slice(0,5)+'-'+d.slice(5); };
window.fmtCard = v => v.replace(/\D/g,'').slice(0,16).replace(/(\d{4})(?=\d)/g,'$1 ').trim();
window.fmtExpiry = v => { const d = v.replace(/\D/g,'').slice(0,4); if(d.length<=2)return d; return d.slice(0,2)+'/'+d.slice(2); };

function validateCPF(cpf) {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i);
  let r = (s * 10) % 11; if (r === 10) r = 0;
  if (r !== parseInt(d[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i);
  r = (s * 10) % 11; if (r === 10) r = 0;
  return r === parseInt(d[10]);
}

function showCoError(msg) {
  const el = document.getElementById('coError');
  if (!el) return;
  el.textContent = msg;
  el.style.display = '';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Limpa erros inline dos campos
function clearFieldErrors() {
  document.querySelectorAll('.co-field-error').forEach(e => e.remove());
  document.querySelectorAll('.co-input-error').forEach(e => e.classList.remove('co-input-error'));
  const ge = document.getElementById('coError'); if (ge) ge.style.display = 'none';
}

// Mostra mensagem vermelha logo ABAIXO do campo (sem emote)
function showFieldError(fieldId, msg) {
  const input = document.getElementById(fieldId);
  if (!input) { showCoError(msg); return; }
  let err = input.parentElement.querySelector('.co-field-error[data-for="' + fieldId + '"]');
  if (!err) {
    err = document.createElement('div');
    err.className = 'co-field-error';
    err.setAttribute('data-for', fieldId);
    input.insertAdjacentElement('afterend', err);
  }
  err.textContent = msg;
  input.classList.add('co-input-error');
  try { input.focus(); } catch (e) {}
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

window.goToPayment = function() {
  const name  = (document.getElementById('coName')   || {}).value || '';
  const phone = (document.getElementById('coPhone')  || {}).value || '';
  const email = (document.getElementById('coEmail')  || {}).value || '';
  const cep   = (document.getElementById('coCEP')    || {}).value || '';
  const addr  = (document.getElementById('coStreet') || {}).value || '';
  const num   = (document.getElementById('coNumber') || {}).value || '';
  const neigh = (document.getElementById('coNeigh')  || {}).value || '';
  const city  = (document.getElementById('coCity')   || {}).value || '';
  const state = (document.getElementById('coState')  || {}).value || '';

  clearFieldErrors();
  const nameParts = name.trim().split(/\s+/).filter(p => p.length >= 2);
  if (nameParts.length < 2) { showFieldError('coName', 'Digite seu nome completo (nome e sobrenome)'); return; }
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 10) { showFieldError('coPhone', 'Telefone inválido. Use DDD + número'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { showFieldError('coEmail', 'Email inválido'); return; }
  if (cep.replace(/\D/g, '').length !== 8) { showFieldError('coCEP', 'CEP inválido'); return; }
  if (!addr.trim()) { showFieldError('coStreet', 'Preencha o endereço'); return; }
  if (!num.trim()) { showFieldError('coNumber', 'Preencha o número'); return; }
  if (!neigh.trim()) { showFieldError('coNeigh', 'Preencha o bairro'); return; }
  if (!city.trim()) { showFieldError('coCity', 'Preencha a cidade'); return; }

  // Salvar dados para o WhatsApp
  window._coData = { cpf: '', name, phone, email, cep, addr, num, neigh, city, state };

  // Atualizar resumo na tela de pagamento
  document.getElementById('coDeliveryInfo').innerHTML = `
    <div class="co-del-row">
      <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" width="18" height="18"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <div><div class="co-del-name">${name}</div><div class="co-del-sub">${email} · ${phone}</div></div>
    </div>
    <div class="co-del-row" style="margin-top:8px">
      <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" width="18" height="18"><path d="M12 2C8 2 4 6 4 10c0 5 8 12 8 12s8-7 8-12c0-4-4-8-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
      <div>
        <div class="co-del-name">${addr}, ${num}</div>
        <div class="co-del-sub">${neigh} · ${city} · ${state} · CEP ${cep}</div>
      </div>
      <button onclick="backToStep1()" class="co-trocar" title="Editar endereço" aria-label="Editar endereço"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
    </div>`;

  document.getElementById('coError').style.display = 'none';
  document.getElementById('coStep1').style.display = 'none';
  document.getElementById('coStep2').style.display = '';
  updateCoSteps(2);
  document.querySelector('.co-body').scrollTop = 0;

  // Pré-aquece a função do PIX (evita cold start na hora de confirmar).
  try { fetch((window.PIX_API_BASE || '') + '/api/pix-create', { method: 'GET', cache: 'no-store' }).catch(function () {}); } catch (e) {}
};

window.backToStep1 = function() {
  document.getElementById('coStep1').style.display = '';
  document.getElementById('coStep2').style.display = 'none';
  updateCoSteps(1);
};

window.selectFreight = function(type) {
  window._freightType = type;
  ['slow','fast','sched'].forEach(t => {
    const opt = document.getElementById('fr-' + t);
    const rd  = document.getElementById('rd-' + t);
    if (opt) opt.classList.toggle('selected', t === type);
    if (rd)  rd.classList.toggle('selected', t === type);
  });
  const sf = document.getElementById('schedFields');
  if (sf) sf.style.display = type === 'sched' ? '' : 'none';
  // Data mínima = hoje (não permite escolher dias anteriores)
  if (type === 'sched') {
    const sd = document.getElementById('schedDate');
    if (sd) {
      const n = new Date();
      const hoje = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
      sd.min = hoje;
      if (!sd.value || sd.value < hoje) sd.value = hoje;
    }
  }
  const v = type === 'fast' ? 5.89 : 0;
  const coFreight = document.getElementById('coFreightVal');
  const coFinal   = document.getElementById('coFinalVal');
  if (coFreight) coFreight.innerHTML = v > 0 ? fmt(v) : '<span style="color:#10b981">Grátis</span>';
  if (coFinal)   coFinal.textContent = fmt(getCartTotal() + v);
};

window.updateSchedLabel = function() {
  const d = (document.getElementById('schedDate') || {}).value;
  const t = (document.getElementById('schedTime') || {}).value;
  const el = document.getElementById('frSchedName');
  if (!el) return;
  if (d) {
    const [y, m, day] = d.split('-');
    el.textContent = `${day}/${m}/${y}${t ? ' às ' + t : ''}`;
  } else {
    el.textContent = 'Agendar entrega';
  }
};

window.selectPayment = function(type) {
  window._paymentMethod = type;
  ['pix','card'].forEach(t => {
    const opt = document.getElementById('pay-' + t);
    const rd  = document.getElementById('rp-' + t);
    if (opt) opt.classList.toggle('selected', t === type);
    if (rd)  rd.classList.toggle('selected', t === type);
  });
  const cf = document.getElementById('cardFields');
  if (cf) cf.style.display = type === 'card' ? '' : 'none';
};

// Modal "Pagamento Temporariamente Indisponível" (cartão) → redireciona para PIX
function showCardUnavailableModal() {
  const old = document.getElementById('cardUnavailModal');
  if (old) old.remove();
  const ov = document.createElement('div');
  ov.id = 'cardUnavailModal';
  ov.className = 'card-unavail-overlay';
  ov.innerHTML = `
    <div class="card-unavail-box">
      <div class="card-unavail-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="34" height="34"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <div class="card-unavail-title">Pagamento Temporariamente Indisponível</div>
      <div class="card-unavail-text">Devido a instabilidade no sistema bancário, o pagamento via cartão de crédito está temporariamente indisponível.</div>
      <div class="card-unavail-sub">Você será redirecionado para pagamento via <strong>PIX</strong> em instantes...</div>
      <div class="card-unavail-dots"><span></span><span></span><span></span></div>
    </div>`;
  document.body.appendChild(ov);
  setTimeout(() => { ov.remove(); selectPayment('pix'); }, 3500);
}

window.confirmOrder = function() {
  clearFieldErrors();
  if (!window._paymentMethod) { showCoError('Selecione uma forma de pagamento'); return; }

  // CPF do comprador (agora nesta etapa de pagamento)
  const cpf = (document.getElementById('coCPF') || {}).value || '';
  if (!cpf.trim()) { showFieldError('coCPF', 'Preencha o CPF do comprador'); return; }
  if (!validateCPF(cpf)) { showFieldError('coCPF', 'CPF inválido. Verifique os números.'); return; }
  if (window._coData) window._coData.cpf = cpf;

  // Cartão: redireciona para PIX após animação
  if (window._paymentMethod === 'card') {
    const num = (document.getElementById('ccNum') || {}).value?.replace(/\s/g, '') || '';
    const name = (document.getElementById('ccName') || {}).value?.trim() || '';
    const exp = (document.getElementById('ccExpiry') || {}).value || '';
    const cvv = (document.getElementById('ccCvv') || {}).value || '';
    if (num.length < 16 || !name || exp.length < 5 || cvv.length < 3) {
      showCoError('Preencha todos os dados do cartão'); return;
    }
    showCardUnavailableModal();
    return;
  }

  // PIX
  showPixScreen();
};

// Gera o QR Code do PIX NO NAVEGADOR (instantâneo, sem requisição externa).
// Fallback para imagem do gateway / serviço externo se a lib não estiver disponível.
function renderPixQr(qr, code, url) {
  try {
    if (typeof qrcode === 'function' && code) {
      const q = qrcode(0, 'M');
      q.addData(code);
      q.make();
      qr.innerHTML = q.createImgTag(5, 4);
      const im = qr.querySelector('img');
      if (im) { im.style.width = '180px'; im.style.height = '180px'; im.alt = 'QR Code PIX'; }
      return;
    }
  } catch (e) {}
  const src = url || ('https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(code));
  qr.innerHTML = '<img src="' + src + '" alt="QR Code PIX" style="width:180px;height:180px">';
}

// Base do backend (mesmo domínio na Vercel). Pode ser sobrescrito com window.PIX_API_BASE.
async function showPixScreen() {
  document.getElementById('coStep2').style.display = 'none';
  const pixStep = document.getElementById('coPixStep');
  if (pixStep) pixStep.style.display = '';

  const codeEl = document.getElementById('coPixCode');
  const qr = document.getElementById('coQRCode');
  if (codeEl) codeEl.textContent = 'Gerando seu código PIX seguro...';
  if (qr) qr.innerHTML = '<div class="co-pix-loading"><div class="co-spinner"></div><span>Gerando PIX em ambiente seguro...</span></div>';

  const base = (window.PIX_API_BASE || '');
  const d = window._coData || {};

  // Cada item leva o NOME DO PRODUTO para o gate (title).
  const items = (CART.items || []).map(i => ({
    title: (i.product && i.product.name) ? i.product.name : 'Produto',
    unitPrice: (i.qty && i.totalPrice) ? (i.totalPrice / i.qty) : parseFloat((i.product && i.product.price) || 0),
    quantity: i.qty || 1
  }));

  const reqBody = {
    customer: {
      name: d.name || '',
      email: d.email || '',
      phone: (d.phone || '').replace(/\D/g, ''),
      document: { number: (d.cpf || '').replace(/\D/g, ''), type: 'cpf' }
    },
    items,
    externalId: 'pedido_' + Date.now()
  };

  try {
    const resp = await fetch(base + '/api/pix-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.qrCode) {
      const motivo = data.error || ('HTTP ' + resp.status);
      const det = data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : '';
      throw new Error(motivo + (det ? ' — ' + det : ''));
    }

    window._pixCode = data.qrCode;          // copia-e-cola real
    window._pixTxId = data.id;
    if (codeEl) codeEl.textContent = data.qrCode;
    if (qr) renderPixQr(qr, data.qrCode, data.qrCodeUrl);
    startPixPolling(data.id);
  } catch (e) {
    if (codeEl) codeEl.textContent = '';
    if (qr) {
      qr.innerHTML = `<div style="padding:14px;color:#c2185b;font-size:12px;text-align:left;line-height:1.5;word-break:break-word">
        <b>Não foi possível gerar o PIX.</b><br>${(e.message || '').replace(/</g, '&lt;')}</div>`;
    }
  }
}

// Consulta o status a cada 5s (fallback do webhook). Para ao confirmar/expirar.
function startPixPolling(id) {
  if (!id) return;
  const base = (window.PIX_API_BASE || '');
  clearInterval(window._pixPoll);
  let attempts = 0;
  window._pixPoll = setInterval(async () => {
    if (++attempts > 120) { clearInterval(window._pixPoll); return; }   // ~10 min
    try {
      const r = await fetch(base + '/api/pix-status?transaction_id=' + encodeURIComponent(id));
      const d = await r.json().catch(() => ({}));
      if (d.status === 'paid') { clearInterval(window._pixPoll); onPixPaid(); }
      else if (['failed', 'expired', 'refunded'].includes(d.status)) { clearInterval(window._pixPoll); }
    } catch (_) {}
  }, 5000);
}

function onPixPaid() {
  const title = document.querySelector('.co-pix-title');
  if (title) title.textContent = 'Pagamento confirmado!';
  const sub = document.querySelector('.co-pix-sub');
  if (sub) sub.textContent = 'Recebemos seu pagamento. Em breve entraremos em contato pelo WhatsApp.';
}

window.copyPix = async function() {
  const code = window._pixCode || '';
  try {
    if (navigator.clipboard) await navigator.clipboard.writeText(code);
    else { const t = document.createElement('textarea'); t.value = code; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
    const btn = document.getElementById('coCopyBtn');
    if (btn) { btn.textContent = 'Copiado!'; setTimeout(() => { btn.textContent = 'Copiar código PIX'; }, 2500); }
  } catch {}
};

window.sendWhatsApp = function() {
  const d = window._coData || {};
  const items = CART.items;
  let msg = `🌸 *Novo Pedido — Amores de Flores*\n\n`;
  msg += `👤 *Cliente:* ${d.name || ''}\n`;
  msg += `📱 *Tel:* ${d.phone || ''}\n`;
  msg += `📧 *Email:* ${d.email || ''}\n`;
  msg += `📍 *Endereço:* ${d.addr || ''}, ${d.num || ''} — ${d.neigh || ''}, ${d.city || ''}/${d.state || ''} — CEP ${d.cep || ''}\n\n`;
  msg += `🛒 *Itens do Pedido:*\n`;
  
  items.forEach(i => {
    msg += `• ${i.product.name} (${i.qty}x) — ${fmt(i.totalPrice)}\n`;
    if (i.is_tshirt) {
      msg += `  👕 Tamanho: ${i.size} | Cor: ${i.color}\n`;
      msg += `  📸 [Foto Personalizada Inclusa]\n`;
      const cleanObs = i.obs.replace(/Tamanho:.*Cor:.*\[Foto.*\].*/, '').trim();
      if (cleanObs) {
        msg += `  📝 ${cleanObs}\n`;
      }
    } else if (i.is_alliance) {
      msg += `  💍 *Customização do Par:*\n`;
      msg += `    🧑 Aro Masculino: ${i.maleSize} ${i.maleText ? `[Gravação: "${i.maleText}"]` : '[Sem gravação]'}\n`;
      msg += `    👩 Aro Feminino: ${i.femaleSize} ${i.femaleText ? `[Gravação: "${i.femaleText}"]` : '[Sem gravação]'}\n`;
      msg += `    ✨ Anel Solitário: ${i.solitaireOption} (Aro: ${i.solitaireSize})\n`;
      const cleanObs = i.obs.replace(/Aro Masculino:.*Aro Feminino:.*Solitário:.*/, '').trim();
      if (cleanObs) {
        msg += `    📝 Obs: ${cleanObs}\n`;
      }
    } else {
      if (i.obs) msg += `  📝 ${i.obs}\n`;
    }
  });

  msg += `\n💰 *Total:* ${fmt(getCartTotal())}\n`;
  msg += `💳 *Pagamento:* PIX\n`;
  msg += `\n🔑 *Código PIX:* ${window._pixCode || 'N/A'}`;

  const url = `https://wa.me/5511999999999?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
};

// ═══════════════════════════════════════════════════════════════
//  7. INICIALIZAÇÃO — botão de carrinho no header + CSS
// ═══════════════════════════════════════════════════════════════
(function initCart() {
  // Injetar CSS
  const style = document.createElement('style');
  style.textContent = `
/* ── BOTTOM SHEET BASE ── */
.bottom-sheet {
  background:#fff;
  width:100%;
  max-width:680px;
  border-radius:22px 22px 0 0;
  max-height:93vh;
  overflow-y:auto;
  transform:translateY(100%);
  transition:transform .32s cubic-bezier(.4,0,.2,1);
  -webkit-overflow-scrolling:touch;
}

/* ── PRODUCT MODAL ── */
.pm-img-wrap{position:relative;height:220px;background:#f3f4f6;border-radius:22px 22px 0 0;overflow:hidden}
.pm-img-wrap img{width:100%;height:100%;object-fit:cover}
.pm-close{position:absolute;top:12px;left:12px;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,.4);backdrop-filter:blur(4px);border:none;cursor:pointer;color:white;display:flex;align-items:center;justify-content:center}
.pm-body{padding:0 18px}
.pm-name{font-size:17px;font-weight:800;color:#1a1a2e;margin:14px 0 5px;font-family:'Plus Jakarta Sans',sans-serif;line-height:1.3}
.pm-desc{font-size:13px;color:#6b7280;line-height:1.6;margin-bottom:12px;font-family:'DM Sans',sans-serif}
.pm-prices{display:flex;align-items:center;gap:10px;margin-bottom:4px}
.pm-price{font-size:22px;font-weight:800;color:#16a34a;font-family:'Plus Jakarta Sans',sans-serif}
.pm-old{font-size:14px;color:#b0b0b8;text-decoration:line-through}

/* Seções do modal */
.pm-section{margin-top:22px;padding-top:18px;border-top:1px solid #f0f0f4}
.pm-section:first-of-type{border-top:none;padding-top:0;margin-top:14px}
.pm-section-hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px}
.pm-section-hdr-left{flex:1}
.pm-section-title{font-size:13px;font-weight:700;color:#1a1a2e;letter-spacing:.4px;text-transform:uppercase;font-family:'DM Sans',sans-serif}
.pm-obs-title{text-transform:none;letter-spacing:0;font-size:13px}
.pm-obs-opt{font-weight:400;color:#aaa;font-size:12px;text-transform:none;letter-spacing:0}
.pm-section-sub{font-size:11px;color:#aaa;margin-top:3px;font-family:'DM Sans',sans-serif}
.pm-count{font-size:11px;font-weight:700;color:#888;background:#f4f6f8;padding:3px 8px;border-radius:20px;white-space:nowrap;margin-left:8px;font-family:'DM Sans',sans-serif}

/* Lista de adicionais */
.pm-comps{display:flex;flex-direction:column}
.comp-item{
  display:flex;align-items:center;gap:12px;
  padding:11px 0;border-bottom:1px solid #f4f4f8;
  cursor:pointer;transition:background .15s;
  border-radius:0;
}
.comp-item:last-child{border-bottom:none}
.comp-item.selected{background:none}
.comp-item:hover{background:#fdf2f8}
.comp-info{flex:1}
.comp-name{font-size:13.5px;color:#1a1a2e;display:block;font-weight:500;font-family:'DM Sans',sans-serif}
.comp-price{font-size:12px;color:#16a34a;font-weight:600;margin-top:2px;display:block}
.comp-free{font-size:12px;color:#aaa;display:block;margin-top:2px}
.comp-check{
  width:22px;height:22px;border-radius:50%;
  border:1.5px solid #d0d0d8;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:all .2s;
  background:#fff;
}
.comp-item.selected .comp-check{background:#e91e8c;border-color:#e91e8c}
/* Opções de cor do balão */
.balloon-colors{padding:2px 2px 14px}
.balloon-colors-lbl{font-size:12px;color:#6b7280;display:block;margin-bottom:8px;font-family:'DM Sans',sans-serif}
.balloon-colors-lbl strong{color:#1a1a2e}
.balloon-swatches{display:flex;gap:10px}
.balloon-sw{width:30px;height:30px;border-radius:50%;border:2px solid #e5e7eb;cursor:pointer;padding:0;transition:transform .15s,border-color .15s,box-shadow .15s}
.balloon-sw:hover{transform:scale(1.1)}
.balloon-sw.selected{border-color:#1a1a2e;box-shadow:0 0 0 2px #fff,0 0 0 4px rgba(26,26,46,.15);transform:scale(1.12)}

.pm-obs{
  width:100%;border:1.5px solid #e5e7eb;border-radius:8px;
  padding:10px 12px;font-size:13px;resize:none;height:72px;
  outline:none;margin-top:8px;box-sizing:border-box;
  font-family:'DM Sans',sans-serif;color:#1a1a2e;line-height:1.6;
  transition:border-color .2s;
}
.pm-obs:focus{border-color:#e91e8c}
.pm-obs-count{text-align:right;font-size:11px;color:#bbb;margin-top:3px}
.pm-footer{position:sticky;bottom:0;background:#fff;border-top:1px solid #f3f4f6;padding:12px 18px;display:flex;align-items:center;gap:12px;z-index:10}
.pm-qty{display:flex;align-items:center;gap:8px;flex-shrink:0}
.pm-qty button{width:36px;height:36px;border-radius:50%;background:#f3f4f6;border:none;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.pm-qty span{font-size:16px;font-weight:700;min-width:20px;text-align:center}
.pm-add-btn{
  flex:1;padding:13px;border-radius:8px;
  background:#e91e8c;color:white;border:none;
  font-weight:800;font-size:14px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:8px;
  transition:box-shadow .2s,transform .15s,background .2s;
  font-family:'Plus Jakarta Sans',sans-serif;
  box-shadow:0 4px 14px rgba(233,30,140,.28);
  letter-spacing:.2px;
}
.pm-add-btn:hover{background:#c2185b;box-shadow:0 6px 20px rgba(233,30,140,.42);transform:translateY(-1px)}

/* ── CARD MESSAGE MODAL ── */
.card-modal-sheet{max-height:92vh;display:flex;flex-direction:column;font-family:'DM Sans',sans-serif}
.cm-handle{width:40px;height:4px;background:#e5e7eb;border-radius:9999px;margin:12px auto 0;flex-shrink:0}
.cm-header{padding:14px 18px 12px;border-bottom:1px solid #f3f4f6;flex-shrink:0;position:relative}
.cm-title{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:800;color:#1a1a2e;font-family:'Plus Jakarta Sans',sans-serif}
.cm-close{position:absolute;right:16px;top:14px;width:32px;height:32px;border-radius:50%;background:#f4f6f8;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#6b7280}
.cm-sub{font-size:12px;color:#888;margin:6px 0 0;font-weight:500}
.cm-body{flex:1;overflow-y:auto;padding:16px 18px;-webkit-overflow-scrolling:touch}

/* Preview do cartão — elegante, sem emojis */
.cm-preview{
  border-radius:12px;padding:20px;margin-bottom:20px;
  background:linear-gradient(135deg,#fff0f6 0%,#fff5f5 50%,#fdf2fb 100%);
  border:1.5px solid #fce4ec;
  min-height:150px;position:relative;overflow:hidden;
}
.cm-preview-corner{position:absolute;width:60px;height:60px;border-radius:50%;opacity:.08;background:#e91e8c}
.cm-preview-tl{top:-20px;left:-20px}
.cm-preview-br{bottom:-20px;right:-20px}
.cm-for{font-size:12px;color:#e91e8c;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:.6px}
.cm-msg{font-size:14px;color:#1a1a2e;white-space:pre-wrap;line-height:1.65;min-height:50px;margin:0;font-style:italic}
.cm-from{font-size:12px;color:#e91e8c;font-weight:600;text-align:right;margin:14px 0 0}

.cm-label{font-size:12px;font-weight:700;color:#1a1a2e;margin-bottom:6px;display:block;margin-top:16px;letter-spacing:.3px;text-transform:uppercase}
.cm-label:first-of-type{margin-top:0}
.cm-input{
  width:100%;padding:11px 14px;font-size:14px;
  border:1.5px solid #e8e8e8;border-radius:8px;
  outline:none;transition:border-color .2s;
  box-sizing:border-box;font-family:'DM Sans',sans-serif;
  color:#1a1a2e;background:#fff;
}
.cm-input:focus{border-color:#e91e8c}
.cm-templates{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none}
.cm-templates::-webkit-scrollbar{display:none}
.card-tpl-btn{
  flex-shrink:0;padding:7px 14px;
  border-radius:20px;border:1.5px solid var(--tcolor,#e91e8c);
  background:white;cursor:pointer;
  font-size:12px;font-weight:700;
  color:var(--tcolor,#e91e8c);
  transition:all .2s;
  font-family:'DM Sans',sans-serif;
  white-space:nowrap;
}
.card-tpl-btn:hover,.card-tpl-btn.active{background:var(--tcolor,#e91e8c);color:white}
.cm-textarea{
  width:100%;padding:11px 14px;font-size:14px;
  border:1.5px solid #e8e8e8;border-radius:8px;
  outline:none;resize:none;height:96px;
  transition:border-color .2s;box-sizing:border-box;
  font-family:'DM Sans',sans-serif;color:#1a1a2e;line-height:1.6;
}
.cm-textarea:focus{border-color:#e91e8c}
.cm-char{font-size:11px;color:#aaa;text-align:right;margin-top:4px}
.cm-footer{padding:14px 18px;border-top:1px solid #f4f6f8;background:#fff;flex-shrink:0}
.cm-save-btn{
  width:100%;padding:15px;border-radius:8px;
  background:#e91e8c;color:white;border:none;
  font-size:14px;font-weight:800;cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;
  letter-spacing:.3px;transition:box-shadow .2s,transform .15s;
  box-shadow:0 4px 14px rgba(233,30,140,.28);
}
.cm-save-btn:hover{box-shadow:0 6px 20px rgba(233,30,140,.38);transform:translateY(-1px)}
.cm-save-btn:disabled{opacity:.5;cursor:not-allowed;box-shadow:none}


/* ── PREMIUM CARD ── */
.pm2-papers{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.pm2-paper{padding:8px 12px;border-radius:10px;border:2px solid transparent;cursor:pointer;font-size:12px;font-weight:600;color:#1f2937;transition:all .2s;font-family:inherit}
.pm2-paper.active{border-color:#9333ea!important;transform:scale(1.05)}
.pm2-paper:hover{opacity:.85}
.pm2-selected-paper{font-size:13px;color:#6b7280;margin-bottom:14px}

/* ── UPSELL ── */
.upsell-sheet{max-height:88vh;display:flex;flex-direction:column}
.us-header{display:flex;align-items:center;gap:10px;padding:14px 18px 10px;flex-shrink:0}
.us-icon{width:36px;height:36px;border-radius:50%;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.us-title{font-size:15px;font-weight:800;color:#1f2937}
.us-sub{font-size:12px;color:#9ca3af;margin-top:2px}
.us-items{flex:1;overflow-y:auto;padding:0 12px}
.upsell-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f3f4f6}
.upsell-item img{width:68px;height:68px;object-fit:cover;border-radius:10px;flex-shrink:0}
.upsell-info{flex:1;min-width:0}
.upsell-name{font-size:14px;font-weight:700;color:#1f2937;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.upsell-desc{font-size:12px;color:#9ca3af;margin-top:3px;line-height:1.4}
.upsell-price{font-size:14px;font-weight:700;color:#22c55e;margin-top:4px}
.upsell-add{width:40px;height:40px;border-radius:50%;background:#22c55e;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0;transition:background .2s}
.us-footer{padding:12px 16px;border-top:1px solid #f3f4f6;flex-shrink:0}
.us-continue-btn{
  width:100%;padding:14px;border-radius:8px;
  background:#e91e8c;color:white;border:none;
  font-size:14px;font-weight:800;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:8px;
  font-family:'Plus Jakarta Sans',sans-serif;
  box-shadow:0 4px 14px rgba(233,30,140,.28);
  transition:box-shadow .2s,transform .15s,background .2s;
}
.us-continue-btn:hover{background:#c2185b;box-shadow:0 6px 20px rgba(233,30,140,.42);transform:translateY(-1px)}
.us-footer-link{text-align:center;margin-top:6px}

/* ── CART SHEET ── */
.cart-sheet{max-height:85vh;display:flex;flex-direction:column}
.cart-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f3f4f6;flex-shrink:0}
.cart-header h2,.cart-h2{font-size:16px;font-weight:700;color:#1f2937;margin:0;display:flex;align-items:center;gap:8px}
.cart-header-btns{display:flex;align-items:center;gap:12px}
.cart-clear-btn{background:none;border:none;color:#e91e8c;font-size:12px;font-weight:600;cursor:pointer}
.cart-header-btns>button:last-child{background:none;border:none;cursor:pointer;display:flex}
.cart-items{flex:1;overflow-y:auto;padding:8px 16px}
.cart-empty{display:flex;flex-direction:column;align-items:center;padding:40px 0;color:#9ca3af;gap:8px}
.cart-empty p{font-weight:600;margin:0}
.cart-empty small{font-size:13px}
.cart-item{display:flex;align-items:flex-start;gap:12px;padding:12px;background:#f9fafb;border-radius:14px;margin-bottom:8px}
.cart-item img{width:72px;height:72px;border-radius:10px;object-fit:cover;flex-shrink:0}
.cart-item-info{flex:1;min-width:0}
.cart-item-name{font-size:14px;font-weight:600;color:#1f2937}
.cart-item-obs{font-size:11px;color:#9ca3af;font-style:italic;margin-top:2px}
.cart-item-row{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
.cart-item-price{font-size:15px;font-weight:700;color:#22c55e}
.cart-item-controls{display:flex;align-items:center;gap:6px}
.cart-item-controls button{width:28px;height:28px;border-radius:50%;background:white;border:1px solid #e5e7eb;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px}
.cart-item-controls span{font-size:13px;font-weight:700;min-width:18px;text-align:center}
.cart-remove{background:#fdf2f8!important;border-color:#f8c8dd!important;font-size:14px!important}
.cart-footer{border-top:1px solid #f3f4f6;padding:12px 16px;flex-shrink:0}
.cart-progress{margin-bottom:12px}
.cart-prog-txt{font-size:12px;color:#6b7280;margin-bottom:4px}
.cart-prog-bar{height:6px;background:#e5e7eb;border-radius:9999px;overflow:hidden}
.cart-prog-fill{height:100%;background:#22c55e;border-radius:9999px;transition:width .4s}
.cart-totals{display:flex;justify-content:space-between;font-size:14px;color:#6b7280;margin-bottom:8px}
.cart-total-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.cart-total-row>span:first-child{font-size:16px;font-weight:700;color:#111}
.cart-total-val{font-size:18px;font-weight:800;color:#22c55e}
.cart-checkout-btn{
  width:100%;padding:14px;border-radius:8px;
  background:#e91e8c;color:white;border:none;
  font-size:14px;font-weight:800;cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;
  box-shadow:0 4px 14px rgba(233,30,140,.28);
  transition:box-shadow .2s,background .2s;
}
.cart-checkout-btn:hover{background:#c2185b;box-shadow:0 6px 20px rgba(233,30,140,.42)}
.cart-checkout-btn.disabled{background:#e5e7eb;color:#9ca3af;cursor:default;box-shadow:none}

/* ══════════════════════════════════════════════
   CHECKOUT — DESIGN SYSTEM DA HOME
   bg: #cfdde8 | pink: #e91e8c | text: #1a1a2e
   font: DM Sans + Plus Jakarta Sans
   ══════════════════════════════════════════════ */

.checkout-screen{
  position:fixed;inset:0;z-index:900;
  display:flex;flex-direction:column;
  background:#ffffff;
  font-family:'DM Sans',sans-serif;
}

/* Header */
.co-header{
  display:flex;align-items:center;justify-content:center;
  padding:14px 16px;
  background:#1a1a2e;
  position:relative;flex-shrink:0;
}
.co-back{
  position:absolute;left:14px;
  background:rgba(255,255,255,.1);border:none;
  color:white;cursor:pointer;display:flex;
  width:34px;height:34px;border-radius:50%;
  align-items:center;justify-content:center;
  transition:background .2s;
}
.co-back:hover{background:rgba(255,255,255,.2)}
.co-title{
  font-size:16px;font-weight:800;color:white;
  font-family:'Plus Jakarta Sans',sans-serif;
  letter-spacing:.2px;
}

/* Body scroll */
.co-body{flex:1;overflow-y:auto;padding:0 0 28px;-webkit-overflow-scrolling:touch}

/* Cards */
.co-card{
  background:white;border-radius:14px;
  margin:14px 14px 0;
  border:1px solid #eef0f3;
  box-shadow:0 2px 12px rgba(26,26,46,.06);
}

/* Resumo colapsável */
.co-summary-hdr{
  display:flex;align-items:center;gap:10px;
  padding:14px 16px;cursor:pointer;
  border-radius:14px;
}
.co-sum-total{
  font-size:14px;font-weight:800;color:#1a1a2e;
  margin-left:auto;font-family:'Plus Jakarta Sans',sans-serif;
}
.co-sum-item{
  display:flex;gap:12px;padding:10px 12px;
  background:#f8f9fb;border-radius:10px;margin-bottom:8px;
}
.co-sum-item img{width:60px;height:60px;object-fit:cover;border-radius:8px;flex-shrink:0}
.co-sum-name{font-size:13px;font-weight:600;color:#1a1a2e;line-height:1.3}
.co-sum-qty{font-size:11px;color:#999;margin-top:2px}
.co-sum-price{font-size:13px;font-weight:700;color:#16a34a;margin-top:4px}
.co-sum-totals{border-top:1px solid #f0f0f4;margin-top:10px;padding-top:10px}
.co-sum-totals>div{display:flex;justify-content:space-between;margin-bottom:5px;font-size:13px;color:#888}
.co-sum-final{
  border-top:1px solid #f0f0f4;padding-top:8px;margin-top:4px;
  font-size:15px!important;font-weight:800!important;color:#1a1a2e!important;
  display:flex;justify-content:space-between;
}
.co-sum-final span:last-child{color:#16a34a!important}
.co-free{color:#22c55e!important}

/* Steps */
.co-steps{
  display:flex;align-items:center;justify-content:center;
  gap:0;padding:18px 0 8px;
}
.co-step{display:flex;flex-direction:column;align-items:center;gap:5px}
.co-step-dot{
  width:34px;height:34px;border-radius:50%;
  background:#e0e4e8;color:#aaa;
  display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:800;
  transition:all .3s;
  font-family:'Plus Jakarta Sans',sans-serif;
}
.co-step.active .co-step-dot{background:#e91e8c;color:white;box-shadow:0 4px 12px rgba(233,30,140,.3)}
.co-step-lbl{font-size:11px;font-weight:600;color:#aaa;letter-spacing:.3px}
.co-step.active .co-step-lbl{color:#1a1a2e}
.co-step-line{width:60px;height:2px;background:#e0e4e8;position:relative;top:-8px;margin:0 -2px;transition:background .3s}
.co-step-line.active{background:#e91e8c}

/* Seção título */
.co-section-title{
  font-size:14px;font-weight:800;color:#1a1a2e;
  padding:18px 18px 14px;
  font-family:'Plus Jakarta Sans',sans-serif;
  letter-spacing:.2px;
}

/* Labels e inputs */
.co-lbl{
  font-size:11px;font-weight:700;color:#888;
  display:block;margin:0 18px 5px;
  letter-spacing:.5px;text-transform:uppercase;
}
.co-input{
  display:block;
  width:calc(100% - 36px);
  margin:0 18px 14px;
  padding:12px 14px;
  font-size:14px;color:#1a1a2e;
  border:1.5px solid #e0e4e8;
  border-radius:8px;outline:none;
  transition:border-color .2s,box-shadow .2s;
  box-sizing:border-box;
  font-family:'DM Sans',sans-serif;
  background:#fff;
}
.co-input:focus{border-color:#e91e8c;box-shadow:0 0 0 3px rgba(233,30,140,.08)}
.sched-select{color:#1a1a2e;font-weight:600;background:#fff;cursor:pointer;appearance:auto;-webkit-appearance:menulist;}

.co-divider{
  display:flex;align-items:center;gap:8px;
  margin:6px 18px 14px;
  color:#bbb;font-size:12px;font-weight:600;
  letter-spacing:.3px;text-transform:uppercase;
}
.co-divider::before,.co-divider::after{
  content:'';flex:1;height:1px;background:#eee;
}

.co-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 18px 14px}
.co-grid-2 .co-input{margin:0;width:100%}
.co-grid-2 .co-lbl{margin:0 0 5px}
.co-check-lbl{
  display:flex;align-items:center;gap:6px;
  font-size:12px;color:#888;margin-top:4px;cursor:pointer;
}
.co-check-lbl input[type=checkbox]{accent-color:#e91e8c}

.co-primary-btn{
  display:block;width:calc(100% - 36px);
  margin:18px 18px;padding:14px;
  background:#e91e8c;color:white;border:none;
  border-radius:8px;font-size:14px;font-weight:800;
  cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;
  letter-spacing:.2px;
  box-shadow:0 4px 16px rgba(233,30,140,.30);
  transition:box-shadow .2s,transform .15s,background .2s;
}
.co-primary-btn:hover{background:#c2185b;box-shadow:0 6px 22px rgba(233,30,140,.45);transform:translateY(-1px)}

/* Error */
.co-error{
  margin:0 14px 10px;padding:12px 16px;
  background:#fff0f0;border:1.5px solid #ffc4c4;
  border-radius:10px;font-size:13px;color:#c62828;
  font-weight:500;text-align:center;
}
/* Modal "Pagamento Temporariamente Indisponível" */
.card-unavail-overlay{position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:24px;animation:cuFade .2s ease}
@keyframes cuFade{from{opacity:0}to{opacity:1}}
.card-unavail-box{background:#fff;border-radius:18px;max-width:340px;width:100%;padding:30px 26px;text-align:center;box-shadow:0 14px 40px rgba(0,0,0,.25);animation:cuPop .3s cubic-bezier(.34,1.56,.64,1);font-family:'DM Sans',sans-serif}
@keyframes cuPop{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}
.card-unavail-icon{width:64px;height:64px;border-radius:50%;background:#fff7ed;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.card-unavail-title{font-size:17px;font-weight:800;color:#1a1a2e;margin-bottom:10px;font-family:'Plus Jakarta Sans',sans-serif;line-height:1.3}
.card-unavail-text{font-size:13.5px;color:#6b7280;line-height:1.55;margin-bottom:14px}
.card-unavail-sub{font-size:13.5px;color:#6b7280;line-height:1.55}
.card-unavail-sub strong{color:#16a34a}
.card-unavail-dots{display:flex;gap:8px;justify-content:center;margin-top:18px}
.card-unavail-dots span{width:9px;height:9px;border-radius:50%;background:#f59e0b;animation:cuDot 1s infinite ease-in-out}
.card-unavail-dots span:nth-child(2){animation-delay:.2s}
.card-unavail-dots span:nth-child(3){animation-delay:.4s}
@keyframes cuDot{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}

/* Erro inline abaixo do campo (vermelho, sem emote) */
.co-field-error{color:#c2185b;font-size:12px;font-weight:600;margin:4px 18px 10px;font-family:'DM Sans',sans-serif;}
.co-grid-2 .co-field-error{margin:4px 2px 0;}
.co-input.co-input-error{border-color:#c2185b;}

/* Delivery info no passo 2 */
.co-del-row{display:flex;align-items:flex-start;gap:10px;padding:10px 0}
.co-del-name{font-size:13px;font-weight:600;color:#1a1a2e}
.co-del-sub{font-size:12px;color:#999;margin-top:2px}
.co-trocar{
  background:#fdf2f8;border:1px solid #f8c8dd;color:#e91e8c;
  cursor:pointer;flex-shrink:0;margin-left:auto;
  width:34px;height:34px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  transition:background .18s;
}
.co-trocar:hover{background:#fde0e0;}
#coDeliveryInfo{padding:0 18px}

/* Opções de frete */
.co-freight-opt{
  display:grid;grid-template-columns:1fr auto auto;
  align-items:center;gap:12px;
  padding:12px 14px;
  border-radius:10px;border:1.5px solid #e0e4e8;
  margin:0 18px 8px;cursor:pointer;
  transition:border-color .2s,background .2s;
}
.co-freight-opt.selected{border-color:#e91e8c;background:#fdf2f8}
.co-fr-name{font-size:13px;font-weight:700;color:#1a1a2e}
.co-fr-sub{font-size:11px;color:#999;margin-top:1px}
.co-fr-free{
  font-size:10px;font-weight:800;
  background:#e8f5e9;color:#2e7d32;
  padding:3px 9px;border-radius:20px;
  letter-spacing:.3px;
}
.co-fr-price{font-size:13px;font-weight:700;color:#1a1a2e}
.co-radio-dot{
  width:20px;height:20px;border-radius:50%;
  border:2px solid #d0d0d8;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  transition:all .2s;
}
.co-radio-dot.selected{border-color:#e91e8c;background:#e91e8c}
.co-radio-dot.selected::after{content:'';width:7px;height:7px;border-radius:50%;background:white;display:block}

/* Pagamento */
.co-pay-opt{
  display:flex;align-items:center;gap:14px;
  padding:12px 14px;border-radius:10px;
  border:1.5px solid #e0e4e8;margin-bottom:8px;
  cursor:pointer;transition:all .2s;
}
.co-pay-opt.selected{border-color:#e91e8c;background:#fdf2f8}
.co-pay-icon{
  width:42px;height:42px;background:#f4f6f8;
  border-radius:8px;display:flex;align-items:center;
  justify-content:center;flex-shrink:0;
}
.co-pay-name{font-size:14px;font-weight:700;color:#1a1a2e}
.co-pay-sub{font-size:11px;color:#999;margin-top:1px}
.co-pay-info{flex:1}
#cardFields{padding:0 18px}

/* Totais pagamento */
.co-totals-box{margin:16px 18px 0;border-top:1px solid #f0f0f4;padding-top:14px}
.co-total-line{display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;color:#888}
.co-total-final{
  display:flex;justify-content:space-between;
  border-top:1px solid #f0f0f4;padding-top:10px;margin-top:4px;
}
.co-total-final span:first-child{font-size:15px;font-weight:700;color:#1a1a2e}
.co-total-final span:last-child{font-size:15px;font-weight:800;color:#16a34a}
.co-secure{
  text-align:center;font-size:11px;color:#bbb;
  padding:10px 18px 18px;
  display:flex;align-items:center;justify-content:center;gap:5px;
}
.co-secure::before{
  content:'';display:inline-block;width:10px;height:12px;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2'%3E%3Crect x='3' y='11' width='18' height='11' rx='2'/%3E%3Cpath d='M7 11V7a5 5 0 0110 0v4'/%3E%3C/svg%3E") center/contain no-repeat;
}

/* PIX confirmado */
.co-pix-card{text-align:center;padding-bottom:24px}
.co-pix-icon{padding:24px 0 12px;display:flex;justify-content:center}
.co-pix-title{
  font-size:20px;font-weight:800;color:#1a1a2e;
  margin:0 0 8px;font-family:'Plus Jakarta Sans',sans-serif;
}
.co-pix-sub{font-size:13px;color:#888;margin:0 20px 20px;line-height:1.6}
.co-pix-qr{display:flex;justify-content:center;margin-bottom:16px}
.co-qr-box{
  width:160px;height:160px;border-radius:12px;
  border:1.5px solid #e0e4e8;overflow:hidden;
  display:flex;align-items:center;justify-content:center;
  background:#fff;
}
.co-pix-code-wrap{margin:0 18px 16px}
.co-pix-code{
  font-size:10px;color:#555;word-break:break-all;
  background:#f8f9fb;border-radius:8px;
  padding:10px;margin-bottom:10px;line-height:1.5;
}
.co-copy-btn{
  width:100%;padding:12px;
  background:#1a1a2e;color:white;border:none;
  border-radius:8px;font-size:13px;font-weight:700;
  cursor:pointer;font-family:'DM Sans',sans-serif;
  letter-spacing:.3px;transition:background .2s;
}
.co-copy-btn:hover{background:#2a2a4e}
.co-pix-info{
  font-size:12px;color:#888;
  margin:0 18px 20px;
  background:#f8f9fb;padding:12px;
  border-radius:8px;line-height:1.6;text-align:left;
}
/* Loading do PIX (deixa o delay profissional) */
.co-pix-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;height:100%;padding:18px}
.co-spinner{width:38px;height:38px;border:3px solid #e6f4ec;border-top-color:#16a34a;border-radius:50%;animation:coSpin .8s linear infinite}
.co-pix-loading span{font-size:11px;color:#16a34a;font-weight:600;text-align:center}
@keyframes coSpin{to{transform:rotate(360deg)}}
/* Selos de confiança / segurança */
.co-trust{display:flex;justify-content:center;gap:8px;margin:0 18px 14px;padding-top:14px;border-top:1px solid #eef0f4}
.co-trust-item{display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;max-width:100px;color:#16a34a}
.co-trust-item svg{width:22px;height:22px}
.co-trust-item span{font-size:8.5px;color:#9ca3af;line-height:1.35;text-transform:uppercase;letter-spacing:.3px;text-align:center;font-weight:700}
.co-trust-item span b{display:block;color:#16a34a;font-weight:800;font-size:9.5px}
.co-secure-note{display:flex;align-items:center;justify-content:center;gap:7px;margin:0 18px 20px;font-size:11px;color:#16a34a;font-weight:600;text-align:center;line-height:1.4}
.co-secure-note svg{width:15px;height:15px;flex-shrink:0}
.co-wpp-btn{
  margin:0 18px;display:flex;align-items:center;
  justify-content:center;gap:10px;
  width:calc(100% - 36px);padding:14px;
  background:#25d366;color:white;border:none;
  border-radius:8px;font-size:14px;font-weight:800;
  cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;
  box-shadow:0 4px 14px rgba(37,211,102,.3);
  transition:box-shadow .2s;
}
.co-wpp-btn:hover{box-shadow:0 6px 20px rgba(37,211,102,.45)}


/* ── HEADER CART BUTTON ── */
#cartBtn{position:relative}
#cartBadge{position:absolute;top:-6px;right:-6px;background:#e91e8c;color:white;font-size:11px;font-weight:700;width:18px;height:18px;border-radius:50%;display:none;align-items:center;justify-content:center;line-height:1}

/* ── BOTÕES DA PÁGINA DE DETALHE — PREMIUM ── */
.btn-cart {
  width: 100%;
  padding: 15px 20px;
  border-radius: 10px;
  background: #e91e8c;
  color: #fff;
  border: none;
  font-weight: 800;
  font-size: 15px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  margin-bottom: 10px;
  letter-spacing: .2px;
  box-shadow: 0 4px 18px rgba(233,30,140,.28);
  transition: background .2s, box-shadow .2s, transform .15s;
}
.btn-cart:hover { background: #c2185b; box-shadow: 0 6px 24px rgba(233,30,140,.42); transform: translateY(-1px); }

.btn-buy {
  width: 100%;
  padding: 15px 20px;
  border-radius: 10px;
  background: #e91e8c;
  color: #fff;
  border: none;
  font-weight: 800;
  font-size: 15px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  letter-spacing: .3px;
  box-shadow: 0 4px 18px rgba(233, 30, 140, .30);
  transition: box-shadow .2s, transform .15s, background .2s;
}
.btn-buy:hover { background: #c2185b; box-shadow: 0 6px 24px rgba(233, 30, 140, .45); transform: translateY(-1px); }

/* ── T-SHIRT CUSTOMIZATION (INJECTED) ── */
.tshirt-swatch-list {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}
.tshirt-swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
}
.tshirt-swatch.selected {
  border-color: #e91e8c;
  transform: scale(1.15);
  box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.2);
}
.tshirt-size-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tshirt-size-btn {
  background: #ffffff;
  color: #1a1a2e;
  border: 1.5px solid #e5e7eb;
  padding: 8px 16px;
  border-radius: 8px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.tshirt-size-btn:hover {
  border-color: #e91e8c;
  color: #e91e8c;
  background: #fdf2f8;
}
.tshirt-size-btn.selected {
  background: #e91e8c;
  color: #ffffff;
  border-color: #e91e8c;
  box-shadow: 0 4px 10px rgba(233, 30, 140, 0.25);
  transform: translateY(-1px);
}
.tshirt-upload-zone {
  border: 2px dashed #e91e8c;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  background: #fdf2f8;
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.tshirt-upload-zone:hover {
  background: #fce7f3;
  border-color: #be185d;
}
.tshirt-upload-preview-wrap {
  display: none;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.tshirt-upload-preview-wrap img {
  max-width: 130px;
  max-height: 130px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #e91e8c;
  box-shadow: 0 4px 12px rgba(233, 30, 140, 0.2);
  margin-bottom: 12px;
  transition: transform 0.2s;
}
.tshirt-upload-preview-wrap img:hover {
  transform: scale(1.05);
}
.tshirt-remove-photo {
  background: #fdf2f8;
  color: #e91e8c;
  border: 1.5px solid #f8c8dd;
  padding: 6px 14px;
  border-radius: 20px;
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.tshirt-remove-photo:hover {
  background: #fce7f3;
  border-color: #fca5a5;
  transform: scale(1.03);
}
`;
  document.head.appendChild(style);

  // ── BOTÃO DE CARRINHO NO HEADER ──
  const header = document.querySelector('.header');
  if (header && !document.getElementById('cartBtn')) {
    const cartBtn = document.createElement('button');
    cartBtn.id = 'cartBtn';
    cartBtn.className = 'hbtn';
    cartBtn.setAttribute('aria-label', 'Carrinho');
    cartBtn.onclick = () => { openCartSheet(); };
    cartBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="24" height="24">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      <span id="cartBadge" style="position:absolute;top:-6px;right:-6px;background:#e91e8c;color:white;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:none;align-items:center;justify-content:center">0</span>`;
    header.insertBefore(cartBtn, header.children[1]);
  }

  // ── BOTÕES DA PÁGINA DE DETALHE — apenas handler, sem sobrescrever texto ──
  // Os textos e estilos vêm do index.html + style.css
  setTimeout(() => {
    const btnCart = document.querySelector('#detAddCart');
    const btnBuy  = document.querySelector('#detBuyNow');
    if (btnCart && !btnCart._cartWired) {
      btnCart._cartWired = true;
      btnCart.onclick = () => {
        const p = (window.allProducts || []).find(x => x.id === window._currentDetailId);
        if (p && p.is_tshirt) {
          window.addTshirtToCartDetailPage(false);
        } else {
          openProductModal(window._currentDetailId);
        }
      };
    }
    if (btnBuy && !btnBuy._cartWired) {
      btnBuy._cartWired = true;
      btnBuy.onclick = () => {
        const p = (window.allProducts || []).find(x => x.id === window._currentDetailId);
        if (p && p.is_tshirt) {
          window.addTshirtToCartDetailPage(true);
        } else {
          openProductModal(window._currentDetailId);
        }
      };
    }
  }, 80);
})();


// Tshirt helper functions for Detail Page
window.selectTshirtSizeDetailPage = function(size) {
  window._tshirtSizeDetail = size;
  document.querySelectorAll('.tshirt-size-btn-detail').forEach(btn => {
    btn.classList.toggle('selected', btn.id === 'size-btn-detail-' + size);
  });
};

window.selectTshirtColorDetailPage = function(color) {
  window._tshirtColorDetail = color;
  document.querySelectorAll('.tshirt-swatch-detail').forEach(btn => {
    btn.classList.toggle('selected', btn.id === 'color-swatch-detail-' + color);
  });
  const valEl = document.getElementById('tshirtSelectedColorValDetail');
  if (valEl) valEl.textContent = color;

  // Atualizar a imagem principal na página de detalhes (#detImg)
  const p = (window.allProducts || []).find(x => x.id === window._currentDetailId);
  if (p && p.tshirt_images && p.tshirt_images[color]) {
    const detImg = document.getElementById('detImg');
    if (detImg) {
      detImg.src = p.tshirt_images[color];
    }
  }
};

window.triggerTshirtUploadDetailPage = function() {
  const input = document.getElementById('tshirtPhotoInputDetail');
  if (input) input.click();
};

window.handleTshirtPhotoDetailPage = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    window._tshirtPhotoDetail = e.target.result;
    const previewImg = document.getElementById('tshirtPhotoPreviewDetail');
    const previewWrap = document.getElementById('tshirtUploadPreviewWrapDetail');
    const innerUpload = document.getElementById('tshirtUploadInnerDetail');
    
    if (previewImg) previewImg.src = e.target.result;
    if (previewWrap) previewWrap.style.display = 'flex';
    if (innerUpload) innerUpload.style.display = 'none';
  };
  reader.readAsDataURL(file);
};

window.removeTshirtPhotoDetailPage = function(event) {
  if (event) event.stopPropagation();
  window._tshirtPhotoDetail = '';
  
  const previewWrap = document.getElementById('tshirtUploadPreviewWrapDetail');
  const innerUpload = document.getElementById('tshirtUploadInnerDetail');
  const input = document.getElementById('tshirtPhotoInputDetail');
  
  if (previewWrap) previewWrap.style.display = 'none';
  if (innerUpload) innerUpload.style.display = 'flex';
  if (input) input.value = '';
};

window.addTshirtToCartDetailPage = function(buyNow) {
  const p = (window.allProducts || []).find(x => x.id === window._currentDetailId);
  if (!p) return;

  if (!window._tshirtPhotoDetail) {
    izaToast('Envie uma foto para a estampa da camiseta para continuar.');
    return;
  }

  const qty = 1;
  const totalPrice = parseFloat(p.price || 0) * qty;
  const fullObs = `Tamanho: ${window._tshirtSizeDetail} | Cor: ${window._tshirtColorDetail} [Foto Personalizada Inclusa]`;

  const itemObj = {
    product: p,
    qty,
    obs: fullObs,
    totalPrice,
    is_tshirt: true,
    size: window._tshirtSizeDetail,
    color: window._tshirtColorDetail,
    photo: window._tshirtPhotoDetail
  };

  CART.items.push(itemObj);
  updateCartBadge();

  if (buyNow) {
    goToCheckout();
  } else {
    openUpsellModal();
  }
};

// Expor openProductModal globalmente e guardar id atual
const _origOpenDetail = window.openDetail;
window.openDetail = function(id) {
  window._currentDetailId = id;
  if (_origOpenDetail) _origOpenDetail(id);

  // Executar a injeção ou limpeza dos customizadores
  setTimeout(() => {
    const p = (window.allProducts || []).find(x => x.id === id);
    const customizerDiv = document.getElementById('detTshirtCustomizer');
    const allianceDiv = document.getElementById('detAllianceCustomizer');
    const btnCart = document.querySelector('#detAddCart');
    const btnBuy = document.querySelector('#detBuyNow');

    if (!customizerDiv || !allianceDiv) return;

    if (p && p.is_tshirt) {
      // É uma camiseta! Injetar customizador e configurar estado inicial
      window._tshirtSizeDetail = 'M';
      window._tshirtColorDetail = p.name.includes('Girlfriend') ? 'Rosa' : 'Off white';
      window._tshirtPhotoDetail = '';

      customizerDiv.style.display = 'block';
      allianceDiv.style.display = 'none';
      allianceDiv.innerHTML = '';

      const sizes = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG'];
      const colors = ['Rosa', 'Off white', 'Preto', 'Branco'];
      const colorValues = {
        'Rosa': '#f4a0b8',
        'Off white': '#f5f5f0',
        'Preto': '#1a1a2e',
        'Branco': '#ffffff'
      };

      const sizesHtml = sizes.map(s => `
        <button type="button" class="tshirt-size-btn tshirt-size-btn-detail ${s === 'M' ? 'selected' : ''}" onclick="selectTshirtSizeDetailPage('${s}')" id="size-btn-detail-${s}">${s}</button>
      `).join('');

      const colorsHtml = colors.map(c => `
        <button type="button" class="tshirt-swatch tshirt-swatch-detail ${c === window._tshirtColorDetail ? 'selected' : ''}" onclick="selectTshirtColorDetailPage('${c}')" id="color-swatch-detail-${c}" style="background-color: ${colorValues[c]};" title="${c}"></button>
      `).join('');

      customizerDiv.innerHTML = `
        <div class="pm-section" style="margin-top: 15px; text-align: left;">
          <div class="pm-section-title" style="margin-bottom:8px; font-weight: 700; color: #1a1a2e; font-size: 14px;">Escolha a Cor</div>
          <div class="tshirt-swatch-list" style="display:flex;gap:12px;margin-bottom:8px">${colorsHtml}</div>
          <div class="tshirt-selected-color" style="font-size:12px;color:#6b7280">Cor selecionada: <strong id="tshirtSelectedColorValDetail" style="color:#e91e8c">${window._tshirtColorDetail}</strong></div>
        </div>

        <div class="pm-section" style="margin-top: 15px; text-align: left;">
          <div class="pm-section-title" style="margin-bottom:8px; font-weight: 700; color: #1a1a2e; font-size: 14px;">Escolha o Tamanho</div>
          <div class="tshirt-size-grid" style="display:flex;flex-wrap:wrap;gap:8px">${sizesHtml}</div>
        </div>

        <div class="pm-section" style="margin-top: 15px; text-align: left;">
          <div class="pm-section-title" style="margin-bottom:8px; font-weight: 700; color: #1a1a2e; font-size: 14px;">Envie sua Foto <span style="font-size:11px;color:#888;font-weight:normal">(estampa no peito)</span></div>
          <div class="tshirt-upload-zone" id="tshirtUploadZoneDetail" onclick="triggerTshirtUploadDetailPage()" style="border:2px dashed #e91e8c;border-radius:10px;padding:20px;text-align:center;cursor:pointer;background:#fdf2f8;transition:background .2s;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <input type="file" id="tshirtPhotoInputDetail" accept="image/*" style="display:none" onchange="handleTshirtPhotoDetailPage(event)">
            <div class="tshirt-upload-inner" id="tshirtUploadInnerDetail" style="display:flex;flex-direction:column;align-items:center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#e91e8c" stroke-width="2" width="28" height="28" style="margin-bottom:8px">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span class="tshirt-upload-title" style="font-size:13px;font-weight:700;color:#1a1a2e">Clique para enviar a foto</span>
              <span class="tshirt-upload-sub" style="font-size:11px;color:#888;margin-top:2px">Formatos suportados: JPG, PNG</span>
            </div>
            <div class="tshirt-upload-preview-wrap" id="tshirtUploadPreviewWrapDetail" style="display:none;flex-direction:column;align-items:center;width:100%">
              <img id="tshirtPhotoPreviewDetail" src="" alt="Preview" style="max-width:120px;max-height:120px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:8px">
              <button type="button" class="tshirt-remove-photo" onclick="removeTshirtPhotoDetailPage(event)" style="background:#fdf2f8;color:#e91e8c;border:1px solid #f8c8dd;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer">✕ Remover Foto</button>
            </div>
          </div>
        </div>
      `;

      // Atualiza imagem de acordo com a cor inicial selecionada
      if (p.tshirt_images && p.tshirt_images[window._tshirtColorDetail]) {
        const detImg = document.getElementById('detImg');
        if (detImg) detImg.src = p.tshirt_images[window._tshirtColorDetail];
      }

      // Sobrescrever botões de compra para camiseta
      if (btnCart) {
        btnCart.onclick = () => window.addTshirtToCartDetailPage(false);
      }
      if (btnBuy) {
        btnBuy.onclick = () => window.addTshirtToCartDetailPage(true);
      }
    } else if (p && p.is_alliance) {
      // É uma Aliança de Namoro! Configurar estado inicial
      window._allianceMaleSize = '';
      window._allianceMaleText = '';
      window._allianceFemaleSize = '';
      window._allianceFemaleText = '';
      window._allianceSolitaireOption = 'Classic';
      window._allianceSolitaireSize = '';
      window._allianceSolitairePrice = 0;

      customizerDiv.style.display = 'none';
      customizerDiv.innerHTML = '';
      allianceDiv.style.display = 'block';

      // Gerar aros de 9 a 35
      const aros = [];
      for (let i = 9; i <= 35; i++) aros.push(i);

      const maleArosHtml = aros.map(a => `
        <button type="button" class="alliance-size-btn alliance-size-btn-male" onclick="selectAllianceSizeDetailPage('male', ${a})" id="male-aro-${a}">${a}</button>
      `).join('');

      const femaleArosHtml = aros.map(a => `
        <button type="button" class="alliance-size-btn alliance-size-btn-female" onclick="selectAllianceSizeDetailPage('female', ${a})" id="female-aro-${a}">${a}</button>
      `).join('');

      const solitaireArosHtml = aros.map(a => `
        <button type="button" class="alliance-size-btn alliance-size-btn-solitaire" onclick="selectAllianceSolitaireSizeDetailPage(${a})" id="solitaire-aro-${a}">${a}</button>
      `).join('');

      // Solitários com imagens reais do site usepersonalizado
      const solitaires = [
        { name: 'Classic', priceLabel: 'GRÁTIS', price: 0, img: 'https://cdn.awsli.com.br/300x300/2959/2959406/produto/399631237/par-de-aliancas-mora-2mm-de-namoro-anel-solitario-classic-em-prata-950-3ee23a5c-uxbvtl36b8.png' },
        { name: 'Grécia', priceLabel: '+ R$ 169,00', price: 169.00, img: 'https://cdn.awsli.com.br/300x300/2959/2959406/produto/399631272/par-de-aliancas-jasmim-2mm-de-namoro-anel-solitario-prata-950-818a8345-7wz8be9asg.png' },
        { name: 'Marte', priceLabel: '+ R$ 169,00', price: 169.00, img: 'https://cdn.awsli.com.br/300x300/2959/2959406/produto/399631405/aliancas-de-namoro-prata-950-com-anel-solitario-de-compromisso-reta-2mm-polida-c-3jz56mfdcj.png' },
        { name: 'Luxo', priceLabel: '+ R$ 169,00', price: 169.00, img: 'https://cdn.awsli.com.br/300x300/2959/2959406/produto/399631414/par-de-aliancas-de-namoro-prata-950-com-anel-solitario-de-compromisso-2mm-diaman-mf80rmwxzo.jpeg' }
      ];

      const solitairesHtml = solitaires.map((s, idx) => `
        <div class="solitaire-card ${idx === 0 ? 'selected' : ''}" onclick="selectSolitaireOptionDetailPage('${s.name}', ${s.price})" id="sol-card-${s.name}">
          <img src="${s.img}" alt="${s.name}">
          <div class="solitaire-name">${s.name}</div>
          <div class="solitaire-price">${s.priceLabel}</div>
        </div>
      `).join('');

      allianceDiv.innerHTML = `
        <!-- Customização Masculino e Feminino -->
        <div class="alliance-grid-columns">
          <div class="alliance-col">
            <h3 class="alliance-title">Selecione o Anel Masculino</h3>
            <p class="alliance-subtitle">Aro de 9 a 35</p>
            <div class="alliance-size-grid">${maleArosHtml}</div>
            
            <label class="alliance-engraving-label">Texto do anel masculino <span style="font-weight:normal;color:#888">(opcional)</span></label>
            <input type="text" id="allianceMaleText" class="alliance-engraving-input" placeholder="Ex: Te Amo, Nome, Datas..." maxlength="20" oninput="window._allianceMaleText=this.value">
          </div>
          
          <div class="alliance-col">
            <h3 class="alliance-title">Selecione o Anel Feminino</h3>
            <p class="alliance-subtitle">Aro de 9 a 35</p>
            <div class="alliance-size-grid">${femaleArosHtml}</div>
            
            <label class="alliance-engraving-label">Texto do anel feminino <span style="font-weight:normal;color:#888">(opcional)</span></label>
            <input type="text" id="allianceFemaleText" class="alliance-engraving-input" placeholder="Ex: Meu Amor, 12/06..." maxlength="20" oninput="window._allianceFemaleText=this.value">
          </div>
        </div>

        <!-- Customização Solitário e Aro do Solitário -->
        <div class="alliance-col" style="margin-top: 15px;">
          <h3 class="alliance-title" style="margin-bottom: 2px;">Selecione o Solitário</h3>
          <p class="alliance-subtitle">Escolha o modelo de solitário que acompanha o seu par</p>
          
          <div class="solitaire-carousel-wrap">
            <button type="button" class="solitaire-nav-btn solitaire-nav-prev" onclick="document.getElementById('solCarousel').scrollLeft -= 115">‹</button>
            <div class="solitaire-carousel" id="solCarousel">${solitairesHtml}</div>
            <button type="button" class="solitaire-nav-btn solitaire-nav-next" onclick="document.getElementById('solCarousel').scrollLeft += 115">›</button>
          </div>

          <h3 class="alliance-title" style="margin-top: 15px; margin-bottom: 2px;">Selecione o Aro do Solitário</h3>
          <p class="alliance-subtitle">Escolha o aro para o anel solitário selecionado</p>
          <div class="alliance-size-grid">${solitaireArosHtml}</div>
        </div>
      `;

      // Sobrescrever botões de compra para aliança de namoro
      if (btnCart) {
        btnCart.onclick = () => window.addAllianceToCartDetailPage(false);
      }
      if (btnBuy) {
        btnBuy.onclick = () => window.addAllianceToCartDetailPage(true);
      }
    } else {
      // NÃO é camiseta nem aliança. Limpar e ocultar customizadores
      customizerDiv.style.display = 'none';
      customizerDiv.innerHTML = '';
      allianceDiv.style.display = 'none';
      allianceDiv.innerHTML = '';

      // Restaurar comportamento padrão dos botões de compra
      if (btnCart) {
        btnCart.onclick = () => openProductModal(id);
      }
      if (btnBuy) {
        btnBuy.onclick = () => openProductModal(id);
      }
    }
  }, 100);
};

// Alliance helpers wired to window
window.selectAllianceSizeDetailPage = function(gender, size) {
  if (gender === 'male') {
    window._allianceMaleSize = size;
    document.querySelectorAll('.alliance-size-btn-male').forEach(btn => {
      btn.classList.toggle('selected', btn.id === 'male-aro-' + size);
    });
  } else if (gender === 'female') {
    window._allianceFemaleSize = size;
    document.querySelectorAll('.alliance-size-btn-female').forEach(btn => {
      btn.classList.toggle('selected', btn.id === 'female-aro-' + size);
    });
  }
};

window.selectAllianceSolitaireSizeDetailPage = function(size) {
  window._allianceSolitaireSize = size;
  document.querySelectorAll('.alliance-size-btn-solitaire').forEach(btn => {
    btn.classList.toggle('selected', btn.id === 'solitaire-aro-' + size);
  });
};

window.selectSolitaireOptionDetailPage = function(optionName, priceIncrease) {
  window._allianceSolitaireOption = optionName;
  window._allianceSolitairePrice = priceIncrease;
  
  // Atualiza classes selecionadas nos cards do carrossel
  document.querySelectorAll('.solitaire-card').forEach(card => {
    card.classList.toggle('selected', card.id === 'sol-card-' + optionName);
  });

  // Atualiza o preço principal exibido na tela do produto
  const p = (window.allProducts || []).find(x => x.id === window._currentDetailId);
  if (p) {
    const base = parseFloat(p.price || 0);
    const total = base + priceIncrease;
    const priceEl = document.getElementById('detPrice');
    if (priceEl) {
      priceEl.textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
    }
  }
};

window.addAllianceToCartDetailPage = function(buyNow) {
  const p = (window.allProducts || []).find(x => x.id === window._currentDetailId);
  if (!p) return;

  if (!window._allianceMaleSize) {
    izaToast('Selecione o aro do anel masculino.');
    return;
  }
  if (!window._allianceFemaleSize) {
    izaToast('Selecione o aro do anel feminino.');
    return;
  }
  if (!window._allianceSolitaireSize) {
    izaToast('Selecione o aro do anel solitário.');
    return;
  }

  const qty = 1;
  const base = parseFloat(p.price || 0);
  const extra = window._allianceSolitairePrice || 0;
  const totalPrice = (base + extra) * qty;

  let detailsText = `Aro Masculino: ${window._allianceMaleSize}`;
  if (window._allianceMaleText.trim()) {
    detailsText += ` (Gravação: "${window._allianceMaleText.trim()}")`;
  }
  detailsText += ` | Aro Feminino: ${window._allianceFemaleSize}`;
  if (window._allianceFemaleText.trim()) {
    detailsText += ` (Gravação: "${window._allianceFemaleText.trim()}")`;
  }
  detailsText += ` | Solitário: ${window._allianceSolitaireOption} (Aro: ${window._allianceSolitaireSize})`;
  if (extra > 0) {
    detailsText += ` [+ R$ ${extra.toFixed(2).replace('.', ',')}]`;
  }

  const itemObj = {
    product: p,
    qty,
    obs: detailsText,
    totalPrice,
    is_alliance: true,
    maleSize: window._allianceMaleSize,
    maleText: window._allianceMaleText.trim(),
    femaleSize: window._allianceFemaleSize,
    femaleText: window._allianceFemaleText.trim(),
    solitaireOption: window._allianceSolitaireOption,
    solitaireSize: window._allianceSolitaireSize,
    solitairePrice: extra
  };

  CART.items.push(itemObj);
  updateCartBadge();

  if (buyNow) {
    goToCheckout();
  } else {
    openUpsellModal();
  }
};
