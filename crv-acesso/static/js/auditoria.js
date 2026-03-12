/* =====================================================
   CRV CONTROLE DE ACESSO
   TELA: AUDITORIA
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initFiltros();
  initModalDetalhe();
  initPaginacao();
  initAcoes();
  preencherDatas();
});


/* =====================================================
   FILTROS
   ===================================================== */

function initFiltros() {
  let debounce;

  document.getElementById('busca-audit')?.addEventListener('input', function () {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      // TODO: filtrar tabela ou chamar API
      console.log('Buscar audit:', this.value);
    }, 300);
  });

  ['filtro-modulo-audit', 'filtro-acao-audit', 'filtro-nivel-audit'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', function () {
      console.log(`Filtro ${id}:`, this.value);
      // TODO: chamar API com filtros combinados
    });
  });

  document.getElementById('filtro-data-ini-audit')?.addEventListener('change', function () {
    console.log('Data início:', this.value);
  });

  document.getElementById('filtro-data-fim-audit')?.addEventListener('change', function () {
    console.log('Data fim:', this.value);
  });
}

function preencherDatas() {
  const hoje = new Date().toISOString().split('T')[0];

  const ini = document.getElementById('filtro-data-ini-audit');
  const fim = document.getElementById('filtro-data-fim-audit');

  if (ini) ini.value = hoje;
  if (fim) fim.value = hoje;
}


/* =====================================================
   PAGINAÇÃO
   ===================================================== */

let paginaAtual = 1;
const itensPorPagina = 20;

function initPaginacao() {
  document.getElementById('audit-pag-ant')?.addEventListener('click', () => {
    if (paginaAtual <= 1) return;
    paginaAtual--;
    atualizarPagina();
  });

  document.getElementById('audit-pag-prox')?.addEventListener('click', () => {
    paginaAtual++;
    atualizarPagina();
  });
}

function atualizarPagina() {
  const info = document.getElementById('audit-pag-info');
  if (info) info.textContent = `Página ${paginaAtual}`;

  const btnAnt = document.getElementById('audit-pag-ant');
  if (btnAnt) btnAnt.disabled = paginaAtual <= 1;

  // TODO: chamar backend com offset = (paginaAtual - 1) * itensPorPagina
  console.log('Página:', paginaAtual);
}


/* =====================================================
   MODAL — DETALHE DO LOG
   ===================================================== */

function initModalDetalhe() {
  const overlay    = document.getElementById('modal-audit-detalhe');
  const btnFechar  = document.getElementById('modal-audit-fechar');
  const btnFechar2 = document.getElementById('btn-audit-fechar');
  const btnCopiar  = document.getElementById('btn-audit-copiar');

  const fechar = () => {
    overlay.classList.add('audit-hidden');
    document.body.style.overflow = '';
  };

  if (btnFechar)  btnFechar.addEventListener('click', fechar);
  if (btnFechar2) btnFechar2.addEventListener('click', fechar);

  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) fechar();
  });

  btnCopiar?.addEventListener('click', () => {
    const pre = document.querySelector('.audit-json-pre');
    if (!pre) return;
    navigator.clipboard.writeText(pre.textContent)
      .then(() => {
        btnCopiar.innerHTML = '<i class="ph ph-check"></i> Copiado!';
        setTimeout(() => {
          btnCopiar.innerHTML = '<i class="ph ph-copy"></i> Copiar JSON';
        }, 2000);
      })
      .catch(() => console.warn('Clipboard indisponível'));
  });
}

/**
 * Abre o modal com os detalhes de um log de auditoria.
 * @param {Object} log
 */
