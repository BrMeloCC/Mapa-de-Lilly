// Textos de interpretação em linguagem simples, construídos a partir dos cálculos de engine.js e scoring.js.

import { PLANETS, PLANET_NAMES, SIGNS, norm } from './engine.js';
import { DOMICILE } from './scoring.js';

export const PLANET_THEME = {
  Sun: 'sua identidade, sua vitalidade e a vontade de ser reconhecido',
  Moon: 'suas emoções, seu corpo, seus hábitos e o que te dá segurança',
  Mercury: 'seu jeito de pensar, falar, aprender e negociar',
  Venus: 'seu jeito de amar, de sentir prazer e de se relacionar',
  Mars: 'sua energia, sua coragem e o modo como você enfrenta conflitos',
  Jupiter: 'sua fé, sua generosidade e sua capacidade de crescer e ter sorte',
  Saturn: 'seu senso de dever, seus limites, seus medos e sua paciência',
};
export const PLANET_KEY = {
  Sun: 'sua identidade', Moon: 'suas emoções', Mercury: 'sua mente', Venus: 'seu afeto',
  Mars: 'sua ação', Jupiter: 'sua expansão', Saturn: 'sua disciplina',
};

export const SIGN_STYLE = [
  'de forma direta, rápida e impulsiva, com coragem e pouca paciência',
  'de forma estável, prática e sensorial, buscando segurança e conforto',
  'de forma curiosa, versátil e falante, mudando de foco com facilidade',
  'de forma emotiva e protetora, muito ligada à família e às memórias',
  'de forma generosa, orgulhosa e visível, buscando reconhecimento',
  'de forma analítica, cuidadosa e útil, com olhar crítico para detalhes',
  'de forma diplomática e sociável, buscando harmonia e parceria',
  'de forma intensa, reservada e profunda, com muita força de vontade',
  'de forma otimista e aventureira, guiada por ideais e crenças',
  'de forma séria, ambiciosa e disciplinada, mirando o longo prazo',
  'de forma independente e original, voltada a grupos e ideias novas',
  'de forma sensível, intuitiva e compassiva, às vezes um pouco difusa',
];

export const ASC_PORTRAIT = [
  'Você tende a se mostrar ao mundo com energia e iniciativa. Age antes de pensar, gosta de começar coisas e não tolera ficar parado. A franqueza é sua marca, e a impaciência também.',
  'Você passa uma imagem calma, firme e confiável. Gosta de conforto, de coisas bonitas e de ter o controle do próprio ritmo. Demora a mudar de ideia, mas quando decide, vai até o fim.',
  'Você chega nos lugares conversando. É curioso, rápido de raciocínio e se adapta bem a pessoas diferentes. O risco é se espalhar em muitas direções e terminar pouca coisa.',
  'Você se apresenta de forma acolhedora e sensível ao ambiente. Sente o clima das pessoas antes que elas falem e se protege quando se sente inseguro. Família e casa pesam muito na sua identidade.',
  'Você tem presença. As pessoas notam quando você entra. Gosta de ser apreciado, é leal e generoso, e se ofende quando não recebe o respeito que acha que merece.',
  'Você passa uma imagem discreta, organizada e competente. Repara nos detalhes, gosta de ser útil e costuma ser exigente consigo mesmo. A crítica, sua e dos outros, te afeta bastante.',
  'Você se mostra simpático, educado e conciliador. Busca equilíbrio e beleza, gosta de estar acompanhado e evita brigas. Às vezes demora a decidir para não desagradar ninguém.',
  'Você é reservado e intenso. Observa muito antes de se abrir, tem opiniões fortes e não esquece facilmente nem o bem nem o mal que te fazem. As pessoas sentem sua força mesmo quando você está quieto.',
  'Você se apresenta de forma aberta, alegre e direta. Gosta de liberdade, de aprender e de viajar, e tem uma fé natural de que as coisas vão dar certo. Pode prometer mais do que consegue cumprir.',
  'Você passa seriedade e responsabilidade, às vezes parecendo mais velho do que é. Trabalha com paciência para alcançar posição e segurança. Costuma se abrir devagar e confiar só depois de provas.',
  'Você se mostra diferente, independente e um pouco imprevisível. Valoriza amizades e causas coletivas, pensa à frente do seu tempo e não gosta de ser mandado.',
  'Você se apresenta de forma gentil, sonhadora e empática. Absorve as emoções do ambiente, tem imaginação e intuição fortes e às vezes precisa se proteger para não se perder nos problemas dos outros.',
];

