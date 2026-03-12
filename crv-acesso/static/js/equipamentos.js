/* =====================================================
   CRV CONTROLE DE ACESSO
   TELA: EQUIPAMENTOS
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initViewToggle();
  initModalEquip();
  initTipoEquip();
  initBusca();
});


/* =====================================================
   ALTERNÂNCIA DE VIEW (cards / tabela)
   ===================================================== */

function initViewToggle() {
  const btnCards  = document.getElementById('btn-view-cards');
  const btnTabela = document.getElementById('btn-view-tabela');
  const viewCards = document.getElementById('view-equip-cards');
  const viewTab   = document.getElementById('view-equip-tabela');

  btnCards.addEventListener('click', () => {
    btnCards.classList.add('active');
    btnTabela.classList.remove('active');
    viewCards.classList.remove('equip-hidden');
    viewTab.classList.add('equip-hidden');
  });

  btnTabela.addEventListener('click', () => {
    btnTabela.classList.add('active');
    btnCards.classList.remove('active');
    viewTab.classList.remove('equip-hidden');
    viewCards.classList.add('equip-hidden');
  });
}


/* =====================================================
   MODAL — NOVO EQUIPAMENTO
   ===================================================== */

function initModalEquip() {
  const overlay   = document.getElementById('modal-equip');
  const btnNovo   = document.getElementById('btn-novo-equip');
  const btnNovoE  = document.getElementById('btn-novo-equip-empty');
  const btnFechar = document.getElementById('modal-equip-fechar');
  const btnCancel = document.getElementById('btn-equip-cancelar');
  const btnSalvar = document.getElementById('btn-equip-salvar');
  const btnTestar = document.getElementById('btn-equip-testar');

  const abrir = () => {
    limparModalEquip();
    overlay.classList.remove('equip-hidden');
    document.body.style.overflow = 'hidden';
  };

  const fechar = () => {
    overlay.classList.add('equip-hidden');
    document.body.style.overflow = '';
  };

  if (btnNovo)   btnNovo.addEventListener('click', abrir);
  if (btnNovoE)  btnNovoE.addEventListener('click', abrir);
  if (btnFechar) btnFechar.addEventListener('click', fechar);
  if (btnCancel) btnCancel.addEventListener('click', fechar);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) fechar();
  });

  btnTestar.addEventListener('click', () => testarConexao());

  btnSalvar.addEventListener('click', () => {
    if (!validarModalEquip()) return;
    // TODO: enviar ao backend via fetch
    console.log('Salvar equipamento:', coletarDadosEquip());
    fechar();
  });
}

function limparModalEquip() {
  ['e-nome','e-modelo','e-serie','e-local',
   'e-ip','e-porta','e-usuario','e-firmware','e-obs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const senha = document.getElementById('e-senha');
  if (senha) senha.value = '';

  ['e-sentido','e-area','e-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.selectedIndex = 0;
  });

  document.querySelectorAll('.equip-tipo-item').forEach(i => i.classList.remove('selected'));

  // Porta padrão
  const porta = document.getElementById('e-porta');
  if (porta) porta.value = '80';
}

function validarModalEquip() {
  const nome  = document.getElementById('e-nome')?.value.trim();
  const local = document.getElementById('e-local')?.value.trim();
  const ip    = document.getElementById('e-ip')?.value.trim();

  if (!nome) {
    alert('Informe o nome do equipamento.');
    document.getElementById('e-nome')?.focus();
    return false;
  }

  if (!local) {
    alert('Informe a localização do equipamento.');
    document.getElementById('e-local')?.focus();
    return false;
  }

  if (!ip) {
    alert('Informe o endereço IP do equipamento.');
    document.getElementById('e-ip')?.focus();
    return false;
  }

  if (!validarIP(ip)) {
    alert('Endereço IP inválido.');
    document.getElementById('e-ip')?.focus();
    return false;
  }

  return true;
}

function coletarDadosEquip() {
  const tipoSel = document.querySelector('.equip-tipo-item.selected');
  return {
    tipo:     tipoSel?.dataset.tipo || '',
    nome:     document.getElementById('e-nome')?.value.trim(),
    modelo:   document.getElementById('e-modelo')?.value.trim(),
    serie:    document.getElementById('e-serie')?.value.trim(),
    local:    document.getElementById('e-local')?.value.trim(),
    ip:       document.getElementById('e-ip')?.value.trim(),
    porta:    document.getElementById('e-porta')?.value.trim() || '80',
    usuario:  document.getElementById('e-usuario')?.value.trim(),
    sentido:  document.getElementById('e-sentido')?.value,
    area:     document.getElementById('e-area')?.value,
    firmware: document.getElementById('e-firmware')?.value.trim(),
    status:   document.getElementById('e-status')?.value,
    obs:      document.getElementById('e-obs')?.value.trim(),
  };
}

