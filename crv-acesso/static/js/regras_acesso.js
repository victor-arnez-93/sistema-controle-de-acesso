/* =====================================================
   CRV CONTROLE DE ACESSO
   TELA: REGRAS DE ACESSO
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initModalRegra();
  initBusca();
});


/* =====================================================
   ABAS
   ===================================================== */

function initTabs() {
  const paineis = {
    regras:   'tab-regras',
    grupos:   'tab-grupos',
    horarios: 'tab-horarios',
    areas:    'tab-areas',
  };

  document.querySelectorAll('.regra-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active de todas as abas
      document.querySelectorAll('.regra-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Oculta todos os painéis
      Object.values(paineis).forEach(id => {
        document.getElementById(id).classList.add('regra-hidden');
      });

      // Exibe o painel correspondente
      const alvo = paineis[tab.dataset.tab];
      if (alvo) document.getElementById(alvo).classList.remove('regra-hidden');
    });
  });
}


/* =====================================================
   MODAL — NOVA REGRA
   ===================================================== */

function initModalRegra() {
  const overlay   = document.getElementById('modal-regra');
  const btnNova   = document.getElementById('btn-nova-regra');
  const btnNovaE  = document.getElementById('btn-nova-regra-empty');
  const btnFechar = document.getElementById('modal-regra-fechar');
  const btnCancel = document.getElementById('btn-regra-cancelar');
  const btnSalvar = document.getElementById('btn-regra-salvar');

  // Abrir
  const abrir = () => {
    limparModalRegra();
    overlay.classList.remove('regra-hidden');
    document.body.style.overflow = 'hidden';
  };

  if (btnNova)  btnNova.addEventListener('click', abrir);
  if (btnNovaE) btnNovaE.addEventListener('click', abrir);

  // Fechar
  const fechar = () => {
    overlay.classList.add('regra-hidden');
    document.body.style.overflow = '';
  };

  if (btnFechar) btnFechar.addEventListener('click', fechar);
  if (btnCancel) btnCancel.addEventListener('click', fechar);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) fechar();
  });

  // Preview horário em tempo real
  const horaInicio = document.getElementById('r-hora-inicio');
  const horaFim    = document.getElementById('r-hora-fim');

  if (horaInicio && horaFim) {
    [horaInicio, horaFim].forEach(el => {
      el.addEventListener('change', atualizarPreviewHorario);
    });
  }

  // Salvar
  btnSalvar.addEventListener('click', () => {
    if (!validarModalRegra()) return;
    // TODO: enviar ao backend via fetch
    console.log('Salvar regra:', coletarDadosRegra());
    fechar();
  });
}

function limparModalRegra() {
  ['r-nome', 'r-hora-inicio', 'r-hora-fim', 'r-obs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  ['r-tipo', 'r-prioridade', 'r-grupo', 'r-area', 'r-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.selectedIndex = 0;
  });

  // Resetar dias — seg a sex marcados por padrão
  document.querySelectorAll('.regra-dia input').forEach((cb, i) => {
    cb.checked = i < 5;
  });

  atualizarPreviewHorario();
}

function atualizarPreviewHorario() {
  const inicio = document.getElementById('r-hora-inicio')?.value || '--:--';
  const fim    = document.getElementById('r-hora-fim')?.value    || '--:--';

  const preview = document.querySelector('.regra-horario-preview');
  if (!preview) return;

  const blocos = preview.querySelectorAll('.regra-horario-preview-bloco');
  if (blocos[0]) blocos[0].textContent = inicio;
  if (blocos[1]) blocos[1].textContent = fim;
}

function validarModalRegra() {
  const nome = document.getElementById('r-nome')?.value.trim();
  const tipo = document.getElementById('r-tipo')?.value;

  if (!nome) {
    alert('Informe o nome da regra.');
    document.getElementById('r-nome')?.focus();
    return false;
  }

  if (!tipo) {
    alert('Selecione o tipo da regra.');
    document.getElementById('r-tipo')?.focus();
    return false;
  }

  return true;
}

