/* global console */
// Self-check for js/modules/orbitalMath.js: config parsing, Hund filling and |ψ|² sampling.
import assert from "node:assert/strict";
import { parseConfiguration, valenceOrbitals, sampleOrbital, radial, radialQuantile } from "../js/modules/orbitalMath.js";

const total = (subs) => subs.reduce((sum, s) => sum + s.electrons, 0);

// Noble-gas cores expand to the right electron counts, including the [exc] tag.
assert.equal(total(parseConfiguration("1s¹")), 1);
assert.equal(total(parseConfiguration("[Ar] 3d⁵ 4s¹")), 24);
assert.equal(total(parseConfiguration("[Kr] 4d⁷ 5s¹ [exc]")), 44);
assert.equal(total(parseConfiguration("[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶")), 118);

// Carbon: 2s fully paired, two singly occupied 2p (Hund), empty 2p hidden.
const carbon = valenceOrbitals(parseConfiguration("[He] 2s² 2p²"));
assert.deepEqual(carbon.map((o) => [o.key, o.electrons]), [["2s", 2], ["2px", 1], ["2py", 1]]);

// Oxygen 2p⁴: one pair then two singles.
const oxygen = valenceOrbitals(parseConfiguration("[He] 2s² 2p⁴"));
assert.deepEqual(oxygen.filter((o) => o.l === 1).map((o) => o.electrons), [2, 1, 1]);

// Iron keeps the partially filled 3d with the 4s; zinc's full 3d is not valence.
const iron = valenceOrbitals(parseConfiguration("[Ar] 3d⁶ 4s²"));
assert.equal(iron.filter((o) => o.subshell === "3d").reduce((s, o) => s + o.electrons, 0), 6);
assert.ok(!valenceOrbitals(parseConfiguration("[Ar] 3d¹⁰ 4s²")).some((o) => o.subshell === "3d"));

// Europium's half-filled 4f: seven singly occupied orbitals.
const eu = valenceOrbitals(parseConfiguration("[Xe] 4f⁷ 6s²")).filter((o) => o.subshell === "4f");
assert.equal(eu.length, 7);
assert.ok(eu.every((o) => o.electrons === 1));

// Radial nodes: 2s changes sign once, at r = 2 a₀.
assert.ok(radial(2, 0, 1) > 0 && radial(2, 0, 3) < 0);

// Seeded sampler: 1s mean radius ≈ 1.5 a₀; pz lobes split by sign along z.
let seed = 42;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const s1 = sampleOrbital(1, 0, "s", 4000, rand);
let meanR = 0;
for (let i = 0; i < 4000; i++) meanR += Math.hypot(s1.positions[i * 3], s1.positions[i * 3 + 1], s1.positions[i * 3 + 2]);
meanR /= 4000;
assert.ok(Math.abs(meanR - 1.5) < 0.1, `1s mean radius ${meanR}`);

const pz = sampleOrbital(2, 1, "pz", 2000, rand);
for (let i = 0; i < 2000; i++) assert.equal(Math.sign(pz.positions[i * 3 + 2]) || 1, pz.signs[i]);

// Bigger n means a bigger cloud.
assert.ok(radialQuantile(3, 0, 0.9) > radialQuantile(2, 0, 0.9));

console.log("orbitalMath: ok");
