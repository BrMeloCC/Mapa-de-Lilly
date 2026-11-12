# Mapa de Lilly

Mapa astral pelo método de William Lilly (*Christian Astrology*, 1647), em português e com linguagem simples. Calcula o mapa com casas Regiomontanus, pontua as dignidades essenciais e acidentais pela tabela clássica de Lilly e transforma isso em leituras por área da vida.

O que tem no app:

- **Mapa**: roda interativa (arraste para girar o céu e mudar a hora), retrato, áreas da vida, planetas com as fontes de Lilly e leitura completa.
- **Tempo**: profecções, trânsitos, retorno solar, linha da vida e calendário com anotações.
- **Família e amigos**: pessoas salvas, busca, cópia de segurança em JSON.
- **Comparar**: sinastria e áreas da vida a dois.
- **Datas**: escolha de datas (eleição) e perguntas horárias.
- **Ver o céu**: o céu real do momento, com constelações e planetas.

## Como usar

**Pelo navegador:** com o repositório público e o GitHub Pages ligado (Settings → Pages → Source: GitHub Actions), cada envio publica o app em `https://brmelocc.github.io/Mapa-de-Lilly/`. Os links de compartilhar mapa passam a apontar para esse endereço.

**Sem instalar nada:** baixe `mapa-lilly-offline.html` na aba *Actions* do GitHub (última execução de *Testes*, item *mapa-de-lilly*) e abra com dois cliques. Os cálculos funcionam sem internet; só as fontes tipográficas caem para as do sistema quando não há conexão.

**Leitura com Claude fora do claude.ai:** cada pessoa usa a própria chave da API da Anthropic. Crie uma em [console.anthropic.com](https://console.anthropic.com/settings/keys) e cole em *Preferências → Leitura com Claude*. A chave fica guardada só naquele navegador e vai direto para a Anthropic; o uso é cobrado na conta de quem colou. Sem chave, todo o resto do app funciona normalmente.

**No claude.ai:** a versão `dist/mapa-lilly.html` é a publicada como Artifact. Lá ela guarda as pessoas na sua conta e a leitura com Claude usa a própria conta do claude.ai, sem chave. Fora do claude.ai, as pessoas ficam guardadas só no navegador em que você abriu.

**A partir do código:**

```bash
npm ci
npm run build      # gera dist/mapa-lilly.html e dist/mapa-lilly-offline.html
```

## Testes

```bash
npm run test:calc                       # precisão e fusos, só Node
npx playwright install                  # uma vez: baixa Chromium, Firefox e WebKit
npm run build && npm run test:browsers  # abre o app de verdade nos três navegadores
```

- `tests/accuracy.mjs` compara Sol, Lua, planetas, Ascendente, Meio do Céu e cúspides com uma referência independente (VSOP87 e ELP, Meeus). Falha se algo passar de 1 minuto de arco; hoje o maior desvio é 0,4'.
- `tests/timezones.mjs` confere o horário de verão histórico do Brasil (1950, 1985, 1989-90, 2018, o fim em 2019) e a hora média local de antes de 1914.
- `tests/browsers.spec.js` abre as duas versões em cada navegador, confere que o mapa calculado na página bate com o do Node, repete os fusos dentro do navegador, passa por todas as abas e mede se a tela de celular rola para o lado. A versão offline roda com a internet bloqueada, e a leitura com chave é testada contra uma resposta simulada da API.

O GitHub Actions roda tudo isso em Linux, Windows e macOS a cada envio.

## Estrutura

```
src/          código do app (motor, pontuação, interpretação, céu) e a página
vendor/       mapa-múndi e tabela de fusos embutidos
build.mjs     junta tudo em dist/
tests/        testes de cálculo, fusos e navegadores
```

Bibliotecas: [astronomy-engine](https://github.com/cosinekitty/astronomy) para as posições, d3 e topojson para o mapa-múndi, jsPDF para exportar em PDF.
