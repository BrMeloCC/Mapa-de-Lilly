// Leitura com IA usando a chave da própria pessoa (fora do claude.ai).
// O build empacota este arquivo e expõe window.LillyAI. A chave nunca sai do navegador,
// a não ser para o provedor escolhido.
import Anthropic from '@anthropic-ai/sdk';

// `match` reconhece o provedor pelo começo da chave; `base` é o endereço no formato da OpenAI.
const PROVIDERS = {
  anthropic: { name: 'Anthropic (Claude)', short: 'Claude', match: /^sk-ant-/, model: 'claude-opus-5-5', keys: 'https://console.anthropic.com/settings/keys' },
  openai: { name: 'OpenAI (ChatGPT)', short: 'ChatGPT', match: /^sk-(?!ant-|or-)/, base: 'https://api.openai.com/v1', model: 'gpt-5', keys: 'https://platform.openai.com/api-keys' },
  gemini: { name: 'Google (Gemini)', short: 'Gemini', match: /^AIza/, model: 'gemini-pro-latest', keys: 'https://aistudio.google.com/apikey' },
  openrouter: { name: 'OpenRouter', short: 'IA', match: /^sk-or-/, base: 'https://openrouter.ai/api/v1', model: 'openrouter/auto', keys: 'https://openrouter.ai/keys' },
  custom: { name: 'Outro (compatível com OpenAI)', short: 'IA', model: '' },
};

const fail = (code, text, extra) => Object.assign(new Error(code), { code, text }, extra);
const detect = (key) => Object.keys(PROVIDERS).find((id) => PROVIDERS[id].match?.test(key)) || null;
const baseOf = (cfg) => (cfg.provider === 'custom' ? cfg.base : PROVIDERS[cfg.provider].base || '').replace(/\/+$/, '');

// Lê uma resposta em streaming (SSE) e entrega cada bloco "data:" já convertido de JSON.
async function sse(res, onData) {
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    buf += dec.decode(value || new Uint8Array(), { stream: !done });
    const lines = buf.split(/\r?\n/); buf = done ? '' : lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const d = line.slice(5).trim();
      if (!d || d === '[DONE]') continue;
      try { onData(JSON.parse(d)); } catch (e) { if (e.code) throw e; }
    }
    if (done) return;
  }
}

async function httpFail(res, text) {
  let body = ''; try { body = await res.text(); } catch (e) {}
  const s = res.status;
  if (/insufficient_quota|billing|credit|balance/i.test(body) || s === 402) return fail('no_credit', text);
  if (s === 401 || s === 403 || (s === 400 && /api.?key/i.test(body))) return fail('bad_key', text);
  if (s === 404 || (s === 400 && /model/i.test(body))) return fail('bad_model', text);
  if (s === 429) return fail('rate_limited', text);
  return fail('error', text);
}

async function call(url, init, text) {
  try { return await fetch(url, init); }
  catch (e) { throw e.name === 'AbortError' ? fail('cancelled') : fail('offline', text); }
}

async function readAnthropic(cfg, prompt, { signal, onText }) {
  const client = new Anthropic({ apiKey: cfg.key, dangerouslyAllowBrowser: true, maxRetries: 2 });
  const custom = cfg.model && cfg.model !== PROVIDERS.anthropic.model;
  let text = '';
  try {
    const stream = client.beta.messages.stream({
      model: cfg.model || PROVIDERS.anthropic.model,
      max_tokens: 64000,
      messages: [{ role: 'user', content: prompt }],
      // Ajustes do modelo padrão; um modelo escolhido à mão pode não aceitar todos.
      ...(custom ? {} : { output_config: { effort: 'medium' }, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }),
    }, { signal });
    stream.on('text', (delta) => { text += delta; onText?.({ text, delta }); });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'refusal') throw fail('refused', text);
    return { text, truncated: msg.stop_reason === 'max_tokens' };
  } catch (e) {
    if (e.code) throw e;
    if (e instanceof Anthropic.APIUserAbortError) throw fail('cancelled');
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw fail('bad_key', text);
    if (e instanceof Anthropic.NotFoundError) throw fail('bad_model', text);
    if (e instanceof Anthropic.RateLimitError) throw fail('rate_limited', text);
    if (e instanceof Anthropic.APIConnectionError) throw fail('offline', text);
    if (e instanceof Anthropic.APIError && /credit|billing|balance/i.test(e.message)) throw fail('no_credit', text);
    throw fail('error', text);
  }
}

