/* ═══════════════════════════════════════════════════════
   Restaurant Analytics Dashboard — Main Application
   ═══════════════════════════════════════════════════════ */

import {
  Chart,
  BarController,
  ScatterController,
  BarElement,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

Chart.register(
  BarController, ScatterController,
  BarElement, PointElement, LineElement,
  CategoryScale, LinearScale,
  Tooltip, Legend, Filler
);

/* ─── Palette ─── */
const COLORS = {
  indigo:  'rgba(99,102,241,',
  violet:  'rgba(139,92,246,',
  cyan:    'rgba(6,182,212,',
  rose:    'rgba(244,63,94,',
  amber:   'rgba(245,158,11,',
  emerald: 'rgba(16,185,129,',
  sky:     'rgba(56,189,248,',
  fuchsia: 'rgba(217,70,239,',
  lime:    'rgba(132,204,22,',
  orange:  'rgba(249,115,22,',
};
const PAL = Object.values(COLORS);
const solid  = (c) => c + '0.85)';
const light  = (c) => c + '0.25)';
const faint  = (c) => c + '0.08)';

/* ─── Chart defaults ─── */
Chart.defaults.color = '#8b95b3';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.display = false;
Chart.defaults.animation = { duration: 700, easing: 'easeOutQuart' };

/* ═══════ State ═══════ */
let ALL_DATA = [];
let filtered  = [];
let charts = {};

let sortCol = 'rating';
let sortAsc = false;
let page = 0;
const PAGE_SIZE = 20;

/* ═══════ Bootstrap ═══════ */
async function init() {
  const res = await fetch('/data/restaurants.json');
  ALL_DATA = await res.json();

  populateFilters();
  applyFilters();
  wireEvents();
}

/* ─── Populate selects ─── */
function populateFilters() {
  const cities   = [...new Set(ALL_DATA.map(r => r.city))].sort();
  const cuisines = [...new Set(ALL_DATA.map(r => r.cuisine))].sort();

  const citySel    = document.getElementById('filter-city');
  const cuisineSel = document.getElementById('filter-cuisine');

  cities.forEach(c => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    citySel.appendChild(o);
  });

  cuisines.forEach(c => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    cuisineSel.appendChild(o);
  });
}

/* ═══════ Filters ═══════ */
function applyFilters() {
  const city    = document.getElementById('filter-city').value;
  const cuisine = document.getElementById('filter-cuisine').value;
  const minRat  = parseFloat(document.getElementById('filter-rating').value);
  const maxCost = parseFloat(document.getElementById('filter-cost').value);

  filtered = ALL_DATA.filter(r => {
    if (city && r.city !== city) return false;
    if (cuisine && r.cuisine !== cuisine) return false;
    if (r.rating < minRat) return false;
    if (r.cost > maxCost) return false;
    return true;
  });

  page = 0;
  updateKPIs();
  renderCharts();
  renderTable();
}

/* ═══════ KPIs ═══════ */
function updateKPIs() {
  const n = filtered.length;
  document.getElementById('total-count').textContent = n.toLocaleString();
  document.getElementById('kpi-total-val').textContent = n.toLocaleString();

  if (n === 0) {
    document.getElementById('kpi-avg-rating-val').textContent = '—';
    document.getElementById('kpi-avg-cost-val').textContent = '—';
    document.getElementById('kpi-top-city-val').textContent = '—';
    document.getElementById('kpi-top-cuisine-val').textContent = '—';
    return;
  }

  const avgRating = (filtered.reduce((s, r) => s + r.rating, 0) / n).toFixed(2);
  const avgCost   = (filtered.reduce((s, r) => s + r.cost, 0) / n).toFixed(0);
  document.getElementById('kpi-avg-rating-val').textContent = `⭐ ${avgRating}`;
  document.getElementById('kpi-avg-cost-val').textContent = `$${avgCost}`;

  const cityCount = countBy(filtered, 'city');
  const cuisineCount = countBy(filtered, 'cuisine');
  document.getElementById('kpi-top-city-val').textContent = topKey(cityCount);
  document.getElementById('kpi-top-cuisine-val').textContent = topKey(cuisineCount);
}

/* ═══════ Charts ═══════ */
function renderCharts() {
  renderRatingHistogram();
  renderCuisineBar();
  renderScatter();
  renderCityBar();
}

/* ── Rating Histogram ── */
function renderRatingHistogram() {
  const bins = 20;
  const min = 1, max = 5;
  const step = (max - min) / bins;
  const counts = new Array(bins).fill(0);
  const labels = [];

  for (let i = 0; i < bins; i++) {
    const lo = min + i * step;
    labels.push(lo.toFixed(1));
  }

  filtered.forEach(r => {
    let idx = Math.floor((r.rating - min) / step);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  });

  const ctx = document.getElementById('chart-ratings');
  if (charts.ratings) charts.ratings.destroy();

  charts.ratings = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: counts.map((_, i) => {
          const t = i / bins;
          return `rgba(99,102,241,${0.4 + t * 0.5})`;
        }),
        borderColor: solid(COLORS.indigo),
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Rating' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { title: { display: true, text: 'Count' },  grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: (items) => `Rating ${items[0].label} – ${(parseFloat(items[0].label) + step).toFixed(1)}`,
            label: (item) => `${item.raw} restaurants`
          }
        }
      }
    }
  });
}

/* ── Top Cuisines (horizontal bar) ── */
function renderCuisineBar() {
  const counts = countBy(filtered, 'cuisine');
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const labels = sorted.map(s => s[0]);
  const data   = sorted.map(s => s[1]);

  const ctx = document.getElementById('chart-cuisines');
  if (charts.cuisines) charts.cuisines.destroy();

  charts.cuisines = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: data.map((_, i) => solid(PAL[i % PAL.length])),
        borderRadius: 6,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true },
        y: { grid: { display: false } }
      },
      plugins: {
        tooltip: { callbacks: { label: (item) => `${item.raw} restaurants` } }
      }
    }
  });
}

