// Pontuação de fortalezas e debilidades segundo a tabela de William Lilly
// (Christian Astrology, livro I, cap. "A Table of the Fortitudes and Debilities of the Planets").

import { PLANETS, PLANET_NAMES, SIGNS, norm, delta } from './engine.js';

// Signo de domicílio de cada regente (índice do signo -> planeta)
export const DOMICILE = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

export const EXALTATION = { Sun: 0, Moon: 1, Mercury: 5, Venus: 11, Mars: 9, Jupiter: 3, Saturn: 6 };
const EXALTATION_BY_SIGN = Object.fromEntries(Object.entries(EXALTATION).map(([p, s]) => [s, p]));

// Triplicidades de Lilly: [regente diurno, regente noturno]
const TRIPLICITY = {
  fire: ['Sun', 'Jupiter'], earth: ['Venus', 'Moon'], air: ['Saturn', 'Mercury'], water: ['Mars', 'Mars'],
};
const ELEMENT = ['fire', 'earth', 'air', 'water'];

// Termos de Ptolomeu, como Lilly os publicou: [planeta, grau final]
const TERMS = [
  [['Jupiter', 6], ['Venus', 14], ['Mercury', 21], ['Mars', 26], ['Saturn', 30]],
  [['Venus', 8], ['Mercury', 15], ['Jupiter', 22], ['Saturn', 26], ['Mars', 30]],
  [['Mercury', 7], ['Jupiter', 14], ['Venus', 21], ['Saturn', 25], ['Mars', 30]],
  [['Mars', 6], ['Jupiter', 13], ['Mercury', 20], ['Venus', 27], ['Saturn', 30]],
  [['Saturn', 6], ['Mercury', 13], ['Venus', 19], ['Jupiter', 25], ['Mars', 30]],
  [['Mercury', 7], ['Venus', 13], ['Jupiter', 18], ['Saturn', 24], ['Mars', 30]],
  [['Saturn', 6], ['Venus', 11], ['Jupiter', 19], ['Mercury', 24], ['Mars', 30]],
  [['Mars', 6], ['Jupiter', 14], ['Venus', 21], ['Mercury', 27], ['Saturn', 30]],
  [['Jupiter', 8], ['Venus', 14], ['Mercury', 19], ['Saturn', 25], ['Mars', 30]],
  [['Venus', 6], ['Mercury', 12], ['Jupiter', 19], ['Mars', 25], ['Saturn', 30]],
  [['Saturn', 6], ['Mercury', 12], ['Venus', 20], ['Jupiter', 25], ['Mars', 30]],
  [['Venus', 8], ['Jupiter', 14], ['Mercury', 20], ['Mars', 26], ['Saturn', 30]],
];

// Faces (decanatos) na ordem caldaica, começando por Marte em Áries.
const CHALDEAN = ['Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter'];

// Estrelas fixas da tabela de Lilly (longitude J2000; precessão de ~50,29"/ano).
const FIXED_STARS = [
  { name: 'Cor Leonis (Régulo)', lon2000: 149.83, points: 6 },
  { name: 'Spica', lon2000: 203.84, points: 5 },
  { name: 'Caput Algol', lon2000: 56.17, points: -5 },
];
const STAR_ORB = 5;

const HOUSE_POINTS = { 1: 5, 10: 5, 7: 4, 4: 4, 11: 4, 2: 3, 5: 3, 9: 2, 3: 1, 12: -5, 8: -2, 6: -2 };

const BENEFICS = ['Jupiter', 'Venus'];
const MALEFICS = ['Saturn', 'Mars'];


export function termRuler(lon) {
  const s = Math.floor(norm(lon) / 30), d = norm(lon) % 30;
  return TERMS[s].find(([, end]) => d < end)[0];
}
export function faceRuler(lon) {
  return CHALDEAN[Math.floor(norm(lon) / 10) % 7];
}
export function triplicityRuler(sign, dayChart) {
  return TRIPLICITY[ELEMENT[sign % 4]][dayChart ? 0 : 1];
}

