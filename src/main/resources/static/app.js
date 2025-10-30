const form = document.getElementById('search-form');
const input = document.getElementById('city-input');
const statusBox = document.getElementById('status');
const summary = document.getElementById('summary');
const cards = document.getElementById('cards');

const WEATHER_MAP = [
    { codes: [0],                label: 'Senin',                   icon: 'sunny' },
    { codes: [1, 2, 3],          label: 'Parțial noros',           icon: 'partiallysunny' },
    { codes: [45, 48],           label: 'Ceață',                   icon: 'foggy' },
    { codes: [51, 53, 55],       label: 'Burniță',                 icon: 'drizzle' },
    { codes: [56, 57],           label: 'Burniță înghețată',       icon: 'heavyrain' },
    { codes: [61, 63, 65],       label: 'Ploaie',                  icon: 'rainy' },
    { codes: [66, 67],           label: 'Ploaie înghețată',        icon: 'heavyrain' },
    { codes: [71, 73, 75],       label: 'Ninsoare',                icon: 'snowy' },
    { codes: [77],               label: 'Zăpadă granulată',        icon: 'sleet' },
    { codes: [80, 81, 82],       label: 'Averse',                  icon: 'showerrain' },
    { codes: [85, 86],           label: 'Averse de ninsoare',      icon: 'snowrain' },
    { codes: [95],               label: 'Furtună',                 icon: 'storm' },
    { codes: [96, 97],           label: 'Furtună cu grindină',     icon: 'sleetstorm' },
];

function codeInfo(code) {
    const found = WEATHER_MAP.find(g => g.codes.includes(code));
    const base = (found && found.icon) ? String(found.icon).replace(/\.svg$/i, '') : 'cloudy';
    return { label: found ? found.label : 'N/A', iconBase: base };
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = (input.value || '').trim();
    if (!city) return;
    setStatus(`Searching forecast for „${city}”...`);
    summary.classList.add('hidden');
    cards.innerHTML = '';

    try {
        const res = await fetch(`/api/forecast?city=${encodeURIComponent(city)}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        renderForecast(data);
        clearStatus();
    } catch (err) {
        setStatus(`Error: ${err.message}`);
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

function buildToday(first){
    const el = document.createElement('div');
    el.className = 'card0';

    const badge = comfortBadge(first.tMax);
    const info  = codeInfo(first.weatherCode);
    const iconHtml = `
    <img class="wx-icon" src="icons/${info.iconBase}.svg" alt="${info.label}" loading="lazy" height="40">
  `;

    el.innerHTML = `
    <h3>Today</h3>

    <div class="row">
      <span>Vreme</span>
      <span class="wx">
        ${iconHtml}
        ${info.label}
      </span>
    </div>

    <div class="row"><span>Max</span><span>${val(first.tMax)} °C</span></div>
    <div class="row"><span>Min</span><span>${val(first.tMin)} °C</span></div>
    <div class="row"><span>Precipitații</span><span>${val(first.precipMm)} mm</span></div>
    <div class="row"><span>Vânt</span><span>${val(first.windMaxKph)} km/h</span></div>
    <div class="row"><span>Cod meteo</span><span>${val(first.weatherCode)}</span></div>

    <div style="margin-top:8px">
      <span class="badge ${badge.class}">${badge.label}</span>
    </div>
  `;
    return el;
}

function buildCard(day) {
    const el = document.createElement('div');
    el.className = 'card';

    const badge = comfortBadge(day.tMax);
    const info  = codeInfo(day.weatherCode);
    const iconHtml = `
    <img class="wx-icon" src="icons/${info.iconBase}.svg" alt="${info.label}" loading="lazy" height="40">
  `;

    el.innerHTML = `
    <h3>${fmtDate(day.date)}</h3>

    <div class="row">
      <span>Vreme</span>
      <span class="wx">
        ${iconHtml}
        ${info.label}
      </span>
    </div>

    <div class="row"><span>Max</span><span>${val(day.tMax)} °C</span></div>
    <div class="row"><span>Min</span><span>${val(day.tMin)} °C</span></div>
    <div class="row"><span>Precipitații</span><span>${val(day.precipMm)} mm</span></div>
    <div class="row"><span>Vânt</span><span>${val(day.windMaxKph)} km/h</span></div>
    <div class="row"><span>Cod meteo</span><span>${val(day.weatherCode)}</span></div>

    <div style="margin-top:8px">
      <span class="badge ${badge.class}">${badge.label}</span>
    </div>
  `;
    return el;
}

function renderForecast(data) {
    const { city, latitude, longitude, timezone, daily } = data;

    summary.innerHTML = `
    <div><strong>${city}</strong></div>
    <div class="coords">${latitude.toFixed(3)}, ${longitude.toFixed(3)} • ${timezone}</div>
  `;
    summary.classList.remove('hidden');

    const card0 = document.getElementById('card0');
    cards.innerHTML = '';
    if (card0) card0.innerHTML = '';

    if (!daily || daily.length === 0) return;

    const first = daily[0];
    const firstCard = buildToday(first);
    if (card0) {
        card0.appendChild(firstCard);
    } else {
        cards.appendChild(firstCard);
    }

    const frag = document.createDocumentFragment();
    const rest = daily.slice(1);
    rest.forEach(day => frag.appendChild(buildCard(day)));
    cards.appendChild(frag);
}

// Default city on load
window.addEventListener('DOMContentLoaded', () => {
    input.value = 'Cluj-Napoca';
    form.dispatchEvent(new Event('submit'));
});
