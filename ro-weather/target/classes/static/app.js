const form = document.getElementById('search-form');
const input = document.getElementById('city-input');
const statusBox = document.getElementById('status');
const summary = document.getElementById('summary');
const cards = document.getElementById('cards');

const WEATHER_MAP = [
    { codes: [0],                label: 'Senin',                   icon: 'clear.svg' },
    { codes: [1, 2, 3],          label: 'Parțial noros',           icon: 'partly_cloudy.svg' },
    { codes: [45, 48],           label: 'Ceață',                   icon: 'fog.svg' },
    { codes: [51, 53, 55],       label: 'Burniță',                 icon: 'drizzle.svg' },
    { codes: [56, 57],           label: 'Burniță înghețată',       icon: 'freezing_rain.svg' },
    { codes: [61, 63, 65],       label: 'Ploaie',                  icon: 'rain.svg' },
    { codes: [66, 67],           label: 'Ploaie înghețată',        icon: 'freezing_rain.svg' },
    { codes: [71, 73, 75],       label: 'Ninsoare',                icon: 'snow.svg' },
    { codes: [77],               label: 'Zăpadă granulată',        icon: 'snow.svg' },
    { codes: [80, 81, 82],       label: 'Averse',                  icon: 'rain.svg' },
    { codes: [85, 86],           label: 'Averse de ninsoare',      icon: 'snow.svg' },
    { codes: [95],               label: 'Furtună',                 icon: 'thunder.svg' },
    { codes: [96, 97],           label: 'Furtună cu grindină',     icon: 'thunder.svg' },
];
function codeInfo(code) {
    const found = WEATHER_MAP.find(g => g.codes.includes(code));
    return found || { label: 'N/A', icon: 'cloudy.svg' };
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = (input.value || '').trim();
    if (!city) return;
    setStatus(`Caut prognoza pentru „${city}”...`);
    summary.classList.add('hidden');
    cards.innerHTML = '';

    try {
        const res = await fetch(`/api/forecast?city=${encodeURIComponent(city)}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        renderForecast(data);
        clearStatus();
    } catch (err) {
        setStatus(`Eroare: ${err.message}`);
    }
});

function setStatus(txt) { statusBox.textContent = txt; }
function clearStatus() { statusBox.textContent = ''; }
function val(x) { return (x === null || x === undefined) ? '—' : x; }

function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('ro-RO', { weekday: 'long', day: '2-digit', month: 'long' });
}

function comfortBadge(tMax) {
    if (tMax === null || tMax === undefined) return { class: 'warn', label: 'N/A' };
    if (tMax >= 30) return { class: 'bad',  label: 'Caniculă' };
    if (tMax >= 20) return { class: 'ok',   label: 'Plăcut' };
    if (tMax >= 10) return { class: 'warn', label: 'Răcoros' };
    return { class: 'bad',  label: 'Frig' };
}

function renderForecast(data) {
    const { city, latitude, longitude, timezone, daily } = data;

    summary.innerHTML = `
    <div><strong>${city}</strong></div>
    <div class="coords">${latitude.toFixed(3)}, ${longitude.toFixed(3)} • ${timezone}</div>
  `;
    summary.classList.remove('hidden');

    const frag = document.createDocumentFragment();
    daily.forEach(day => {
        const el = document.createElement('div');
        el.className = 'card';

        const badge = comfortBadge(day.tMax);
        const info = codeInfo(day.weatherCode);

        el.innerHTML = `
      <h3>${fmtDate(day.date)}</h3>

      <div class="row">
        <span>Vreme</span>
        <span class="wx">
          <img class="wx-icon" src="icons/${info.icon}" alt="${info.label}" loading="lazy">
          ${info.label}
        </span>
      </div>

      <div class="row"><span>Max</span><span>${val(day.tMax)} °C</span></div>
      <div class="row"><span>Min</span><span>${val(day.tMin)} °C</span></div>
      <div class="row"><span>Precipitații</span><span>${val(day.precipMm)} mm</span></div>
      <div class="row"><span>Vânt (max)</span><span>${val(day.windMaxKph)} km/h</span></div>
      <div class="row"><span>Cod meteo</span><span>${val(day.weatherCode)}</span></div>

      <div style="margin-top:8px">
        <span class="badge ${badge.class}">${badge.label}</span>
      </div>
    `;
        frag.appendChild(el);
    });

    cards.innerHTML = '';
    cards.appendChild(frag);
}

// Default city on load
window.addEventListener('DOMContentLoaded', () => {
    input.value = 'Cluj-Napoca';
    form.dispatchEvent(new Event('submit'));
});
