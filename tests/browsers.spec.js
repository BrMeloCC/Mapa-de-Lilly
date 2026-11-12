// Abre o app de verdade em cada navegador e confere cálculo, fusos, navegação e layout.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import * as Astronomy from 'astronomy-engine';
import { computeChart, delta } from '../src/engine.js';
import { TZ_CASES } from './tz-cases.mjs';

// Pessoas fictícias, só para teste.
const PEOPLE = [
  { id: 't1', name: 'Helena', relation: 'Eu', date: '1988-08-22', time: '14:10', lat: -23.5505, lon: -46.6333, tz: 'America/Sao_Paulo', place: 'São Paulo' },
  { id: 't2', name: 'Caio', relation: 'Amigo(a)', date: '1979-01-30', time: '06:45', lat: -8.0476, lon: -34.877, tz: 'America/Recife', place: 'Recife' },
  { id: 't3', name: 'Viagem', relation: 'Pergunta', horary: true, question: 'A viagem vai dar certo?', topic: 'viagem', date: '2026-03-04', time: '09:20', lat: -23.5505, lon: -46.6333, tz: 'America/Sao_Paulo', place: 'São Paulo' },
];
// 14:10 em São Paulo em agosto de 1988 (sem horário de verão) = 17:10 UTC.
const HELENA_UTC = new Date('1988-08-22T17:10:00Z');

const BUILDS = {
  offline: 'file://' + fileURLToPath(new URL('../dist/mapa-lilly-offline.html', import.meta.url)),
  online: 'http://127.0.0.1:4173/mapa-lilly.html',
};

