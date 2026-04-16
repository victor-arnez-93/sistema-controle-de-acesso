/* ============================================================
   MONITORAMENTO — PROFISSIONAL (CRV)
   Tempo real + Offline + Supabase ready
============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 MONITORAMENTO iniciado');

  Monitoramento.init();
});

const Monitoramento = (() => {

  let pausado = false;
  let online = navigator.onLine;
  let eventosCache = [];
  let filtroAtual = 'todos';
  let realtimeChannel = null;
  let funcionariosCache = {};

  const feedEl = () => document.getElementById('monitor-feed');

  async function init() {
    try {
      console.log('📡 Inicializando monitoramento...');

      bindEventos();
      atualizarStatusRede();

      await carregarFuncionarios();
      await carregarInicial();
      iniciarRealtime();

    } catch (e) {
      console.error('❌ Erro ao iniciar monitoramento:', e);
    }
  }

  function bindEventos() {
    document.getElementById('btn-pausar').addEventListener('click', togglePausa);
    document.getElementById('filtro-tipo').addEventListener('change', aplicarFiltro);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    document.addEventListener('app:online', onOnline);
    document.addEventListener('app:offline', onOffline);
  }

  function atualizarStatusRede() {
    const label = document.getElementById('ws-label');
    label.textContent = online ? 'Conectado' : 'Offline';
  }

  async function carregarInicial() {
    console.log('📡 Buscando acessos...');

    try {
      if (online) {
        const dados = await window.apiCRV.buscarAcessosRecentes();

        eventosCache = dados || [];
        aplicarFiltroAtual();
        atualizarKPIs(eventosCache);

        console.log('✅ Dados carregados (online)');
      } else {
        const dados = await window.dbCRV.getEventos();

        eventosCache = dados || [];
        aplicarFiltroAtual();

        console.log('📴 Dados carregados do offline');
      }
    } catch (e) {
      console.error('❌ Erro ao carregar dados:', e);
    }
  }

  async function carregarFuncionarios() {

  const sb = window.getSupabase();
  if (!sb) return;

  try {

    const { data, error } = await sb
      .from('funcionarios')
      .select('id, nome, cargo, foto_url');

    if (error) {
      console.error('Erro ao carregar funcionários', error);
      return;
    }

    funcionariosCache = {};

    data.forEach(f => {
      funcionariosCache[f.id] = f;
    });

    console.log('👥 Funcionários carregados');

  } catch (e) {
    console.error('Erro geral ao carregar funcionários', e);
  }
}

  function renderFeed(lista) {
    const feed = feedEl();
    feed.innerHTML = '';

    if (!lista || lista.length === 0) {
      feed.innerHTML = `
        <div class="monitor-empty">
          <i class="ph ph-broadcast"></i>
          <span>Aguardando eventos...</span>
        </div>
      `;
      return;
    }

    [...lista].reverse().forEach(ev => adicionarEvento(ev));
  }

  function aplicarFiltroAtual() {

  let lista = [...eventosCache];

  if (filtroAtual === 'liberado') {
    lista = lista.filter(e => e.resultado === 'liberado');
  }

  if (filtroAtual === 'negado') {
    lista = lista.filter(e => e.resultado === 'negado');
  }

  renderFeed(lista);
}

function adicionarEvento(ev) {
  const func = funcionariosCache[ev.funcionario_id];

  if (pausado) return;

  // só adiciona no cache se vier do realtime (evita duplicação)
  if (ev && ev.id && !eventosCache.find(e => e.id === ev.id)) {
    eventosCache.push(ev);
  }

  if (filtroAtual !== 'todos' && ev.resultado !== filtroAtual) return;

  const hora = new Date(ev.data).toLocaleTimeString('pt-BR');

  const motivosMap = {
  sem_credencial: 'Sem credencial',
  bloqueada: 'Credencial bloqueada',
  vencida: 'Credencial vencida'
};

const motivoTexto = (ev.resultado === 'negado' && ev.motivo)
  ? ` • ${motivosMap[ev.motivo] || ''}`
  : '';

  const item = document.createElement('div');
  item.className = `feed-item ${ev.resultado}`;

  item.innerHTML = `
    <div class="feed-avatar">
      ${func?.foto_url
        ? `<img src="${func.foto_url}" alt="foto">`
        : getIniciais(func?.nome || ev.nome || 'Usuário')}
    </div>

    <div class="feed-info">
      <div class="feed-nome">${func?.nome || ev.nome || 'Não identificado'}</div>
      <div class="feed-meta">
        <span>${func?.cargo || ev.setor || '-'}</span>
        <span>·</span>
        <span>${ev.catraca || '-'}</span>
        <span>·</span>
        <span>${ev.metodo}</span>
      </div>
    </div>

<div class="feed-right">
  <span class="feed-hora">${hora}</span>

  <div class="feed-badges">
    ${badgeTipo(ev.tipo)}
    ${badgeResultado(ev.resultado)}
    ${badgeMotivo(ev)}
  </div>

</div>
  `;

  feedEl().prepend(item);

  limitarFeed();
  atualizarUltimo(ev);
}

function atualizarUltimo(ev) {
  const func = funcionariosCache[ev.funcionario_id];

  document.getElementById('last-empty').classList.add('rec-hidden');
  document.getElementById('last-content').classList.remove('rec-hidden');

  document.getElementById('last-avatar').textContent =
    getIniciais(func?.nome || ev.nome);

  document.getElementById('last-nome').textContent =
    func?.nome || ev.nome || '—';

  document.getElementById('last-meta').textContent =
    `${ev.catraca} · ${new Date(ev.data).toLocaleTimeString('pt-BR')}`;

  document.getElementById('last-badges').innerHTML =
    `${badgeResultado(ev.resultado)} ${badgeTipo(ev.tipo)} ${badgeMotivo(ev)}`;
}

  function atualizarKPIs(lista) {
    const total = lista.length;
    const negados = lista.filter(e => e.resultado === 'negado').length;
    const presentes = lista.filter(e => e.tipo === 'entrada').length;

    document.getElementById('kpi-eventos').textContent = total;
    document.getElementById('kpi-negados').textContent = negados;
    document.getElementById('kpi-presentes').textContent = presentes;
    document.getElementById('kpi-alertas').textContent =
      lista.filter(e => e.resultado === 'alerta').length;
  }

  function iniciarRealtime() {
    console.log('📡 Iniciando tempo real...');
    if (realtimeChannel) {
  console.log('⚠️ Realtime já ativo');
  return;
}

    if (!window.getSupabase) return;

    const sb = window.getSupabase();

    realtimeChannel = sb.channel('acessos-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'acessos'
        },
        payload => {
          console.log('📡 Evento recebido:', payload);

          const ev = payload.new;

        // 🔥 adiciona no cache
          eventosCache.push(ev);

        // 🔥 atualiza feed
          adicionarEvento(ev);

        // 🔥 atualiza KPIs em tempo real
          atualizarKPIs(eventosCache);

          if (!online) {
            window.syncCRV.adicionarFila('acessos', ev);
          }
        }
      )
      .subscribe();
  }

function togglePausa() {

  pausado = !pausado;

  const sb = window.getSupabase();

  if (!sb) return;

  if (pausado) {

    console.log('⏸️ Pausando realtime...');

    if (realtimeChannel) {
      sb.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }

  } else {

    console.log('▶️ Retomando realtime...');

    iniciarRealtime();
  }

  document.getElementById('btn-pausar').innerHTML = pausado
    ? '<i class="ph ph-play"></i> Retomar'
    : '<i class="ph ph-pause"></i> Pausar';
}

  function aplicarFiltro() {
    filtroAtual = document.getElementById('filtro-tipo').value || 'todos';
    aplicarFiltroAtual();
  }

  function onOnline() {
    online = true;
    atualizarStatusRede();

    console.log('🔄 Conexão restaurada');
    sincronizarFila();
  }

  function onOffline() {
    online = false;
    atualizarStatusRede();

    console.log('📴 Modo offline ativo');
  }

  async function sincronizarFila() {
    console.log('🔄 Sincronizando fila...');

    try {
      await window.syncCRV.processarFila();
      console.log('✅ Fila sincronizada');
    } catch (e) {
      console.error('❌ Erro ao sincronizar:', e);
    }
  }

  function limitarFeed() {
    const feed = feedEl();
    while (feed.children.length > 50) {
      feed.lastChild.remove();
    }
  }

  function getIniciais(nome = '') {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function badgeResultado(tipo) {
    return {
      liberado: '<span class="badge badge-success">Liberado</span>',
      negado: '<span class="badge badge-danger">Negado</span>',
      alerta: '<span class="badge badge-warning">Alerta</span>'
    }[tipo] || '';
  }

  function badgeMotivo(ev) {

  if (ev.resultado !== 'negado' || !ev.motivo) return '';

  const map = {
    sem_credencial: 'Sem credencial',
    bloqueada: 'Bloqueada',
    vencida: 'Vencida',
    fora_horario: 'Fora do horário',
    regra_negada: 'Acesso não permitido',
    sem_regra: 'Sem regra de acesso',
    fora_dia: 'Fora do dia permitido',
    area_negada: 'Área não permitida',
  };

  const cores = {
  sem_credencial: 'badge-neutral',
  bloqueada: 'badge-danger',
  vencida: 'badge-warning'
};

return `<span class="badge ${cores[ev.motivo] || 'badge-outline'}">${map[ev.motivo] || ''}</span>`;
}

  function badgeTipo(tipo) {
    return tipo === 'entrada'
      ? '<span class="badge badge-info">Entrada</span>'
      : '<span class="badge badge-neutral">Saída</span>';
  }

  return { init };

})();

async function liberarCatraca(id, tipo = 'entrada') {

  const sb = window.getSupabase();
  if (!sb) return;

  // 🔥 BUSCA UM FUNCIONÁRIO REAL
  const { data: funcs, error: funcError } = await sb
    .from('funcionarios')
    .select('id, nome, cargo')
    .limit(1);

  if (funcError || !funcs || funcs.length === 0) {
    console.error(funcError);
    alert('Nenhum funcionário encontrado');
    return;
  }

  const func = funcs[0];
  const grupoFuncionario = func.grupo_id || null;

  // 🔍 BUSCAR CREDENCIAL ATIVA
  const { data: credencial } = await sb
    .from('credenciais')
    .select('*')
    .eq('funcionario_id', func.id)
    .eq('ativo', true)
    .maybeSingle();

  let resultado = 'liberado';
  let motivo = null;

// 🔥 BUSCAR EQUIPAMENTO REAL
const { data: equipamento } = await sb
  .from('equipamentos')
  .select('id, nome, area_id')
  .eq('id', id)
  .maybeSingle();

const areaAtual = equipamento?.area_id || null;

  // ============================================================
  // 🔥 VALIDAÇÃO DE REGRAS (CORRETA PARA SEU BANCO)
  // ============================================================

  const { data: regrasFuncionario } = await sb
    .from('funcionario_regras')
    .select('regra_id')
    .eq('funcionario_id', func.id);

  if (!regrasFuncionario || regrasFuncionario.length === 0) {

    resultado = 'negado';
    motivo = 'sem_regra';

  } else {

const regrasIds = regrasFuncionario.map(r => r.regra_id);

// 🔥 BUSCAR REGRAS REAIS
const { data: regras } = await sb
  .from('regras_acesso')
  .select('*')
  .in('id', regrasIds);

  // 🔥 ORDENA POR PRIORIDADE
const ordem = {
  critica: 3,
  alta: 2,
  normal: 1
};

regras.sort((a, b) => (ordem[b.prioridade] || 0) - (ordem[a.prioridade] || 0));

const agora = new Date();
const horaAtual = agora.toTimeString().slice(0,5);

let permitido = false;

for (const r of regras) {

  const hoje = new Date();
  let diaAtual = hoje.getDay();
  diaAtual = diaAtual === 0 ? 7 : diaAtual;

  let diasPermitidos = [];

  try {
    diasPermitidos = Array.isArray(r.dias_semana)
      ? r.dias_semana
      : JSON.parse(r.dias_semana || '[]');
  } catch {
    diasPermitidos = [];
  }

  const diaOk =
    diasPermitidos.length === 0 ||
    diasPermitidos.includes(diaAtual);

  const horarioOk =
    !r.horario_inicio ||
    (horaAtual >= r.horario_inicio && horaAtual <= r.horario_fim);

const grupoOk =
  !r.grupo_id ||
  r.grupo_id === grupoFuncionario;

const areaOk =
  !r.area_id ||
  r.area_id === areaAtual;

if (diaOk && horarioOk && grupoOk && areaOk) {
    permitido = true;
    break; // 🔥 PARA NA PRIMEIRA REGRA VÁLIDA (MAIOR PRIORIDADE)
  }
}

  // 🔥 VALIDA DIA DA SEMANA
  const hoje = new Date();
  let diaAtual = hoje.getDay(); // 0 = domingo

  diaAtual = diaAtual === 0 ? 7 : diaAtual; // transforma domingo em 7

  let diasPermitidos = [];

  try {
    diasPermitidos = Array.isArray(r.dias_semana)
      ? r.dias_semana
      : JSON.parse(r.dias_semana || '[]');
  } catch {
    diasPermitidos = [];
  }

  const diaOk =
    diasPermitidos.length === 0 ||
    diasPermitidos.includes(diaAtual);

  // 🔥 VALIDA HORÁRIO
  const horarioOk =
    !r.horario_inicio ||
    (horaAtual >= r.horario_inicio && horaAtual <= r.horario_fim);

  return diaOk && horarioOk;
});

      if (!r.horario_inicio || !r.horario_fim) return true;

      return horaAtual >= r.horario_inicio && horaAtual <= r.horario_fim;
    });

    if (!permitido) {
      resultado = 'negado';
      motivo = 'area_negada';
    }
  }

  // ============================================================
  // 🔥 VALIDAÇÕES DE CREDENCIAL (SÓ SE AINDA ESTIVER LIBERADO)
  // ============================================================

  if (resultado === 'liberado') {

    if (!credencial) {
      resultado = 'negado';
      motivo = 'sem_credencial';
    }

    else if (credencial.status !== 'ativa') {
      resultado = 'negado';
      motivo = 'bloqueada';
    }

    else if (credencial.validade) {

      const hoje = new Date();
      hoje.setHours(0,0,0,0);

      const validade = new Date(credencial.validade);
      validade.setHours(0,0,0,0);

      if (validade < hoje) {
        resultado = 'negado';
        motivo = 'vencida';
      }
    }
  }

  // ============================================================
  // 🔥 INSERE EVENTO (AGORA CORRETO)
  // ============================================================

  const { error } = await sb
    .from('acessos')
    .insert({
      funcionario_id: func.id,
      nome: func.nome,
      setor: func.cargo,
      catraca: `Catraca ${id}`,
      metodo: 'Manual',
      tipo: tipo,
      resultado: resultado,
      motivo: motivo,
      data: new Date().toISOString()
    });

  if (error) {
    console.error(error);
    alert('Erro ao registrar acesso');
    return;
  }

  console.log(`🚪 Acesso ${resultado.toUpperCase()}`);
}

window.liberarCatraca = liberarCatraca;