// Para onde o regente de uma casa "leva" o assunto, segundo a casa em que ele está.
export const HOUSE_VIA = {
  1: 'você mesmo: depende muito da sua iniciativa e da sua postura pessoal',
  2: 'dinheiro e bens: está ligado ao que você ganha e possui',
  3: 'irmãos, vizinhos, estudos básicos, comunicação e deslocamentos curtos',
  4: 'família, lar e imóveis: tem raízes no ambiente de casa',
  5: 'filhos, prazer, romance e criatividade',
  6: 'trabalho do dia a dia, rotina e saúde: vem com esforço e serviço',
  7: 'parcerias, casamento e outras pessoas: acontece por meio dos outros',
  8: 'dinheiro de terceiros, heranças, crises e transformações profundas',
  9: 'estudos superiores, viagens longas, fé e coisas estrangeiras',
  10: 'carreira, status e vida pública',
  11: 'amigos, grupos, protetores e projetos de futuro',
  12: 'bastidores e isolamento: tende a ser discreto, escondido ou trabalhoso',
};

// Guia de cada área: o que a casa cobre e leituras para nível alto, médio e baixo.
export const AREA_GUIDE = {
  1: {
    covers: 'Sua vitalidade, sua aparência, seu temperamento e a forma como você conduz a própria vida.',
    high: { gist: 'Você tem boa energia vital e facilidade para se posicionar.', practice: ['Costuma se recuperar bem de cansaço e reveses.', 'As pessoas tendem a confiar na sua imagem.', 'Iniciativas pessoais costumam dar resultado.'], advice: 'Use essa base firme para assumir projetos próprios. Seu maior risco é se apoiar demais nela e descuidar do corpo.' },
    mid: { gist: 'Sua energia e autoconfiança oscilam conforme a fase da vida.', practice: ['Há períodos de muita disposição e outros de baixa.', 'Você se sai melhor quando tem rotina e propósito claros.', 'A opinião dos outros pesa na sua autoimagem.'], advice: 'Rotina de sono, alimentação e movimento faz uma diferença visível para você.' },
    low: { gist: 'Você precisa de mais esforço para sustentar energia e confiança.', practice: ['Tende a duvidar de si antes de agir.', 'O corpo pede mais cuidado e atenção a sinais de cansaço.', 'Pode sentir que a vida exige mais de você do que dos outros.'], advice: 'Construa confiança com pequenas vitórias seguidas. Cuidar da saúde de forma preventiva é prioridade.' },
  },
  2: {
    covers: 'Dinheiro, salário, bens, recursos materiais e a sua relação com segurança financeira.',
    high: { gist: 'O dinheiro tende a vir e a se manter com relativa facilidade.', practice: ['Você costuma ter recursos quando precisa.', 'Investimentos e compras tendem a ser bem feitos.', 'Há boa chance de acumular patrimônio ao longo do tempo.'], advice: 'Defina metas claras para o que sobra. A facilidade pode levar a gastos sem critério.' },
    mid: { gist: 'As finanças funcionam, mas dependem de organização e disciplina.', practice: ['Há fases de entrada boa alternadas com apertos.', 'Ganhos chegam mais por constância do que por sorte.', 'Vale ter reserva para imprevistos.'], advice: 'Um orçamento simples e uma reserva de emergência transformam essa área.' },
    low: { gist: 'Dinheiro é uma área que pede atenção e estratégia.', practice: ['Ganhos podem ser irregulares ou demorar a chegar.', 'Gastos ou dívidas tendem a escapar do controle.', 'Pode haver insegurança mesmo quando há recursos.'], advice: 'Evite riscos e dívidas longas. Pequenos hábitos de poupança, mantidos por anos, são seu melhor caminho.' },
  },
  3: {
    covers: 'Irmãos, primos, vizinhos, comunicação do dia a dia, estudos básicos e viagens curtas.',
    high: { gist: 'Você se comunica bem e tem bom apoio do círculo próximo.', practice: ['Relação com irmãos e vizinhos tende a ser boa.', 'Aprende rápido e se expressa com clareza.', 'Pequenas viagens costumam trazer coisas boas.'], advice: 'Escrever, ensinar ou vender são talentos a explorar.' },
    mid: { gist: 'A comunicação e o círculo próximo têm altos e baixos.', practice: ['Relação com irmãos pode alternar proximidade e distância.', 'Você aprende melhor quando o assunto te interessa de verdade.', 'Mal-entendidos acontecem, mas se resolvem.'], advice: 'Confirmar por escrito o que foi combinado evita boa parte dos problemas.' },
    low: { gist: 'Comunicação e relações próximas pedem cuidado.', practice: ['Pode haver distância ou atritos com irmãos ou vizinhos.', 'Mal-entendidos e notícias ruins tendem a pesar.', 'Estudos básicos podem ter exigido mais esforço.'], advice: 'Pense antes de responder em momentos tensos. Paciência com o círculo próximo rende muito.' },
  },
  4: {
    covers: 'Família de origem, pai, lar, imóveis, terras e também o fim da vida e das situações.',
    high: { gist: 'Você tem raízes firmes e o lar é uma fonte de força.', practice: ['A família tende a ser apoio.', 'Há boa chance de ter casa própria ou ganhar com imóveis.', 'As situações tendem a terminar bem.'], advice: 'Investir no lar e em imóveis costuma valer a pena para você.' },
    mid: { gist: 'O lar tem seus conflitos, mas é um porto relativamente seguro.', practice: ['A relação com a família tem fases.', 'Mudanças de casa podem ser frequentes.', 'Imóveis exigem paciência para render.'], advice: 'Defina limites claros com a família para manter a paz.' },
    low: { gist: 'Família e lar são áreas de aprendizado e algum peso.', practice: ['Pode haver distância, perdas ou cobranças na família.', 'Questões de imóveis tendem a ser trabalhosas.', 'Sentir-se em casa pode exigir construir isso por conta própria.'], advice: 'Você pode criar o lar que não teve. Cuidado redobrado com contratos de imóveis.' },
  },
  5: {
    covers: 'Filhos, gravidez, prazer, diversão, romances, criatividade e apostas.',
    high: { gist: 'Prazer, criatividade e filhos tendem a ser fonte de alegria.', practice: ['Facilidade para se divertir e criar.', 'Relação com filhos tende a ser boa.', 'Romances costumam ser leves e prazerosos.'], advice: 'Dê espaço real ao lazer e à criação. É daí que vem boa parte da sua energia.' },
    mid: { gist: 'Prazer e criatividade existem, mas disputam espaço com obrigações.', practice: ['Lazer pode ficar em segundo plano.', 'Filhos trazem alegria e também preocupações.', 'Talentos criativos pedem prática para aparecer.'], advice: 'Reserve tempo fixo para o que te dá prazer, como se fosse um compromisso.' },
    low: { gist: 'Prazer e filhos são temas que pedem mais cuidado.', practice: ['Pode ser difícil relaxar sem culpa.', 'Questões com filhos ou gravidez podem exigir paciência.', 'Apostas e especulação tendem a dar prejuízo.'], advice: 'Evite jogos e investimentos de risco. Busque prazeres simples e constantes.' },
  },
  6: {
    covers: 'Saúde e doenças, rotina de trabalho, empregados, colegas e pequenos animais.',
    high: { gist: 'Saúde e rotina tendem a correr bem.', practice: ['Doenças tendem a ser leves ou passageiras.', 'Bom relacionamento com colegas e subordinados.', 'Você se adapta bem a rotinas de trabalho.'], advice: 'Mantenha a prevenção. Boa saúde também se perde por descuido.' },
    mid: { gist: 'Saúde e trabalho diário pedem atenção periódica.', practice: ['Há pontos fracos no corpo que voltam de tempos em tempos.', 'A rotina de trabalho cansa, mas é administrável.', 'Colegas variam entre aliados e fonte de atrito.'], advice: 'Exames regulares e pausas na rotina evitam que pequenos problemas cresçam.' },
    low: { gist: 'Saúde e rotina de trabalho são pontos sensíveis.', practice: ['O corpo tende a reagir ao estresse.', 'O trabalho do dia a dia pode parecer pesado ou injusto.', 'Problemas com funcionários ou colegas são possíveis.'], advice: 'Trate a saúde como prioridade e não ignore sintomas. Escolha ambientes de trabalho com cuidado.' },
  },
  7: {
    covers: 'Casamento, namoro sério, sócios, contratos, o público e também os rivais declarados.',
    high: { gist: 'Parcerias tendem a ser boas e trazer apoio.', practice: ['Boa chance de um casamento ou relação estável.', 'Sociedades e contratos costumam funcionar.', 'Rivais tendem a ser fracos ou a recuar.'], advice: 'Você cresce com parceiros. Vale escolher bem e investir na relação.' },
    mid: { gist: 'Relações e parcerias funcionam com negociação constante.', practice: ['O relacionamento tem fases de proximidade e atrito.', 'Contratos pedem leitura atenta.', 'Você atrai pessoas diferentes de você, o que ensina e desgasta.'], advice: 'Conversar com clareza sobre expectativas evita a maior parte dos conflitos.' },
    low: { gist: 'Parcerias são uma área de aprendizado e desafio.', practice: ['Relações podem começar tarde ou trazer frustrações.', 'Sócios e contratos exigem cuidado redobrado.', 'Conflitos abertos tendem a ser desgastantes.'], advice: 'Não tenha pressa em se comprometer. Contratos sempre por escrito e revisados.' },
  },
  8: {
    covers: 'Dinheiro do parceiro ou de terceiros, heranças, dívidas, impostos, crises e transformações.',
    high: { gist: 'Recursos de terceiros tendem a te favorecer.', practice: ['Boa chance de heranças, pensões ou apoio financeiro do parceiro.', 'Crédito e financiamentos tendem a funcionar.', 'Você atravessa crises e sai fortalecido.'], advice: 'Parcerias financeiras são um caminho de crescimento para você.' },
    mid: { gist: 'Dinheiro compartilhado funciona, mas exige clareza.', practice: ['Heranças ou ajudas podem vir com complicações.', 'Dívidas são administráveis se planejadas.', 'Crises trazem aprendizado, não destruição.'], advice: 'Mantenha documentos e acordos financeiros em ordem.' },
    low: { gist: 'Dívidas e dinheiro de terceiros são pontos de atenção.', practice: ['Empréstimos e dívidas tendem a pesar.', 'Heranças podem ser pequenas ou disputadas.', 'Crises podem bater forte.'], advice: 'Evite se endividar e misturar finanças sem acordo claro. Tenha seguros e reservas.' },
  },
  9: {
    covers: 'Estudos superiores, religião e filosofia, viagens longas, coisas estrangeiras e justiça.',
    high: { gist: 'Estudo, viagens e fé abrem portas para você.', practice: ['Facilidade com estudos e cursos longos.', 'Viagens e contatos estrangeiros trazem oportunidades.', 'Sua visão de mundo te dá direção e calma.'], advice: 'Invista em formação e em conhecer outros lugares. É aí que você se expande.' },
    mid: { gist: 'Estudos e viagens trazem crescimento com algum esforço.', practice: ['Os estudos podem ter sido interrompidos ou retomados.', 'Viagens longas têm imprevistos, mas valem a pena.', 'Suas crenças mudam ao longo da vida.'], advice: 'Estude temas práticos que você use logo. Isso mantém a motivação.' },
    low: { gist: 'Estudo, fé e viagens pedem mais persistência.', practice: ['Estudos formais podem ter sido difíceis.', 'Viagens longas tendem a trazer contratempos.', 'Pode haver dúvidas de fé ou conflitos de crença.'], advice: 'Aprenda no seu ritmo e por caminhos alternativos. Planeje viagens com folga.' },
  },
  10: {
    covers: 'Carreira, profissão, status, reputação, autoridades e a mãe.',
    high: { gist: 'Você tem boas condições de crescer na carreira e ser reconhecido.', practice: ['Facilidade para ocupar posições de destaque.', 'Autoridades e chefes tendem a te favorecer.', 'Sua reputação é um ativo.'], advice: 'Mire alto. Cuide da reputação, que é seu maior capital.' },
    mid: { gist: 'A carreira avança por esforço e escolhas certas, não por sorte.', practice: ['Crescimento profissional por etapas.', 'Mudanças de rumo podem acontecer.', 'Reconhecimento vem, mas demora.'], advice: 'Escolha uma direção e mantenha consistência. Visibilidade se constrói com tempo.' },
    low: { gist: 'Carreira e reconhecimento exigem persistência e estratégia.', practice: ['O reconhecimento pode demorar ou não corresponder ao esforço.', 'Conflitos com chefes ou autoridades são possíveis.', 'A reputação é sensível a erros.'], advice: 'Construa competência sólida antes de buscar visibilidade. Evite exposição desnecessária.' },
  },
  11: {
    covers: 'Amigos, grupos, redes de contato, protetores, esperanças e ganhos da profissão.',
    high: { gist: 'Amigos e contatos são uma fonte real de apoio e oportunidade.', practice: ['Você tem amigos leais e influentes.', 'Grupos e redes abrem portas.', 'Seus planos de futuro tendem a se realizar.'], advice: 'Cultive sua rede. Pedir ajuda funciona bem para você.' },
    mid: { gist: 'Amizades ajudam, mas é preciso escolher bem.', practice: ['Alguns amigos são essenciais, outros decepcionam.', 'Planos se realizam em parte.', 'Grupos trazem oportunidades e também cobranças.'], advice: 'Invista em poucas amizades de qualidade.' },
    low: { gist: 'Amizades e esperanças pedem cautela.', practice: ['Amigos podem se afastar ou não retribuir.', 'Planos de futuro tendem a mudar ou demorar.', 'Você pode se sentir deslocado em grupos.'], advice: 'Conte mais consigo mesmo do que com promessas alheias. Amizades verdadeiras são poucas e valiosas.' },
  },
  12: {
    covers: 'Inimigos ocultos, isolamento, hospitais, prisões, autossabotagem e provações escondidas. Aqui, nota alta significa estar protegido dessas coisas.',
    high: { gist: 'Você tem boa proteção contra inimigos ocultos e provações.', practice: ['Intrigas e traições tendem a não te atingir muito.', 'Períodos de isolamento podem ser restauradores.', 'Você lida bem com a própria sombra.'], advice: 'Momentos de recolhimento e espiritualidade fazem bem a você.' },
    mid: { gist: 'Há provações escondidas, mas você consegue lidar com elas.', practice: ['Às vezes você se sabota sem perceber.', 'Pode haver pessoas que torcem contra em silêncio.', 'O isolamento cansa se durar demais.'], advice: 'Observe padrões que se repetem. Terapia ou autoconhecimento ajudam.' },
    low: { gist: 'Inimigos ocultos e autossabotagem são temas sensíveis.', practice: ['Pode haver intrigas, fofocas ou rivais escondidos.', 'Tendência a guardar mágoas e se isolar.', 'Situações de confinamento ou longas internações pedem prevenção.'], advice: 'Desconfie de quem é bom demais para ser verdade. Trabalhe padrões internos com ajuda profissional.' },
  },
};