function abrirDetalheLog(log) {
  const overlay = document.getElementById('modal-audit-detalhe');
  const body    = document.getElementById('modal-audit-body');
  if (!overlay || !body) return;

  const nivelBadge = {
    info:    '<span class="audit-nivel-badge info"><i class="ph ph-info"></i>Info</span>',
    aviso:   '<span class="audit-nivel-badge aviso"><i class="ph ph-warning"></i>Aviso</span>',
    critico: '<span class="audit-nivel-badge critico"><i class="ph ph-warning-circle"></i>Crítico</span>',
  }[log.nivel] || '';

  const acaoBadge = gerarAcaoBadge(log.acao);

  const jsonPayload = log.payload
    ? JSON.stringify(log.payload, null, 2)
    : JSON.stringify({ info: 'Nenhum dado adicional registrado.' }, null, 2);

  body.innerHTML = `
    <div class="audit-detalhe-grid">
      <div class="audit-detalhe-row">
        <span class="audit-detalhe-label">Usuário</span>
        <div class="audit-user">
          <div class="audit-user-avatar" style="background:${log.avatarColor || 'var(--primary)'};">
            ${iniciais(log.usuario || '?')}
          </div>
          <span class="audit-detalhe-valor">${log.usuario || '—'}</span>
        </div>
      </div>
      <div class="audit-detalhe-row">
        <span class="audit-detalhe-label">Ação</span>
        <span class="audit-detalhe-valor">${acaoBadge}</span>
      </div>
      <div class="audit-detalhe-row">
        <span class="audit-detalhe-label">Módulo</span>
        <span class="audit-detalhe-valor">${log.modulo || '—'}</span>
      </div>
      <div class="audit-detalhe-row">
        <span class="audit-detalhe-label">Descrição</span>
        <span class="audit-detalhe-valor">${log.descricao || '—'}</span>
      </div>
      <div class="audit-detalhe-row">
        <span class="audit-detalhe-label">IP</span>
        <span class="audit-detalhe-valor" style="font-family:monospace;">${log.ip || '—'}</span>
      </div>
      <div class="audit-detalhe-row">
        <span class="audit-detalhe-label">Data / Hora</span>
        <span class="audit-detalhe-valor">${log.dataHora || '—'}</span>
      </div>
      <div class="audit-detalhe-row">
        <span class="audit-detalhe-label">Nível</span>
        <span class="audit-detalhe-valor">${nivelBadge}</span>
      </div>
      ${log.userAgent ? `
      <div class="audit-detalhe-row">
        <span class="audit-detalhe-label">User Agent</span>
        <span class="audit-detalhe-valor" style="font-size:0.75rem;color:var(--text-muted);">
          ${log.userAgent}
        </span>
      </div>` : ''}
    </div>

    <div class="audit-json-wrap">
      <div class="audit-json-titulo"><i class="ph ph-code"></i> Payload</div>
      <pre class="audit-json-pre">${escapeHtml(jsonPayload)}</pre>
    </div>
  `;

  overlay.classList.remove('audit-hidden');
  document.body.style.overflow = 'hidden';
}


/* =====================================================
   AÇÕES DO CABEÇALHO
   ===================================================== */

function initAcoes() {
  document.getElementById('btn-audit-exportar')?.addEventListener('click', () => {
    // TODO: chamar backend /api/auditoria/exportar
    console.log('Exportar auditoria');
  });

  document.getElementById('btn-audit-limpar')?.addEventListener('click', () => {
    const confirmado = confirm(
      'Deseja realmente limpar os logs com mais de 90 dias?\nEsta ação não pode ser desfeita.'
    );
    if (!confirmado) return;
    // TODO: chamar backend /api/auditoria/limpar
    console.log('Limpar logs antigos');
  });
}


/* =====================================================
   HELPERS EXPORTADOS
   (usados pelo backend ao injetar dados)
   ===================================================== */

/**
 * Renderiza uma linha na tabela de auditoria.
 * @param {Object} log
 */
