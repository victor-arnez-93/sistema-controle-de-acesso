/* =====================================================
   CRV CONTROLE DE ACESSO
   TELA: CONFIGURAÇÕES
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initTemas();
  initToggles();
  initIntegracao();
  initBackup();
  initAvancado();
  initAcoesCabecalho();
  carregarConfiguracoes();
});


/* =====================================================
   NAVEGAÇÃO LATERAL
   ===================================================== */

function initNav() {
  document.querySelectorAll('.cfg-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      // Remove active de todos
      document.querySelectorAll('.cfg-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Oculta todas as seções
      document.querySelectorAll('.cfg-secao').forEach(s => s.classList.add('cfg-hidden'));

      // Exibe seção correspondente
      const secao = document.getElementById(`secao-${item.dataset.secao}`);
      if (secao) secao.classList.remove('cfg-hidden');

      // Scroll suave para o topo do conteúdo
      document.querySelector('.cfg-conteudo')?.scrollIntoView({
        behavior: 'smooth', block: 'start'
      });
    });
  });
}


/* =====================================================
   TEMAS
   ===================================================== */

function initTemas() {
  document.querySelectorAll('.cfg-tema-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.cfg-tema-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      aplicarTema(item.dataset.tema);
    });
  });

  // Carrega tema salvo
  const temaSalvo = localStorage.getItem('crv-tema') || 'light';
  const itemAtivo = document.querySelector(`.cfg-tema-item[data-tema="${temaSalvo}"]`);
  if (itemAtivo) {
    document.querySelectorAll('.cfg-tema-item').forEach(i => i.classList.remove('active'));
    itemAtivo.classList.add('active');
  }
}

function aplicarTema(tema) {
  const html = document.documentElement;

  if (tema === 'system') {
    const prefereEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.setAttribute('data-theme', prefereEscuro ? 'dark' : 'light');
  } else {
    html.setAttribute('data-theme', tema);
  }

  localStorage.setItem('crv-tema', tema);
}


/* =====================================================
   TOGGLES — COMPORTAMENTO REATIVO
   ===================================================== */

function initToggles() {
  // Logout automático: habilita/desabilita select de inatividade
  const checkLogout  = document.getElementById('cfg-logout-auto');
  const selInativ    = document.getElementById('cfg-inatividade');

  checkLogout?.addEventListener('change', function () {
    if (selInativ) selInativ.disabled = !this.checked;
  });

  // Expiração de senha: habilita/desabilita select de prazo
  const checkExpira  = document.getElementById('cfg-senha-expira');
  const selPrazo     = document.getElementById('cfg-prazo-senha');

  checkExpira?.addEventListener('change', function () {
    if (selPrazo) selPrazo.disabled = !this.checked;
  });

  // Sincronização automática: habilita/desabilita select de intervalo
  const checkSync    = document.getElementById('cfg-sync-auto');
  const selIntervalo = document.getElementById('cfg-sync-intervalo');

  checkSync?.addEventListener('change', function () {
    if (selIntervalo) selIntervalo.disabled = !this.checked;
  });

  // Backup automático: habilita/desabilita selects de backup
  const checkBackup  = document.getElementById('cfg-backup-auto');
  const selFreq      = document.getElementById('cfg-backup-freq');
  const selRetencao  = document.getElementById('cfg-backup-retencao');

  checkBackup?.addEventListener('change', function () {
    if (selFreq)     selFreq.disabled     = !this.checked;
    if (selRetencao) selRetencao.disabled  = !this.checked;
  });

  // Densidade compacta
  document.getElementById('cfg-densidade')?.addEventListener('change', function () {
    document.documentElement.classList.toggle('density-compact', this.checked);
  });

  // Animações reduzidas
  document.getElementById('cfg-anim-reduzida')?.addEventListener('change', function () {
    document.documentElement.classList.toggle('reduce-motion', this.checked);
  });
}


