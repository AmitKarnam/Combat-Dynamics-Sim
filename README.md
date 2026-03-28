# Combat Dynamics Simulator - Trajectory Playground

A real-time interactive simulation tool for visualizing and analyzing projectile trajectories under various combat scenarios. Built with p5.js, this application models ballistic physics with multiple attack algorithms and environmental parameters.

## Features

### Attack Algorithms
- **BALLISTIC** — Standard Newtonian trajectory (no air resistance)
- **BALLISTIC+DRAG** — Quadratic drag coefficient modeling
- **CRUISE** — Constant altitude flight model
- **BOOST-GLIDE** — Hypersonic Glide Vehicle (HGV) with Lift-to-Drag ratio

### Interactive Controls
- Real-time adjustment of launch parameters (angle, velocity, altitude)
- Dynamic environmental factors (wind, gravity) 
- Live trajectory visualization on canvas
- Defense system modeling
- Performance metrics and analytics

### User Interface
- **Sidebar Panel** — Parameter configuration with sliders and selectors
- **Top Bar** — Real-time telemetry display
- **Main Viewport** — Interactive trajectory simulation canvas
- **Footer Bar** — Frame rate and general information
- **Info Popup** — Detailed targeting and system information

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection (for CDN-hosted p5.js library)

### Installation & Usage

1. Clone or download this repository
2. Open `index.html` in a web browser
3. Configure attack parameters using the left sidebar
4. Click **LAUNCH** to fire
5. Click **RESET** to clear and start again

## Technical Details

### Physics Models

**Newtonian Ballistics**
- Standard kinematic equations with gravitational acceleration
- Trajectory calculated as parabolic path

**Drag Dynamics**
- Quadratic drag force: F_d = 0.5 * ρ * v² * Cd * A
- Air density and drag coefficients configurable

**HGV Model**
- Lift-to-Drag ratio (L/D) based maneuvering
- Boost and glide phases
- Non-ballistic trajectory modeling

### Libraries
- **p5.js** (v1.9.0) — Canvas rendering and animation framework
- **Google Fonts** — Orbitron & Share Tech Mono typography

### Styling
- Custom CSS variable theming (dark cyber aesthetic)
- Responsive flex-based layout
- Real-time responsive canvas scaling

## Project Structure

```
Combat-Dynamics-Sim/
├── index.html          # Main application file
└── README.md           # This file
```

## Controls & Parameters

### Attack Configuration
- **Launch Angle (θ)** — 10° to 85° (adjustable via slider)
- **Launch Velocity (v)** — Variable based on algorithm
- **Altitude** — Initial firing altitude
- **Wind Speed** — Environmental crosswind factors
- **Gravity** — Gravitational acceleration constant

### Display Information
- **Attack Power** — Launch energy metric
- **Defense Value** — Target defense rating
- **Hit Probability** — Calculated intercept likelihood

