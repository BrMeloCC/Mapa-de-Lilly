// Motor de cálculo do mapa astral no estilo de William Lilly.
// Recebe o objeto Astronomy (astronomy-engine) para funcionar tanto no navegador quanto no Node.

export const SIGNS = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
  'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];

export const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

export const PLANET_NAMES = {
  Sun: 'Sol', Moon: 'Lua', Mercury: 'Mercúrio', Venus: 'Vênus', Mars: 'Marte',
  Jupiter: 'Júpiter', Saturn: 'Saturno', NorthNode: 'Cabeça do Dragão',
  SouthNode: 'Cauda do Dragão', Fortune: 'Parte da Fortuna',
};

// Movimento diário médio (graus/dia) segundo Lilly, usado para "rápido" ou "lento".
export const MEAN_MOTION = {
  Sun: 59 / 60 + 8 / 3600, Moon: 13 + 10 / 60 + 36 / 3600,
  Mercury: 59 / 60 + 8 / 3600, Venus: 59 / 60 + 8 / 3600,
  Mars: 31 / 60 + 27 / 3600, Jupiter: 4 / 60 + 59 / 3600, Saturn: 2 / 60 + 1 / 3600,
};

// Órbitas (raios de luz) de Lilly; um aspecto vale se a distância ao exato
// for menor que a média das órbitas dos dois planetas (soma das "metades").
export const ORBS = { Sun: 17, Moon: 12.5, Mercury: 7, Venus: 8, Mars: 7.5, Jupiter: 12, Saturn: 10 };

export const ASPECTS = [
  { name: 'Conjunção', angle: 0, symbol: '☌' },
  { name: 'Sextil', angle: 60, symbol: '⚹' },
  { name: 'Quadratura', angle: 90, symbol: '□' },
  { name: 'Trígono', angle: 120, symbol: '△' },
  { name: 'Oposição', angle: 180, symbol: '☍' },
];

const RAD = Math.PI / 180;
export const norm = (x) => ((x % 360) + 360) % 360;
// diferença com sinal em (-180, 180]
export const delta = (a, b) => { const d = norm(a - b); return d > 180 ? d - 360 : d; };

export function formatLon(lon) {
  const l = norm(lon);
  const sign = Math.floor(l / 30);
  const inSign = l - sign * 30;
  let deg = Math.floor(inSign);
  let min = Math.round((inSign - deg) * 60);
  if (min === 60) { min = 0; deg += 1; }
  return `${deg}°${String(min).padStart(2, '0')}' ${SIGNS[sign]}`;
}

export function eclipticLon(A, body, time) {
  if (body === 'Moon') return A.EclipticGeoMoon(time).lon;
  if (body === 'Sun') return A.SunPosition(time).elon;
  return A.Ecliptic(A.GeoVector(body, time, true)).elon;
}

function centuries(time) { return time.tt / 36525; }

function obliquity(time) {
  const T = centuries(time);
  return 23.4392911 - 0.0130041667 * T - 1.6667e-7 * T * T + 5.0278e-7 * T * T * T;
}

// Nodo lunar médio (Cabeça do Dragão), como nas efemérides da época de Lilly.
function meanNode(time) {
  const T = centuries(time);
  return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441);
}

// Casas de Regiomontanus, o sistema usado por Lilly.
// H é a distância, no equador, a partir do Meio do Céu: 11ª=30°, 12ª=60°, 1ª=90°, 2ª=120°, 3ª=150°.
export function regiomontanusCusps(ramc, eps, lat) {
  const cusp = (H) => {
    const polo = Math.atan(Math.tan(lat * RAD) * Math.sin(H * RAD));
    const a = (ramc + H) * RAD;
    return norm(Math.atan2(Math.sin(a), Math.cos(a) * Math.cos(eps * RAD) - Math.tan(polo) * Math.sin(eps * RAD)) / RAD);
  };
  const c = new Array(13);
  c[10] = cusp(0); c[11] = cusp(30); c[12] = cusp(60);
  c[1] = cusp(90); c[2] = cusp(120); c[3] = cusp(150);
  for (const h of [10, 11, 12, 1, 2, 3]) c[((h + 5) % 12) + 1] = norm(c[h] + 180);
  return c.slice(1); // índice 0 = casa 1
}

