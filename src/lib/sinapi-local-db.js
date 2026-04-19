// src/lib/sinapi-local-db.js
// Dados SINAPI estáticos — CE, mar/2024
// Em produção: complementado pela tabela Supabase sinapi_composicoes
// Fallback final quando nem Supabase nem a biblioteca local estão disponíveis

// Produtividade SINAPI por composição (unidade por hora por equipe)
// Usado para gerar o cronograma 4D
export const PRODUTIVIDADE = {
  '87503': { valor: 1.2,  unidade: 'm²/h',  equipe: '1 pedreiro + 1 servente' },
  '87251': { valor: 2.5,  unidade: 'm²/h',  equipe: '1 pedreiro + 1 servente' },
  '94966': { valor: 5.0,  unidade: 'm³/h',  equipe: 'equipe de concretagem' },
  '94978': { valor: 4.5,  unidade: 'm³/h',  equipe: 'equipe de concretagem' },
  '92793': { valor: 80.0, unidade: 'kg/h',   equipe: '1 armador + 1 ajudante' },
  '87447': { valor: 8.0,  unidade: 'm²/h',  equipe: '1 carpinteiro + 1 ajudante' },
  '87264': { valor: 3.0,  unidade: 'm²/h',  equipe: '1 pedreiro + 1 servente' },
  '87549': { valor: 2.0,  unidade: 'm²/h',  equipe: '1 pedreiro + 1 servente' },
  '74209': { valor: 1.5,  unidade: 'm²/h',  equipe: '1 pedreiro + 1 servente' },
  '87296': { valor: 4.0,  unidade: 'm²/h',  equipe: '1 pedreiro + 1 servente' },
  // Fundação
  '72136': { valor: 4.0,  unidade: 'm²/h',  equipe: '1 pedreiro + 1 servente' },
  '72137': { valor: 3.0,  unidade: 'm³/h',  equipe: 'equipe de concretagem' },
  // Instalações hidráulicas
  '88267': { valor: 3.5,  unidade: 'm/h',   equipe: '1 encanador + 1 ajudante' },
  '88271': { valor: 1.0,  unidade: 'pt/h',  equipe: '1 encanador' },
  // Instalações elétricas
  '93358': { valor: 1.2,  unidade: 'pt/h',  equipe: '1 eletricista' },
  '93359': { valor: 4.0,  unidade: 'm/h',   equipe: '1 eletricista + 1 ajudante' },
  // Cobertura
  '87551': { valor: 2.0,  unidade: 'm²/h',  equipe: '1 pedreiro + 1 servente' },
  // Impermeabilização
  '74252': { valor: 5.0,  unidade: 'm²/h',  equipe: '1 impermeabilizador' },
  // Esquadrias
  '74128': { valor: 0.5,  unidade: 'un/h',  equipe: '1 marceneiro + 1 ajudante' },
  '74130': { valor: 0.5,  unidade: 'un/h',  equipe: '1 serralheiro + 1 ajudante' },
}

