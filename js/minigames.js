/* Minijuegos de habilidad (unos 10 segundos). Cada uno devuelve una puntuación de 0 a 1. */
(function (RC) {
  const { U } = RC;
  const MG = {};
  const W = 640, H = 360;
  const COL = { bg: '#0B1526', grid: 'rgba(255,255,255,0.04)', gold: '#C89B3C', goldL: '#F5D08A', blue: '#19D3F3', red: '#F0445E', green: '#3DDC84', text: '#F3ECDC', dim: '#7A8BA0' };

  MG.TYPES = {
    lasthit: { name: 'Último golpe', attr: 'farmeo', help: 'Haz clic en cada súbdito cuando su vida entre en la zona dorada. Si golpeas antes de tiempo, lo pierdes.' },
    aim: { name: 'Puntería', attr: 'mecanicas', help: 'Haz clic en los objetivos antes de que desaparezcan. Se mueven.' },
    dodge: { name: 'Esquivar skillshots', attr: 'mecanicas', help: 'Mueve a tu campeón con el ratón, el dedo o las flechas. Sal de las zonas rojas antes de que caiga la habilidad. Tienes 3 vidas.' },
    flash: { name: 'Reflejos de Flash', attr: 'mecanicas', help: 'El rival carga una habilidad. Pulsa Espacio o toca la pantalla justo cuando la lance. Si te adelantas, falla.' },
    peel: { name: 'Proteger al aliado', attr: 'comunicacion', help: 'Haz clic en los asesinos antes de que lleguen a tu aliado del centro. Solo puedes dejar pasar a 3.' },
    minimap: { name: 'Ojo al minimapa', attr: 'vision', help: 'El jungla rival (rojo) aparece un instante en el minimapa. Haz clic en él antes de que desaparezca. No toques a tus aliados (azul).' },
  };
  const BY_ROLE = {
    Top: ['lasthit', 'flash', 'dodge', 'aim'], Jungle: ['minimap', 'aim', 'dodge', 'flash'], Mid: ['dodge', 'aim', 'flash', 'lasthit'],
    ADC: ['lasthit', 'dodge', 'aim', 'flash'], Support: ['peel', 'minimap', 'flash', 'dodge'],
  };

  MG.pick = function (S) {
    const list = BY_ROLE[S.pl.role] || Object.keys(MG.TYPES);
    const last = S.pl.lastMg || [];
    const opts = list.filter((t) => !last.includes(t));
    const t = U.weighted(opts.length ? opts : list, (x) => list.length - list.indexOf(x));
    S.pl.lastMg = last.concat([t]).slice(-2);
    return t;
  };

  // Dificultad: con el atributo alto el minijuego es un poco más fácil (0,85 a 1,2)
  MG.ease = (S, type) => U.clamp(1 + ((S.pl.attrs[MG.TYPES[type].attr] || 70) - 72) / 110, 0.85, 1.2);
  MG.simScore = (S) => U.clamp(0.35 + (RC.P.ovr(S) - 75) / 50 + U.rand(-0.15, 0.15), 0.1, 0.9);

  // Arranca un minijuego en un canvas. Devuelve una función para pararlo.
  MG.start = function (canvas, type, ease, onEnd) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const input = { x: W / 2, y: H / 2, clicks: [], keys: {}, press: 0 };
    const pos = (e) => { const r = canvas.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e; return { x: ((p.clientX - r.left) / r.width) * W, y: ((p.clientY - r.top) / r.height) * H }; };
    const onDown = (e) => { e.preventDefault(); const p = pos(e); input.x = p.x; input.y = p.y; input.clicks.push(p); input.press++; input.down = true; };
    const onMove = (e) => { if (e.touches || e.buttons || e.type === 'mousemove') { const p = pos(e); input.x = p.x; input.y = p.y; input.moved = true; } };
    const onUp = () => { input.down = false; };
    const onKey = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'].includes(e.key)) e.preventDefault();
      if (e.type === 'keydown') { if (!input.keys[e.key] && (e.key === ' ' || e.key === 'Spacebar')) input.press++; input.keys[e.key] = true; } else input.keys[e.key] = false;
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    const game = GAMES[type](ease);
    let last = performance.now(), t = 0, done = false, raf;
    const finish = (score) => {
      if (done) return;
      done = true;
      stop();
      onEnd(U.clamp(score, 0, 1));
    };
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now; t += dt;
      const r = game.update(dt, t, input);
      input.clicks.length = 0;
      input.press = 0;
      draw(ctx, game, t);
      if (r != null) { finish(r); return; }
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    }
    raf = requestAnimationFrame(frame);
    return stop;
  };

  function draw(ctx, game, t) {
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = COL.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    game.draw(ctx, t);
    // Barra de tiempo
    if (game.dur) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(0, H - 4, W, 4);
      ctx.fillStyle = COL.gold;
      ctx.fillRect(0, H - 4, W * Math.min(1, t / game.dur), 4);
    }
    if (game.hud) {
      ctx.fillStyle = COL.text;
      ctx.font = '600 15px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(game.hud(), 12, 22);
    }
  }
  const circle = (ctx, x, y, r, fill, stroke) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); } };
  const hit = (c, x, y, r) => (c.x - x) ** 2 + (c.y - y) ** 2 <= r * r;

  const GAMES = {
    // ---- Último golpe ----
    lasthit(ease) {
      const total = 10, zone = 0.17 * ease;
      const mins = [];
      for (let i = 0; i < total; i++) mins.push({ x: 90 + (i % 5) * 115, y: i < 5 ? 130 : 250, start: 0.3 + i * 0.75 + U.rand(0, 0.3), speed: U.rand(0.28, 0.5) / ease, hp: 1, st: 'wait' });
      let got = 0;
      return {
        dur: 11,
        hud: () => `Súbditos asegurados: ${got}/${total}`,
        update(dt, t, inp) {
          for (const m of mins) {
            if (m.st === 'wait' && t >= m.start) m.st = 'live';
            if (m.st !== 'live') continue;
            m.hp -= m.speed * dt * (m.hp < 0.4 ? 1.6 : 1);
            if (m.hp <= 0) m.st = 'lost';
          }
          for (const c of inp.clicks) {
            const m = mins.find((x) => x.st === 'live' && Math.abs(c.x - x.x) < 34 && Math.abs(c.y - x.y) < 34);
            if (!m) continue;
            if (m.hp <= zone) { m.st = 'ok'; got++; } else m.st = 'lost';
          }
          if (mins.every((m) => m.st === 'ok' || m.st === 'lost')) return got / total;
          if (t > 11) return got / total;
          return null;
        },
        draw(ctx) {
          for (const m of mins) {
            if (m.st === 'wait') continue;
            const col = m.st === 'ok' ? COL.gold : m.st === 'lost' ? '#333B48' : COL.red;
            ctx.fillStyle = col;
            ctx.fillRect(m.x - 18, m.y - 14, 36, 28);
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(m.x - 30, m.y - 32, 60, 9);
            ctx.fillStyle = 'rgba(200,155,60,0.35)';
            ctx.fillRect(m.x - 30, m.y - 32, 60 * zone, 9);
            if (m.st === 'live') { ctx.fillStyle = m.hp <= zone ? COL.goldL : COL.green; ctx.fillRect(m.x - 30, m.y - 32, 60 * Math.max(0, m.hp), 9); }
            if (m.st === 'ok') { ctx.fillStyle = COL.goldL; ctx.font = '700 13px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('+21', m.x, m.y + 32); }
          }
        },
      };
    },
    // ---- Puntería ----
    aim(ease) {
      const total = 14, r = 20 * ease, life = 1.15 * ease;
      const tg = [];
      for (let i = 0; i < total; i++) tg.push({ t0: 0.4 + i * 0.72, x: U.rand(60, W - 60), y: U.rand(60, H - 60), vx: U.rand(-60, 60), vy: U.rand(-50, 50), st: 'wait' });
      let hits = 0;
      return {
        dur: 11.5,
        hud: () => `Aciertos: ${hits}/${total}`,
        update(dt, t, inp) {
          for (const o of tg) {
            if (o.st === 'wait' && t >= o.t0) o.st = 'live';
            if (o.st !== 'live') continue;
            o.x = U.clamp(o.x + o.vx * dt, r, W - r); o.y = U.clamp(o.y + o.vy * dt, r, H - r);
            if (t > o.t0 + life) o.st = 'miss';
          }
          for (const c of inp.clicks) { const o = tg.find((x) => x.st === 'live' && hit(x, c.x, c.y, r + 4)); if (o) { o.st = 'hit'; hits++; } }
          if (t > 11.5 || tg.every((o) => o.st === 'hit' || o.st === 'miss')) return hits / total;
          return null;
        },
        draw(ctx, t) {
          for (const o of tg) {
            if (o.st !== 'live') continue;
            const k = 1 - (t - o.t0) / life;
            circle(ctx, o.x, o.y, r, 'rgba(240,68,94,0.25)', COL.red);
            circle(ctx, o.x, o.y, r * 0.45, COL.red);
            ctx.strokeStyle = COL.goldL; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(o.x, o.y, r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
          }
        },
      };
    },
    // ---- Esquivar ----
    dodge(ease) {
      const me = { x: W / 2, y: H / 2, r: 12 };
      const shots = [];
      let lives = 3, next = 0.5, flash = 0;
      const speed = 230 * ease;
      return {
        dur: 11,
        hud: () => `Vidas: ${'♥'.repeat(lives)}`,
        update(dt, t, inp) {
          let dx = 0, dy = 0;
          if (inp.keys.ArrowLeft) dx--; if (inp.keys.ArrowRight) dx++; if (inp.keys.ArrowUp) dy--; if (inp.keys.ArrowDown) dy++;
          if (dx || dy) { const n = Math.hypot(dx, dy); me.x += (dx / n) * speed * dt; me.y += (dy / n) * speed * dt; inp.moved = false; }
          else if (inp.moved || inp.down) { const vx = inp.x - me.x, vy = inp.y - me.y, d = Math.hypot(vx, vy); if (d > 2) { const s = Math.min(d, speed * dt); me.x += (vx / d) * s; me.y += (vy / d) * s; } }
          me.x = U.clamp(me.x, me.r, W - me.r); me.y = U.clamp(me.y, me.r + 30, H - me.r - 6);
          if (t >= next && t < 10) {
            const warn = 0.75 / Math.max(0.9, ease - 0.05);
            if (U.chance(0.55)) {
              const horiz = U.chance(0.5);
              const pos = horiz ? U.clamp(me.y + U.rand(-50, 50), 40, H - 20) : U.clamp(me.x + U.rand(-60, 60), 20, W - 20);
              shots.push({ kind: 'line', horiz, pos, w: 46, t0: t, warn });
            } else shots.push({ kind: 'circle', x: U.clamp(me.x + U.rand(-50, 50), 40, W - 40), y: U.clamp(me.y + U.rand(-40, 40), 60, H - 40), r: 62, t0: t, warn });
            next = t + U.rand(0.45, 0.8) / ease;
          }
          for (const s of shots) {
            if (!s.fired && t >= s.t0 + s.warn) {
              s.fired = t;
              const inside = s.kind === 'line' ? Math.abs((s.horiz ? me.y : me.x) - s.pos) < s.w / 2 + me.r * 0.6 : hit(s, me.x, me.y, s.r + me.r * 0.6);
              if (inside) { lives--; flash = t; }
            }
          }
          for (let i = shots.length - 1; i >= 0; i--) if (shots[i].fired && t > shots[i].fired + 0.25) shots.splice(i, 1);
          this.flash = flash;
          if (lives <= 0) return 0;
          if (t > 11) return lives / 3;
          return null;
        },
        draw(ctx, t) {
          for (const s of shots) {
            const fired = !!s.fired;
            ctx.fillStyle = fired ? 'rgba(240,68,94,0.75)' : `rgba(240,68,94,${0.12 + 0.25 * ((t - s.t0) / s.warn)})`;
            if (s.kind === 'line') { if (s.horiz) ctx.fillRect(0, s.pos - s.w / 2, W, s.w); else ctx.fillRect(s.pos - s.w / 2, 0, s.w, H); }
            else circle(ctx, s.x, s.y, s.r, ctx.fillStyle);
          }
          circle(ctx, me.x, me.y, me.r, t - (this.flash || -9) < 0.3 ? COL.red : COL.blue, COL.text);
        },
      };
    },
    // ---- Reflejos de Flash ----
    flash(ease) {
      const rounds = 5, limit = 0.42 * ease;
      let round = 0, state = 'charge', t0 = 0.6, fireAt = 0, score = 0, msg = '', msgT = 0;
      const newRound = (t) => { state = 'charge'; t0 = t + 0.5; fireAt = t0 + U.rand(0.8, 2.2); };
      newRound(0);
      return {
        hud: () => `Ronda ${Math.min(round + 1, rounds)}/${rounds}`,
        update(dt, t, inp) {
          const pressed = inp.press > 0 || inp.clicks.length > 0;
          if (state === 'charge') {
            if (pressed && t >= t0) { msg = '¡Demasiado pronto!'; msgT = t; state = 'res'; this.rt = null; }
            else if (t >= fireAt) state = 'fire';
          } else if (state === 'fire') {
            const rt = t - fireAt;
            if (pressed) { const pts = rt <= limit ? 1 - (rt / limit) * 0.45 : 0; score += pts; msg = rt <= limit ? `Flash en ${Math.round(rt * 1000)} ms` : 'Tarde'; msgT = t; state = 'res'; }
            else if (rt > limit * 1.6) { msg = 'Te ha alcanzado'; msgT = t; state = 'res'; }
          } else if (state === 'res' && t - msgT > 0.9) {
            round++;
            if (round >= rounds) return score / rounds;
            newRound(t);
          }
          this.st = state; this.t = t;
          return null;
        },
        draw(ctx, t) {
          const ex = 110, ey = H / 2, mx = W - 120;
          circle(ctx, ex, ey, 22, 'rgba(240,68,94,0.3)', COL.red);
          circle(ctx, mx, ey, 16, COL.blue, COL.text);
          if (state === 'charge' && t >= t0) {
            const k = Math.min(1, (t - t0) / Math.max(0.1, fireAt - t0));
            ctx.strokeStyle = COL.red; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(ex, ey, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k * 0.92); ctx.stroke();
            ctx.fillStyle = 'rgba(240,68,94,0.12)'; ctx.fillRect(ex, ey - 14, mx - ex, 28);
          }
          if (state === 'fire') {
            const x = ex + (t - fireAt) * 900;
            ctx.fillStyle = COL.red; ctx.fillRect(ex, ey - 6, Math.min(x, mx) - ex, 12);
            ctx.fillStyle = COL.goldL; ctx.font = '800 26px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('¡AHORA!', W / 2, 80);
          }
          if (state === 'res') { ctx.fillStyle = COL.text; ctx.font = '700 22px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, 80); }
          ctx.fillStyle = COL.dim; ctx.font = '500 13px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Espacio o toque en la pantalla', W / 2, H - 20);
        },
      };
    },
    // ---- Proteger al aliado ----
    peel(ease) {
      const ally = { x: W / 2, y: H / 2 };
      const total = 13, sp = 95 / ease;
      const as = [];
      for (let i = 0; i < total; i++) {
        const a = U.rand(0, Math.PI * 2);
        as.push({ t0: 0.4 + i * 0.75, x: ally.x + Math.cos(a) * 340, y: ally.y + Math.sin(a) * 230, st: 'wait', v: sp * U.rand(0.85, 1.25) });
      }
      let leaked = 0, stopped = 0;
      return {
        dur: 13,
        hud: () => `Frenados: ${stopped} · Se han colado: ${leaked}/3`,
        update(dt, t, inp) {
          for (const o of as) {
            if (o.st === 'wait' && t >= o.t0) o.st = 'live';
            if (o.st !== 'live') continue;
            const dx = ally.x - o.x, dy = ally.y - o.y, d = Math.hypot(dx, dy);
            if (d < 24) { o.st = 'in'; leaked++; continue; }
            o.x += (dx / d) * o.v * dt; o.y += (dy / d) * o.v * dt;
          }
          for (const c of inp.clicks) { const o = as.find((x) => x.st === 'live' && hit(x, c.x, c.y, 24 * ease)); if (o) { o.st = 'cc'; stopped++; } }
          if (leaked >= 4) return 0;
          if (as.every((o) => o.st === 'cc' || o.st === 'in')) return U.clamp(1 - leaked / 4, 0, 1);
          return null;
        },
        draw(ctx) {
          circle(ctx, ally.x, ally.y, 70, 'rgba(25,211,243,0.06)');
          circle(ctx, ally.x, ally.y, 16, COL.blue, COL.goldL);
          for (const o of as) {
            if (o.st === 'live') { circle(ctx, o.x, o.y, 14, COL.red, '#000'); }
            if (o.st === 'cc') { circle(ctx, o.x, o.y, 14, '#5F7187'); }
          }
        },
      };
    },
    // ---- Ojo al minimapa ----
    minimap(ease) {
      const box = { x: W / 2 - 150, y: 30, s: 300 };
      const rounds = 9, show = 0.75 * ease;
      const ev = [];
      for (let i = 0; i < rounds; i++) {
        const t0 = 0.6 + i * 1.15 + U.rand(0, 0.3);
        const red = { x: box.x + U.rand(20, box.s - 20), y: box.y + U.rand(20, box.s - 20) };
        const blues = Array.from({ length: 3 }, () => ({ x: box.x + U.rand(15, box.s - 15), y: box.y + U.rand(15, box.s - 15) }));
        ev.push({ t0, red, blues, st: 'wait' });
      }
      let hits = 0, mistakes = 0;
      return {
        dur: 11.8,
        hud: () => `Avisos: ${hits}/${rounds} · Errores: ${mistakes}`,
        update(dt, t, inp) {
          for (const e of ev) {
            if (e.st === 'wait' && t >= e.t0) e.st = 'live';
            if (e.st === 'live' && t > e.t0 + show) e.st = 'miss';
          }
          for (const c of inp.clicks) {
            const live = ev.find((e) => e.st === 'live');
            if (live && hit(live.red, c.x, c.y, 18 * ease)) { live.st = 'hit'; hits++; continue; }
            const blue = ev.some((e) => e.st !== 'wait' && e.blues.some((b) => hit(b, c.x, c.y, 12)));
            if (blue) mistakes++;
          }
          if (t > 11.8 || ev.every((e) => e.st === 'hit' || e.st === 'miss')) return U.clamp((hits - mistakes * 0.5) / rounds, 0, 1);
          return null;
        },
        draw(ctx, t) {
          ctx.fillStyle = '#10261B'; ctx.fillRect(box.x, box.y, box.s, box.s);
          ctx.strokeStyle = COL.gold; ctx.lineWidth = 2; ctx.strokeRect(box.x, box.y, box.s, box.s);
          ctx.strokeStyle = 'rgba(25,211,243,0.35)'; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(box.x, box.y + box.s); ctx.lineTo(box.x + box.s, box.y); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 10;
          ctx.beginPath(); ctx.moveTo(box.x + 14, box.y + box.s - 14); ctx.lineTo(box.x + 14, box.y + 14); ctx.lineTo(box.x + box.s - 14, box.y + 14); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(box.x + 14, box.y + box.s - 14); ctx.lineTo(box.x + box.s - 14, box.y + box.s - 14); ctx.lineTo(box.x + box.s - 14, box.y + 14); ctx.stroke();
          const cur = ev.filter((e) => e.st !== 'wait' && t < e.t0 + 1.1).pop();
          if (cur) cur.blues.forEach((b) => circle(ctx, b.x, b.y, 8, COL.blue));
          const live = ev.find((e) => e.st === 'live');
          if (live) circle(ctx, live.red.x, live.red.y, 9, COL.red, '#fff');
        },
      };
    },
  };

  RC.MG = MG;
})(window.RC);
