/**
 * Tutorial System Module
 * Interactive onboarding with step-by-step guidance and highlights
 */

const TUTORIAL = {
  /**
   * Tutorial steps configuration
   */
  steps: [
    {
      title: 'WELCOME TO TRAJECTORY PLAYGROUND',
      content: 'This is a real-time <strong>ballistic trajectory simulator</strong> for analyzing attack and defense algorithms across multiple physics models. Click <strong>NEXT</strong> to learn the basics, or <strong>SKIP TUTORIAL</strong> to start immediately.',
      highlight: null,
    },
    {
      title: 'CHOOSE YOUR ATTACK ALGORITHM',
      content: 'Select from 4 different attack models:<br><strong>BALLISTIC</strong> — Classic arc<br><strong>BALLISTIC+DRAG</strong> — With air resistance<br><strong>CRUISE</strong> — Low-altitude flight<br><strong>BOOST-GLIDE</strong> — Hypersonic vehicle',
      highlight: '#selAtk',
    },
    {
      title: 'CONFIGURE LAUNCH PARAMETERS',
      content: 'Adjust the sliders below the attack selector to fine-tune your weapon: launch angle θ (10—85°), velocity, altitude, drag coefficient, or glide ratio depending on algorithm mode.',
      highlight: '#grpBal',
    },
    {
      title: 'SET UP DEFENSE SYSTEM',
      content: 'Choose your interceptor guidance law:<br><strong>PN</strong> — Zero-effort miss<br><strong>APN</strong> — With accel compensation<br><strong>PURSUIT</strong> — Direct bearing<br><strong>COLLISION</strong> — Predicted intercept point',
      highlight: '#selDef',
    },
    {
      title: 'MONITOR REAL-TIME TELEMETRY',
      content: 'The <strong>top bar</strong> displays live simulation data: attack speed, altitude, interceptor closure rate, and separation distance. <strong>Red = attack, Cyan = defense</strong>. Watch the numbers update as the missiles fly.',
      highlight: '#topbar',
    },
    {
      title: 'LAUNCH AND ANALYZE',
      content: 'Click <strong>LAUNCH</strong> to fire! Watch the trajectories unfold in real-time. If a hit occurs, colored particles explode at the impact point. Click <strong>RESET</strong> to try again with different settings.',
      highlight: '.btn-row',
    },
  ],

  currentStep: 0,
  hasSeenTutorial: localStorage.getItem('tutorialSeen') === 'true',

  /**
   * Initialize tutorial system
   * Shows tutorial if this is user's first visit
   */
  init() {
    if (this.hasSeenTutorial) {
      document.getElementById('tutorial-overlay').style.display = 'none';
      return;
    }
    this.renderDots();
    this.show();
  },

  /**
   * Display current tutorial step
   */
  show() {
    const step = this.steps[this.currentStep];
    document.getElementById('tutorialTitle').textContent = step.title;
    document.getElementById('tutorialStep').textContent = `Step ${this.currentStep + 1} of ${this.steps.length}`;
    document.getElementById('tutorialContent').innerHTML = step.content;
    
    const overlay = document.getElementById('tutorial-overlay');
    const modal = document.getElementById('tutorial-modal');
    overlay.classList.add('active');
    modal.classList.add('active');
    
    this.highlightElement(step.highlight);
    this.updateDots();
  },

  /**
   * Highlight a DOM element
   * @param {string} selector - CSS selector of element to highlight
   */
  highlightElement(selector) {
    const highlight = document.querySelector('.tutorial-highlight');
    if (highlight) highlight.remove();
    
    if (!selector) return;
    
    const el = document.querySelector(selector);
    if (!el) return;
    
    // Scroll element into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    
    // Create highlight after scroll completes
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const h = document.createElement('div');
      h.className = 'tutorial-highlight';
      h.style.top = (rect.top + window.scrollY) + 'px';
      h.style.left = (rect.left + window.scrollX) + 'px';
      h.style.width = rect.width + 'px';
      h.style.height = rect.height + 'px';
      document.body.appendChild(h);
    }, 100);
  },

  /**
   * Advance to next tutorial step
   */
  next() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.show();
    } else {
      this.end();
    }
  },

  /**
   * Skip remaining tutorial steps
   */
  skip() {
    this.end();
  },

  /**
   * End tutorial and hide overlay
   */
  end() {
    localStorage.setItem('tutorialSeen', 'true');
    const overlay = document.getElementById('tutorial-overlay');
    const modal = document.getElementById('tutorial-modal');
    const highlight = document.querySelector('.tutorial-highlight');
    
    overlay.classList.remove('active');
    modal.classList.remove('active');
    if (highlight) highlight.remove();
    
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 300);
  },

  /**
   * Render step indicator dots
   */
  renderDots() {
    const dotsContainer = document.getElementById('tutorialDots');
    dotsContainer.innerHTML = '';
    for (let i = 0; i < this.steps.length; i++) {
      const dot = document.createElement('div');
      dot.className = 'tutorial-dot' + (i === this.currentStep ? ' active' : '');
      dot.onclick = () => {
        this.currentStep = i;
        this.show();
      };
      dotsContainer.appendChild(dot);
    }
  },

  /**
   * Update active dot indicator
   */
  updateDots() {
    const dots = document.querySelectorAll('.tutorial-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === this.currentStep);
    });
  },
};

// Event listeners for tutorial controls
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tutorial-next').addEventListener('click', () => TUTORIAL.next());
  document.getElementById('tutorial-skip').addEventListener('click', () => TUTORIAL.skip());
  document.getElementById('tutorial-close').addEventListener('click', () => TUTORIAL.skip());
});

// Initialize tutorial on page load
window.addEventListener('load', () => {
  setTimeout(() => TUTORIAL.init(), 100);
});
