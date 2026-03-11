/* ============================================================
   MONITORAMENTO — monitoramento.js
   Simulação de feed ao vivo (WebSocket será conectado no backend)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initFeed();
  initPausar();
  initFiltro();
});

let pausado   = false;
let feedTimer = null;

const EVENTOS_MOCK = [
  { nome: 'Maria Aparecida', iniciais: 'MA', setor: 'RH',         catraca: 'Portão Principal', sentido: 'Entrada', metodo: 'Facial',    tipo: 'liberado', cor: '#0091AD' },
  { nome: 'João da Silva',   iniciais: 'JS', setor: 'TI',         catraca: 'Portão Lateral A', sentido: 'Saída',   metodo: 'Biometria', tipo: 'liberado', cor: '#465362' },
  { nome: 'Carlos Ferreira', iniciais: 'CF', setor: 'Operações',  catraca: 'Portão Principal', sentido: 'Entrada', metodo: 'Facial',    tipo: 'negado',   cor: '#ef4444' },
  { nome: 'Roberta Lima',    iniciais: 'RL', setor: 'Financeiro', catraca: 'Portão Lateral B', sentido: 'Entrada', metodo: 'Biometria', tipo: 'liberado', cor: '#0091AD' },
  { nome: 'Pedro Santos',    iniciais: 'PS', setor: 'Segurança',  catraca: 'Portão Principal', sentido: 'Entrada', metodo: 'Facial',    tipo: 'alerta',   cor: '#FFD23F' },
  { nome: 'Ana Costa',       iniciais: 'AC', setor: 'Adm',        catraca: 'Portão Lateral A', sentido: 'Saída',   metodo: 'Senha',     tipo: 'alerta',   cor: '#8A716A' },
];

function initFeed() {
  // Limpa mensagem vazia
  document.getElementById('monitor-feed').innerHTML = '';

  // Adiciona alguns eventos iniciais
  EVENTOS_MOCK.slice(0, 4).forEach(ev => adicionarEvento(ev));

  // Simula chegada de novos eventos
  feedTimer = setInterval(() => {
    if (pausado) return;
    const ev = EVENTOS_MOCK[Math.floor(Math.random() * EVENTOS_MOCK.length)];
    adicionarEvento(ev);
  }, 4000);
}

function adicionarEvento(ev) {
  const feed   = document.getElementById('monitor-feed');
  const filtro = document.getElementById('filtro-tipo').value;
  if (filtro && ev.tipo !== filtro) return;

  const agora = new Date().toLocaleTimeString('pt-BR');

  const badges = {
    liberado: '<span class="badge badge-success">Liberado</span>',
    negado:   '<span class="badge badge-danger">Negado</span>',
    alerta:   '<span class="badge badge-warning">Alerta</span>',
  };

  const sentidoBadge = ev.sentido === 'Entrada'
    ? '<span class="badge badge-info">Entrada</span>'
    : '<span class="badge badge-neutral">Saída</span>';

  const item = document.createElement('div');
  item.className = `feed-item ${ev.tipo}`;
  item.innerHTML = `
    <div class="feed-avatar" style="background:${ev.cor};">${ev.iniciais}</div>
    <div class="feed-info">
      <div class="feed-nome">${ev.nome}</div>
      <div class="feed-meta">
        <span>${ev.setor}</span>
        <span>·</span>
        <span>${ev.catraca}</span>
        <span>·</span>
        <span><i class="ph ph-fingerprint"></i> ${ev.metodo}</span>
      </div>
    </div>
    <div class="feed-right">
      <span class="feed-hora">${agora}</span>
      ${sentidoBadge}
      ${badges[ev.tipo]}
    </div>
  `;

  feed.prepend(item);

  // Limitar feed a 50 itens
  while (feed.children.length > 50) feed.lastChild.remove();

  // Atualiza último acesso
  atualizarUltimoAcesso(ev, agora);
}

function atualizarUltimoAcesso(ev, hora) {
  document.getElementById('last-empty').classList.add('rec-hidden');
  document.getElementById('last-content').classList.remove('rec-hidden');
  document.getElementById('last-avatar').textContent             = ev.iniciais;
  document.getElementById('last-avatar').style.background        = ev.cor;
  document.getElementById('last-nome').textContent               = ev.nome;
  document.getElementById('last-meta').textContent               = `${ev.setor} · ${ev.catraca} · ${hora}`;

  const badges = {
    liberado: '<span class="badge badge-success">Liberado</span>',
    negado:   '<span class="badge badge-danger">Negado</span>',
    alerta:   '<span class="badge badge-warning">Alerta</span>',
  };

  document.getElementById('last-badges').innerHTML =
    `${badges[ev.tipo]} <span class="badge badge-info">${ev.sentido}</span>`;
}

function initPausar() {
  const btn = document.getElementById('btn-pausar');
  btn.addEventListener('click', () => {
    pausado = !pausado;
    btn.innerHTML = pausado
      ? '<i class="ph ph-play"></i> Retomar'
      : '<i class="ph ph-pause"></i> Pausar';
  });
}

function initFiltro() {
  document.getElementById('filtro-tipo').addEventListener('change', () => {
    document.getElementById('monitor-feed').innerHTML = '';
    EVENTOS_MOCK.slice(0, 4).forEach(ev => adicionarEvento(ev));
  });
}