/* =====================================================
   INTEGRAÇÃO — TESTAR CONEXÃO
   ===================================================== */

function initIntegracao() {
  document.getElementById('btn-testar-api')?.addEventListener('click', testarConexaoAPI);
}

function testarConexaoAPI() {
  const url    = document.getElementById('cfg-api-url')?.value.trim();
  const porta  = document.getElementById('cfg-api-porta')?.value.trim() || '80';
  const status = document.getElementById('cfg-api-status');
  const btn    = document.getElementById('btn-testar-api');

  if (!url) {
    alert('Informe a URL base da API antes de testar.');
    document.getElementById('cfg-api-url')?.focus();
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner"></i> Testando...';

  if (status) {
    status.className = 'cfg-integ-status testando';
    status.innerHTML = '<i class="ph ph-circle-notch"></i><span>Testando conexão...</span>';
  }

  // TODO: chamar backend /api/integracao/testar com url e porta
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-plug"></i> Testar conexão';

    // Simula sucesso — backend deve retornar resultado real
    const sucesso = Math.random() > 0.3;

    if (status) {
      if (sucesso) {
        status.className = 'cfg-integ-status ok';
        status.innerHTML = '<i class="ph ph-check-circle"></i><span>Conectado com sucesso</span>';
      } else {
        status.className = 'cfg-integ-status erro';
        status.innerHTML = '<i class="ph ph-x-circle"></i><span>Falha na conexão</span>';
      }
    }

    console.log(`Testar API: ${url}:${porta} — ${sucesso ? 'OK' : 'ERRO'}`);
  }, 1800);
}


/* =====================================================
   BACKUP
   ===================================================== */

function initBackup() {
  document.getElementById('btn-backup-agora')?.addEventListener('click', fazerBackup);
  document.getElementById('btn-backup-restaurar')?.addEventListener('click', restaurarBackup);
}

function fazerBackup() {
  const btn = document.getElementById('btn-backup-agora');
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner"></i> Gerando...';

  // TODO: chamar backend /api/backup/gerar
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-cloud-arrow-up"></i> Fazer backup agora';

    const agora = new Date().toLocaleString('pt-BR');
    const el    = document.getElementById('cfg-backup-ultimo');
    if (el) el.innerHTML = `<i class="ph ph-check-circle" style="color:var(--success);"></i> Último backup: ${agora}`;

    const elAvancado = document.getElementById('cfg-ultimo-backup');
    if (elAvancado) elAvancado.textContent = agora;

    console.log('Backup gerado:', agora);
  }, 2000);
}

function restaurarBackup() {
  const input = document.createElement('input');
  input.type  = 'file';
  input.accept = '.zip,.sql,.bak';
  input.onchange = (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    const confirma = confirm(`Deseja restaurar o backup "${arquivo.name}"?\nTodos os dados atuais serão substituídos.`);
    if (!confirma) return;
    // TODO: enviar arquivo ao backend /api/backup/restaurar
    console.log('Restaurar backup:', arquivo.name);
  };
  input.click();
}


/* =====================================================
   AVANÇADO — ZONA DE PERIGO
   ===================================================== */

function initAvancado() {
  document.getElementById('btn-limpar-logs')?.addEventListener('click', () => {
    const ok = confirm('Deseja realmente limpar todos os logs de auditoria?\nEsta ação não pode ser desfeita.');
    if (!ok) return;
    // TODO: chamar backend /api/auditoria/limpar-tudo
    console.log('Limpar todos os logs');
  });

  document.getElementById('btn-reset-cfg')?.addEventListener('click', () => {
    const ok = confirm('Deseja redefinir TODAS as configurações para os valores padrão?\nEsta ação não pode ser desfeita.');
    if (!ok) return;
    // TODO: chamar backend /api/configuracoes/resetar
    console.log('Redefinir configurações');
    location.reload();
  });

  document.getElementById('btn-limpar-base')?.addEventListener('click', () => {
    const confirmacao = prompt(
      'ATENÇÃO: Esta ação apagará permanentemente todos os dados.\n\nDigite CONFIRMAR para prosseguir:'
    );
    if (confirmacao !== 'CONFIRMAR') return;
    // TODO: chamar backend /api/sistema/limpar-base
    console.log('Limpar base de dados');
  });
}