function receptions(p, bodies) {
  const out = [];
  const me = bodies[p];
  for (const q of PLANETS) {
    if (q === p) continue;
    const other = bodies[q];
    if (DOMICILE[me.sign] === q && DOMICILE[other.sign] === p) out.push({ with: q, kind: 'domicílio', points: 5 });
    else if (EXALTATION_BY_SIGN[me.sign] === q && EXALTATION_BY_SIGN[other.sign] === p) out.push({ with: q, kind: 'exaltação', points: 4 });
  }
  return out;
}

function essential(p, chart) {
  const b = chart.bodies[p];
  const items = [];
  const add = (points, label, why) => items.push({ points, label, why });

  if (DOMICILE[b.sign] === p) add(5, 'Domicílio', `${b.name} está no próprio signo (${b.signName}), como alguém em casa.`);
  if (EXALTATION[p] === b.sign) add(4, 'Exaltação', `${b.signName} é o signo de exaltação de ${b.name}: um convidado de honra.`);
  if (triplicityRuler(b.sign, chart.dayChart) === p) add(3, 'Triplicidade', `${b.name} rege a triplicidade de ${b.signName} neste mapa ${chart.dayChart ? 'diurno' : 'noturno'}.`);
  if (termRuler(b.lon) === p) add(2, 'Termo', `${b.name} está nos próprios termos (subdivisão do signo).`);
  if (faceRuler(b.lon) === p) add(1, 'Face', `${b.name} está na própria face (decanato).`);
  const hasDignity = items.length > 0;

  for (const r of receptions(p, chart.bodies)) {
    add(r.points, `Recepção mútua por ${r.kind}`, `${b.name} e ${PLANET_NAMES[r.with]} estão um na ${r.kind} do outro e se ajudam.`);
  }
  if (DOMICILE[(b.sign + 6) % 12] === p) add(-5, 'Detrimento', `${b.signName} é oposto ao signo de ${b.name}: está fora do seu ambiente.`);
  if ((EXALTATION[p] + 6) % 12 === b.sign) add(-4, 'Queda', `${b.signName} é o signo de queda de ${b.name}: perde força e prestígio.`);
  if (!hasDignity && !items.some((i) => i.label.startsWith('Recepção'))) {
    add(-5, 'Peregrino', `${b.name} não tem nenhuma dignidade em ${b.signName}: é um estrangeiro sem apoio.`);
  }
  return items;
}

