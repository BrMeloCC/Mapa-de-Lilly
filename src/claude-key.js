// Leitura com Claude usando a chave da API da própria pessoa (fora do claude.ai).
// O build empacota este arquivo com o SDK oficial e expõe window.LillyClaude.
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-5-5';

// Mesmo formato do sample() do claude.ai: devolve { text, truncated } e chama onText com o texto inteiro até agora.
async function read(apiKey, prompt, { signal, onText } = {}) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
  let text = '';
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      output_config: { effort: 'medium' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages: [{ role: 'user', content: prompt }],
    }, { signal });
    stream.on('text', (delta) => { text += delta; onText?.({ text, delta }); });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'refusal') throw Object.assign(new Error('refusal'), { code: 'refused', text });
    return { text, truncated: msg.stop_reason === 'max_tokens' };
  } catch (e) {
    if (e.code) throw e;
    if (e instanceof Anthropic.APIUserAbortError) throw Object.assign(new Error('cancelado'), { code: 'cancelled' });
    if (e instanceof Anthropic.AuthenticationError) throw Object.assign(new Error('chave'), { code: 'bad_key', text });
    if (e instanceof Anthropic.PermissionDeniedError) throw Object.assign(new Error('permissão'), { code: 'bad_key', text });
    if (e instanceof Anthropic.RateLimitError) throw Object.assign(new Error('limite'), { code: 'rate_limited', text });
    if (e instanceof Anthropic.APIConnectionError) throw Object.assign(new Error('conexão'), { code: 'offline', text });
    if (e instanceof Anthropic.APIError && /credit|billing|balance/i.test(e.message)) throw Object.assign(new Error('créditos'), { code: 'no_credit', text });
    throw Object.assign(e, { code: 'error', text });
  }
}

window.LillyClaude = { read, model: MODEL };
