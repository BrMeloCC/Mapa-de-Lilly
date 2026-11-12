// Confere o horário de verão histórico do Brasil e outros fusos pela base de fusos do sistema (Intl).
// As mesmas contas rodam dentro de cada navegador em tests/browsers.spec.js.
function tzOffset(ms, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - ms;
}
function zonedToUtc(dateStr, timeStr, tz) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);
  const local = Date.UTC(y, mo - 1, d, h, mi);
  let g = local;
  for (let i = 0; i < 3; i++) g = local - tzOffset(g, tz);
  return new Date(g);
}
import { TZ_CASES as T } from './tz-cases.mjs';
let fails = 0;
for (const [d,t,tz,exp] of T) { const u = zonedToUtc(d,t,tz); const [y,m,dd]=d.split('-').map(Number); const [h,mi]=t.split(':').map(Number); const off = (Date.UTC(y,m-1,dd,h,mi) - u.getTime())/3600000; console.log(d,t,tz.padEnd(18), 'offset', off.toFixed(3), 'esperado', exp.toFixed(3), Math.abs(off-exp)<0.01?'OK':'DIFERENTE'); if (Math.abs(off-exp)>=0.01) fails++; }
if (fails) { console.error(fails, 'caso(s) com fuso errado'); process.exit(1); }
