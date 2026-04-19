/**
 * BirdNET Activity Card  —  4 modes : Heure / Jour / Semaine / Mois
 *
 * Config YAML:
 *   type: custom:birdnet-hourly-card
 *   api_url: "http://192.168.x.x:8081"
 *   title: "Daily Activity"          # optionnel
 *
 * Installation:
 *   1. Copier dans /config/www/birdnet-hourly-card.js
 *   2. Paramètres → Tableaux de bord → Ressources → Ajouter
 *      URL: /local/birdnet-hourly-card.js   Type: JavaScript module
 */

const MODES = [
  { key: "hourly",  label: "Heure",   subtitle: "Détections par heure"    },
  { key: "daily",   label: "Jour",    subtitle: "30 derniers jours"        },
  { key: "weekly",  label: "Semaine", subtitle: "13 dernières semaines"    },
  { key: "monthly", label: "Mois",    subtitle: "12 derniers mois"         },
];

class BirdnetHourlyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._mode  = "hourly";
    this._date  = new Date().toISOString().slice(0, 10);
    this._data  = null;
    this._loading = false;
    this._error   = null;
  }

  setConfig(config) {
    if (!config.api_url) throw new Error("birdnet-hourly-card: api_url est requis");
    this._config = { title: "Daily Activity", ...config };
    this._render();
  }

  set hass(_h) {
    if (!this._initialized) { this._initialized = true; this._fetch(); }
  }

  /* ── Fetch ────────────────────────────────────────────────── */

  async _fetch() {
    this._loading = true;
    this._error   = null;
    this._data    = null;
    this._render();
    try {
      const url = this._mode === "hourly"
        ? `${this._config.api_url}/api/hourly?date=${this._date}`
        : `${this._config.api_url}/api/aggregate?mode=${this._mode === "daily" ? "daily" : this._mode === "weekly" ? "weekly" : "monthly"}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      this._data = await resp.json();
    } catch (e) {
      this._error = e.message;
    }
    this._loading = false;
    this._render();
  }

  _setMode(mode) {
    if (mode === this._mode) return;
    this._mode = mode;
    this._fetch();
  }

  _shiftDate(days) {
    const d = new Date(this._date + "T12:00:00");
    d.setDate(d.getDate() + days);
    this._date = d.toISOString().slice(0, 10);
    this._fetch();
  }

  /* ── Colours ──────────────────────────────────────────────── */

  _cellColor(count, maxCount) {
    if (!count) return "var(--birdnet-cell-empty,#eef2f7)";
    const t = Math.min(count / maxCount, 1);
    return `rgb(${Math.round(187-t*150)},${Math.round(222-t*150)},${Math.round(251-t*80)})`;
  }

  _daylightColor(hour, rH, sH) {
    if (rH === null || sH === null) return "#dde3ee";
    if (hour < rH-1 || hour > sH+1) return "#b0bacf";
    if (hour === rH-1 || hour === sH+1) return "#c8cfde";
    if (hour === rH) return "#f4a261";
    if (hour === sH) return "#c77dff";
    return "#ffd166";
  }

  /* ── Column label formatters ──────────────────────────────── */

  _fmtHour(h)   { return String(h).padStart(2,"0"); }

  _fmtDay(iso)  {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(undefined,{month:"short",day:"numeric"});
  }

  _fmtWeek(yw)  {
    // yw = "2026-W12"  →  "S12"
    const w = yw.split("-W")[1] || yw;
    return `S${w}`;
  }

  _fmtMonth(ym) {
    const [y, m] = ym.split("-");
    return new Date(+y, +m-1, 1).toLocaleDateString(undefined,{month:"short"});
  }

  _colLabel(col) {
    switch (this._mode) {
      case "daily":   return this._fmtDay(col);
      case "weekly":  return this._fmtWeek(col);
      case "monthly": return this._fmtMonth(col);
      default:        return this._fmtHour(col);
    }
  }

  _colTitle(col) {
    switch (this._mode) {
      case "daily":   return col;
      case "weekly":  return col;
      case "monthly": return col;
      default:        return `${col}h00`;
    }
  }

  /* ── Helpers ──────────────────────────────────────────────── */

  _fmtDate(iso) {
    return new Date(iso+"T12:00:00").toLocaleDateString(undefined,
      {weekday:"short",day:"numeric",month:"short",year:"numeric"});
  }

  _cellW() {
    return this._mode === "hourly" ? 26 : this._mode === "monthly" ? 42 : 32;
  }

  /* ── Main render ──────────────────────────────────────────── */

  _render() {
    const modeInfo = MODES.find(m => m.key === this._mode) || MODES[0];
    const isToday  = this._date === new Date().toISOString().slice(0, 10);
    const cw       = this._cellW();

    const tabsHtml = MODES.map(m => `
      <button class="tab ${m.key === this._mode ? "tab-active" : ""}"
              data-mode="${m.key}">${m.label}</button>`).join("");

    const navHtml = this._mode === "hourly" ? `
      <div class="nav">
        <button class="nav-btn" id="prev">&#8249;</button>
        <span class="date-label">${this._fmtDate(this._date)}</span>
        <button class="nav-btn" id="next" ${isToday ? "disabled" : ""}>&#8250;</button>
      </div>` : "";

    this.shadowRoot.innerHTML = `
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :host { display: block; }

        .card {
          background: var(--ha-card-background, var(--card-background-color,#fff));
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,.1));
          padding: 16px;
          overflow: hidden;
        }

        /* header */
        .header {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }
        .title-block h2 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--primary-text-color);
        }
        .title-block p {
          font-size: 0.72rem;
          color: var(--secondary-text-color);
          margin-top: 2px;
        }

        /* tabs */
        .tabs {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }
        .tab {
          background: none;
          border: 1px solid var(--divider-color, #ddd);
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          color: var(--secondary-text-color);
          transition: background .15s, color .15s;
        }
        .tab:hover { background: var(--secondary-background-color,#f5f5f5); }
        .tab-active {
          background: var(--primary-color, #03a9f4);
          color: #fff;
          border-color: var(--primary-color, #03a9f4);
        }

        /* nav (hourly only) */
        .nav {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
        }
        .nav-btn {
          background: none;
          border: 1px solid var(--divider-color,#ddd);
          border-radius: 6px;
          width: 28px; height: 28px;
          cursor: pointer;
          color: var(--primary-text-color);
          font-size: 1.1rem;
          display: flex; align-items: center; justify-content: center;
        }
        .nav-btn:disabled { opacity:.35; cursor:default; }
        .date-label {
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--primary-text-color);
        }

        /* grid */
        .grid-wrap { overflow-x: auto; }
        table {
          border-collapse: separate;
          border-spacing: 2px;
          min-width: max-content;
        }
        .col-species {
          position: sticky;
          left: 0;
          background: var(--ha-card-background, var(--card-background-color,#fff));
          z-index: 2;
          padding-right: 8px;
          text-align: left;
        }
        .col-hdr {
          font-size: 0.65rem;
          color: var(--secondary-text-color);
          width: ${cw}px; min-width: ${cw}px;
          text-align: center;
          padding-bottom: 2px;
          font-weight: 400;
          white-space: nowrap;
        }
        .dl-cell {
          width: ${cw}px; height: 7px;
          border-radius: 2px;
        }
        .daylight-label {
          font-size: 0.65rem;
          color: var(--secondary-text-color);
        }

        /* species */
        .sp-info {
          display: flex; align-items: center; gap: 6px; padding: 2px 0;
        }
        .sp-img {
          width: 26px; height: 26px;
          border-radius: 4px; object-fit: cover; flex-shrink: 0;
          background: var(--secondary-background-color,#eee);
        }
        .sp-placeholder {
          width: 26px; height: 26px;
          border-radius: 4px; flex-shrink: 0;
          background: var(--secondary-background-color,#eee);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
        }
        .sp-name {
          font-size: 0.78rem; font-weight: 500;
          color: var(--primary-text-color);
          max-width: 170px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* cells */
        .det-cell {
          width: ${cw}px; height: 26px;
          border-radius: 4px;
          font-size: 0.65rem; font-weight: 700;
          text-align: center; line-height: 26px;
          color: #2d4a6e;
        }
        .det-cell.empty { color: transparent; }

        /* states */
        .state-box {
          text-align: center; padding: 32px 16px;
          color: var(--secondary-text-color); font-size: .85rem;
        }
        .spinner {
          display: inline-block; width: 20px; height: 20px;
          border: 2px solid var(--divider-color,#ccc);
          border-top-color: var(--primary-color,#03a9f4);
          border-radius: 50%;
          animation: spin .8s linear infinite;
          margin-bottom: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>

      <div class="card">
        <div class="header">
          <div class="title-block">
            <h2>${this._config.title}</h2>
            <p>${modeInfo.subtitle}</p>
          </div>
          <div class="tabs">${tabsHtml}</div>
        </div>

        ${navHtml}

        ${this._loading
          ? `<div class="state-box"><div class="spinner"></div><br>Chargement…</div>`
          : this._error
            ? `<div class="state-box">⚠️ ${this._error}</div>`
            : !this._data?.species?.length
              ? `<div class="state-box">Aucune détection.</div>`
              : this._renderGrid()
        }
      </div>`;

    this.shadowRoot.getElementById("prev")?.addEventListener("click", () => this._shiftDate(-1));
    this.shadowRoot.getElementById("next")?.addEventListener("click", () => this._shiftDate(1));
    this.shadowRoot.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => this._setMode(btn.dataset.mode));
    });
  }

  /* ── Grid renderer ────────────────────────────────────────── */

  _renderGrid() {
    const data = this._data;
    const cw   = this._cellW();
    const isHourly = this._mode === "hourly";

    // Build columns array
    const columns = isHourly
      ? Array.from({length: 24}, (_, i) => i)
      : data.columns || [];

    // Max count for color scale
    let maxCount = 1;
    for (const sp of data.species) {
      const arr = isHourly ? sp.hourly_counts : sp.counts;
      for (const c of arr) if (c > maxCount) maxCount = c;
    }

    // Daylight (hourly only)
    let rH = null, sH = null;
    if (isHourly && data.sunrise) rH = new Date(data.sunrise * 1000).getHours();
    if (isHourly && data.sunset)  sH = new Date(data.sunset  * 1000).getHours();

    const daylightRow = isHourly ? `
      <tr>
        <td class="col-species daylight-label">Daylight</td>
        ${columns.map(h => `<td><div class="dl-cell"
            style="background:${this._daylightColor(h,rH,sH)}"></div></td>`).join("")}
      </tr>` : "";

    const headerRow = `
      <tr>
        <th class="col-species"></th>
        ${columns.map(c => `<th class="col-hdr" title="${this._colTitle(c)}">${this._colLabel(c)}</th>`).join("")}
      </tr>`;

    const speciesRows = data.species.map(sp => {
      const counts = isHourly ? sp.hourly_counts : sp.counts;
      const imgTag = sp.image_url
        ? `<img class="sp-img" src="${sp.image_url}" alt=""
              onerror="this.outerHTML='<div class=sp-placeholder>🐦</div>'">`
        : `<div class="sp-placeholder">🐦</div>`;

      const cells = counts.map((count, i) => {
        const bg  = this._cellColor(count, maxCount);
        const cls = count ? "det-cell" : "det-cell empty";
        const lbl = count > 0 ? (count > 999 ? "999+" : count) : "";
        return `<td><div class="${cls}" style="background:${bg};width:${cw}px">${lbl}</div></td>`;
      }).join("");

      return `<tr>
        <td class="col-species">
          <div class="sp-info">${imgTag}<span class="sp-name">${sp.common_name}</span></div>
        </td>${cells}</tr>`;
    }).join("");

    return `<div class="grid-wrap"><table>
      <thead>${daylightRow}${headerRow}</thead>
      <tbody>${speciesRows}</tbody>
    </table></div>`;
  }

  getCardSize() { return 8; }

  static getStubConfig() {
    return { api_url: "http://192.168.x.x:8081", title: "Daily Activity" };
  }
}

customElements.define("birdnet-hourly-card", BirdnetHourlyCard);