/* =====================================================
   AÇÕES DO CABEÇALHO
   ===================================================== */

function initAcoesCabecalho() {
  document.getElementById('btn-cfg-salvar')?.addEventListener('click', salvarConfiguracoes);

  document.getElementById('btn-cfg-restaurar')?.addEventListener('click', () => {
    const ok = confirm('Deseja restaurar todas as configurações para os valores padrão?');
    if (!ok) return;
    // TODO: chamar backend
    console.log('Restaurar padrões');
    location.reload();
  });

  document.getElementById('btn-novo-operador')?.addEventListener('click', () => {
    // TODO: abrir modal de novo operador
    console.log('Novo operador');
  });
}


/* =====================================================
   CARREGAR / SALVAR CONFIGURAÇÕES
   ===================================================== */

function carregarConfiguracoes() {
  // TODO: buscar configurações do backend /api/configuracoes
  // e preencher os campos com os valores retornados.
  // Exemplo de estrutura esperada:
  // {
  //   empresa: { nome, cnpj, endereco, tel },
  //   regional: { fuso, dataFmt, idioma },
  //   comportamento: { logoutAuto, inatividade, somAlerta },
  //   aparencia: { tema, sidebarCollapsed, animReduzida, densidade },
  //   seguranca: { senhaForte, senhaExpira, prazoSenha, twofa, tentativas },
  //   notificacoes: { email, cc, negado, critico, offline, relatorio },
  //   integracao: { apiUrl, apiPorta, apiUsuario, syncAuto, syncIntervalo },
  //   backup: { auto, freq, retencao, ultimoBackup },
  // }
  console.log('Carregar configurações do backend');
}

function salvarConfiguracoes() {
  const btn = document.getElementById('btn-cfg-salvar');
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner"></i> Salvando...';

  const dados = coletarConfiguracoes();

  // TODO: enviar ao backend via PUT /api/configuracoes
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar alterações';
    console.log('Configurações salvas:', dados);
  }, 1000);
}

function coletarConfiguracoes() {
  const temaSel = document.querySelector('.cfg-tema-item.active')?.dataset.tema || 'light';

  return {
    empresa: {
      nome:      document.getElementById('cfg-empresa-nome')?.value.trim(),
      cnpj:      document.getElementById('cfg-empresa-cnpj')?.value.trim(),
      endereco:  document.getElementById('cfg-empresa-endereco')?.value.trim(),
      tel:       document.getElementById('cfg-empresa-tel')?.value.trim(),
    },
    regional: {
      fuso:      document.getElementById('cfg-fuso')?.value,
      dataFmt:   document.getElementById('cfg-data-fmt')?.value,
      idioma:    document.getElementById('cfg-idioma')?.value,
    },
    comportamento: {
      logoutAuto:  document.getElementById('cfg-logout-auto')?.checked,
      inatividade: document.getElementById('cfg-inatividade')?.value,
      somAlerta:   document.getElementById('cfg-som-alerta')?.checked,
    },
    aparencia: {
      tema:              temaSel,
      sidebarCollapsed:  document.getElementById('cfg-sidebar-collapsed')?.checked,
      animReduzida:      document.getElementById('cfg-anim-reduzida')?.checked,
      densidade:         document.getElementById('cfg-densidade')?.checked,
    },
    seguranca: {
      senhaForte:  document.getElementById('cfg-senha-forte')?.checked,
      senhaExpira: document.getElementById('cfg-senha-expira')?.checked,
      prazoSenha:  document.getElementById('cfg-prazo-senha')?.value,
      twofa:       document.getElementById('cfg-2fa')?.checked,
      tentativas:  document.getElementById('cfg-tentativas')?.value,
    },
    notificacoes: {
      email:     document.getElementById('cfg-email-notif')?.value.trim(),
      cc:        document.getElementById('cfg-email-cc')?.value.trim(),
      negado:    document.getElementById('cfg-notif-negado')?.checked,
      critico:   document.getElementById('cfg-notif-critico')?.checked,
      offline:   document.getElementById('cfg-notif-offline')?.checked,
      relatorio: document.getElementById('cfg-notif-relatorio')?.checked,
    },
    integracao: {
      apiUrl:        document.getElementById('cfg-api-url')?.value.trim(),
      apiPorta:      document.getElementById('cfg-api-porta')?.value.trim(),
      apiUsuario:    document.getElementById('cfg-api-usuario')?.value.trim(),
      syncAuto:      document.getElementById('cfg-sync-auto')?.checked,
      syncIntervalo: document.getElementById('cfg-sync-intervalo')?.value,
    },
    backup: {
      auto:      document.getElementById('cfg-backup-auto')?.checked,
      freq:      document.getElementById('cfg-backup-freq')?.value,
      retencao:  document.getElementById('cfg-backup-retencao')?.value,
    },
  };
}


