/**
 * UI & Event Handlers Module
 * Manages UI updates, control bindings, and info panel display
 */

/**
 * Update telemetry display in topbar
 */
function updateTopbar() {
  setText('rcT', SIMULATION_STATE.t.toFixed(1) + ' s');
  setText('rcAS', SIMULATION_STATE.atkSpd > 0 ? SIMULATION_STATE.atkSpd.toFixed(0) + ' m/s' : '—');
  setText('rcAA', SIMULATION_STATE.atkAlt > 0 ? SIMULATION_STATE.atkAlt.toFixed(0) + ' m' : '—');
  setText('rcIS', SIMULATION_STATE.intSpd > 0 ? SIMULATION_STATE.intSpd.toFixed(0) + ' m/s' : '—');
  setText('rcCL', SIMULATION_STATE.closure !== 0 ? SIMULATION_STATE.closure.toFixed(0) + ' m/s' : '—');
  if (SIMULATION_STATE.sep > 0) setText('rcSP', (SIMULATION_STATE.sep / CONSTANTS.SCALE / 1000).toFixed(2) + ' km');
}

/**
 * End simulation and display result
 * @param {string} result - 'HIT' or 'MISS'
 * @param {number} dist - Closest approach distance
 */
function endSimulation(result, dist) {
  SIMULATION_STATE.running = false;
  SIMULATION_STATE.result = result;
  SIMULATION_STATE.missDist = dist;
  
  const el = document.getElementById('rcR');
  el.textContent = result;
  el.className = 'tb-val ' + (result === 'HIT' ? 'hit' : 'atk');
  
  setText('rcSt', result === 'HIT' ? 'INTERCEPTED' : 'IMPACT');
  document.getElementById('btnLaunch').disabled = false;
}

/**
 * Display algorithm info panel
 * @param {Object} meta - Algorithm metadata
 */
function showInfoPanel(meta) {
  document.getElementById('ipDot').style.background = meta.color;
  document.getElementById('ipName').textContent = meta.name;
  document.getElementById('ipClass').textContent = meta.cls;
  document.getElementById('ipF').textContent = meta.f;
  document.getElementById('ipN').textContent = meta.notes;
  document.getElementById('ipS').innerHTML = meta.sys
    .map(s => `<span class="ip-s">${s}</span>`)
    .join('');
  
  const panel = document.getElementById('ipanel');
  panel.classList.add('vis');
  clearTimeout(panel._t);
  panel._t = setTimeout(() => panel.classList.remove('vis'), 7000);
}

/**
 * Update footer bar with algorithm names and formulas
 */
function updateFooterBar() {
  const atkMeta = META.atk[document.getElementById('selAtk').value];
  const defMeta = META.def[document.getElementById('selDef').value];
  
  setText('fbL', 'ATTACK: ' + atkMeta.name.toUpperCase() + '   ·   DEFENSE: ' + defMeta.name.toUpperCase());
  setText('fbF', 'ATK: ' + atkMeta.f + '    |    DEF: ' + defMeta.f);
  
  setBadges('atkBadges', atkMeta.sys, 'atk');
  setBadges('defBadges', defMeta.sys, 'def');
}

/**
 * Set badge elements for given system list
 * @param {string} containerId - Container element ID
 * @param {Array} systems - Array of system names
 * @param {string} className - Badge class name
 */
function setBadges(containerId, systems, className) {
  document.getElementById(containerId).innerHTML = systems
    .map(s => `<span class="badge ${className}">${s}</span>`)
    .join('');
}

/**
 * Initialize all UI control listeners
 */
