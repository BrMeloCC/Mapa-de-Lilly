// Funções práticas: melhores datas (eleição), calendário do ano, retorno solar,
// precisão do horário e glossário. Tudo segue as regras clássicas que Lilly usa.

import { PLANETS, PLANET_NAMES, SIGNS, norm, delta, eclipticLon, computeChart, houseOf } from './engine.js';
import { DOMICILE, scorePlanets, scoreAreas } from './scoring.js';
import { nm, Nm } from './interp.js';
import { transitEvents } from './extras.js';

const BENE = ['Jupiter', 'Venus'], MALE = ['Saturn', 'Mars'];
const EL_ASPECTS = [0, 60, 90, 120, 180];

// ====================== Melhores datas (eleição) ======================
export const ELECTION_GOALS = [
  { key: 'contrato', label: 'Assinar contrato ou fechar negócio', house: 7, sig: 'Mercury', what: 'o acordo' },
  { key: 'trabalho', label: 'Começar emprego ou pedir promoção', house: 10, sig: 'Jupiter', what: 'o trabalho' },
  { key: 'dinheiro', label: 'Compra grande, investimento ou pedir dinheiro', house: 2, sig: 'Jupiter', what: 'o dinheiro' },
  { key: 'amor', label: 'Encontro, pedido ou casamento', house: 7, sig: 'Venus', what: 'a relação' },
  { key: 'viagem', label: 'Viagem longa ou começar um curso', house: 9, sig: 'Mercury', what: 'a viagem' },
  { key: 'casa', label: 'Mudança, compra ou reforma de imóvel', house: 4, sig: 'Moon', what: 'a casa' },
  { key: 'projeto', label: 'Lançar um projeto ou abrir uma empresa', house: 10, sig: 'Sun', what: 'o projeto' },
  { key: 'saude', label: 'Consulta, tratamento ou procedimento', house: 6, sig: 'Moon', what: 'a saúde' },
];

// Próximo aspecto que a Lua faz antes de mudar de signo (null = Lua fora de curso).
export function moonNextAspect(chart) {
  const m = chart.bodies.Moon, vm = m.speed;
  const left = 30 - (norm(m.lon) % 30), tMax = left / vm;
  let best = null;
  for (const p of PLANETS) {
    if (p === 'Moon') continue;
    const b = chart.bodies[p];
    for (const ang of EL_ASPECTS) for (const side of ang === 0 || ang === 180 ? [1] : [1, -1]) {
      const g = (t) => delta(m.lon + vm * t, b.lon + b.speed * t + side * ang);
      const g0 = g(0), g1 = g(tMax);
      if (Math.abs(g0) > 40) continue;
      if (g0 < 0 && g1 >= 0) {
        const t = (-g0 / (g1 - g0)) * tMax;
        if (!best || t < best.t) best = { p, angle: ang, t };
      }
    }
  }
  return best;
}

