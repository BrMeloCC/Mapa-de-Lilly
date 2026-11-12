// Técnicas extras no estilo de Lilly: comparação de dois mapas, profecção anual, trânsitos e julgamento horário.

import { PLANETS, PLANET_NAMES, SIGNS, ORBS, MEAN_MOTION, norm, delta, houseOf, eclipticLon } from './engine.js';
import { DOMICILE, EXALTATION } from './scoring.js';
import { PLANET_KEY, AREA_GUIDE, HOUSE_VIA, nm, Nm, temperament } from './interp.js';

const ASP_LIST = [
  { angle: 0, symbol: '☌', name: 'Conjunção' },
  { angle: 60, symbol: '⚹', name: 'Sextil' },
  { angle: 90, symbol: '□', name: 'Quadratura' },
  { angle: 120, symbol: '△', name: 'Trígono' },
  { angle: 180, symbol: '☍', name: 'Oposição' },
];
const ASP_BY_ANGLE = Object.fromEntries(ASP_LIST.map((a) => [a.angle, a]));
const XBENEFIC = ['Jupiter', 'Venus'], XMALEFIC = ['Saturn', 'Mars'];

// Posições do céu num instante (só longitudes e velocidades dos sete planetas).
export function skyAt(A, date) {
  const t = A.MakeTime(date), out = {};
  for (const p of PLANETS) {
    const lon = eclipticLon(A, p, t);
    const speed = delta(eclipticLon(A, p, t.AddDays(0.25)), eclipticLon(A, p, t.AddDays(-0.25))) * 2;
    out[p] = { id: p, lon, speed, sign: Math.floor(norm(lon) / 30), retrograde: speed < 0 };
  }
  return out;
}

// O aspecto mais próximo entre duas longitudes, se estiver dentro da órbita.
export function aspectOf(l1, l2, maxOrb) {
  const sep = Math.abs(delta(l1, l2));
  let best = null;
  for (const a of ASP_LIST) {
    const orb = Math.abs(sep - a.angle);
    if (orb <= maxOrb && (!best || orb < best.orb)) best = { ...a, orb };
  }
  return best;
}

// ====================== Comparação de dois mapas ======================
export const POINT_NAME = { ...PLANET_NAMES, Asc: 'Ascendente', MC: 'Meio do Céu' };
// Temas sem possessivo, para frases sobre duas pessoas.
export const KEY3 = { Sun: 'a identidade', Moon: 'as emoções', Mercury: 'a mente', Venus: 'o afeto', Mars: 'a ação', Jupiter: 'a generosidade', Saturn: 'a disciplina', Asc: 'o jeito de ser' };
const PAIR_NOTE = {
  'Moon-Sun': 'Na tradição, Sol e Lua em contato entre dois mapas é o sinal clássico de união: a luz de um encontra a sensibilidade do outro.',
  'Mars-Venus': 'Vênus e Marte entre dois mapas falam de atração e química física.',
  'Moon-Moon': 'As duas Luas mostram se o ritmo emocional e os hábitos combinam no dia a dia.',
  'Asc-Sun': 'O Sol de um sobre o Ascendente do outro: um se reconhece e se sente visto no outro.',
  'Asc-Moon': 'A Lua de um sobre o Ascendente do outro traz intimidade e sensação de lar.',
  'Moon-Venus': 'Lua e Vênus trazem carinho, delicadeza e vontade de cuidar.',
  'Mercury-Mercury': 'Os dois Mercúrios mostram como é a conversa entre vocês.',
  'Saturn-Sun': 'Saturno sobre o Sol do outro traz compromisso e seriedade, mas também cobrança.',
  'Moon-Saturn': 'Saturno sobre a Lua do outro pode dar estabilidade ou fazer a pessoa se sentir contida.',
  'Saturn-Venus': 'Saturno com Vênus traz lealdade e duração, às vezes com frieza.',
  'Jupiter-Sun': 'Júpiter sobre o Sol do outro traz incentivo e generosidade.',
  'Jupiter-Moon': 'Júpiter sobre a Lua do outro traz acolhimento e otimismo.',
  'Mars-Mars': 'Os dois Martes mostram como vocês brigam e como agem juntos.',
  'Mars-Sun': 'Marte com o Sol do outro dá energia, competição e às vezes disputa de comando.',
  'Mars-Moon': 'Marte com a Lua do outro desperta reações fortes: paixão ou irritação.',
};
const pairKey = (a, b) => [a, b].sort().join('-');
const DIMS = [
  { key: 'sintonia', name: 'Sintonia', desc: 'se vocês se reconhecem e se entendem no essencial', set: ['Sun', 'Moon', 'Asc'] },
  { key: 'amor', name: 'Amor e atração', desc: 'afeto, desejo e romance', set: ['Venus', 'Mars', 'Moon', 'Sun'] },
  { key: 'convivencia', name: 'Convivência', desc: 'rotina, conversa e paciência no dia a dia', set: ['Moon', 'Mercury', 'Saturn', 'Mars', 'Asc'] },
  { key: 'projetos', name: 'Projetos juntos', desc: 'trabalho, dinheiro e metas em comum', set: ['Sun', 'Mercury', 'Jupiter', 'Saturn', 'Mars'] },
];