function renderLinhaAudit(log) {
  const tbody = document.getElementById('audit-tbody');
  if (!tbody) return;

  const nivelBadge = {
    info:    '<span class="audit-nivel-badge info"><i class="ph ph-info"></i>Info</span>',
    aviso:   '<span class="audit-nivel-badge aviso"><i class="ph ph-warning"></i>Aviso</span>',
    critico: '<span class="audit-nivel-badge critico"><i class="ph ph-warning-circle"></i>Crítico</span>',
  }[log.nivel] || '—';

  const tr = document.createElement('tr');
  tr.style.cursor = 'pointer';
  tr.title = 'Clique para ver detalhes';

  tr.innerHTML = `
    <td>
      <div class="audit-user">
        <div class="audit-user-avatar"
          style="background:${log.avatarColor || 'var(--primary)'};">
          ${iniciais(log.usuario || '?')}
        </div>
        <span class="audit-user-nome">${log.usuario || '—'}</span>
      </div>
    </td>
    <td>${gerarAcaoBadge(log.acao)}</td>
    <td class="text-sm">${log.modulo || '—'}</td>
    <td class="text-sm text-muted" style="max-width:240px;overflow:hidden;
      text-overflow:ellipsis;white-space:nowrap;"
      title="${log.descricao || ''}">${log.descricao || '—'}</td>
    <td class="text-sm text-muted" style="font-family:monospace;">${log.ip || '—'}</td>
    <td class="text-sm text-muted">${log.dataHora || '—'}</td>
    <td>${nivelBadge}</td>
  `;

  tr.addEventListener('click', () => abrirDetalheLog(log));
  tbody.appendChild(tr);
}

/**
 * Adiciona um item ao resumo lateral do dia.
 * @param {Object} item — { hora, titulo, sub, cor }
 */
function renderResumoItem(item) {
  const lista = document.getElementById('audit-resumo-list');
  if (!lista) return;

  const el = document.createElement('div');
  el.className = 'audit-resumo-item';
  el.innerHTML = `
    <div class="audit-resumo-hora">${item.hora || ''}</div>
    <div class="audit-resumo-dot ${item.cor || 'muted'}"></div>
    <div class="audit-resumo-info">
      <div class="audit-resumo-titulo">${item.titulo || ''}</div>
      <div class="audit-resumo-sub">${item.sub || ''}</div>
    </div>
  `;
  lista.appendChild(el);
}

/**
 * Exibe a tabela e paginação, oculta estado vazio.
 * @param {number} total — total de registros
 * @param {number} totalPaginas
 */
function mostrarTabelaAudit(total, totalPaginas) {
  document.getElementById('audit-empty')?.classList.add('audit-hidden');
  document.getElementById('audit-table-wrap')?.classList.remove('audit-hidden');
  document.getElementById('audit-paginacao')?.classList.remove('audit-hidden');

  const label = document.getElementById('audit-total-label');
  if (label) label.textContent = `${total} registro${total !== 1 ? 's' : ''}`;

  const btnProx = document.getElementById('audit-pag-prox');
  if (btnProx) btnProx.disabled = paginaAtual >= totalPaginas;
}

/**
 * Atualiza o contador de KPI de ações do dia.
 * @param {Object} kpis — { acoes, usuarios, criticos, total }
 */
function atualizarKpisAudit(kpis) {
  const els = document.querySelectorAll('.kpi-value');
  if (!els.length) return;
  const valores = [kpis.acoes, kpis.usuarios, kpis.criticos, kpis.total];
  els.forEach((el, i) => {
    if (valores[i] !== undefined) el.textContent = valores[i];
  });
}


/* =====================================================
   UTILITÁRIOS INTERNOS
   ===================================================== */

function gerarAcaoBadge(acao) {
  if (!acao) return '—';
  const icones = {
    criar:    'ph-plus-circle',
    editar:   'ph-pencil-simple',
    excluir:  'ph-trash',
    login:    'ph-sign-in',
    logout:   'ph-sign-out',
    exportar: 'ph-file-arrow-down',
    acessar:  'ph-eye',
  };
  const chave = acao.toLowerCase();
  const icone = icones[chave] || 'ph-dot-outline';
  return `<span class="audit-acao-badge ${chave}">
    <i class="ph ${icone}"></i>${acao}
  </span>`;
}

function iniciais(nome) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