export const ASPECT_MEANING = {
  0: 'se fundem: os dois temas agem sempre em conjunto, para o bem ou para o mal conforme os planetas',
  60: 'cooperam: há uma oportunidade de ajuda mútua que aparece quando você toma a iniciativa',
  90: 'estão em atrito: geram tensão e cobrança, e pedem esforço para conciliar',
  120: 'fluem em harmonia: os dois temas se ajudam naturalmente, quase sem esforço',
  180: 'puxam em direções opostas: você sente a necessidade de equilibrar os dois lados',
};

// Nome com artigo e concordância de gênero (a Lua e Vênus são femininos).
const WITH_ART = { Sun: 'o Sol', Moon: 'a Lua' };
export const nm = (id) => WITH_ART[id] || PLANET_NAMES[id];
export const Nm = (id) => { const n = nm(id); return n.charAt(0).toUpperCase() + n.slice(1); };
export const isFem = (id) => id === 'Moon' || id === 'Venus';
export const adj = (id, word) => (isFem(id) ? word.replace(/o$/, 'a') : word);
export const pron = (id) => (isFem(id) ? 'ela' : 'ele');

export function level(score) { return score >= 58 ? 'high' : score > 42 ? 'mid' : 'low'; }

// O que a dignidade essencial e as principais condições acidentais significam em linguagem comum.
export function conditionText(id, chart, ps) {
  const s = ps[id], b = chart.bodies[id], name = Nm(id);
  const has = (lbl) => s.essential.some((i) => i.label === lbl);
  const out = [];
  if (has('Domicílio')) out.push(`${name} está no próprio signo. Age com autoridade e coerência, como alguém em casa: essa parte da sua vida tende a funcionar do jeito certo.`);
  else if (has('Exaltação')) out.push(`${name} está ${adj(id, 'exaltado')}. Recebe honra e destaque, às vezes até um pouco de exagero: essa parte da sua vida tende a brilhar.`);
  else if (s.essentialTotal > 0) out.push(`${name} tem uma dignidade menor (${s.essential.filter((i) => i.points > 0).map((i) => i.label.toLowerCase()).join(', ')}). Funciona razoavelmente bem, com recursos modestos.`);
  if (has('Detrimento')) out.push(`${name} está em detrimento, no signo oposto ao seu. Precisa agir contra a própria natureza, então os resultados vêm com mais esforço ou de forma diferente do esperado.`);
  if (has('Queda')) out.push(`${name} está em queda. Tende a agir com insegurança: essa parte da vida pede construir confiança aos poucos.`);
  if (has('Peregrino')) out.push(`${name} está ${adj(id, 'peregrino')}, sem nenhuma dignidade no signo. Age sem rumo fixo e se deixa levar pelas circunstâncias e pelas pessoas por perto.`);
  if (s.essential.some((i) => i.label.startsWith('Recepção'))) out.push(`${name} está em recepção mútua com outro planeta: os dois trocam favores, o que suaviza dificuldades.`);
  if (b.retrograde) out.push(`Está ${adj(id, 'retrógrado')}: os assuntos dele andam com atrasos, revisões e recomeços.`);
  if (b.solar === 'combusto') out.push(`Está ${adj(id, 'combusto')}, perto demais do Sol: suas qualidades ficam ofuscadas, como alguém que trabalha muito e não aparece.`);
  if (b.solar === 'sob os raios') out.push(`Está sob os raios do Sol: um pouco ${adj(id, 'ofuscado')}, com menos visibilidade.`);
  if (b.solar === 'cazimi') out.push(`Está cazimi, no coração do Sol: recebe uma força especial e rara.`);
  if ([1, 10, 7, 4].includes(b.house)) out.push(`Está numa casa angular (${b.house}), então é muito visível e ativo na sua vida.`);
  else if (b.house === 12) out.push('Está na casa 12, a mais escondida do mapa: age nos bastidores e encontra obstáculos que você nem sempre vê.');
  else if ([3, 6, 9].includes(b.house)) out.push(`Está numa casa cadente (${b.house}), onde tem menos força para agir.`);
  return out;
}