export function scoreElection(chart, natal, goal) {
  const ps = scorePlanets(chart), B = chart.bodies;
  const plus = [], minus = [];
  const add = (pts, txt) => (pts > 0 ? plus : pts < 0 ? minus : plus).push({ pts, txt });
  const ascSign = Math.floor(norm(chart.asc) / 30), ascDeg = norm(chart.asc) % 30;
  const ascLord = DOMICILE[ascSign];
  const goalLord = DOMICILE[Math.floor(norm(chart.cusps[goal.house - 1]) / 30)];
  const moon = B.Moon, elong = norm(moon.lon - B.Sun.lon);

  // A Lua é a principal significadora de qualquer começo.
  if (elong < 180) add(2, 'Lua crescente: o assunto tende a crescer.'); else add(-1, 'Lua minguante: o assunto perde força com o tempo.');
  const next = moonNextAspect(chart);
  if (!next) add(-5, 'Lua fora de curso: segundo Lilly, o que começa assim não vai adiante.');
  else if (BENE.includes(next.p) && next.angle !== 90 && next.angle !== 180) add(4, `A Lua vai ao encontro de ${nm(next.p)}, um benéfico.`);
  else if (BENE.includes(next.p)) add(1, `A Lua vai a ${nm(next.p)}, benéfico, mas por um aspecto tenso.`);
  else if (MALE.includes(next.p) && [0, 90, 180].includes(next.angle)) add(-4, `A Lua vai direto a ${nm(next.p)} por aspecto tenso: atrito ou atraso.`);
  else if (next.p === goal.sig || next.p === goalLord) add(3, `A Lua vai ao encontro de ${nm(next.p)}, que representa o assunto.`);
  const ml = norm(moon.lon);
  if (ml >= 195 && ml <= 225) add(-3, 'Lua na via combusta (meio de Libra a meio de Escorpião): trecho perturbado.');
  if (moon.solar === 'combusto') add(-4, 'Lua colada ao Sol (combusta): sem luz para o assunto.');
  if ([6, 8, 12].includes(moon.house)) add(-2, `Lua na casa ${moon.house}, uma casa fraca para começos.`);
  if (ps.Moon.essentialTotal >= 4) add(2, 'A Lua está bem colocada no signo.');
  else if (ps.Moon.essentialTotal <= -4) add(-2, 'A Lua está desconfortável no signo.');

  // Ascendente e seu regente: a própria pessoa e o começo.
  if (ascDeg < 3 || ascDeg > 27) add(-2, 'Ascendente no começo ou no fim do signo: momento instável.');
  const al = ps[ascLord];
  if (al.total >= 8) add(3, `${Nm(ascLord)}, regente do Ascendente, está forte: você entra em boa posição.`);
  else if (al.total <= -4) add(-3, `${Nm(ascLord)}, regente do Ascendente, está fraco: você entra em desvantagem.`);
  if ([6, 8, 12].includes(B[ascLord].house)) add(-2, `${Nm(ascLord)}, regente do Ascendente, está na casa ${B[ascLord].house}.`);

  // O assunto: regente da casa e significador natural.
  const gl = ps[goalLord];
  if (gl.total >= 8) add(3, `${Nm(goalLord)}, regente da casa ${goal.house}, está forte: ${goal.what} tem apoio.`);
  else if (gl.total <= -4) add(-3, `${Nm(goalLord)}, regente da casa ${goal.house}, está fraco: ${goal.what} fica frágil.`);
  if (goal.sig !== 'Moon' && goal.sig !== 'Sun') {
    if (B[goal.sig].retrograde) add(-4, `${Nm(goal.sig)} retrógrado: revisões, voltas e desistências.`);
    if (B[goal.sig].solar === 'combusto') add(-2, `${Nm(goal.sig)} combusto: o assunto fica escondido ou sem força.`);
    if (ps[goal.sig].total >= 8 && goal.sig !== goalLord) add(2, `${Nm(goal.sig)}, que rege o assunto por natureza, está forte.`);
  }

  // Benéficos e maléficos nos ângulos.
  for (const p of BENE) if ([1, 10, 7].includes(B[p].house)) add(2, `${Nm(p)} na casa ${B[p].house}: proteção no ponto mais visível.`);
  for (const p of MALE) if ([1, 10, 7].includes(B[p].house) && ps[p].essentialTotal < 4) add(-3, `${Nm(p)} na casa ${B[p].house}, sem dignidade: obstáculos.`);

  // Concordância com o mapa natal, como Lilly recomenda.
  if (natal) {
    const nAsc = Math.floor(norm(natal.asc) / 30);
    const d = (ascSign - nAsc + 12) % 12;
    if (d === 0 || d === 4 || d === 8) add(2, 'O Ascendente do momento combina com o seu Ascendente.');
    if (d === 7 || d === 11) add(-1, 'O Ascendente do momento cai numa casa difícil do seu mapa.');
    const mm = Math.abs(delta(moon.lon, natal.bodies.Moon.lon)), ms = Math.abs(delta(moon.lon, natal.bodies.Sun.lon));
    if ([60, 120].some((a) => Math.abs(mm - a) < 6 || Math.abs(ms - a) < 6)) add(1, 'A Lua do momento faz harmonia com a sua Lua ou o seu Sol.');
  }
  const total = [...plus, ...minus].reduce((s, x) => s + x.pts, 0);
  return { total, plus: plus.filter((x) => x.pts > 0).sort((a, b) => b.pts - a.pts), minus: minus.sort((a, b) => a.pts - b.pts), next, ascSign, ascLord, goalLord };
}

/**
 * Procura os melhores momentos nos próximos dias, de hora em hora, só entre 7h e 22h no horário local.
 * local(date) devolve { hour, day } no horário do lugar.
 */