// OpenAI, OpenRouter e qualquer serviço que fale o mesmo formato (Groq, Mistral, Ollama, LM Studio…).
async function readOpenAI(cfg, prompt, { signal, onText }) {
  let text = '', truncated = false;
  const res = await call(`${baseOf(cfg)}/chat/completions`, {
    method: 'POST', signal,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({ model: cfg.model, stream: true, messages: [{ role: 'user', content: prompt }] }),
  }, text);
  if (!res.ok) throw await httpFail(res, text);
  try {
    await sse(res, (d) => {
      if (d.error) throw fail('error', text);
      const c = d.choices?.[0]; if (!c) return;
      const delta = c.delta?.content;
      if (typeof delta === 'string' && delta) { text += delta; onText?.({ text, delta }); }
      if (c.finish_reason === 'length') truncated = true;
      if (c.finish_reason === 'content_filter') throw fail('refused', text);
    });
  } catch (e) { throw e.code ? e : e.name === 'AbortError' ? fail('cancelled') : fail('offline', text); }
  return { text, truncated };
}

async function readGemini(cfg, prompt, { signal, onText }) {
  let text = '', truncated = false;
  const res = await call(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:streamGenerateContent?alt=sse`, {
    method: 'POST', signal,
    headers: { 'content-type': 'application/json', 'x-goog-api-key': cfg.key },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
  }, text);
  if (!res.ok) throw await httpFail(res, text);
  try {
    await sse(res, (d) => {
      if (d.promptFeedback?.blockReason) throw fail('refused', text);
      const c = d.candidates?.[0]; if (!c) return;
      const delta = (c.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
      if (delta) { text += delta; onText?.({ text, delta }); }
      if (c.finishReason === 'MAX_TOKENS') truncated = true;
      if (['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST'].includes(c.finishReason)) throw fail('refused', text);
    });
  } catch (e) { throw e.code ? e : e.name === 'AbortError' ? fail('cancelled') : fail('offline', text); }
  return { text, truncated };
}

// Mesmo contrato do sample() do claude.ai: devolve { text, truncated } e chama onText com o texto inteiro até agora.
function read(cfg, prompt, opts = {}) {
  cfg = { ...cfg, model: cfg.model || PROVIDERS[cfg.provider].model };
  if (cfg.provider === 'anthropic') return readAnthropic(cfg, prompt, opts);
  if (cfg.provider === 'gemini') return readGemini(cfg, prompt, opts);
  return readOpenAI(cfg, prompt, opts);
}

// Modelos que a chave enxerga, para sugerir no campo. Falhar aqui não impede nada.
async function models(cfg) {
  try {
    if (cfg.provider === 'anthropic') {
      const client = new Anthropic({ apiKey: cfg.key, dangerouslyAllowBrowser: true, maxRetries: 0 });
      const out = []; for await (const m of client.models.list()) { out.push(m.id); if (out.length >= 60) break; }
      return out;
    }
    if (cfg.provider === 'gemini') {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': cfg.key } });
      const j = await r.json();
      return (j.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => m.name.replace(/^models\//, ''));
    }
    const r = await fetch(`${baseOf(cfg)}/models`, { headers: { authorization: `Bearer ${cfg.key}` } });
    const j = await r.json();
    return (j.data || []).map((m) => m.id).sort();
  } catch (e) { return []; }
}

window.LillyAI = { PROVIDERS, detect, read, models };
