/* =====================================================
   CRV CONTROLE DE ACESSO
   TELA: CONFIGURAÇÕES
   ===================================================== */
function iniciarConfiguracoes() {
  initNav();
  initTemas();
  initToggles();
  initLogo();
  initIntegracao();
  initBackup();
  initAvancado();
  initAcoesCabecalho();
  initModalOperador();
  carregarConfiguracoes();
  carregarOperadores();
  initMascaras();
}

if (window._crvPronto) {
  iniciarConfiguracoes();
} else {
  document.addEventListener('crv:pronto', iniciarConfiguracoes);
}

/* =====================================================
   NAVEGAÇÃO LATERAL
   ===================================================== */

function initNav() {
  document.querySelectorAll('.cfg-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.cfg-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.cfg-secao').forEach(s => s.classList.add('cfg-hidden'));
      const secao = document.getElementById(`secao-${item.dataset.secao}`);
      if (secao) secao.classList.remove('cfg-hidden');
      document.querySelector('.cfg-conteudo')?.scrollTo({ top: 0, behavior: 'smooth' });
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
}

function aplicarTema(tema) {
  document.documentElement.setAttribute('data-theme', tema || 'dark');
}

function marcarTemaAtivo(tema) {
  document.querySelectorAll('.cfg-tema-item').forEach(i => i.classList.remove('active'));
  const el = document.querySelector(`.cfg-tema-item[data-tema="${tema}"]`);
  if (el) el.classList.add('active');
}


/* =====================================================
   LOGO DA EMPRESA
   ===================================================== */