export function findElections(A, natal, goal, from, days, lat, lon, local) {
  const start = new Date(Math.ceil(from.getTime() / 3600000) * 3600000);
  const byDay = new Map();
  for (let h = 0; h < days * 24; h++) {
    const d = new Date(start.getTime() + h * 3600000);
    const { hour: lh, day } = local(d);
    if (lh < 7 || lh > 22) continue;
    const chart = computeChart(A, d, lat, lon);
    const c = { date: d, chart, ...scoreElection(chart, natal, goal) };
    const dayKey = day;
    const cur = byDay.get(dayKey);
    if (!cur || c.total > cur.total) byDay.set(dayKey, c);
  }
  const all = [...byDay.values()];
  const best = [...all].sort((a, b) => b.total - a.total).slice(0, 5).sort((a, b) => a.date - b.date);
  const avoid = [...all].sort((a, b) => a.total - b.total).slice(0, 3).filter((c) => c.total < 0).sort((a, b) => a.date - b.date);
  return { best, avoid, all };
}

// ====================== Calendário do ano ======================
export function yearCalendar(A, natal, from) {
  return transitEvents(A, natal, from, 366).filter((e) => e.tr === 'Jupiter' || e.tr === 'Saturn');
}

// ====================== Retorno solar ======================
export function solarReturnTime(A, natal, year) {
  const target = natal.bodies.Sun.lon, nd = natal.date;
  let t = new Date(Date.UTC(year, nd.getUTCMonth(), nd.getUTCDate(), nd.getUTCHours(), nd.getUTCMinutes()));
  for (let i = 0; i < 8; i++) {
    const d = delta(eclipticLon(A, 'Sun', A.MakeTime(t)), target);
    t = new Date(t.getTime() - (d / 0.98565) * 86400000);
    if (Math.abs(d) < 1e-6) break;
  }
  return t;
}
export function solarReturn(A, natal, year, lat, lon) {
  const date = solarReturnTime(A, natal, year);
  const chart = computeChart(A, date, lat, lon);
  const ps = scorePlanets(chart);
  const areas = scoreAreas(chart, ps);
  const ascSign = Math.floor(norm(chart.asc) / 30);
  return {
    date, chart, ps, areas, ascSign,
    natalHouseOfAsc: houseOf(chart.asc, natal.cusps),
    angular: PLANETS.filter((p) => [1, 4, 7, 10].includes(chart.bodies[p].house)),
    lord: DOMICILE[ascSign],
  };
}

// ====================== Precisão do horário ======================
// Quanto o mapa muda se a hora estiver alguns minutos errada.
export function timeSensitivity(A, date, lat, lon) {
  const base = computeChart(A, date, lat, lon);
  const rows = [-60, -30, -15, 15, 30, 60].map((m) => {
    const c = computeChart(A, new Date(date.getTime() + m * 60000), lat, lon);
    const moved = PLANETS.filter((p) => c.bodies[p].house !== base.bodies[p].house).map((p) => ({ p, from: base.bodies[p].house, to: c.bodies[p].house }));
    return { min: m, asc: c.asc, ascSign: Math.floor(norm(c.asc) / 30), mc: c.mc, moved };
  });
  const signNow = Math.floor(norm(base.asc) / 30);
  const until = (dir) => {
    let lo = 0, hi = null;
    for (let m = 4; m <= 360; m += 4) {
      const c = computeChart(A, new Date(date.getTime() + dir * m * 60000), lat, lon);
      if (Math.floor(norm(c.asc) / 30) !== signNow) { hi = m; break; }
      lo = m;
    }
    if (hi == null) return null;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1, c = computeChart(A, new Date(date.getTime() + dir * mid * 60000), lat, lon);
      if (Math.floor(norm(c.asc) / 30) !== signNow) hi = mid; else lo = mid;
    }
    return hi;
  };
  return { base, rows, before: until(-1), after: until(1) };
}
// Sem hora: onde cada planeta pode estar ao longo do dia.
export function dayRange(A, dayStart, dayEnd) {
  const out = {};
  for (const p of PLANETS) {
    const a = eclipticLon(A, p, A.MakeTime(dayStart)), b = eclipticLon(A, p, A.MakeTime(dayEnd));
    out[p] = { from: a, to: b, signFrom: Math.floor(norm(a) / 30), signTo: Math.floor(norm(b) / 30) };
  }
  return out;
}