function contactValue(pa, pb, angle) {
  const has = (x) => pa === x || pb === x;
  if (angle === 120) return 1;
  if (angle === 60) return 0.75;
  if (angle === 0) {
    if (XMALEFIC.some(has) && !XBENEFIC.some(has)) return pa === pb ? 0.2 : -0.5;
    if (XBENEFIC.some(has)) return 1;
    return 0.8;
  }
  if (has('Venus') && has('Mars')) return 0.4; // tensão que também atrai
  return angle === 90 ? -0.8 : -0.55;
}

export function synastry(cA, cB) {
  const pts = (c) => [...PLANETS.map((p) => ({ id: p, lon: c.bodies[p].lon })), { id: 'Asc', lon: c.asc }];
  const PA = pts(cA), PB = pts(cB);
  const contacts = [];
  for (const a of PA) for (const b of PB) {
    if (a.id === 'Asc' && b.id === 'Asc') continue;
    const lum = ['Sun', 'Moon'].includes(a.id) || ['Sun', 'Moon'].includes(b.id);
    const max = a.id === 'Asc' || b.id === 'Asc' ? 5 : lum ? 8 : 6;
    const asp = aspectOf(a.lon, b.lon, max);
    if (!asp) continue;
    const w = 0.35 + 0.65 * (1 - asp.orb / max);
    const v = contactValue(a.id, b.id, asp.angle);
    contacts.push({ a: a.id, b: b.id, ...asp, max, w, v, weight: w * Math.abs(v) * (lum ? 1.3 : 1) * (PAIR_NOTE[pairKey(a.id, b.id)] ? 1.25 : 1) });
  }
  contacts.sort((x, y) => y.weight - x.weight);
  const tA = temperament(cA), tB = temperament(cB);
  const [qa1, qa2] = tA.slug === 'sanguineo' ? ['quente', 'úmido'] : tA.slug === 'colerico' ? ['quente', 'seco'] : tA.slug === 'melancolico' ? ['frio', 'seco'] : ['frio', 'úmido'];
  const [qb1, qb2] = tB.slug === 'sanguineo' ? ['quente', 'úmido'] : tB.slug === 'colerico' ? ['quente', 'seco'] : tB.slug === 'melancolico' ? ['frio', 'seco'] : ['frio', 'úmido'];
  const shared = [qa1 === qb1 ? qa1 : null, qa2 === qb2 ? qa2 : null].filter(Boolean);
  const temperBonus = shared.length === 2 ? 0.6 : shared.length === 1 ? 0.2 : -0.4;
  const dims = DIMS.map((d) => {
    const list = contacts.filter((c) => d.set.includes(c.a) && d.set.includes(c.b));
    let raw = list.reduce((s, c) => s + c.v * c.w, 0);
    if (d.key === 'sintonia' || d.key === 'convivencia') raw += temperBonus;
    return { ...d, raw, score: Math.round(50 + 50 * Math.tanh(raw / 2.6)), contacts: list };
  });
  const overlay = (from, to) => PLANETS.map((p) => ({ id: p, house: houseOf(from.bodies[p].lon, to.cusps) }));
  const overall = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
  return { contacts, dims, overall, tA, tB, shared, temperBonus, aInB: overlay(cA, cB), bInA: overlay(cB, cA) };
}