function coletarDadosRegra() {
  const dias = [];
  document.querySelectorAll('.regra-dia input').forEach((cb, i) => {
    if (cb.checked) {
      dias.push(['seg','ter','qua','qui','sex','sab','dom'][i]);
    }
  });

  return {
    nome:       document.getElementById('r-nome')?.value.trim(),
    tipo:       document.getElementById('r-tipo')?.value,
    prioridade: document.getElementById('r-prioridade')?.value,
    grupo:      document.getElementById('r-grupo')?.value,
    area:       document.getElementById('r-area')?.value,
    horaInicio: document.getElementById('r-hora-inicio')?.value,
    horaFim:    document.getElementById('r-hora-fim')?.value,
    dias,
    obs:        document.getElementById('r-obs')?.value.trim(),
    status:     document.getElementById('r-status')?.value,
  };
}


/* =====================================================
   BUSCA (frontend — substituir por API com debounce)
   ===================================================== */

function initBusca() {
  const input = document.getElementById('busca-regras');
  if (!input) return;

  input.addEventListener('input', function () {
    // TODO: filtrar tabela ou chamar API com debounce
    console.log('Buscar regra:', this.value);
  });
}


/* =====================================================
   HELPERS EXPORTADOS
   (usados pelo backend ao injetar dados na tabela)
   ===================================================== */

/**
 * Renderiza uma linha na tabela de regras.
 * Chamado pelo backend após fetch da lista.
 * @param {Object} regra
 */
function renderLinhaRegra(regra) {
  const tbody = document.getElementById('regras-tbody');
  if (!tbody) return;

  const prioridade = {
    'Normal':  '<span class="badge badge-neutral">Normal</span>',
    'Alta':    '<span class="badge badge-warning">Alta</span>',
    'Crítica': '<span class="badge badge-danger">Crítica</span>',
  }[regra.prioridade] || '—';

  const status = regra.status === 'ativa'
    ? '<span class="badge badge-success">Ativa</span>'
    : '<span class="badge badge-neutral">Inativa</span>';

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <div style="font-weight:600;font-size:0.85rem;">${regra.nome}</div>
      <div class="text-sm text-muted">${regra.obs || ''}</div>
    </td>
    <td><span class="badge badge-info">${regra.tipo}</span></td>
    <td class="text-sm">${regra.grupo || '—'}</td>
    <td class="text-sm">${regra.area  || '—'}</td>
    <td class="text-sm" style="font-family:'Rajdhani',sans-serif;font-weight:600;">
      ${regra.horaInicio || '--:--'} → ${regra.horaFim || '--:--'}
    </td>
    <td>${prioridade}</td>
    <td>${status}</td>
    <td>
      <div style="display:flex;gap:4px;">
        <button class="btn btn-ghost btn-sm btn-icon" title="Editar"
          onclick="editarRegra('${regra.id}')">
          <i class="ph ph-pencil-simple"></i>
        </button>
        <button class="btn btn-danger btn-sm btn-icon" title="Excluir"
          onclick="excluirRegra('${regra.id}')">
          <i class="ph ph-trash"></i>
        </button>
      </div>
    </td>
  `;
  tbody.appendChild(tr);
}

/**
 * Exibe a tabela e oculta o estado vazio.
 * Chamar após renderizar todas as linhas.
 */
function mostrarTabelaRegras() {
  document.getElementById('regras-empty')?.classList.add('regra-hidden');
  document.getElementById('regras-table-wrap')?.classList.remove('regra-hidden');
}

function editarRegra(id) {
  // TODO: buscar dados do backend e abrir modal preenchido
  console.log('Editar regra:', id);
}

function excluirRegra(id) {
  // TODO: confirmar e chamar backend
  console.log('Excluir regra:', id);
}
