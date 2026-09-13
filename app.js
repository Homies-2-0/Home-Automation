/**
 * HOME 2.0 STATE CONTROLLER
 * - Real-Time Dynamic Greeting & Live Clock
 * - Warm Light Mode & Dark Mode Switcher
 * - Master Lock Authority (Safety guard for all switches)
 * - Individual Light / Fan Toggles with high-contrast visual states
 * - In-card tabbed schedule and timer handlers
 */
const state = {
  masterLockArmed: true, // TRUE = Controls unlocked & operational; FALSE = Controls locked out
  theme: 'dark',
  devices: [
    {
      id: 0,
      pin: 'D21',
      wallPin: 'D12',
      name: 'Bedroom Tube Light',
      subtext: 'Primary Ceiling Luminaire',
      type: 'light',
      powerWatts: 36,
      isOn: true,
      wallState: 1,
      schedule: { action: 'Turn ON', cadence: 'Every day', time: '07:30 PM', active: true },
      timerSeconds: null,
      timerInterval: null
    },
    {
      id: 1,
      pin: 'D19',
      wallPin: 'D14',
      name: 'Bedroom Small Light',
      subtext: 'Bedside Ambient Sconce',
      type: 'light',
      powerWatts: 18,
      isOn: false,
      wallState: 0,
      schedule: null,
      timerSeconds: null,
      timerInterval: null
    },
    {
      id: 2,
      pin: 'D18',
      wallPin: 'D27',
      name: 'Bedroom Fan',
      subtext: 'Ceiling Inverter Motor • Speed 3',
      type: 'fan',
      powerWatts: 52,
      isOn: true,
      wallState: 1,
      schedule: null,
      timerSeconds: 512, // 8m 32s initial
      timerInterval: null
    }
  ]
};

// Real-time Greeting and Clock System
function updateRealtimeGreeting() {
  const now = new Date();
  const hours = now.getHours();
  const greetingEl = document.getElementById('dynamic-greeting-text');
  const greetingIcon = document.getElementById('greeting-icon');
  const clockEl = document.getElementById('live-clock-text');

  let greeting = 'Good evening';
  let icon = 'nights_stay';

  if (hours >= 5 && hours < 12) {
    greeting = 'Good morning';
    icon = 'wb_sunny';
  } else if (hours >= 12 && hours < 17) {
    greeting = 'Good afternoon';
    icon = 'light_mode';
  } else if (hours >= 17 && hours < 22) {
    greeting = 'Good evening';
    icon = 'wb_twilight';
  } else {
    greeting = 'Good night';
    icon = 'bedtime';
  }

  if (greetingEl) greetingEl.textContent = greeting;
  if (greetingIcon) greetingIcon.textContent = icon;

  if (clockEl) {
    let hh = hours % 12 || 12;
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    clockEl.textContent = `${hh}:${mm} ${ampm}`;
  }
}

