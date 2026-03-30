/**
 * Main Simulation Engine & p5.js Integration
 * Real-time trajectory simulation, rendering, and collision detection
 */

// p5.js sketch instance
let p5Sketch;

// Sketch setup
p5Sketch = new p5(function(p) {
  let W, H, gY, launchX, defX;
  const KM2PX = () => CONSTANTS.SCALE * 1000;

  /**
   * Calculate layout dimensions
   */
  function layout() {
    const wr = document.getElementById('sim-wrap');
    W = wr.clientWidth;
    H = wr.clientHeight;
    gY = H - CONSTANTS.GROUND_HEIGHT;
    launchX = W * 0.12;
    defX = W * 0.72;
  }

  p.setup = function() {
    layout();
    p.createCanvas(W, H).parent('sim-wrap');
    p.frameRate(60);
  };

  p.windowResized = function() {
    layout();
    p.resizeCanvas(W, H);
  };

  /**
   * Main draw loop
   */
  p.draw = function() {
    p.background(5, 10, 18);
    
    if (document.getElementById('chkGrid').checked) drawGrid();
    drawRadar();
    drawTerrain();
    drawSites();
    
    if (SIMULATION_STATE.running) tick();
    
    drawTrails();
    drawLOS();
    drawVectors();
    drawMissiles();
    drawExplosions();
    drawOnCanvasLabels();
    
    if (!SIMULATION_STATE.running && SIMULATION_STATE.result) drawResult();
  };

  /**
   * Main simulation tick
   */
  function tick() {
    const atkKey = document.getElementById('selAtk').value;
    const defKey = document.getElementById('selDef').value;
    const N = getValue('slN');
    const K = getValue('slK');
    const a = SIMULATION_STATE.atk;
    const i = SIMULATION_STATE.inter;

    // Update attack
    if (a && a.alive) {
      switch (atkKey) {
        case 'BALLISTIC': PHYSICS.ballistic_step(a, CONSTANTS.DT); break;
        case 'BALLISTIC_DRAG': PHYSICS.ballistic_drag_step(a, CONSTANTS.DT); break;
        case 'CRUISE': PHYSICS.cruise_step(a, CONSTANTS.DT); break;
        case 'BOOST_GLIDE': PHYSICS.boost_glide_step(a, CONSTANTS.DT); break;
      }
      
      SIMULATION_STATE.atkTrail.push({ x: a.x, y: a.y });
      if (SIMULATION_STATE.atkTrail.length > 1400) SIMULATION_STATE.atkTrail.shift();
      
      SIMULATION_STATE.atkSpd = Math.sqrt(a.vx * a.vx + a.vy * a.vy) / CONSTANTS.SCALE;
      SIMULATION_STATE.atkAlt = Math.max(0, (gY - a.y) / CONSTANTS.SCALE);
      
      // Check miss condition
      if (a.y >= gY || a.x > W + 30 || a.x < -120) {
        explode(Math.min(Math.max(a.x, 0), W), gY, 'atk');
        a.alive = false;
        if (SIMULATION_STATE.inter) SIMULATION_STATE.inter.alive = false;
        endSimulation('MISS', null);
        return;
      }
    }

    // Launch interceptor
    if (!SIMULATION_STATE.inter && a && a.alive) {
      const fire = a.x > W * 0.20;
      if (fire) {
        const v = getValue('slDS');
        switch (defKey) {
          case 'PN': SIMULATION_STATE.inter = PHYSICS.pn_init(defX, gY, v, N); break;
          case 'APN': SIMULATION_STATE.inter = PHYSICS.apn_init(defX, gY, v, N, K); break;
          case 'PURSUIT': SIMULATION_STATE.inter = PHYSICS.pursuit_init(defX, gY, v); break;
          case 'COLLISION': SIMULATION_STATE.inter = PHYSICS.collision_init(defX, gY, v); break;
        }
      }
    }

    // Update interceptor
    const ii = SIMULATION_STATE.inter;
    if (ii && ii.alive && a && a.alive) {
      ii.N = N;
      ii.K = K;
      
      switch (defKey) {
        case 'PN': PHYSICS.pn_step(ii, a, CONSTANTS.DT); break;
        case 'APN': PHYSICS.apn_step(ii, a, CONSTANTS.DT); break;
        case 'PURSUIT': PHYSICS.pursuit_step(ii, a, CONSTANTS.DT); break;
        case 'COLLISION': PHYSICS.collision_step(ii, a, CONSTANTS.DT); break;
      }
      
      SIMULATION_STATE.intTrail.push({ x: ii.x, y: ii.y });
      if (SIMULATION_STATE.intTrail.length > 1400) SIMULATION_STATE.intTrail.shift();
      
      SIMULATION_STATE.intSpd = Math.sqrt(ii.vx * ii.vx + ii.vy * ii.vy) / CONSTANTS.SCALE;
      
      const dx = ii.x - a.x;
      const dy = ii.y - a.y;
      const sep = Math.sqrt(dx * dx + dy * dy);
      
      const pS = ii._pS || sep;
      SIMULATION_STATE.closure = -(sep - pS) / (CONSTANTS.DT * CONSTANTS.SCALE);
      ii._pS = sep;
      SIMULATION_STATE.sep = sep;
      
      // Check hit condition
      if (sep < 16) {
        explode((ii.x + a.x) / 2, (ii.y + a.y) / 2, 'hit');
        a.alive = false;
        ii.alive = false;
        endSimulation('HIT', sep);
        return;
      }
      
      // Check miss condition
      if (ii.x < -40 || ii.x > W + 40 || ii.y > gY + 20 || ii.y < -100) {
        ii.alive = false;
        endSimulation('MISS', sep);
        return;
      }
    }
    
    SIMULATION_STATE.t += CONSTANTS.DT;
    updateTopbar();
    stepExplosions();
  }

  // ────── RENDERING FUNCTIONS ──────

  function drawGrid() {
    p.stroke(9, 24, 42, 150);
    p.strokeWeight(1);
    const step = Math.max(4, Math.round(100 * CONSTANTS.SCALE));
    for (let y = gY; y > 0; y -= step) p.line(0, y, W, y);
    for (let x = 0; x < W; x += 80) p.line(x, 0, x, gY);
    
    p.noStroke();
    p.fill(14, 38, 62);
    p.textSize(8);
    p.textAlign(p.LEFT, p.CENTER);
    for (let y = gY - step; y > 30; y -= step * 2) {
      const alt = Math.round((gY - y) / CONSTANTS.SCALE);
      p.text(alt + 'm', 4, y);
    }
  }

  function drawRadar() {
    if (!document.getElementById('chkRadar').checked) return;
    const r_km = getValue('slRadar');
    const r = r_km * KM2PX();
    
    p.noFill();
    p.stroke(0, 255, 200, 40);
    p.strokeWeight(1);
    p.circle(defX, gY, r * 2);
    
    p.stroke(0, 255, 200, 35);
    p.arc(defX, gY, r * 2, r * 2, Math.PI, 0);
    
    const ang = ((SIMULATION_STATE.t * 0.6) % (Math.PI * 2));
    p.push();
    p.translate(defX, gY);
    for (let i = 0; i < 10; i++) {
      const a = ang - i * 0.05;
      p.stroke(0, 255, 200, Math.max(0, 55 - i * 5));
      p.strokeWeight(1);
      p.line(0, 0, Math.cos(a) * r, Math.sin(a) * r);
    }
    p.pop();
    
    p.noStroke();
    p.fill(0, 180, 140, 100);
    p.textSize(8);
    p.textAlign(p.CENTER, p.TOP);
    p.text('RADAR  r=' + r_km + 'km', defX, gY - r - 14);
  }

  function drawTerrain() {
    p.noStroke();
    p.fill(8, 20, 35);
    p.rect(0, gY, W, CONSTANTS.GROUND_HEIGHT);
    p.stroke(0, 80, 120, 200);
    p.strokeWeight(1.5);
    p.line(0, gY, W, gY);
    p.noStroke();
    p.fill(14, 46, 72, 180);
    p.textSize(8);
    p.textAlign(p.LEFT, p.TOP);
    p.text('GROUND  0 m', 6, gY + 5);
  }

  function drawSites() {
    siteIcon(launchX, gY, '#ff4455', 'LAUNCH');
    siteIcon(defX, gY, '#00ffcc', 'DEFENSE');
  }

  function siteIcon(x, y, col, lbl) {
    p.drawingContext.shadowBlur = 10;
    p.drawingContext.shadowColor = col;
    p.stroke(p.color(col));
    p.strokeWeight(1.5);
    p.noFill();
    p.beginShape();
    p.vertex(x, y);
    p.vertex(x - 9, y - 20);
    p.vertex(x + 9, y - 20);
    p.endShape(p.CLOSE);
    p.fill(col);
    p.noStroke();
    p.circle(x, y - 20, 5);
    p.drawingContext.shadowBlur = 0;
    p.fill(col);
    p.noStroke();
    p.textSize(8);
    p.textFont('Share Tech Mono');
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(lbl, x, y - 25);
  }

  function drawTrails() {
    const am = META.atk[document.getElementById('selAtk').value];
    const dm = META.def[document.getElementById('selDef').value];
    glowTrail(SIMULATION_STATE.atkTrail, am.color);
    glowTrail(SIMULATION_STATE.intTrail, dm.color);
  }

  function glowTrail(trail, col) {
    if (trail.length < 2) return;
    p.drawingContext.shadowBlur = 6;
    p.drawingContext.shadowColor = col;
    p.noFill();
    const c = p.color(col);
    for (let i = 1; i < trail.length; i++) {
      c.setAlpha((i / trail.length) * 180);
      p.stroke(c);
      p.strokeWeight(i < trail.length - 8 ? 1 : 1.7);
      p.line(trail[i - 1].x, trail[i - 1].y, trail[i].x, trail[i].y);
    }
    p.drawingContext.shadowBlur = 0;
  }

  function drawLOS() {
    if (!document.getElementById('chkLOS').checked) return;
    if (!(SIMULATION_STATE.atk && SIMULATION_STATE.atk.alive && SIMULATION_STATE.inter && SIMULATION_STATE.inter.alive)) return;
    p.stroke(255, 255, 100, 70);
    p.strokeWeight(1);
    p.noFill();
    p.drawingContext.setLineDash([4, 5]);
    p.line(SIMULATION_STATE.inter.x, SIMULATION_STATE.inter.y, SIMULATION_STATE.atk.x, SIMULATION_STATE.atk.y);
    p.drawingContext.setLineDash([]);
  }

  function drawVectors() {
    if (!document.getElementById('chkVel').checked) return;
    const sc = 0.5;
    
    function arrow(x, y, vx, vy, col) {
      const ex = x + vx * sc;
      const ey = y + vy * sc;
      p.stroke(col);
      p.strokeWeight(1.5);
      p.noFill();
      p.line(x, y, ex, ey);
      const a = Math.atan2(vy, vx);
      p.push();
      p.translate(ex, ey);
      p.rotate(a);
      p.fill(col);
      p.noStroke();
      p.triangle(0, 0, -6, -3, -6, 3);
      p.pop();
    }
    
    if (SIMULATION_STATE.atk && SIMULATION_STATE.atk.alive)
      arrow(SIMULATION_STATE.atk.x, SIMULATION_STATE.atk.y, SIMULATION_STATE.atk.vx, SIMULATION_STATE.atk.vy, p.color(255, 100, 80, 200));
    if (SIMULATION_STATE.inter && SIMULATION_STATE.inter.alive)
      arrow(SIMULATION_STATE.inter.x, SIMULATION_STATE.inter.y, SIMULATION_STATE.inter.vx, SIMULATION_STATE.inter.vy, p.color(0, 255, 180, 200));
  }

  function drawMissiles() {
    const am = META.atk[document.getElementById('selAtk').value];
    const dm = META.def[document.getElementById('selDef').value];
    if (SIMULATION_STATE.atk && SIMULATION_STATE.atk.alive)
      missileShape(SIMULATION_STATE.atk.x, SIMULATION_STATE.atk.y, Math.atan2(SIMULATION_STATE.atk.vy, SIMULATION_STATE.atk.vx), am.color, 11);
    if (SIMULATION_STATE.inter && SIMULATION_STATE.inter.alive)
      missileShape(SIMULATION_STATE.inter.x, SIMULATION_STATE.inter.y, Math.atan2(SIMULATION_STATE.inter.vy, SIMULATION_STATE.inter.vx), dm.color, 8);
  }

  function missileShape(x, y, angle, col, sz) {
    p.push();
    p.translate(x, y);
    p.rotate(angle + Math.PI / 2);
    p.drawingContext.shadowBlur = 14;
    p.drawingContext.shadowColor = col;
    p.fill(col);
    p.noStroke();
    p.ellipse(0, 0, sz * 0.55, sz);
    p.fill(255, 255, 255, 150);
    p.ellipse(0, -sz * 0.2, sz * 0.28, sz * 0.38);
    p.drawingContext.shadowBlur = 0;
    p.pop();
  }

  function drawOnCanvasLabels() {
    p.textFont('Share Tech Mono');
    p.noStroke();
    if (SIMULATION_STATE.atk && SIMULATION_STATE.atk.alive) {
      const ph = SIMULATION_STATE.atk.phase || '';
      p.textSize(9);
      p.fill(255, 80, 80, 200);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.text(SIMULATION_STATE.atkSpd.toFixed(0) + ' m/s  ' + SIMULATION_STATE.atkAlt.toFixed(0) + 'm  ' + ph.toUpperCase(), SIMULATION_STATE.atk.x + 10, SIMULATION_STATE.atk.y - 5);
    }
    if (SIMULATION_STATE.inter && SIMULATION_STATE.inter.alive) {
      p.textSize(9);
      p.fill(0, 255, 180, 180);
      p.textAlign(p.LEFT, p.TOP);
      const cl = SIMULATION_STATE.closure > 0 ? 'CLOSING' : 'OPENING';
      p.text('◉ ' + cl + '  Δ=' + (SIMULATION_STATE.sep / CONSTANTS.SCALE / 1000).toFixed(2) + 'km', SIMULATION_STATE.inter.x + 10, SIMULATION_STATE.inter.y + 4);
    }
  }

  function drawResult() {
    const hit = SIMULATION_STATE.result === 'HIT';
    const col = hit ? '#ffdd00' : '#ff4455';
    const msg = hit ? '◉  INTERCEPT  SUCCESSFUL' : '✕  INTERCEPT  FAILED';
    p.textFont('Orbitron,monospace');
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.drawingContext.shadowBlur = 28;
    p.drawingContext.shadowColor = col;
    p.fill(col);
    p.text(msg, W / 2, H / 2 - 22);
    p.drawingContext.shadowBlur = 0;
    if (SIMULATION_STATE.missDist !== null) {
      p.textFont('Share Tech Mono');
      p.textSize(11);
      p.fill(col + 'bb');
      p.text('closest approach: ' + (SIMULATION_STATE.missDist / CONSTANTS.SCALE).toFixed(0) + ' m', W / 2, H / 2 + 8);
    }
  }

  // ────── EXPLOSIONS ──────

  function explode(x, y, type) {
    const col = type === 'hit' ? [255, 220, 0] : type === 'atk' ? [255, 60, 60] : [0, 255, 200];
    const n = type === 'hit' ? 44 : 26;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 4 + 0.5;
      SIMULATION_STATE.expl.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        sz: Math.random() * 5 + 1,
        col
      });
    }
  }

  function stepExplosions() {
    SIMULATION_STATE.expl = SIMULATION_STATE.expl.filter(e => e.life > 0);
    for (const e of SIMULATION_STATE.expl) {
      e.x += e.vx;
      e.y += e.vy;
      e.vy += 0.08;
      e.life -= e.decay;
    }
  }

  function drawExplosions() {
    p.noStroke();
    for (const e of SIMULATION_STATE.expl) {
      p.fill(e.col[0], e.col[1], e.col[2], e.life * 255);
      p.circle(e.x, e.y, e.sz * e.life * 2.2);
    }
  }

}, 'sim-wrap');