function accidental(p, chart) {
  const { bodies } = chart;
  const b = bodies[p];
  const items = [];
  const add = (points, label, why) => items.push({ points, label, why });

  const hp = HOUSE_POINTS[b.house];
  add(hp, `Casa ${b.house}`, hp > 0
    ? `Na casa ${b.house}, uma posição ${hp >= 4 ? 'angular e forte' : 'que dá alguma força'}.`
    : `Na casa ${b.house}, uma casa ${b.house === 12 ? 'de isolamento e aflição' : 'cadente e fraca'}.`);

  if (p !== 'Sun' && p !== 'Moon') {
    if (b.retrograde) add(-5, 'Retrógrado', `${b.name} parece andar para trás: age de forma atrasada ou contrária.`);
    else add(4, 'Direto', `${b.name} anda em movimento direto.`);
  }
  if (b.swift) add(2, 'Rápido', `${b.name} anda mais rápido que sua média diária.`);
  else add(-2, 'Lento', `${b.name} anda mais devagar que sua média diária.`);

  if (['Saturn', 'Jupiter', 'Mars'].includes(p)) {
    if (b.oriental) add(2, 'Oriental', `${b.name} nasce antes do Sol, o que fortalece os planetas superiores.`);
    else add(-2, 'Ocidental', `${b.name} se põe depois do Sol, o que enfraquece os planetas superiores.`);
  }
  if (['Mercury', 'Venus'].includes(p)) {
    if (!b.oriental) add(2, 'Ocidental', `${b.name} é ocidental ao Sol, o que fortalece os planetas inferiores.`);
    else add(-2, 'Oriental', `${b.name} é oriental ao Sol, o que enfraquece os planetas inferiores.`);
  }
  if (p === 'Moon') {
    const elong = norm(b.lon - bodies.Sun.lon);
    if (elong < 180) add(2, 'Crescente', 'A Lua está crescendo em luz (da Nova para a Cheia).');
    else add(-2, 'Minguante', 'A Lua está diminuindo em luz (da Cheia para a Nova).');
  }

  if (p !== 'Sun') {
    if (b.solar === 'cazimi') add(5, 'Cazimi', `${b.name} está no coração do Sol, posição de máxima honra.`);
    else if (b.solar === 'combusto') add(-5, 'Combusto', `${b.name} está queimado pelos raios do Sol: perde visibilidade e força.`);
    else if (b.solar === 'sob os raios') add(-4, 'Sob os raios do Sol', `${b.name} está perto demais do Sol e fica ofuscado.`);
    else add(5, 'Livre de combustão', `${b.name} está longe dos raios do Sol.`);
  }

  for (const asp of chart.aspects) {
    if (!asp.partile || (asp.a !== p && asp.b !== p)) continue;
    const other = asp.a === p ? asp.b : asp.a;
    const on = PLANET_NAMES[other];
    if (BENEFICS.includes(other)) {
      const pts = { 0: 5, 120: 4, 60: 3 }[asp.angle];
      if (pts) add(pts, `${asp.type} partil com ${on}`, `Aspecto exato (mesmo grau) com o benéfico ${on}.`);
    }
    if (MALEFICS.includes(other)) {
      const pts = { 0: -5, 180: -4, 90: -3 }[asp.angle];
      if (pts) add(pts, `${asp.type} partil com ${on}`, `Aspecto exato (mesmo grau) com o maléfico ${on}.`);
    }
  }
  const sameDegree = (x) => x.sign === b.sign && Math.floor(x.degree) === Math.floor(b.degree);
  if (sameDegree(bodies.NorthNode)) add(4, 'Com a Cabeça do Dragão', `${b.name} está no mesmo grau da Cabeça do Dragão, que aumenta.`);
  if (sameDegree(bodies.SouthNode)) add(-4, 'Com a Cauda do Dragão', `${b.name} está no mesmo grau da Cauda do Dragão, que diminui.`);

  const years = (chart.date.getTime() - Date.UTC(2000, 0, 1, 12)) / (365.25 * 864e5);
  for (const star of FIXED_STARS) {
    const lon = norm(star.lon2000 + years * 50.29 / 3600);
    if (Math.abs(delta(b.lon, lon)) <= STAR_ORB) {
      add(star.points, `Conjunção com ${star.name}`, star.points > 0
        ? `${b.name} está junto da estrela ${star.name}, sinal de honra e sorte.`
        : `${b.name} está junto da estrela ${star.name}, considerada a mais violenta do céu.`);
    }
  }

  // Sitiado: entre Marte e Saturno, sem outro planeta no meio (aproximação: até 10° de cada lado).
  if (!MALEFICS.includes(p)) {
    const toMars = delta(bodies.Mars.lon, b.lon), toSat = delta(bodies.Saturn.lon, b.lon);
    if (Math.sign(toMars) !== Math.sign(toSat) && Math.abs(toMars) <= 10 && Math.abs(toSat) <= 10) {
      const blocked = PLANETS.some((q) => q !== p && !MALEFICS.includes(q) && (() => {
        const d = delta(bodies[q].lon, b.lon);
        return Math.sign(d) === Math.sign(toMars) ? Math.abs(d) < Math.abs(toMars) : Math.abs(d) < Math.abs(toSat);
      })());
      if (!blocked) add(-5, 'Sitiado', `${b.name} está cercado por Marte e Saturno, os dois maléficos.`);
    }
  }
  return items;
}

export function scorePlanets(chart) {
  const out = {};
  for (const p of PLANETS) {
    const ess = essential(p, chart);
    const acc = accidental(p, chart);
    const sum = (arr) => arr.reduce((s, i) => s + i.points, 0);
    out[p] = {
      id: p, name: PLANET_NAMES[p], essential: ess, accidental: acc,
      essentialTotal: sum(ess), accidentalTotal: sum(acc), total: sum(ess) + sum(acc),
    };
  }
  return out;
}

