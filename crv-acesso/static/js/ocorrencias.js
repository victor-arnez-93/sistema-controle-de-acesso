/* =====================================================
   CRV CONTROLE DE ACESSO
   TELA: OCORRÊNCIAS
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initModalOcorr();
  initModalDetalhe();
  initFiltros();
  preencherDataAtual();
});


/* =====================================================
   ABAS
   ===================================================== */

function initTabs() {
  document.querySelectorAll('.ocorr-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ocorr-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // TODO: filtrar lista por status via backend
      console.log('Filtrar por:', tab.dataset.tab);
    });
  });
}


/* =====================================================
   MODAL — NOVA OCORRÊNCIA
   ===================================================== */

function initModalOcorr() {
  const overlay   = document.getElementById('modal-ocorr');
  const btnNova   = document.getElementById('btn-nova-ocorr');
  const btnNovaE  = document.getElementById('btn-nova-ocorr-empty');
  const btnFechar = document.getElementById('modal-ocorr-fechar');
  const btnCancel = document.getElementById('btn-ocorr-cancelar');
  const btnSalvar = document.getElementById('btn-ocorr-salvar');

  const abrir = () => {
    limparModalOcorr();
    overlay.classList.remove('ocorr-hidden');
    document.body.style.overflow = 'hidden';
  };

  const fechar = () => {
    overlay.classList.add('ocorr-hidden');
    document.body.style.overflow = '';
  };

  if (btnNova)   btnNova.addEventListener('click', abrir);
  if (btnNovaE)  btnNovaE.addEventListener('click', abrir);
  if (btnFechar) btnFechar.addEventListener('click', fechar);
  if (btnCancel) btnCancel.addEventListener('click', fechar);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) fechar();
  });

  btnSalvar.addEventListener('click', () => {
    if (!validarModalOcorr()) return;
    // TODO: enviar ao backend via fetch
    console.log('Salvar ocorrência:', coletarDadosOcorr());
    fechar();
  });
}

function limparModalOcorr() {
  ['o-funcionario', 'o-local', 'o-descricao', 'o-responsavel', 'o-obs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  ['o-tipo', 'o-prioridade', 'o-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.selectedIndex = 0;
  });

  // Preenche data/hora atual
  const dataEl = document.getElementById('o-data');
  if (dataEl) {
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    dataEl.value = agora.toISOString().slice(0, 16);
  }
}

function validarModalOcorr() {
  const tipo      = document.getElementById('o-tipo')?.value;
  const prioridade = document.getElementById('o-prioridade')?.value;
  const descricao = document.getElementById('o-descricao')?.value.trim();

  if (!tipo) {
    alert('Selecione o tipo de ocorrência.');
    document.getElementById('o-tipo')?.focus();
    return false;
  }

  if (!prioridade) {
    alert('Selecione a prioridade.');
    document.getElementById('o-prioridade')?.focus();
    return false;
  }

  if (!descricao) {
    alert('Informe a descrição da ocorrência.');
    document.getElementById('o-descricao')?.focus();
    return false;
  }

  return true;
}

function coletarDadosOcorr() {
  return {
    tipo:         document.getElementById('o-tipo')?.value,
    prioridade:   document.getElementById('o-prioridade')?.value,
    funcionario:  document.getElementById('o-funcionario')?.value.trim(),
    local:        document.getElementById('o-local')?.value.trim(),
    descricao:    document.getElementById('o-descricao')?.value.trim(),
    data:         document.getElementById('o-data')?.value,
    status:       document.getElementById('o-status')?.value,
    responsavel:  document.getElementById('o-responsavel')?.value.trim(),
    obs:          document.getElementById('o-obs')?.value.trim(),
  };
}


/* =====================================================
   MODAL — DETALHE DA OCORRÊNCIA
   ===================================================== */

function initModalDetalhe() {
  const overlay    = document.getElementById('modal-ocorr-detalhe');
  const btnFechar  = document.getElementById('modal-detalhe-fechar');
  const btnFechar2 = document.getElementById('btn-detalhe-fechar');
  const btnEditar  = document.getElementById('btn-detalhe-editar');
  const btnResolver = document.getElementById('btn-detalhe-resolver');

  const fechar = () => {
    overlay.classList.add('ocorr-hidden');
    document.body.style.overflow = '';
  };

  if (btnFechar)  btnFechar.addEventListener('click', fechar);
  if (btnFechar2) btnFechar2.addEventListener('click', fechar);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) fechar();
  });

  if (btnEditar) {
    btnEditar.addEventListener('click', () => {
      // TODO: abrir modal de edição com dados preenchidos
      console.log('Editar ocorrência');
    });
  }

  if (btnResolver) {
    btnResolver.addEventListener('click', () => {
      // TODO: chamar backend para resolver
      console.log('Resolver ocorrência');
      fechar();
    });
  }
}

