/* =========================================================
   lil' help — page behaviour
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(pointer: fine)');

  /* -------------------------------------------------------
     Presence bar: one turn, start to finish.
     The legs sit where the status ring used to, so the state
     is carried by the character rather than by a spinner.
     ------------------------------------------------------- */
  function presenceBar(bar) {
    var lane = bar.querySelector('[data-lane]');
    var legs = bar.querySelector('[data-legs]');
    if (!lane) return;

    var STATES = {
      watching: {
        hold: 3000,
        html: '<span class="lane-label">Watching</span>' +
              '<span class="lane-note">Say the word, or press the shortcut</span>'
      },
      listening: {
        hold: 2500,
        html: '<span class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>' +
              '<span class="lane-label">Listening</span><span class="lane-note">Type instead</span>'
      },
      transcribing: {
        hold: 1400,
        html: '<span class="lane-label">Writing that down&hellip;</span>'
      },
      thinking: {
        hold: 1700,
        html: '<span class="lane-label">Thinking&hellip;</span>' +
              '<span class="lane-note">Working out what you meant</span>'
      },
      working: {
        hold: 4200,
        timer: true,
        html: '<span class="lane-label">Reading your calendar</span>' +
              '<span class="lane-note">3 conflicts this week</span>' +
              '<span class="elapsed" data-elapsed>0:00</span>'
      },
      done: {
        hold: 2000,
        html: '<svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ' +
              'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>' +
              '<span class="lane-label">Done</span>' +
              '<span class="lane-note">Moved your 2pm to Thursday</span>'
      },
      halt: {
        hold: 3600,
        html: '<span class="lane-label">Wait. Are you sure?</span>' +
              '<span class="lane-note">This deletes 412 files. It cannot be undone.</span>'
      }
    };

    var ORDER = ['watching', 'listening', 'transcribing', 'thinking', 'working', 'done'];
    var buttons = Array.prototype.slice.call(bar.parentNode.querySelectorAll('[data-go]'));
    var auto = true;
    var hold = null;
    var ticker = null;

    function paint(name) {
      var state = STATES[name];
      if (!state) return;

      bar.setAttribute('data-st', name);
      if (legs) legs.setAttribute('data-st', name);
      lane.innerHTML = state.html;

      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-go') === name ? 'true' : 'false');
      });

      if (ticker) { clearInterval(ticker); ticker = null; }
      if (state.timer && !reduce.matches) {
        var out = lane.querySelector('[data-elapsed]');
        var n = 0;
        ticker = setInterval(function () {
          n += 1;
          if (out) out.textContent = '0:' + (n < 10 ? '0' : '') + n;
        }, 1000);
      }
    }

    function advance(name) {
      paint(name);
      if (!auto || reduce.matches) return;
      if (hold) clearTimeout(hold);
      hold = setTimeout(function () {
        var i = ORDER.indexOf(name);
        advance(ORDER[(i + 1) % ORDER.length]);
      }, STATES[name].hold);
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        auto = false;
        if (hold) clearTimeout(hold);
        paint(b.getAttribute('data-go'));
      });
    });

    Array.prototype.forEach.call(bar.querySelectorAll('.chip-agent'), function (chip) {
      chip.addEventListener('click', function () {
        bar.querySelectorAll('.chip-agent').forEach(function (o) {
          o.setAttribute('aria-pressed', 'false');
        });
        chip.setAttribute('aria-pressed', 'true');
      });
    });

    var pin = bar.querySelector('.ib[aria-pressed]');
    if (pin) {
      pin.addEventListener('click', function () {
        pin.setAttribute('aria-pressed', pin.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      });
    }

    if (reduce.matches) paint('working');
    else advance('working');
  }

  /* -------------------------------------------------------
     Cursor companion: the legs follow the pointer, because
     on the desktop they are the pointer.
     ------------------------------------------------------- */
  function companion(stage) {
    var runner = stage.querySelector('[data-runner]');
    var legs = stage.querySelector('[data-legs]');
    var hint = stage.querySelector('[data-hint]');
    if (!runner) return;

    var x = stage.clientWidth / 2;
    var tx = x;
    var vel = 0;
    var idleAt = 0;

    function place() {
      runner.style.transform = 'translateX(' + x + 'px) scaleX(' + (vel < -0.4 ? -1 : 1) + ')';
    }
    function setState(s) {
      if (legs) legs.setAttribute('data-st', s);
      runner.classList.toggle('talk', s === 'working' || s === 'run');
    }

    if (!fine.matches || reduce.matches) {
      if (hint) hint.textContent = 'On a desktop, the legs follow your pointer here.';
      setState('idle');
      place();
      return;
    }

    stage.classList.add('live');
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      tx = Math.max(30, Math.min(r.width - 30, e.clientX - r.left));
      idleAt = Date.now();
      if (hint) hint.style.opacity = '0';
    });
    stage.addEventListener('pointerleave', function () {
      idleAt = 0;
      setState('idle');
      if (hint) hint.style.opacity = '';
    });

    (function loop() {
      var d = tx - x;
      x += d * 0.15;
      vel = d;
      place();
      var speed = Math.abs(d);
      if (speed > 24) setState('working');
      else if (speed > 2) setState('trot');
      else if (Date.now() - idleAt > 400) setState('idle');
      requestAnimationFrame(loop);
    })();
  }

  /* -------------------------------------------------------
     Disclosure rows
     ------------------------------------------------------- */
  function rows() {
    Array.prototype.forEach.call(document.querySelectorAll('.row-btn'), function (btn) {
      var row = btn.closest('.row');
      var panel = row && row.querySelector('.row-panel');
      if (!panel) return;

      if (!panel.id) panel.id = 'panel-' + Math.random().toString(36).slice(2, 8);
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', panel.id);

      btn.addEventListener('click', function () {
        var open = row.getAttribute('data-open') === 'true';
        row.setAttribute('data-open', open ? 'false' : 'true');
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });
  }

  /* -------------------------------------------------------
     Cursor zone: inside this section the pointer is replaced
     by the legs, which is what the pinned companion does on
     the desktop. Pointer-coarse and reduced-motion opt out.
     ------------------------------------------------------- */
  function cursorZone(zone) {
    var ghost = zone.querySelector('[data-ghost]');
    var legs = ghost && ghost.querySelector('[data-legs]');
    if (!ghost || !fine.matches || reduce.matches) return;

    var tx = 0, ty = 0, x = 0, y = 0, moving = 0, raf = null;

    zone.classList.add('live');

    zone.addEventListener('pointermove', function (e) {
      var r = zone.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      moving = Date.now();
      if (!raf) raf = requestAnimationFrame(step);
    });
    zone.addEventListener('pointerleave', function () {
      zone.classList.remove('live');
    });
    zone.addEventListener('pointerenter', function () {
      zone.classList.add('live');
    });

    function step() {
      var dx = tx - x;
      var dy = ty - y;
      x += dx * 0.28;
      y += dy * 0.28;
      ghost.style.transform = 'translate(' + x + 'px,' + y + 'px) scaleX(' + (dx < -0.6 ? -1 : 1) + ')';

      if (legs) {
        var speed = Math.abs(dx) + Math.abs(dy);
        if (speed > 22) legs.setAttribute('data-st', 'working');
        else if (speed > 1.5) legs.setAttribute('data-st', 'trot');
        else if (Date.now() - moving > 360) legs.setAttribute('data-st', 'idle');
      }
      raf = requestAnimationFrame(step);
    }
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-bar]'), presenceBar);
    Array.prototype.forEach.call(document.querySelectorAll('[data-companion]'), companion);
    Array.prototype.forEach.call(document.querySelectorAll('[data-cursor-zone]'), cursorZone);
    rows();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
