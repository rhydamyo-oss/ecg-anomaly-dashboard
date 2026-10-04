import { ECGEngine } from './ecgEngine.js';

let chart = null;
let engine = new ECGEngine();
let isStreaming = false;
let streamInterval = null;
let threshold = 0.035;

const MAX_POINTS = 80;
const buffer = { labels: [], observed: [], reconstructed: [], anomalies: [] };

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();
  initChart();
  initTheme();
  bindEvents();
  renderTable(false);
});

function initTheme() {
  const themeBtn = document.getElementById('themeToggle');
  if (!themeBtn) return;
  themeBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });
}

function initChart() {
  const canvas = document.getElementById('ecgChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: 'Observed ECG', data: [], borderColor: '#22d3ee', borderWidth: 2, pointRadius: 0, tension: 0.2 },
        { label: 'Healthy Baseline', data: [], borderColor: '#94a3b8', borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, tension: 0.2 },
        { label: 'Anomaly Overlay', data: [], borderColor: '#f43f5e', backgroundColor: '#f43f5e', borderWidth: 3.5, pointRadius: 1, tension: 0.2 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: { display: false },
        y: { min: -0.5, max: 1.8, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function bindEvents() {
  const streamBtn = document.getElementById('streamBtn');
  const injectBtn = document.getElementById('injectAnomalyBtn');
  const slider = document.getElementById('threshSlider');

  if (streamBtn) {
    streamBtn.addEventListener('click', () => {
      isStreaming = !isStreaming;
      if (isStreaming) {
        streamBtn.classList.replace('bg-emerald-500', 'bg-amber-500');
        streamBtn.innerHTML = `<i data-lucide="pause" class="w-4 h-4"></i> Pause Stream`;
        streamInterval = setInterval(tick, 100);
      } else {
        streamBtn.classList.replace('bg-amber-500', 'bg-emerald-500');
        streamBtn.innerHTML = `<i data-lucide="play" class="w-4 h-4"></i> Start Stream`;
        clearInterval(streamInterval);
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  if (injectBtn) injectBtn.addEventListener('click', () => engine.triggerAnomaly());
  if (slider) slider.addEventListener('input', (e) => threshold = parseFloat(e.target.value));
}

function tick() {
  const sample = engine.generateSample();

  if (buffer.labels.length >= MAX_POINTS) {
    buffer.labels.shift();
    buffer.observed.shift();
    buffer.reconstructed.shift();
    buffer.anomalies.shift();
  }

  const isAnomaly = sample.error > threshold;

  buffer.labels.push(sample.time);
  buffer.observed.push(sample.observed);
  buffer.reconstructed.push(sample.reconstructed);
  buffer.anomalies.push(isAnomaly ? sample.observed : null);

  if (chart) {
    chart.data.labels = buffer.labels;
    chart.data.datasets[0].data = buffer.observed;
    chart.data.datasets[1].data = buffer.reconstructed;
    chart.data.datasets[2].data = buffer.anomalies;
    chart.update('none');
  }

  const mseEl = document.getElementById('mseDisplay');
  if (mseEl) mseEl.innerText = sample.error.toFixed(3);

  const statusBadge = document.getElementById('statusBadge');
  if (statusBadge) {
    if (isAnomaly) {
      statusBadge.innerText = 'ANOMALY DETECTED';
      statusBadge.className = 'inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 animate-pulse';
      renderTable(true);
    } else {
      statusBadge.innerText = 'NORMAL';
      statusBadge.className = 'inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      renderTable(false);
    }
  }
}

function renderTable(hasAnomaly) {
  const tbody = document.getElementById('reportTableBody');
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td class="py-3 px-4 font-medium">P-Wave</td>
      <td class="py-3 px-4">0.12 mV</td>
      <td class="py-3 px-4">0.08 - 0.16 mV</td>
      <td class="py-3 px-4 text-emerald-500 font-semibold">+0.01 mV</td>
      <td class="py-3 px-4 text-slate-400">Normal Atrial Depolarization</td>
    </tr>
    <tr>
      <td class="py-3 px-4 font-medium">QRS Complex</td>
      <td class="py-3 px-4">88 ms</td>
      <td class="py-3 px-4">80 - 100 ms</td>
      <td class="py-3 px-4 text-emerald-500 font-semibold">0 ms</td>
      <td class="py-3 px-4 text-slate-400">Normal Ventricular Depolarization</td>
    </tr>
    <tr>
      <td class="py-3 px-4 font-medium">ST Segment</td>
      <td class="py-3 px-4 ${hasAnomaly ? 'text-rose-500 font-bold' : ''}">${hasAnomaly ? '+0.45 mV' : '+0.02 mV'}</td>
      <td class="py-3 px-4">-0.05 to +0.10 mV</td>
      <td class="py-3 px-4 ${hasAnomaly ? 'text-rose-500 font-bold' : 'text-emerald-500 font-semibold'}">${hasAnomaly ? '+0.40 mV (High)' : '+0.01 mV'}</td>
      <td class="py-3 px-4 ${hasAnomaly ? 'text-rose-500 font-semibold' : 'text-slate-400'}">${hasAnomaly ? 'Acute ST Elevation / Ischemia Risk' : 'Normal Isoelectric Baseline'}</td>
    </tr>
  `;
}
