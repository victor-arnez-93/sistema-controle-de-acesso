/* =====================================================
   CRV CONTROLE DE ACESSO
   TELA: RELATÓRIOS
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTipos();
  initPeriodo();
  initAcoes();
});


/* =====================================================
   TIPOS DE RELATÓRIO
   ===================================================== */

const TIPOS_CONFIG = {
  acesso: {
    label:   'Controle de Acesso',
    colunas: ['Funcionário', 'Matrícula', 'Catraca', 'Sentido', 'Método', 'Horário', 'Status'],
    extras:  [
      { id: 'rel-catraca', label: 'Catraca', tipo: 'select',
        opcoes: ['Todas', 'Portão Principal — Entrada', 'Portão Principal — Saída',
                 'Portão Lateral A', 'Portão Lateral B'] },
      { id: 'rel-status-acesso', label: 'Status', tipo: 'select',
        opcoes: ['Todos', 'Liberado', 'Negado'] },
    ],
  },
  presenca: {
    label:   'Presença de Funcionários',
    colunas: ['Funcionário', 'Setor', 'Turno', 'Entrada', 'Saída', 'Horas', 'Situação'],
    extras:  [
      { id: 'rel-turno', label: 'Turno', tipo: 'select',
        opcoes: ['Todos', 'Manhã', 'Tarde', 'Noite', 'Integral'] },
      { id: 'rel-situacao', label: 'Situação', tipo: 'select',
        opcoes: ['Todas', 'Presente', 'Ausente', 'Atrasado', 'Saída antecipada'] },
    ],
  },
  ocorrencias: {
    label:   'Ocorrências',
    colunas: ['Tipo', 'Prioridade', 'Funcionário', 'Local', 'Data/Hora', 'Responsável', 'Status'],
    extras:  [
      { id: 'rel-prioridade', label: 'Prioridade', tipo: 'select',
        opcoes: ['Todas', 'Crítica', 'Alta', 'Normal', 'Baixa'] },
      { id: 'rel-status-ocorr', label: 'Status', tipo: 'select',
        opcoes: ['Todos', 'Aberta', 'Em análise', 'Resolvida', 'Fechada'] },
    ],
  },
  equipamentos: {
    label:   'Equipamentos',
    colunas: ['Nome', 'Tipo', 'Localização', 'IP', 'Uptime', 'Último contato', 'Status'],
    extras:  [
      { id: 'rel-tipo-equip', label: 'Tipo', tipo: 'select',
        opcoes: ['Todos', 'Catraca', 'Leitor Facial', 'Leitor Biométrico', 'Controlador'] },
      { id: 'rel-status-equip', label: 'Status', tipo: 'select',
        opcoes: ['Todos', 'Online', 'Offline', 'Alerta', 'Manutenção'] },
    ],
  },
  visitantes: {
    label:   'Visitantes',
    colunas: ['Nome', 'Documento', 'Destino', 'Responsável', 'Entrada', 'Saída', 'Status'],
    extras:  [
      { id: 'rel-destino', label: 'Destino', tipo: 'text',
        placeholder: 'Todos os setores' },
    ],
  },
  auditoria: {
    label:   'Auditoria do Sistema',
    colunas: ['Usuário', 'Ação', 'Módulo', 'Descrição', 'IP', 'Data/Hora'],
    extras:  [
      { id: 'rel-modulo', label: 'Módulo', tipo: 'select',
        opcoes: ['Todos', 'Funcionários', 'Regras de Acesso', 'Equipamentos',
                 'Ocorrências', 'Relatórios', 'Configurações'] },
      { id: 'rel-acao-audit', label: 'Ação', tipo: 'select',
        opcoes: ['Todas', 'Criar', 'Editar', 'Excluir', 'Login', 'Logout'] },
    ],
  },
};

let tipoAtivo = 'acesso';

function initTipos() {
  document.querySelectorAll('.rel-tipo-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.rel-tipo-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      tipoAtivo = item.dataset.tipo;
      const config = TIPOS_CONFIG[tipoAtivo];
      if (!config) return;

      // Atualiza badge
      const badge = document.getElementById('rel-tipo-badge');
      if (badge) badge.textContent = config.label;

      // Atualiza campos extras
      renderCamposExtras(config.extras);

      // Limpa prévia
      ocultarPrevia();
    });
  });

  // Renderiza extras do tipo inicial
  renderCamposExtras(TIPOS_CONFIG[tipoAtivo].extras);
}