export function houseOf(lon, cusps) {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i], end = cusps[(i + 1) % 12];
    if (norm(lon - start) < norm(end - start)) return i + 1;
  }
  return 1;
}

/**
 * Calcula o mapa.
 * @param A    objeto astronomy-engine
 * @param date instante em UTC (Date)
 * @param lat  latitude em graus (norte positivo)
 * @param lon  longitude em graus (leste positivo)
 */
export function computeChart(A, date, lat, lon) {
  const time = A.MakeTime(date);
  const eps = obliquity(time);
  const ramc = norm(A.SiderealTime(time) * 15 + lon);
  const cusps = regiomontanusCusps(ramc, eps, lat);
  const asc = cusps[0], mc = cusps[9];

  const bodies = {};
  for (const p of PLANETS) {
    const L = eclipticLon(A, p, time);
    const before = eclipticLon(A, p, time.AddDays(-0.5));
    const after = eclipticLon(A, p, time.AddDays(0.5));
    const speed = delta(after, before); // graus por dia
    bodies[p] = {
      id: p, name: PLANET_NAMES[p], lon: L, speed,
      retrograde: speed < 0,
      stationary: Math.abs(speed) < MEAN_MOTION[p] * 0.1,
      swift: Math.abs(speed) > MEAN_MOTION[p],
    };
  }

  const node = meanNode(time);
  bodies.NorthNode = { id: 'NorthNode', name: PLANET_NAMES.NorthNode, lon: node, speed: -0.053, retrograde: true };
  bodies.SouthNode = { id: 'SouthNode', name: PLANET_NAMES.SouthNode, lon: norm(node + 180), speed: -0.053, retrograde: true };
  // Lilly calcula a Parte da Fortuna sempre como Asc + Lua − Sol, de dia ou de noite.
  bodies.Fortune = { id: 'Fortune', name: PLANET_NAMES.Fortune, lon: norm(asc + bodies.Moon.lon - bodies.Sun.lon), speed: 0 };

  for (const b of Object.values(bodies)) {
    b.sign = Math.floor(norm(b.lon) / 30);
    b.signName = SIGNS[b.sign];
    b.degree = norm(b.lon) % 30;
    b.house = houseOf(b.lon, cusps);
    b.text = formatLon(b.lon);
  }

  // Relação com o Sol: cazimi (até 17'), combusto (até 8°30'), sob os raios (até 17°).
  for (const p of PLANETS) {
    if (p === 'Sun') continue;
    const d = Math.abs(delta(bodies[p].lon, bodies.Sun.lon));
    bodies[p].sunDistance = d;
    bodies[p].solar = d <= 17 / 60 ? 'cazimi' : d <= 8.5 ? 'combusto' : d <= 17 ? 'sob os raios' : 'livre';
  }

  // Oriental (nasce antes do Sol) ou ocidental.
  for (const p of ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Moon']) {
    bodies[p].oriental = delta(bodies.Sun.lon, bodies[p].lon) > 0;
  }

  const aspects = computeAspects(bodies);
  const sunHouse = bodies.Sun.house;
  return {
    date, lat, lon, ramc, obliquity: eps, cusps, asc, mc,
    dayChart: sunHouse >= 7 && sunHouse <= 12,
    bodies, aspects,
  };
}

export function computeAspects(bodies) {
  const out = [];
  for (let i = 0; i < PLANETS.length; i++) {
    for (let j = i + 1; j < PLANETS.length; j++) {
      const a = bodies[PLANETS[i]], b = bodies[PLANETS[j]];
      const sep = Math.abs(delta(a.lon, b.lon));
      const maxOrb = (ORBS[a.id] + ORBS[b.id]) / 2;
      for (const asp of ASPECTS) {
        const orb = Math.abs(sep - asp.angle);
        if (orb > maxOrb) continue;
        // Aplicando se o orbe diminui no próximo instante.
        const dt = 0.01;
        const sepNext = Math.abs(delta(a.lon + a.speed * dt, b.lon + b.speed * dt));
        const applying = Math.abs(sepNext - asp.angle) < orb;
        out.push({
          a: a.id, b: b.id, type: asp.name, symbol: asp.symbol, angle: asp.angle,
          orb, maxOrb, applying, partile: orb < 1 && Math.floor(a.degree) === Math.floor(b.degree),
        });
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}
