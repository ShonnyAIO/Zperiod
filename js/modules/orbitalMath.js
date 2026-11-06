// =============================================================================
// Orbital Math — electron configuration parsing, Hund filling and hydrogen-like
// |ψ|² sampling for the 3D orbital view. Pure functions, no THREE dependency.
// =============================================================================

const SUPERSCRIPT_DIGITS = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
const NOBLE_GAS_CORES = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86 };
const L_OF = { s: 0, p: 1, d: 2, f: 3 };

// Madelung order: enough to expand any noble-gas core into explicit subshells.
const AUFBAU = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s", "4d", "5p", "6s", "4f", "5d", "6p", "7s", "5f", "6d", "7p"];

// Real orbitals per subshell, in Hund filling order. `html` is the chip label.
const REAL_ORBITALS = {
  s: [{ m: "s", html: "" }],
  p: [{ m: "px", html: "<sub>x</sub>" }, { m: "py", html: "<sub>y</sub>" }, { m: "pz", html: "<sub>z</sub>" }],
  d: [
    { m: "dxy", html: "<sub>xy</sub>" }, { m: "dyz", html: "<sub>yz</sub>" }, { m: "dz2", html: "<sub>z²</sub>" },
    { m: "dxz", html: "<sub>xz</sub>" }, { m: "dx2y2", html: "<sub>x²−y²</sub>" },
  ],
  f: [
    { m: "fz3", html: "<sub>z³</sub>" }, { m: "fxz2", html: "<sub>xz²</sub>" }, { m: "fyz2", html: "<sub>yz²</sub>" },
    { m: "fxyz", html: "<sub>xyz</sub>" }, { m: "fzx2y2", html: "<sub>z(x²−y²)</sub>" },
    { m: "fxx23y2", html: "<sub>x(x²−3y²)</sub>" }, { m: "fy3x2y2", html: "<sub>y(3x²−y²)</sub>" },
  ],
};

/** Coreless subshell occupancies of the core shared by a noble gas. */
function expandCore(electrons) {
  const out = [];
  for (const sub of AUFBAU) {
    if (electrons <= 0) break;
    const cap = 2 * (2 * L_OF[sub[1]] + 1);
    const e = Math.min(cap, electrons);
    out.push({ n: Number(sub[0]), l: sub[1], electrons: e });
    electrons -= e;
  }
  return out;
}

/** "[Ar] 3d⁵ 4s¹" → [{n:1,l:"s",electrons:2}, …, {n:3,l:"d",electrons:5}, {n:4,l:"s",electrons:1}] */
export function parseConfiguration(config) {
  const text = String(config || "").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => SUPERSCRIPT_DIGITS[c]);
  const core = text.match(/\[([A-Z][a-z]?)\]/);
  const subshells = core && NOBLE_GAS_CORES[core[1]] ? expandCore(NOBLE_GAS_CORES[core[1]]) : [];
  for (const m of text.matchAll(/(\d)([spdf])(\d+)/g)) {
    subshells.push({ n: Number(m[1]), l: m[2], electrons: Number(m[3]) });
  }
  return subshells;
}

/**
 * Valence subshells: the outermost shell plus any partially filled inner d/f,
 * each split into real orbitals filled by Hund's rule (↑ first, then ↓).
 */
export function valenceOrbitals(subshells) {
  if (!subshells.length) return [];
  const maxN = Math.max(...subshells.map((s) => s.n));
  const picked = subshells.filter((s) => {
    const cap = 2 * (2 * L_OF[s.l] + 1);
    return s.n === maxN || ((s.l === "d" || s.l === "f") && s.electrons < cap);
  });
  const orbitals = [];
  for (const sub of picked) {
    const real = REAL_ORBITALS[sub.l];
    for (let i = 0; i < real.length; i++) {
      const electrons = (i < sub.electrons ? 1 : 0) + (i < sub.electrons - real.length ? 1 : 0);
      if (electrons === 0) continue;
      orbitals.push({
        key: `${sub.n}${real[i].m}`,
        n: sub.n,
        l: L_OF[sub.l],
        m: real[i].m,
        subshell: `${sub.n}${sub.l}`,
        labelHtml: `${sub.n}${sub.l}${real[i].html}`,
        electrons,
      });
    }
  }
  return orbitals;
}