const LOCAL_LIBS = [
  ['https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js', 'astronomy-engine/astronomy.browser.min.js'],
  ['https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js', 'd3/dist/d3.min.js'],
  ['https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js', 'topojson-client/dist/topojson-client.min.js'],
];

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' };
function sse(...parts) {
  const ev = (type, data) => `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;
  return ev('message_start', { message: { id: 'msg_teste', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 0 } } })
    + ev('content_block_start', { index: 0, content_block: { type: 'text', text: '' } })
    + parts.map((t) => ev('content_block_delta', { index: 0, delta: { type: 'text_delta', text: t } })).join('')
    + ev('content_block_stop', { index: 0 })
    + ev('message_delta', { delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 12 } })
    + ev('message_stop', {});
}

async function open(page, url, { offline = false } = {}) {
  const errors = [];
  const blocked = [];
  page.on('pageerror', (e) => errors.push(e.message));
  if (offline) {
    // Sem internet: qualquer pedido para fora é recusado. Só as fontes do Google podem faltar (há fontes reservas).
    await page.route(/^https?:\/\//, (route) => {
      const u = route.request().url();
      if (!u.includes('fonts.g')) blocked.push(u);
      return route.abort();
    });
  }
  if (!offline && !process.env.CI) {
    // Fora do CI (ex.: sandbox sem acesso ao CDN) as bibliotecas vêm das cópias locais, mesma versão.
    for (const [cdn, path] of LOCAL_LIBS) await page.route(cdn, (r) => r.fulfill({ path: fileURLToPath(new URL(`../node_modules/${path}`, import.meta.url)), contentType: 'text/javascript' }));
    await page.route(/fonts\.g/, (r) => r.abort());
  }
  await page.addInitScript((people) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('lilly-people', JSON.stringify(people));
    localStorage.setItem('lilly-current', JSON.stringify('t1'));
    localStorage.setItem('lilly-tour', '1');
  }, PEOPLE);
  await page.goto(url);
  await page.waitForFunction(() => window.__lilly?.state()?.chart && document.querySelector('#wheel')?.childElementCount > 0, null, { timeout: 30_000 });
  return { errors, blocked };
}

for (const [build, url] of Object.entries(BUILDS)) {
  const offline = build === 'offline';

  test.describe(`versão ${build}`, () => {
    test('calcula o mapa igual ao Node', async ({ page }) => {
      const { errors, blocked } = await open(page, url, { offline });
      const st = await page.evaluate(() => {
        const s = window.__lilly.state();
        return { name: s.person.name, utc: s.utc.toISOString(), bodies: Object.fromEntries(Object.entries(s.chart.bodies).map(([k, v]) => [k, v.lon])), asc: s.chart.asc, mc: s.chart.mc, cusps: s.chart.cusps };
      });
      expect(st.name).toBe('Helena');
      expect(st.utc).toBe(HELENA_UTC.toISOString());
      const ref = computeChart(Astronomy, HELENA_UTC, -23.5505, -46.6333);
      for (const [k, lon] of Object.entries(ref.bodies)) expect(Math.abs(delta(st.bodies[k], lon.lon)), k).toBeLessThan(0.001);
      expect(Math.abs(delta(st.asc, ref.asc))).toBeLessThan(0.001);
      expect(Math.abs(delta(st.mc, ref.mc))).toBeLessThan(0.001);
      ref.cusps.forEach((c, i) => expect(Math.abs(delta(st.cusps[i], c)), `casa ${i + 1}`).toBeLessThan(0.001));
      expect(errors).toEqual([]);
      expect(blocked).toEqual([]);
    });

    test('fusos e horário de verão históricos', async ({ page }) => {
      await open(page, url, { offline });
      const got = await page.evaluate((cases) => cases.map(([d, t, tz]) => {
        const u = window.__lilly.zonedToUtc(d, t, tz);
        const [y, m, dd] = d.split('-').map(Number); const [h, mi] = t.split(':').map(Number);
        return (Date.UTC(y, m - 1, dd, h, mi) - u.getTime()) / 3600000;
      }), TZ_CASES);
      TZ_CASES.forEach(([d, t, tz, exp], i) => expect(Math.abs(got[i] - exp), `${d} ${t} ${tz}`).toBeLessThan(0.01));
    });

    test('todas as abas abrem sem erro', async ({ page }) => {
      const { errors, blocked } = await open(page, url, { offline });
      for (const sub of ['retrato', 'areas', 'momento', 'planetas', 'leitura']) {
        await page.click(`.subtab[data-p="${sub}"]`);
        await expect(page.locator(`.subtab[data-p="${sub}"]`)).toHaveAttribute('aria-selected', 'true');
      }
      for (const tab of ['#tab-fam', '#tab-cmp', '#tab-dates', '#tab-map']) {
        await page.click(tab);
        await expect(page.locator(tab)).toHaveAttribute('aria-selected', 'true');
      }
      await page.click('#tab-fam');
      await expect(page.locator('.pcard')).toHaveCount(PEOPLE.filter((x) => !x.horary).length);
      await expect(page.getByText('A viagem vai dar certo?')).toBeVisible();
      expect(errors).toEqual([]);
      expect(blocked).toEqual([]);
    });

    test('cabe na tela do celular sem rolar para o lado', async ({ page }) => {
      await page.setViewportSize({ width: 400, height: 860 });
      const { errors } = await open(page, url, { offline });
      const w = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(w).toBeLessThanOrEqual(400);
      expect(errors).toEqual([]);
    });

    if (offline) {
      test('leitura com Claude usa a chave da própria pessoa', async ({ page }) => {
        const { errors } = await open(page, url, { offline });
        let sent = null;
        // Resposta falsa da API, no formato de streaming; nada sai para a internet.
        await page.route('https://api.anthropic.com/**', async (route) => {
          const req = route.request();
          if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
          const h = await req.allHeaders(); sent = { key: h['x-api-key'] || (h.authorization || '').replace(/^Bearer /, ''), browser: h['anthropic-dangerous-direct-browser-access'], body: JSON.parse(req.postData()) };
          await route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'text/event-stream' }, body: sse('Saturno pede paciência. ', 'Marte pede coragem.') });
        });
        await page.click('.subtab[data-p="leitura"]');
        await page.click('#panel-leitura button:has-text("Adicionar chave da API")');
        await page.fill('#api-key', 'sk-ant-teste-0000-abcd');
        await page.click('.key-pref button:has-text("Salvar")');
        await expect(page.locator('.key-pref')).toContainText('abcd');
        await page.keyboard.press('Escape');
        await page.click('#panel-leitura button:has-text("Gerar leitura completa")');
        await expect(page.locator('#panel-leitura')).toContainText('Marte pede coragem.');
        expect(sent.key).toBe('sk-ant-teste-0000-abcd');
        expect(sent.browser).toBe('true');
        expect(sent.body.model).toBe('claude-opus-5-5');
        expect(sent.body.stream).toBe(true);
        expect(errors).toEqual([]);
      });

      test('gerador de PDF embutido carrega sem internet', async ({ page }) => {
        await open(page, url, { offline });
        const ok = await page.evaluate(() => new Promise((res) => {
          const s = document.createElement('script');
          s.src = window.JSPDF_LOCAL;
          s.onload = () => res(typeof window.jspdf?.jsPDF === 'function');
          s.onerror = () => res(false);
          document.head.append(s);
        }));
        expect(ok).toBe(true);
      });
    }
  });
}