/* ── Cost vs Rating (scatter) ── */
function renderScatter() {
  // Sample if too many points
  const sample = filtered.length > 2000
    ? filtered.filter((_, i) => i % Math.ceil(filtered.length / 2000) === 0)
    : filtered;

  const pts = sample.map(r => ({ x: r.cost, y: r.rating }));

  const ctx = document.getElementById('chart-scatter');
  if (charts.scatter) charts.scatter.destroy();

  charts.scatter = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        data: pts,
        backgroundColor: 'rgba(6,182,212,0.35)',
        borderColor: 'rgba(6,182,212,0.6)',
        borderWidth: 1,
        pointRadius: 3.5,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Cost ($)' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { title: { display: true, text: 'Rating' },   grid: { color: 'rgba(255,255,255,0.04)' }, min: 1, max: 5 }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (item) => `Cost: $${item.raw.x}  Rating: ${item.raw.y}`
          }
        }
      }
    }
  });
}

/* ── Restaurants by City (vertical bar) ── */
function renderCityBar() {
  const counts = countBy(filtered, 'city');
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const labels = sorted.map(s => s[0]);
  const data   = sorted.map(s => s[1]);

  const ctx = document.getElementById('chart-cities');
  if (charts.cities) charts.cities.destroy();

  charts.cities = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: data.map((_, i) => solid(PAL[(i + 3) % PAL.length])),
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
      },
      plugins: {
        tooltip: { callbacks: { label: (item) => `${item.raw} restaurants` } }
      }
    }
  });
}

/* ═══════ Data Table ═══════ */
function renderTable() {
  const searchTerm = (document.getElementById('table-search').value || '').toLowerCase();
  let rows = filtered;

  if (searchTerm) {
    rows = rows.filter(r =>
      r.name.toLowerCase().includes(searchTerm) ||
      r.city.toLowerCase().includes(searchTerm) ||
      r.cuisine.toLowerCase().includes(searchTerm)
    );
  }

  // Sort
  rows = [...rows].sort((a, b) => {
    let va = a[sortCol], vb = b[sortCol];
    if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  if (page >= totalPages) page = totalPages - 1;

  const start = page * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);

  const tbody = document.getElementById('table-body');
  tbody.innerHTML = pageRows.map(r => `
    <tr>
      <td>${r.name}</td>
      <td>${r.city}</td>
      <td>${r.cuisine}</td>
      <td><span class="rating-badge ${ratingClass(r.rating)}">★ ${r.rating.toFixed(1)}</span></td>
      <td>${r.votes.toLocaleString()}</td>
      <td>$${r.cost}</td>
    </tr>
  `).join('');

  document.getElementById('table-info').textContent = `${rows.length.toLocaleString()} results`;
  document.getElementById('page-info').textContent = `Page ${page + 1} of ${totalPages}`;
  document.getElementById('page-prev').disabled = page === 0;
  document.getElementById('page-next').disabled = page >= totalPages - 1;

  // Update sort UI
  document.querySelectorAll('#data-table th').forEach(th => {
    const col = th.dataset.sort;
    th.classList.toggle('active', col === sortCol);
    const arrow = th.querySelector('.sort-arrow');
    if (col === sortCol) {
      arrow.textContent = sortAsc ? '▲' : '▼';
    } else {
      arrow.textContent = '';
    }
  });
}

function ratingClass(r) {
  if (r >= 4) return 'rating-high';
  if (r >= 3) return 'rating-mid';
  return 'rating-low';
}

/* ═══════ Event Wiring ═══════ */
function wireEvents() {
  // Filters
  document.getElementById('filter-city').addEventListener('change', applyFilters);
  document.getElementById('filter-cuisine').addEventListener('change', applyFilters);

  const ratingSlider = document.getElementById('filter-rating');
  const ratingDisp   = document.getElementById('rating-display');
  ratingSlider.addEventListener('input', () => {
    ratingDisp.textContent = parseFloat(ratingSlider.value).toFixed(1);
    applyFilters();
  });

  const costSlider = document.getElementById('filter-cost');
  const costDisp   = document.getElementById('cost-display');
  costSlider.addEventListener('input', () => {
    costDisp.textContent = costSlider.value;
    applyFilters();
  });

  document.getElementById('reset-filters').addEventListener('click', () => {
    document.getElementById('filter-city').value = '';
    document.getElementById('filter-cuisine').value = '';
    ratingSlider.value = 1; ratingDisp.textContent = '1.0';
    costSlider.value = 150; costDisp.textContent = '150';
    document.getElementById('table-search').value = '';
    applyFilters();
  });

  // Table search
  let debounce;
  document.getElementById('table-search').addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { page = 0; renderTable(); }, 200);
  });

  // Table sort
  document.querySelectorAll('#data-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (sortCol === col) { sortAsc = !sortAsc; }
      else { sortCol = col; sortAsc = true; }
      renderTable();
    });
  });

  // Pagination
  document.getElementById('page-prev').addEventListener('click', () => { page--; renderTable(); });
  document.getElementById('page-next').addEventListener('click', () => { page++; renderTable(); });
}

/* ─── Helpers ─── */
function countBy(arr, key) {
  const m = {};
  arr.forEach(r => { m[r[key]] = (m[r[key]] || 0) + 1; });
  return m;
}

function topKey(obj) {
  let best = '', bestN = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (v > bestN) { best = k; bestN = v; }
  }
  return best;
}

/* ─── Go ─── */
init();