export function contactText(c, nameA, nameB) {
  const who = (id, n) => (id === 'Asc' ? `o Ascendente de ${n}` : `${nm(id)} de ${n}`);
  const k = (id, n) => `${KEY3[id]} de ${n}`;
  const verb = { 0: 'se fundem', 60: 'cooperam', 90: 'se atritam e pedem ajuste', 120: 'fluem em harmonia', 180: 'se atraem e se confrontam, como dois pratos de uma balança' }[c.angle];
  const title = `${cap1(who(c.a, nameA))} em ${c.name.toLowerCase()} com ${who(c.b, nameB)}`;
  let text = `${cap1(k(c.a, nameA))} e ${k(c.b, nameB)} ${verb}.`;
  if (c.angle === 0 && c.v < 0) text += ' A presença de um planeta difícil pede cuidado para um não pesar sobre o outro.';
  const note = PAIR_NOTE[pairKey(c.a, c.b)];
  return { title, text: note ? `${text} ${note}` : text };
}
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// Contrações: "ao Sol", "à Lua", "do Sol", "da Lua".
const aNm = (id) => ({ Sun: 'ao Sol', Moon: 'à Lua' })[id] || `a ${PLANET_NAMES[id]}`;
const deNm = (id) => ({ Sun: 'do Sol', Moon: 'da Lua' })[id] || `de ${PLANET_NAMES[id]}`;

// ====================== Profecção anual ======================
// A cada aniversário o Ascendente avança um signo. O signo do ano ativa uma casa (contando a partir do Ascendente)
// e o regente desse signo é o "senhor do ano". Dentro do ano, cada mês avança mais um signo.
export function profection(chart, birthUtc, date) {
  const b = new Date(birthUtc);
  const anniv = (n) => { const d = new Date(b); d.setUTCFullYear(b.getUTCFullYear() + n); return d; };
  let age = date.getUTCFullYear() - b.getUTCFullYear();
  if (anniv(age) > date) age -= 1;
  age = Math.max(0, age);
  const ascSign = Math.floor(norm(chart.asc) / 30);
  const yearOf = (n) => {
    const sign = (ascSign + n) % 12;
    return { age: n, sign, house: (n % 12) + 1, lord: DOMICILE[sign], start: anniv(n), end: anniv(n + 1) };
  };
  const cur = yearOf(age);
  const frac = (date - cur.start) / (cur.end - cur.start);
  const month = Math.min(11, Math.max(0, Math.floor(frac * 12)));
  const mSign = (cur.sign + month) % 12;
  const monthStart = new Date(cur.start.getTime() + (cur.end - cur.start) * month / 12);
  const monthEnd = new Date(cur.start.getTime() + (cur.end - cur.start) * (month + 1) / 12);
  return {
    ...cur, frac,
    planetsIn: PLANETS.filter((p) => chart.bodies[p].sign === cur.sign),
    month: { index: month, sign: mSign, house: ((month + cur.age) % 12) + 1, lord: DOMICILE[mSign], start: monthStart, end: monthEnd },
    years: Array.from({ length: 12 }, (_, i) => yearOf(Math.max(0, age - 2) + i)),
  };
}

