// =============================================================================
// Orbital Controls — "Capas / Orbitales" switch and per-orbital chips for the
// element modal's 3D view. Drawing lives in threeRenderer.setOrbitalView().
// =============================================================================

import { finallyData } from "../data/elementsData.js";
import { t } from "./langController.js";
import { parseConfiguration, valenceOrbitals } from "./orbitalMath.js";
import { setOrbitalView, focusOrbital } from "./threeRenderer.js";

let mode = "shells";
let currentOrbitals = [];
let root = null;

const SPIN = { 1: "↑", 2: "↑↓" };

function ensureRoot() {
  if (root && root.isConnected) return root;
  const pane = document.getElementById("atom-container")?.parentElement;
  if (!pane) return null;
  root = document.createElement("div");
  root.className = "orbital-controls";
  root.innerHTML = `
    <div class="orbital-mode-switch" role="radiogroup" aria-label="${t("orbitals.modeLabel")}">
      <button type="button" role="radio" data-mode="shells">${t("orbitals.modeShells")}</button>
      <button type="button" role="radio" data-mode="orbitals">${t("orbitals.modeOrbitals")}</button>
    </div>
    <div class="orbital-panel" hidden>
      <div class="orbital-panel-head">
        <span class="orbital-panel-title">${t("orbitals.valence")}</span>
        <span class="orbital-legend">
          <span class="orbital-phase orbital-phase-plus" aria-hidden="true"></span>${t("orbitals.phasePlus")}
          <span class="orbital-phase orbital-phase-minus" aria-hidden="true"></span>${t("orbitals.phaseMinus")}
        </span>
      </div>
      <div class="orbital-chips"></div>
      <p class="orbital-hint">${t("orbitals.hint")}</p>
    </div>`;
  pane.appendChild(root);

  root.querySelector(".orbital-mode-switch").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-mode]");
    if (!btn || btn.dataset.mode === mode) return;
    mode = btn.dataset.mode;
    applyMode();
  });
  root.querySelector(".orbital-chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".orbital-chip");
    if (!chip) return;
    selectChip(chip.dataset.key || null);
  });
  return root;
}

function selectChip(key) {
  root.querySelectorAll(".orbital-chip").forEach((chip) => {
    const active = (chip.dataset.key || null) === key;
    chip.classList.toggle("active", active);
    chip.setAttribute("aria-pressed", String(active));
  });
  focusOrbital(key);
}

function applyMode() {
  root.querySelectorAll(".orbital-mode-switch button").forEach((btn) => {
    btn.setAttribute("aria-checked", String(btn.dataset.mode === mode));
  });
  const panel = root.querySelector(".orbital-panel");
  panel.hidden = mode !== "orbitals";
  setOrbitalView(mode === "orbitals" ? currentOrbitals : null);
  if (mode === "orbitals") selectChip(null);
}

/** Rebuilds the chips for `element` and re-applies the chosen view mode. */
export function renderOrbitalControls(element) {
  if (!ensureRoot()) return;
  const config = finallyData[element.number]?.level3_properties?.electronic?.configuration;
  currentOrbitals = valenceOrbitals(parseConfiguration(config));

  const chips = [`<button type="button" class="orbital-chip" data-key="">${t("orbitals.all")}</button>`]
    .concat(currentOrbitals.map((o) => `
      <button type="button" class="orbital-chip" data-key="${o.key}" aria-label="${o.key}, ${o.electrons} e⁻">
        <span class="orbital-chip-label">${o.labelHtml}</span><span class="orbital-spin">${SPIN[o.electrons]}</span>
      </button>`));
  root.querySelector(".orbital-chips").innerHTML = chips.join("");
  // Without a parsable configuration there is nothing to draw in orbital mode.
  root.querySelector('[data-mode="orbitals"]').disabled = currentOrbitals.length === 0;
  if (currentOrbitals.length === 0) mode = "shells";
  applyMode();
}