// Significações das casas segundo Lilly, com o significador natural de cada área.
export const LIFE_AREAS = [
  { house: 1, area: 'Vida, corpo e temperamento', natural: null },
  { house: 2, area: 'Dinheiro e bens', natural: 'Jupiter' },
  { house: 3, area: 'Irmãos, vizinhos, estudos e viagens curtas', natural: 'Mercury' },
  { house: 4, area: 'Família, pai, casa e imóveis', natural: 'Saturn' },
  { house: 5, area: 'Filhos, prazeres e criatividade', natural: 'Venus' },
  { house: 6, area: 'Saúde e rotina de trabalho', natural: null, adverse: true },
  { house: 7, area: 'Casamento, parcerias e rivais declarados', natural: 'Venus' },
  { house: 8, area: 'Heranças, dívidas e bens do parceiro', natural: 'Saturn' },
  { house: 9, area: 'Fé, viagens longas e estudos superiores', natural: 'Jupiter' },
  { house: 10, area: 'Carreira, reputação e honra', natural: 'Sun' },
  { house: 11, area: 'Amigos, apoio e esperanças', natural: 'Jupiter' },
  { house: 12, area: 'Proteção contra inimigos ocultos e provações', natural: null, adverse: true },
];

// Nas casas 6 e 12 o regente representa a doença e os inimigos: quanto mais forte, pior para a pessoa.
const WEIGHTS = { lord: 1, adverseLord: -0.5, occupant: 0.5, natural: 0.5, occupantNature: 3, fortune: 3, node: 2 };

// Converte a soma de pontos numa escala de 0 a 100.
const toScale = (raw) => Math.round(50 + 50 * Math.tanh(raw / 25));

export function verdict(score) {
  if (score >= 75) return 'Muito favorável';
  if (score >= 58) return 'Favorável';
  if (score > 42) return 'Equilibrada';
  if (score > 25) return 'Desafiadora';
  return 'Muito desafiadora';
}

export function scoreAreas(chart, planetScores) {
  return LIFE_AREAS.map(({ house, area, natural, adverse }) => {
    const parts = [];
    const add = (points, why) => parts.push({ points: Math.round(points * 10) / 10, why });
    const cuspSign = Math.floor(norm(chart.cusps[house - 1]) / 30);
    const lord = DOMICILE[cuspSign];
    const ls = planetScores[lord];
    if (adverse) {
      add(ls.total * WEIGHTS.adverseLord, `${ls.name} rege a casa ${house} (cúspide em ${SIGNS[cuspSign]}) com ${ls.total} pontos; aqui ele representa ${house === 6 ? 'a doença' : 'os inimigos ocultos'}, então força dele pesa contra.`);
    } else {
      add(ls.total * WEIGHTS.lord, `${ls.name} rege a casa ${house} (cúspide em ${SIGNS[cuspSign]}) e tem ${ls.total} pontos de força.`);
    }

    for (const p of PLANETS) {
      if (chart.bodies[p].house !== house) continue;
      const ps = planetScores[p];
      add(ps.total * WEIGHTS.occupant, `${ps.name} está dentro da casa ${house} com ${ps.total} pontos.`);
      if (BENEFICS.includes(p)) add(WEIGHTS.occupantNature, `${ps.name} é um benéfico e traz proteção à casa.`);
      if (MALEFICS.includes(p)) add(-WEIGHTS.occupantNature, `${ps.name} é um maléfico e traz dificuldade à casa.`);
    }
    if (natural && natural !== lord) {
      const ns = planetScores[natural];
      add(ns.total * WEIGHTS.natural, `${ns.name} é o significador natural deste assunto e tem ${ns.total} pontos.`);
    }
    if (chart.bodies.Fortune.house === house) add(WEIGHTS.fortune, 'A Parte da Fortuna está nesta casa.');
    if (chart.bodies.NorthNode.house === house) add(WEIGHTS.node, 'A Cabeça do Dragão aumenta os assuntos desta casa.');
    if (chart.bodies.SouthNode.house === house) add(-WEIGHTS.node, 'A Cauda do Dragão diminui os assuntos desta casa.');

    const raw = parts.reduce((s, x) => s + x.points, 0);
    const score = toScale(raw);
    return { house, area, lord, raw: Math.round(raw * 10) / 10, score, verdict: verdict(score), parts };
  });
}