// ====================== Trânsitos ======================
export const TARGET_NAME = { Sun: 'seu Sol', Moon: 'sua Lua', Mercury: 'seu Mercúrio', Venus: 'sua Vênus', Mars: 'seu Marte', Jupiter: 'seu Júpiter', Saturn: 'seu Saturno', Asc: 'seu Ascendente', MC: 'seu Meio do Céu' };
const TARGET_KEY = { ...PLANET_KEY, Asc: 'você mesmo e seu corpo', MC: 'sua carreira e sua imagem pública' };
const TR_EFFECT = {
  Saturn: { good: 'dá estrutura e firmeza a {k}', hard: 'cobra, atrasa e testa {k}', conj: 'pede maturidade e responsabilidade com {k}' },
  Jupiter: { good: 'abre portas e traz apoio para {k}', hard: 'promete muito para {k}; cuidado com exageros', conj: 'expande e favorece {k}' },
  Mars: { good: 'dá energia e coragem para {k}', hard: 'traz pressa, atrito e irritação para {k}', conj: 'acende e acelera {k}' },
  Sun: { good: 'ilumina {k}', hard: 'expõe {k} e pede equilíbrio com os outros', conj: 'ilumina {k} e dá destaque' },
  Venus: { good: 'traz gentileza para {k}', hard: 'traz encontros e vontade de harmonia para {k}', conj: 'traz afeto, prazer e gentileza para {k}' },
  Mercury: { good: 'facilita conversas sobre {k}', hard: 'traz debates e negociações sobre {k}', conj: 'movimenta conversas, papéis e decisões sobre {k}' },
  Moon: { good: 'traz um dia leve para {k}', hard: 'deixa {k} mais sensível hoje', conj: 'deixa {k} em evidência hoje' },
};
const TR_ORB = { Saturn: 2.5, Jupiter: 2.5, Mars: 2, Sun: 1.5, Venus: 1.5, Mercury: 1.5, Moon: 4 };
export function transitText(tr, target, angle) {
  const kind = angle === 0 ? 'conj' : angle === 60 || angle === 120 ? 'good' : 'hard';
  return TR_EFFECT[tr][kind].replace('{k}', TARGET_KEY[target]);
}
export function transitTone(tr, angle) {
  if (angle === 60 || angle === 120) return 'good';
  if (angle === 0) return XMALEFIC.includes(tr) ? 'bad' : XBENEFIC.includes(tr) || tr === 'Sun' ? 'good' : 'mid';
  return XMALEFIC.includes(tr) ? 'bad' : 'mid';
}
const natalPoints = (natal) => [...PLANETS.map((p) => ({ id: p, lon: natal.bodies[p].lon })), { id: 'Asc', lon: natal.asc }, { id: 'MC', lon: natal.mc }];

// O que o céu de uma data faz no mapa natal: casas atravessadas e aspectos em vigor.
export function transitsAt(A, natal, date) {
  const sky = skyAt(A, date);
  const houses = PLANETS.map((p) => ({ id: p, lon: sky[p].lon, retrograde: sky[p].retrograde, house: houseOf(sky[p].lon, natal.cusps) }));
  const active = [];
  for (const tr of PLANETS) for (const t of natalPoints(natal)) {
    const asp = aspectOf(sky[tr].lon, t.lon, TR_ORB[tr]);
    if (!asp) continue;
    if (['Sun', 'Venus', 'Mercury'].includes(tr) && ![0, 180].includes(asp.angle)) continue;
    if (tr === 'Moon' && ![0, 90, 180, 120].includes(asp.angle)) continue;
    const next = delta(sky[tr].lon + sky[tr].speed * 0.1, t.lon);
    const applying = Math.abs(Math.abs(next) - asp.angle) < asp.orb;
    active.push({ tr, target: t.id, ...asp, applying, tone: transitTone(tr, asp.angle), text: transitText(tr, t.id, asp.angle) });
  }
  const rank = { Saturn: 6, Jupiter: 5, Mars: 4, Sun: 3, Venus: 2, Mercury: 2, Moon: 1 };
  active.sort((x, y) => rank[y.tr] - rank[x.tr] || x.orb - y.orb);
  return { sky, houses, active };
}