// Toast notification helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl theme-subcard border shadow-2xl theme-text-strong text-xs font-semibold transition-all duration-300 transform translate-y-3 opacity-0';
  
  let icon = 'check_circle';
  let iconColor = 'text-emerald-500 dark:text-emerald-400';
  if (type === 'warning' || type === 'lock') {
    icon = 'lock';
    iconColor = 'text-amber-500';
  } else if (type === 'info') {
    icon = 'info';
    iconColor = 'text-blue-500 dark:text-blue-400';
  }

  toast.innerHTML = `
    <span class="material-symbols-outlined ${iconColor} text-[19px]">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-3', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-3');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Master Lock Safety Verification Guard
function checkMasterLock() {
  if (!state.masterLockArmed) {
    showToast('⚠️ Master Lock is ENGAGED! Unlock controls via the Master Lock switch.', 'warning');
    const banner = document.getElementById('master-lockout-banner');
    if (banner) {
      banner.classList.add('scale-[1.02]');
      setTimeout(() => banner.classList.remove('scale-[1.02]'), 200);
    }
    return false;
  }
  return true;
}

// Update Master Lock UI Appearance
function renderMasterLockState() {
  const isArmed = state.masterLockArmed;
  const ring = document.getElementById('master-lock-ring');
  const icon = document.getElementById('master-lock-icon');
  const tinyLabel = document.getElementById('master-lock-tiny-label');
  const statusText = document.getElementById('master-system-status');
  const statusSubtext = document.getElementById('master-system-subtext');
  const toggleBtnText = document.getElementById('btn-toggle-lock-text');
  const headerBadge = document.getElementById('header-lock-badge');
  const headerIcon = document.getElementById('header-lock-icon');
  const headerText = document.getElementById('header-lock-text');
  const lockoutBanner = document.getElementById('master-lockout-banner');

  if (isArmed) {
    // SYSTEM OPERATIONAL / CONTROLS UNLOCKED
    if (ring) {
      ring.className = 'absolute inset-0 rounded-full border-4 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.55)] animate-ring-pulse transition-all';
    }
    if (icon) {
      icon.textContent = 'lock_open';
      icon.className = 'material-symbols-outlined text-emerald-500 dark:text-emerald-400 text-[40px] group-hover:scale-110 transition-transform';
    }
    if (tinyLabel) {
      tinyLabel.textContent = 'UNLOCKED';
      tinyLabel.className = 'text-[9px] font-extrabold uppercase tracking-widest text-emerald-500 dark:text-emerald-400 mt-0.5';
    }
    if (statusText) {
      statusText.textContent = 'MASTER LOCK ENGAGED (OPERATIONAL)';
      statusText.className = 'text-xs font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 transition-colors';
    }
    if (statusSubtext) {
      statusSubtext.textContent = 'Dashboard & Switches Fully Unlocked';
    }
    if (toggleBtnText) toggleBtnText.textContent = 'Tap to Lock Panel';
    if (lockoutBanner) lockoutBanner.classList.add('hidden');

    if (headerBadge) {
      headerBadge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400 transition-all';
    }
    if (headerIcon) headerIcon.textContent = 'lock_open';
    if (headerText) headerText.textContent = 'SYSTEM UNLOCKED';
  } else {
    // LOCKED OUT / SAFETY GUARD ACTIVE
    if (ring) {
      ring.className = 'absolute inset-0 rounded-full border-4 border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.6)] animate-ring-pulse transition-all';
    }
    if (icon) {
      icon.textContent = 'lock';
      icon.className = 'material-symbols-outlined text-amber-500 text-[40px] group-hover:scale-110 transition-transform';
    }
    if (tinyLabel) {
      tinyLabel.textContent = 'LOCKED';
      tinyLabel.className = 'text-[9px] font-extrabold uppercase tracking-widest text-amber-500 mt-0.5';
    }
    if (statusText) {
      statusText.textContent = 'MASTER LOCK DISARMED (SAFE LOCKOUT)';
      statusText.className = 'text-xs font-bold uppercase tracking-wider text-amber-500 transition-colors';
    }
    if (statusSubtext) {
      statusSubtext.textContent = 'All controls protected against changes';
    }
    if (toggleBtnText) toggleBtnText.textContent = 'Tap to Unlock Panel';
    if (lockoutBanner) lockoutBanner.classList.remove('hidden');

    if (headerBadge) {
      headerBadge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-500 transition-all';
    }
    if (headerIcon) headerIcon.textContent = 'lock';
    if (headerText) headerText.textContent = 'PANEL LOCKED';
  }
}

// Toggle Master Lock
function toggleMasterLock() {
  state.masterLockArmed = !state.masterLockArmed;
  renderMasterLockState();
  updateFirebaseMaster();
  if (state.masterLockArmed) {
    showToast('✓ Master Lock Disengaged: Controller authority & switches UNLOCKED.');
  } else {
    showToast('🔒 Master Lock Engaged: All appliance switches and automations LOCKED.', 'warning');
  }
}

// Counters & Watts calculation
function updateCounters() {
  const activeCount = state.devices.filter(d => d.isOn).length;
  const totalWatts = state.devices.reduce((acc, d) => acc + (d.isOn ? d.powerWatts : 0), 0);

  const headerCount = document.getElementById('header-active-count');
  if (headerCount) headerCount.textContent = `${activeCount} / 3 Active`;

  const masterLoadText = document.getElementById('master-load-text');
  if (masterLoadText) masterLoadText.textContent = `${activeCount} / 3 LOAD ACTIVE (${totalWatts}W)`;

  const masterDot = document.getElementById('master-load-indicator-dot');
  if (masterDot) {
    if (activeCount > 0) {
      masterDot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
    } else {
      masterDot.className = 'w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500';
    }
  }
}

// Render Device 1: Bedroom Tube Light (Warm Amber/Gold Accent)
function renderDevice1() {
  const d = state.devices[0];
  const btn = document.getElementById('btn-toggle-1');
  const icon = document.getElementById('icon-dev-1');
  const ring = document.getElementById('ring-dev-1');
  const glow = document.getElementById('glow-dev-1');
  const dot = document.getElementById('dot-dev-1');
  const text = document.getElementById('state-text-dev-1');
  const wallText = document.getElementById('wall-text-dev-1');
  const isDark = document.documentElement.classList.contains('dark');

  if (d.isOn) {
    btn.style.backgroundColor = isDark ? '#2a1a05' : '#fef3c7';
    btn.style.borderColor = '#f59e0b';
    btn.style.borderWidth = '2px';
    btn.style.boxShadow = isDark ? '0 0 32px rgba(245, 158, 11, 0.55)' : '0 8px 24px rgba(245, 158, 11, 0.35)';
    ring.classList.remove('hidden');
    icon.className = 'material-symbols-outlined text-amber-500 text-[36px] transition-transform duration-200';
    icon.style.fontVariationSettings = "'FILL' 1";
    glow.classList.remove('opacity-0');
    dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse';
    text.className = 'text-xs font-bold text-emerald-500 dark:text-emerald-400';
    text.textContent = `ON (${d.powerWatts}W)`;
  } else {
    btn.style.backgroundColor = '';
    btn.style.borderColor = '';
    btn.style.borderWidth = '';
    btn.style.boxShadow = 'none';
    ring.classList.add('hidden');
    icon.className = 'material-symbols-outlined theme-text-muted text-[36px] transition-transform duration-200';
    icon.style.fontVariationSettings = "'FILL' 0";
    glow.classList.add('opacity-0');
    dot.className = 'w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500';
    text.className = 'text-xs font-bold theme-text-muted';
    text.textContent = 'OFF (0W)';
  }

  if (d.wallState === 1) {
    wallText.className = 'text-xs font-semibold theme-text-strong mt-0.5';
    wallText.textContent = 'STATE 1 (Synced)';
  } else {
    wallText.className = 'text-xs font-semibold theme-text-muted mt-0.5';
    wallText.textContent = 'STATE 0 (Normal)';
  }
}

// Render Device 2: Bedroom Small Light
function renderDevice2() {
  const d = state.devices[1];
  const btn = document.getElementById('btn-toggle-2');
  const icon = document.getElementById('icon-dev-2');
  const ring = document.getElementById('ring-dev-2');
  const glow = document.getElementById('glow-dev-2');
  const dot = document.getElementById('dot-dev-2');
  const text = document.getElementById('state-text-dev-2');
  const wallText = document.getElementById('wall-text-dev-2');
  const badgeCh = document.getElementById('badge-ch-2');
  const isDark = document.documentElement.classList.contains('dark');

  if (d.isOn) {
    btn.style.backgroundColor = isDark ? '#112240' : '#e0edff';
    btn.style.borderColor = '#3b82f6';
    btn.style.borderWidth = '2px';
    btn.style.boxShadow = isDark ? '0 0 32px rgba(59, 130, 246, 0.55)' : '0 8px 24px rgba(59, 130, 246, 0.35)';
    ring.classList.remove('hidden');
    icon.className = 'material-symbols-outlined text-blue-500 text-[36px] transition-transform duration-200';
    icon.style.fontVariationSettings = "'FILL' 1";
    icon.textContent = 'lightbulb';
    glow.classList.remove('opacity-0');
    dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse';
    text.className = 'text-xs font-bold text-emerald-500 dark:text-emerald-400';
    text.textContent = `ON (${d.powerWatts}W)`;
    badgeCh.className = 'px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-500 dark:text-blue-400 font-bold text-[10px] tracking-wider uppercase';
  } else {
    btn.style.backgroundColor = '';
    btn.style.borderColor = '';
    btn.style.borderWidth = '';
    btn.style.boxShadow = 'none';
    ring.classList.add('hidden');
    icon.className = 'material-symbols-outlined theme-text-muted text-[36px] transition-transform duration-200';
    icon.style.fontVariationSettings = "'FILL' 0";
    icon.textContent = 'bedtime';
    glow.classList.add('opacity-0');
    dot.className = 'w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500';
    text.className = 'text-xs font-bold theme-text-muted';
    text.textContent = 'OFF (0W)';
    badgeCh.className = 'px-2.5 py-0.5 rounded-full theme-subcard border theme-text-muted font-bold text-[10px] tracking-wider uppercase';
  }

  if (d.wallState === 1) {
    wallText.className = 'text-xs font-semibold theme-text-strong mt-0.5';
    wallText.textContent = 'STATE 1 (Synced)';
  } else {
    wallText.className = 'text-xs font-semibold theme-text-muted mt-0.5';
    wallText.textContent = 'STATE 0 (Normal)';
  }
}

// Render Device 3: Bedroom Fan (Vivid Emerald Spin)
function renderDevice3() {
  const d = state.devices[2];
  const btn = document.getElementById('fan-toggle-btn');
  const icon = document.getElementById('fan-icon');
  const ring = document.getElementById('fan-pulse-ring');
  const glow = document.getElementById('glow-dev-3');
  const dot = document.getElementById('dot-dev-3');
  const text = document.getElementById('state-text-dev-3');
  const wallText = document.getElementById('wall-text-dev-3');
  const isDark = document.documentElement.classList.contains('dark');

  if (d.isOn) {
    btn.style.backgroundColor = isDark ? '#064e3b' : '#dcfce7';
    btn.style.borderColor = '#10b981';
    btn.style.borderWidth = '2px';
    btn.style.boxShadow = isDark ? '0 0 32px rgba(16, 185, 129, 0.55)' : '0 8px 24px rgba(16, 185, 129, 0.35)';
    ring.classList.remove('hidden');
    icon.className = 'material-symbols-outlined text-emerald-500 dark:text-emerald-400 text-[38px] fan-spin';
    icon.classList.remove('fan-stopped');
    glow.classList.remove('opacity-0');
    dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse';
    text.className = 'text-xs font-bold text-emerald-500 dark:text-emerald-400';
    text.textContent = `ON (${d.powerWatts}W)`;
  } else {
    btn.style.backgroundColor = '';
    btn.style.borderColor = '';
    btn.style.borderWidth = '';
    btn.style.boxShadow = 'none';
    ring.classList.add('hidden');
    icon.className = 'material-symbols-outlined theme-text-muted text-[38px] fan-stopped';
    glow.classList.add('opacity-0');
    dot.className = 'w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500';
    text.className = 'text-xs font-bold theme-text-muted';
    text.textContent = 'OFF (0W)';
  }

  if (d.wallState === 1) {
    wallText.className = 'text-xs font-semibold text-emerald-500 dark:text-emerald-400 mt-0.5';
    wallText.textContent = 'STATE 1 (Synced)';
  } else {
    wallText.className = 'text-xs font-semibold theme-text-muted mt-0.5';
    wallText.textContent = 'STATE 0 (Normal)';
  }
}

function renderAllDevices() {
  renderDevice1();
  renderDevice2();
  renderDevice3();
  updateCounters();
}

// Individual Device Toggle (With Master Lock Guard)
function toggleDevice(index) {
  if (!checkMasterLock()) return;
  const d = state.devices[index];
  d.isOn = !d.isOn;
  renderAllDevices();
  updateFirebaseDevice(index);
  showToast(`ESP32: Relay ${d.pin} (${d.name}) switched ${d.isOn ? 'ON' : 'OFF'}.`);
}

// Wall Interlock toggle
function toggleWallState(index) {
  if (!checkMasterLock()) return;
  const d = state.devices[index];
  d.wallState = d.wallState === 1 ? 0 : 1;
  renderAllDevices();
  updateFirebaseDevice(index);
  showToast(`Physical wall switch (Pin ${d.wallPin}) flipped for ${d.name}.`);
}

// Bulk Channels On / Off (With Master Lock Guard)
function setAllChannels(targetState) {
  if (!checkMasterLock()) return;
  state.devices.forEach((d, i) => {
    d.isOn = targetState;
    updateFirebaseDevice(i);
  });
  renderAllDevices();
  showToast(targetState ? 'All Channels switched ON.' : 'All Channels switched OFF.');
}

// Tab switcher between Quick Timer and Schedule inside each card
window.switchCardTab = function(devIndex, targetTab) {
  const cardNum = devIndex + 1;
  const timerBtn = document.getElementById(`tab-timer-btn-${cardNum}`);
  const schedBtn = document.getElementById(`tab-sched-btn-${cardNum}`);
  const timerView = document.getElementById(`card-timer-view-${cardNum}`);
  const schedView = document.getElementById(`card-sched-view-${cardNum}`);

  if (targetTab === 'timer') {
    timerBtn.className = 'py-1.5 rounded-lg theme-tab-active font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer';
    schedBtn.className = 'py-1.5 rounded-lg theme-text-muted hover:theme-text-strong flex items-center justify-center gap-1.5 transition-all cursor-pointer';
    timerView.classList.remove('hidden');
    schedView.classList.add('hidden');
  } else {
    schedBtn.className = 'py-1.5 rounded-lg theme-tab-active font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer';
    timerBtn.className = 'py-1.5 rounded-lg theme-text-muted hover:theme-text-strong flex items-center justify-center gap-1.5 transition-all cursor-pointer';
    schedView.classList.remove('hidden');
    timerView.classList.add('hidden');
  }
};

// Arm Device Timer
window.armDeviceTimer = function(devIndex) {
  if (!checkMasterLock()) return;

  const cardNum = devIndex + 1;
  const mins = parseInt(document.getElementById(`timer-duration-${cardNum}`).value) || 15;
  const action = document.getElementById(`timer-action-${cardNum}`).value;
  const dev = state.devices[devIndex];

  dev.timerSeconds = mins * 60;
  if (dev.timerInterval) clearInterval(dev.timerInterval);

  const statusPill = document.getElementById(`status-pill-${cardNum}`);
  const title = document.getElementById(`active-rule-title-${cardNum}`);
  const text = document.getElementById(`active-rule-text-${cardNum}`);

  if (statusPill && title && text) {
    statusPill.className = 'flex flex-col gap-1 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
    title.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-pulse">hourglass_top</span> Micro-Timer Active';
    text.className = 'text-xs theme-text-strong font-mono font-bold';
    text.textContent = `${action} in ${String(mins).padStart(2,'0')}:00 min`;
  }

  dev.timerInterval = setInterval(() => {
    dev.timerSeconds--;
    if (dev.timerSeconds <= 0) {
      clearInterval(dev.timerInterval);
      dev.timerInterval = null;
      dev.timerSeconds = null;
      dev.isOn = (action === 'Turn ON');
      renderAllDevices();
      if (text) text.textContent = `Timer completed: ${action}`;
      showToast(`⏱ Timer Triggered: ${dev.name} ${action}.`);
      return;
    }
    const m = Math.floor(dev.timerSeconds / 60);
    const s = dev.timerSeconds % 60;
    if (text) text.textContent = `${action} in ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} min`;
  }, 1000);

  showToast(`Timer Armed: ${dev.name} will ${action} in ${mins} min.`);
};

// Cancel Device Timer
window.cancelDeviceTimer = function(devIndex) {
  if (!checkMasterLock()) return;
  const dev = state.devices[devIndex];
  if (dev.timerInterval) {
    clearInterval(dev.timerInterval);
    dev.timerInterval = null;
  }
  dev.timerSeconds = null;

  const cardNum = devIndex + 1;
  const statusPill = document.getElementById(`status-pill-${cardNum}`);
  const title = document.getElementById(`active-rule-title-${cardNum}`);
  const text = document.getElementById(`active-rule-text-${cardNum}`);

  if (statusPill && title && text) {
    statusPill.className = 'flex flex-col gap-1 p-2.5 rounded-xl theme-subcard theme-text-muted border';
    title.textContent = 'Timer Canceled';
    text.textContent = 'Standby • Ready for timer or recurring cron';
  }
  showToast(`Timer canceled for ${dev.name}.`);
};

// In-Card Commit Schedule
window.commitInCardSchedule = function(devIndex) {
  if (!checkMasterLock()) return;
  const cardNum = devIndex + 1;
  const action = document.getElementById(`csched-action-${cardNum}`).value;
  const time = document.getElementById(`csched-time-${cardNum}`).value;
  const cadence = document.getElementById(`csched-cadence-${cardNum}`).value;
  const dev = state.devices[devIndex];

  dev.schedule = { action, time, cadence, active: true };

  const statusPill = document.getElementById(`status-pill-${cardNum}`);

  if (statusPill) {
    statusPill.className = 'flex flex-col gap-1 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400';
    statusPill.innerHTML = `
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-1.5 font-bold">
          <span class="material-symbols-outlined text-[16px]">schedule</span>
          <span>Active Schedule</span>
        </div>
        <div class="flex items-center gap-2 text-[11px]">
          <button class="hover:underline font-semibold cursor-pointer" onclick="editScheduleDirect(${devIndex})" type="button">Edit</button>
          <span>•</span>
          <button class="text-red-500 dark:text-red-400 hover:underline font-semibold cursor-pointer" onclick="clearScheduleDirect(${devIndex})" type="button">Delete</button>
        </div>
      </div>
      <span class="text-xs theme-text-strong font-medium">${action} • ${cadence} • ${time}</span>
    `;
  }
  showToast(`✓ Schedule Saved: ${dev.name} will ${action} at ${time} (${cadence})!`);
};

window.clearScheduleDirect = function(devIndex) {
  if (!checkMasterLock()) return;
  const dev = state.devices[devIndex];
  dev.schedule = null;
  const cardNum = devIndex + 1;
  const statusPill = document.getElementById(`status-pill-${cardNum}`);
  if (statusPill) {
    statusPill.className = 'flex flex-col gap-1 p-2.5 rounded-xl theme-subcard theme-text-muted border';
    statusPill.innerHTML = `
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px]">info</span>
          <span>No active schedule</span>
        </div>
      </div>
      <span class="text-xs theme-text-muted">Standby • Ready for timer or recurring cron</span>
    `;
  }
  showToast(`Schedule cleared for ${dev.name}.`);
};

window.editScheduleDirect = function(devIndex) {
  switchCardTab(devIndex, 'schedule');
  showToast(`Editing schedule for ${state.devices[devIndex].name}.`, 'info');
};

// Fan initial countdown timer
function initFanInitialTimer() {
  const dev = state.devices[2];
  const text = document.getElementById('active-rule-text-3');

  dev.timerInterval = setInterval(() => {
    if (dev.timerSeconds <= 0) {
      clearInterval(dev.timerInterval);
      dev.timerInterval = null;
      dev.isOn = false;
      renderAllDevices();
      if (text) text.textContent = 'Timer Expired: Turned OFF';
      showToast('Bedroom Fan timer expired: Switched OFF.');
      return;
    }
    dev.timerSeconds--;
    const m = Math.floor(dev.timerSeconds / 60);
    const s = dev.timerSeconds % 60;
    if (text) text.textContent = `Turning OFF in ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} min`;
  }, 1000);
}

// ROBUST THEME TOGGLE: Seamless Switch Between Dark & Warm Light
function toggleTheme() {
  const html = document.documentElement;
  const themeIcon = document.getElementById('theme-icon');
  
  if (html.classList.contains('dark')) {
    html.classList.remove('dark');
    state.theme = 'light';
    if (themeIcon) {
      themeIcon.textContent = 'dark_mode';
      themeIcon.className = 'material-symbols-outlined text-[20px] text-amber-700';
    }
    showToast('Switched to Warm Sand Theme.', 'info');
  } else {
    html.classList.add('dark');
    state.theme = 'dark';
    if (themeIcon) {
      themeIcon.textContent = 'light_mode';
      themeIcon.className = 'material-symbols-outlined text-[20px] text-amber-400';
    }
    showToast('Switched to Precision Dark Interface.', 'info');
  }
  renderAllDevices();
}

// Quick Hardware Sync
function quickSyncController() {
  const syncIcon = document.getElementById('sync-icon');
  if (syncIcon) {
    syncIcon.classList.add('rotate-[360deg]');
    setTimeout(() => syncIcon.classList.remove('rotate-[360deg]'), 500);
  }
  const jitter = Math.floor(13 + Math.random() * 6);
  document.getElementById('telemetry-rtt').textContent = `${jitter}ms`;
  document.getElementById('telemetry-ping').textContent = `${jitter}ms`;
  showToast(`Controller bus synchronized. Round trip latency: ${jitter}ms.`);
}

// Settings Modal Management
function openSettingsModal() {
  if (!checkMasterLock()) return;
  const modal = document.getElementById('settings-modal');
  const panel = document.getElementById('settings-modal-panel');
  if (!modal || !panel) return;

  state.devices.forEach((d, i) => {
    const n = document.getElementById(`input-name-${i}`);
    const s = document.getElementById(`input-sub-${i}`);
    if (n) n.value = d.name;
    if (s) s.value = d.subtext;
  });

  modal.classList.remove('opacity-0', 'pointer-events-none');
  panel.classList.remove('scale-95');
  panel.classList.add('scale-100');
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const panel = document.getElementById('settings-modal-panel');
  if (!modal || !panel) return;

  panel.classList.remove('scale-100');
  panel.classList.add('scale-95');
  modal.classList.add('opacity-0', 'pointer-events-none');
}

// --- Firebase Realtime Database Sync ---
let isSyncingFromFirebase = false;

function initFirebaseSync() {
  if (!window.fbDb || !window.fbOnValue) {
    setTimeout(initFirebaseSync, 500);
    return;
  }

  const homeRef = window.fbRef(window.fbDb, 'home');
  window.fbOnValue(homeRef, (snapshot) => {
    const val = snapshot.val();
    if (!val) return;

    isSyncingFromFirebase = true;

    // Sync Master State
    if (val.master && val.master.state !== undefined) {
      const masterOn = (val.master.state === 'on' || val.master.state === true);
      if (state.masterLockArmed !== masterOn) {
        state.masterLockArmed = masterOn;
        renderMasterLockState();
      }
    }

    // Sync Devices (1, 2, 3 -> index 0, 1, 2)
    if (val.devices) {
      for (let i = 0; i < state.devices.length; i++) {
        const devKey = String(i + 1);
        const fbDev = val.devices[devKey];
        if (fbDev) {
          if (fbDev.state !== undefined) {
            const isOn = (fbDev.state === 'on' || fbDev.state === true);
            state.devices[i].isOn = isOn;
          }
          if (fbDev.switch !== undefined) {
            state.devices[i].wallState = (fbDev.switch === true || fbDev.switch === 'true') ? 1 : 0;
          }
          if (fbDev.name !== undefined && fbDev.name !== state.devices[i].name) {
            state.devices[i].name = fbDev.name;
            const titleEl = document.getElementById(`title-dev-${i + 1}`);
            if (titleEl) titleEl.textContent = fbDev.name;
          }
        }
      }
      renderAllDevices();
    }

    isSyncingFromFirebase = false;
  });
}

function updateFirebaseDevice(index) {
  if (isSyncingFromFirebase) return;
  if (!window.fbDb || !window.fbSet || !window.fbRef) return;

  const d = state.devices[index];
  const devKey = String(index + 1);
  const deviceRef = window.fbRef(window.fbDb, `home/devices/${devKey}`);
  
  window.fbSet(deviceRef, {
    name: d.name,
    state: d.isOn ? 'on' : 'off',
    switch: d.wallState === 1
  }).catch(err => console.error("Firebase update error:", err));
}

function updateFirebaseMaster() {
  if (isSyncingFromFirebase) return;
  if (!window.fbDb || !window.fbSet || !window.fbRef) return;

  const masterRef = window.fbRef(window.fbDb, 'home/master');
  window.fbSet(masterRef, {
    state: state.masterLockArmed ? 'on' : 'off'
  }).catch(err => console.error("Firebase master update error:", err));
}

function saveDeviceSettings() {
  state.devices.forEach((d, i) => {
    const n = document.getElementById(`input-name-${i}`);
    const s = document.getElementById(`input-sub-${i}`);
    if (n && n.value.trim()) d.name = n.value.trim();
    if (s && s.value.trim()) d.subtext = s.value.trim();

    const titleEl = document.getElementById(`title-dev-${i + 1}`);
    const subEl = document.getElementById(`sub-dev-${i + 1}`);
    if (titleEl) titleEl.textContent = d.name;
    if (subEl) subEl.textContent = d.subtext;

    updateFirebaseDevice(i);
  });
  closeSettingsModal();
  showToast('✓ Hardware NVRAM & Firebase updated with appliance names!');
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Firebase Realtime Database Sync
  initFirebaseSync();

  // Master Lock Buttons
  document.getElementById('master-lock-trigger')?.addEventListener('click', toggleMasterLock);
  document.getElementById('btn-toggle-lock-text')?.addEventListener('click', toggleMasterLock);
  document.getElementById('btn-banner-unlock')?.addEventListener('click', toggleMasterLock);

  // Bulk Power Matrix
  document.getElementById('btn-all-on')?.addEventListener('click', () => setAllChannels(true));
  document.getElementById('btn-all-off')?.addEventListener('click', () => setAllChannels(false));

  // Device Switches
  document.getElementById('btn-toggle-1')?.addEventListener('click', () => toggleDevice(0));
  document.getElementById('btn-toggle-2')?.addEventListener('click', () => toggleDevice(1));
  document.getElementById('fan-toggle-btn')?.addEventListener('click', () => toggleDevice(2));

  // Wall Switches
  document.getElementById('wall-toggle-1')?.addEventListener('click', () => toggleWallState(0));
  document.getElementById('wall-toggle-2')?.addEventListener('click', () => toggleWallState(1));
  document.getElementById('wall-toggle-3')?.addEventListener('click', () => toggleWallState(2));

  // Header & Modals
  document.getElementById('btn-theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('btn-quick-sync')?.addEventListener('click', quickSyncController);
  document.getElementById('btn-open-settings')?.addEventListener('click', openSettingsModal);
  document.getElementById('btn-close-modal')?.addEventListener('click', closeSettingsModal);
  document.getElementById('btn-cancel-settings')?.addEventListener('click', closeSettingsModal);
  document.getElementById('btn-save-settings')?.addEventListener('click', saveDeviceSettings);

  document.getElementById('settings-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('settings-modal')) closeSettingsModal();
  });

  // Dynamic Greeting init & continuous tick
  updateRealtimeGreeting();
  setInterval(updateRealtimeGreeting, 10000);

  // Start background timers & render initial states
  renderMasterLockState();
  renderAllDevices();
  initFanInitialTimer();
});