function initLogo() {
  const input  = document.getElementById('cfg-logo-input');
  const btnRem = document.getElementById('btn-remover-logo');

  input?.addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setLogoStatus('Arquivo muito grande. Máximo: 2MB.', 'erro');
      return;
    }

    setLogoStatus('Enviando...', 'info');

    const supabase = window.getSupabase();
    const ext  = file.name.split('.').pop().toLowerCase();
    const path = `logos/logo_empresa_${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('crv-assets')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setLogoStatus('Erro ao enviar: ' + upErr.message, 'erro');
      return;
    }

    const { data: urlData } = supabase.storage.from('crv-assets').getPublicUrl(path);

    await salvarChave('aparencia', {
      ...((await lerChave('aparencia')) || {}),
      logoUrl: urlData.publicUrl,
    });

    exibirLogoPreview(urlData.publicUrl);
    aplicarLogoHeader(urlData.publicUrl);
    setLogoStatus('Logo enviado com sucesso!', 'ok');

    await registrarAuditoria({
      acao: 'editar', modulo: 'configuracoes', tabela: 'configuracoes',
      descricao: 'Logo da empresa atualizado', nivel: 'info',
    });
  });

  btnRem?.addEventListener('click', async () => {
    if (!confirm('Deseja remover o logo da empresa?')) return;

    const supabase = window.getSupabase();
    await supabase.storage.from('crv-assets').remove([
      'logos/logo_empresa.png',
      'logos/logo_empresa.jpg',
      'logos/logo_empresa.svg',
    ]);

    const atual = (await lerChave('aparencia')) || {};
    delete atual.logoUrl;
    await salvarChave('aparencia', atual);

    aplicarLogoHeader(null);
    ocultarLogoPreview();
    setLogoStatus('Logo removido.', 'ok');

    await registrarAuditoria({
      acao: 'editar', modulo: 'configuracoes', tabela: 'configuracoes',
      descricao: 'Logo da empresa removido', nivel: 'aviso',
    });
  });
}

function exibirLogoPreview(url) {
  const img         = document.getElementById('cfg-logo-img');
  const placeholder = document.getElementById('cfg-logo-placeholder');
  const btnRem      = document.getElementById('btn-remover-logo');
  if (img)         { img.src = url; img.style.display = 'block'; }
  if (placeholder) placeholder.style.display = 'none';
  if (btnRem)      btnRem.style.display = '';
}

function ocultarLogoPreview() {
  const img         = document.getElementById('cfg-logo-img');
  const placeholder = document.getElementById('cfg-logo-placeholder');
  const btnRem      = document.getElementById('btn-remover-logo');
  if (img)         { img.src = ''; img.style.display = 'none'; }
  if (placeholder) placeholder.style.display = '';
  if (btnRem)      btnRem.style.display = 'none';
}

function setLogoStatus(msg, tipo) {
  const el = document.getElementById('cfg-logo-status');
  if (!el) return;
  const cores = { ok: 'var(--success)', erro: 'var(--danger)', info: 'var(--text-muted)' };
  el.style.color = cores[tipo] || 'var(--text-muted)';
  el.textContent = msg;
}

function aplicarLogoHeader(logoUrl) {
  const logoWrap = document.querySelector('[data-logo-empresa]');
  if (!logoWrap) return;
  if (logoUrl) {
    logoWrap.innerHTML = `<img src="${logoUrl}" alt="Logo da empresa"
      style="height:40px;max-width:180px;object-fit:contain;">`;
  } else {
    logoWrap.innerHTML = logoWrap.dataset.defaultHtml || '';
  }
}


/* =====================================================
   TOGGLES
   ===================================================== */

function initToggles() {
  const deps = [
    { check: 'cfg-logout-auto',  sel: 'cfg-inatividade'     },
    { check: 'cfg-senha-expira', sel: 'cfg-prazo-senha'     },
    { check: 'cfg-sync-auto',    sel: 'cfg-sync-intervalo'  },
    { check: 'cfg-backup-auto',  sel: 'cfg-backup-freq'     },
    { check: 'cfg-backup-auto',  sel: 'cfg-backup-retencao' },
  ];

  deps.forEach(({ check, sel }) => {
    const chk = document.getElementById(check);
    const s   = document.getElementById(sel);
    if (chk && s) {
      s.disabled = !chk.checked;
      chk.addEventListener('change', function () { s.disabled = !this.checked; });
    }
  });

  document.getElementById('cfg-densidade')?.addEventListener('change', function () {
    document.documentElement.classList.toggle('density-compact', this.checked);
  });

  document.getElementById('cfg-anim-reduzida')?.addEventListener('change', function () {
    document.documentElement.classList.toggle('reduce-motion', this.checked);
  });
}


/* =====================================================
   INTEGRAÇÃO
   ===================================================== */

function initIntegracao() {
  document.getElementById('btn-testar-api')?.addEventListener('click', testarConexaoAPI);
}

async function testarConexaoAPI() {
  const url    = document.getElementById('cfg-api-url')?.value.trim();
  const status = document.getElementById('cfg-api-status');
  const btn    = document.getElementById('btn-testar-api');

  if (!url) {
    alert('Informe a URL da API.');
    return;
  }

  // 🔥 LOADING VISUAL
  btn.disabled  = true;
  btn.innerHTML = '<i class="ph ph-circle-notch"></i> Testando...';

  if (status) {
    status.className = 'cfg-integ-status testando';
    status.innerHTML = '<i class="ph ph-circle-notch"></i><span>Testando conexão...</span>';
  }

  try {
    const resp = await fetch(url);

    if (!resp.ok) throw new Error();

    if (status) {
      status.innerHTML = '<i class="ph ph-check-circle"></i> Conectado';
      status.className = 'cfg-integ-status success';
    }

  } catch {
    if (status) {
      status.innerHTML = '<i class="ph ph-x-circle"></i> Falha na conexão';
      status.className = 'cfg-integ-status error';
    }
  }

  // 🔥 RESTAURA BOTÃO
  btn.disabled  = false;
  btn.innerHTML = '<i class="ph ph-plug"></i> Testar conexão';
}

/* =====================================================
   BACKUP
   ===================================================== */

function initBackup() {
  document.getElementById('btn-backup-agora')?.addEventListener('click', fazerBackup);
  document.getElementById('btn-backup-restaurar')?.addEventListener('click', restaurarBackup);
}

async function fazerBackup() {
  const btn = document.getElementById('btn-backup-agora');
  btn.disabled = true;

  const sb = window.getSupabase();

  const tabelas = [
    'usuarios',
    'configuracoes',
    'credenciais',
    'equipamentos',
    'acessos',
    'ocorrencias'
  ];

  const backup = {};

  for (const t of tabelas) {
    const { data } = await sb.from(t).select('*');
    backup[t] = data || [];
  }

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: 'application/json' }
  );

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `backup_${Date.now()}.json`;
  link.click();

  btn.disabled = false;

  mostrarToast('Backup gerado com sucesso', 'success');
}

function restaurarBackup() {
  const input  = document.createElement('input');
  input.type   = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    const ok = confirm(`Deseja restaurar o backup "${arquivo.name}"?\nTodos os dados atuais serão substituídos.`);
    if (!ok) return;
    await registrarAuditoria({
      acao: 'editar', modulo: 'backup',
      descricao: `Restauração de backup solicitada: ${arquivo.name}`, nivel: 'critico',
    });
    const texto = await arquivo.text();
const json = JSON.parse(texto);

const sb = window.getSupabase();

for (const [tabela, dados] of Object.entries(json)) {
  if (!dados?.length) continue;
  await sb.from(tabela).upsert(dados);
}

mostrarToast('Backup restaurado com sucesso', 'success');
  };
  input.click();
}


/* =====================================================
   AVANÇADO — ZONA DE PERIGO
   ===================================================== */

function initAvancado() {
  document.getElementById('btn-limpar-logs')?.addEventListener('click', async () => {
    const ok = confirm('Deseja realmente limpar todos os logs de auditoria?\nEsta ação não pode ser desfeita.');
    if (!ok) return;

    const supabase  = window.getSupabase();
    const { error } = await supabase
      .from('auditoria')
      .delete().gt('id', 0)

    if (error) { alert('Erro ao limpar logs: ' + error.message); return; }

    await registrarAuditoria({
      acao: 'excluir', modulo: 'auditoria', tabela: 'auditoria',
      descricao: 'Todos os logs de auditoria foram apagados', nivel: 'critico',
    });
    mostrarToast('Logs de auditoria removidos.', 'success');
  });

  document.getElementById('btn-reset-cfg')?.addEventListener('click', async () => {
    const ok = confirm('Deseja redefinir TODAS as configurações para os valores padrão?\nEsta ação não pode ser desfeita.');
    if (!ok) return;

    const supabase = window.getSupabase();
    const { error } = await supabase
  .from('configuracoes')
  .delete()
  .not('chave', 'is', null);

    await registrarAuditoria({
      acao: 'excluir', modulo: 'configuracoes', tabela: 'configuracoes',
      descricao: 'Todas as configurações foram redefinidas para o padrão', nivel: 'critico',
    });
    location.reload();
  });

  document.getElementById('btn-limpar-base')?.addEventListener('click', async () => {
    const confirmacao = prompt(
      'ATENÇÃO: Esta ação apagará permanentemente todos os dados.\n\nDigite CONFIRMAR para prosseguir:'
    );
    if (confirmacao !== 'CONFIRMAR') return;

    await registrarAuditoria({
      acao: 'excluir', modulo: 'sistema',
      descricao: 'Limpeza total da base de dados solicitada', nivel: 'critico',
    });
    alert('Solicitação registrada. Configure uma Edge Function para executar a limpeza completa.');
  });
}


/* =====================================================
   AÇÕES DO CABEÇALHO
   ===================================================== */

function initAcoesCabecalho() {
  document.getElementById('btn-cfg-salvar')?.addEventListener('click', salvarConfiguracoes);
  document.getElementById('btn-cfg-restaurar')?.addEventListener('click', () => {
    if (!confirm('Deseja restaurar todas as configurações para os valores padrão?')) return;
    location.reload();
  });
}

/* =====================================================
   CARREGAR CONFIGURAÇÕES DO SUPABASE
   ===================================================== */
async function carregarConfiguracoes() {
  const supabase = window.getSupabase();
  if (!supabase) return;

  const { data, error } = await supabase.from('configuracoes').select('chave, valor');
  if (error || !data) return;

  const cfg  = {};
  data.forEach(r => { cfg[r.chave] = r.valor; });

  const emp  = cfg['empresa']       || {};
  const reg  = cfg['regional']      || {};
  const comp = cfg['comportamento'] || {};
  const ap   = cfg['aparencia']     || {};
  const seg  = cfg['seguranca']     || {};
  const nt   = cfg['notificacoes']  || {};
  const intg = cfg['integracao']    || {};
  const bkp  = cfg['backup']        || {};

  // 🔥 1. PRIMEIRO: aplica o que já existe (fallback antigo)
  setVal('cfg-empresa-nome',     emp.nome);
  setVal('cfg-empresa-cnpj',     emp.cnpj);
  setVal('cfg-empresa-endereco', emp.endereco);
  setVal('cfg-empresa-tel',      emp.tel);

  // 🔥 2. AGORA: sobrescreve com dados REAIS do backend
  try {
 const resp = await fetch('/api/empresa');

if (!resp.ok) {
  throw new Error('Erro ao buscar empresa');
}

const empresa = await resp.json();

    if (empresa && empresa.nome) {
      setVal('cfg-empresa-nome',     empresa.nome);
      setVal('cfg-empresa-cnpj',     empresa.cnpj);
      setVal('cfg-empresa-endereco', empresa.endereco);
      setVal('cfg-empresa-tel',      empresa.tel);
    }
  } catch (e) {
    console.warn('[CRV] erro ao carregar empresa real:', e);
  }

  setVal('cfg-fuso',     reg.fuso);
  setVal('cfg-data-fmt', reg.dataFmt);
  setVal('cfg-idioma',   reg.idioma);

  setCheck('cfg-logout-auto', comp.logoutAuto !== false);
  setVal('cfg-inatividade',   comp.inatividade || '30');
  setCheck('cfg-som-alerta',  comp.somAlerta);

  if (ap.tema) { aplicarTema(ap.tema); marcarTemaAtivo(ap.tema); }
  setCheck('cfg-sidebar-collapsed', ap.sidebarCollapsed);
  setCheck('cfg-anim-reduzida',     ap.animReduzida);
  setCheck('cfg-densidade',         ap.densidade);
  if (ap.logoUrl) { exibirLogoPreview(ap.logoUrl); aplicarLogoHeader(ap.logoUrl); }

  setCheck('cfg-senha-forte',  seg.senhaForte  !== false);
  setCheck('cfg-senha-expira', seg.senhaExpira !== false);
  setVal('cfg-prazo-senha',    seg.prazoSenha  || '60');
  setCheck('cfg-2fa',          seg.twofa);
  setVal('cfg-tentativas',     seg.tentativas  || '5');

  setVal('cfg-email-notif',       nt.email);
  setVal('cfg-email-cc',          nt.cc);
  setCheck('cfg-notif-negado',    nt.negado    !== false);
  setCheck('cfg-notif-critico',   nt.critico   !== false);
  setCheck('cfg-notif-offline',   nt.offline   !== false);
  setCheck('cfg-notif-relatorio', nt.relatorio);

  setVal('cfg-api-url',        intg.apiUrl);
  setVal('cfg-api-porta',      intg.apiPorta);
  setVal('cfg-api-usuario',    intg.apiUsuario);
  setVal('cfg-api-senha',      intg.apiSenha);
  setCheck('cfg-sync-auto',    intg.syncAuto !== false);
  setVal('cfg-sync-intervalo', intg.syncIntervalo || '5');

  setCheck('cfg-backup-auto',   bkp.auto !== false);
  setVal('cfg-backup-freq',     bkp.freq     || 'diario');
  setVal('cfg-backup-retencao', bkp.retencao || '30');
  if (bkp.ultimoBackup) {
    const el  = document.getElementById('cfg-backup-ultimo');
    const elA = document.getElementById('cfg-ultimo-backup');
    if (el)  el.innerHTML    = `<i class="ph ph-check-circle" style="color:var(--success);"></i> Último backup: ${bkp.ultimoBackup}`;
    if (elA) elA.textContent = bkp.ultimoBackup;
  }
}

/* =====================================================
   SALVAR CONFIGURAÇÕES NO SUPABASE
   ===================================================== */

async function salvarConfiguracoes() {
  const btn     = document.getElementById('btn-cfg-salvar');
  btn.disabled  = true;
  btn.innerHTML = '<i class="ph ph-circle-notch"></i> Salvando...';

  // 🔥 NOVO — salvar empresa no backend real
try {
  const resp = await fetch('/api/atualizar-empresa', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nome: getVal('cfg-empresa-nome'),
      cnpj: limparNumero(getVal('cfg-empresa-cnpj')),
      endereco: getVal('cfg-empresa-endereco'),
      tel: limparNumero(getVal('cfg-empresa-tel')),
    })
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.erro || 'Erro ao salvar empresa');
  }

} catch (e) {
  console.error('[CRV] erro empresa:', e.message);
  mostrarToast('Erro ao salvar empresa', 'error');

  btn.disabled  = false;
  btn.innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar alterações';

  return; // 🚨 PARA aqui se empresa falhar
}

  const temaSel = document.querySelector('.cfg-tema-item.active')?.dataset.tema || 'dark';
  const apAtual = (await lerChave('aparencia')) || {};

  const grupos = {

    regional: {
      fuso:    getVal('cfg-fuso'),
      dataFmt: getVal('cfg-data-fmt'),
      idioma:  getVal('cfg-idioma'),
    },
    comportamento: {
      logoutAuto:  getCheck('cfg-logout-auto'),
      inatividade: getVal('cfg-inatividade'),
      somAlerta:   getCheck('cfg-som-alerta'),
    },
    aparencia: {
      ...apAtual,
      tema:             temaSel,
      sidebarCollapsed: getCheck('cfg-sidebar-collapsed'),
      animReduzida:     getCheck('cfg-anim-reduzida'),
      densidade:        getCheck('cfg-densidade'),
    },
    seguranca: {
      senhaForte:  getCheck('cfg-senha-forte'),
      senhaExpira: getCheck('cfg-senha-expira'),
      prazoSenha:  getVal('cfg-prazo-senha'),
      twofa:       getCheck('cfg-2fa'),
      tentativas:  getVal('cfg-tentativas'),
    },
    notificacoes: {
      email:     getVal('cfg-email-notif'),
      cc:        getVal('cfg-email-cc'),
      negado:    getCheck('cfg-notif-negado'),
      critico:   getCheck('cfg-notif-critico'),
      offline:   getCheck('cfg-notif-offline'),
      relatorio: getCheck('cfg-notif-relatorio'),
    },
integracao: {
  apiUrl: getVal('cfg-api-url'),
  apiPorta: getVal('cfg-api-porta'),
  apiUsuario: getVal('cfg-api-usuario'),
  apiSenha: getVal('cfg-api-senha'), // 🔥 NOVO
  syncAuto: getCheck('cfg-sync-auto'),
  syncIntervalo: getVal('cfg-sync-intervalo'),
},
    backup: {
      auto:     getCheck('cfg-backup-auto'),
      freq:     getVal('cfg-backup-freq'),
      retencao: getVal('cfg-backup-retencao'),
    },
  };

  let sucesso = true;
  for (const [chave, valor] of Object.entries(grupos)) {
    const ok = await salvarChave(chave, valor);
    if (!ok) { sucesso = false; break; }
  }

  btn.disabled  = false;
  btn.innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar alterações';

  if (sucesso) {
    aplicarTema(temaSel);
    await registrarAuditoria({
      acao: 'editar', modulo: 'configuracoes', tabela: 'configuracoes',
      descricao: 'Configurações do sistema atualizadas', nivel: 'info',
    });
    mostrarToast('Configurações salvas com sucesso!', 'success');
  } else {
    mostrarToast('Erro ao salvar configurações.', 'error');
  }
}



/* =====================================================
   MODAL OPERADOR — CRIAR / EDITAR
   ===================================================== */

function setBtnOperadorLoading(loading) {
  const btn = document.getElementById('btn-operador-salvar');
  if (!btn) return;
  btn.disabled  = loading;
  btn.innerHTML = loading
    ? '<i class="ph ph-circle-notch"></i> Salvando...'
    : '<i class="ph ph-floppy-disk"></i> Salvar operador';
}

function initModalOperador() {
  const overlay   = document.getElementById('modal-operador');
  const btnNovo   = document.getElementById('btn-novo-operador');
  const btnFechar = document.getElementById('modal-operador-fechar');
  const btnCanc   = document.getElementById('btn-operador-cancelar');
  const btnSalvar = document.getElementById('btn-operador-salvar');

  if (!overlay) {
    console.error('[CRV] #modal-operador não encontrado no HTML.');
    return;
  }
  if (!btnNovo) {
    console.error('[CRV] #btn-novo-operador não encontrado no HTML.');
    return;
  }

  const abrir = (operador = null) => {
    const fldId      = document.getElementById('operador-id');
    const fldNome    = document.getElementById('operador-nome');
    const fldEmail   = document.getElementById('operador-email');
    const fldPerfil  = document.getElementById('operador-perfil');
    const fldSenha   = document.getElementById('operador-senha');
    const senhaGrupo = document.getElementById('operador-senha-grupo');
    const titulo     = document.getElementById('modal-operador-titulo');
    const erroBox    = document.getElementById('modal-operador-erro');

    if (!fldId || !fldNome || !fldEmail || !fldPerfil || !fldSenha) {
      console.error('[CRV] Campos do modal não encontrados. Verifique os IDs no HTML.');
      return;
    }

    fldId.value     = operador?.id     || '';
    fldNome.value   = operador?.nome   || '';
    fldEmail.value  = operador?.email  || '';
    fldSenha.value  = '';

    // Garante que o valor do perfil existe no <select> antes de atribuir
    const perfilValido = ['admin', 'gerente', 'operador', 'portaria'];
    fldPerfil.value = perfilValido.includes(operador?.perfil)
      ? operador.perfil
      : 'operador';

    if (erroBox) erroBox.style.display = 'none';

    // E-mail bloqueado ao editar
    fldEmail.disabled = !!operador;

    // Senha oculta ao editar
    if (senhaGrupo) senhaGrupo.style.display = operador ? 'none' : '';

    if (titulo) {
      titulo.innerHTML = operador
        ? '<i class="ph ph-pencil-simple"></i> Editar operador'
        : '<i class="ph ph-user-plus"></i> Novo operador';
    }

    overlay.classList.remove('cfg-hidden');
    document.body.style.overflow = 'hidden';
  };

  const fechar = () => {
    overlay.classList.add('cfg-hidden');
    document.body.style.overflow = '';
    const fldEmail = document.getElementById('operador-email');
    if (fldEmail) fldEmail.disabled = false;
  };

  btnNovo.addEventListener('click',    () => abrir());
  btnFechar?.addEventListener('click', fechar);
  btnCanc?.addEventListener('click',   fechar);
  overlay.addEventListener('click',    e => { if (e.target === overlay) fechar(); });

  btnSalvar?.addEventListener('click', async () => {
    const id     = document.getElementById('operador-id').value.trim();
    const nome   = document.getElementById('operador-nome').value.trim();
    const email  = document.getElementById('operador-email').value.trim();
    const perfil = document.getElementById('operador-perfil').value;
    const senha  = document.getElementById('operador-senha').value;
    const erroBox = document.getElementById('modal-operador-erro');

    const mostrarErroModal = (msg) => {
      if (!erroBox) return;
      erroBox.textContent   = msg;
      erroBox.style.display = 'block';
    };

    if (!nome || !email) { mostrarErroModal('Nome e e-mail são obrigatórios.'); return; }
    if (!email.includes('@')) { mostrarErroModal('Informe um e-mail válido.'); return; }
    if (!id && senha.length < 8) { mostrarErroModal('A senha deve ter no mínimo 8 caracteres.'); return; }

    setBtnOperadorLoading(true);
    if (erroBox) erroBox.style.display = 'none';

    try {
      if (id) {
        // ── EDITAR via backend (service_role atualiza metadados no Auth também)
const resp = await fetch('/api/editar-usuario', {
  method:  'POST',
  headers: { 'Content-Type': 'application/json' },
  body:    JSON.stringify({ id, nome, perfil }),
});

let resultado;
try {
  resultado = await resp.json();
} catch {
  throw new Error('Resposta inválida do servidor');
}

if (!resp.ok) {
  throw new Error(resultado.erro || 'Erro ao atualizar operador.');
}

      } else {
        // ── CRIAR via backend
const resp = await fetch('/api/criar-usuario', {
  method:  'POST',
  headers: { 'Content-Type': 'application/json' },
  body:    JSON.stringify({ nome, email, senha, perfil }),
});

let resultado;
try {
  resultado = await resp.json();
} catch {
  throw new Error('Resposta inválida do servidor');
}

if (!resp.ok) {
  throw new Error(resultado.erro || 'Erro ao criar usuário.');
}
      }

      await registrarAuditoria({
        acao:      id ? 'editar' : 'criar',
        modulo:    'usuarios',
        tabela:    'usuarios',
        descricao: `${id ? 'Operador editado' : 'Novo operador cadastrado'}: ${nome} (${email}) — perfil: ${perfil}`,
        nivel:     'aviso',
      });

      fechar();
      carregarOperadores();
      mostrarToast(id ? 'Operador atualizado!' : 'Operador cadastrado com sucesso!', 'success');

    } catch (err) {
      console.error('[CRV] Erro ao salvar operador:', err.message);
      mostrarErroModal(err.message);
    } finally {
      setBtnOperadorLoading(false);
    }
  });

  window._abrirModalOperador = abrir;
}


/* =====================================================
   OPERADORES — LISTAR
   ===================================================== */

async function carregarOperadores() {
  const supabase = window.getSupabase();
  if (!supabase) return;

  const tbody = document.getElementById('cfg-usuarios-tbody');
  const empty = document.getElementById('cfg-usuarios-empty');
  const wrap  = document.getElementById('cfg-usuarios-table-wrap');

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome, email, perfil, ativo, ultimo_login')
    .order('created_at', { ascending: false });

  if (error) {
  console.error(error);
  mostrarToast('Erro ao carregar operadores', 'error');
  return;
}

if (!data.length) {
  empty?.classList.remove('cfg-hidden');
  wrap?.classList.add('cfg-hidden');
  return;
}

  empty?.classList.add('cfg-hidden');
  wrap?.classList.remove('cfg-hidden');
  tbody.innerHTML = '';
  data.forEach(op => renderLinhaOperador(op));
}

function renderLinhaOperador(op) {
  const tbody = document.getElementById('cfg-usuarios-tbody');
  if (!tbody) return;

  // ── FIX: inclui gerente e portaria que estavam faltando
  const perfilLabel = {
    admin:       'Administrador',
    gerente:     'Gerente',
    operador:    'Operador',
    portaria:    'Portaria',
    visualizador:'Visualizador',
  };
  const perfilBadge = {
    admin:    'badge-danger',
    gerente:  'badge-info',
    operador: 'badge-warning',
    portaria: 'badge-neutral',
  };

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <div style="display:flex;align-items:center;gap:.6rem;">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--primary);
          display:flex;align-items:center;justify-content:center;
          font-size:.72rem;font-weight:700;color:#fff;flex-shrink:0;">
          ${iniciais(op.nome)}
        </div>
        <span>${op.nome || '—'}</span>
      </div>
    </td>
    <td class="text-sm text-muted">${op.email || '—'}</td>
    <td>
      <span class="badge ${perfilBadge[op.perfil] || 'badge-neutral'}">
        ${perfilLabel[op.perfil] || op.perfil || '—'}
      </span>
    </td>
    <td class="text-sm text-muted">
      ${op.ultimo_login ? new Date(op.ultimo_login).toLocaleString('pt-BR') : 'Nunca'}
    </td>
    <td>
      <span class="badge ${op.ativo ? 'badge-success' : 'badge-neutral'}">
        ${op.ativo ? 'Ativo' : 'Inativo'}
      </span>
    </td>
    <td>
      <div style="display:flex;gap:.35rem;">
        <button class="btn btn-ghost btn-sm" title="Editar"
          data-op='${encodeURIComponent(JSON.stringify(op))}'
onclick="window._abrirModalOperador(JSON.parse(decodeURIComponent(this.dataset.op)))">
          <i class="ph ph-pencil-simple"></i>
        </button>
        <button class="btn btn-ghost btn-sm" title="${op.ativo ? 'Desativar' : 'Ativar'}"
          onclick="alternarOperador('${op.id}', ${!op.ativo})">
          <i class="ph ph-${op.ativo ? 'prohibit' : 'check-circle'}"></i>
        </button>
      </div>
    </td>
  `;
  tbody.appendChild(tr);
}