// Datas em que os trânsitos ficam exatos nos próximos dias.
export function transitEvents(A, natal, from, days) {
  const movers = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury'];
  const step = 1, n = Math.ceil(days / step);
  const series = [];
  for (let i = 0; i <= n; i++) {
    const d = new Date(from.getTime() + i * step * 86400000), t = A.MakeTime(d), row = { d };
    for (const p of movers) row[p] = eclipticLon(A, p, t);
    series.push(row);
  }
  const out = [];
  for (const tr of movers) for (const t of natalPoints(natal)) {
    const angles = ['Sun', 'Venus', 'Mercury'].includes(tr) ? [0, 180] : [0, 60, 90, 120, 180];
    for (const ang of angles) for (const sgnA of ang === 0 || ang === 180 ? [1] : [1, -1]) {
      const g = (lon) => (ang === 180 ? delta(lon, t.lon + 180) : delta(lon, t.lon) - sgnA * ang);
      for (let i = 0; i < n; i++) {
        const g0 = g(series[i][tr]), g1 = g(series[i + 1][tr]);
        if (Math.abs(g0) > 20 || Math.abs(g1) > 20 || g0 === g1) continue;
        if ((g0 <= 0 && g1 > 0) || (g0 >= 0 && g1 < 0)) {
          const f = g0 / (g0 - g1);
          const date = new Date(series[i].d.getTime() + f * step * 86400000);
          const asp = ASP_BY_ANGLE[ang];
          out.push({ date, tr, target: t.id, ...asp, tone: transitTone(tr, ang), text: transitText(tr, t.id, ang) });
        }
      }
    }
  }
  return out.sort((a, b) => a.date - b.date);
}

// ====================== Julgamento horário ======================
export const HORARY_TOPICS = [
  { key: 'amor', label: 'Amor, casamento, sócio ou um rival', house: 7, who: 'a outra pessoa' },
  { key: 'trabalho', label: 'Emprego, promoção, carreira ou reputação', house: 10, who: 'o cargo ou a carreira' },
  { key: 'dinheiro', label: 'Dinheiro, compra ou objeto perdido', house: 2, who: 'o dinheiro ou o objeto' },
  { key: 'casa', label: 'Casa, imóvel, mudança ou família', house: 4, who: 'a casa ou o imóvel' },
  { key: 'filhos', label: 'Gravidez, filhos ou um projeto criativo', house: 5, who: 'o filho ou o projeto' },
  { key: 'viagem', label: 'Viagem longa, estudos ou processo na justiça', house: 9, who: 'a viagem ou o estudo' },
  { key: 'contato', label: 'Notícias, contrato, irmão ou viagem curta', house: 3, who: 'a notícia ou o contrato' },
  { key: 'rotina', label: 'Serviço, funcionário ou animal de estimação', house: 6, who: 'o serviço ou o funcionário' },
  { key: 'divida', label: 'Dívida, empréstimo ou herança', house: 8, who: 'o dinheiro de terceiros' },
  { key: 'desejo', label: 'Um desejo, um amigo ou um apoio', house: 11, who: 'o desejo ou o amigo' },
];

// Procura quando dois planetas fazem um aspecto exato a partir de agora, antes de algum deles mudar de signo.
function findPerfection(A, date, p1, p2, opts = {}) {
  const fast = [p1, p2].includes('Moon') ? 2 : [p1, p2].some((p) => ['Mercury', 'Venus', 'Sun', 'Mars'].includes(p)) ? 8 : 24;
  const stepH = opts.stepH || fast, maxDays = opts.maxDays || 400;
  const t0 = A.MakeTime(date);
  const lon = (p, h) => eclipticLon(A, p, t0.AddDays(h / 24));
  const s1 = Math.floor(norm(lon(p1, 0)) / 30), s2 = Math.floor(norm(lon(p2, 0)) / 30);
  let prev = null;
  for (let h = 0; h <= maxDays * 24; h += stepH) {
    const l1 = lon(p1, h), l2 = lon(p2, h);
    if (h > 0 && (Math.floor(norm(l1) / 30) !== s1 || Math.floor(norm(l2) / 30) !== s2)) {
      return { none: true, signChange: Math.floor(norm(l1) / 30) !== s1 ? p1 : p2, hours: h };
    }
    const d = delta(l2, l1);
    const gs = { 0: d, 180: delta(l2 + 180, l1), 60: d - 60, '-60': d + 60, 90: d - 90, '-90': d + 90, 120: d - 120, '-120': d + 120 };
    if (prev) {
      for (const k of Object.keys(gs)) {
        const g0 = prev.gs[k], g1 = gs[k];
        if (Math.abs(g0) > 15 || Math.abs(g1) > 15) continue;
        if ((g0 < 0 && g1 >= 0) || (g0 > 0 && g1 <= 0) || (h === stepH && g0 === 0)) {
          const f = g0 === g1 ? 0 : g0 / (g0 - g1);
          const hours = prev.h + f * stepH;
          const ang = Math.abs(+k);
          // distância que ainda falta percorrer, medida no planeta mais rápido
          const startSep = Math.abs(gsAt0(p1, p2, A, t0, ang));
          return { angle: ang, ...ASP_BY_ANGLE[ang], hours, date: new Date(date.getTime() + hours * 3600000), degrees: startSep };
        }
      }
    }
    prev = { h, gs };
  }
  return { none: true, hours: maxDays * 24 };
}
function gsAt0(p1, p2, A, t0, ang) {
  const d = Math.abs(delta(eclipticLon(A, p2, t0), eclipticLon(A, p1, t0)));
  return Math.abs(d - ang);
}