// Tabela de composições SINAPI — CE, mar/2024
// Serve como fallback quando o Supabase não está configurado ou não retorna dados
export const SINAPI_DB = {
  '87503': {
    codigo: '87503',
    desc: 'Alvenaria de vedação de blocos cerâmicos furados na horizontal 9x19x19cm, e=9cm',
    unidade: 'm²',
    custo_total: 62.18,
    mo: 28.45,
    material: 33.73,
    estado: 'CE',
  },
  '87251': {
    codigo: '87251',
    desc: 'Contrapiso em argamassa traço 1:3 (cimento/areia), preparo mecânico, esp=4cm',
    unidade: 'm²',
    custo_total: 38.92,
    mo: 14.20,
    material: 24.72,
    estado: 'CE',
  },
  '94966': {
    codigo: '94966',
    desc: 'Concreto usinado bombeável fck=25MPa, lançado, adensado e acabado em lajes',
    unidade: 'm³',
    custo_total: 548.30,
    mo: 62.10,
    material: 486.20,
    estado: 'CE',
  },
  '94978': {
    codigo: '94978',
    desc: 'Concreto usinado bombeável fck=30MPa, lançado, adensado e acabado em pilares',
    unidade: 'm³',
    custo_total: 578.50,
    mo: 68.40,
    material: 510.10,
    estado: 'CE',
  },
  '92793': {
    codigo: '92793',
    desc: 'Armação de aço CA-50 diâm. 10,0mm',
    unidade: 'kg',
    custo_total: 14.82,
    mo: 4.30,
    material: 10.52,
    estado: 'CE',
  },
  '87447': {
    codigo: '87447',
    desc: 'Forma para lajes, em chapa de madeira compensada plastificada e=18mm, 1 uso',
    unidade: 'm²',
    custo_total: 58.16,
    mo: 22.40,
    material: 35.76,
    estado: 'CE',
  },
  '87264': {
    codigo: '87264',
    desc: 'Revestimento cerâmico para piso, carga elevada, 35x35cm (a=0.30m²/peça)',
    unidade: 'm²',
    custo_total: 82.74,
    mo: 23.60,
    material: 59.14,
    estado: 'CE',
  },
  '87549': {
    codigo: '87549',
    desc: 'Chapisco rolado de paredes internas de concreto, traço 1:4 cimento/areia',
    unidade: 'm²',
    custo_total: 8.94,
    mo: 5.10,
    material: 3.84,
    estado: 'CE',
  },
  '74209': {
    codigo: '74209',
    desc: 'Revestimento de gesso liso em teto, espessura de 2mm',
    unidade: 'm²',
    custo_total: 28.40,
    mo: 18.90,
    material: 9.50,
    estado: 'CE',
  },
  '87296': {
    codigo: '87296',
    desc: 'Pintura acrílica em paredes internas, 2 demãos + selador, tinta 1ª linha',
    unidade: 'm²',
    custo_total: 22.60,
    mo: 10.20,
    material: 12.40,
    estado: 'CE',
  },
  // ── Fundação ──────────────────────────────────────────────────────────────
  '72136': {
    codigo: '72136',
    desc: 'Lastro de concreto magro, e=5cm, preparo mecânico',
    unidade: 'm²',
    custo_total: 27.20,
    mo: 8.50,
    material: 18.70,
    estado: 'CE',
  },
  '72137': {
    codigo: '72137',
    desc: 'Sapata isolada de concreto fck=15MPa, preparo mecânico, com espera de armação',
    unidade: 'm³',
    custo_total: 555.00,
    mo: 145.00,
    material: 410.00,
    estado: 'CE',
  },
  // ── Instalações hidráulicas ────────────────────────────────────────────────
  '88267': {
    codigo: '88267',
    desc: 'Tubo PVC rígido soldável Ø100mm para instalação de esgoto embutida',
    unidade: 'm',
    custo_total: 37.30,
    mo: 12.80,
    material: 24.50,
    estado: 'CE',
  },
  '88271': {
    codigo: '88271',
    desc: 'Ponto de água fria com tubo PVC soldável até Ø20mm, embutido, inclui ramal',
    unidade: 'pt',
    custo_total: 81.00,
    mo: 32.40,
    material: 48.60,
    estado: 'CE',
  },
  // ── Instalações elétricas ────────────────────────────────────────────────
  '93358': {
    codigo: '93358',
    desc: 'Tomada elétrica 2P+T, 10A, embutida, inclui caixa e tampa cega',
    unidade: 'pt',
    custo_total: 47.40,
    mo: 28.50,
    material: 18.90,
    estado: 'CE',
  },
  '93359': {
    codigo: '93359',
    desc: 'Eletroduto PVC rígido Ø20mm embutido em parede ou laje, inclui conexões',
    unidade: 'm',
    custo_total: 15.00,
    mo: 8.20,
    material: 6.80,
    estado: 'CE',
  },
  // ── Cobertura ────────────────────────────────────────────────────────────
  '87551': {
    codigo: '87551',
    desc: 'Telha cerâmica capa-canal, fornecimento e assentamento, inclui cumeeira',
    unidade: 'm²',
    custo_total: 57.00,
    mo: 18.60,
    material: 38.40,
    estado: 'CE',
  },
  // ── Impermeabilização ────────────────────────────────────────────────────
  '74252': {
    codigo: '74252',
    desc: 'Impermeabilização com manta asfáltica 3mm em superfície horizontal',
    unidade: 'm²',
    custo_total: 58.40,
    mo: 15.80,
    material: 42.60,
    estado: 'CE',
  },
  // ── Esquadrias ───────────────────────────────────────────────────────────
  '74128': {
    codigo: '74128',
    desc: 'Porta de madeira maciça, lisa, 0.80x2.10m, com alizares e dobradiças',
    unidade: 'un',
    custo_total: 353.00,
    mo: 68.00,
    material: 285.00,
    estado: 'CE',
  },
  '74130': {
    codigo: '74130',
    desc: 'Janela de alumínio de correr, 1.20x1.00m, anodizado, com vidro 4mm',
    unidade: 'un',
    custo_total: 365.00,
    mo: 45.00,
    material: 320.00,
    estado: 'CE',
  },
}