// ====================== Glossário ======================
export const GLOSS_TERMS = {
  'Ascendente': 'O signo que nascia no horizonte leste na hora do nascimento. Mostra o corpo, o jeito de se apresentar e a casa 1.',
  'precessão': 'O lento giro do eixo da Terra. Por causa dele, os signos que Lilly usava (contados a partir do equinócio) estão hoje uns 24° à frente das constelações de mesmo nome. O céu de fundo acende a constelação com o nome do signo.',
  'Meio do Céu': 'O ponto mais alto do céu no momento do mapa. Fala de carreira, reputação e vida pública.',
  'regente': 'O planeta que "manda" num signo. Quem rege o signo de uma casa administra os assuntos daquela casa.',
  'conjunção': 'Dois planetas juntos no mesmo ponto do céu: as forças se misturam.',
  'sextil': 'Planetas a 60° um do outro: uma oportunidade que pede iniciativa.',
  'quadratura': 'Planetas a 90°: tensão e atrito que obrigam a agir.',
  'trígono': 'Planetas a 120°: harmonia e facilidade.',
  'oposição': 'Planetas em lados opostos do céu (180°): conflito, negociação ou atração entre polos.',
  'retrógrado': 'Quando o planeta parece andar para trás no céu. Para Lilly, indica atraso, volta atrás ou ação contrária.',
  'combusto': 'Planeta muito perto do Sol (até 8°30\'), ofuscado pela luz dele. Fica sem força.',
  'cazimi': 'Planeta colado ao centro do Sol (até 17\'). Ao contrário da combustão, é uma posição de enorme força.',
  'domicílio': 'O signo que o planeta rege. Ali ele está "em casa" e age com força total.',
  'exaltação': 'O signo onde o planeta é honrado como convidado especial. Força grande, mas um pouco exagerada.',
  'exílio': 'O signo oposto ao domicílio. O planeta está "fora de casa" e age com dificuldade.',
  'queda': 'O signo oposto à exaltação. O planeta perde dignidade e é mal recebido.',
  'triplicidade': 'Dignidade que o planeta ganha por reger o elemento do signo (fogo, terra, ar ou água).',
  'peregrino': 'Planeta sem nenhuma dignidade no lugar onde está: age sem rumo e depende dos outros.',
  'recepção': 'Quando um planeta está no signo de outro: um "hospeda" o outro, o que facilita a ajuda entre eles.',
  'profecção': 'Técnica que avança o Ascendente um signo por ano de vida para mostrar o tema de cada ano.',
  'retorno solar': 'O momento exato em que o Sol volta ao ponto onde estava no seu nascimento. O mapa desse instante descreve o ano.',
  'via combusta': 'Trecho do zodíaco entre 15° de Libra e 15° de Escorpião, que Lilly via como perturbado para a Lua.',
  'fora de curso': 'Quando a Lua não faz mais nenhum aspecto antes de mudar de signo. Para Lilly, "nada acontece".',
  'Parte da Fortuna': 'Ponto calculado com Ascendente, Lua e Sol. Mostra onde estão sorte material e bem-estar.',
  'Nodo Norte': 'Ponto onde a órbita da Lua cruza a do Sol subindo. Lilly o tratava como algo que aumenta e favorece.',
  'Nodo Sul': 'O ponto oposto ao Nodo Norte. Lilly o tratava como algo que diminui e atrapalha.',
  'temperamento': 'A mistura de quente, frio, seco e úmido que, na medicina antiga, definia o jeito de ser.',
  'benéfico': 'Júpiter e Vênus: planetas que, por natureza, ajudam e protegem.',
  'maléfico': 'Saturno e Marte: planetas que, por natureza, cobram, atrasam ou ferem.',
  'angular': 'As casas 1, 4, 7 e 10. Planetas nelas agem com força e visibilidade.',
  'cadente': 'As casas 3, 6, 9 e 12. Planetas nelas ficam com menos força.',
  'órbita': 'A distância, em graus, dentro da qual um aspecto ainda vale.',
  'trânsito': 'A posição de um planeta hoje (ou numa data) em relação ao seu mapa de nascimento.',
  'translação': 'Quando um planeta rápido leva a luz de um planeta a outro que não se encontram sozinhos.',
  'coleção': 'Quando um planeta lento recebe a luz de dois outros que não se encontram entre si.',
  'proibição': 'Quando um terceiro planeta chega antes e impede que dois outros se encontrem.',
  'significador': 'O planeta que representa uma pessoa ou um assunto no mapa.',
};