// Aspecto em vigor e se está se separando (para translação de luz).
function separating(sky, p1, p2) {
  const max = (ORBS[p1] + ORBS[p2]) / 2;
  const asp = aspectOf(sky[p1].lon, sky[p2].lon, max);
  if (!asp) return null;
  const later = Math.abs(delta(sky[p1].lon + sky[p1].speed * 0.05, sky[p2].lon + sky[p2].speed * 0.05));
  return Math.abs(later - asp.angle) > asp.orb ? asp : null;
}
const receives = (host, guest, sky) => DOMICILE[sky[guest].sign] === host || EXALTATION[host] === sky[guest].sign;

export function judgeHorary(A, chart, date, topicKey) {
  const topic = HORARY_TOPICS.find((t) => t.key === topicKey) || HORARY_TOPICS[0];
  const sky = skyAt(A, date);
  const ascSign = Math.floor(norm(chart.asc) / 30);
  let querent = DOMICILE[ascSign];
  const quesited = DOMICILE[Math.floor(norm(chart.cusps[topic.house - 1]) / 30)];
  const notes = [], warnings = [];
  const ascDeg = norm(chart.asc) % 30;
  if (ascDeg < 3) warnings.push({ t: 'Ascendente no começo do signo', d: `O Ascendente está a ${ascDeg.toFixed(1)}° de ${SIGNS[ascSign]}. Para Lilly, a pergunta pode ser prematura: a situação ainda não amadureceu.` });
  if (ascDeg > 27) warnings.push({ t: 'Ascendente no fim do signo', d: `O Ascendente está a ${ascDeg.toFixed(1)}° de ${SIGNS[ascSign]}. Para Lilly, a questão pode já estar decidida, ou é tarde para mudar o rumo.` });
  const moonLon = norm(sky.Moon.lon);
  if (moonLon >= 195 && moonLon <= 225) warnings.push({ t: 'Lua na via combusta', d: 'A Lua está entre 15° de Libra e 15° de Escorpião, trecho que Lilly considerava perturbado. Pede cautela com o julgamento.' });
  if (chart.bodies.Saturn.house === 1 || chart.bodies.Saturn.house === 7) warnings.push({ t: `Saturno na casa ${chart.bodies.Saturn.house}`, d: 'Lilly avisa que Saturno nesta casa costuma trazer obstáculos à questão ou confusão no julgamento.' });

  // Lua fora de curso: não aperfeiçoa nenhum aspecto antes de sair do signo.
  const moonNext = PLANETS.filter((p) => p !== 'Moon').map((p) => ({ p, r: findPerfection(A, date, 'Moon', p) })).filter((x) => !x.r.none).sort((a, b) => a.r.hours - b.r.hours);
  const voidMoon = moonNext.length === 0;
  if (voidMoon) warnings.push({ t: 'Lua fora de curso', d: 'A Lua não faz mais nenhum aspecto antes de mudar de signo. Para Lilly, nesse caso "nada acontece", ou o assunto se resolve sem grandes mudanças.' });

  let sameLord = false;
  if (querent === quesited) { sameLord = true; notes.push(`${Nm(querent)} rege tanto você quanto ${topic.who}. Nesse caso, Lilly usa a Lua como sua representante.`); querent = 'Moon'; }
  // A Lua é a cossignificadora de quem pergunta.
  const main = querent === quesited ? { none: true } : findPerfection(A, date, querent, quesited);
  const viaMoon = querent !== 'Moon' && quesited !== 'Moon' ? findPerfection(A, date, 'Moon', quesited) : { none: true };

  let path = null;
  if (!main.none) path = { kind: 'direct', from: querent, to: quesited, ...main };
  else if (!viaMoon.none) path = { kind: 'moon', from: 'Moon', to: quesited, ...viaMoon };

  // Translação de luz: um planeta se afasta de um significador e vai ao encontro do outro.
  let translation = null;
  if (!path) {
    for (const t of PLANETS) {
      if (t === querent || t === quesited) continue;
      // quem translada é mais leve (mais rápido) que os dois significadores
      if (Math.abs(sky[t].speed) <= Math.abs(sky[querent].speed) || Math.abs(sky[t].speed) <= Math.abs(sky[quesited].speed)) continue;
      for (const [x, y] of [[querent, quesited], [quesited, querent]]) {
        if (!separating(sky, t, x)) continue;
        const r = findPerfection(A, date, t, y);
        if (!r.none && (!translation || r.hours < translation.hours)) translation = { by: t, from: x, to: y, ...r };
      }
    }
    if (translation) path = { kind: 'translation', ...translation };
  }
  // Coleta de luz: os dois significadores se aplicam a um planeta mais lento.
  let collection = null;
  if (!path) {
    for (const c of PLANETS) {
      if (c === querent || c === quesited) continue;
      if (MEAN_MOTION[c] >= MEAN_MOTION[querent] || MEAN_MOTION[c] >= MEAN_MOTION[quesited]) continue;
      const r1 = findPerfection(A, date, querent, c), r2 = findPerfection(A, date, quesited, c);
      if (!r1.none && !r2.none) { collection = { by: c, hours: Math.max(r1.hours, r2.hours), date: r1.hours > r2.hours ? r1.date : r2.date, angle: r1.angle, name: r1.name, symbol: r1.symbol }; break; }
    }
    if (collection) path = { kind: 'collection', ...collection };
  }

  // Proibição: outro planeta chega antes a um dos significadores.
  let prohibition = null;
  if (path && (path.kind === 'direct' || path.kind === 'moon')) {
    for (const t of PLANETS) {
      if ([path.from, path.to].includes(t)) continue;
      for (const s of [path.to, path.from]) {
        if (s === 'Moon' || t === 'Moon') continue;
        const r = findPerfection(A, date, t, s, { maxDays: Math.ceil(path.hours / 24) + 1 });
        if (!r.none && r.hours < path.hours - 1 && (XMALEFIC.includes(t) || r.angle === 0 || r.angle === 90 || r.angle === 180)) {
          if (!prohibition || r.hours < prohibition.hours) prohibition = { by: t, on: s, ...r };
        }
      }
    }
  }
  const recQ = receives(querent, quesited, sky), recR = receives(quesited, querent, sky);
  const reception = recQ && recR ? 'mutual' : recQ || recR ? 'one' : null;
  if (reception === 'mutual') notes.push(`${Nm(querent)} e ${nm(quesited)} estão em recepção mútua: cada um está num signo do outro, e os dois lados se querem bem.`);
  else if (recQ) notes.push(`${Nm(quesited)} está num signo ${deNm(querent)}: você acolhe bem esse assunto, e ele tende a vir até você.`);
  else if (recR) notes.push(`${Nm(querent)} está num signo ${deNm(quesited)}: o outro lado está disposto a te receber bem.`);
  for (const p of [querent, quesited]) {
    if (sky[p].retrograde && p !== 'Sun' && p !== 'Moon') notes.push(`${Nm(p)} está retrógrado: Lilly lê isso como atraso, recuo ou alguém que volta atrás.`);
    const b = chart.bodies[p];
    if (b && b.solar === 'combusto') notes.push(`${Nm(p)} está combusto, ofuscado pelo Sol: essa parte age com medo, sem força ou escondida.`);
  }

  // Veredito.
  let answer, tone, why;
  const asp = path && path.angle;
  if (path && path.kind !== 'translation' && path.kind !== 'collection') {
    if (asp === 120 || asp === 60 || asp === 0) { answer = 'Sim'; tone = 'good'; why = asp === 0 ? 'os significadores se encontram por conjunção' : `os significadores se aplicam por ${path.name.toLowerCase()}, um aspecto de harmonia`; }
    else if (asp === 90) { answer = 'Sim, com esforço'; tone = 'mid'; why = 'os significadores se aplicam por quadratura: acontece, mas com atraso, custo ou dificuldade'; }
    else { answer = 'Talvez, com desgaste'; tone = 'mid'; why = 'os significadores se aplicam por oposição: Lilly diz que o assunto pode até se concluir, mas com briga ou arrependimento'; }
    if (path.kind === 'moon') why += ' (pela Lua, que representa você junto com o regente do Ascendente)';
    if (prohibition) { answer = 'Talvez: há um obstáculo'; tone = 'mid'; why += `. Mas antes disso ${nm(prohibition.by)} chega ${aNm(prohibition.on)}, o que Lilly chama de proibição: algo ou alguém pode atrapalhar`; }
    if (reception && tone !== 'good') why += '. A recepção entre eles ajuda e suaviza';
  } else if (path && path.kind === 'translation') {
    answer = 'Sim, com ajuda'; tone = 'good'; why = `${nm(path.by)} se afasta ${deNm(path.from)} e leva a luz até ${nm(path.to)}: uma terceira pessoa ou circunstância une os dois lados (translação de luz)`;
  } else if (path && path.kind === 'collection') {
    answer = 'Sim, por intermédio'; tone = 'good'; why = `os dois significadores se aplicam ${aNm(path.by)}, mais lento e mais pesado: alguém com autoridade reúne os dois lados (coleta de luz)`;
  } else if (reception === 'mutual') {
    answer = 'Talvez'; tone = 'mid'; why = 'os significadores não chegam a se encontrar, mas estão em recepção mútua: há boa vontade dos dois lados, só falta ação';
  } else {
    answer = 'Não, por enquanto'; tone = 'bad'; why = 'os significadores não chegam a se encontrar antes de mudar de signo e nenhum outro planeta faz a ponte';
    if (main.signChange) why += `. ${Nm(main.signChange)} muda de signo antes, e a ocasião passa`;
  }

  // Prazo pelo método de Lilly: graus que faltam, em dias, semanas, meses ou anos conforme signo e casa.
  let timing = null;
  if (path) {
    const lead = path.kind === 'translation' || path.kind === 'collection' ? path.by : path.from;
    const sign = sky[lead].sign, house = chart.bodies[lead].house;
    const mod = sign % 3; // 0 cardinal, 1 fixo, 2 mutável
    const modScore = mod === 0 ? 0 : mod === 2 ? 1 : 2;
    const hScore = [1, 4, 7, 10].includes(house) ? 0 : [2, 5, 8, 11].includes(house) ? 1 : 2;
    const unit = ['dias', 'dias', 'semanas', 'meses', 'anos'][modScore + hScore];
    const n = Math.max(1, Math.round(path.degrees || 1));
    timing = { n, unit, lead, sky: path.date, modName: ['cardinal', 'fixo', 'mutável'][mod], house };
  }
  // A história da Lua: de onde vem e para onde vai.
  let moonPast = null;
  for (const p of PLANETS) {
    if (p === 'Moon') continue;
    const s = separating(sky, 'Moon', p);
    if (s && (!moonPast || s.orb < moonPast.orb)) moonPast = { p, ...s };
  }
  return { topic, querent, quesited, sameLord, path, prohibition, reception, answer, tone, why, notes, warnings, timing, voidMoon, moonNext: moonNext.slice(0, 2).map((x) => ({ p: x.p, ...x.r })), moonPast, sky };
}
