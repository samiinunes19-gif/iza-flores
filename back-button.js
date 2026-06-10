/* Botão/gesto "Voltar" do celular (Android e iPhone):
   volta UMA tela dentro do site (fecha modal, sheet ou sub-página) em vez de
   fechar o site. Só deixa sair quando já está na home, sem nada aberto.
   Integra com o History API: mantém sempre 1 entrada-tampão no topo do histórico
   e, a cada "voltar", fecha a camada visível mais ao topo. */
(function () {
  'use strict';

  // Fecha a camada mais ao topo. Retorna true se fechou algo.
  function closeTopLayer() {
    // 1) Modais/sheets dinâmicos (ordem = topo visual primeiro)
    var dyn = ['premiumModal', 'cardModal', 'upsellModal', 'productModal', 'checkoutScreen', 'cartSheet'];
    for (var i = 0; i < dyn.length; i++) {
      var el = document.getElementById(dyn[i]);
      if (el) {
        if (dyn[i] === 'checkoutScreen') {
          el.remove();
          document.body.style.overflow = '';
        } else if (typeof window.closeOverlay === 'function') {
          window.closeOverlay(dyn[i]);
        } else {
          el.remove();
          document.body.style.overflow = '';
        }
        return true;
      }
    }
    // 2) Modal "Cidades Atendidas"
    var cid = document.getElementById('cidadesModal');
    if (cid && !cid.classList.contains('hidden')) { cid.classList.add('hidden'); return true; }
    // 3) Menu lateral
    var sm = document.getElementById('sideMenu');
    if (sm && sm.classList.contains('open')) {
      if (typeof window.closeSideMenu === 'function') window.closeSideMenu();
      else { sm.classList.remove('open'); var ov = document.getElementById('overlay'); if (ov) ov.classList.remove('open'); document.body.style.overflow = ''; }
      return true;
    }
    // 4) Barra de busca aberta
    var sb = document.getElementById('searchBar');
    if (sb && !sb.classList.contains('hidden')) {
      sb.classList.add('hidden');
      var input = sb.querySelector('input'); if (input) input.value = '';
      var catEl = document.getElementById('categoryPage');
      if (catEl && catEl.classList.contains('active') && typeof window.showPage === 'function') window.showPage('homePage');
      return true;
    }
    // 5) Sub-páginas (detalhe / categoria) → volta pra home
    var det = document.getElementById('detailPage');
    if (det && det.classList.contains('active')) { if (typeof window.showPage === 'function') window.showPage('homePage'); return true; }
    var ctg = document.getElementById('categoryPage');
    if (ctg && ctg.classList.contains('active')) { if (typeof window.showPage === 'function') window.showPage('homePage'); return true; }

    return false; // nada aberto: está na home limpa
  }

  var leaving = false;
  function arm() { try { history.pushState({ izaNav: 1 }, ''); } catch (e) {} }

  function init() {
    arm(); // mantém sempre 1 entrada-tampão
    window.addEventListener('popstate', function () {
      if (leaving) return;
      if (closeTopLayer()) {
        arm(); // re-arma para o próximo "voltar"
      } else {
        // Home limpa → deixa o usuário sair do site de verdade
        leaving = true;
        history.back();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
