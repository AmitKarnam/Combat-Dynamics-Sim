/**
 * Physics Simulation Engine
 * Handles ballistic, drag, cruise, boost-glide, and guidance algorithms
 */

const PHYSICS = {
  /**
   * Initialize ballistic projectile
   * @param {number} sx - Start X position
   * @param {number} sy - Start Y position
   * @param {number} angle - Launch angle in degrees
   * @param {number} velocity - Launch velocity in m/s
   * @returns {Object} Projectile object
   */
  ballistic_init(sx, sy, angle, velocity) {
    const rad = angle * Math.PI / 180;
    const scaledVel = velocity * CONSTANTS.SCALE;
    return {
      x: sx,
      y: sy,
      vx: scaledVel * Math.cos(rad),
      vy: -scaledVel * Math.sin(rad),
      alive: true,
      phase: 'boost',
      bT: 0
    };
  },

  /**
   * Update ballistic projectile
   * @param {Object} obj - Projectile object
   * @param {number} dt - Delta time
   */
  ballistic_step(obj, dt) {
    if (obj.phase === 'boost') {
      obj.bT += dt;
      if (obj.bT > 1.5) obj.phase = 'mid';
    }
    obj.vy += CONSTANTS.G_PX * dt;
    obj.x += obj.vx * dt;
    obj.y += obj.vy * dt;
  },

  /**
   * Initialize ballistic projectile with drag
   * @param {number} sx - Start X position
   * @param {number} sy - Start Y position
   * @param {number} angle - Launch angle in degrees
   * @param {number} velocity - Launch velocity in m/s
   * @param {number} Cd - Drag coefficient
   * @returns {Object} Projectile object
   */
  ballistic_drag_init(sx, sy, angle, velocity, Cd) {
    const rad = angle * Math.PI / 180;
    const scaledVel = velocity * CONSTANTS.SCALE;
    return {
      x: sx,
      y: sy,
      vx: scaledVel * Math.cos(rad),
      vy: -scaledVel * Math.sin(rad),
      Cd,
      alive: true,
      phase: 'boost',
      bT: 0
    };
  },

  /**
   * Update ballistic projectile with drag
   * @param {Object} obj - Projectile object
   * @param {number} dt - Delta time
   */
  ballistic_drag_step(obj, dt) {
    if (obj.phase === 'boost') {
      obj.bT += dt;
      if (obj.bT > 1.5) obj.phase = 'mid';
    }
    const spd = Math.sqrt(obj.vx * obj.vx + obj.vy * obj.vy) || 0.001;
    const drag = obj.Cd * spd * spd * 0.0006;
    obj.vx -= (obj.vx / spd) * drag * dt;
    obj.vy -= (obj.vy / spd) * drag * dt;
    obj.vy += CONSTANTS.G_PX * dt;
    obj.x += obj.vx * dt;
    obj.y += obj.vy * dt;
  },

  /**
   * Initialize cruise missile
   * @param {number} sx - Start X position
   * @param {number} sy - Start Y position
   * @param {number} velocity - Cruise velocity in m/s
   * @param {number} altPx - Altitude in pixels
   * @returns {Object} Cruise object
   */
  cruise_init(sx, sy, velocity, altPx) {
    const gY = getGroundY();
    const scaledVel = velocity * CONSTANTS.SCALE;
    return {
      x: sx,
      y: gY - altPx,
      vx: scaledVel,
      vy: 0,
      cruY: gY - altPx,
      alive: true,
      phase: 'cruise'
    };
  },

  /**
   * Update cruise missile
   * @param {Object} obj - Cruise object
   * @param {number} dt - Delta time
   */
  cruise_step(obj, dt) {
    obj.x += obj.vx * dt;
    obj.y += (obj.cruY - obj.y) * 0.12;
  },

  /**
   * Initialize boost-glide HGV
   * @param {number} sx - Start X position
   * @param {number} sy - Start Y position
   * @param {number} angle - Boost angle in degrees
   * @param {number} velocity - Boost velocity in m/s
   * @param {number} LD - Lift-to-drag ratio
   * @returns {Object} HGV object
   */
  boost_glide_init(sx, sy, angle, velocity, LD) {
    const rad = angle * Math.PI / 180;
    const scaledVel = velocity * CONSTANTS.SCALE;
    return {
      x: sx,
      y: sy,
      vx: scaledVel * Math.cos(rad),
      vy: -scaledVel * Math.sin(rad),
      LD,
      alive: true,
      phase: 'boost'
    };
  },

  /**
   * Update boost-glide HGV
   * @param {Object} obj - HGV object
   * @param {number} dt - Delta time
   */
  boost_glide_step(obj, dt) {
    if (obj.phase === 'boost') {
      obj.vy += CONSTANTS.G_PX * dt;
      if (obj.vy >= 0) obj.phase = 'glide';
    } else {
      const lf = Math.min(1 / obj.LD, 0.92);
      obj.vy += CONSTANTS.G_PX * (1 - lf) * dt;
      obj.vx *= (1 - 0.008 * dt);
      obj.vy *= (1 - 0.004 * dt);
    }
    obj.x += obj.vx * dt;
    obj.y += obj.vy * dt;
  },

  /**
   * Initialize proportional navigation interceptor
   * @param {number} sx - Start X position
   * @param {number} sy - Start Y position
   * @param {number} velocity - Max velocity in m/s
   * @param {number} N - Navigation constant
   * @returns {Object} Interceptor object
   */
  pn_init(sx, sy, velocity, N) {
    const scaledVel = velocity * CONSTANTS.SCALE;
    return {
      x: sx,
      y: sy,
      vx: -scaledVel * 0.25,
      vy: -scaledVel * 0.97,
      speed: scaledVel,
      N,
      pLOS: null,
      pDist: null,
      alive: true
    };
  },

  /**
   * Update PN interceptor
   * @param {Object} obj - Interceptor object
   * @param {Object} target - Target object
   * @param {number} dt - Delta time
   */
  pn_step(obj, target, dt) {
    const dx = target.x - obj.x;
    const dy = target.y - obj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 8) {
      obj.alive = false;
      return;
    }

    const LOS = Math.atan2(dy, dx);
    const pL = obj.pLOS !== null ? obj.pLOS : LOS;
    let Ld = (LOS - pL) / dt;
    while (Ld > Math.PI) Ld -= 2 * Math.PI;
    while (Ld < -Math.PI) Ld += 2 * Math.PI;
    obj.pLOS = LOS;

    const pD = obj.pDist !== null ? obj.pDist : dist;
    const Vc = -(dist - pD) / dt;
    obj.pDist = dist;

    const cmd = obj.N * Vc * Ld;
    const h = Math.atan2(obj.vy, obj.vx);
    obj.vx += cmd * -Math.sin(h) * dt;
    obj.vy += cmd * Math.cos(h) * dt;

    const s = Math.sqrt(obj.vx * obj.vx + obj.vy * obj.vy) || 1;
    obj.vx = obj.vx / s * obj.speed;
    obj.vy = obj.vy / s * obj.speed;
    obj.x += obj.vx * dt;
    obj.y += obj.vy * dt;
  },

  /**
   * Initialize augmented PN interceptor
   * @param {number} sx - Start X position
   * @param {number} sy - Start Y position
   * @param {number} velocity - Max velocity in m/s
   * @param {number} N - Navigation constant
   * @param {number} K - APN gain
   * @returns {Object} Interceptor object
   */
  apn_init(sx, sy, velocity, N, K) {
    const scaledVel = velocity * CONSTANTS.SCALE;
    return {
      x: sx,
      y: sy,
      vx: -scaledVel * 0.25,
      vy: -scaledVel * 0.97,
      speed: scaledVel,
      N,
      K,
      pLOS: null,
      pDist: null,
      pTvy: null,
      alive: true
    };
  },

  /**
   * Update APN interceptor
   * @param {Object} obj - Interceptor object
   * @param {Object} target - Target object
   * @param {number} dt - Delta time
   */
  apn_step(obj, target, dt) {
    const dx = target.x - obj.x;
    const dy = target.y - obj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 8) {
      obj.alive = false;
      return;
    }

    const LOS = Math.atan2(dy, dx);
    const pL = obj.pLOS !== null ? obj.pLOS : LOS;
    let Ld = (LOS - pL) / dt;
    while (Ld > Math.PI) Ld -= 2 * Math.PI;
    while (Ld < -Math.PI) Ld += 2 * Math.PI;
    obj.pLOS = LOS;

    const pD = obj.pDist !== null ? obj.pDist : dist;
    const Vc = -(dist - pD) / dt;
    obj.pDist = dist;

    const pTV = obj.pTvy !== null ? obj.pTvy : target.vy;
    const aT = (target.vy - pTV) / dt;
    obj.pTvy = target.vy;

    const cmd = obj.N * Vc * Ld + obj.K * aT;
    const h = Math.atan2(obj.vy, obj.vx);
    obj.vx += cmd * -Math.sin(h) * dt;
    obj.vy += cmd * Math.cos(h) * dt;

    const s = Math.sqrt(obj.vx * obj.vx + obj.vy * obj.vy) || 1;
    obj.vx = obj.vx / s * obj.speed;
    obj.vy = obj.vy / s * obj.speed;
    obj.x += obj.vx * dt;
    obj.y += obj.vy * dt;
  },

  /**
   * Initialize pure pursuit interceptor
   * @param {number} sx - Start X position
   * @param {number} sy - Start Y position
   * @param {number} velocity - Max velocity in m/s
   * @returns {Object} Interceptor object
   */
  pursuit_init(sx, sy, velocity) {
    const scaledVel = velocity * CONSTANTS.SCALE;
    return {
      x: sx,
      y: sy,
      vx: -scaledVel * 0.25,
      vy: -scaledVel * 0.97,
      speed: scaledVel,
      alive: true
    };
  },

  /**
   * Update pure pursuit interceptor
   * @param {Object} obj - Interceptor object
   * @param {Object} target - Target object
   * @param {number} dt - Delta time
   */
  pursuit_step(obj, target, dt) {
    const dx = target.x - obj.x;
    const dy = target.y - obj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 8) {
      obj.alive = false;
      return;
    }
    obj.vx = (dx / dist) * obj.speed;
    obj.vy = (dy / dist) * obj.speed;
    obj.x += obj.vx * dt;
    obj.y += obj.vy * dt;
  },

  /**
   * Initialize collision course interceptor
   * @param {number} sx - Start X position
   * @param {number} sy - Start Y position
   * @param {number} velocity - Max velocity in m/s
   * @returns {Object} Interceptor object
   */
  collision_init(sx, sy, velocity) {
    const scaledVel = velocity * CONSTANTS.SCALE;
    return {
      x: sx,
      y: sy,
      vx: -scaledVel * 0.25,
      vy: -scaledVel * 0.97,
      speed: scaledVel,
      alive: true
    };
  },

  /**
   * Update collision course interceptor
   * @param {Object} obj - Interceptor object
   * @param {Object} target - Target object
   * @param {number} dt - Delta time
   */
  collision_step(obj, target, dt) {
    const dx = target.x - obj.x;
    const dy = target.y - obj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 8) {
      obj.alive = false;
      return;
    }
    const tgo = dist / obj.speed;
    const px = target.x + (target.vx || 0) * tgo;
    const py = target.y + (target.vy || 0) * tgo;
    const ddx = px - obj.x;
    const ddy = py - obj.y;
    const d = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
    obj.vx = (ddx / d) * obj.speed;
    obj.vy = (ddy / d) * obj.speed;
    obj.x += obj.vx * dt;
    obj.y += obj.vy * dt;
  }
};