window.alternarOperador = async function (id, novoStatus) {
  const rota = novoStatus ? '/api/reativar-usuario' : '/api/desativar-usuario';
const resp = await fetch(rota, {
  method:  'POST',
  headers: { 'Content-Type': 'application/json' },
  body:    JSON.stringify({ id }),
});

let err;
try {
  err = await resp.json();
} catch {
  mostrarToast('Erro de comunicação com servidor', 'error');
  return;
}

if (!resp.ok) {
  mostrarToast('Erro: ' + (err.erro || 'Falha na operação'), 'error');
  return;
}

  await registrarAuditoria({
    acao:      'editar',
    modulo:    'usuarios',
    tabela:    'usuarios',
    descricao: `Operador ${novoStatus ? 'reativado' : 'desativado'} (id: ${id})`,
    nivel:     'aviso',
  });

  carregarOperadores();
  mostrarToast(novoStatus ? 'Operador reativado!' : 'Operador desativado!', 'success');
};


/* =====================================================
   HELPERS SUPABASE
   ===================================================== */

async function lerChave(chave) {
  const supabase  = window.getSupabase();
  const { data }  = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', chave)
    .maybeSingle();
  return data?.valor ?? null;
}

async function salvarChave(chave, valor) {
  const supabase  = window.getSupabase();
  const { error } = await supabase
    .from('configuracoes')
    .upsert({ chave, valor, updated_at: new Date().toISOString() }, { onConflict: 'chave' });
  return !error;
}


