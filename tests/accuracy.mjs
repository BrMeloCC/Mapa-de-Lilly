// Confere o motor do app contra uma referência independente (VSOP87 e ELP pela biblioteca astronomia, Meeus).
import * as A from 'astronomy-engine';
import { computeChart, norm, delta } from '../src/engine.js';
import * as base_ from 'astronomia/base'; const base = base_.default || base_; import * as planetposition_ from 'astronomia/planetposition'; const planetposition = planetposition_.default || planetposition_; import * as elliptic_ from 'astronomia/elliptic'; const elliptic = elliptic_.default || elliptic_;
import * as solar_ from 'astronomia/solar'; const solar = solar_.default || solar_; import * as moonposition_ from 'astronomia/moonposition'; const moonposition = moonposition_.default || moonposition_; import * as nutation_ from 'astronomia/nutation'; const nutation = nutation_.default || nutation_;
import * as coord_ from 'astronomia/coord'; const coord = coord_.default || coord_; import * as deltat_ from 'astronomia/deltat'; const deltat = deltat_.default || deltat_; import * as julian_ from 'astronomia/julian'; const julian = julian_.default || julian_; import * as sidereal_ from 'astronomia/sidereal'; const sidereal = sidereal_.default || sidereal_;
import dataMod from 'astronomia/data'; const data = dataMod.default || dataMod;
const P = {}; for (const k of ['earth','mercury','venus','mars','jupiter','saturn']) P[k] = new planetposition.Planet(data[k]);
const D = 180 / Math.PI;
function ref(date, lat, lon) {
  const jd = date.getTime() / 864e5 + 2440587.5;
  const yr = date.getUTCFullYear() + date.getUTCMonth() / 12;
  const jde = jd + deltat.deltaT(yr) / 86400;
  const [dpsi, deps] = nutation.nutation(jde);
  const eps = nutation.meanObliquity(jde) + deps;
  const out = {};
  out.Sun = norm(solar.apparentVSOP87(P.earth, jde).lon * D);
  const m = moonposition.position(jde); out.Moon = norm((m.lon + dpsi) * D);
  for (const [k, n] of [['Mercury','mercury'],['Venus','venus'],['Mars','mars'],['Jupiter','jupiter'],['Saturn','saturn']]) {
    const eq = elliptic.position(P[n], P.earth, jde);
    const ec = new coord.Equatorial(eq.ra, eq.dec).toEcliptic(eps);
    out[k] = norm(ec.lon * D);
  }
  // casas: RAMC aparente e fórmulas independentes (vetores)
  const gast = sidereal.apparent(jd) / 3600 * 15; // graus
  const ramc = norm(gast + lon);
  const e = eps, phi = lat / D;
  // MC
  const r = ramc / D;
  out.MC = norm(Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(e)) * D);
  // ASC
  out.Asc = norm(Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(e) + Math.tan(phi) * Math.sin(e))) * D);
  // Regiomontanus por vetores: plano pelos pontos N/S do horizonte e pelo ponto do equador em RAMC+H
  const v = (ra, dec) => [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const dot = (a, b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  // ponto Norte do horizonte em coordenadas equatoriais: direção com RA = RAMC + 180, dec = 90 - lat (hemisfério norte)
  const north = v((ramc + 180) / D, (90 - lat) / D);
  const eclN = [0, -Math.sin(e), Math.cos(e)]; // polo da eclíptica em equatoriais
  const cusps = {};
  for (const [h, H] of [[10,0],[11,30],[12,60],[1,90],[2,120],[3,150]]) {
    const q = v((ramc + H) / D, 0);
    const n = cross(north, q);
    let x = cross(n, eclN); // linha de interseção
    // escolhe o ponto do lado de q
    if (dot(x, q) < 0) x = x.map((c) => -c);
    // converte para longitude eclíptica
    const X = x[0], Y = x[1] * Math.cos(e) + x[2] * Math.sin(e);
    cusps[h] = norm(Math.atan2(Y, X) * D);
  }
  out.cusps = cusps;
  return out;
}
const cases = [
  ['São Paulo', '1988-08-22T17:10:00Z', -23.5505, -46.6333],
  ['Recife', '1992-11-03T15:00:00Z', -8.0476, -34.877],
  ['Londres 1647', '1647-03-10T12:00:00Z', 51.5, -0.12],
  ['Oslo', '1975-06-05T15:00:00Z', 59.91, 10.75],
  ['Sydney', '2026-10-14T01:00:00Z', -33.87, 151.21],
  ['NY', '1965-01-20T17:45:00Z', 40.71, -74.0],
];
let worst = {};
for (const [name, iso, lat, lon] of cases) {
  const d = new Date(iso), c = computeChart(A, d, lat, lon), r = ref(d, lat, lon);
  const diffs = [];
  for (const p of ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn']) diffs.push([p, delta(c.bodies[p].lon, r[p]) * 60]);
  diffs.push(['Asc', delta(c.asc, r.Asc) * 60], ['MC', delta(c.mc, r.MC) * 60]);
  for (const [h, lonh] of Object.entries(r.cusps)) diffs.push([`C${h}`, delta(c.cusps[h - 1], lonh) * 60]);
  console.log(name.padEnd(13), diffs.map(([k, v]) => `${k} ${v.toFixed(2)}'`).join('  '));
  for (const [k, v] of diffs) worst[k] = Math.max(worst[k] || 0, Math.abs(v));
}
console.log('maior diferença (minutos de arco):', Object.entries(worst).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(', '));
const LIMIT = 1; // 1 minuto de arco: bem abaixo de qualquer orbe usado nas leituras
const bad = Object.entries(worst).filter(([, v]) => v > LIMIT);
if (bad.length) { console.error('FALHOU acima de', LIMIT, "':", bad); process.exit(1); }
console.log('ok: tudo dentro de', LIMIT, 'minuto de arco');
