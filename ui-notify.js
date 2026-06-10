/* Avisos estilizados DENTRO do site — substitui os alert()/confirm() do navegador
   (que apareciam como popup feio do PC). izaToast = aviso; izaConfirm = sim/não. */
(function () {
  'use strict';

  var css = ''
    + '.iza-toast-wrap{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:100000;width:calc(100% - 28px);max-width:402px;display:flex;flex-direction:column;gap:8px;pointer-events:none}'
    + '.iza-toast{pointer-events:auto;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.18);display:flex;align-items:center;gap:11px;padding:13px 14px;border-left:4px solid #e91e8c;font-family:\'DM Sans\',sans-serif;animation:izaToastIn .28s cubic-bezier(.2,.9,.3,1.3)}'
    + '.iza-toast.hide{animation:izaToastOut .25s forwards}'
    + '.iza-toast-ic{flex-shrink:0;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#fce7f3;color:#e91e8c}'
    + '.iza-toast-ic svg{width:16px;height:16px}'
    + '.iza-toast-msg{font-size:13.5px;color:#1a1a2e;font-weight:600;line-height:1.35}'
    + '@keyframes izaToastIn{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}'
    + '@keyframes izaToastOut{to{opacity:0;transform:translateY(-14px)}}'
    + '.iza-confirm-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100001;display:flex;align-items:center;justify-content:center;padding:24px;animation:izaFade .2s}'
    + '.iza-confirm{background:#fff;border-radius:16px;max-width:340px;width:100%;padding:22px 20px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.25);font-family:\'DM Sans\',sans-serif;animation:izaPop .25s cubic-bezier(.2,.9,.3,1.3)}'
    + '.iza-confirm-msg{font-size:15px;color:#1a1a2e;font-weight:700;margin-bottom:18px;line-height:1.4}'
    + '.iza-confirm-btns{display:flex;gap:10px}'
    + '.iza-confirm-btns button{flex:1;padding:12px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;border:none;font-family:\'DM Sans\',sans-serif}'
    + '.iza-btn-cancel{background:#f1f1f4;color:#555}'
    + '.iza-btn-ok{background:#e91e8c;color:#fff}'
    + '@keyframes izaFade{from{opacity:0}to{opacity:1}}'
    + '@keyframes izaPop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}';
  var st = document.createElement('style');
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function wrap() {
    var w = document.getElementById('izaToastWrap');
    if (!w) {
      w = document.createElement('div');
      w.id = 'izaToastWrap';
      w.className = 'iza-toast-wrap';
      (document.body || document.documentElement).appendChild(w);
    }
    return w;
  }

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16.5" x2="12" y2="16.5"/></svg>';

  // Aviso simples (substitui alert)
  window.izaToast = function (message, opts) {
    opts = opts || {};
    var t = document.createElement('div');
    t.className = 'iza-toast';
    t.innerHTML = '<span class="iza-toast-ic">' + ICON + '</span><span class="iza-toast-msg">' + esc(message) + '</span>';
    wrap().appendChild(t);
    var dur = opts.duration || 3200;
    setTimeout(function () { t.classList.add('hide'); setTimeout(function () { t.remove(); }, 260); }, dur);
  };

  // Confirmação sim/não (substitui confirm)
  window.izaConfirm = function (message, onYes, onNo) {
    var ov = document.createElement('div');
    ov.className = 'iza-confirm-ov';
    ov.innerHTML = '<div class="iza-confirm"><div class="iza-confirm-msg">' + esc(message)
      + '</div><div class="iza-confirm-btns"><button class="iza-btn-cancel">Cancelar</button><button class="iza-btn-ok">Confirmar</button></div></div>';
    document.body.appendChild(ov);
    function close() { ov.remove(); }
    ov.querySelector('.iza-btn-cancel').onclick = function () { close(); if (typeof onNo === 'function') onNo(); };
    ov.querySelector('.iza-btn-ok').onclick = function () { close(); if (typeof onYes === 'function') onYes(); };
    ov.addEventListener('click', function (e) { if (e.target === ov) { close(); if (typeof onNo === 'function') onNo(); } });
  };
})();
