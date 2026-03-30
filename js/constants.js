/**
 * Application Constants & Metadata
 * Global physics constants, algorithm definitions, and system metadata
 */

// Physics Constants
const CONSTANTS = {
  SCALE: 0.10,          // 1 m/s → 0.10 px/s
  G_PX: 9.81 * 0.10,   // gravity in px/s²
  DT: 1/60,             // delta time per frame
  GROUND_HEIGHT: 36,    // ground strip px
};

// Algorithm Metadata - Attack Systems
const ATTACK_METADATA = {
  BALLISTIC: {
    name: 'Newtonian Ballistic',
    color: '#ff4455',
    cls: 'Kinematic — Vacuum Projectile',
    f: 'vx=v₀cosθ  vy=v₀sinθ−g·t  |  x+=vx·dt  y+=vy·dt',
    notes: 'Three phases: short powered boost, ballistic mid-course arc, terminal re-entry. No atmospheric drag — ideal vacuum parabola. Closed-form solution exists: R=v₀²sin2θ/g.',
    sys: ['Scud-B', 'Iskander-M', 'Shahab-3', 'ATACMS', 'DF-11']
  },
  BALLISTIC_DRAG: {
    name: 'Ballistic + Quadratic Drag',
    color: '#ff7733',
    cls: 'Kinematic — Quadratic Drag Model',
    f: 'F_drag=½ρCdAv²  a_drag=−(F/m)·v̂  |  v+=a·dt',
    notes: 'Adds quadratic aerodynamic drag proportional to v². At Cd=0.1 range drops ~30% vs vacuum. Models real SRBM behaviour — asymmetric trajectory (descent steeper than ascent).',
    sys: ['DF-11 (realistic)', 'Fateh-110', 'SS-21 Scarab']
  },
  CRUISE: {
    name: 'Constant-Altitude Cruise',
    color: '#ff8800',
    cls: 'Sustained Powered Flight — PID Altitude Hold',
    f: 'y=h (const)  x+=v·dt  |  Δy=K_p·(h−y)',
    notes: 'Engine provides constant thrust. P-controller maintains cruise altitude. Flies below radar horizon at low h. Radar masking most effective below 100m. No terminal pop-up in this model.',
    sys: ['Tomahawk BGM-109', 'Storm Shadow', 'Kh-101', 'BrahMos']
  },
  BOOST_GLIDE: {
    name: 'Boost-Glide HGV',
    color: '#cc44ff',
    cls: 'Hypersonic Glide Vehicle — L/D Sustained',
    f: 'Boost: ballistic  |  Glide: vy+=g·(1−1/LD)·dt',
    notes: 'Boost phase is standard ballistic. At apex vehicle pitches into glide: lift counteracts fraction 1/LD of gravity. Flat, high-speed trajectory at Mach 5+. Flies between ballistic and cruise intercept envelopes.',
    sys: ['DF-17 (China)', 'Avangard (Russia)', 'HTV-2 (DARPA exp.)']
  }
};

// Algorithm Metadata - Defense Systems
const DEFENSE_METADATA = {
  PN: {
    name: 'Proportional Navigation',
    color: '#00ffcc',
    cls: 'Guidance Law — Zero-Effort Miss',
    f: 'a_cmd = N · Vc · λ̇    where  λ̇ = dLOS/dt',
    notes: 'Nullifies LOS rotation rate. If λ̇→0, collision is geometrically guaranteed for non-manoeuvring targets. N=3–5 optimal. Converges to collision course, not current position. Vc = −d(range)/dt.',
    sys: ['Patriot PAC-3', 'AIM-120 AMRAAM', 'R-77', 'Python-5']
  },
  APN: {
    name: 'Augmented Proportional Navigation',
    color: '#00eebb',
    cls: 'Guidance Law — PN + Target Accel Term',
    f: 'a = N·Vc·λ̇  +  K·aT⊥    (aT⊥ estimated from Δvy/dt)',
    notes: 'Extends PN by estimating and compensating for target lateral acceleration aT⊥. Dramatically improves intercept probability against MaRV or manoeuvring cruise missiles.',
    sys: ["David's Sling Stunner", "THAAD", "Arrow-3", "SM-3 Block IIA"]
  },
  PURSUIT: {
    name: 'Pure Pursuit',
    color: '#44ddaa',
    cls: 'Guidance Law — Direct Bearing',
    f: 'heading = atan2(T_y − M_y,  T_x − M_x)',
    notes: 'Nose always points at targets CURRENT position, not predicted intercept. Causes tail-chase: commanded turning rate diverges as target passes. High g-load near end-game. Historically used in early IR missiles.',
    sys: ['SA-2 (early mode)', '9M14 Malyutka', 'AIM-9B Sidewinder']
  },
  COLLISION: {
    name: 'Lead Collision Course',
    color: '#00ccff',
    cls: 'Guidance Law — Predicted Impact Point',
    f: 'T_pred = T_pos + v_T · t_go  |  steer to T_pred',
    notes: 'Computes where target will be at time-of-flight t_go and steers there. Straight-line flight → lower g-load. Requires good target velocity estimate. Fails against manoeuvring targets.',
    sys: ['Nike Ajax (command)', 'SA-75 Dvina', 'Early CLOS systems']
  }
};

// Global Simulation State
const SIMULATION_STATE = {
  running: false,
  t: 0,
  atk: null,
  inter: null,
  atkTrail: [],
  intTrail: [],
  expl: [],
  result: null,
  missDist: null,
  atkSpd: 0,
  atkAlt: 0,
  intSpd: 0,
  closure: 0,
  sep: 0,
};

// Consolidated Metadata
const META = {
  atk: ATTACK_METADATA,
  def: DEFENSE_METADATA
};