function renderCamposExtras(extras) {
  const wrap = document.getElementById('rel-campos-extras');
  if (!wrap) return;

  if (!extras || !extras.length) {
    wrap.innerHTML = '';
    return;
  }

  // Agrupa de 2 em 2 para manter grid
  const rows = [];
  for (let i = 0; i < extras.length; i += 2) {
    rows.push(extras.slice(i, i + 2));
  }

  wrap.innerHTML = rows.map(row => `
    <div class="rel-config-row">
      ${row.map(campo => `
        <div class="form-group">
          <label class="form-label">${campo.label}</label>
          ${campo.tipo === 'select'
            ? `<select class="form-control" id="${campo.id}">
                ${campo.opcoes.map(op => `<option>${op}</option>`).join('')}
               </select>`
            : `<input type="text" class="form-control" id="${campo.id}"
                 placeholder="${campo.placeholder || ''}">`
          }
        </div>
      `).join('')}
    </div>
  `).join('');
}


/* =====================================================
   PERÍODO PERSONALIZADO
   ===================================================== */

function initPeriodo() {
  const select = document.getElementById('rel-periodo');
  const custom = document.getElementById('rel-datas-custom');
  if (!select || !custom) return;

  select.addEventListener('change', () => {
    if (select.value === 'personalizado') {
      custom.classList.remove('rel-hidden');
    } else {
      custom.classList.add('rel-hidden');
    }
  });

  // Preenche datas padrão
  const hoje = new Date().toISOString().split('T')[0];
  const dataIni = document.getElementById('rel-data-ini');
  const dataFim = document.getElementById('rel-data-fim');
  if (dataIni) dataIni.value = hoje;
  if (dataFim) dataFim.value = hoje;
}


/* =====================================================
   AÇÕES — GERAR / PRÉ-VISUALIZAR / AGENDAR
   ===================================================== */

function initAcoes() {
  document.getElementById('btn-rel-previa')?.addEventListener('click', gerarPrevia);
  document.getElementById('btn-gerar')?.addEventListener('click', gerarRelatorio);
  document.getElementById('btn-rel-gerar')?.addEventListener('click', gerarRelatorio);
  document.getElementById('btn-agendar')?.addEventListener('click', abrirAgendamento);
  document.getElementById('btn-rel-agendar')?.addEventListener('click', abrirAgendamento);
}

function coletarFiltros() {
  const periodo = document.getElementById('rel-periodo')?.value;
  let dataIni = '', dataFim = '';

  if (periodo === 'personalizado') {
    dataIni = document.getElementById('rel-data-ini')?.value;
    dataFim = document.getElementById('rel-data-fim')?.value;
  } else {
    const range = calcularRange(periodo);
    dataIni = range.inicio;
    dataFim = range.fim;
  }

  return {
    tipo:        tipoAtivo,
    periodo,
    dataIni,
    dataFim,
    setor:       document.getElementById('rel-setor')?.value || '',
    funcionario: document.getElementById('rel-funcionario')?.value.trim() || '',
    formato:     document.getElementById('rel-formato')?.value || 'pdf',
  };
}

function calcularRange(periodo) {
  const hoje = new Date();
  const fmt  = (d) => d.toISOString().split('T')[0];

  switch (periodo) {
    case 'hoje':
      return { inicio: fmt(hoje), fim: fmt(hoje) };
    case 'ontem': {
      const d = new Date(hoje); d.setDate(d.getDate() - 1);
      return { inicio: fmt(d), fim: fmt(d) };
    }
    case 'semana': {
      const d = new Date(hoje);
      d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
      return { inicio: fmt(d), fim: fmt(hoje) };
    }
    case 'mes': {
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      return { inicio: fmt(d), fim: fmt(hoje) };
    }
    case 'mes_ant': {
      const ini = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      return { inicio: fmt(ini), fim: fmt(fim) };
    }
    default:
      return { inicio: fmt(hoje), fim: fmt(hoje) };
  }
}

function gerarPrevia() {
  const filtros = coletarFiltros();
  const config  = TIPOS_CONFIG[tipoAtivo];
  if (!config) return;

  const btn = document.getElementById('btn-rel-previa');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner"></i> Gerando...';
  }

  // TODO: chamar backend /api/relatorios/previa com filtros
  setTimeout(() => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-eye"></i> Pré-visualizar';
    }

    // Exibe prévia vazia (backend preencherá via renderLinhaPrevia)
    mostrarPrevia(filtros, config);
    console.log('Prévia solicitada:', filtros);
  }, 800);
}