function testarConexao() {
  const ip    = document.getElementById('e-ip')?.value.trim();
  const porta = document.getElementById('e-porta')?.value.trim() || '80';

  if (!ip) {
    alert('Informe o IP antes de testar a conexão.');
    return;
  }

  const btn = document.getElementById('btn-equip-testar');
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner"></i> Testando...';

  // TODO: chamar endpoint backend /api/equipamentos/testar-conexao
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-plug"></i> Testar conexão';
    console.log(`Testar conexão: ${ip}:${porta}`);
  }, 2000);
}


/* =====================================================
   SELEÇÃO DE TIPO NO MODAL
   ===================================================== */

function initTipoEquip() {
  document.querySelectorAll('.equip-tipo-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.equip-tipo-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
    });
  });
}


/* =====================================================
   BUSCA
   ===================================================== */

function initBusca() {
  const input = document.getElementById('busca-equip');
  if (!input) return;

  let debounce;
  input.addEventListener('input', function () {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      // TODO: filtrar cards/tabela ou chamar API
      console.log('Buscar equipamento:', this.value);
    }, 300);
  });

  document.getElementById('filtro-tipo-equip')?.addEventListener('change', function () {
    // TODO: filtrar por tipo
    console.log('Filtro tipo:', this.value);
  });

  document.getElementById('filtro-status-equip')?.addEventListener('change', function () {
    // TODO: filtrar por status
    console.log('Filtro status:', this.value);
  });
}


/* =====================================================
   HELPERS EXPORTADOS
   (usados pelo backend ao injetar dados)
   ===================================================== */

const EQUIP_ICONES = {
  catraca:     'ph-git-branch',
  facial:      'ph-scan',
  biometrico:  'ph-fingerprint',
  controlador: 'ph-cpu',
  camera:      'ph-camera',
  outro:       'ph-cube',
};

/**
 * Renderiza um card de equipamento na grid.
 * @param {Object} equip
 */
function renderCardEquip(equip) {
  const grid = document.getElementById('equip-cards-grid');
  if (!grid) return;

  const icone  = EQUIP_ICONES[equip.tipo] || 'ph-cube';
  const status = equip.status || 'offline';

  const labels = {
    online:     '<span class="equip-status-badge online"><i class="ph ph-circle-fill"></i>Online</span>',
    offline:    '<span class="equip-status-badge offline"><i class="ph ph-circle-fill"></i>Offline</span>',
    alerta:     '<span class="equip-status-badge alerta"><i class="ph ph-warning"></i>Alerta</span>',
    manutencao: '<span class="equip-status-badge manutencao"><i class="ph ph-wrench"></i>Manutenção</span>',
  };

  const card = document.createElement('div');
  card.className = `equip-card ${status}`;
  card.innerHTML = `
    <div class="equip-card-header">
      <div class="equip-card-icon-wrap">
        <i class="ph ${icone}"></i>
      </div>
      <div class="equip-card-titulo">
        <div class="equip-card-nome">${equip.nome}</div>
        <div class="equip-card-modelo">${equip.modelo || '—'}</div>
      </div>
      <div class="equip-status-dot ${status}"></div>
    </div>
    <div class="equip-card-body">
      <div class="equip-card-info-row">
        <i class="ph ph-map-pin"></i>
        <span>${equip.local || '—'}</span>
      </div>
      <div class="equip-card-info-row">
        <i class="ph ph-network"></i>
        <span>${equip.ip || '—'}:${equip.porta || '80'}</span>
      </div>
      <div class="equip-card-info-row">
        <i class="ph ph-arrow-u-up-right"></i>
        <span>${equip.sentido || '—'}</span>
      </div>
      <div class="equip-card-info-row">
        <i class="ph ph-hard-drive"></i>
        <span>Firmware ${equip.firmware || '—'}</span>
      </div>
    </div>
    <div class="equip-card-footer">
      <div class="equip-card-ultimo">
        <i class="ph ph-clock"></i>
        ${equip.ultimoContato || 'Sem contato'}
      </div>
      <div class="equip-card-actions">
        ${labels[status]}
        <button class="btn btn-ghost btn-sm btn-icon" title="Editar"
          onclick="editarEquip('${equip.id}')">
          <i class="ph ph-pencil-simple"></i>
        </button>
        <button class="btn btn-ghost btn-sm btn-icon" title="Ver logs"
          onclick="verLogsEquip('${equip.id}')">
          <i class="ph ph-list-magnifying-glass"></i>
        </button>
      </div>
    </div>
  `;

  grid.appendChild(card);
}

/**
 * Exibe a grid e oculta o estado vazio.
 * Chamar após renderizar todos os cards.
 */
function mostrarGridEquip() {
  document.getElementById('equip-empty')?.classList.add('equip-hidden');
  document.getElementById('equip-cards-grid')?.classList.remove('equip-hidden');
}

function editarEquip(id) {
  // TODO: buscar dados do backend e abrir modal preenchido
  console.log('Editar equipamento:', id);
}

function verLogsEquip(id) {
  // TODO: navegar para monitoramento filtrado por equipamento
  console.log('Ver logs do equipamento:', id);
}

/* ---- Validação de IP ---- */
function validarIP(ip) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
    ip.split('.').every(n => parseInt(n) <= 255);
}