// ---- Wavefunction pieces (unnormalized: sampling only needs shape and sign) ----

/** Generalized Laguerre L_k^α(x) by upward recurrence. */
function laguerre(k, alpha, x) {
  if (k === 0) return 1;
  let prev = 1;
  let cur = 1 + alpha - x;
  for (let i = 2; i <= k; i++) {
    const next = ((2 * i - 1 + alpha - x) * cur - (i - 1 + alpha) * prev) / i;
    prev = cur;
    cur = next;
  }
  return cur;
}

/** Hydrogen-like radial function R_nl(r) in Bohr radii (Z = 1). */
export function radial(n, l, r) {
  const rho = (2 * r) / n;
  return Math.pow(rho, l) * Math.exp(-rho / 2) * laguerre(n - l - 1, 2 * l + 1, rho);
}

/** Real spherical harmonic shape for a unit direction (x, y, z). */
export function angular(m, x, y, z) {
  switch (m) {
    case "s": return 1;
    case "px": return x;
    case "py": return y;
    case "pz": return z;
    case "dxy": return x * y;
    case "dyz": return y * z;
    case "dxz": return x * z;
    case "dz2": return (3 * z * z - 1) / (2 * Math.sqrt(3));
    case "dx2y2": return (x * x - y * y) / 2;
    case "fz3": return z * (5 * z * z - 3);
    case "fxz2": return x * (5 * z * z - 1);
    case "fyz2": return y * (5 * z * z - 1);
    case "fxyz": return x * y * z;
    case "fzx2y2": return z * (x * x - y * y);
    case "fxx23y2": return x * (x * x - 3 * y * y);
    case "fy3x2y2": return y * (3 * x * x - y * y);
    default: return 0;
  }
}

/** Radius (Bohr) containing `quantile` of the radial probability. */
function radialTable(n, l) {
  const rMax = 2 * n * n + 10 * n;
  const steps = 600;
  const cdf = new Float64Array(steps + 1);
  for (let i = 1; i <= steps; i++) {
    const r = (i / steps) * rMax;
    const R = radial(n, l, r);
    cdf[i] = cdf[i - 1] + r * r * R * R;
  }
  const total = cdf[steps];
  for (let i = 1; i <= steps; i++) cdf[i] /= total;
  return { rMax, steps, cdf };
}

export function radialQuantile(n, l, quantile) {
  const { rMax, steps, cdf } = radialTable(n, l);
  let i = 0;
  while (i < steps && cdf[i] < quantile) i++;
  return (i / steps) * rMax;
}

/**
 * Samples `count` points from |ψ_nlm|². Returns {positions, signs} where
 * positions are xyz triples in Bohr radii and signs (±1) give ψ's phase.
 * `rand` is injectable so the self-check below is deterministic.
 */
export function sampleOrbital(n, l, m, count, rand = Math.random) {
  const { rMax, steps, cdf } = radialTable(n, l);
  let maxAng = 0;
  for (let i = 0; i < 4000; i++) {
    const [x, y, z] = randomDirection(rand);
    maxAng = Math.max(maxAng, angular(m, x, y, z) ** 2);
  }
  maxAng *= 1.05;

  const positions = new Float32Array(count * 3);
  const signs = new Int8Array(count);
  for (let i = 0; i < count; i++) {
    // Inverse-CDF radial draw, linear within the bin.
    const u = rand();
    let lo = 0, hi = steps;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < u) lo = mid + 1; else hi = mid;
    }
    const span = cdf[lo] - cdf[Math.max(lo - 1, 0)] || 1;
    const frac = lo === 0 ? 0 : (u - cdf[lo - 1]) / span;
    const r = ((lo - 1 + frac) / steps) * rMax;

    let x, y, z, a;
    do {
      [x, y, z] = randomDirection(rand);
      a = angular(m, x, y, z);
    } while (a * a < rand() * maxAng);

    positions[i * 3] = x * r;
    positions[i * 3 + 1] = y * r;
    positions[i * 3 + 2] = z * r;
    signs[i] = radial(n, l, r) * a >= 0 ? 1 : -1;
  }
  return { positions, signs };
}

function randomDirection(rand) {
  const z = rand() * 2 - 1;
  const t = rand() * Math.PI * 2;
  const s = Math.sqrt(1 - z * z);
  return [s * Math.cos(t), s * Math.sin(t), z];
}