export function strengthWord(total) {
  if (total >= 15) return 'força muito alta';
  if (total >= 6) return 'força alta';
  if (total > -3) return 'força média';
  if (total > -10) return 'força baixa';
  return 'força muito baixa';
}

// Temperamento pelo método de Lilly: Ascendente, regente do Ascendente, signo e fase da Lua, e estação do Sol.
const QUAL = { fire: ['quente', 'seco'], earth: ['frio', 'seco'], air: ['quente', 'úmido'], water: ['frio', 'úmido'] };
const ELEM = ['fire', 'earth', 'air', 'water'];
export const ELEMENT_NAME = { fire: 'Fogo', earth: 'Terra', air: 'Ar', water: 'Água' };
export const TEMPERAMENTS = {
  'quente-úmido': { slug: 'sanguineo', name: 'Sanguíneo', mood: 'quente e úmido, como o ar da primavera. A página ganha tons rosados e uma névoa suave e luminosa.', text: 'Expansivo, sociável e otimista. Gosta de gente, de prazer e de novidades. Esquece mágoas com facilidade, mas pode ser disperso e indulgente.' },
  'quente-seco': { slug: 'colerico', name: 'Colérico', mood: 'quente e seco, como o fogo do verão. A página ganha tons de brasa e um céu nítido e cintilante.', text: 'Enérgico, decidido e competitivo. Toma a frente, resolve rápido e não leva desaforo para casa. O desafio é a impaciência e o pavio curto.' },
  'frio-seco': { slug: 'melancolico', name: 'Melancólico', mood: 'frio e seco, como a terra no outono, regida por Saturno. A página ganha tons de prata e um céu limpo e quieto.', text: 'Reflexivo, cuidadoso e persistente. Pensa antes de agir, valoriza a ordem e é fiel aos compromissos. Tende à preocupação e ao pessimismo.' },
  'frio-úmido': { slug: 'fleumatico', name: 'Fleumático', mood: 'frio e úmido, como a água no inverno, regida pela Lua. A página ganha tons de mar e uma névoa lenta e profunda.', text: 'Calmo, sensível e tolerante. Evita conflitos, se adapta e acolhe as pessoas. Pode ser lento para decidir e acomodado.' },
};