/* =====================================================
   TOAST
   ===================================================== */

function mostrarToast(msg, tipo = 'success') {
  const cores  = { success: 'var(--success)', error: 'var(--danger)', info: 'var(--primary)' };
  const icones = { success: 'ph-check-circle', error: 'ph-x-circle', info: 'ph-info' };

  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;
    background:var(--surface);border:1px solid var(--border);
    border-left:3px solid ${cores[tipo]};
    border-radius:var(--radius-md,8px);
    padding:.75rem 1.25rem;
    display:flex;align-items:center;gap:.6rem;
    box-shadow:var(--shadow-md);
    font-size:.875rem;color:var(--text-primary);
    animation:slideInToast .25s ease;
  `;
  toast.innerHTML = `<i class="ph ${icones[tipo]}" style="color:${cores[tipo]};font-size:1.1rem;"></i>${msg}`;

  if (!document.getElementById('toast-style')) {
    const s = document.createElement('style');
    s.id = 'toast-style';
    s.textContent = `@keyframes slideInToast{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`;
    document.head.appendChild(s);
  }

  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; }, 2800);
  setTimeout(() => toast.remove(), 3200);
}


/* =====================================================
   UTILITÁRIOS
   ===================================================== */

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null) el.value = val;
}

function getVal(id) {
  return document.getElementById(id)?.value ?? '';
}

function setCheck(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = !!val;
}

function getCheck(id) {
  return document.getElementById(id)?.checked ?? false;
}

function iniciais(nome) {
  if (!nome) return '?';
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

/* =====================================================
   MÁSCARAS (CNPJ / TELEFONE)
   ===================================================== */

function initMascaras() {
  const cnpjInput = document.getElementById('cfg-empresa-cnpj');
  const telInput  = document.getElementById('cfg-empresa-tel');

  if (cnpjInput) {
    cnpjInput.addEventListener('input', function () {
      this.value = formatarCNPJ(this.value);
    });
  }

  if (telInput) {
    telInput.addEventListener('input', function () {
      this.value = formatarTelefone(this.value);
    });
  }
}


/* ================= CNPJ ================= */

function formatarCNPJ(valor) {
  valor = valor.replace(/\D/g, '');

  if (valor.length > 14) valor = valor.slice(0, 14);

  valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
  valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2');
  valor = valor.replace(/(\d{4})(\d)/, '$1-$2');

  return valor;
}


/* ================= TELEFONE ================= */

function formatarTelefone(valor) {
  valor = valor.replace(/\D/g, '');

  if (valor.length > 11) valor = valor.slice(0, 11);

  if (valor.length <= 10) {
    // (00) 0000-0000
    valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
    valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    // (00) 00000-0000
    valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
    valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
  }

  return valor;
}

function limparNumero(valor) {
  return (valor || '').replace(/\D/g, '');
}