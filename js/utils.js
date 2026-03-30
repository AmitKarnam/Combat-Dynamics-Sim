/**
 * Utility Functions
 * Helper functions for DOM manipulation and value retrieval
 */

/**
 * Get the ground Y position based on sim-wrap height
 * @returns {number} Y coordinate of ground level
 */
function getGroundY() {
  const wrapper = document.getElementById('sim-wrap');
  return (wrapper ? wrapper.clientHeight : 600) - CONSTANTS.GROUND_HEIGHT;
}

/**
 * Get numeric value from input element
 * @param {string} id - Element ID
 * @returns {number} Parsed float value
 */
function getValue(id) {
  return parseFloat(document.getElementById(id).value);
}

/**
 * Set text content of element
 * @param {string} id - Element ID
 * @param {string} value - Text to display
 */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * Reset simulation state to initial values
 */
function resetSimulationState() {
  Object.assign(SIMULATION_STATE, {
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
  });
}

/**
 * Format slider updates with appropriate units
 * @param {string} inputId - Input element ID
 * @param {string} displayId - Display element ID
 * @param {Function} formatter - Function to format value
 */
function linkSliderDisplay(inputId, displayId, formatter) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.addEventListener('input', () => setText(displayId, formatter(el.value)));
}