/* =====================================================
   HELPERS EXPORTADOS
   (usados pelo backend ao injetar dados)
   ===================================================== */

/**
 * Preenche os campos com os dados vindos do backend.
 * @param {Object} cfg
 */
function preencherConfiguracoes(cfg) {
  if (!cfg) return;

  // Empresa
  if (cfg.empresa) {
    setValue('cfg-empresa-nome',     cfg.empresa.nome);
    setValue('cfg-empresa-cnpj',     cfg.empresa.cnpj);
    setValue('cfg-empresa-endereco', cfg.empresa.endereco);
    setValue('cfg-empresa-tel',      cfg.empresa.tel);
  }

  // Regional
  if (cfg.regional) {
    setValue('cfg-fuso',     cfg.regional.fuso);
    setValue('cfg-data-fmt', cfg.regional.dataFmt);
    setValue('cfg-idioma',   cfg.regional.idioma);
  }

  // Comportamento
  if (cfg.comportamento) {
    setChecked('cfg-logout-auto', cfg.comportamento.logoutAuto);
    setValue('cfg-inatividade',    cfg.comportamento.inatividade);
    setChecked('cfg-som-alerta',   cfg.comportamento.somAlerta);
  }

  // Aparência
  if (cfg.aparencia) {
    aplicarTema(cfg.aparencia.tema || 'light');
    const itemTema = document.querySelector(`.cfg-tema-item[data-tema="${cfg.aparencia.tema}"]`);
    if (itemTema) {
      document.querySelectorAll('.cfg-tema-item').forEach(i => i.classList.remove('active'));
      itemTema.classList.add('active');
    }
    setChecked('cfg-sidebar-collapsed', cfg.aparencia.sidebarCollapsed);
    setChecked('cfg-anim-reduzida',     cfg.aparencia.animReduzida);
    setChecked('cfg-densidade',         cfg.aparencia.densidade);
  }

  // Segurança
  if (cfg.seguranca) {
    setChecked('cfg-senha-forte',  cfg.seguranca.senhaForte);
    setChecked('cfg-senha-expira', cfg.seguranca.senhaExpira);
    setValue('cfg-prazo-senha',    cfg.seguranca.prazoSenha);
    setChecked('cfg-2fa',          cfg.seguranca.twofa);
    setValue('cfg-tentativas',     cfg.seguranca.tentativas);
  }

  // Notificações
  if (cfg.notificacoes) {
    setValue('cfg-email-notif',     cfg.notificacoes.email);
    setValue('cfg-email-cc',        cfg.notificacoes.cc);
    setChecked('cfg-notif-negado',  cfg.notificacoes.negado);
    setChecked('cfg-notif-critico', cfg.notificacoes.critico);
    setChecked('cfg-notif-offline', cfg.notificacoes.offline);
    setChecked('cfg-notif-relatorio', cfg.notificacoes.relatorio);
  }

  // Integração
  if (cfg.integracao) {
    setValue('cfg-api-url',         cfg.integracao.apiUrl);
    setValue('cfg-api-porta',       cfg.integracao.apiPorta);
    setValue('cfg-api-usuario',     cfg.integracao.apiUsuario);
    setChecked('cfg-sync-auto',     cfg.integracao.syncAuto);
    setValue('cfg-sync-intervalo',  cfg.integracao.syncIntervalo);
  }

  // Backup
  if (cfg.backup) {
    setChecked('cfg-backup-auto',   cfg.backup.auto);
    setValue('cfg-backup-freq',     cfg.backup.freq);
    setValue('cfg-backup-retencao', cfg.backup.retencao);

    if (cfg.backup.ultimoBackup) {
      const el = document.getElementById('cfg-backup-ultimo');
      if (el) el.innerHTML = `<i class="ph ph-clock"></i> Último backup: ${cfg.backup.ultimoBackup}`;
      const elAv = document.getElementById('cfg-ultimo-backup');
      if (elAv) elAv.textContent = cfg.backup.ultimoBackup;
    }
  }
}

