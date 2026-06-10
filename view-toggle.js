/* Alternador de visualização PC (desktop) / Celular (mobile).
   Apenas muda a largura da página; a escolha fica salva no navegador. */
(function () {
  var KEY = 'floresViewMode';

  function apply(mode) {
    var isPc = mode === 'pc';
    document.body.classList.toggle('view-pc', isPc);
    var bPc = document.getElementById('viewPc');
    var bMob = document.getElementById('viewMobile');
    if (bPc) bPc.classList.toggle('active', isPc);
    if (bMob) bMob.classList.toggle('active', !isPc);
    try { localStorage.setItem(KEY, mode); } catch (e) {}
  }

  function init() {
    var saved = 'mobile';
    try { saved = localStorage.getItem(KEY) || 'mobile'; } catch (e) {}
    apply(saved);

    var bPc = document.getElementById('viewPc');
    var bMob = document.getElementById('viewMobile');
    if (bPc) bPc.addEventListener('click', function () { apply('pc'); });
    if (bMob) bMob.addEventListener('click', function () { apply('mobile'); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
