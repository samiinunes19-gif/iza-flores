/* Arraste suave e profissional dos carrosséis horizontais (cards / categorias).
   - Mobile (toque): usa o scroll nativo com momentum — não interferimos.
   - Desktop (mouse): arrasta para rolar, com inércia ao soltar.
   - Suprime o clique que vem logo após um arraste real, para não abrir o produto sem querer
     (os cards usam onclick inline). */
(function () {
  'use strict';

  var SELECTOR = '.prods, .cats-scroll, .solitaire-carousel';
  var THRESHOLD = 6;          // px até considerar que virou arraste
  var drag = null;            // estado do arraste atual
  var justDragged = false;    // sinaliza p/ suprimir o próximo clique
  var suppressTimer = null;

  function onDown(e) {
    if (e.pointerType === 'touch') return;                 // mobile = scroll nativo
    if (e.button != null && e.button !== 0) return;        // só botão esquerdo
    var el = e.target.closest(SELECTOR);
    if (!el) return;
    if (el._momentum) { cancelAnimationFrame(el._momentum); el._momentum = 0; }
    drag = {
      el: el,
      pointerId: e.pointerId,
      startX: e.clientX,
      startLeft: el.scrollLeft,
      lastX: e.clientX,
      lastT: e.timeStamp,
      vel: 0,
      moved: false
    };
  }

  function onMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    var dx = e.clientX - drag.startX;
    if (!drag.moved) {
      if (Math.abs(dx) < THRESHOLD) return;
      drag.moved = true;
      drag.el.classList.add('dragging');
      try { drag.el.setPointerCapture(drag.pointerId); } catch (_) {}
    }
    drag.el.scrollLeft = drag.startLeft - dx;
    var dt = e.timeStamp - drag.lastT;
    if (dt > 0) drag.vel = (e.clientX - drag.lastX) / dt;   // px/ms
    drag.lastX = e.clientX;
    drag.lastT = e.timeStamp;
    e.preventDefault();
  }

  function onUp(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    var el = drag.el, moved = drag.moved, vel = drag.vel;
    try { el.releasePointerCapture(drag.pointerId); } catch (_) {}
    if (moved) {
      justDragged = true;
      clearTimeout(suppressTimer);
      suppressTimer = setTimeout(function () { justDragged = false; }, 350);
      settle(el, vel);                 // inércia; reativa o snap ao terminar
    } else {
      el.classList.remove('dragging');
    }
    drag = null;
  }

  function settle(el, vel) {
    var v = -vel * 16;                 // px por frame (~16ms)
    var FRICTION = 0.94;
    function done() { el.classList.remove('dragging'); }   // reativa scroll-snap → assenta suave
    if (Math.abs(v) < 0.6) { done(); return; }
    function step() {
      el.scrollLeft += v;
      v *= FRICTION;
      var atStart = el.scrollLeft <= 0;
      var atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      if (Math.abs(v) > 0.4 && !atStart && !atEnd) {
        el._momentum = requestAnimationFrame(step);
      } else {
        el._momentum = 0;
        done();
      }
    }
    el._momentum = requestAnimationFrame(step);
  }

  // Suprime, na fase de captura, o clique imediatamente após um arraste real.
  document.addEventListener('click', function (e) {
    if (justDragged) {
      e.stopImmediatePropagation();
      e.preventDefault();
      justDragged = false;
    }
  }, true);

  document.addEventListener('pointerdown', onDown);
  document.addEventListener('pointermove', onMove, { passive: false });
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);
})();