/**
 * Abre o modal de detalhe com os dados da ocorrência.
 * @param {Object} ocorr
 */
function abrirDetalheOcorr(ocorr) {
  const overlay = document.getElementById('modal-ocorr-detalhe');
  const body    = document.getElementById('modal-detalhe-body');

  const corPrioridade = {
    'Crítica': 'danger',
    'Alta':    'warning',
    'Normal':  'normal',
    'Baixa':   'baixa',
  }[ocorr.prioridade] || 'normal';

  const icones = {
    'Acesso negado':          'ph-x-circle',
    'Uso indevido':           'ph-warning',
    'Equipamento offline':    'ph-wifi-slash',
    'Saída fora do horário':  'ph-clock',
    'Tentativa suspeita':     'ph-shield-warning',
    'Outro':                  'ph-warning-circle',
  };

  const icone = icones[ocorr.tipo] || 'ph-warning-circle';

  body.innerHTML = `
    <div class="ocorr-detalhe-header">
      <div class="ocorr-detalhe-icon ocorr-item-icon ${corPrioridade}">
        <i class="ph ${icone}"></i>
      </div>
      <div class="ocorr-detalhe-info">
        <div class="ocorr-detalhe-titulo">${ocorr.tipo}</div>
        <div class="ocorr-detalhe-badges">
          <span class="ocorr-prioridade-badge ${corPrioridade}">${ocorr.prioridade}</span>
          <span class="ocorr-status-badge ${ocorr.status}">${ocorr.statusLabel || ocorr.status}</span>
        </div>
      </div>
    </div>

    <div class="modal-section-title">Detalhes</div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
      <div style="display:flex;gap:10px;font-size:0.83rem;">
        <span style="color:var(--text-muted);min-width:110px;">Funcionário</span>
        <span style="color:var(--text-primary);font-weight:500;">${ocorr.funcionario || '—'}</span>
      </div>
      <div style="display:flex;gap:10px;font-size:0.83rem;">
        <span style="color:var(--text-muted);min-width:110px;">Local / Área</span>
        <span style="color:var(--text-primary);font-weight:500;">${ocorr.local || '—'}</span>
      </div>
      <div style="display:flex;gap:10px;font-size:0.83rem;">
        <span style="color:var(--text-muted);min-width:110px;">Data / Hora</span>
        <span style="color:var(--text-primary);font-weight:500;">${ocorr.data || '—'}</span>
      </div>
      <div style="display:flex;gap:10px;font-size:0.83rem;">
        <span style="color:var(--text-muted);min-width:110px;">Responsável</span>
        <span style="color:var(--text-primary);font-weight:500;">${ocorr.responsavel || '—'}</span>
      </div>
      <div style="display:flex;gap:10px;font-size:0.83rem;">
        <span style="color:var(--text-muted);min-width:110px;">Descrição</span>
        <span style="color:var(--text-secondary);line-height:1.6;">${ocorr.descricao || '—'}</span>
      </div>
    </div>

    <div class="modal-section-title">Histórico</div>
    <div class="ocorr-timeline" id="ocorr-timeline-detalhe">
      ${renderTimeline(ocorr.timeline || [])}
    </div>
  `;

  overlay.classList.remove('ocorr-hidden');
  document.body.style.overflow = 'hidden';
}

function renderTimeline(eventos) {
  if (!eventos.length) {
    return `<p style="font-size:0.8rem;color:var(--text-muted);padding:10px 0;">
      Nenhuma ação registrada ainda.
    </p>`;
  }

  return eventos.map(ev => `
    <div class="ocorr-timeline-item">
      <div class="ocorr-timeline-dot-wrap">
        <div class="ocorr-timeline-dot ${ev.cor || ''}"></div>
        <div class="ocorr-timeline-line"></div>
      </div>
      <div class="ocorr-timeline-content">
        <div class="ocorr-timeline-acao">${ev.acao}</div>
        <div class="ocorr-timeline-meta">
          <span>${ev.usuario || '—'}</span>
          <span>${ev.hora || '—'}</span>
        </div>
      </div>
    </div>
  `).join('');
}


/* =====================================================
   FILTROS
   ===================================================== */

