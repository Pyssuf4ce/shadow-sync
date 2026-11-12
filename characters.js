/* SHADOW SYNC — shared anime character art (Canvas 2D, no assets).
   Used by both game.html and index.html (slides). */
(function (g) {
  'use strict';
  const TAU = Math.PI * 2;
  const INK = '#1b1033';

  const SPEC = {
    hikari: {
      name: 'HIKARI', jp: '光',
      skin: '#ffe5d6', skinSh: '#f6bcae',
      hair: '#f5f8ff', hairSh: '#b9c4ff', tip: '#4fe6ff', hl: 'rgba(255,255,255,.75)',
      iris1: '#2f6bff', iris2: '#5af3ff',
      cloth: '#2b3191', clothSh: '#1c2168', trim: '#ffffff', accent: '#ff5fa2',
      boot: '#f4f4ff', glow: '#4fe6ff', glow2: '#ff7eb6'
    },
    kage: {
      name: 'KAGE-07', jp: '影',
      skin: '#f4dcec', skinSh: '#d4a6c6',
      hair: '#241a48', hairSh: '#130b2c', tip: '#ff2d55', hl: 'rgba(179,107,255,.8)',
      iris1: '#ff2d55', iris2: '#ffa05c',
      cloth: '#1d1540', clothSh: '#0d0820', trim: '#ff2d55', accent: '#c9143f',
      boot: '#2a1f52', glow: '#ff2d55', glow2: '#b36bff'
    }
  };

  const hexRGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function mixHex(a, b, t) {
    const A = hexRGB(a), B = hexRGB(b);
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }
  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function fillInk(c, fill, lw) {
    c.fillStyle = fill; c.fill();
    c.lineWidth = lw || 2.4; c.strokeStyle = INK; c.stroke();
  }
  function starPath(c, cx, cy, R, r, n, rot) {
    c.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = (rot === undefined ? -Math.PI / 2 : rot) + i * Math.PI / n;
      const d = i % 2 ? r : R;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath();
  }

  /* ---------- rig: hair / scarf physics ---------- */
  function mkChain(n, len, ax, ay, rx, ry, w0, w1, kind) {
    const pts = []; for (let i = 0; i <= n; i++) pts.push({ x: 0, y: 0 });
    return { n, len, pts, ax, ay, rx, ry, w0, w1, kind: kind || 'hair', inited: false };
  }
  function makeRig(who) {
    const rig = { who, t: Math.random() * 10, blink: 0, nextBlink: 2 + Math.random() * 3, chains: [] };
    if (who === 'hikari') {
      rig.chains.push(mkChain(7, 11, -21, -90, -0.55, 0.83, 11, 2.2));
      rig.chains.push(mkChain(7, 11, 21, -90, 0.55, 0.83, 11, 2.2));
    } else {
      rig.chains.push(mkChain(9, 12, -8, -96, -0.5, 0.86, 13, 2.2, 'hair'));
      rig.chains.push(mkChain(8, 11, -12, -52, -0.92, 0.38, 10, 3, 'scarf'));
    }
    return rig;
  }
  function updateRig(rig, dt, vx, vy, flip, scale) {
    dt = Math.min(dt, 0.05); rig.t += dt;
    rig.nextBlink -= dt;
    if (rig.nextBlink < 0) { rig.blink = 0.13; rig.nextBlink = 2 + Math.random() * 3.5; }
    if (rig.blink > 0) rig.blink = Math.max(0, rig.blink - dt);
    const lvx = vx * flip / scale, lvy = vy / scale;
    for (const c of rig.chains) {
      const p = c.pts;
      if (!c.inited) {
        p[0].x = c.ax; p[0].y = c.ay;
        for (let i = 1; i <= c.n; i++) { p[i].x = p[i - 1].x + c.rx * c.len; p[i].y = p[i - 1].y + c.ry * c.len; }
        c.inited = true;
      }
      p[0].x = c.ax; p[0].y = c.ay;
      const amp = c.kind === 'scarf' ? 6 : 2.4;
      const sp = c.kind === 'scarf' ? 7 : 3.2;
      for (let i = 1; i <= c.n; i++) {
        const q = p[i], pr = p[i - 1];
        q.x -= lvx * dt * 0.85; q.y -= lvy * dt * 0.85;
        const wob = Math.sin(rig.t * sp + i * 0.8 + c.ax) * amp * (i / c.n);
        const tx = pr.x + c.rx * c.len - c.ry * wob;
        const ty = pr.y + c.ry * c.len + c.rx * wob;
        const k = Math.min(1, dt * 9);
        q.x += (tx - q.x) * k; q.y += (ty - q.y) * k;
        let dx = q.x - pr.x, dy = q.y - pr.y; const d = Math.hypot(dx, dy) || 1;
        q.x = pr.x + dx / d * c.len; q.y = pr.y + dy / d * c.len;
      }
    }
  }
  function drawChain(c, ch, colA, colB) {
    const p = ch.pts;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < ch.n; i++) {
        const t = i / (ch.n - 1);
        const w = ch.w0 + (ch.w1 - ch.w0) * t;
        c.lineCap = 'round';
        c.lineWidth = pass === 0 ? w + 5 : w;
        c.strokeStyle = pass === 0 ? INK : mixHex(colA, colB, Math.min(1, t * t * 1.15));
        c.beginPath(); c.moveTo(p[i].x, p[i].y); c.lineTo(p[i + 1].x, p[i + 1].y); c.stroke();
      }
    }
  }

  /* ---------- face parts ---------- */
  function facePath(c) {
    c.beginPath(); c.moveTo(-23, -70);
    c.bezierCurveTo(-23, -54, -13, -48, 0, -48);
    c.bezierCurveTo(13, -48, 23, -54, 23, -70);
    c.bezierCurveTo(23, -96, -23, -96, -23, -70); c.closePath();
  }
  function bangsPath(c, dy, who) {
    c.beginPath(); c.moveTo(-27, -78 + dy);
    c.bezierCurveTo(-33, -110 + dy, 33, -110 + dy, 27, -78 + dy);
    const z = who === 'kage'
      ? [[21, -88], [17, -68], [9, -84], [3, -65], [-3, -84], [-12, -70], [-19, -88], [-27, -78]]
      : [[22, -87], [15, -72], [8, -85], [0, -69], [-8, -85], [-15, -72], [-22, -87], [-27, -78]];
    for (const q of z) c.lineTo(q[0], q[1] + dy);
    c.closePath();
  }
  function eye(c, spec, cx, cy, gx, gy, blink, sharp, t) {
    const h = (sharp ? 6.4 : 7.6) * (1 - blink * 0.88), w = sharp ? 6.4 : 6.3;
    c.beginPath(); c.ellipse(cx, cy, w, h, 0, 0, TAU); c.fillStyle = '#fff'; c.fill();
    c.save(); c.beginPath(); c.ellipse(cx, cy, w, h, 0, 0, TAU); c.clip();
    const ix = cx + gx, iy = cy + gy + 0.5;
    const gr = c.createLinearGradient(0, iy - h, 0, iy + h);
    gr.addColorStop(0, spec.iris1); gr.addColorStop(1, spec.iris2);
    c.fillStyle = gr; c.beginPath(); c.ellipse(ix, iy, 4.9, h * 0.97, 0, 0, TAU); c.fill();
    c.fillStyle = INK; c.beginPath();
    if (sharp) { c.ellipse(ix, iy, 1.3, h * 0.78, 0, 0, TAU); } else { c.ellipse(ix, iy, 2.1, h * 0.52, 0, 0, TAU); }
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(ix - 1.9, iy - h * 0.42, 2.1, 0, TAU); c.fill();
    c.beginPath(); c.arc(ix + 2, iy + h * 0.38, 1, 0, TAU); c.fill();
    c.restore();
    c.beginPath(); c.ellipse(cx, cy, w + 0.5, h + 0.4, 0, Math.PI * 1.04, Math.PI * 1.96);
    c.strokeStyle = INK; c.lineWidth = 2.8; c.lineCap = 'round'; c.stroke();
    // lash flick
    c.beginPath(); c.moveTo(cx - w - 0.3, cy - 1.5); c.lineTo(cx - w - 3.2, cy - 3.6);
    c.lineWidth = 2; c.stroke();
  }

  /* ---------- main draw ---------- */
  function drawChar(c, rig, x, y, s, o) {
    o = o || {};
    const spec = SPEC[rig.who], kage = rig.who === 'kage';
    const aim = o.aim || 0, ax = Math.cos(aim), ay = Math.sin(aim);
    const flip = o.flip !== undefined ? o.flip : (ax < 0 ? -1 : 1);
    const t = o.t !== undefined ? o.t : rig.t;
    const mv = o.speed || 0;
    const bob = Math.sin(t * 14) * 1.7 * mv + Math.sin(t * 2.3) * 1.1;
    const step = Math.sin(t * 14) * mv;
    const ldx = ax * flip, ldy = ay;
    const blink = rig.blink > 0 ? 1 : 0;
    const back = ldy < -0.35; // weapon arm goes behind the head when aiming away

    c.save();
    if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
    if (o.flash > 0) c.filter = 'brightness(' + (1 + o.flash * 2.4).toFixed(2) + ') saturate(' + (1 - o.flash * 0.75).toFixed(2) + ')';
    c.translate(x, y);

    // ground shadow + aura ring
    c.save();
    c.fillStyle = 'rgba(8,4,28,.42)'; c.beginPath(); c.ellipse(0, 3, 24 * s, 7.5 * s, 0, 0, TAU); c.fill();
    if (o.aura !== false) {
      c.translate(0, 3); c.scale(1, 0.32);
      c.setLineDash([11 * s, 8 * s]); c.lineDashOffset = -t * 42 * (kage ? -1 : 1);
      c.lineWidth = 3.4 * s; c.strokeStyle = spec.glow; c.globalAlpha *= 0.85;
      c.beginPath(); c.arc(0, 0, 33 * s, 0, TAU); c.stroke();
      c.setLineDash([]); c.lineWidth = 1.5 * s; c.globalAlpha *= 0.6;
      c.beginPath(); c.arc(0, 0, 40 * s, 0, TAU); c.strokeStyle = spec.glow2; c.stroke();
    }
    c.restore();

    c.scale(flip * s, s);
    c.lineJoin = 'round';

    // back chains (hair / scarf)
    for (const ch of rig.chains) {
      if (ch.kind === 'scarf') drawChain(c, ch, spec.accent, '#ff7a93');
      else drawChain(c, ch, spec.hair, spec.tip);
    }

    // legs
    const leg = (lx, lift) => {
      c.save(); c.translate(lx, -lift);
      rr(c, -5, -26, 10, 20, 4); fillInk(c, kage ? spec.clothSh : '#fdfdff');
      rr(c, -7, -10, 14, 10, 4); fillInk(c, spec.boot);
      c.fillStyle = kage ? spec.trim : spec.accent; c.fillRect(-6, -7, 12, 2.2);
      c.restore();
    };
    leg(-8, Math.max(0, step) * 4); leg(8, Math.max(0, -step) * 4);

    c.save(); c.translate(0, bob);

    // back hair mass
    c.beginPath(); c.ellipse(0, -80, 29, 24, 0, 0, TAU); fillInk(c, spec.hairSh);
    if (kage) { rr(c, -25, -82, 50, 34, 14); fillInk(c, spec.hairSh); }

    // skirt / cloak
    if (!kage) {
      c.beginPath(); c.moveTo(-14, -34); c.lineTo(14, -34); c.lineTo(22, -15); c.lineTo(-22, -15); c.closePath();
      fillInk(c, spec.clothSh);
      c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(-21, -17.5); c.lineTo(21, -17.5); c.stroke();
    } else {
      c.beginPath(); c.moveTo(-16, -52); c.lineTo(16, -52); c.lineTo(24, -8);
      c.lineTo(15, -16); c.lineTo(8, -5); c.lineTo(0, -15); c.lineTo(-8, -5); c.lineTo(-15, -16); c.lineTo(-24, -8); c.closePath();
      fillInk(c, spec.cloth);
      c.strokeStyle = spec.trim; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -50); c.lineTo(0, -15); c.stroke();
      c.strokeStyle = spec.accent; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-15, -16); c.lineTo(-24, -8); c.moveTo(15, -16); c.lineTo(24, -8); c.stroke();
    }
    // torso
    rr(c, -14, -54, 28, 28, 9); fillInk(c, spec.cloth);
    if (!kage) {
      c.beginPath(); c.moveTo(-10, -54); c.lineTo(0, -40); c.lineTo(10, -54); c.closePath(); fillInk(c, '#ffffff', 2);
      starPath(c, 0, -36, 5, 2.3, 5); fillInk(c, spec.accent, 1.8);
    } else {
      c.beginPath(); c.moveTo(-14, -54); c.lineTo(0, -42); c.lineTo(14, -54); c.closePath(); fillInk(c, spec.clothSh, 2);
      c.strokeStyle = spec.trim; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-9, -52); c.lineTo(0, -43); c.lineTo(9, -52); c.stroke();
    }

    // arm + weapon (drawn before head when aiming away)
    const drawArms = () => {
      // far arm
      c.lineCap = 'round';
      c.strokeStyle = INK; c.lineWidth = 9; c.beginPath(); c.moveTo(-14, -48); c.lineTo(-18, -33 + step * 2); c.stroke();
      c.strokeStyle = spec.cloth; c.lineWidth = 5.5; c.beginPath(); c.moveTo(-14, -48); c.lineTo(-18, -33 + step * 2); c.stroke();
      c.beginPath(); c.arc(-18, -31 + step * 2, 4, 0, TAU); fillInk(c, spec.skin, 2);
      // weapon arm
      const sx = 14, sy = -48, hx = sx + ldx * 17, hy = sy + ldy * 17;
      c.strokeStyle = INK; c.lineWidth = 9; c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke();
      c.strokeStyle = spec.cloth; c.lineWidth = 5.5; c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke();
      c.save(); c.translate(hx, hy); c.rotate(Math.atan2(ldy, ldx));
      c.lineCap = 'round';
      if (!kage) {
        c.strokeStyle = INK; c.lineWidth = 6.5; c.beginPath(); c.moveTo(-7, 0); c.lineTo(25, 0); c.stroke();
        c.strokeStyle = '#fff'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(-7, 0); c.lineTo(25, 0); c.stroke();
        c.strokeStyle = spec.accent; c.lineWidth = 3.2; c.beginPath(); c.moveTo(5, 0); c.lineTo(9, 0); c.stroke();
        const pulse = 1 + Math.sin(t * 6) * 0.08;
        const gl = c.createRadialGradient(34, 0, 1, 34, 0, 22);
        gl.addColorStop(0, 'rgba(255,255,255,.95)'); gl.addColorStop(.3, 'rgba(79,230,255,.55)'); gl.addColorStop(1, 'rgba(79,230,255,0)');
        c.fillStyle = gl; c.beginPath(); c.arc(34, 0, 22 * pulse, 0, TAU); c.fill();
        starPath(c, 34, 0, 11 * pulse, 4.8, 4, t * 1.5); fillInk(c, '#ffe9a8', 2.2);
      } else {
        c.fillStyle = INK; c.strokeStyle = INK;
        c.beginPath(); c.arc(-5, 0, 4.5, 0, TAU); c.lineWidth = 3; c.strokeStyle = spec.accent; c.stroke();
        c.beginPath(); c.moveTo(0, -3.2); c.lineTo(30, -6.5); c.lineTo(46, 0); c.lineTo(30, 6.5); c.lineTo(0, 3.2); c.closePath();
        fillInk(c, '#ece8ff', 2.4);
        c.strokeStyle = spec.glow; c.lineWidth = 1.8; c.beginPath(); c.moveTo(4, 0); c.lineTo(42, 0); c.stroke();
        const gl = c.createRadialGradient(40, 0, 1, 40, 0, 20);
        gl.addColorStop(0, 'rgba(255,45,85,.7)'); gl.addColorStop(1, 'rgba(255,45,85,0)');
        c.fillStyle = gl; c.beginPath(); c.arc(40, 0, 20, 0, TAU); c.fill();
      }
      c.restore();
      c.beginPath(); c.arc(hx, hy, 4.4, 0, TAU); fillInk(c, spec.skin, 2);
    };
    if (back) drawArms();

    // face
    facePath(c); fillInk(c, spec.skin, 2.6);
    c.save(); facePath(c); c.clip();
    bangsPath(c, 6, rig.who); c.fillStyle = spec.skinSh; c.fill();
    c.restore();
    // cheeks
    c.fillStyle = 'rgba(255,110,150,.42)';
    c.beginPath(); c.ellipse(-15, -55, 4.6, 2.6, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(15, -55, 4.6, 2.6, 0, 0, TAU); c.fill();
    // eyes
    const gx = ldx * 1.7, gy = ldy * 1.4;
    eye(c, spec, -9.6, -64, gx, gy, blink, kage, t);
    if (!kage) eye(c, spec, 9.6, -64, gx, gy, blink, false, t);
    // mouth
    c.strokeStyle = INK; c.lineWidth = 1.9; c.lineCap = 'round'; c.beginPath();
    if (kage) { c.moveTo(-4, -54.2); c.quadraticCurveTo(1, -52.5, 6, -56); }
    else { c.moveTo(-3.5, -54.6); c.quadraticCurveTo(0, -51.4, 3.5, -54.6); }
    c.stroke();

    if (kage) { // half mask + scanning eye
      c.beginPath(); c.moveTo(1, -92); c.lineTo(22, -86);
      c.bezierCurveTo(25, -72, 21, -60, 11, -52); c.lineTo(1, -58); c.bezierCurveTo(5, -68, 4, -80, 1, -92); c.closePath();
      fillInk(c, '#efeaff', 2.4);
      c.strokeStyle = spec.accent; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(4, -86); c.lineTo(9, -78); c.moveTo(16, -84); c.lineTo(20, -72); c.moveTo(7, -60); c.lineTo(12, -57); c.stroke();
      const pulse = 0.65 + 0.35 * Math.sin(t * 5);
      c.save(); c.lineCap = 'round';
      c.strokeStyle = 'rgba(255,45,85,' + (pulse * 0.28).toFixed(2) + ')'; c.lineWidth = 8;
      c.beginPath(); c.moveTo(7, -65); c.lineTo(19, -65); c.stroke();
      c.strokeStyle = 'rgba(255,45,85,' + pulse.toFixed(2) + ')'; c.lineWidth = 3.2;
      c.beginPath(); c.moveTo(7, -65); c.lineTo(19, -65); c.stroke();
      c.restore();
      const sc = ((t * 1.4) % 1);
      c.fillStyle = '#fff'; c.fillRect(7 + sc * 12, -68, 1.6, 6);
    }

    // bangs
    bangsPath(c, 0, rig.who); c.fillStyle = spec.hair; c.fill();
    c.strokeStyle = INK; c.lineWidth = 2.4; c.lineJoin = 'round';
    c.beginPath();
    const z = kage
      ? [[27, -78], [21, -88], [17, -68], [9, -84], [3, -65], [-3, -84], [-12, -70], [-19, -88], [-27, -78]]
      : [[27, -78], [22, -87], [15, -72], [8, -85], [0, -69], [-8, -85], [-15, -72], [-22, -87], [-27, -78]];
    z.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]));
    c.stroke();
    // top outline of hair
    c.beginPath(); c.moveTo(-27, -78); c.bezierCurveTo(-33, -110, 33, -110, 27, -78); c.stroke();
    // tip tint on bangs
    if (!kage) {
      c.save(); bangsPath(c, 0, rig.who); c.clip();
      const gg = c.createLinearGradient(0, -100, 0, -66);
      gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.55, 'rgba(255,255,255,0)'); gg.addColorStop(1, 'rgba(79,230,255,.75)');
      c.fillStyle = gg; c.fillRect(-40, -110, 80, 50); c.restore();
    } else {
      c.save(); bangsPath(c, 0, rig.who); c.clip();
      const gg = c.createLinearGradient(0, -100, 0, -62);
      gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(.6, 'rgba(0,0,0,0)'); gg.addColorStop(1, 'rgba(255,45,85,.85)');
      c.fillStyle = gg; c.fillRect(-40, -110, 80, 50); c.restore();
    }
    // angel-ring highlight
    c.beginPath(); c.ellipse(0, -90, 17, 9, 0, Math.PI * 1.08, Math.PI * 1.92);
    c.strokeStyle = spec.hl; c.lineWidth = 3.2; c.lineCap = 'round'; c.stroke();

    // side locks
    const lock = sg => {
      c.beginPath(); c.moveTo(sg * 22, -84); c.quadraticCurveTo(sg * 31, -70, sg * 25, -50); c.lineTo(sg * 21, -62); c.quadraticCurveTo(sg * 20, -72, sg * 17, -80); c.closePath();
      fillInk(c, spec.hair, 2.2);
    };
    lock(-1); lock(1);

    // accessories
    if (!kage) {
      [-1, 1].forEach(sg => { // ribbon bows on twin tails
        const bx = sg * 21, by = -90;
        c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + sg * 12, by - 8); c.lineTo(bx + sg * 12, by + 8); c.closePath(); fillInk(c, spec.accent, 2);
        c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - sg * 9, by - 7); c.lineTo(bx - sg * 9, by + 7); c.closePath(); fillInk(c, spec.accent, 2);
        c.beginPath(); c.arc(bx, by, 3.4, 0, TAU); fillInk(c, '#ffd3e6', 1.8);
      });
      starPath(c, -14, -96, 5.5, 2.5, 5, t); fillInk(c, '#ffe9a8', 1.8); // star hairpin
    } else {
      // data halo
      c.save(); c.translate(0, -113); c.scale(1, 0.3);
      c.setLineDash([9, 6]); c.lineDashOffset = -t * 36;
      c.strokeStyle = spec.glow2; c.globalAlpha *= 0.25; c.lineWidth = 10;
      c.beginPath(); c.arc(0, 0, 24, 0, TAU); c.stroke();
      c.globalAlpha /= 0.25; c.lineWidth = 4;
      c.beginPath(); c.arc(0, 0, 24, 0, TAU); c.stroke();
      c.setLineDash([]); c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.stroke();
      c.restore();
    }
    c.restore(); // end bob group

    c.save(); c.translate(0, bob); if (!back) drawArms(); c.restore();

    c.restore(); // end scale

    // orbiting data shards for Kage (world orientation)
    if (kage && o.shards !== false) {
      for (let i = 0; i < 3; i++) {
        const a = t * 1.8 + i * TAU / 3;
        const sx = Math.cos(a) * 44 * s, sy = -52 * s + Math.sin(a) * 15 * s;
        c.save(); c.translate(sx, sy); c.rotate(a * 2);
        c.globalAlpha *= 0.9;
        c.beginPath(); c.moveTo(0, -6 * s); c.lineTo(3.6 * s, 0); c.lineTo(0, 6 * s); c.lineTo(-3.6 * s, 0); c.closePath();
        c.fillStyle = 'rgba(255,45,85,.22)'; c.save(); c.scale(1.9, 1.9); c.fill(); c.restore();
        c.fillStyle = i === 0 ? '#ff2d55' : '#b36bff'; c.fill();
        c.restore();
      }
    }
    c.restore();
  }

  /* where projectiles leave the weapon (world coords) */
  function muzzle(who, x, y, s, aim, bobless) {
    const ax = Math.cos(aim), ay = Math.sin(aim);
    const flip = ax < 0 ? -1 : 1;
    const ldx = ax * flip, ldy = ay;
    const len = who === 'kage' ? 17 + 40 : 17 + 36;
    const lx = 14 + ldx * len, ly = -48 + ldy * len;
    return { x: x + flip * s * lx, y: y + s * ly };
  }

  g.CH = { SPEC, INK, makeRig, updateRig, drawChar, muzzle, starPath, mixHex, rr };
})(window);