function mostrarPrevia(filtros, config) {
  document.getElementById('rel-previa-empty')?.classList.add('rel-hidden');
  document.getElementById('rel-previa-content')?.classList.remove('rel-hidden');

  // Meta
  const meta = document.getElementById('rel-previa-meta');
  if (meta) {
    meta.innerHTML = `
      <span><strong>${config.label}</strong></span>
      <span>${filtros.dataIni} → ${filtros.dataFim}</span>
      <span>Setor: ${filtros.setor || 'Todos'}</span>
      <span>Gerado em: ${new Date().toLocaleString('pt-BR')}</span>
    `;
  }

  // Cabeçalho da tabela
  const thead = document.getElementById('rel-previa-thead');
  if (thead) {
    thead.innerHTML = `<tr>${config.colunas.map(c => `<th>${c}</th>`).join('')}</tr>`;
  }

  // Limpa body (backend vai preencher)
  const tbody = document.getElementById('rel-previa-tbody');
  if (tbody) tbody.innerHTML = '';

  const info = document.getElementById('rel-previa-info');
  if (info) info.textContent = `${config.label} · ${filtros.dataIni} a ${filtros.dataFim}`;

  const total = document.getElementById('rel-previa-total');
  if (total) total.innerHTML = '<strong>0</strong> registros encontrados';
}

function ocultarPrevia() {
  document.getElementById('rel-previa-empty')?.classList.remove('rel-hidden');
  document.getElementById('rel-previa-content')?.classList.add('rel-hidden');

  const info = document.getElementById('rel-previa-info');
  if (info) info.textContent = 'Configure e clique em pré-visualizar';
}

function gerarRelatorio() {
  const filtros = coletarFiltros();

  const btn = document.getElementById('btn-rel-gerar');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner"></i> Gerando...';
  }

  // TODO: chamar backend /api/relatorios/gerar e fazer download
  setTimeout(() => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-file-arrow-down"></i> Gerar e baixar';
    }
    console.log('Gerar relatório:', filtros);
  }, 1200);
}

function abrirAgendamento() {
  // TODO: abrir modal de agendamento de relatório automático
  console.log('Agendar relatório');
}


/* =====================================================
   HELPERS EXPORTADOS
   (usados pelo backend ao injetar dados)
   ===================================================== */

/**
 * Adiciona uma linha na tabela de prévia.
 * @param {Array} celulas — array de strings com os valores
 */
function renderLinhaPrevia(celulas) {
  const tbody = document.getElementById('rel-previa-tbody');
  if (!tbody) return;

  const tr = document.createElement('tr');
  tr.innerHTML = celulas.map(c => `<td class="text-sm">${c}</td>`).join('');
  tbody.appendChild(tr);

  // Atualiza contador
  const total = document.getElementById('rel-previa-total');
  if (total) {
    const qtd = tbody.querySelectorAll('tr').length;
    total.innerHTML = `<strong>${qtd}</strong> registro${qtd !== 1 ? 's' : ''} encontrado${qtd !== 1 ? 's' : ''}`;
  }
}

/**
 * Adiciona uma linha no histórico de relatórios.
 * @param {Object} rel
 */
function renderLinhaHistorico(rel) {
  const tbody = document.getElementById('rel-historico-tbody');
  if (!tbody) return;

  const formatos = {
    pdf:  '<span class="rel-formato-badge pdf"><i class="ph ph-file-pdf"></i>PDF</span>',
    xlsx: '<span class="rel-formato-badge xlsx"><i class="ph ph-file-xls"></i>XLSX</span>',
    csv:  '<span class="rel-formato-badge csv"><i class="ph ph-file-csv"></i>CSV</span>',
  };

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="font-weight:500;font-size:0.85rem;">${rel.tipo}</td>
    <td class="text-sm text-muted">${rel.periodo}</td>
    <td>${formatos[rel.formato] || rel.formato}</td>
    <td class="text-sm text-muted">${rel.geradoEm}</td>
    <td class="text-sm text-muted">${rel.geradoPor}</td>
    <td class="text-sm text-muted">${rel.tamanho || '—'}</td>
    <td>
      <div style="display:flex;gap:4px;">
        <button class="btn btn-ghost btn-sm btn-icon" title="Baixar"
          onclick="baixarRelatorio('${rel.id}')">
          <i class="ph ph-download-simple"></i>
        </button>
        <button class="btn btn-danger btn-sm btn-icon" title="Excluir"
          onclick="excluirHistorico('${rel.id}')">
          <i class="ph ph-trash"></i>
        </button>
      </div>
    </td>
  `;
  tbody.appendChild(tr);
}

/**
 * Exibe a tabela de histórico e oculta o estado vazio.
 */
function mostrarHistorico() {
  document.getElementById('rel-historico-empty')?.classList.add('rel-hidden');
  document.getElementById('rel-historico-wrap')?.classList.remove('rel-hidden');
}

function baixarRelatorio(id) {
  // TODO: chamar endpoint de download
  console.log('Baixar relatório:', id);
}

function excluirHistorico(id) {
  // TODO: confirmar e chamar backend
  console.log('Excluir histórico:', id);
}