function initFiltros() {
  let debounce;

  document.getElementById('busca-ocorr')?.addEventListener('input', function () {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      // TODO: filtrar lista ou chamar API
      console.log('Buscar ocorrência:', this.value);
    }, 300);
  });

  document.getElementById('filtro-tipo-ocorr')?.addEventListener('change', function () {
    console.log('Filtro tipo:', this.value);
  });

  document.getElementById('filtro-prioridade-ocorr')?.addEventListener('change', function () {
    console.log('Filtro prioridade:', this.value);
  });

  document.getElementById('filtro-data-ocorr')?.addEventListener('change', function () {
    console.log('Filtro data:', this.value);
  });
}


/* =====================================================
   HELPERS — DATA ATUAL
   ===================================================== */

function preencherDataAtual() {
  const dataEl = document.getElementById('filtro-data-ocorr');
  if (dataEl) {
    dataEl.value = new Date().toISOString().split('T')[0];
  }
}


/* =====================================================
   HELPERS EXPORTADOS
   (usados pelo backend ao injetar dados)
   ===================================================== */

/**
 * Renderiza um item na lista de ocorrências.
 * @param {Object} ocorr
 */
function renderItemOcorr(ocorr) {
  const lista = document.getElementById('ocorr-list');
  if (!lista) return;

  const corPrioridade = {
    'Crítica': 'critica',
    'Alta':    'alta',
    'Normal':  'normal',
    'Baixa':   'baixa',
  }[ocorr.prioridade] || 'normal';

  const icones = {
    'Acesso negado':         'ph-x-circle',
    'Uso indevido':          'ph-warning',
    'Equipamento offline':   'ph-wifi-slash',
    'Saída fora do horário': 'ph-clock',
    'Tentativa suspeita':    'ph-shield-warning',
    'Outro':                 'ph-warning-circle',
  };

  const icone = icones[ocorr.tipo] || 'ph-warning-circle';

  const statusLabels = {
    aberta:    '<span class="ocorr-status-badge aberta">Aberta</span>',
    analise:   '<span class="ocorr-status-badge analise">Em análise</span>',
    resolvida: '<span class="ocorr-status-badge resolvida">Resolvida</span>',
    fechada:   '<span class="ocorr-status-badge fechada">Fechada</span>',
  };

  const item = document.createElement('div');
  item.className = `ocorr-item ${corPrioridade}`;
  item.innerHTML = `
    <div class="ocorr-item-icon ${corPrioridade}">
      <i class="ph ${icone}"></i>
    </div>
    <div class="ocorr-item-body">
      <div class="ocorr-item-header">
        <span class="ocorr-item-titulo">${ocorr.tipo}</span>
        <span class="ocorr-prioridade-badge ${corPrioridade}">${ocorr.prioridade}</span>
        ${statusLabels[ocorr.status] || ''}
      </div>
      <div class="ocorr-item-desc">${ocorr.descricao || '—'}</div>
      <div class="ocorr-item-meta">
        <span><i class="ph ph-user"></i>${ocorr.funcionario || 'Sem vínculo'}</span>
        <span><i class="ph ph-map-pin"></i>${ocorr.local || '—'}</span>
        <span><i class="ph ph-user-gear"></i>${ocorr.responsavel || 'Sem responsável'}</span>
      </div>
    </div>
    <div class="ocorr-item-actions">
      <div class="ocorr-item-hora">${ocorr.hora || '—'}</div>
      <div class="ocorr-item-btns">
        <button class="btn btn-ghost btn-sm btn-icon" title="Ver detalhes"
          onclick='abrirDetalheOcorr(${JSON.stringify(ocorr)})'>
          <i class="ph ph-eye"></i>
        </button>
        <button class="btn btn-ghost btn-sm btn-icon" title="Editar"
          onclick="editarOcorr('${ocorr.id}')">
          <i class="ph ph-pencil-simple"></i>
        </button>
        <button class="btn btn-danger btn-sm btn-icon" title="Excluir"
          onclick="excluirOcorr('${ocorr.id}')">
          <i class="ph ph-trash"></i>
        </button>
      </div>
    </div>
  `;

  lista.appendChild(item);
}

/**
 * Exibe a lista e oculta o estado vazio.
 */
function mostrarListaOcorr() {
  document.getElementById('ocorr-empty')?.classList.add('ocorr-hidden');
  document.getElementById('ocorr-list')?.classList.remove('ocorr-hidden');
}

function editarOcorr(id) {
  // TODO: buscar dados do backend e abrir modal preenchido
  console.log('Editar ocorrência:', id);
}

function excluirOcorr(id) {
  // TODO: confirmar e chamar backend
  console.log('Excluir ocorrência:', id);
}