export function temperament(chart) {
  const factors = [];
  const add = (label, q) => factors.push({ label, q });
  const ascSign = Math.floor(norm(chart.asc) / 30);
  add(`Ascendente em ${SIGNS[ascSign]}`, QUAL[ELEM[ascSign % 4]]);
  const lord = DOMICILE[ascSign], lb = chart.bodies[lord];
  add(`${PLANET_NAMES[lord]} (regente do Ascendente) em ${lb.signName}`, QUAL[ELEM[lb.sign % 4]]);
  add(`Lua em ${chart.bodies.Moon.signName}`, QUAL[ELEM[chart.bodies.Moon.sign % 4]]);
  const elong = norm(chart.bodies.Moon.lon - chart.bodies.Sun.lon);
  const phase = Math.floor(elong / 90);
  add(['Lua no primeiro quarto', 'Lua no segundo quarto', 'Lua no terceiro quarto', 'Lua no último quarto'][phase],
    [['quente', 'úmido'], ['quente', 'seco'], ['frio', 'seco'], ['frio', 'úmido']][phase]);
  const season = Math.floor(chart.bodies.Sun.sign / 3);
  add(`Sol na estação ${['da primavera', 'do verão', 'do outono', 'do inverno'][season]} (hemisfério norte, como em Lilly)`,
    [['quente', 'úmido'], ['quente', 'seco'], ['frio', 'seco'], ['frio', 'úmido']][season]);
  const c = { quente: 0, frio: 0, seco: 0, úmido: 0 };
  for (const f of factors) for (const q of f.q) c[q]++;
  const hot = c.quente >= c.frio, dry = c.seco >= c.úmido;
  const key = `${hot ? 'quente' : 'frio'}-${dry ? 'seco' : 'úmido'}`;
  // Misturas, como Lilly descreve: um temperamento principal com traços do vizinho quando um eixo fica apertado.
  const mHot = Math.abs(c.quente - c.frio), mDry = Math.abs(c.seco - c.úmido);
  const flipHot = `${hot ? 'frio' : 'quente'}-${dry ? 'seco' : 'úmido'}`, flipDry = `${hot ? 'quente' : 'frio'}-${dry ? 'úmido' : 'seco'}`;
  let secondary = null, balanced = false;
  if (mHot <= 1 && mDry <= 1) balanced = true;
  else if (mHot <= 1) secondary = TEMPERAMENTS[flipHot];
  else if (mDry <= 1) secondary = TEMPERAMENTS[flipDry];
  const base = TEMPERAMENTS[key];
  const mix = balanced
    ? `Quase equilibrado: as quatro qualidades aparecem em medidas parecidas, com leve inclinação para o ${base.name.toLowerCase()}. A tradição chamava isso de temperamento temperado, o mais estável de todos.`
    : secondary
      ? `${base.name} com traços de ${secondary.name.toLowerCase()}. ${secondary.name === 'Sanguíneo' ? 'Isso traz mais leveza e sociabilidade.' : secondary.name === 'Colérico' ? 'Isso traz mais iniciativa e firmeza.' : secondary.name === 'Melancólico' ? 'Isso traz mais cautela e profundidade.' : 'Isso traz mais calma e sensibilidade.'}`
      : `${base.name} puro: as qualidades apontam com clareza para o mesmo lado.`;
  return { ...base, counts: c, factors, secondary, balanced, mix, label: balanced ? 'quase equilibrado' : secondary ? `com traços de ${secondary.name.toLowerCase()}` : null };
}

export function elementBalance(chart) {
  const count = { fire: [], earth: [], air: [], water: [] };
  for (const p of PLANETS) count[ELEM[chart.bodies[p].sign % 4]].push(PLANET_NAMES[p]);
  count[ELEM[Math.floor(norm(chart.asc) / 30) % 4]].push('Ascendente');
  return count;
}

export const ELEMENT_TEXT = {
  fire: { many: 'Muito fogo: entusiasmo, iniciativa e coragem sobram.', few: 'Pouco fogo: pode faltar ânimo para começar coisas e se impor.' },
  earth: { many: 'Muita terra: senso prático, paciência e foco em resultados concretos.', few: 'Pouca terra: rotina, dinheiro e detalhes práticos tendem a ficar de lado.' },
  air: { many: 'Muito ar: raciocínio, conversa e sociabilidade em destaque.', few: 'Pouco ar: pode ser difícil se distanciar das emoções para analisar.' },
  water: { many: 'Muita água: sensibilidade, empatia e intuição fortes.', few: 'Pouca água: as emoções são guardadas e pode faltar contato com o que sente.' },
};