/**
 * Renderiza uma linha na tabela de operadores.
 * @param {Object} op
 */
function renderLinhaOperador(op) {
  const tbody = document.getElementById('cfg-usuarios-tbody');
  if (!tbody) return;

  const statusBadge = op.ativo
    ? '<span class="badge badge-success">Ativo</span>'
    : '<span class="badge badge-neutral">Inativo</span>';

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:30px;height:30px;border-radius:50%;background:var(--primary);
          color:#fff;display:flex;align-items:center;justify-content:center;
          font-size:0.7rem;font-weight:700;flex-shrink:0;">
          ${iniciais(op.nome || '?')}
        </div>
        <div>
          <div style="font-weight:600;font-size:0.85rem;">${op.nome || '—'}</div>
          <div class="text-sm text-muted">${op.perfil || '—'}</div>
        </div>
      </div>
    </td>
    <td class="text-sm text-muted">${op.email || '—'}</td>
    <td><span class="badge badge-info">${op.perfil || '—'}</span></td>
    <td class="text-sm text-muted">${op.ultimoAcesso || '—'}</td>
    <td>${statusBadge}</td>
    <td>
      <div style="display:flex;gap:4px;">
        <button class="btn btn-ghost btn-sm btn-icon" title="Editar"
          onclick="editarOperador('${op.id}')">
          <i class="ph ph-pencil-simple"></i>
        </button>
        <button class="btn btn-danger btn-sm btn-icon" title="Remover"
          onclick="removerOperador('${op.id}')">
          <i class="ph ph-trash"></i>
        </button>
      </div>
    </td>
  `;
  tbody.appendChild(tr);
}

function mostrarTabelaOperadores() {
  document.getElementById('cfg-usuarios-empty')?.classList.add('cfg-hidden');
  document.getElementById('cfg-usuarios-table-wrap')?.classList.remove('cfg-hidden');
}

function editarOperador(id) {
  console.log('Editar operador:', id);
}

function removerOperador(id) {
  const ok = confirm('Deseja remover este operador do sistema?');
  if (!ok) return;
  console.log('Remover operador:', id);
}


/* =====================================================
   UTILITÁRIOS INTERNOS
   ===================================================== */

function setValue(id, valor) {
  const el = document.getElementById(id);
  if (el && valor !== undefined && valor !== null) el.value = valor;
}

function setChecked(id, valor) {
  const el = document.getElementById(id);
  if (el) el.checked = !!valor;
}

function iniciais(nome) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
}