function initializeControls() {
  // Attack algorithm selector
  document.getElementById('selAtk').addEventListener('change', function() {
    const v = this.value;
    document.getElementById('grpBal').style.display = (v === 'BALLISTIC' || v === 'BALLISTIC_DRAG') ? '' : 'none';
    document.getElementById('grpDrag').style.display = v === 'BALLISTIC_DRAG' ? '' : 'none';
    document.getElementById('grpCruise').style.display = v === 'CRUISE' ? '' : 'none';
    document.getElementById('grpBG').style.display = v === 'BOOST_GLIDE' ? '' : 'none';
    updateFooterBar();
    showInfoPanel(META.atk[v]);
  });

  // Defense algorithm selector
  document.getElementById('selDef').addEventListener('change', function() {
    document.getElementById('grpAPN').style.display = this.value === 'APN' ? '' : 'none';
    updateFooterBar();
    showInfoPanel(META.def[this.value]);
  });

  // Info panel click handlers
  document.querySelector('.sb-section:nth-child(1) .sb-title').addEventListener('click', () => {
    showInfoPanel(META.atk[document.getElementById('selAtk').value]);
  });
  document.querySelector('.sb-section:nth-child(2) .sb-title').addEventListener('click', () => {
    showInfoPanel(META.def[document.getElementById('selDef').value]);
  });

  // Link slider displays
  linkSliderDisplay('slAngle', 'vAngle', v => v + '°');
  linkSliderDisplay('slSpeed', 'vSpeed', v => v + ' m/s');
  linkSliderDisplay('slCd', 'vCd', v => parseFloat(v).toFixed(2));
  linkSliderDisplay('slAlt', 'vAlt', v => v + ' m');
  linkSliderDisplay('slCSpd', 'vCSpd', v => v + ' m/s');
  linkSliderDisplay('slBGA', 'vBGA', v => v + '°');
  linkSliderDisplay('slBGS', 'vBGS', v => v + ' m/s');
  linkSliderDisplay('slLD', 'vLD', v => parseFloat(v).toFixed(1));
  linkSliderDisplay('slN', 'vN', v => parseFloat(v).toFixed(1));
  linkSliderDisplay('slDS', 'vDS', v => v + ' m/s');
  linkSliderDisplay('slK', 'vK', v => parseFloat(v).toFixed(1));
  linkSliderDisplay('slRadar', 'vRadar', v => v + ' km');

  // Launch button
  document.getElementById('btnLaunch').addEventListener('click', launchSimulation);

  // Reset button
  document.getElementById('btnReset').addEventListener('click', resetSimulation);
}

/**
 * Launch simulation with current parameters
 */
function launchSimulation() {
  const wrapper = document.getElementById('sim-wrap');
  const W = wrapper.clientWidth;
  const H = wrapper.clientHeight;
  const gY = H - CONSTANTS.GROUND_HEIGHT;
  const lX = W * 0.12;
  const atkKey = document.getElementById('selAtk').value;

  resetSimulationState();
  SIMULATION_STATE.running = true;

  setText('rcR', '—');
  document.getElementById('rcR').className = 'tb-val';
  setText('rcSt', 'AIRBORNE');

  switch (atkKey) {
    case 'BALLISTIC':
      SIMULATION_STATE.atk = PHYSICS.ballistic_init(lX, gY, getValue('slAngle'), getValue('slSpeed'));
      break;
    case 'BALLISTIC_DRAG':
      SIMULATION_STATE.atk = PHYSICS.ballistic_drag_init(lX, gY, getValue('slAngle'), getValue('slSpeed'), getValue('slCd'));
      break;
    case 'CRUISE':
      SIMULATION_STATE.atk = PHYSICS.cruise_init(lX, gY, getValue('slCSpd'), getValue('slAlt'));
      break;
    case 'BOOST_GLIDE':
      SIMULATION_STATE.atk = PHYSICS.boost_glide_init(lX, gY, getValue('slBGA'), getValue('slBGS'), getValue('slLD'));
      break;
  }

  this.disabled = true;
}

/**
 * Reset simulation to initial state
 */
function resetSimulation() {
  resetSimulationState();
  
  ['rcSt', 'rcT', 'rcAS', 'rcAA', 'rcIS', 'rcCL', 'rcSP', 'rcR'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = id === 'rcSt' ? 'READY' : id === 'rcT' ? '0.0 s' : '—';
      el.className = 'tb-val';
    }
  });
  
  document.getElementById('btnLaunch').disabled = false;
}

// Initialize controls when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeControls();
  updateFooterBar();
});
